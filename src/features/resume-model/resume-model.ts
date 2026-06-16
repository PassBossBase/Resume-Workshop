/**
 * 简历数据模型与 Zod schema —— 应用唯一的数据源。
 *
 * v2 变更：
 * - 模块类型新增 "custom"，支持用户自定义模块。
 * - 模块字段从固定 5 个改为固定模块 + 任意数量自定义模块的联合类型。
 * - 新增 CustomResumeEntry，相比固定条目增加 visible 字段，移除 location 字段。
 * - 所有外部数据通过 parseAndMigrateResume() 统一入口，兼容 v1 旧数据。
 */
import { z } from "zod";
import { normalizeRichText } from "@/features/rich-text/rich-text";

// ──────────────────────────────────────
// 模块类型枚举
// ──────────────────────────────────────

export const moduleTypeSchema = z.enum([
  "basics",
  "skills",
  "work",
  "projects",
  "education",
  "custom",
]);

export type ModuleType = z.infer<typeof moduleTypeSchema>;

// ──────────────────────────────────────
// 基本信息（仅 basics 模块使用）
// ──────────────────────────────────────

const basicsSchema = z.object({
  name: z.string(),
  role: z.string(),
  status: z.string(),
  birthday: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  website: z.string(),
  avatar: z.string(),
});

// ──────────────────────────────────────
// 固定模块条目（5 个固定模块使用）
// ──────────────────────────────────────

const entrySchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string(),
  description: z.string(),
});

export type ResumeEntry = z.infer<typeof entrySchema>;

// ──────────────────────────────────────
// 自定义模块条目（custom 模块使用）
// ──────────────────────────────────────

const customEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
  visible: z.boolean(),
});

export type CustomResumeEntry = z.infer<typeof customEntrySchema>;

// ──────────────────────────────────────
// 模块 Schema（可辨识联合类型）
// ──────────────────────────────────────

const fixedModuleSchema = z.object({
  id: z.string(),
  type: z.enum(["basics", "skills", "work", "projects", "education"]),
  title: z.string(),
  visible: z.boolean(),
  basics: basicsSchema.optional(),
  items: z.array(entrySchema),
});

const customModuleSchema = z.object({
  id: z.string(),
  type: z.literal("custom"),
  title: z.string(),
  visible: z.boolean(),
  items: z.array(customEntrySchema),
});

const resumeModuleSchema = z.discriminatedUnion("type", [
  fixedModuleSchema,
  customModuleSchema,
]);

export type FixedResumeModule = z.infer<typeof fixedModuleSchema>;
export type CustomResumeModule = z.infer<typeof customModuleSchema>;
export type ResumeModule = z.infer<typeof resumeModuleSchema>;

// ──────────────────────────────────────
// 文档 Schema
// ──────────────────────────────────────

const stylesSchema = z.object({
  accent: z.string(),
  fontFamily: z.enum(["sans", "serif", "rounded"]),
  fontSize: z.number().min(12).max(20),
  lineHeight: z.number().min(1.2).max(2),
  pageMargin: z.number().min(24).max(64),
  sectionGap: z.number().min(16).max(52),
});

/** v1 文档 Schema，仅用于迁移旧数据。 */
const resumeDocumentV1Schema = z.object({
  version: z.literal(1),
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  templateId: z.literal("classic"),
  styles: stylesSchema,
  modules: z.array(fixedModuleSchema).length(5),
});

/** v2 文档 Schema —— 当前版本。 */
export const resumeDocumentSchema = z.object({
  version: z.literal(2),
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  templateId: z.literal("classic"),
  styles: stylesSchema,
  modules: z.array(resumeModuleSchema).superRefine((modules, ctx) => {
    // basics 必须位于首位
    if (modules.length === 0 || modules[0]?.type !== "basics") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "基本信息模块必须存在且位于首位",
        path: [0, "type"],
      });
    }
    // 每个固定模块类型必须恰好出现一次
    const fixedTypes = ["basics", "skills", "work", "projects", "education"] as const;
    for (const ft of fixedTypes) {
      const count = modules.filter((m) => m.type === ft).length;
      if (count !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `固定模块 "${ft}" 必须恰好出现一次，当前出现 ${count} 次`,
          path: [],
        });
      }
    }
  }),
});

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;

// ──────────────────────────────────────
// 迁移
// ──────────────────────────────────────

/** 将 v1 文档无损迁移为 v2 文档。 */
function migrateV1ToV2(
  v1: z.infer<typeof resumeDocumentV1Schema>,
): ResumeDocument {
  return {
    ...v1,
    version: 2 as const,
    modules: v1.modules, // v1 的 5 个固定模块结构与 v2 兼容
  };
}

/**
 * 统一的外部数据解析入口。依次尝试 v2 直接解析、v1 解析后迁移。
 * 两版都无法解析时抛出描述性错误。
 */
export function parseAndMigrateResume(raw: unknown): ResumeDocument {
  const v2Result = resumeDocumentSchema.safeParse(raw);
  if (v2Result.success) return v2Result.data;

  const v1Result = resumeDocumentV1Schema.safeParse(raw);
  if (v1Result.success) return migrateV1ToV2(v1Result.data);

  throw new Error(`简历数据无法解析: ${v2Result.error.message}`);
}

// ──────────────────────────────────────
// 工厂函数
// ──────────────────────────────────────

function entry(
  id: string,
  title: string,
  subtitle: string,
  startDate: string,
  endDate: string,
  description: string,
): ResumeEntry {
  return {
    id,
    title,
    subtitle,
    startDate,
    endDate,
    location: "",
    description: normalizeRichText(description),
  };
}

/** 创建一份 v2 默认简历，包含 5 个固定模块，不含自定义模块。 */
export function createDefaultResume(
  id: string,
  title = "未命名简历",
): ResumeDocument {
  const now = new Date().toISOString();

  return {
    version: 2,
    id,
    title,
    createdAt: now,
    updatedAt: now,
    templateId: "classic",
    styles: {
      accent: "#3f57e8",
      fontFamily: "sans",
      fontSize: 15,
      lineHeight: 1.55,
      pageMargin: 36,
      sectionGap: 28,
    },
    modules: [
      {
        id: "basics",
        type: "basics",
        title: "基本信息",
        visible: true,
        basics: {
          name: "林小满",
          role: "产品设计师",
          status: "求职中",
          birthday: "1998/06",
          email: "hello@example.com",
          phone: "138 0013 8000",
          location: "杭州市",
          website: "portfolio.example.com",
          avatar: "",
        },
        items: [],
      },
      {
        id: "skills",
        type: "skills",
        title: "专业技能",
        visible: true,
        items: [
          entry(
            "skill-1",
            "产品与体验",
            "",
            "",
            "",
            "用户研究、交互设计、原型制作、设计系统\n熟练使用 Figma、Sketch、Adobe Creative Suite\n具备从需求分析到产品落地的完整经验",
          ),
        ],
      },
      {
        id: "work",
        type: "work",
        title: "工作经历",
        visible: true,
        items: [
          entry(
            "work-1",
            "星河科技",
            "高级产品设计师",
            "2022/07",
            "至今",
            "负责核心产品体验设计，推动跨团队协作与设计落地\n建立组件规范，将设计交付效率提升 35%\n主导新版工作台改版，关键任务完成率提升 18%",
          ),
        ],
      },
      {
        id: "projects",
        type: "projects",
        title: "项目经历",
        visible: true,
        items: [
          entry(
            "project-1",
            "创作者工作台",
            "产品负责人",
            "2023/03",
            "2023/12",
            "梳理复杂创作流程并完成信息架构重构\n联合研发完成灰度发布与数据复盘\n项目获得年度最佳体验改进奖",
          ),
        ],
      },
      {
        id: "education",
        type: "education",
        title: "教育经历",
        visible: true,
        items: [
          entry(
            "education-1",
            "江南大学",
            "工业设计 · 本科",
            "2016/09",
            "2020/06",
            "主修产品设计、视觉传达与人机交互\n校级优秀毕业设计",
          ),
        ],
      },
    ],
  };
}

// ──────────────────────────────────────
// 模块级操作（按 moduleId 寻址）
// ──────────────────────────────────────

/** 查找模块在 modules 数组中的索引。 */
function findModuleIndex(
  resume: ResumeDocument,
  moduleId: string,
): number {
  return resume.modules.findIndex((m) => m.id === moduleId);
}

/** 将模块向上/下移动一位。basics（索引 0）不可移动，任何模块不可移到 basics 之前。 */
export function moveModule(
  resume: ResumeDocument,
  moduleId: string,
  direction: -1 | 1,
): ResumeDocument {
  const index = findModuleIndex(resume, moduleId);
  if (index < 0) return resume;
  const nextIndex = index + direction;
  if (index <= 0 || nextIndex <= 0 || nextIndex >= resume.modules.length)
    return resume;
  const modules = [...resume.modules];
  [modules[index], modules[nextIndex]] = [modules[nextIndex], modules[index]];
  return touch({ ...resume, modules });
}

/** 按数组索引重排模块。basics（索引 0）不可移动，任何模块不可移到索引 0。 */
export function reorderModule(
  resume: ResumeDocument,
  fromIndex: number,
  toIndex: number,
): ResumeDocument {
  const modules = [...resume.modules];
  if (
    fromIndex <= 0 ||
    toIndex <= 0 ||
    fromIndex >= modules.length ||
    toIndex >= modules.length ||
    fromIndex === toIndex
  )
    return resume;
  const [moved] = modules.splice(fromIndex, 1);
  modules.splice(toIndex, 0, moved);
  return touch({ ...resume, modules });
}

/** 切换模块可见性。basics 不可隐藏。 */
export function toggleModule(
  resume: ResumeDocument,
  moduleId: string,
): ResumeDocument {
  const found = resume.modules.find((m) => m.id === moduleId);
  if (!found || found.type === "basics") return resume;
  return touch({
    ...resume,
    modules: resume.modules.map((m) =>
      m.id === moduleId ? { ...m, visible: !m.visible } as ResumeModule : m,
    ),
  });
}

/** 新建自定义模块并追加到模块列表末尾。 */
export function addCustomModule(
  resume: ResumeDocument,
  id?: string,
  title?: string,
): ResumeDocument {
  const customCount = resume.modules.filter(
    (m) => m.type === "custom",
  ).length;
  const newModule: CustomResumeModule = {
    id: id ?? crypto.randomUUID(),
    type: "custom",
    title: title ?? `自定义 ${customCount + 1}`,
    visible: true,
    items: [],
  };
  return touch({ ...resume, modules: [...resume.modules, newModule] });
}

/** 删除自定义模块。固定模块不可删除。 */
export function removeCustomModule(
  resume: ResumeDocument,
  moduleId: string,
): ResumeDocument {
  const found = resume.modules.find((m) => m.id === moduleId);
  if (!found || found.type !== "custom") return resume;
  return touch({
    ...resume,
    modules: resume.modules.filter((m) => m.id !== moduleId),
  });
}

/** 重命名任意模块。空名称时回退到模块默认名称。 */
export function renameModule(
  resume: ResumeDocument,
  moduleId: string,
  title: string,
): ResumeDocument {
  const fallbackTitle = (() => {
    const m = resume.modules.find((m) => m.id === moduleId);
    return m?.title ?? "未命名模块";
  })();
  return touch({
    ...resume,
    modules: resume.modules.map((m) =>
      m.id === moduleId
        ? ({ ...m, title: title.trim() || fallbackTitle } as ResumeModule)
        : m,
    ),
  });
}

// ──────────────────────────────────────
// 自定义模块条目操作
// ──────────────────────────────────────

/** 向自定义模块添加条目。 */
export function addCustomEntry(
  resume: ResumeDocument,
  moduleId: string,
  entryId?: string,
): ResumeDocument {
  const newEntry: CustomResumeEntry = {
    id: entryId ?? crypto.randomUUID(),
    title: "新的自定义项目",
    subtitle: "",
    startDate: "",
    endDate: "",
    description: "",
    visible: true,
  };
  return touch({
    ...resume,
    modules: resume.modules.map((m) =>
      m.id === moduleId && m.type === "custom"
        ? { ...m, items: [...m.items, newEntry] }
        : m,
    ),
  });
}

/** 从自定义模块删除条目。 */
export function removeCustomEntry(
  resume: ResumeDocument,
  moduleId: string,
  entryId: string,
): ResumeDocument {
  return touch({
    ...resume,
    modules: resume.modules.map((m) =>
      m.id === moduleId && m.type === "custom"
        ? { ...m, items: m.items.filter((e) => e.id !== entryId) }
        : m,
    ),
  });
}

/** 移动自定义模块内条目的位置。 */
export function moveCustomEntry(
  resume: ResumeDocument,
  moduleId: string,
  entryId: string,
  direction: -1 | 1,
): ResumeDocument {
  return touch({
    ...resume,
    modules: resume.modules.map((m) => {
      if (m.id !== moduleId || m.type !== "custom") return m;
      const items = [...m.items];
      const index = items.findIndex((e) => e.id === entryId);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= items.length) return m;
      [items[index], items[next]] = [items[next], items[index]];
      return { ...m, items };
    }),
  });
}

/** 更新自定义模块条目的字段。 */
export function updateCustomEntry(
  resume: ResumeDocument,
  moduleId: string,
  entryId: string,
  patch: Partial<CustomResumeEntry>,
): ResumeDocument {
  return touch({
    ...resume,
    modules: resume.modules.map((m) =>
      m.id === moduleId && m.type === "custom"
        ? {
            ...m,
            items: m.items.map((e) =>
              e.id === entryId ? { ...e, ...patch } : e,
            ),
          }
        : m,
    ),
  });
}

/** 切换自定义模块条目的可见性。 */
export function toggleCustomEntry(
  resume: ResumeDocument,
  moduleId: string,
  entryId: string,
): ResumeDocument {
  return touch({
    ...resume,
    modules: resume.modules.map((m) =>
      m.id === moduleId && m.type === "custom"
        ? {
            ...m,
            items: m.items.map((e) =>
              e.id === entryId ? { ...e, visible: !e.visible } : e,
            ),
          }
        : m,
    ),
  });
}

// ──────────────────────────────────────
// 通用工具
// ──────────────────────────────────────

/** 更新时间戳，工厂方法中已调用，外部通常无需直接使用。 */
export function touch(resume: ResumeDocument): ResumeDocument {
  return { ...resume, updatedAt: new Date().toISOString() };
}
