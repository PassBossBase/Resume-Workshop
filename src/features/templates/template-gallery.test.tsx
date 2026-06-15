import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TemplateGallery } from "./template-gallery";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("TemplateGallery", () => {
  it("renders the template with sample resume data", () => {
    render(<TemplateGallery />);

    expect(screen.getByTestId("template-grid")).toBeInTheDocument();
    expect(screen.getByText("林小满")).toBeInTheDocument();
    expect(screen.getByText("产品设计师")).toBeInTheDocument();
    expect(screen.getByText("专业技能")).toBeInTheDocument();
    const useButton = screen.getByRole("button", { name: "使用经典单栏模板" });
    expect(useButton).toHaveAttribute("title", "使用");
    expect(useButton.querySelector("[data-template-action-label]")).toHaveTextContent(
      "使用",
    );
  });

  it("opens and closes the full template preview dialog", async () => {
    const user = userEvent.setup();
    render(<TemplateGallery />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "预览" }));

    const dialog = screen.getByRole("dialog", { name: "经典单栏模板预览" });
    expect(within(dialog).getByText("林小满")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "使用此模板" }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "关闭模板预览" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
