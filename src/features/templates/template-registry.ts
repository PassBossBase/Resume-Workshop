/**
 * 模板注册表 —— 将 templateId 映射到渲染组件和元数据。
 *
 * 每个布局渲染器在此注册，模板画廊和预览面板通过本表查找正确的渲染组件。
 */
import type { FC } from "react";
import type { TemplateId } from "@/features/resume-model/resume-model";
import type { ResumePageData } from "./resume-pages";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import type { AppLocale } from "@/lib/locale";

/** 所有模板页面渲染组件必须遵循的 Props 接口 */
export interface TemplatePageProps {
  resume: ResumeDocument;
  page: ResumePageData;
  locale?: AppLocale;
  pageRef?: (node: HTMLDivElement | null) => void;
}

/** 模板注册条目 */
export interface TemplateEntry {
  id: TemplateId;
  name: string;
  description: string;
  /** React 组件，使用 React.memo 包裹 */
  component: FC<TemplatePageProps>;
}

const registry = new Map<TemplateId, TemplateEntry>();

/** 注册一个模板渲染器 */
export function registerTemplate(entry: TemplateEntry): void {
  registry.set(entry.id, entry);
}

/** 获取指定 templateId 的注册信息 */
export function getTemplate(id: TemplateId): TemplateEntry | undefined {
  return registry.get(id);
}

/** 获取全部已注册模板 */
export function listTemplates(): TemplateEntry[] {
  return Array.from(registry.values());
}

/** 获取默认模板 ID（经典单栏） */
export function getDefaultTemplateId(): TemplateId {
  return "classic";
}
