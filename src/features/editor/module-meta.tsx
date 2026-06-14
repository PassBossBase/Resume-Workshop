import {
  BriefcaseBusiness,
  GraduationCap,
  Rocket,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ModuleType } from "@/features/resume-model/resume-model";

export const moduleMeta: Record<
  ModuleType,
  { label: string; color: string; icon: typeof UserRound }
> = {
  basics: { label: "基本信息", color: "#8b5cf6", icon: UserRound },
  skills: { label: "专业技能", color: "#ff7a1a", icon: Sparkles },
  work: { label: "工作经历", color: "#ff4f91", icon: BriefcaseBusiness },
  projects: { label: "项目经历", color: "#3f57e8", icon: Rocket },
  education: { label: "教育经历", color: "#27c59a", icon: GraduationCap },
};
