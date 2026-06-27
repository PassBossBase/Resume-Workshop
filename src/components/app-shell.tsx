"use client";

import {
  Cog,
  // FileJson,
  FileText,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
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
  { href: "/dashboard", label: "我的简历", icon: FileText },
  { href: "/templates", label: "简历模板", icon: LayoutTemplate },
  // { href: "/pdf-to-json", label: "PDF转JSON", icon: FileJson },
  { href: "/settings", label: "通用设置", icon: Cog },
];

function MobileNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  useOverlay(open, { lockScroll: false, onClose: () => setOpen(false) });

  return (
    <div className="relative z-50">
      {open ? (
        <>
          <nav
            id="mobile-navigation"
            role="menu"
            aria-label="主导航"
            className="absolute right-0 top-[calc(100%+14px)] z-20 w-64 rotate-[0.5deg] rounded-3xl border-2 border-black bg-(--paper) p-3"
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
                      ? "border-black bg-(--yellow)"
                      : "border-transparent hover:border-black hover:bg-white"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl border-2 border-black ${
                      [
                        "bg-(--blue)",
                        "bg-(--pink)",
                        "bg-(--mint)",
                        "bg-(--purple)",
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
  const isHomePage = pathname === "/";
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
      {!isHomePage ? (
        <aside
          className={`no-print fixed top-0 left-0 z-40 hidden h-screen border-r-2 border-black bg-[#fff8e8] transition-[padding,width] duration-200 lg:flex lg:flex-col ${
            sidebarCollapsed ? "w-22 p-4" : "w-65 p-6"
          }`}
          data-collapsed={sidebarCollapsed}
          data-testid="desktop-sidebar"
        >
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "flex-col gap-5" : "justify-between gap-3"
            }`}
          >
            <Link
              aria-label="返回首页"
              className="rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue)]"
              href="/"
            >
              <BrandMark compact={sidebarCollapsed} />
            </Link>
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
                      ? "border-black bg-white"
                      : "border-transparent hover:border-black hover:bg-white"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl border-2 border-black ${
                      [
                        "bg-(--blue)",
                        "bg-(--pink)",
                        "bg-(--mint)",
                        "bg-(--purple)",
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
              className="absolute rounded-2xl cursor-pointer left-0 bottom-2 grid h-10 w-full shrink-0 place-items-center border-2 border-black bg-white transition hover:-translate-y-0.5 hover:bg-(--yellow) hover:shadow-[3px_3px_0_black] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
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
      ) : null}
      <div
        className={`min-w-0 transition-[padding] duration-200 ${
          isHomePage ? "" : sidebarCollapsed ? "lg:pl-22" : "lg:pl-65"
        }`}
      >
        {!isHomePage ? (
          <header className="no-print relative z-40 flex h-20 items-center justify-between border-b-2 border-black bg-(--paper) px-5 lg:hidden">
            <Link
              aria-label="返回首页"
              className="rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue)]"
              href="/"
            >
              <BrandMark />
            </Link>
            <MobileNavigation pathname={pathname} />
          </header>
        ) : null}
        <main>{children}</main>
      </div>
    </div>
  );
}
