import { describe, expect, it } from "vitest";
import {
  createDefaultResume,
  moveModule,
  resumeDocumentSchema,
  toggleModule,
} from "./resume-model";

describe("resume model", () => {
  it("creates a valid versioned resume with the five core modules", () => {
    const resume = createDefaultResume("resume-1", "前端工程师简历");

    expect(resumeDocumentSchema.parse(resume)).toEqual(resume);
    expect(resume.version).toBe(1);
    expect(resume.modules.map((module) => module.type)).toEqual([
      "basics",
      "skills",
      "work",
      "projects",
      "education",
    ]);
  });

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
    expect(moved.modules.find((module) => module.type === "projects")?.items).toEqual(
      resume.modules.find((module) => module.type === "projects")?.items,
    );
  });

  it("toggles optional modules but keeps basic information visible", () => {
    const resume = createDefaultResume("resume-1");

    expect(toggleModule(resume, "skills").modules[1].visible).toBe(false);
    expect(toggleModule(resume, "basics").modules[0].visible).toBe(true);
  });
});
