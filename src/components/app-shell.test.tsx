import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("collapses and expands the desktop sidebar", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>页面内容</div>
      </AppShell>,
    );

    const sidebar = screen.getByTestId("desktop-sidebar");
    const trigger = screen.getByRole("button", { name: "折叠侧边栏" });

    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);

    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    expect(
      screen.getByRole("button", { name: "展开侧边栏" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "我的简历" })).toHaveAttribute(
      "title",
      "我的简历",
    );

    await user.click(screen.getByRole("button", { name: "展开侧边栏" }));

    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(
      screen.getByRole("button", { name: "折叠侧边栏" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("restores the collapsed sidebar after the shell remounts", async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <AppShell>
        <div>我的简历</div>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "折叠侧边栏" }));
    expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute(
      "data-collapsed",
      "true",
    );

    firstRender.unmount();
    render(
      <AppShell>
        <div>简历模板</div>
      </AppShell>,
    );

    expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  it("opens and closes the mobile navigation menu", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>页面内容</div>
      </AppShell>,
    );

    const trigger = screen.getByRole("button", { name: "打开更多菜单" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /我的简历/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /简历模板/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /通用设置/ }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
