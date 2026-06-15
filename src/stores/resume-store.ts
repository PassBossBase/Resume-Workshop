"use client";

/**
 * 简历编辑器核心状态管理。基于 Zustand，统一管理当前简历数据、
 * 模块增删改查、样式调整及保存状态。
 */
import { create } from "zustand";
import {
  moveModule,
  reorderModule,
  toggleModule,
  touch,
  type ModuleType,
  type ResumeDocument,
  type ResumeEntry,
} from "@/features/resume-model/resume-model";

type BasicKey = keyof NonNullable<ResumeDocument["modules"][number]["basics"]>;
type StyleKey = keyof ResumeDocument["styles"];

interface ResumeState {
  resume?: ResumeDocument;
  activeModule: ModuleType;
  saveState: "idle" | "saving" | "saved" | "error" | "conflict";
  load: (resume: ResumeDocument) => void;
  setActiveModule: (type: ModuleType) => void;
  setSaveState: (state: ResumeState["saveState"]) => void;
  rename: (title: string) => void;
  updateBasic: (key: BasicKey, value: string) => void;
  updateEntry: (
    type: Exclude<ModuleType, "basics">,
    id: string,
    patch: Partial<ResumeEntry>,
  ) => void;
  addEntry: (type: Exclude<ModuleType, "basics">) => void;
  removeEntry: (type: Exclude<ModuleType, "basics">, id: string) => void;
  moveEntry: (
    type: Exclude<ModuleType, "basics">,
    id: string,
    direction: -1 | 1,
  ) => void;
  toggleModule: (type: ModuleType) => void;
  moveModule: (type: ModuleType, direction: -1 | 1) => void;
  reorderModule: (fromIndex: number, toIndex: number) => void;
  updateStyle: <K extends StyleKey>(
    key: K,
    value: ResumeDocument["styles"][K],
  ) => void;
}

const entryTitles: Record<Exclude<ModuleType, "basics">, string> = {
  skills: "新的技能分组",
  work: "新的工作经历",
  projects: "新的项目经历",
  education: "新的教育经历",
};

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
    activeModule: "basics",
    saveState: "idle",
    load: (resume) => set({ resume, activeModule: "basics", saveState: "idle" }),
    setActiveModule: (activeModule) => set({ activeModule }),
    setSaveState: (saveState) => set({ saveState }),

    rename: (title) =>
      applyResume((resume) => ({ ...resume, title })),

    updateBasic: (key, value) =>
      applyResume((resume) => ({
        ...resume,
        modules: resume.modules.map((module) =>
          module.type === "basics" && module.basics
            ? { ...module, basics: { ...module.basics, [key]: value } }
            : module,
        ),
      })),

    updateEntry: (type, id, patch) =>
      applyResume((resume) => ({
        ...resume,
        modules: resume.modules.map((module) =>
          module.type === type
            ? {
                ...module,
                items: module.items.map((item) =>
                  item.id === id ? { ...item, ...patch } : item,
                ),
              }
            : module,
        ),
      })),

    addEntry: (type) =>
      applyResume((resume) => {
        const newEntry: ResumeEntry = {
          id: crypto.randomUUID(),
          title: entryTitles[type],
          subtitle: "",
          startDate: "",
          endDate: "",
          location: "",
          description: "",
        };
        return {
          ...resume,
          modules: resume.modules.map((module) =>
            module.type === type
              ? { ...module, items: [...module.items, newEntry] }
              : module,
          ),
        };
      }),

    removeEntry: (type, id) =>
      applyResume((resume) => ({
        ...resume,
        modules: resume.modules.map((module) =>
          module.type === type
            ? {
                ...module,
                items: module.items.filter((item) => item.id !== id),
              }
            : module,
        ),
      })),

    moveEntry: (type, id, direction) =>
      applyResume((resume) => ({
        ...resume,
        modules: resume.modules.map((module) => {
          if (module.type !== type) return module;
          const items = [...module.items];
          const index = items.findIndex((item) => item.id === id);
          const next = index + direction;
          if (index < 0 || next < 0 || next >= items.length) return module;
          [items[index], items[next]] = [items[next], items[index]];
          return { ...module, items };
        }),
      })),

    toggleModule: (type) =>
      set((state) => ({
        resume: state.resume ? toggleModule(state.resume, type) : undefined,
      })),

    moveModule: (type, direction) =>
      set((state) => ({
        resume: state.resume ? moveModule(state.resume, type, direction) : undefined,
      })),

    reorderModule: (fromIndex, toIndex) =>
      set((state) => ({
        resume: state.resume ? reorderModule(state.resume, fromIndex, toIndex) : undefined,
      })),

    updateStyle: (key, value) =>
      applyResume((resume) => ({
        ...resume,
        styles: { ...resume.styles, [key]: value },
      })),
  };
});
