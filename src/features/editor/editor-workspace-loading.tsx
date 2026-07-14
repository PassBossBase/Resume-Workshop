"use client";

import { Eye, FileText, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { useT } from "@/lib/i18n";

/** 动态壳层与数据初始化阶段共用的工作台骨架屏。 */
export function EditorWorkspaceLoading() {
  const t = useT();

  return (
    <div className="editor-loading-screen editor-workspace min-h-dvh px-4 py-5 text-white sm:px-6 lg:px-8">
      <main
        aria-busy="true"
        aria-label={t.editor.opening}
        className="editor-loading-frame mx-auto grid w-full max-w-360 overflow-hidden rounded-[1.75rem] border"
      >
        <header className="editor-loading-header flex min-h-18 items-center justify-between gap-4 border-b px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="editor-loading-brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
              <FileText aria-hidden="true" size={20} strokeWidth={2.8} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black tracking-tight sm:text-lg">
                简历工坊
              </span>
              <span className="editor-loading-skeleton mt-1 block h-2.5 w-24 rounded-full" />
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm font-bold text-white/80">
            <LoaderCircle
              aria-hidden="true"
              className="editor-loading-spinner h-4 w-4"
              strokeWidth={2.6}
            />
            <span className="hidden sm:inline" role="status">
              {t.editor.opening}
            </span>
          </div>
        </header>

        <div className="editor-loading-workbench grid min-h-135 lg:grid-cols-[220px_minmax(300px,0.8fr)_minmax(390px,1.2fr)]">
          <aside className="editor-loading-rail hidden border-r p-4 lg:block">
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

          <section className="editor-loading-form border-r p-5 sm:p-7">
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

          <section className="editor-loading-preview grid place-items-center p-6 sm:p-8">
            <div className="editor-loading-paper relative w-full max-w-118 overflow-hidden bg-white px-7 py-8 text-slate-700 shadow-2xl sm:px-9 sm:py-10">
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
          </section>
        </div>
      </main>
    </div>
  );
}
