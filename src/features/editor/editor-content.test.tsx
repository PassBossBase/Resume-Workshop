import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { EditorContent } from "./editor-content";
import { useResumeStore } from "@/stores/resume-store";

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
    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    expect(basicsModule?.type === "basics" ? basicsModule.basics?.name : undefined).toBe("周星野");
  });

  it("clears the uploaded avatar from the basic information form", () => {
    const resume = createDefaultResume("editor-resume-with-avatar");
    useResumeStore.getState().load({
      ...resume,
      modules: resume.modules.map((module) =>
        module.type === "basics" && module.basics
          ? {
              ...module,
              basics: {
                ...module.basics,
                avatar: "data:image/png;base64,avatar",
              },
            }
          : module,
      ),
    });

    render(<EditorContent />);
    expect(screen.getByAltText("头像预览")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "取消个人头像" }));

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.avatar).toBe("");
    expect(screen.queryByAltText("头像预览")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "取消个人头像" })).not.toBeInTheDocument();
  });
  it("renders the core basic fields in the agreed order", () => {
    render(<EditorContent />);

    const section = screen.getByText("基础字段").closest("section");
    const labels = Array.from(section?.querySelectorAll("span.font-bold") ?? [])
      .map((node) => node.textContent);

    expect(labels).toEqual([
      "姓名",
      "职位",
      "状态",
      "生日",
      "邮箱",
      "电话",
      "地址",
    ]);
    expect(screen.queryByLabelText("个人网站")).not.toBeInTheDocument();
  });

  it("moves custom basic fields by dragging the handle", () => {
    const resume = createDefaultResume("editor-resume-with-custom-fields");
    useResumeStore.getState().load({
      ...resume,
      modules: resume.modules.map((module) =>
        module.type === "basics" && module.basics
          ? {
              ...module,
              basics: {
                ...module.basics,
                infoItems: [
                  { label: "年龄", value: "28岁", visible: true },
                  { label: "个人网站", value: "portfolio.example.com", visible: true },
                ],
              },
            }
          : module,
      ),
    });

    render(<EditorContent />);
    const ageHandle = screen.getByLabelText("拖拽排序年龄");
    const websiteHandle = screen.getByLabelText("拖拽排序个人网站");
    fireEvent.dragStart(websiteHandle, {
      dataTransfer: { effectAllowed: "", setData: () => undefined },
    });
    const ageRow = ageHandle.closest("[data-drag-row]");
    if (!ageRow) throw new Error("Missing age drag row");
    fireEvent.dragOver(ageRow);
    fireEvent.drop(ageRow);

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.infoItems.map((item) => item.label)).toEqual([
      "个人网站",
      "年龄",
    ]);
    expect(screen.getByText("基础字段")).toBeInTheDocument();
  });

  it("moves custom basic fields downward by dragging the handle", () => {
    const resume = createDefaultResume("editor-resume-with-custom-fields-down");
    useResumeStore.getState().load({
      ...resume,
      modules: resume.modules.map((module) =>
        module.type === "basics" && module.basics
          ? {
              ...module,
              basics: {
                ...module.basics,
                infoItems: [
                  { label: "年龄", value: "28岁", visible: true },
                  { label: "个人网站", value: "portfolio.example.com", visible: true },
                ],
              },
            }
          : module,
      ),
    });

    render(<EditorContent />);
    const ageHandle = screen.getByLabelText("拖拽排序年龄");
    const websiteHandle = screen.getByLabelText("拖拽排序个人网站");
    const websiteRow = websiteHandle.closest("[data-drag-row]");
    if (!websiteRow) throw new Error("Missing website drag row");
    fireEvent.dragStart(ageHandle, {
      dataTransfer: { effectAllowed: "", setData: () => undefined },
    });
    fireEvent.dragOver(websiteRow);
    fireEvent.drop(websiteRow);

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.infoItems.map((item) => item.label)).toEqual([
      "个人网站",
      "年龄",
    ]);
  });

  it("moves optional basic fields by dragging the handle", () => {
    render(<EditorContent />);

    const statusHandle = screen.getByLabelText("拖拽排序状态");
    const emailHandle = screen.getByLabelText("拖拽排序邮箱");
    fireEvent.dragStart(emailHandle, {
      dataTransfer: { effectAllowed: "", setData: () => undefined },
    });
    const statusRow = statusHandle.closest("[data-drag-row]");
    if (!statusRow) throw new Error("Missing status drag row");
    fireEvent.dragOver(statusRow);
    fireEvent.drop(statusRow);

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.fieldOrder.slice(0, 5)).toEqual([
      "email",
      "status",
      "birthday",
      "phone",
      "location",
    ]);
  });

  it("moves optional basic fields downward by dragging the handle", () => {
    render(<EditorContent />);

    const statusHandle = screen.getByLabelText("拖拽排序状态");
    const emailHandle = screen.getByLabelText("拖拽排序邮箱");
    const emailRow = emailHandle.closest("[data-drag-row]");
    if (!emailRow) throw new Error("Missing email drag row");
    fireEvent.dragStart(statusHandle, {
      dataTransfer: { effectAllowed: "", setData: () => undefined },
    });
    fireEvent.dragOver(emailRow);
    fireEvent.drop(emailRow);

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.fieldOrder.slice(0, 5)).toEqual([
      "birthday",
      "email",
      "status",
      "phone",
      "location",
    ]);
  });

  it("hides and removes optional basic fields while keeping fixed fields", () => {
    render(<EditorContent />);

    fireEvent.click(screen.getByLabelText("隐藏邮箱"));
    fireEvent.click(screen.getByLabelText("删除电话"));

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.hiddenFields).toContain("email");
    expect(basics?.removedFields).toContain("phone");
    expect(screen.getByLabelText("姓名")).toBeInTheDocument();
    expect(screen.getByLabelText("职位")).toBeInTheDocument();
    expect(screen.queryByLabelText("电话")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "电话" }));

    expect(screen.getByLabelText("电话")).toBeInTheDocument();
  });

  it("toggles a custom basic field visibility", () => {
    const resume = createDefaultResume("editor-resume-with-visible-custom-field");
    useResumeStore.getState().load({
      ...resume,
      modules: resume.modules.map((module) =>
        module.type === "basics" && module.basics
          ? {
              ...module,
              basics: {
                ...module.basics,
                infoItems: [{ label: "个人网站", value: "portfolio.example.com", visible: true }],
              },
            }
          : module,
      ),
    });

    render(<EditorContent />);
    fireEvent.click(screen.getByLabelText("隐藏个人网站"));

    const basicsModule = useResumeStore
      .getState()
      .resume?.modules.find((module) => module.type === "basics");
    const basics = basicsModule?.type === "basics" ? basicsModule.basics : undefined;

    expect(basics?.infoItems[0].visible).toBe(false);
    expect(screen.getByLabelText("显示个人网站")).toBeInTheDocument();
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
    expect(screen.getByLabelText("结束时间")).toBeInTheDocument();
  });
});
