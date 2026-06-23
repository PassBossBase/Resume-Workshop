"use client";

import {
  normalizeRichText,
  richTextToPlainText,
} from "@/features/rich-text/rich-text";
import { extractEmbeddedResumeFromPdfText } from "@/features/pdf-export/pdf-import-payload";
import {
  DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
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
  warnings: string[];
  source: "embedded" | "text";
  embeddedResume?: ResumeDocument;
};

type ExtractedPdfText = {
  pageCount: number;
  text: string;
};

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
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
  const embeddedResume = extractEmbeddedResumeFromPdfText(extracted.text);
  if (embeddedResume) {
    return buildDraftFromEmbeddedResume(embeddedResume, extracted.text);
  }

  const draft = parseResumeText(extracted.text);
  const warnings = [...draft.warnings];

  if (extracted.pageCount > 5) {
    warnings.push("PDF 页数较多，建议导入后重点检查内容顺序。");
  }
  if (draft.rawText.length < 80) {
    warnings.push("提取到的文本偏少，扫描件或图片型 PDF 可能无法完整识别。");
  }

  return { ...draft, warnings };
}

async function extractPdfText(file: File): Promise<ExtractedPdfText> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const documentTask = pdfjs.getDocument({ data });
  const document = await documentTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageParts: string[] = [];

    for (const item of content.items as PdfTextItem[]) {
      if (!item.str) continue;
      pageParts.push(item.str);
      if (item.hasEOL) pageParts.push("\n");
    }

    pages.push(cleanText(pageParts.join(" ")));
  }

  const text = cleanText(pages.join("\n"));
  if (!text.trim()) {
    throw new Error("没有从 PDF 中读取到文本，暂不支持扫描件或纯图片简历。");
  }

  return {
    pageCount: document.numPages,
    text,
  };
}

function parseResumeText(text: string): ImportedResumeDraft {
  const normalizedText = cleanText(text);
  const lines = toLines(normalizedText);
  const sections = splitSections(lines);
  const introText = [
    ...sections.intro,
    ...lines.slice(0, Math.min(lines.length, 12)),
  ].join("\n");

  const basics = parseBasics(introText, lines);
  const skills = parseSkills(sections.skills);
  const work = parseEntries(sections.work, "工作经历");
  const projects = parseEntries(sections.projects, "项目经历");
  const education = parseEntries(sections.education, "教育经历");
  const supplemental = parseSupplemental(sections.custom);
  const warnings: string[] = [];

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
    warnings,
    source: "text",
  };
}

type SectionKey = "skills" | "work" | "projects" | "education" | "custom";

type ParsedSections = Record<SectionKey | "intro", string[]>;

const sectionMatchers: Array<[SectionKey, RegExp]> = [
  ["skills", /^(专业技能|技能特长|个人技能|技能|核心能力)$/],
  ["work", /^(工作经历|工作经验|实习经历|任职经历|职业经历)$/],
  ["projects", /^(项目经历|项目经验|项目)$/],
  ["education", /^(教育经历|教育背景|教育)$/],
  ["custom", /^(自我评价|个人评价|荣誉证书|证书|获奖经历|校园经历|其他)$/],
];

function splitSections(lines: string[]): ParsedSections {
  const sections: ParsedSections = {
    intro: [],
    skills: [],
    work: [],
    projects: [],
    education: [],
    custom: [],
  };
  let current: keyof ParsedSections = "intro";

  for (const line of lines) {
    const heading = getSectionKey(line);
    if (heading) {
      current = heading;
      continue;
    }
    sections[current].push(line);
  }

  return sections;
}

function getSectionKey(line: string): SectionKey | null {
  const compact = line.replace(/\s+/g, "");
  const match = sectionMatchers.find(([, regexp]) => regexp.test(compact));
  return match?.[0] ?? null;
}

function parseBasics(text: string, allLines: string[]) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone =
    text
      .match(/(?:\+?86[-\s]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/)?.[0]
      ?.replace(/\s+/g, " ") ?? "";
  const birthday =
    text.match(/(?:19|20)\d{2}[./-]\d{1,2}(?:[./-]\d{1,2})?/)?.[0] ?? "";
  const location =
    text.match(
      /(北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|重庆|天津|西安|长沙|郑州|青岛|厦门|合肥|宁波|佛山|东莞|无锡)(?:市)?/,
    )?.[0] ?? "";
  const role =
    matchValueAfterLabel(text, /(求职意向|应聘岗位|目标岗位|职位|岗位)[:：\s]/) ||
    inferRole(allLines);
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

function inferRole(lines: string[]): string {
  const roleLine = lines
    .slice(0, 12)
    .find((line) => /(工程师|设计师|产品|运营|开发|前端|后端|测试|经理|专员|主管|实习)/.test(line));
  return roleLine?.replace(/求职意向|应聘岗位|目标岗位|职位|岗位|[:：]/g, "").trim().slice(0, 24) ?? "";
}

function parseSkills(lines: string[]): string[] {
  const text = lines
    .map((line) => line.replace(/^[•·\-*]\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
  return text ? [text] : [];
}

function parseEntries(lines: string[], fallbackTitle: string): ImportedResumeEntry[] {
  if (!lines.length) return [];

  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (current.length > 0 && hasDateRange(line)) {
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
  const dateLine = chunk.find(hasDateRange) ?? "";
  const dateRange = parseDateRange(dateLine);
  const cleanLines = chunk
    .map((line) => (line === dateLine ? removeDateRange(line) : line).trim())
    .filter(Boolean);
  const title = cleanLines[0] ?? `${fallbackTitle} ${index + 1}`;
  const subtitle =
    cleanLines[1] && cleanLines[1].length <= 36 ? cleanLines[1] : "";
  const descriptionLines = cleanLines.slice(subtitle ? 2 : 1);
  const description = descriptionLines.length
    ? descriptionLines.join("\n")
    : cleanLines.join("\n");

  return {
    title: title.slice(0, 40),
    subtitle: subtitle.slice(0, 40),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    description,
  };
}

function parseSupplemental(lines: string[]): string[] {
  const text = lines.join("\n").trim();
  return text ? [text] : [];
}

const dateRangeRegexp =
  /((?:19|20)\d{2}(?:[./-]\d{1,2})?)\s*(?:-|~|—|–|至|到)\s*((?:(?:19|20)\d{2}(?:[./-]\d{1,2})?)|至今|现在|Present|present)/;

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

function removeDateRange(line: string): string {
  return line.replace(dateRangeRegexp, "").trim();
}

function cleanText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
    warnings: [],
    source: "embedded",
    embeddedResume: resume,
  };
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
