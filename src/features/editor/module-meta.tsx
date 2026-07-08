import {
  BriefcaseBusiness,
  GraduationCap,
  Puzzle,
  Rocket,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ModuleType, ResumeModule } from "@/features/resume-model/resume-model";
import type { AppLocale } from "@/lib/locale";
import { getLocalizedModuleTypeLabel } from "@/features/templates/resume-display";

export interface ModuleMetaEntry {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const moduleMeta: Record<ModuleType, ModuleMetaEntry> = {
  basics: { label: "基本信息", color: "#8b5cf6", icon: UserRound },
  skills: { label: "专业技能", color: "#ff7a1a", icon: Sparkles },
  work: { label: "工作经历", color: "#ff4f91", icon: BriefcaseBusiness },
  projects: { label: "项目经历", color: "#3f57e8", icon: Rocket },
  education: { label: "教育经历", color: "#27c59a", icon: GraduationCap },
  custom: { label: "自定义", color: "#6366f1", icon: Puzzle },
};

/** 根据模块实例返回对应的元数据。自定义模块使用自身的 title 作为显示名。 */
export function getModuleMeta(
  module: ResumeModule,
  locale: AppLocale = "zh-CN",
): ModuleMetaEntry & { displayTitle: string } {
  const meta = moduleMeta[module.type];
  return {
    ...meta,
    label: getLocalizedModuleTypeLabel(module.type, locale),
    displayTitle:
      module.type === "custom"
        ? module.title
        : getLocalizedModuleTypeLabel(module.type, locale),
  };
}
