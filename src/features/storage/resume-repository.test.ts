import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import {
  clearResumeDatabase,
  deleteResume,
  listResumes,
  loadResume,
  saveResume,
} from "./resume-repository";

describe("resume repository", () => {
  beforeEach(async () => {
    await clearResumeDatabase();
  });

  it("saves and restores a resume", async () => {
    const resume = createDefaultResume("saved-resume");
    await saveResume(resume);

    expect(await loadResume("saved-resume")).toEqual(resume);
    expect((await listResumes()).map((item) => item.id)).toEqual(["saved-resume"]);
  });

  it("deletes a resume from the cache", async () => {
    await saveResume(createDefaultResume("deleted-resume"));
    await deleteResume("deleted-resume");

    expect(await loadResume("deleted-resume")).toBeUndefined();
  });
});
