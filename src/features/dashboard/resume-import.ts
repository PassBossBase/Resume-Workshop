"use client";

import { ZodError } from "zod";
import {
  normalizeRichText,
  richTextToPlainText,
} from "@/features/rich-text/rich-text";
import { extractEmbeddedResumeFromPdfText } from "@/features/pdf-export/pdf-import-payload";
import {
  DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
  parseAndMigrateResume,
  resumeDocumentSchema,
  type CustomResumeModule,
  type FixedResumeModule,
  type ResumeDocument,
  type ResumeEntry,
  type ResumeModule,
} from "@/features/resume-model/resume-model";

export const IMPORT_PDF_MAX_BYTES = 10 * 1024 * 1024;

export type ImportedResumeEntry = {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ImportedResumeDraft = {
  basics: {
    name: string;
    role: string;
    status: string;
    birthday: string;
    email: string;
    phone: string;
    location: string;
  };
  skills: string[];
  work: ImportedResumeEntry[];
  projects: ImportedResumeEntry[];
  education: ImportedResumeEntry[];
  supplemental: string[];
  rawText: string;
  recognitionMarkdown: string;
  recognitionOutline: ImportedRecognitionSection[];
  warnings: string[];
  source: "embedded" | "text" | "json";
  embeddedResume?: ResumeDocument;
};

export type ImportedRecognitionSection = {
  key: SectionRangeKey;
  title: string;
  lineCount: number;
  preview: string;
};

type ExtractedPdfText = {
  pageCount: number;
  text: string;
  legacyText: string;
  visualLines: ExtractedPdfLine[];
  unreadableGlyphCount: number;
};

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
};

type VisualPdfLine = {
  text: string;
  x: number;
  y: number;
  height: number;
  fontNames: string[];
};

type VisualPdfSegment = {
  text: string;
  x: number;
  y: number;
  height: number;
  width: number;
  fontName: string;
};

type VisualPdfRow = {
  y: number;
  height: number;
  segments: VisualPdfSegment[];
};

type ExtractedPdfLine = VisualPdfLine & {
  pageNumber: number;
};

type HeadingStyleProfile = {
  height: number;
  fontNames: Set<string>;
};

let pdfWorkerConfigured = false;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url,
    ).toString();
    pdfWorkerConfigured = true;
  }
  return pdfjs;
}

export async function extractImportedResumeFromPdf(
  file: File,
): Promise<ImportedResumeDraft> {
  if (file.size > IMPORT_PDF_MAX_BYTES) {
    throw new Error("PDF 文件过大，请选择 10MB 以内的文件。");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("请上传 PDF 格式的简历文件。");
  }

  const extracted = await extractPdfText(file);
  const embeddedResume =
    extractEmbeddedResumeFromPdfText(extracted.legacyText) ??
    extractEmbeddedResumeFromPdfText(extracted.text);
  if (embeddedResume) {
    return buildDraftFromEmbeddedResume(embeddedResume, extracted.text);
  }

  const draft = parseResumeText(extracted.text, file.name, extracted.visualLines);
  const warnings = [...draft.warnings];

  if (extracted.pageCount > 5) {
    warnings.push("PDF 页数较多，建议导入后重点检查内容顺序。");
  }
  if (draft.rawText.length < 80) {
    warnings.push("提取到的文本偏少，扫描件或图片型 PDF 可能无法完整识别。");
  }
  if (extracted.unreadableGlyphCount > 0) {
    warnings.push(
      "PDF 文本层存在无法识别的字形，日期、邮箱或编号可能需要导入后手动核对。",
    );
  }

  return { ...draft, warnings };
}

// ──────────────────────────────────────
// JSON 文件导入
// ──────────────────────────────────────

function isJsonFile(file: File): boolean {
  if (file.type === "application/json") return true;
  return file.name.toLowerCase().endsWith(".json");
}

function formatZodError(error: ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "根";
    return `  • ${path}: ${issue.message}`;
  });
  return `文件内容不符合简历数据格式：\n${lines.join("\n")}`;
}

export async function extractImportedResumeFromJson(
  file: File,
): Promise<ImportedResumeDraft> {
  if (!isJsonFile(file)) {
    throw new Error("请上传 JSON 格式的简历文件。");
  }

  const text = await file.text();
  if (!text.trim()) {
    throw new Error("JSON 文件内容为空，请检查文件。");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const detail =
      err instanceof SyntaxError ? err.message : String(err);
    throw new Error(`JSON 文件格式错误，无法解析：${detail}`);
  }

  let resume: ResumeDocument;
  try {
    resume = parseAndMigrateResume(parsed);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new Error(formatZodError(err));
    }
    // 尝试用 v3 schema 单独校验以获取详细错误
    const v3Result = resumeDocumentSchema.safeParse(parsed);
    if (!v3Result.success) {
      throw new Error(formatZodError(v3Result.error));
    }
    throw new Error(
      `数据校验失败：${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const draft = buildDraftFromEmbeddedResume(resume, text);
  return {
    ...draft,
    source: "json" as const,
    recognitionMarkdown: draft.recognitionMarkdown.replace(
      "# PDF 识别原文",
      "# JSON 导入数据",
    ),
  };
}

async function extractPdfText(file: File): Promise<ExtractedPdfText> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const documentTask = pdfjs.getDocument({ data });
  const document = await documentTask.promise;
  const pages: string[] = [];
  const legacyPages: string[] = [];
  const visualLines: ExtractedPdfLine[] = [];
  let unreadableGlyphCount = 0;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items as PdfTextItem[];
    unreadableGlyphCount += items.reduce((count, item) => {
      return count + (item.str?.match(/\u0000/g)?.length ?? 0);
    }, 0);
    const pageLines = reconstructVisualPdfLines(items);
    legacyPages.push(cleanText(buildLegacyPdfText(items)));
    pages.push(cleanText(pageLines.map((line) => line.text).join("\n")));
    visualLines.push(
      ...pageLines.map((line) => ({
        ...line,
        text: cleanText(line.text),
        pageNumber,
      })),
    );
  }

  const text = cleanText(pages.join("\n"));
  const legacyText = cleanText(legacyPages.join("\n"));
  if (!text.trim()) {
    throw new Error("没有从 PDF 中读取到文本，暂不支持扫描件或纯图片简历。");
  }

  return {
    pageCount: document.numPages,
    text,
    legacyText,
    visualLines: visualLines.filter((line) => line.text),
    unreadableGlyphCount,
  };
}

function buildLegacyPdfText(items: PdfTextItem[]): string {
  const pageParts: string[] = [];

  for (const item of items) {
    if (!item.str) continue;
    pageParts.push(item.str);
    if (item.hasEOL) pageParts.push("\n");
  }

  return pageParts.join(" ");
}

function reconstructVisualPdfLines(items: PdfTextItem[]): VisualPdfLine[] {
  const rows: VisualPdfRow[] = [];

  for (const item of items) {
    const text = item.str?.trim();
    if (!text) continue;

    const transform = item.transform ?? [];
    const x = transform[4] ?? 0;
    const y = transform[5] ?? 0;
    const height = Math.abs(transform[3] ?? item.height ?? 0) || item.height || 10;
    const width = item.width ?? 0;
    const row = findVisualRow(rows, y, height);
    const segment: VisualPdfSegment = {
      text,
      x,
      y,
      height,
      width,
      fontName: item.fontName ?? "",
    };

    if (!row) {
      rows.push({ y, height, segments: [segment] });
      continue;
    }

    row.segments.push(segment);
    row.height = Math.max(row.height, height);
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => {
      const segments = row.segments;
      segments.sort((a, b) => a.x - b.x);

      let text = "";
      let previous: VisualPdfSegment | undefined;
      for (const segment of segments) {
        if (previous) {
          const gap = segment.x - (previous.x + previous.width);
          if (gap > Math.max(3, previous.height * 0.35)) text += " ";
        }
        text += segment.text;
        previous = segment;
      }

      return {
        text: text.trim(),
        x: segments[0]?.x ?? 0,
        y: row.y,
        height: row.height,
        fontNames: Array.from(
          new Set(segments.map((segment) => segment.fontName).filter(Boolean)),
        ),
      };
    })
    .filter((line) => line.text);
}

function findVisualRow(
  rows: VisualPdfRow[],
  y: number,
  height: number,
): VisualPdfRow | undefined {
  const tolerance = Math.max(2, height * 0.45);
  return rows.find((row) => Math.abs(row.y - y) <= tolerance);
}

function parseResumeText(
  text: string,
  sourceName = "",
  visualLines: ExtractedPdfLine[] = [],
): ImportedResumeDraft {
  const normalizedText = cleanText(text);
  const normalizedVisualLines = normalizeExtractedPdfLines(visualLines);
  const lines = normalizedVisualLines.length
    ? normalizedVisualLines.map((line) => line.text)
    : toLines(normalizedText);
  const splitResult = splitSections(lines, normalizedVisualLines);
  const sections = fillMissingSections(
    splitResult.sections,
    lines,
    splitResult.explicitKeys,
  );
  const introText = [
    ...sections.intro,
    ...lines.slice(0, Math.min(lines.length, 12)),
  ].join("\n");

  const basics = parseBasics(introText, lines, sourceName);
  const skills = parseSkills(sections.skills);
  const work = parseEntries(sections.work, "工作经历");
  const projects = parseEntries(sections.projects, "项目经历");
  const education = parseEntries(sections.education, "教育经历");
  const supplemental = parseSupplemental(sections.custom);
  const recognitionRanges = buildRecognitionRanges(splitResult.ranges, sections);
  const warnings: string[] = [];

  addInferredSectionWarnings(warnings, splitResult.explicitKeys, sections);
  if (!basics.name) warnings.push("没有稳定识别到姓名，已留空。");
  if (!basics.phone && !basics.email) {
    warnings.push("没有识别到电话或邮箱，请导入后手动补充联系方式。");
  }
  if (!work.length && !projects.length && !education.length && !skills.length) {
    warnings.push("没有识别到标准模块标题，已尽量保留原文供你手动整理。");
  }

  return {
    basics,
    skills,
    work,
    projects,
    education,
    supplemental,
    rawText: normalizedText,
    recognitionMarkdown: buildRecognitionMarkdown(recognitionRanges),
    recognitionOutline: buildRecognitionOutline(recognitionRanges),
    warnings,
    source: "text",
  };
}

function normalizeExtractedPdfLines(lines: ExtractedPdfLine[]): ExtractedPdfLine[] {
  return lines
    .map((line) => ({
      ...line,
      text: normalizePdfLineText(line.text),
    }))
    .filter((line) => line.text);
}

function addInferredSectionWarnings(
  warnings: string[],
  explicitKeys: Set<SectionKey>,
  sections: ParsedSections,
): void {
  const inferred: Array<[SectionKey, string]> = [
    ["skills", "技能"],
    ["work", "工作经历"],
    ["projects", "项目经历"],
    ["education", "教育经历"],
  ];

  for (const [key, label] of inferred) {
    if (!explicitKeys.has(key) && sections[key].length > 0) {
      warnings.push(`未识别到独立的${label}标题，已根据内容特征尝试归类。`);
    }
  }
}

function buildRecognitionRanges(
  ranges: SectionRange[],
  sections: ParsedSections,
): SectionRange[] {
  const result = ranges
    .map((range) => ({
      ...range,
      lines: range.lines.filter(Boolean),
    }))
    .filter((range) => range.lines.length > 0 || range.key === "intro");
  const represented = new Set(result.map((range) => range.key));
  const orderedKeys: SectionKey[] = [
    "skills",
    "work",
    "projects",
    "education",
    "custom",
  ];

  for (const key of orderedKeys) {
    if (represented.has(key) || sections[key].length === 0) continue;
    result.push({
      key,
      title: getSectionRangeTitle(key),
      lines: sections[key],
      explicit: false,
    });
  }

  return result.filter((range) => range.lines.length > 0);
}

function buildRecognitionMarkdown(ranges: SectionRange[]): string {
  if (ranges.length === 0) return "";

  const blocks = ranges.map((range, index) => {
    const marker = range.explicit ? "" : "（推断）";
    return [
      `## ${index + 1}. ${range.title}${marker}`,
      "",
      "```text",
      range.lines.join("\n"),
      "```",
    ].join("\n");
  });

  return ["# PDF 识别原文", "", ...blocks].join("\n\n");
}

function buildRecognitionOutline(
  ranges: SectionRange[],
): ImportedRecognitionSection[] {
  return ranges.map((range) => ({
    key: range.key,
    title: range.explicit ? range.title : `${range.title}（推断）`,
    lineCount: range.lines.length,
    preview: range.lines.slice(0, 2).join(" / ").slice(0, 120),
  }));
}

function getSectionRangeTitle(key: SectionRangeKey): string {
  const titles: Record<SectionRangeKey, string> = {
    intro: "基本信息",
    skills: "专业技能",
    work: "工作经历",
    projects: "项目经历",
    education: "教育经历",
    custom: "补充内容",
  };
  return titles[key];
}

function normalizeSectionTitle(title: string): string {
  const normalized = repairCjkSpacing(title).replace(/\s+/g, "");
  return normalized || title;
}

type SectionKey = "skills" | "work" | "projects" | "education" | "custom";

type ParsedSections = Record<SectionKey | "intro", string[]>;

type SectionRangeKey = SectionKey | "intro";

type SectionRange = {
  key: SectionRangeKey;
  title: string;
  lines: string[];
  explicit: boolean;
};

type SectionSplitResult = {
  sections: ParsedSections;
  explicitKeys: Set<SectionKey>;
  ranges: SectionRange[];
};

const sectionAliases: Array<[SectionKey, string[]]> = [
  [
    "skills",
    [
      "专业技能",
      "技能特长",
      "个人技能",
      "技能清单",
      "技术栈",
      "技术能力",
      "核心能力",
      "核心技能",
      "专业能力",
      "职业技能",
      "IT技能",
      "计算机技能",
      "软件技能",
      "技能优势",
      "能力标签",
      "技能",
      "Skills",
      "Technical Skills",
    ],
  ],
  [
    "work",
    [
      "工作经历",
      "工作经验",
      "实习经历",
      "实习经验",
      "任职经历",
      "职业经历",
      "工作履历",
      "职业背景",
      "相关经历",
      "社会经历",
      "工作/实习经历",
      "工作与实习经历",
    ],
  ],
  [
    "projects",
    [
      "项目经历",
      "项目经验",
      "项目实践",
      "项目履历",
      "项目案例",
      "代表项目",
      "个人项目",
      "开发项目",
      "作品项目",
      "项目",
    ],
  ],
  [
    "education",
    ["教育经历", "教育背景", "学习经历", "教育培训", "培训经历", "学历背景", "学历", "教育"],
  ],
  [
    "custom",
    [
      "自我评价",
      "个人评价",
      "个人优势",
      "个人总结",
      "荣誉证书",
      "证书奖项",
      "证书",
      "获奖经历",
      "荣誉奖励",
      "语言能力",
      "兴趣爱好",
      "校园经历",
      "其他信息",
      "其他经历",
    ],
  ],
];

const embeddedSectionAliases = sectionAliases
  .filter(([key]) => key !== "skills" && key !== "custom")
  .map(([key, aliases]) => [
    key,
    aliases.filter((alias) => alias.length > 2),
  ] as [SectionKey, string[]]);

function splitSections(
  lines: string[],
  visualLines: ExtractedPdfLine[] = [],
): SectionSplitResult {
  const sections: ParsedSections = {
    intro: [],
    skills: [],
    work: [],
    projects: [],
    education: [],
    custom: [],
  };
  const headingStyle = buildHeadingStyleProfile(visualLines);
  const explicitSectionKeys = collectExplicitSectionKeys(
    lines,
    visualLines,
    headingStyle,
  );
  const hasExplicitHeadings = explicitSectionKeys.size > 0;
  let current: keyof ParsedSections = "intro";
  const ranges: SectionRange[] = [
    {
      key: "intro",
      title: getSectionRangeTitle("intro"),
      lines: [],
      explicit: true,
    },
  ];
  let currentRange = ranges[0];
  const switchSection = (
    key: SectionKey,
    title: string,
    explicit: boolean,
  ) => {
    current = key;
    currentRange = {
      key,
      title: title || getSectionRangeTitle(key),
      lines: [],
      explicit,
    };
    ranges.push(currentRange);
  };
  const pushLine = (line: string) => {
    sections[current].push(line);
    currentRange.lines.push(line);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const visualLine = visualLines[index];
    const heading = getVisualSectionHeading(line, visualLine, headingStyle);
    if (heading) {
      switchSection(heading.key, heading.title, true);
      if (heading.rest) pushLine(heading.rest);
      continue;
    }

    const embeddedHeading = getVisualEmbeddedSectionHeading(
      line,
      visualLine,
      headingStyle,
    );
    if (embeddedHeading) {
      if (embeddedHeading.before) pushLine(embeddedHeading.before);
      switchSection(embeddedHeading.key, embeddedHeading.title, true);
      if (embeddedHeading.rest) pushLine(embeddedHeading.rest);
      continue;
    }

    if (!hasExplicitHeadings) {
      const inferred = getInferredSectionBoundary(
        line,
        lines[index + 1],
        current,
        explicitSectionKeys,
      );
      if (inferred) {
        switchSection(inferred, getSectionRangeTitle(inferred), false);
      }
    }

    pushLine(line);
  }

  return {
    sections,
    explicitKeys: explicitSectionKeys,
    ranges,
  };
}

function collectExplicitSectionKeys(
  lines: string[],
  visualLines: ExtractedPdfLine[],
  headingStyle: HeadingStyleProfile | null,
): Set<SectionKey> {
  const keys = new Set<SectionKey>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const visualLine = visualLines[index];
    const heading = getVisualSectionHeading(line, visualLine, headingStyle);
    if (heading) {
      keys.add(heading.key);
      continue;
    }

    const embeddedHeading = getVisualEmbeddedSectionHeading(
      line,
      visualLine,
      headingStyle,
    );
    if (embeddedHeading) keys.add(embeddedHeading.key);
  }

  return keys;
}

function getSectionKey(line: string): SectionKey | null {
  return getSectionHeading(line)?.key ?? null;
}

function getSectionHeading(
  line: string,
): { key: SectionKey; title: string; rest: string } | null {
  const normalized = normalizeHeadingCandidate(line);

  for (const [key, aliases] of sectionAliases) {
    for (const alias of aliases) {
      const match = normalized.match(buildHeadingRegexp(alias));
      if (match) {
        return {
          key,
          title: normalizeSectionTitle(alias),
          rest: cleanHeadingRest(match[1] ?? ""),
        };
      }
    }
  }

  return null;
}

function getEmbeddedSectionHeading(
  line: string,
): { before: string; key: SectionKey; title: string; rest: string } | null {
  const normalized = normalizeHeadingCandidate(line);

  for (const [key, aliases] of embeddedSectionAliases) {
    for (const alias of aliases) {
      const pattern = buildLooseHeadingPattern(alias);
      const regexp = new RegExp(
        `(^|\\s|[，,。；;])(${pattern})(?:\\s*(?:[:：|｜/\\\\\\-—–]+|\\s+)\\s*)`,
        "i",
      );
      const match = normalized.match(regexp);
      if (!match || match.index === undefined) continue;

      const before = normalized.slice(0, match.index).trim();
      const rest = normalized.slice(match.index + match[0].length).trim();
      if (!rest && before) continue;

      return {
        before: cleanHeadingRest(before),
        key,
        title: normalizeSectionTitle(alias),
        rest: cleanHeadingRest(rest),
      };
    }
  }

  return null;
}

function buildHeadingRegexp(alias: string): RegExp {
  const pattern = buildLooseHeadingPattern(alias);
  return new RegExp(`^${pattern}(?:\\s*(?:[:：|｜/\\\\\\-—–]+|\\s+)\\s*(.*))?$`, "i");
}

function buildLooseHeadingPattern(alias: string): string {
  return Array.from(alias)
    .map((char) => (/\s/.test(char) ? "\\s+" : `${escapeRegexp(char)}\\s*`))
    .join("");
}

function normalizeHeadingCandidate(line: string): string {
  return line
    .normalize("NFKC")
    .replace(/[\u200b-\u200f\u202a-\u202e\ufeff]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/^[#\-•·*|｜:：~—–_]+\s*/, "")
    .replace(/^\d{1,2}[.、)\-\s]+/, "")
    .trim();
}

function cleanHeadingRest(value: string): string {
  return stripDecorativeAffixes(value);
}

function getVisualSectionHeading(
  line: string,
  visualLine: ExtractedPdfLine | undefined,
  headingStyle: HeadingStyleProfile | null,
): { key: SectionKey; title: string; rest: string } | null {
  const heading = getSectionHeading(line);
  if (!heading) return null;
  if (!matchesHeadingStyle(visualLine, headingStyle)) return null;
  return heading;
}

function getVisualEmbeddedSectionHeading(
  line: string,
  visualLine: ExtractedPdfLine | undefined,
  headingStyle: HeadingStyleProfile | null,
): { before: string; key: SectionKey; title: string; rest: string } | null {
  const heading = getEmbeddedSectionHeading(line);
  if (!heading) return null;
  if (!matchesHeadingStyle(visualLine, headingStyle)) return null;
  return heading;
}

function buildHeadingStyleProfile(
  visualLines: ExtractedPdfLine[],
): HeadingStyleProfile | null {
  const samples = visualLines.filter((line) => {
    const heading = getSectionHeading(line.text);
    return Boolean(heading && !heading.rest && line.height > 0);
  });

  if (samples.length < 2) return null;

  const height = median(samples.map((line) => line.height));
  const fontCounts = new Map<string, number>();
  for (const line of samples) {
    for (const fontName of line.fontNames) {
      fontCounts.set(fontName, (fontCounts.get(fontName) ?? 0) + 1);
    }
  }

  const fontThreshold = Math.max(2, Math.ceil(samples.length * 0.45));
  const fontNames = new Set(
    Array.from(fontCounts.entries())
      .filter(([, count]) => count >= fontThreshold)
      .map(([fontName]) => fontName),
  );

  return { height, fontNames };
}

function matchesHeadingStyle(
  visualLine: ExtractedPdfLine | undefined,
  headingStyle: HeadingStyleProfile | null,
): boolean {
  if (!headingStyle || !visualLine) return true;

  const heightTolerance = Math.max(1.5, headingStyle.height * 0.22);
  const heightMatches =
    Math.abs(visualLine.height - headingStyle.height) <= heightTolerance;
  const fontMatches =
    headingStyle.fontNames.size === 0 ||
    visualLine.fontNames.length === 0 ||
    visualLine.fontNames.some((fontName) => headingStyle.fontNames.has(fontName));

  return heightMatches && fontMatches;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function getInferredSectionBoundary(
  line: string,
  nextLine: string | undefined,
  current: keyof ParsedSections,
  explicitSectionKeys: Set<SectionKey>,
): SectionKey | null {
  const candidates: SectionKey[] = [];

  if (isWorkEntryStartLine(line, nextLine)) candidates.push("work");
  if (isProjectEntryStartLine(line, nextLine)) candidates.push("projects");
  if (isEducationEntryStartLine(line)) candidates.push("education");
  if (isSkillBoundaryLine(line)) candidates.push("skills");

  return (
    candidates.find((candidate) =>
      canInferSectionBoundary(current, candidate, explicitSectionKeys),
    ) ?? null
  );
}

function canInferSectionBoundary(
  current: keyof ParsedSections,
  target: SectionKey,
  explicitSectionKeys: Set<SectionKey>,
): boolean {
  if (current === target) return false;

  // When a resume has an explicit heading for a module, keep the read cursor
  // inside the current range until that heading is reached.
  if (explicitSectionKeys.has(target)) return false;

  if (target === "skills") return current === "intro";
  if (target === "work" || target === "projects" || target === "education") {
    return true;
  }
  return false;
}

function fillMissingSections(
  sections: ParsedSections,
  lines: string[],
  explicitKeys: Set<SectionKey>,
): ParsedSections {
  const filled: ParsedSections = {
    intro: sections.intro,
    skills: [...sections.skills],
    work: [...sections.work],
    projects: [...sections.projects],
    education: [...sections.education],
    custom: [...sections.custom],
  };
  let fallbackLines =
    explicitKeys.size > 0
      ? getFallbackInferenceLines(sections.intro)
      : getFallbackInferenceLines(removeAssignedModuleLines(lines, filled));

  if (filled.skills.length === 0 && !explicitKeys.has("skills")) {
    filled.skills = inferSkillLines(fallbackLines);
    fallbackLines = removeSelectedLines(fallbackLines, filled.skills);
  }
  if (filled.education.length === 0 && !explicitKeys.has("education")) {
    filled.education = inferEntryLines(fallbackLines, isEducationChunk, "教育经历");
    fallbackLines = removeSelectedLines(fallbackLines, filled.education);
  }
  if (filled.work.length === 0 && !explicitKeys.has("work")) {
    filled.work = inferEntryLines(fallbackLines, isWorkChunk, "工作经历");
    fallbackLines = removeSelectedLines(fallbackLines, filled.work);
  }
  if (filled.projects.length === 0 && !explicitKeys.has("projects")) {
    filled.projects = inferEntryLines(fallbackLines, isProjectChunk, "项目经历");
  }

  return filled;
}

function removeAssignedModuleLines(
  lines: string[],
  sections: ParsedSections,
): string[] {
  return removeSelectedLines(lines, [
    ...sections.skills,
    ...sections.work,
    ...sections.projects,
    ...sections.education,
    ...sections.custom,
  ]);
}

function removeSelectedLines(lines: string[], selectedLines: string[]): string[] {
  if (selectedLines.length === 0) return lines;

  const selectedCounts = new Map<string, number>();
  for (const line of selectedLines) {
    const count = selectedCounts.get(line) ?? 0;
    selectedCounts.set(line, count + 1);
  }

  return lines.filter((line) => {
    const count = selectedCounts.get(line) ?? 0;
    if (count <= 0) return true;
    if (count === 1) {
      selectedCounts.delete(line);
    } else {
      selectedCounts.set(line, count - 1);
    }
    return false;
  });
}

function getFallbackInferenceLines(lines: string[]): string[] {
  return lines
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !getSectionKey(line))
    .filter((line) => !isLikelyBasicInfoLine(line));
}

function inferSkillLines(lines: string[]): string[] {
  const result: string[] = [];

  for (const line of lines) {
    if (hasDateRange(line) || getSectionKey(line)) continue;
    if (isLikelySkillLine(line)) result.push(line);
  }

  return result;
}

function inferEntryLines(
  lines: string[],
  predicate: (chunk: string[]) => boolean,
  fallbackTitle: string,
): string[] {
  const chunks = [...buildDateChunks(lines), ...buildEntryBoundaryChunks(lines, fallbackTitle)];
  return dedupeChunks(chunks)
    .filter(predicate)
    .flat();
}

function buildEntryBoundaryChunks(lines: string[], fallbackTitle: string): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (getSectionKey(line)) {
      if (current.length) chunks.push(current);
      current = [];
      continue;
    }

    if (isEntryBoundaryLine(line, fallbackTitle, lines[index + 1])) {
      if (current.length) chunks.push(current);
      current = [line];
      continue;
    }

    if (current.length) current.push(line);
  }

  if (current.length) chunks.push(current);
  return chunks;
}

function dedupeChunks(chunks: string[][]): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];

  for (const chunk of chunks) {
    const key = chunk.join("\n");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(chunk);
  }

  return result;
}

function buildDateChunks(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (getSectionKey(line)) {
      if (current.length) chunks.push(current);
      current = [];
      continue;
    }

    if (hasDateRange(line) || hasDecorativeDatePlaceholder(line)) {
      if (current.length) chunks.push(current);
      current = [line];
      continue;
    }

    if (current.length) current.push(line);
  }
  if (current.length) chunks.push(current);

  return chunks;
}

function isLikelySkillLine(line: string): boolean {
  const keywordCount = [
    /HTML|CSS|JavaScript|TypeScript|React|Vue|Angular/i,
    /Webpack|Vite|ESLint|Prettier|Git|Node|Next\.?js|Nuxt|Nest/i,
    /ECharts|Ant Design|Element|Tailwind|Less|Sass|Zustand|Redux/i,
    /Java|Python|Go|Golang|PHP|C\+\+|Spring|Django|Flask|MySQL|Redis|MongoDB/i,
    /Docker|Kubernetes|K8s|Linux|CI\/CD|Jenkins|Nginx/i,
    /熟悉|掌握|了解|精通|前端|框架|工程化|组件库/,
  ].filter((regexp) => regexp.test(line)).length;
  return (
    keywordCount >= 2 ||
    /^(前端基础|后端基础|框架\/库|工程化|数据库|开发工具|其他)[:：]/.test(line)
  );
}

function isEducationChunk(chunk: string[]): boolean {
  return /(大学|学院|学校|本科|大专|硕士|博士|专业|学历)/.test(chunk.join(" "));
}

function isWorkChunk(chunk: string[]): boolean {
  return /(公司|科技|股份|集团|有限公司|工作职责|工作内容|任职)/.test(chunk.join(" "));
}

function isProjectChunk(chunk: string[]): boolean {
  return /(项目描述|项目技术|项目亮点|系统|平台|组件|小程序|App|APP|管理后台|可视化)/.test(
    chunk.join(" "),
  );
}

function parseBasics(text: string, allLines: string[], sourceName: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone =
    text
      .match(/(?:\+?86[-\s]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/)?.[0]
      ?.replace(/\s+/g, " ") ?? "";
  const birthday = matchDateAfterLabel(text, /(出生日期|出生年月|生日|出生)[:：\s]/);
  const location =
    text.match(
      /(北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|重庆|天津|西安|长沙|郑州|青岛|厦门|合肥|宁波|佛山|东莞|无锡)(?:市)?/,
    )?.[0] ?? "";
  const role =
    matchValueAfterLabel(text, /(求职意向|应聘岗位|目标岗位|职位|岗位)[:：\s]/) ||
    inferRole(allLines, sourceName);
  const status =
    matchValueAfterLabel(text, /(到岗时间|求职状态|当前状态)[:：\s]/) ||
    (text.includes("求职中") ? "求职中" : "");
  const name = inferName(allLines, email, phone);

  return {
    name,
    role,
    status,
    birthday,
    email,
    phone,
    location,
  };
}

function matchValueAfterLabel(text: string, label: RegExp): string {
  const line = toLines(text).find((item) => label.test(item));
  if (!line) return "";
  return line.replace(label, "").trim().slice(0, 24);
}

function matchDateAfterLabel(text: string, label: RegExp): string {
  const line = toLines(text).find((item) => label.test(item));
  if (!line) return "";
  return line.replace(label, "").match(dateValueRegexp)?.[0]?.replace(/-/g, "/") ?? "";
}

function inferName(lines: string[], email: string, phone: string): string {
  const blocked = new Set(["个人简历", "简历", "求职简历", "应聘简历"]);
  const candidates = lines.slice(0, 10).filter((line) => {
    const compact = line.replace(/\s+/g, "");
    if (blocked.has(compact)) return false;
    if (email && line.includes(email)) return false;
    if (phone && line.includes(phone)) return false;
    if (getSectionKey(line)) return false;
    return /^[\u4e00-\u9fa5·]{2,6}$/.test(compact);
  });
  return candidates[0]?.replace(/\s+/g, "") ?? "";
}

function inferRole(lines: string[], sourceName: string): string {
  return inferRoleFromSourceName(sourceName) || inferRoleFromHeader(lines);
}

function inferRoleFromSourceName(sourceName: string): string {
  const stem = sourceName.replace(/\.[^.]+$/, "");
  const parts = stem
    .split(/[_\-—–\s]+/)
    .map((part) => normalizeRoleValue(part))
    .filter(Boolean);
  return parts.find(isLikelyRoleValue) ?? "";
}

function inferRoleFromHeader(lines: string[]): string {
  const headerLines = lines.slice(0, 10);
  const firstSectionIndex = headerLines.findIndex((line) => getSectionKey(line));
  const candidates = (firstSectionIndex >= 0
    ? headerLines.slice(0, firstSectionIndex)
    : headerLines
  ).map((line) => normalizeRoleValue(line));
  return candidates.find(isLikelyRoleValue) ?? "";
}

function normalizeRoleValue(value: string): string {
  const normalized = value
    .replace(/求职意向|应聘岗位|目标岗位|职位|岗位|[:：]/g, "")
    .trim();
  if (normalized === "前端") return "前端开发";
  if (normalized === "后端") return "后端开发";
  return normalized.slice(0, 24);
}

function isLikelyRoleValue(value: string): boolean {
  if (!value || value.length > 16) return false;
  if (getSectionKey(value)) return false;
  if (hasDateRange(value) || dateValueRegexp.test(value)) return false;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value)) return false;
  if (/(?:\+?86[-\s]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/.test(value)) {
    return false;
  }
  if (/(基础|熟悉|掌握|了解|精通|框架|工程化|组件库|项目|经历)/.test(value)) {
    return false;
  }
  return /(工程师|设计师|产品|运营|开发|前端|后端|测试|经理|专员|主管|实习)/.test(
    value,
  );
}

function isLikelyBasicInfoLine(line: string): boolean {
  const cleaned = stripDecorativeAffixes(line);
  if (!cleaned) return true;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(cleaned)) return true;
  if (/(?:\+?86[-\s]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/.test(cleaned)) {
    return true;
  }
  if (
    /^(姓名|电话|手机|邮箱|邮件|地址|现居|所在地|出生|出生日期|出生年月|生日|求职意向|应聘岗位|目标岗位|职位|岗位|当前状态|求职状态|到岗时间)[:：\s]/.test(
      cleaned,
    )
  ) {
    return true;
  }
  if (/^[\u4e00-\u9fa5·]{2,6}$/.test(cleaned)) return true;
  return isLikelyRoleValue(cleaned);
}

function parseSkills(lines: string[]): string[] {
  const text = lines
    .map((line) => stripDecorativeAffixes(line.replace(/^[•·\-*]\s*/, "")))
    .filter((line) => !getSectionKey(line))
    .filter((line) => !isWorkEntryStartLine(line))
    .filter((line) => !isProjectEntryStartLine(line))
    .filter((line) => !isEducationEntryStartLine(line))
    .filter(Boolean)
    .join("\n");
  return text ? [text] : [];
}

function parseEntries(lines: string[], fallbackTitle: string): ImportedResumeEntry[] {
  if (!lines.length) return [];

  const chunks: string[][] = [];
  let current: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (
      current.length > 0 &&
      isEntryBoundaryLine(line, fallbackTitle, lines[index + 1])
    ) {
      chunks.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length) chunks.push(current);

  return chunks
    .map((chunk, index) => buildEntryFromChunk(chunk, fallbackTitle, index))
    .filter((entry) => entry.description || entry.title !== fallbackTitle);
}

function buildEntryFromChunk(
  chunk: string[],
  fallbackTitle: string,
  index: number,
): ImportedResumeEntry {
  if (fallbackTitle === "教育经历") {
    return buildEducationEntryFromChunk(chunk, fallbackTitle, index);
  }

  const dateLine =
    chunk.find(hasDateRange) ?? chunk.find(hasDecorativeDatePlaceholder) ?? "";
  const dateRange = parseDateRange(dateLine);
  const cleanLines = chunk
    .map((line) =>
      stripDecorativeAffixes(line === dateLine ? removeEntryDateMarker(line) : line),
    )
    .filter(Boolean);
  const title = cleanLines[0] ?? `${fallbackTitle} ${index + 1}`;
  const subtitle =
    cleanLines[1] && isLikelySubtitle(cleanLines[1]) ? cleanLines[1] : "";
  const descriptionLines = cleanLines.slice(subtitle ? 2 : 1);
  const description = descriptionLines.join("\n");

  return {
    title: title.slice(0, 40),
    subtitle: subtitle.slice(0, 40),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    description,
  };
}

function buildEducationEntryFromChunk(
  chunk: string[],
  fallbackTitle: string,
  index: number,
): ImportedResumeEntry {
  const dateLine =
    chunk.find(hasDateRange) ?? chunk.find(hasDecorativeDatePlaceholder) ?? "";
  const dateRange = parseDateRange(dateLine);
  const cleanLines = chunk
    .map((line) =>
      stripDecorativeAffixes(line === dateLine ? removeEntryDateMarker(line) : line),
    )
    .filter(Boolean);
  const attendance = extractEducationAttendance(cleanLines);
  const contentLines = cleanLines.filter((line) => !isEducationAttendanceLine(line));
  const parsed = parseEducationTitleAndSubtitle(contentLines);

  return {
    title: (parsed.title || `${fallbackTitle} ${index + 1}`).slice(0, 40),
    subtitle: appendEducationAttendance(parsed.subtitle, attendance).slice(0, 40),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    description: parsed.description,
  };
}

function extractEducationAttendance(lines: string[]): string {
  const compact = lines.map((line) => line.replace(/\s+/g, "")).join(" ");
  if (compact.includes("非全日制")) return "非全日制";
  if (compact.includes("全日制")) return "全日制";
  return "";
}

function isEducationAttendanceLine(line: string): boolean {
  const compact = line.replace(/\s+/g, "");
  return compact === "全日制" || compact === "非全日制";
}

function parseEducationTitleAndSubtitle(lines: string[]): {
  title: string;
  subtitle: string;
  description: string;
} {
  const normalizedLines = lines.map(normalizeEducationLine).filter(Boolean);
  const firstLine = normalizedLines[0] ?? "";
  const secondLine = normalizedLines[1] ?? "";
  const inline = splitInlineEducationLine(firstLine);

  if (inline.title) {
    return {
      title: inline.title,
      subtitle: inline.subtitle || secondLine,
      description: normalizedLines.slice(inline.subtitle ? 1 : 2).join("\n"),
    };
  }

  return {
    title: firstLine,
    subtitle: secondLine,
    description: normalizedLines.slice(secondLine ? 2 : 1).join("\n"),
  };
}

function splitInlineEducationLine(line: string): {
  title: string;
  subtitle: string;
} {
  const normalized = normalizeEducationLine(line);
  const match = normalized.match(
    /^(.+?(?:大学|学院|学校|中学|职业技术学院|职校|研究生院|College|University))\s*(.*)$/i,
  );
  if (!match) return { title: "", subtitle: "" };

  return {
    title: stripDecorativeAffixes(match[1] ?? ""),
    subtitle: normalizeEducationSubtitle(match[2] ?? ""),
  };
}

function normalizeEducationLine(line: string): string {
  return repairCjkSpacing(line)
    .replace(/\s*([|｜])\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeEducationSubtitle(value: string): string {
  return value
    .split(/[|｜]/)
    .flatMap((part) => part.trim().split(/\s+/))
    .filter(Boolean)
    .join(" | ");
}

function appendEducationAttendance(subtitle: string, attendance: string): string {
  if (!attendance) return subtitle;

  const parts = normalizeEducationSubtitle(subtitle)
    .split(/\s*\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== attendance);
  return [...parts, attendance].join(" | ");
}

function parseSupplemental(lines: string[]): string[] {
  const text = lines.join("\n").trim();
  return text ? [text] : [];
}

const dateRangeRegexp =
  /((?:19|20)\d{2}(?:[./-]\d{1,2})?)\s*(?:-|~|—|–|至|到)\s*((?:(?:19|20)\d{2}(?:[./-]\d{1,2})?)|至今|现在|Present|present)/;
const dateValueRegexp = /(?:19|20)\d{2}(?:[./-]\d{1,2}){0,2}/;
const decorativeDatePlaceholderRegexp = /[-—–]\s*~\s*[-—–]/;

function hasDateRange(line: string): boolean {
  return dateRangeRegexp.test(line);
}

function parseDateRange(line: string): { startDate: string; endDate: string } {
  const match = line.match(dateRangeRegexp);
  return {
    startDate: match?.[1]?.replace(/-/g, "/") ?? "",
    endDate: match?.[2]?.replace(/-/g, "/") ?? "",
  };
}

function removeEntryDateMarker(line: string): string {
  return stripDecorativeAffixes(
    line
      .replace(dateRangeRegexp, "")
      .replace(decorativeDatePlaceholderRegexp, ""),
  );
}

function isEntryBoundaryLine(
  line: string,
  fallbackTitle: string,
  nextLine?: string,
): boolean {
  if (hasDateRange(line) || hasDecorativeDatePlaceholder(line)) return true;
  if (isListItemLine(line) || getSectionKey(line)) return false;

  if (fallbackTitle === "工作经历") {
    return isWorkEntryStartLine(line, nextLine);
  }

  if (fallbackTitle === "项目经历") {
    return isProjectEntryStartLine(line, nextLine);
  }

  if (fallbackTitle === "教育经历") {
    return isEducationEntryStartLine(line);
  }

  return false;
}

function isWorkEntryStartLine(line: string, nextLine?: string): boolean {
  if (isListItemLine(line) || getSectionKey(line)) return false;

  const cleaned = stripDecorativeAffixes(line);
  if (!cleaned || cleaned.length > 56 || isEntryDescriptionLabel(cleaned)) return false;
  if (/(项目描述|项目技术|项目亮点|教育经历|专业技能)/.test(cleaned)) return false;

  const hasCompanyName = /(公司|科技|股份|集团|有限公司|有限责任公司|工作室|事务所|团队|中心|研究院|银行|学校|医院)/.test(
    cleaned,
  );
  const hasWorkRoleNext =
    Boolean(nextLine) &&
    /(工程师|开发|设计师|产品|运营|测试|实习|经理|主管|专员|负责人|顾问)/.test(
      nextLine ?? "",
    );

  return hasCompanyName && (hasDateRange(line) || hasDecorativeDatePlaceholder(line) || hasWorkRoleNext || cleaned.length <= 36);
}

function isProjectEntryStartLine(line: string, nextLine?: string): boolean {
  if (isListItemLine(line) || getSectionKey(line)) return false;

  const cleaned = stripDecorativeAffixes(line);
  if (!cleaned || cleaned.length > 60 || isEntryDescriptionLabel(cleaned)) return false;
  if (hasDecorativeDatePlaceholder(line)) return true;
  if (hasDateRange(line) && !/(公司|大学|学院|学校)/.test(cleaned)) return true;
  if (nextLine && isProjectDescriptionStartLabel(nextLine)) return true;

  return false;
}

function isEducationEntryStartLine(line: string): boolean {
  if (isListItemLine(line) || getSectionKey(line)) return false;

  const cleaned = stripDecorativeAffixes(line);
  if (!cleaned || cleaned.length > 60 || isEntryDescriptionLabel(cleaned)) return false;

  const hasSchool = /(大学|学院|学校|中学|职业技术学院|职校|研究生院|College|University)/i.test(
    cleaned,
  );
  const hasDegree = /(本科|大专|专科|硕士|博士|学士|研究生|MBA|专业|学历)/i.test(
    cleaned,
  );

  return hasSchool && (hasDegree || hasDateRange(line) || hasDecorativeDatePlaceholder(line));
}

function isSkillBoundaryLine(line: string): boolean {
  const cleaned = stripDecorativeAffixes(line);
  if (!cleaned || cleaned.length > 100 || isListItemLine(cleaned)) return false;
  if (isWorkEntryStartLine(cleaned) || isProjectEntryStartLine(cleaned) || isEducationEntryStartLine(cleaned)) {
    return false;
  }
  return isLikelySkillLine(cleaned);
}

function hasDecorativeDatePlaceholder(line: string): boolean {
  return decorativeDatePlaceholderRegexp.test(line);
}

function isEntryDescriptionLabel(line: string): boolean {
  return /^(项目描述|项目技术|项目亮点|工作内容|工作职责|职责描述|技术栈)[:：]?$/.test(compactLabelText(line));
}

function isProjectDescriptionStartLabel(line: string): boolean {
  return /^(项目描述|项目介绍|项目背景)[:：]?$/.test(compactLabelText(line));
}

function isListItemLine(line: string): boolean {
  return /^[•·*.\-]\s*\S|^\d+[.、)]/.test(line.trim());
}

function isLikelySubtitle(line: string): boolean {
  if (line.length > 36) return false;
  if (isEntryDescriptionLabel(line)) return false;
  if (/^\d+[.、)]/.test(line)) return false;
  return true;
}

function cleanText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePdfLineText(text: string): string {
  return repairCjkSpacing(cleanText(text));
}

function repairCjkSpacing(text: string): string {
  return text
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/([\u4e00-\u9fff])\s+([:：,，。；;、])/g, "$1$2")
    .replace(/([:：,，。；;、])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripDecorativeAffixes(value: string): string {
  return value
    .replace(/^[\s#•·*.|｜:：~—–_\-]+/, "")
    .replace(/[\s#•·*.|｜:：~—–_\-]+$/, "")
    .trim();
}

function compactLabelText(value: string): string {
  return normalizeHeadingCandidate(value).replace(/\s+/g, "");
}

function escapeRegexp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toLines(text: string): string[] {
  return text
    .split(/\n| {2,}/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function makeEntry(
  prefix: string,
  index: number,
  entry: ImportedResumeEntry,
): ResumeEntry {
  return {
    id: `${prefix}-${index + 1}`,
    title: entry.title,
    subtitle: entry.subtitle,
    startDate: entry.startDate,
    endDate: entry.endDate,
    description: normalizeRichText(entry.description),
  };
}

function makeTextEntry(prefix: string, text: string): ResumeEntry {
  return {
    id: `${prefix}-1`,
    title: prefix === "skills" ? "综合技能" : "",
    subtitle: "",
    startDate: "",
    endDate: "",
    description: normalizeRichText(text),
  };
}

export function buildResumeFromImport(
  templateResume: ResumeDocument,
  draft: ImportedResumeDraft,
  fileName: string,
): ResumeDocument {
  if (draft.embeddedResume) {
    return buildResumeFromEmbeddedImport(
      templateResume,
      draft.embeddedResume,
      fileName,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const fallbackTitle = fileName.replace(/\.pdf$/i, "").trim() || "导入的简历";
  const title = draft.basics.name ? `${draft.basics.name}的简历` : fallbackTitle;
  const modules = templateResume.modules.flatMap((module): ResumeModule[] => {
    if (module.type === "custom") return [];
    return [hydrateFixedModule(module, draft)];
  });

  if (draft.supplemental.length > 0) {
    modules.push(makeSupplementalModule(draft.supplemental));
  }

  return resumeDocumentSchema.parse({
    ...templateResume,
    id,
    title,
    createdAt: now,
    updatedAt: now,
    modules,
  });
}

function buildDraftFromEmbeddedResume(
  resume: ResumeDocument,
  rawText: string,
): ImportedResumeDraft {
  const basics = resume.modules.find(
    (module): module is FixedResumeModule => module.type === "basics",
  )?.basics;
  const fixedItems = (type: "skills" | "work" | "projects" | "education") => {
    const foundModule = resume.modules.find(
      (item): item is FixedResumeModule => item.type === type,
    );
    return foundModule?.items ?? [];
  };

  return {
    basics: {
      name: basics?.name ?? "",
      role: basics?.role ?? "",
      status: basics?.status ?? "",
      birthday: basics?.birthday ?? "",
      email: basics?.email ?? "",
      phone: basics?.phone ?? "",
      location: basics?.location ?? "",
    },
    skills: fixedItems("skills").map((item) =>
      richTextToPlainText(item.description),
    ),
    work: fixedItems("work").map(toImportedEntry),
    projects: fixedItems("projects").map(toImportedEntry),
    education: fixedItems("education").map(toImportedEntry),
    supplemental: resume.modules
      .flatMap((module) => {
        if (module.type !== "custom") return [];
        return module.items
          .filter((item) => item.visible)
          .map((item) => richTextToPlainText(item.description));
      })
      .filter(Boolean),
    rawText,
    recognitionMarkdown: buildEmbeddedRecognitionMarkdown(resume),
    recognitionOutline: buildEmbeddedRecognitionOutline(resume),
    warnings: [],
    source: "embedded",
    embeddedResume: resume,
  };
}

function buildEmbeddedRecognitionMarkdown(resume: ResumeDocument): string {
  const ranges = buildEmbeddedRecognitionRanges(resume);
  return buildRecognitionMarkdown(ranges);
}

function buildEmbeddedRecognitionOutline(
  resume: ResumeDocument,
): ImportedRecognitionSection[] {
  return buildRecognitionOutline(buildEmbeddedRecognitionRanges(resume));
}

function buildEmbeddedRecognitionRanges(resume: ResumeDocument): SectionRange[] {
  return resume.modules.flatMap((module): SectionRange[] => {
    if (module.type === "basics") {
      const basics = module.basics;
      const lines = basics
        ? [
            basics.name,
            basics.role,
            basics.status,
            basics.birthday,
            basics.email,
            basics.phone,
            basics.location,
          ].filter(Boolean)
        : [];
      return lines.length
        ? [{ key: "intro", title: "基本信息", lines, explicit: true }]
        : [];
    }

    if (module.type === "custom") {
      const lines = module.items
        .filter((item) => item.visible)
        .map((item) => richTextToPlainText(item.description))
        .filter(Boolean);
      return lines.length
        ? [
            {
              key: "custom",
              title: module.title || "补充内容",
              lines,
              explicit: true,
            },
          ]
        : [];
    }

    const lines = module.items.flatMap((item) =>
      [
        [item.title, item.subtitle].filter(Boolean).join(" "),
        [item.startDate, item.endDate].filter(Boolean).join(" - "),
        richTextToPlainText(item.description),
      ].filter(Boolean),
    );

    return lines.length
      ? [
          {
            key: module.type,
            title: module.title || getSectionRangeTitle(module.type),
            lines,
            explicit: true,
          },
        ]
      : [];
  });
}

function toImportedEntry(entry: ResumeEntry): ImportedResumeEntry {
  return {
    title: entry.title,
    subtitle: entry.subtitle,
    startDate: entry.startDate,
    endDate: entry.endDate,
    description: richTextToPlainText(entry.description),
  };
}

function buildResumeFromEmbeddedImport(
  templateResume: ResumeDocument,
  embeddedResume: ResumeDocument,
  fileName: string,
): ResumeDocument {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const fallbackTitle = fileName.replace(/\.pdf$/i, "").trim() || "导入的简历";
  const sourceTitle = embeddedResume.title.trim();
  const modules = templateResume.modules.flatMap((module): ResumeModule[] => {
    if (module.type === "custom") return [];
    return [hydrateFixedModuleFromResume(module, embeddedResume)];
  });

  modules.push(...copyEmbeddedCustomModules(embeddedResume));

  return resumeDocumentSchema.parse({
    ...templateResume,
    id,
    title: sourceTitle || fallbackTitle,
    createdAt: now,
    updatedAt: now,
    modules,
  });
}

function hydrateFixedModuleFromResume(
  targetModule: FixedResumeModule,
  embeddedResume: ResumeDocument,
): FixedResumeModule {
  const sourceModule = embeddedResume.modules.find(
    (module) => module.type === targetModule.type,
  );

  if (targetModule.type === "basics") {
    const sourceBasics =
      sourceModule?.type === "basics" ? sourceModule.basics : undefined;
    return {
      ...targetModule,
      visible: true,
      basics: sourceBasics
        ? {
            ...sourceBasics,
            avatarPosition: targetModule.basics?.avatarPosition,
          }
        : targetModule.basics,
      items: [],
    };
  }

  if (!sourceModule || sourceModule.type === "custom") {
    return { ...targetModule, visible: false, items: [] };
  }

  const items = sourceModule.items.map((item, index) => ({
    ...item,
    id: `${targetModule.type}-${index + 1}`,
    entryStyle: undefined,
  }));

  return {
    ...targetModule,
    visible: sourceModule.visible && items.length > 0,
    items,
  };
}

function copyEmbeddedCustomModules(
  embeddedResume: ResumeDocument,
): CustomResumeModule[] {
  return embeddedResume.modules.flatMap((module, moduleIndex) => {
    if (module.type !== "custom" || !module.visible) return [];
    const items = module.items
      .filter((item) => item.visible)
      .map((item, itemIndex) => ({
        ...item,
        id: `custom-${moduleIndex + 1}-${itemIndex + 1}`,
        visible: true,
        entryStyle: undefined,
      }));

    if (items.length === 0) return [];
    return [
      {
        ...module,
        id: `custom-imported-${moduleIndex + 1}`,
        visible: true,
        items,
      },
    ];
  });
}

function hydrateFixedModule(
  module: FixedResumeModule,
  draft: ImportedResumeDraft,
): FixedResumeModule {
  if (module.type === "basics") {
    return {
      ...module,
      visible: true,
      basics: {
        name: draft.basics.name,
        role: draft.basics.role,
        status: draft.basics.status,
        birthday: draft.basics.birthday,
        email: draft.basics.email,
        phone: draft.basics.phone,
        location: draft.basics.location,
        website: "",
        avatar: "",
        avatarPosition: module.basics?.avatarPosition,
        infoItems: [],
        hiddenFields: [],
        removedFields: [],
        fieldOrder:
          module.basics?.fieldOrder ?? DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
      },
      items: [],
    };
  }

  if (module.type === "skills") {
    const items = draft.skills.map((skill) => makeTextEntry("skills", skill));
    return { ...module, visible: items.length > 0, items };
  }

  if (module.type === "work") {
    const items = draft.work.map((entry, index) =>
      makeEntry("work", index, entry),
    );
    return { ...module, visible: items.length > 0, items };
  }

  if (module.type === "projects") {
    const items = draft.projects.map((entry, index) =>
      makeEntry("project", index, entry),
    );
    return { ...module, visible: items.length > 0, items };
  }

  const items = draft.education.map((entry, index) =>
    makeEntry("education", index, entry),
  );
  return { ...module, visible: items.length > 0, items };
}

function makeSupplementalModule(texts: string[]): CustomResumeModule {
  return {
    id: "custom-imported-notes",
    type: "custom",
    title: "导入补充内容",
    visible: true,
    items: texts.map((text, index) => ({
      id: `imported-note-${index + 1}`,
      title: "",
      subtitle: "",
      startDate: "",
      endDate: "",
      description: normalizeRichText(text),
      visible: true,
    })),
  };
}
