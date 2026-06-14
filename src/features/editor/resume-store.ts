"use client";

import { create } from "zustand";
import {
  moveModule,
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

export const useResumeStore = create<ResumeState>((set) => ({
  activeModule: "basics",
  saveState: "idle",
  load: (resume) => set({ resume, activeModule: "basics", saveState: "idle" }),
  setActiveModule: (activeModule) => set({ activeModule }),
  setSaveState: (saveState) => set({ saveState }),
  rename: (title) =>
    set((state) => ({
      resume: state.resume ? touch({ ...state.resume, title }) : undefined,
    })),
  updateBasic: (key, value) =>
    set((state) => {
      if (!state.resume) return state;
      return {
        resume: touch({
          ...state.resume,
          modules: state.resume.modules.map((module) =>
            module.type === "basics" && module.basics
              ? { ...module, basics: { ...module.basics, [key]: value } }
              : module,
          ),
        }),
      };
    }),
  updateEntry: (type, id, patch) =>
    set((state) => {
      if (!state.resume) return state;
      return {
        resume: touch({
          ...state.resume,
          modules: state.resume.modules.map((module) =>
            module.type === type
              ? {
                  ...module,
                  items: module.items.map((item) =>
                    item.id === id ? { ...item, ...patch } : item,
                  ),
                }
              : module,
          ),
        }),
      };
    }),
  addEntry: (type) =>
    set((state) => {
      if (!state.resume) return state;
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
        resume: touch({
          ...state.resume,
          modules: state.resume.modules.map((module) =>
            module.type === type
              ? { ...module, items: [...module.items, newEntry] }
              : module,
          ),
        }),
      };
    }),
  removeEntry: (type, id) =>
    set((state) => {
      if (!state.resume) return state;
      return {
        resume: touch({
          ...state.resume,
          modules: state.resume.modules.map((module) =>
            module.type === type
              ? {
                  ...module,
                  items: module.items.filter((item) => item.id !== id),
                }
              : module,
          ),
        }),
      };
    }),
  moveEntry: (type, id, direction) =>
    set((state) => {
      if (!state.resume) return state;
      return {
        resume: touch({
          ...state.resume,
          modules: state.resume.modules.map((module) => {
            if (module.type !== type) return module;
            const items = [...module.items];
            const index = items.findIndex((item) => item.id === id);
            const next = index + direction;
            if (index < 0 || next < 0 || next >= items.length) return module;
            [items[index], items[next]] = [items[next], items[index]];
            return { ...module, items };
          }),
        }),
      };
    }),
  toggleModule: (type) =>
    set((state) => ({
      resume: state.resume ? toggleModule(state.resume, type) : undefined,
    })),
  moveModule: (type, direction) =>
    set((state) => ({
      resume: state.resume ? moveModule(state.resume, type, direction) : undefined,
    })),
  updateStyle: (key, value) =>
    set((state) => ({
      resume: state.resume
        ? touch({
            ...state.resume,
            styles: { ...state.resume.styles, [key]: value },
          })
        : undefined,
    })),
}));
