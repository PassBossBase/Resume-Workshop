import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { EditorContent } from "./editor-content";
import { useResumeStore } from "./resume-store";

describe("EditorContent", () => {
  beforeEach(() => {
    useResumeStore.getState().load(createDefaultResume("editor-resume"));
  });

  it("updates the resume name from the basic information form", () => {
    render(<EditorContent />);
    fireEvent.change(screen.getByLabelText("姓名"), {
      target: { value: "周星野" },
    });

    expect(screen.getByDisplayValue("周星野")).toBeInTheDocument();
    expect(
      useResumeStore
        .getState()
        .resume?.modules.find((module) => module.type === "basics")?.basics?.name,
    ).toBe("周星野");
  });

  it("uses one rich text editor for the entire skills module", () => {
    useResumeStore.getState().setActiveModule("skills");
    render(<EditorContent />);

    expect(screen.getByLabelText("专业技能内容工具栏")).toBeInTheDocument();
    expect(screen.queryByText("条目 1")).not.toBeInTheDocument();
  });

  it("uses rich text and date controls for experience descriptions", () => {
    useResumeStore.getState().setActiveModule("work");
    render(<EditorContent />);

    expect(screen.getByLabelText("条目 1 描述工具栏")).toBeInTheDocument();
    expect(screen.getByLabelText("开始时间")).toBeInTheDocument();
    expect(screen.getByLabelText("选择开始时间")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设为至今" })).toBeInTheDocument();
  });
});
