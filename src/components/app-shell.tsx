"use client";

import {
  FileText,
  LayoutTemplate,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BrandMark } from "./anime-ui/ui";
import { useOverlay } from "@/hooks/use-overlay";

const sidebarStorageKey = "resume-workshop:sidebar-collapsed";
const sidebarChangeEvent = "resume-workshop:sidebar-change";

function subscribeToSidebarState(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(sidebarChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(sidebarChangeEvent, onStoreChange);
  };
}

function getSidebarSnapshot() {
  return window.localStorage.getItem(sidebarStorageKey) === "true";
}

function getServerSidebarSnapshot() {
  return false;
}

const links = [
  { href: "/", label: "我的简历", icon: FileText },
  { href: "/templates", label: "简历模板", icon: LayoutTemplate },
  { href: "/settings", label: "通用设置", icon: Settings },
];

function MobileNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  useOverlay(open, { lockScroll: false, onClose: () => setOpen(false) });

  return (
    <div className="relative z-50">
      <button
        type="button"
        aria-label={open ? "关闭更多菜单" : "打开更多菜单"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        className="relative z-20 grid h-12 w-12 place-items-center rounded-2xl border-2 border-black bg-white transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_black] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="关闭导航菜单"
            className="fixed inset-0 z-10 cursor-default bg-black/15"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-navigation"
            role="menu"
            aria-label="主导航"
            className="absolute right-0 top-[calc(100%+14px)] z-20 w-64 rotate-[0.5deg] rounded-3xl border-2 border-black bg-[var(--paper)] p-3 shadow-[6px_6px_0_black]"
          >
            {links.map(({ href, label, icon: Icon }, index) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 font-bold transition ${
                    active
                      ? "border-black bg-[var(--yellow)]"
                      : "border-transparent hover:border-black hover:bg-white"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl border-2 border-black ${
                      [
                        "bg-[var(--blue)]",
                        "bg-[var(--pink)]",
                        "bg-[var(--mint)]",
                      ][index]
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      size={18}
                      color="white"
                      strokeWidth={2.6}
                    />
                  </span>
                  {label}
                  {active ? (
                    <span className="ml-auto rounded-full border border-black bg-white px-2 py-0.5 text-xs">
                      当前
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sidebarCollapsed = useSyncExternalStore(
    subscribeToSidebarState,
    getSidebarSnapshot,
    getServerSidebarSnapshot,
  );

  const toggleSidebar = () => {
    window.localStorage.setItem(sidebarStorageKey, String(!sidebarCollapsed));
    window.dispatchEvent(new Event(sidebarChangeEvent));
  };

  return (
    <div className="min-h-screen">
      <aside
        className={`no-print fixed top-0 left-0 z-40 hidden h-screen border-r-2 border-black bg-[#fff8e8] transition-[padding,width] duration-200 lg:flex lg:flex-col ${
          sidebarCollapsed ? "w-[88px] p-4" : "w-[260px] p-6"
        }`}
        data-collapsed={sidebarCollapsed}
        data-testid="desktop-sidebar"
      >
        <div
          className={`flex items-center ${
            sidebarCollapsed ? "flex-col gap-5" : "justify-between gap-3"
          }`}
        >
          <BrandMark compact={sidebarCollapsed} />
        </div>
        <nav
          className={
            sidebarCollapsed
              ? "relative h-full mt-8 space-y-3"
              : "relative h-full mt-14 space-y-3"
          }
        >
          {links.map(({ href, label, icon: Icon }, index) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={`flex items-center rounded-2xl border-2 py-3 font-bold transition ${
                  sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"
                } ${
                  active
                    ? "border-black bg-white shadow-[4px_4px_0_black]"
                    : "border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl border-2 border-black ${
                    [
                      "bg-[var(--blue)]",
                      "bg-[var(--pink)]",
                      "bg-[var(--mint)]",
                    ][index]
                  }`}
                >
                  <Icon size={18} color="white" strokeWidth={2.6} />
                </span>
                <span className={sidebarCollapsed ? "sr-only" : undefined}>
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            aria-expanded={!sidebarCollapsed}
            className="absolute cursor-pointer left-0 bottom-2 grid h-10 w-full shrink-0 place-items-center border-2 border-black bg-white transition hover:-translate-y-0.5 hover:bg-[var(--yellow)] hover:shadow-[3px_3px_0_black] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen aria-hidden="true" size={20} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={20} />
            )}
          </button>
        </nav>
      </aside>
      <div
        className={`min-w-0 transition-[padding] duration-200 ${
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[260px]"
        }`}
      >
        <header className="no-print relative z-40 flex h-20 items-center justify-between border-b-2 border-black bg-[var(--paper)] px-5 lg:hidden">
          <BrandMark />
          <MobileNavigation pathname={pathname} />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
