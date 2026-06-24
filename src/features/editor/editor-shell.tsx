"use client";

import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Home,
  LayoutDashboard,
  Palette,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark, InkButton } from "@/components/anime-ui/ui";
import { exportResumePdf } from "@/features/pdf-export/export-pdf";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import {
  DirectoryConflictError,
  readResumeFile,
  resumeFileName,
  writeResumeFile,
} from "@/features/storage/directory-sync";
import {
  loadResume,
  loadSetting,
  saveResume,
} from "@/features/storage/resume-repository";
import { EditorContent } from "./editor-content";
import { getModuleMeta } from "./module-meta";
import { useResumeStore } from "@/stores/resume-store";
import type { ResumeModule } from "@/features/resume-model/resume-model";
import { StylePanel } from "./style-panel";
import { ResumePreview } from "@/features/templates/resume-preview";
import { usePanelResize } from "./use-panel-resize";
import { ResizeHandle, PanelRestoreButton } from "./resize-handle";

type MobileTab = "content" | "style" | "preview";

/**
 * 编辑器顶层容器：三栏布局（样式 / 内容 / 预览），
 * 负责数据加载、自动保存与移动端底部 tab 切换。
 */
export function EditorShell({ id }: { id: string }) {
  const resume = useResumeStore((state) => state.resume);
  const load = useResumeStore((state) => state.load);
  const rename = useResumeStore((state) => state.rename);
  const saveState = useResumeStore((state) => state.saveState);
  const setSaveState = useResumeStore((state) => state.setSaveState);
  const activeModuleId = useResumeStore((state) => state.activeModuleId);
  const setActiveModule = useResumeStore((state) => state.setActiveModule);
  const [mobileTab, setMobileTab] = useState<MobileTab>("content");
  const [ready, setReady] = useState(false);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const directoryRef = useRef<FileSystemDirectoryHandle | undefined>(undefined);
  const fileStampRef = useRef<number | undefined>(undefined);
  const initialLoadRef = useRef(true);
  const router = useRouter();
  const resize = usePanelResize();

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const mobile =
        window.matchMedia?.("(max-width: 1023px)").matches ?? false;
      const directory = mobile
        ? undefined
        : await loadSetting<FileSystemDirectoryHandle>("directory-handle");
      directoryRef.current = directory;

      if (directory) {
        try {
          const permission = await directory.queryPermission({
            mode: "readwrite",
          });
          if (permission === "granted") {
            const handle = await directory.getFileHandle(resumeFileName(id));
            const fromFile = await readResumeFile(handle);
            if (!cancelled) {
              fileStampRef.current = fromFile.lastModified;
              await saveResume(fromFile.resume);
              load(fromFile.resume);
              setReady(true);
              return;
            }
          }
        } catch {
          // Cache fallback is intentional when the file was not created yet.
        }
      }

      const cached = await loadResume(id);
      const value = cached ?? createDefaultResume(id, "我的新简历");
      if (!cached) await saveResume(value);
      if (!cancelled) {
        load(value);
        setReady(true);
      }
    };
    hydrate().catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [id, load]);

  useEffect(() => {
    if (!resume || !ready) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      try {
        const directory = directoryRef.current;
        const mobile =
          window.matchMedia?.("(max-width: 1023px)").matches ?? false;
        if (directory && !mobile) {
          const permission = await directory.queryPermission({
            mode: "readwrite",
          });
          if (permission === "granted") {
            const handle = await directory.getFileHandle(
              resumeFileName(resume.id),
              {
                create: true,
              },
            );
            fileStampRef.current = await writeResumeFile(
              handle,
              resume,
              fileStampRef.current,
            );
          }
        }
        await saveResume(resume);
        setSaveState("saved");
      } catch (error) {
        await saveResume(resume);
        setSaveState(
          error instanceof DirectoryConflictError ? "conflict" : "error",
        );
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [ready, resume, setSaveState]);

  const download = async () => {
    const pages = pageRefs.current.filter((page): page is HTMLDivElement =>
      Boolean(page),
    );
    if (!resume || pages.length === 0) return;
    await exportResumePdf(pages, resume.title, resume);
  };

  if (!ready || !resume) {
    return (
      <div className="grid min-h-screen place-items-center bg-(--yellow)">
        <div className="animate-bounce rounded-[28px] border-2 border-black bg-white px-7 py-5 text-xl font-black shadow-[5px_5px_0_black]">
          正在打开工作台...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#ebe7de]">
      <header className="no-print flex h-19.5 items-center justify-between gap-4 border-b-2 border-black bg-(--paper) px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <button
            aria-label="返回"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-black bg-white shadow-[2px_2px_0_black] transition active:translate-y-0.5 active:shadow-none"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <Link className="hidden md:block" href="/">
            <BrandMark />
          </Link>
          <Link className="md:hidden" href="/">
            <BrandMark compact />
          </Link>
          <span className="hidden text-black/25 md:block">/</span>
          <input
            aria-label="简历名称"
            className="min-w-0 max-w-65 rounded-xl border-2 border-transparent bg-[#eee9de] px-3 py-2 font-bold outline-none focus:border-black"
            value={resume.title}
            onChange={(event) => rename(event.target.value)}
          />
          <SaveStatus state={saveState} />
        </div>
        <div className="flex items-center gap-2">
          {/* <button
            aria-label="切换主题"
            className="hidden h-11 w-11 place-items-center rounded-2xl border-2 border-black bg-white shadow-[2px_2px_0_black] md:grid"
          >
            <MoonStar size={19} />
          </button> */}
          <InkButton
            variant="yellow"
            className="min-h-11 px-3 md:px-5"
            onClick={download}
          >
            <Download size={18} />
            <span className="hidden sm:inline">导出 PDF</span>
            <span className="sm:hidden">导出</span>
          </InkButton>
        </div>
      </header>

      <div className="hidden h-[calc(100vh-78px)] lg:flex">
        {/* 左侧样式面板 */}
        <div
          style={{
            width: resize.leftCollapsed ? 44 : resize.leftWidth,
            transition: resize.isDragging ? "none" : "width 200ms ease",
          }}
          className="shrink-0 overflow-hidden"
        >
          {resize.leftCollapsed ? (
            <PanelRestoreButton
              onClick={resize.expandLeft}
              label="展开样式面板"
              side="left"
            />
          ) : (
            <aside className="scrollbar-thin h-full overflow-y-auto bg-[#f6f1e7]">
              <StylePanel />
            </aside>
          )}
        </div>

        {!resize.leftCollapsed && (
          <ResizeHandle
            position="left"
            onMouseDown={resize.onLeftDragStart}
            onDoubleClick={resize.resetLeft}
          />
        )}

        {/* 中间编辑面板 */}
        <div
          style={{
            width: resize.middleCollapsed ? 44 : resize.middleWidth,
            transition: resize.isDragging ? "none" : "width 200ms ease",
          }}
          className="shrink-0 overflow-hidden"
        >
          {resize.middleCollapsed ? (
            <PanelRestoreButton
              onClick={resize.expandMiddle}
              label="展开编辑面板"
              side="right"
            />
          ) : (
            <section className="scrollbar-thin h-full overflow-y-auto">
              <EditorContent />
            </section>
          )}
        </div>

        {!resize.middleCollapsed && (
          <ResizeHandle
            position="middle"
            onMouseDown={resize.onMiddleDragStart}
            onDoubleClick={resize.resetMiddle}
          />
        )}

        {/* 右侧预览面板 */}
        <section className="min-w-0 flex-1 overflow-auto">
          <ResumePreview
            registerPage={(index, node) => {
              pageRefs.current[index] = node;
              pageRefs.current.length = 1;
            }}
          />
        </section>
      </div>

      <div className="h-[calc(100vh-78px)] lg:hidden">
        {mobileTab === "content" && (
          <div className="h-full overflow-y-auto pb-24">
            <ModuleTabs
              modules={resume.modules}
              activeModuleId={activeModuleId}
              onChange={setActiveModule}
            />
            <EditorContent />
          </div>
        )}
        {mobileTab === "style" && (
          <div className="h-full overflow-y-auto bg-[#f6f1e7] pb-24">
            <StylePanel />
          </div>
        )}
        {mobileTab === "preview" && (
          <div className="h-full overflow-auto pb-24">
            <ResumePreview
              registerPage={(index, node) => {
                pageRefs.current[index] = node;
                pageRefs.current.length = 1;
              }}
            />
          </div>
        )}
        <nav className="fixed bottom-0 left-0 right-0 z-30 grid h-19 grid-cols-3 border-t-2 border-black bg-(--paper)">
          <MobileTabButton
            active={mobileTab === "content"}
            icon={FileText}
            label="内容"
            onClick={() => setMobileTab("content")}
          />
          <MobileTabButton
            active={mobileTab === "style"}
            icon={Palette}
            label="样式"
            onClick={() => setMobileTab("style")}
          />
          <MobileTabButton
            active={mobileTab === "preview"}
            icon={Eye}
            label="预览"
            onClick={() => setMobileTab("preview")}
          />
        </nav>
      </div>
    </div>
  );
}

function ModuleTabs({
  modules,
  activeModuleId,
  onChange,
}: {
  modules: ResumeModule[];
  activeModuleId: string;
  onChange: (moduleId: string) => void;
}) {
  return (
    <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b-2 border-black/10 bg-(--paper) p-3">
      {modules.map((module) => {
        const meta = getModuleMeta(module);
        const Icon = meta.icon;
        const active = module.id === activeModuleId;
        return (
          <button
            key={module.id}
            className={`flex shrink-0 items-center gap-2 rounded-full border-2 border-black px-4 py-2 font-bold ${
              active ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => onChange(module.id)}
          >
            <Icon
              size={16}
              style={{ color: active ? meta.color : undefined }}
            />
            <span className="max-w-28 truncate">{meta.displayTitle}</span>
          </button>
        );
      })}
    </div>
  );
}

function MobileTabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Home;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative grid place-items-center text-sm font-bold ${
        active ? "text-black" : "text-black/45"
      }`}
      onClick={onClick}
    >
      <span className="flex flex-col items-center gap-1">
        <Icon size={23} strokeWidth={active ? 2.8 : 2} />
        {label}
      </span>
      {active && (
        <i className="absolute bottom-0 h-1.5 w-16 rounded-t-full bg-(--pink)" />
      )}
    </button>
  );
}

function SaveStatus({
  state,
}: {
  state: ReturnType<typeof useResumeStore.getState>["saveState"];
}) {
  const labels = {
    idle: "本地缓存",
    saving: "保存中...",
    saved: "已保存",
    error: "保存失败",
    conflict: "文件有冲突",
  };
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${
        state === "error" || state === "conflict"
          ? "bg-red-100 text-red-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {state === "saving" ? (
        <Sparkles size={12} />
      ) : (
        <LayoutDashboard size={12} />
      )}
      {labels[state]}
    </span>
  );
}
