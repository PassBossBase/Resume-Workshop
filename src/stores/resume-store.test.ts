import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { useResumeStore } from "./resume-store";

describe("resume editor store", () => {
  beforeEach(() => {
    useResumeStore.getState().load(createDefaultResume("store-resume"));
  });

  it("updates a basic field", () => {
    useResumeStore.getState().updateBasic("name", "周星野");

    const basics = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics")?.basics;
    expect(basics?.name).toBe("周星野");
  });

  it("adds and removes experience entries", () => {
    useResumeStore.getState().addEntry("work");
    const added = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "work")?.items.at(-1);

    expect(added?.title).toBe("新的工作经历");
    useResumeStore.getState().removeEntry("work", added!.id);
    expect(
      useResumeStore
        .getState()
        .resume?.modules.find((module) => module.type === "work")?.items,
    ).toHaveLength(1);
  });
});
