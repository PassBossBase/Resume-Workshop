import { describe, expect, it } from "vitest";
import {
  addCustomEntry,
  addCustomModule,
  createDefaultResume,
  moveCustomEntry,
  moveModule,
  parseAndMigrateResume,
  removeCustomEntry,
  removeCustomModule,
  renameModule,
  reorderModule,
  resumeDocumentSchema,
  toggleCustomEntry,
  toggleModule,
  updateCustomEntry,
  type CustomResumeModule,
} from "./resume-model";

describe("resume model", () => {
  // ── v2 默认简历 ──────────────────────────────

  it("creates a valid v2 resume with the five core modules", () => {
    const resume = createDefaultResume("resume-1", "前端工程师简历");

    expect(resumeDocumentSchema.parse(resume)).toEqual(resume);
    expect(resume.version).toBe(2);
    expect(resume.modules.map((module) => module.type)).toEqual([
      "basics",
      "skills",
      "work",
      "projects",
      "education",
    ]);
  });

  // ── v1 → v2 迁移 ────────────────────────────

  it("migrates a v1 resume to v2 without losing data", () => {
    const v1 = {
      version: 1 as const,
      id: "v1-resume",
      title: "旧版简历",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      templateId: "classic" as const,
      styles: {
        accent: "#3f57e8",
        fontFamily: "sans" as const,
        fontSize: 15,
        lineHeight: 1.55,
        pageMargin: 36,
        sectionGap: 28,
      },
      modules: [
        {
          id: "basics", type: "basics" as const, title: "基本信息", visible: true,
          basics: { name: "测试", role: "", status: "", birthday: "", email: "", phone: "", location: "", website: "", avatar: "" },
          items: [],
        },
        {
          id: "skills", type: "skills" as const, title: "专业技能", visible: true,
          items: [{ id: "s1", title: "技能", subtitle: "", startDate: "", endDate: "", location: "", description: "" }],
        },
        {
          id: "work", type: "work" as const, title: "工作经历", visible: true,
          items: [],
        },
        {
          id: "projects", type: "projects" as const, title: "项目经历", visible: true,
          items: [],
        },
        {
          id: "education", type: "education" as const, title: "教育经历", visible: true,
          items: [],
        },
      ],
    };

    const v2 = parseAndMigrateResume(v1);

    expect(v2.version).toBe(2);
    expect(v2.id).toBe("v1-resume");
    expect(v2.title).toBe("旧版简历");
    expect(v2.modules).toHaveLength(5);
    expect(v2.modules[0].type).toBe("basics");
    // skills 模块的数据完整保留
    const skills = v2.modules.find((m) => m.type === "skills");
    expect(skills?.items).toHaveLength(1);
    expect(skills?.items[0].title).toBe("技能");
  });

  it("rejects data that is neither v1 nor v2", () => {
    expect(() => parseAndMigrateResume({ version: 3 })).toThrow();
    expect(() => parseAndMigrateResume(null)).toThrow();
    expect(() => parseAndMigrateResume("invalid")).toThrow();
  });

  it("round-trips a v2 resume through parseAndMigrateResume", () => {
    const resume = createDefaultResume("round-trip");
    const parsed = parseAndMigrateResume(resume);
    expect(parsed).toEqual(resume);
  });

  // ── 模块移动与排序（按 moduleId 寻址） ──────

  it("moves a module without losing module data", () => {
    const resume = createDefaultResume("resume-1");
    const moved = moveModule(resume, "projects", -1);

    expect(moved.modules.map((module) => module.type)).toEqual([
      "basics",
      "skills",
      "projects",
      "work",
      "education",
    ]);
    expect(
      moved.modules.find((module) => module.type === "projects")?.items,
    ).toEqual(
      resume.modules.find((module) => module.type === "projects")?.items,
    );
  });

  it("does not move basics module", () => {
    const resume = createDefaultResume("resume-1");
    expect(moveModule(resume, "basics", 1).modules[0].type).toBe("basics");
    expect(moveModule(resume, "basics", -1).modules[0].type).toBe("basics");
  });

  it("does not move any module into the basics position", () => {
    const resume = createDefaultResume("resume-1");
    // skills is at index 1; moving up (direction -1) would go to index 0 → blocked
    const moved = moveModule(resume, "skills", -1);
    expect(moved.modules[0].type).toBe("basics");
  });

  it("reorders modules by index while protecting basics", () => {
    const resume = createDefaultResume("resume-1");
    const reordered = reorderModule(resume, 3, 2);
    expect(reordered.modules.map((m) => m.type)).toEqual([
      "basics",
      "skills",
      "projects",
      "work",
      "education",
    ]);
  });

  it("blocks reorder involving index 0", () => {
    const resume = createDefaultResume("resume-1");
    expect(reorderModule(resume, 0, 2).modules[0].type).toBe("basics");
    expect(reorderModule(resume, 2, 0).modules[0].type).toBe("basics");
  });

  // ── 模块显隐 ────────────────────────────────

  it("toggles optional modules but keeps basic information visible", () => {
    const resume = createDefaultResume("resume-1");

    expect(toggleModule(resume, "skills").modules[1].visible).toBe(false);
    // basics 不可隐藏
    expect(toggleModule(resume, "basics").modules[0].visible).toBe(true);
  });

  // ── 自定义模块 ──────────────────────────────

  it("adds a custom module with auto-generated name", () => {
    const resume = createDefaultResume("resume-1");
    const updated = addCustomModule(resume);

    expect(updated.modules).toHaveLength(6);
    const custom = updated.modules[5] as CustomResumeModule;
    expect(custom.type).toBe("custom");
    expect(custom.title).toBe("自定义 1");
    expect(custom.visible).toBe(true);
    expect(custom.items).toEqual([]);
  });

  it("adds multiple custom modules with sequential names", () => {
    const resume = createDefaultResume("resume-1");
    const a = addCustomModule(resume);
    const b = addCustomModule(a);

    expect(b.modules).toHaveLength(7);
    expect((b.modules[5] as CustomResumeModule).title).toBe("自定义 1");
    expect((b.modules[6] as CustomResumeModule).title).toBe("自定义 2");
  });

  it("removes a custom module", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "custom-1");
    expect(withCustom.modules).toHaveLength(6);

    const removed = removeCustomModule(withCustom, "custom-1");
    expect(removed.modules).toHaveLength(5);
  });

  it("does not remove a fixed module", () => {
    const resume = createDefaultResume("resume-1");
    expect(removeCustomModule(resume, "skills").modules).toHaveLength(5);
  });

  it("renames a module", () => {
    const resume = createDefaultResume("resume-1");
    const renamed = renameModule(resume, "skills", "核心能力");
    expect(renamed.modules[1].title).toBe("核心能力");
  });

  it("falls back to existing title when renaming to empty string", () => {
    const resume = createDefaultResume("resume-1");
    const renamed = renameModule(resume, "work", "   ");
    expect(renamed.modules[2].title).toBe("工作经历");
  });

  // ── 自定义模块条目 ──────────────────────────

  it("adds an entry to a custom module", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "c1");
    const withEntry = addCustomEntry(withCustom, "c1", "e1");

    const custom = withEntry.modules.find((m) => m.id === "c1") as CustomResumeModule;
    expect(custom.items).toHaveLength(1);
    expect(custom.items[0].title).toBe("新的自定义项目");
    expect(custom.items[0].visible).toBe(true);
  });

  it("removes an entry from a custom module", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "c1");
    const withEntry = addCustomEntry(withCustom, "c1", "e1");
    expect(withEntry.modules.find((m) => m.id === "c1")!.items).toHaveLength(1);

    const removed = removeCustomEntry(withEntry, "c1", "e1");
    expect(removed.modules.find((m) => m.id === "c1")!.items).toHaveLength(0);
  });

  it("moves a custom entry", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "c1");
    const a = addCustomEntry(withCustom, "c1", "e1");
    const b = addCustomEntry(a, "c1", "e2");

    const moved = moveCustomEntry(b, "c1", "e1", 1);
    const custom = moved.modules.find((m) => m.id === "c1") as CustomResumeModule;
    expect(custom.items[0].id).toBe("e2");
    expect(custom.items[1].id).toBe("e1");
  });

  it("does not move entry out of bounds", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "c1");
    const withEntry = addCustomEntry(withCustom, "c1", "e1");

    const movedUp = moveCustomEntry(withEntry, "c1", "e1", -1);
    expect(movedUp.modules.find((m) => m.id === "c1")!.items).toHaveLength(1);

    const movedDown = moveCustomEntry(withEntry, "c1", "e1", 1);
    expect(movedDown.modules.find((m) => m.id === "c1")!.items).toHaveLength(1);
  });

  it("updates a custom entry", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "c1");
    const withEntry = addCustomEntry(withCustom, "c1", "e1");

    const updated = updateCustomEntry(withEntry, "c1", "e1", {
      title: "新的标题",
      subtitle: "副标题",
    });
    const custom = updated.modules.find((m) => m.id === "c1") as CustomResumeModule;
    expect(custom.items[0].title).toBe("新的标题");
    expect(custom.items[0].subtitle).toBe("副标题");
  });

  it("toggles custom entry visibility", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "c1");
    const withEntry = addCustomEntry(withCustom, "c1", "e1");

    const hidden = toggleCustomEntry(withEntry, "c1", "e1");
    const custom = hidden.modules.find((m) => m.id === "c1") as CustomResumeModule;
    expect(custom.items[0].visible).toBe(false);

    const shown = toggleCustomEntry(hidden, "c1", "e1");
    const custom2 = shown.modules.find((m) => m.id === "c1") as CustomResumeModule;
    expect(custom2.items[0].visible).toBe(true);
  });

  it("does not modify fixed module entries via custom entry operations", () => {
    const resume = createDefaultResume("resume-1");
    // 对固定模块调用自定义条目操作应无效果
    const unchanged = addCustomEntry(resume, "work", "e1");
    expect(unchanged).toEqual(touch(resume));
  });

  // ── v2 Schema 约束 ─────────────────────────

  it("rejects a v2 document without basics as the first module", () => {
    const resume = createDefaultResume("resume-1");
    const modules = [...resume.modules];
    // swap basics out of position 0
    [modules[0], modules[1]] = [modules[1], modules[0]];
    const invalid = { ...resume, modules };

    expect(resumeDocumentSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a v2 document with duplicate fixed modules", () => {
    const resume = createDefaultResume("resume-1");
    const invalid = {
      ...resume,
      modules: [...resume.modules, resume.modules[1]], // duplicate skills
    };

    expect(resumeDocumentSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts a v2 document with custom modules", () => {
    const resume = createDefaultResume("resume-1");
    const withCustom = addCustomModule(resume, "custom-1");
    const withAnother = addCustomModule(withCustom, "custom-2");

    expect(resumeDocumentSchema.safeParse(withAnother).success).toBe(true);
  });
});

/** 独立 touch 导入用于测试不变性 */
import { touch } from "./resume-model";
