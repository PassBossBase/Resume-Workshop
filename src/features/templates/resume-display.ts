import type {
  BasicsData,
  ModuleType,
  ResumeModule,
} from "@/features/resume-model/resume-model";
import { getBasicDisplayItems } from "@/features/resume-model/resume-model";
import type { AppLocale } from "@/lib/locale";

type BasicDisplayItem = ReturnType<typeof getBasicDisplayItems>[number];

const fixedModuleLabels: Record<AppLocale, Record<ModuleType, string>> = {
  "zh-CN": {
    basics: "基本信息",
    skills: "专业技能",
    work: "工作经历",
    projects: "项目经历",
    education: "教育经历",
    custom: "自定义",
  },
  "en-US": {
    basics: "Basic Info",
    skills: "Skills",
    work: "Work Experience",
    projects: "Projects",
    education: "Education",
    custom: "Custom",
  },
};

const basicLabels = {
  "zh-CN": {
    name: "姓名",
    role: "职位",
    status: "状态",
    birthday: "生日",
    email: "邮箱",
    phone: "电话",
    location: "地址",
  },
  "en-US": {
    name: "Name",
    role: "Role",
    status: "Status",
    birthday: "Birthday",
    email: "Email",
    phone: "Phone",
    location: "Location",
  },
} as const;

export const personalInfoLabels: Record<AppLocale, string> = {
  "zh-CN": "个人信息",
  "en-US": "Personal Info",
};

export function getLocalizedBasicDisplayItems(
  basics: BasicsData | undefined,
  locale: AppLocale,
): BasicDisplayItem[] {
  const labels = basicLabels[locale];
  return getBasicDisplayItems(basics).map((item) => {
    if (!item.core) return item;
    const label = labels[item.key as keyof typeof labels] ?? item.label;
    return { ...item, label };
  });
}

export function getLocalizedModuleTitle(
  module: ResumeModule,
  locale: AppLocale,
): string {
  if (module.type === "custom") return module.title;
  return fixedModuleLabels[locale][module.type];
}

export function getLocalizedModuleTypeLabel(
  type: ModuleType,
  locale: AppLocale,
): string {
  return fixedModuleLabels[locale][type];
}
