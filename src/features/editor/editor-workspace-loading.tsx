"use client";

import { ArrowLeft, Eye, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { InkButton } from "@/components/anime-ui/ui";
import { useT } from "@/lib/i18n";
import { usePanelResize } from "./use-panel-resize";

/** 动态壳层与数据初始化阶段共用的工作台骨架屏。 */
export function EditorWorkspaceLoading() {
  const t = useT();
  const router = useRouter();
  const panelResize = usePanelResize();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="editor-loading-screen editor-workspace h-dvh w-full min-w-0 overflow-hidden text-white">
      <main
        aria-busy="true"
        aria-label={t.editor.opening}
        className="editor-loading-frame h-full w-full min-w-0 overflow-hidden"
      >
        <header className="editor-glass-panel editor-loading-header flex h-19.5 min-w-0 items-center justify-between gap-3 overflow-hidden border-b px-4 md:gap-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-5">
            <InkButton
              aria-label={t.editor.back}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              onClick={handleBack}
              title={t.editor.back}
              variant="glass"
            >
              <ArrowLeft aria-hidden="true" size={20} />
            </InkButton>
            <span className="editor-loading-skeleton h-10 w-30 max-w-full rounded-xl sm:w-48" />
            <span className="editor-loading-skeleton hidden h-6 w-14 shrink-0 rounded-full md:block" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="editor-loading-skeleton hidden h-11 w-14 rounded-xl sm:block" />
            <span className="editor-loading-skeleton hidden h-11 w-20 rounded-xl lg:block" />
            <span className="editor-loading-skeleton hidden h-11 w-24 rounded-xl md:block" />
          </div>
        </header>

        <div className="editor-loading-desktop hidden h-[calc(100vh-78px)] lg:flex">
          <div
            className="shrink-0 overflow-hidden"
            style={{ width: panelResize.leftCollapsed ? 44 : panelResize.leftWidth }}
          >
            {panelResize.leftCollapsed ? (
              <div className="editor-glass-panel h-full w-full border-r" />
            ) : (
              <aside className="editor-loading-rail editor-tool-scroll scrollbar-thin h-full overflow-hidden p-4">
                <div className="flex items-center gap-2 px-2 text-sm font-black text-white/90">
                  <SlidersHorizontal aria-hidden="true" size={16} />
                  {t.stylePanel.layout}
                </div>
                <div className="mt-5 space-y-3">
                  {["w-4/5", "w-2/3", "w-11/12", "w-3/5", "w-4/5"].map(
                    (width, index) => (
                      <div
                        className="editor-loading-rail-item flex items-center gap-3 rounded-xl p-3"
                        key={index}
                      >
                        <span className="editor-loading-skeleton h-8 w-8 rounded-lg" />
                        <span
                          className={`editor-loading-skeleton h-2.5 rounded-full ${width}`}
                        />
                      </div>
                    ),
                  )}
                </div>
              </aside>
            )}
          </div>
          {!panelResize.leftCollapsed && (
            <span aria-hidden="true" className="editor-loading-resize-handle" />
          )}

          <div
            className="shrink-0 overflow-hidden"
            style={{ width: panelResize.middleCollapsed ? 44 : panelResize.middleWidth }}
          >
            {panelResize.middleCollapsed ? (
              <div className="editor-glass-panel h-full w-full border-r" />
            ) : (
              <section className="editor-loading-form editor-form-scroll scrollbar-thin h-full overflow-hidden p-5 sm:p-7">
                <div className="editor-loading-skeleton h-4 w-28 rounded-full" />
                <div className="editor-loading-skeleton mt-3 h-8 w-44 rounded-xl" />
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index}>
                      <span className="editor-loading-skeleton block h-2.5 w-16 rounded-full" />
                      <span className="editor-loading-skeleton mt-2.5 block h-11 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
                <div className="editor-loading-form-card mt-7 rounded-2xl p-4">
                  <span className="editor-loading-skeleton block h-3 w-20 rounded-full" />
                  <span className="editor-loading-skeleton mt-4 block h-2.5 w-full rounded-full" />
                  <span className="editor-loading-skeleton mt-2.5 block h-2.5 w-11/12 rounded-full" />
                  <span className="editor-loading-skeleton mt-2.5 block h-2.5 w-3/4 rounded-full" />
                </div>
              </section>
            )}
          </div>
          {!panelResize.middleCollapsed && (
            <span aria-hidden="true" className="editor-loading-resize-handle" />
          )}

          <section className="editor-preview-stage min-w-0 flex-1 overflow-auto">
            <div className="editor-preview-surface min-h-full overflow-auto p-3 sm:p-5 md:p-10">
              <div className="flex min-w-fit justify-center">
                <div className="editor-loading-document-frame relative shrink-0">
                  <div className="editor-loading-paper absolute inset-0 overflow-hidden bg-white px-7 py-8 text-slate-700 shadow-[0_20px_60px_rgb(30_40_60/20%)] sm:px-9 sm:py-10">
                    <span className="editor-loading-paper-accent absolute inset-y-8 left-0 w-1" />
                    <div className="ml-2 flex items-center justify-between">
                      <span className="editor-loading-paper-line h-5 w-24 rounded-full" />
                      <Eye aria-hidden="true" className="text-sky-700/45" size={18} />
                    </div>
                    <div className="editor-loading-paper-line mt-3 ml-2 h-2.5 w-32 rounded-full" />
                    {["w-24", "w-18", "w-21", "w-16"].map((width, index) => (
                      <div className="mt-8 ml-2" key={index}>
                        <span className={`editor-loading-paper-line block h-3 ${width} rounded-full`} />
                        <span className="editor-loading-paper-line mt-3 block h-2 w-full rounded-full" />
                        <span className="editor-loading-paper-line mt-2 block h-2 w-11/12 rounded-full" />
                        <span className="editor-loading-paper-line mt-2 block h-2 w-4/5 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="editor-loading-mobile h-[calc(100vh-78px)] lg:hidden">
          <div className="editor-mobile-nav flex h-15 items-center gap-2 border-b px-4">
            {["w-16", "w-14", "w-16"].map((width, index) => (
              <span
                className={`editor-loading-skeleton h-8 ${width} rounded-lg`}
                key={index}
              />
            ))}
          </div>
          <section className="editor-loading-form h-[calc(100%-60px)] overflow-hidden p-5 sm:p-7">
            <div className="editor-loading-skeleton h-4 w-28 rounded-full" />
            <div className="editor-loading-skeleton mt-3 h-8 w-44 rounded-xl" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index}>
                  <span className="editor-loading-skeleton block h-2.5 w-16 rounded-full" />
                  <span className="editor-loading-skeleton mt-2.5 block h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
