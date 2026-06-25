"use client";

/**
 * 简历编辑器核心状态管理。基于 Zustand，统一管理当前简历数据、
 * 模块增删改查、样式调整及保存状态。
 *
 * v2 变更：activeModule 改为 activeModuleId（按模块 ID 寻址），
 * 支持自定义模块的创建、删除、重命名和条目管理。
 */
import { create } from "zustand";
import {
  addCustomEntry,
  addCustomModule,
  applyTemplateLayout,
  moveCustomEntry,
  moveModule,
  removeCustomEntry,
  removeCustomModule,
  renameModule,
  reorderModule,
  toggleCustomEntry,
  toggleModule,
  touch,
  updateCustomEntry,
  updateEntryStyle,
  updateLayoutConfig,
  updateModuleMeta,
  type CustomResumeEntry,
  type EntryStyle,
  type LayoutConfig,
  type ResumeDocument,
  type ResumeEntry,
  type ResumeModule,
  type BasicsData,
} from "@/features/resume-model/resume-model";

type BasicKey = keyof NonNullable<ResumeDocument["modules"][number] extends { basics?: infer B } ? B : never>;
type StyleKey = keyof ResumeDocument["styles"];

/** 固定模块新建条目时的默认标题。 */
const entryTitles: Record<string, string> = {
  skills: "新的技能分组",
  work: "新的工作经历",
  projects: "新的项目经历",
  education: "新的教育经历",
};

interface ResumeState {
  resume?: ResumeDocument;
  /** 当前活动模块 ID，默认 "basics"。 */
  activeModuleId: string;
  saveState: "idle" | "saving" | "saved" | "error" | "conflict";

  // 文档级
  load: (resume: ResumeDocument) => void;
  setActiveModule: (moduleId: string) => void;
  setSaveState: (state: ResumeState["saveState"]) => void;
  rename: (title: string) => void;

  // 基本信息（固定操作 basics 模块）
  updateBasic: (key: BasicKey, value: string) => void;
  updateBasicsField: (patch: Partial<BasicsData>) => void;

  // 固定模块条目操作（按 moduleId 寻址）
  updateEntry: (moduleId: string, entryId: string, patch: Partial<ResumeEntry>) => void;
  addEntry: (moduleId: string) => void;
  removeEntry: (moduleId: string, entryId: string) => void;
  moveEntry: (moduleId: string, entryId: string, direction: -1 | 1) => void;

  // 自定义模块条目操作
  updateCustomEntry: (moduleId: string, entryId: string, patch: Partial<CustomResumeEntry>) => void;
  addCustomEntry: (moduleId: string) => void;
  removeCustomEntry: (moduleId: string, entryId: string) => void;
  moveCustomEntry: (moduleId: string, entryId: string, direction: -1 | 1) => void;
  toggleCustomEntry: (moduleId: string, entryId: string) => void;

  // 模块级操作（按 moduleId 寻址）
  toggleModule: (moduleId: string) => void;
  moveModule: (moduleId: string, direction: -1 | 1) => void;
  reorderModule: (fromIndex: number, toIndex: number) => void;

  // 自定义模块生命周期
  addCustomModule: () => void;
  removeCustomModule: (moduleId: string) => void;
  renameModule: (moduleId: string, title: string) => void;

  // 样式
  updateStyle: <K extends StyleKey>(key: K, value: ResumeDocument["styles"][K]) => void;
  applyTemplateLayout: (templateResume: ResumeDocument) => void;

  // v3 新增
  updateLayoutConfig: (patch: Partial<LayoutConfig>) => void;
  updateModuleMeta: (moduleId: string, patch: { sectionIcon?: string }) => void;
  updateEntryStyle: (moduleId: string, entryId: string, style: EntryStyle | undefined) => void;
}

export const useResumeStore = create<ResumeState>((set) => {
  /**
   * 消除所有 mutation 方法中重复的空值守卫与 touch 调用样板代码。
   * 包装一个纯变换函数，每个 action 只需表达"改了什么"即可。
   */
  function applyResume(update: (resume: ResumeDocument) => ResumeDocument) {
    set((state) => {
      if (!state.resume) return state;
      return { resume: touch(update(state.resume)) };
    });
  }

  return {
    activeModuleId: "basics",
    saveState: "idle",

    load: (resume) => set({ resume, activeModuleId: "basics", saveState: "idle" }),
    setActiveModule: (activeModuleId) => set({ activeModuleId }),
    setSaveState: (saveState) => set({ saveState }),

    rename: (title) =>
      applyResume((resume) => ({ ...resume, title })),

    // ── 基本信息 ──────────────────────────────

    updateBasic: (key, value) =>
      applyResume((resume) => ({
        ...resume,
        modules: resume.modules.map((m) =>
          m.type === "basics" && m.basics
            ? ({ ...m, basics: { ...m.basics, [key]: value } } as ResumeModule)
            : m,
        ),
      })),

    updateBasicsField: (patch) =>
      applyResume((resume) => ({
        ...resume,
        modules: resume.modules.map((m) =>
          m.type === "basics" && m.basics
            ? ({ ...m, basics: { ...m.basics, ...patch } } as ResumeModule)
            : m,
        ),
      })),

    // ── 固定模块条目 ──────────────────────────

    updateEntry: (moduleId, entryId, patch) =>
      applyResume((resume) => {
        const mod = resume.modules.find((m) => m.id === moduleId);
        if (!mod || mod.type === "basics" || mod.type === "custom") return resume;

        return {
          ...resume,
          modules: resume.modules.map((m) =>
            m.id === moduleId
              ? ({
                  ...m,
                  items: m.items.map((item) =>
                    item.id === entryId ? { ...item, ...patch } as ResumeEntry : item,
                  ),
                } as ResumeModule)
              : m,
          ),
        };
      }),

    addEntry: (moduleId) =>
      applyResume((resume) => {
        const mod = resume.modules.find((m) => m.id === moduleId);
        if (!mod || mod.type === "basics") return resume;

        if (mod.type === "custom") {
          return addCustomEntry(resume, moduleId);
        }

        const newEntry: ResumeEntry = {
          id: crypto.randomUUID(),
          title: entryTitles[mod.type] ?? "新条目",
          subtitle: "",
          startDate: "",
          endDate: "",
          description: "",
        };
        return {
          ...resume,
          modules: resume.modules.map((m) =>
            m.id === moduleId
              ? ({ ...m, items: [...m.items, newEntry] } as ResumeModule)
              : m,
          ),
        };
      }),

    removeEntry: (moduleId, entryId) =>
      applyResume((resume) => {
        const mod = resume.modules.find((m) => m.id === moduleId);
        if (!mod || mod.type === "basics" || mod.type === "custom") return resume;

        return {
          ...resume,
          modules: resume.modules.map((m) =>
            m.id === moduleId
              ? ({
                  ...m,
                  items: m.items.filter((item) => item.id !== entryId),
                } as ResumeModule)
              : m,
          ),
        };
      }),

    moveEntry: (moduleId, entryId, direction) =>
      applyResume((resume) => {
        const mod = resume.modules.find((m) => m.id === moduleId);
        if (!mod || mod.type === "basics" || mod.type === "custom") return resume;

        return {
          ...resume,
          modules: resume.modules.map((m) => {
            if (m.id !== moduleId) return m;
            const items = [...m.items];
            const index = items.findIndex((item) => item.id === entryId);
            const next = index + direction;
            if (index < 0 || next < 0 || next >= items.length) return m;
            [items[index], items[next]] = [items[next], items[index]];
            return { ...m, items } as ResumeModule;
          }),
        };
      }),

    // ── 自定义模块条目 ────────────────────────

    updateCustomEntry: (moduleId, entryId, patch) =>
      applyResume((resume) => updateCustomEntry(resume, moduleId, entryId, patch)),

    addCustomEntry: (moduleId) =>
      applyResume((resume) => addCustomEntry(resume, moduleId)),

    removeCustomEntry: (moduleId, entryId) =>
      applyResume((resume) => removeCustomEntry(resume, moduleId, entryId)),

    moveCustomEntry: (moduleId, entryId, direction) =>
      applyResume((resume) => moveCustomEntry(resume, moduleId, entryId, direction)),

    toggleCustomEntry: (moduleId, entryId) =>
      applyResume((resume) => toggleCustomEntry(resume, moduleId, entryId)),

    // ── 模块级操作 ────────────────────────────

    toggleModule: (moduleId) =>
      set((state) => ({
        resume: state.resume ? toggleModule(state.resume, moduleId) : undefined,
      })),

    moveModule: (moduleId, direction) =>
      set((state) => ({
        resume: state.resume ? moveModule(state.resume, moduleId, direction) : undefined,
      })),

    reorderModule: (fromIndex, toIndex) =>
      set((state) => ({
        resume: state.resume ? reorderModule(state.resume, fromIndex, toIndex) : undefined,
      })),

    // ── 自定义模块生命周期 ────────────────────

    addCustomModule: () =>
      set((state) => {
        if (!state.resume) return state;
        const updated = addCustomModule(state.resume);
        // 找到新创建的模块 ID（最后一个 custom 模块）
        const newModule = [...updated.modules].reverse().find((m) => m.type === "custom");
        return {
          resume: updated,
          activeModuleId: newModule?.id ?? state.activeModuleId,
        };
      }),

    removeCustomModule: (moduleId) =>
      set((state) => {
        if (!state.resume) return state;
        const updated = removeCustomModule(state.resume, moduleId);
        // 如果删除的是当前活动模块，切换到相邻模块或 basics
        const nextActive =
          state.activeModuleId === moduleId
            ? findValidActiveAfterDelete(state.resume, moduleId)
            : state.activeModuleId;
        return { resume: updated, activeModuleId: nextActive };
      }),

    renameModule: (moduleId, title) =>
      applyResume((resume) => renameModule(resume, moduleId, title)),

    // ── 样式 ──────────────────────────────────

    updateStyle: (key, value) =>
      applyResume((resume) => ({
        ...resume,
        styles: { ...resume.styles, [key]: value },
      })),

    applyTemplateLayout: (templateResume) =>
      applyResume((resume) => applyTemplateLayout(resume, templateResume)),

    // ── v3 新增 ───────────────────────────────

    updateLayoutConfig: (patch) =>
      applyResume((resume) => updateLayoutConfig(resume, patch)),

    updateModuleMeta: (moduleId, patch) =>
      applyResume((resume) => updateModuleMeta(resume, moduleId, patch)),

    updateEntryStyle: (moduleId, entryId, style) =>
      applyResume((resume) => updateEntryStyle(resume, moduleId, entryId, style)),
  };
});

/**
 * 删除模块后选择一个有效的新活动模块。
 * 优先选择相邻模块，最后回退到 basics。
 */
function findValidActiveAfterDelete(
  resume: ResumeDocument,
  deletedModuleId: string,
): string {
  const index = resume.modules.findIndex((m) => m.id === deletedModuleId);
  if (index < 0) return "basics";
  // 优先选后一个，没有后一个则选前一个，都没有则 basics
  const next = resume.modules[index + 1];
  if (next) return next.id;
  const prev = resume.modules[index - 1];
  if (prev) return prev.id;
  return "basics";
}
