"use client";

import {
  Cog,
  FileText,
  LayoutTemplate,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { BrandMark, InkButton } from "./anime-ui/ui";
import { LanguageToggle } from "./language-toggle";
import { useOverlay } from "@/hooks/use-overlay";
import { useT } from "@/lib/i18n";

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

function ScenicBrand({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 text-lg font-black tracking-tight text-white">
      <i className="h-3 w-3 rounded-full border border-white/70 bg-cyan-200 shadow-[0_0_16px_rgb(186_230_253_/_85%)]" />
      {!compact ? (
        <span>简历工坊</span>
      ) : (
        <span className="sr-only">简历工坊</span>
      )}
    </span>
  );
}

/** 小屏幕使用的抽屉式主导航。 */
function MobileNavigation({
  pathname,
  scenic,
}: {
  pathname: string;
  scenic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const links = [
    { href: "/dashboard", label: t.nav.dashboard, icon: FileText },
    { href: "/templates", label: t.nav.templates, icon: LayoutTemplate },
    { href: "/settings", label: t.nav.settings, icon: Cog },
  ];

  useOverlay(open, { lockScroll: false, onClose: () => setOpen(false) });

  return (
    <div className="relative z-50">
      <InkButton
        type="button"
        aria-controls="mobile-navigation"
        aria-expanded={open}
        aria-label={open ? t.nav.close : t.nav.open}
        className={
          scenic
            ? "h-11 w-11 rounded-2xl"
            : "grid h-11 w-11 place-items-center rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0_black] transition hover:-translate-y-0.5 hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--blue)"
        }
        onClick={() => setOpen((current) => !current)}
        unstyled={!scenic}
        variant={scenic ? "glass" : undefined}
      >
        {open ? (
          <X aria-hidden="true" size={21} strokeWidth={2.7} />
        ) : (
          <Menu aria-hidden="true" size={21} strokeWidth={2.7} />
        )}
      </InkButton>
      {open ? (
        <nav
          id="mobile-navigation"
          role="menu"
          aria-label={t.nav.label}
          className={
            scenic
              ? "scenic-panel absolute right-0 top-[calc(100%+14px)] z-20 w-64 rounded-3xl p-3 text-white"
              : "absolute right-0 top-[calc(100%+14px)] z-20 w-64 rotate-[0.5deg] rounded-3xl border-2 border-black bg-(--paper) p-3 shadow-[5px_5px_0_black]"
          }
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
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 font-bold transition ${
                  scenic
                    ? active
                      ? "border border-white/38 bg-white/18"
                      : "border border-transparent hover:bg-white/12"
                    : active
                      ? "border-2 border-black bg-(--yellow)"
                      : "border-2 border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl ${scenic ? "border border-white/28 bg-white/12" : "border-2 border-black " + ["bg-(--blue)", "bg-(--pink)", "bg-(--mint)"][index]}`}
                >
                  <Icon
                    aria-hidden="true"
                    size={18}
                    color="white"
                    strokeWidth={2.4}
                  />
                </span>
                {label}
                {active ? (
                  <span
                    className={
                      scenic
                        ? "ml-auto rounded-full bg-white/18 px-2 py-0.5 text-xs"
                        : "ml-auto rounded-full border border-black bg-white px-2 py-0.5 text-xs"
                    }
                  >
                    {t.nav.current}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

/** 常规页面共用的响应式导航与内容壳层；编辑器使用独立全屏壳层。 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useT();
  const isHomePage = pathname === "/";
  const isScenicWorkspacePage = [
    "/dashboard",
    "/templates",
    "/settings",
  ].includes(pathname);
  const links = [
    { href: "/dashboard", label: t.nav.dashboard, icon: FileText },
    { href: "/templates", label: t.nav.templates, icon: LayoutTemplate },
    { href: "/settings", label: t.nav.settings, icon: Cog },
  ];
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
    <div
      className={isScenicWorkspacePage ? "scenic-workspace" : "min-h-screen"}
    >
      {!isHomePage ? (
        <aside
          className={`no-print fixed top-0 left-0 z-40 hidden h-screen transition-[padding,width] duration-200 lg:flex lg:flex-col ${
            isScenicWorkspacePage
              ? "border-r border-white/24 bg-[#0a5265]/64 text-white shadow-[18px_0_50px_rgb(4_45_61_/_18%)] backdrop-blur-xl"
              : "border-r-2 border-black bg-[#fff8e8]"
          } ${sidebarCollapsed ? "w-22 p-4" : "w-65 p-6"}`}
          data-collapsed={sidebarCollapsed}
          data-testid="desktop-sidebar"
        >
          <div
            className={`flex items-center ${sidebarCollapsed ? "flex-col gap-5" : "justify-between gap-3"}`}
          >
            <Link
              aria-label={t.app.backHome}
              className={
                isScenicWorkspacePage
                  ? "rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
                  : "rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
              }
              href="/"
            >
              {isScenicWorkspacePage ? (
                <ScenicBrand compact={sidebarCollapsed} />
              ) : (
                <BrandMark
                  compact={sidebarCollapsed}
                  prefix={t.app.brandPrefix}
                  suffix={t.app.brandSuffix}
                />
              )}
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
                  className={`flex items-center rounded-2xl py-3 font-bold transition ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"} ${isScenicWorkspacePage ? (active ? "border border-white/40 bg-white/18 shadow-[0_8px_24px_rgb(3_42_56/14%)]" : "border border-transparent text-white/88 hover:bg-white/12") : active ? "border-2 border-black bg-white" : "border-2 border-transparent hover:border-black hover:bg-white"}`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl ${isScenicWorkspacePage ? "border border-white/28 bg-white/12" : "border-2 border-black " + ["bg-(--blue)", "bg-(--purple)", "bg-(--pink)"][index]}`}
                  >
                    <Icon
                      size={18}
                      color="white"
                      strokeWidth={isScenicWorkspacePage ? 2.25 : 2.6}
                    />
                  </span>
                  <span className={sidebarCollapsed ? "sr-only" : undefined}>
                    {label}
                  </span>
                </Link>
              );
            })}
            <div className="absolute left-0 bottom-12 w-full">
              <LanguageToggle
                compact
                variant={isScenicWorkspacePage ? "glass" : "purple"}
                className="w-full rounded-xl transition"
              />
            </div>
            <InkButton
              type="button"
              aria-label={
                sidebarCollapsed ? t.nav.expandSidebar : t.nav.collapseSidebar
              }
              aria-expanded={!sidebarCollapsed}
              className={`absolute left-0 bottom-2 grid h-10 w-full shrink-0 place-items-center rounded-xl ${isScenicWorkspacePage ? "" : "border-2 border-black bg-white"}`}
              onClick={toggleSidebar}
              title={
                sidebarCollapsed ? t.nav.expandSidebar : t.nav.collapseSidebar
              }
              unstyled={!isScenicWorkspacePage}
              variant={isScenicWorkspacePage ? "glass" : undefined}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen aria-hidden="true" size={20} />
              ) : (
                <PanelLeftClose aria-hidden="true" size={20} />
              )}
            </InkButton>
          </nav>
        </aside>
      ) : null}
      <div
        className={`min-w-0 transition-[padding] duration-200 ${isHomePage ? "" : sidebarCollapsed ? "lg:pl-22" : "lg:pl-65"}`}
      >
        {!isHomePage ? (
          <header
            className={`no-print relative z-40 flex h-20 items-center justify-between px-5 lg:hidden ${isScenicWorkspacePage ? "border-b border-white/24 bg-[#0a5265]/56 text-white backdrop-blur-xl" : "border-b-2 border-black bg-(--paper)"}`}
          >
            <Link
              aria-label={t.app.backHome}
              className={
                isScenicWorkspacePage
                  ? "rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
                  : "rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
              }
              href="/"
            >
              {isScenicWorkspacePage ? (
                <ScenicBrand />
              ) : (
                <BrandMark
                  prefix={t.app.brandPrefix}
                  suffix={t.app.brandSuffix}
                />
              )}
            </Link>
            <div className="flex items-center gap-3">
              <LanguageToggle
                compact
                variant={isScenicWorkspacePage ? "glass" : "blue"}
                className="w-15"
              />
              <MobileNavigation
                pathname={pathname}
                scenic={isScenicWorkspacePage}
              />
            </div>
          </header>
        ) : null}
        <main>{children}</main>
      </div>
    </div>
  );
}
