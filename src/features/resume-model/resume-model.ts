/**
 * 简历数据模型与 Zod schema —— 应用唯一的数据源。
 * 定义了 ResumeDocument 结构、5 个固定模块及所有校验规则。
 */
import { z } from "zod";
import { normalizeRichText } from "@/features/rich-text/rich-text";

export const moduleTypeSchema = z.enum([
  "basics",
  "skills",
  "work",
  "projects",
  "education",
]);

export type ModuleType = z.infer<typeof moduleTypeSchema>;

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

const resumeModuleSchema = z.object({
  id: z.string(),
  type: moduleTypeSchema,
  title: z.string(),
  visible: z.boolean(),
  basics: basicsSchema.optional(),
  items: z.array(entrySchema),
});

export type ResumeModule = z.infer<typeof resumeModuleSchema>;

export const resumeDocumentSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  templateId: z.literal("classic"),
  styles: z.object({
    accent: z.string(),
    fontFamily: z.enum(["sans", "serif", "rounded"]),
    fontSize: z.number().min(12).max(20),
    lineHeight: z.number().min(1.2).max(2),
    pageMargin: z.number().min(24).max(64),
    sectionGap: z.number().min(16).max(52),
  }),
  modules: z.array(resumeModuleSchema).length(5),
});

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;

const entry = (
  id: string,
  title: string,
  subtitle: string,
  startDate: string,
  endDate: string,
  description: string,
): ResumeEntry => ({
  id,
  title,
  subtitle,
  startDate,
  endDate,
  location: "",
  description: normalizeRichText(description),
});

export function createDefaultResume(
  id: string,
  title = "未命名简历",
): ResumeDocument {
  const now = new Date().toISOString();

  return {
    version: 1,
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

export function moveModule(
  resume: ResumeDocument,
  type: ModuleType,
  direction: -1 | 1,
): ResumeDocument {
  const modules = [...resume.modules];
  const index = modules.findIndex((module) => module.type === type);
  const nextIndex = index + direction;
  if (index <= 0 || nextIndex <= 0 || nextIndex >= modules.length) return resume;
  [modules[index], modules[nextIndex]] = [modules[nextIndex], modules[index]];
  return touch({ ...resume, modules });
}

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

export function toggleModule(
  resume: ResumeDocument,
  type: ModuleType,
): ResumeDocument {
  if (type === "basics") return resume;
  return touch({
    ...resume,
    modules: resume.modules.map((module) =>
      module.type === type ? { ...module, visible: !module.visible } : module,
    ),
  });
}

export function touch(resume: ResumeDocument): ResumeDocument {
  return { ...resume, updatedAt: new Date().toISOString() };
}
