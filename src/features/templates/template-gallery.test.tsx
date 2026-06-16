import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { createSidebarLeftTemplate } from "@/features/resume-model/template-presets";
import { ClassicTemplatePage } from "./classic-template";
import { buildResumePages } from "./resume-pages";
import { SidebarLeftTemplate } from "./sidebar-left-template";
import { TemplateGallery } from "./template-gallery";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const hasTextContent = (text: string) => (_: string, node: Element | null) =>
  node?.textContent === text;

describe("TemplateGallery", () => {
  it("renders the template with sample resume data", () => {
    render(<TemplateGallery />);

    expect(screen.getByTestId("template-grid")).toBeInTheDocument();
    expect(
      screen.getAllByText(hasTextContent("姓名：林小满")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(hasTextContent("职位：产品设计师")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("专业技能").length).toBeGreaterThan(0);
    const useButton = screen.getByRole("button", { name: "使用经典单栏模板" });
    expect(useButton).toHaveAttribute("title", "使用");
    expect(
      useButton.querySelector("[data-template-action-label]"),
    ).toHaveTextContent("使用");
  });

  it("opens and closes the full template preview dialog", async () => {
    const user = userEvent.setup();
    render(<TemplateGallery />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const firstCard = screen.getAllByTestId("template-card")[0];
    await user.click(within(firstCard).getByRole("button", { name: "预览" }));

    const dialog = screen.getByRole("dialog", { name: "经典单栏模板预览" });
    expect(
      within(dialog).getByText(hasTextContent("姓名：林小满")),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "使用此模板" }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "关闭模板预览" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render unsupported legacy basics fields or fake placeholders", () => {
    const resume = createDefaultResume("preview-field-contract");
    const withEmptyBasics = {
      ...resume,
      modules: resume.modules.map((module) =>
        module.type === "basics" && module.basics
          ? {
              ...module,
              basics: {
                ...module.basics,
                name: "",
                role: "",
                website: "portfolio.example.com",
                infoItems: [],
              },
            }
          : module,
      ),
    };

    render(
      <ClassicTemplatePage
        page={buildResumePages(withEmptyBasics)[0]}
        resume={withEmptyBasics}
      />,
    );

    expect(screen.queryByText("你的姓名")).not.toBeInTheDocument();
    expect(screen.queryByText("目标职位")).not.toBeInTheDocument();
    expect(screen.queryByText("portfolio.example.com")).not.toBeInTheDocument();
  });

  it("keeps the resume title independent from the name field", () => {
    const resume = createDefaultResume("preview-name-title-contract");
    const withCustomName = {
      ...resume,
      modules: resume.modules.map((module) =>
        module.type === "basics" && module.basics
          ? {
              ...module,
              basics: {
                ...module.basics,
                name: "李有才",
              },
            }
          : module,
      ),
    };

    render(
      <ClassicTemplatePage
        page={buildResumePages(withCustomName)[0]}
        resume={withCustomName}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "个人简历" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(hasTextContent("姓名：李有才")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "李有才" }),
    ).not.toBeInTheDocument();
  });

  it("renders sidebar template education below basics in the left sidebar", () => {
    const resume = createSidebarLeftTemplate();
    const { container } = render(
      <SidebarLeftTemplate
        page={buildResumePages(resume)[0]}
        resume={resume}
      />,
    );

    const aside = container.querySelector("aside");
    const main = container.querySelector("main");

    expect(aside).toHaveTextContent("姓名：李有才");
    expect(aside).toHaveTextContent("教育经历");
    expect(main).not.toHaveTextContent("教育经历");
  });
});
