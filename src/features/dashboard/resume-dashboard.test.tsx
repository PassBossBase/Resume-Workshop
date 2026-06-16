import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { ResumeDashboard } from "./resume-dashboard";

const repositoryMocks = vi.hoisted(() => ({
  deleteResume: vi.fn(),
  listResumes: vi.fn(),
  saveResume: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/storage/resume-repository", () => repositoryMocks);

const hasTextContent = (text: string) => (_: string, node: Element | null) =>
  node?.textContent === text;

describe("ResumeDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty state after cached resumes finish loading", async () => {
    repositoryMocks.listResumes.mockResolvedValue([]);
    render(<ResumeDashboard initialResumes={[]} />);

    expect(screen.getByRole("status", { name: "正在读取简历" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "创建第一份简历" }),
    ).not.toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "创建第一份简历" }),
    ).toBeInTheDocument();
  });

  it("does not flash the empty state before cached resumes are restored", async () => {
    let resolveResumes:
      | ((value: ReturnType<typeof createDefaultResume>[]) => void)
      | undefined;
    repositoryMocks.listResumes.mockReturnValue(
      new Promise((resolve) => {
        resolveResumes = resolve;
      }),
    );

    render(<ResumeDashboard initialResumes={[]} />);

    expect(screen.getByRole("status", { name: "正在读取简历" })).toBeInTheDocument();
    expect(screen.queryByText("从第一份简历开始")).not.toBeInTheDocument();

    resolveResumes?.([createDefaultResume("saved-resume", "已有简历")]);

    expect(await screen.findByText("已有简历")).toBeInTheDocument();
    expect(screen.queryByText("从第一份简历开始")).not.toBeInTheDocument();
  });

  it("uses a themed confirmation dialog before deleting a resume", async () => {
    const user = userEvent.setup();
    repositoryMocks.listResumes.mockResolvedValue([
      createDefaultResume("delete-me", "待删除简历"),
    ]);
    repositoryMocks.deleteResume.mockResolvedValue(undefined);

    render(<ResumeDashboard initialResumes={[]} />);

    await screen.findByText("待删除简历");
    await user.click(screen.getByRole("button", { name: "删除 待删除简历" }));

    const dialog = screen.getByRole("dialog", { name: "确认删除简历？" });
    expect(dialog).toHaveTextContent("待删除简历");
    expect(repositoryMocks.deleteResume).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() =>
      expect(repositoryMocks.deleteResume).toHaveBeenCalledWith("delete-me"),
    );
    expect(screen.queryByText("待删除简历")).not.toBeInTheDocument();
  });

  it("keeps card actions on one line and exposes icon-only tooltips", async () => {
    repositoryMocks.listResumes.mockResolvedValue([
      createDefaultResume("actions-resume", "操作按钮简历"),
    ]);

    render(<ResumeDashboard initialResumes={[]} />);

    await screen.findByText("操作按钮简历");
    const edit = screen.getByRole("button", { name: "编辑 操作按钮简历" });
    const copy = screen.getByRole("button", { name: "复制 操作按钮简历" });
    const remove = screen.getByRole("button", { name: "删除 操作按钮简历" });

    for (const button of [edit, copy, remove]) {
      expect(button).toHaveClass("whitespace-nowrap");
      expect(button).toHaveAttribute("title");
      expect(button.querySelector("[data-action-label]")).toHaveClass(
        "max-lg:sr-only",
      );
    }
  });

  it("renders each resume card preview from the saved user data", async () => {
    const resume = createDefaultResume("preview-resume", "用户简历");
    const basicsModule = resume.modules.find((module) => module.type === "basics");
    if (!basicsModule || basicsModule.type !== "basics" || !basicsModule.basics)
      throw new Error("Missing basics module");
    basicsModule.basics.name = "张真实";
    basicsModule.basics.role = "前端架构师";
    repositoryMocks.listResumes.mockResolvedValue([resume]);

    render(<ResumeDashboard initialResumes={[]} />);

    expect(await screen.findByText(hasTextContent("姓名：张真实"))).toBeInTheDocument();
    expect(screen.getByText(hasTextContent("职位：前端架构师"))).toBeInTheDocument();
  });
});
