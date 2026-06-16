import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import type { CustomResumeModule } from "@/features/resume-model/resume-model";
import { useResumeStore } from "./resume-store";

/** 辅助：从固定模块获取条目（带类型收窄） */
function getFixedItems(moduleId: string): { id: string; title: string }[] {
  const m = useResumeStore.getState().resume?.modules.find((mod) => mod.id === moduleId);
  if (!m || m.type === "custom" || m.type === "basics") return [];
  return m.items;
}

/** 辅助：从自定义模块获取条目 */
function getCustomModule(moduleId: string): CustomResumeModule | undefined {
  const m = useResumeStore.getState().resume?.modules.find((mod) => mod.id === moduleId);
  if (!m || m.type !== "custom") return undefined;
  return m;
}

describe("resume editor store", () => {
  beforeEach(() => {
    useResumeStore.getState().load(createDefaultResume("store-resume"));
  });

  it("updates a basic field", () => {
    useResumeStore.getState().updateBasic("name", "周星野");

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;
    expect(basics?.name).toBe("周星野");
  });

  it("adds and removes experience entries", () => {
    useResumeStore.getState().addEntry("work");
    const added = getFixedItems("work").at(-1);

    expect(added?.title).toBe("新的工作经历");
    useResumeStore.getState().removeEntry("work", added!.id);
    expect(getFixedItems("work")).toHaveLength(1);
  });

  it("updates a fixed-module entry field", () => {
    const entryId = getFixedItems("work")[0].id;

    useResumeStore.getState().updateEntry("work", entryId, { title: "新公司" });
    expect(getFixedItems("work")[0].title).toBe("新公司");
  });

  it("moves a fixed-module entry", () => {
    useResumeStore.getState().addEntry("work");
    const firstId = getFixedItems("work")[0].id;

    useResumeStore.getState().moveEntry("work", firstId, 1);
    expect(getFixedItems("work")[1].id).toBe(firstId);
  });

  // ── 自定义模块 ──────────────────────────────

  it("adds a custom module and sets it as active", () => {
    useResumeStore.getState().addCustomModule();
    const state = useResumeStore.getState();
    const custom = state.resume?.modules.find((m) => m.type === "custom");
    expect(custom).toBeDefined();
    expect(state.activeModuleId).toBe(custom!.id);
  });

  it("adds multiple custom modules each with unique IDs", () => {
    useResumeStore.getState().addCustomModule();
    useResumeStore.getState().addCustomModule();
    useResumeStore.getState().addCustomModule();

    const customs = useResumeStore
      .getState()
      .resume?.modules.filter((m) => m.type === "custom");
    expect(customs).toHaveLength(3);
    const ids = customs!.map((m) => m.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("removes a custom module and switches active to adjacent", () => {
    useResumeStore.getState().addCustomModule();
    const customId = useResumeStore.getState().activeModuleId;

    useResumeStore.getState().removeCustomModule(customId);
    const state = useResumeStore.getState();
    expect(state.resume?.modules.find((m) => m.id === customId)).toBeUndefined();
    expect(state.activeModuleId).toBeDefined();
    expect(state.resume?.modules.find((m) => m.id === state.activeModuleId)).toBeDefined();
  });

  it("renames a module via store", () => {
    useResumeStore.getState().renameModule("skills", "核心能力");
    const skills = useResumeStore
      .getState()
      .resume?.modules.find((m) => m.id === "skills");
    expect(skills?.title).toBe("核心能力");
  });

  it("toggles module visibility via moduleId", () => {
    expect(
      useResumeStore.getState().resume?.modules.find((m) => m.id === "skills")?.visible,
    ).toBe(true);

    useResumeStore.getState().toggleModule("skills");
    expect(
      useResumeStore.getState().resume?.modules.find((m) => m.id === "skills")?.visible,
    ).toBe(false);
  });

  it("moves a module via moduleId", () => {
    useResumeStore.getState().moveModule("projects", -1);
    const types = useResumeStore
      .getState()
      .resume?.modules.map((m) => m.type);
    expect(types).toEqual(["basics", "skills", "projects", "work", "education"]);
  });

  // ── 自定义模块条目 ──────────────────────────

  it("adds, updates, and removes custom entries", () => {
    useResumeStore.getState().addCustomModule();
    const customId = useResumeStore.getState().activeModuleId;

    // Add entry
    useResumeStore.getState().addCustomEntry(customId);
    const custom = getCustomModule(customId);
    expect(custom?.items).toHaveLength(1);
    expect(custom?.items[0].title).toBe("新的自定义项目");

    // Update entry
    const entryId = custom!.items[0].id;
    useResumeStore.getState().updateCustomEntry(customId, entryId, {
      title: "自定义标题",
      subtitle: "副标题",
    });
    const updated = getCustomModule(customId);
    expect(updated?.items[0].title).toBe("自定义标题");

    // Remove entry
    useResumeStore.getState().removeCustomEntry(customId, entryId);
    const afterRemove = getCustomModule(customId);
    expect(afterRemove?.items).toHaveLength(0);
  });

  it("toggles custom entry visibility", () => {
    useResumeStore.getState().addCustomModule();
    const customId = useResumeStore.getState().activeModuleId;
    useResumeStore.getState().addCustomEntry(customId);

    const entryId = getCustomModule(customId)!.items[0].id;

    useResumeStore.getState().toggleCustomEntry(customId, entryId);
    const hidden = getCustomModule(customId)!.items[0];
    expect(hidden.visible).toBe(false);
  });

  it("moves a custom entry", () => {
    useResumeStore.getState().addCustomModule();
    const customId = useResumeStore.getState().activeModuleId;
    useResumeStore.getState().addCustomEntry(customId);
    useResumeStore.getState().addCustomEntry(customId);

    const items = getCustomModule(customId)!.items;
    const firstId = items[0].id;

    useResumeStore.getState().moveCustomEntry(customId, firstId, 1);
    const after = getCustomModule(customId)!.items;
    expect(after[1].id).toBe(firstId);
  });

  // ── 活动模块切换 ────────────────────────────

  it("sets active module by ID", () => {
    useResumeStore.getState().setActiveModule("work");
    expect(useResumeStore.getState().activeModuleId).toBe("work");
  });

  it("resets active to basics on load", () => {
    useResumeStore.getState().setActiveModule("work");
    useResumeStore.getState().load(createDefaultResume("new-id"));
    expect(useResumeStore.getState().activeModuleId).toBe("basics");
  });

  // ── 样式 ────────────────────────────────────

  it("updates style values", () => {
    useResumeStore.getState().updateStyle("fontSize", 18);
    expect(useResumeStore.getState().resume?.styles.fontSize).toBe(18);
  });

  it("renames resume document title", () => {
    useResumeStore.getState().rename("我的简历");
    expect(useResumeStore.getState().resume?.title).toBe("我的简历");
  });

  it("does not add entry to basics module", () => {
    const before = useResumeStore
      .getState()
      .resume?.modules.find((m) => m.type === "basics")!.items.length;
    useResumeStore.getState().addEntry("basics");
    const after = useResumeStore
      .getState()
      .resume?.modules.find((m) => m.type === "basics")!.items.length;
    expect(after).toBe(before);
  });
});
