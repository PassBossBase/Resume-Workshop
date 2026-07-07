"use client";

import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  FileUp,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark, InkButton, Modal } from "@/components/anime-ui/ui";
import { ImportResumeModal } from "@/features/dashboard/import-resume-modal";
import { exportResumePdf } from "@/features/pdf-export/export-pdf";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import {
  createDefaultResume,
  type ResumeDocument,
  type ResumeModule,
  type TemplateId,
} from "@/features/resume-model/resume-model";
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
import { StylePanel } from "./style-panel";
import { ResumePreview } from "@/features/templates/resume-preview";
import { usePanelResize } from "./use-panel-resize";
import { ResizeHandle, PanelRestoreButton } from "./resize-handle";
import { listTemplates } from "@/features/templates/template-registry";
import { TemplateSkeletonPreview } from "@/features/templates/template-skeleton-preview";
import { useToastStore } from "@/stores/toast-store";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";

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
  const applyTemplateLayout = useResumeStore(
    (state) => state.applyTemplateLayout,
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("content");
  const [importResumeOpen, setImportResumeOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const [ready, setReady] = useState(false);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const directoryRef = useRef<FileSystemDirectoryHandle | undefined>(undefined);
  const fileStampRef = useRef<number | undefined>(undefined);
  const fileNameRef = useRef<string | undefined>(undefined);
  const initialLoadRef = useRef(true);
  const lastSaveNoticeRef = useRef("");
  const router = useRouter();
  const resize = usePanelResize();
  const directoryHandle = useDirectorySyncStore((state) => state.handle);
  const directorySyncStatus = useDirectorySyncStore((state) => state.status);
  const initializeDirectorySync = useDirectorySyncStore(
    (state) => state.initialize,
  );
  const markDirectorySynced = useDirectorySyncStore(
    (state) => state.markSynced,
  );
  const markDirectoryUnsynced = useDirectorySyncStore(
    (state) => state.markUnsynced,
  );
  const syncResumeToDirectory = useDirectorySyncStore(
    (state) => state.syncResume,
  );

  useEffect(() => {
    initializeDirectorySync();
  }, [initializeDirectorySync]);

  // 当全局目录状态获取/更新目录句柄时同步到 directoryRef
  useEffect(() => {
    directoryRef.current = directoryHandle;
  }, [directoryHandle]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const mobile =
        window.matchMedia?.("(max-width: 1023px)").matches ?? false;
      const directory = mobile
        ? undefined
        : await loadSetting<FileSystemDirectoryHandle>("directory-handle");
      directoryRef.current = directory;

      let directoryFile: Awaited<ReturnType<typeof readResumeFile>> | null =
        null;
      if (directory) {
        try {
          const permission = await directory.queryPermission({
            mode: "readwrite",
          });
          if (permission === "granted") {
            // 先尝试旧格式 resume-{id}.json，再尝试含标题的新格式
            let handle: FileSystemFileHandle | undefined;
            try {
              handle = await directory.getFileHandle(resumeFileName(id));
            } catch {
              const cached = await loadResume(id);
              if (cached) {
                try {
                  handle = await directory.getFileHandle(
                    resumeFileName(id, cached.title),
                  );
                } catch {
                  // 新旧格式都不存在
                }
              }
            }
            if (handle) {
              directoryFile = await readResumeFile(handle);
            }
          }
        } catch {
          // Cache fallback is intentional when the file was not created yet.
        }
      }

      // 合并目录文件数据，目录优先
      const cached = await loadResume(id);
      let value: ResumeDocument;
      let currentResumeSynced = false;
      if (directoryFile) {
        value = directoryFile.resume;
        fileStampRef.current = directoryFile.lastModified;
        await saveResume(value);
        fileNameRef.current = resumeFileName(id, value.title);
        currentResumeSynced = true;
        if (directory) markDirectorySynced(directory);
      } else {
        value = cached ?? createDefaultResume(id, "我的新简历");
        if (!cached) await saveResume(value);
        // 目录中无文件 → 立即写入
        if (directoryRef.current) {
          try {
            const permission = await directoryRef.current.queryPermission({
              mode: "readwrite",
            });
            if (permission === "granted") {
              const fileName = resumeFileName(id, value.title);
              const handle = await directoryRef.current.getFileHandle(
                fileName,
                { create: true },
              );
              fileStampRef.current = await writeResumeFile(handle, value);
              fileNameRef.current = fileName;
              currentResumeSynced = true;
              markDirectorySynced(directoryRef.current);
            } else {
              markDirectoryUnsynced("permission");
            }
          } catch {
            markDirectoryUnsynced("error");
          }
        } else {
          markDirectoryUnsynced("unbound");
        }
      }
      if (!cancelled) {
        load(value);
        setSaveState(currentResumeSynced ? "synced" : "unsynced");
        setReady(true);
      }
    };
    hydrate().catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [id, load, markDirectorySynced, markDirectoryUnsynced, setSaveState]);

  useEffect(() => {
    if (!resume || !ready) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const directory = directoryRef.current;
        const mobile =
          window.matchMedia?.("(max-width: 1023px)").matches ?? false;
        let currentResumeSynced = false;
        if (directory && !mobile) {
          const permission = await directory.queryPermission({
            mode: "readwrite",
          });
          if (permission === "granted") {
            const newFileName = resumeFileName(resume.id, resume.title);

            // 标题变更导致文件名变化 → 确认旧文件存在后删除
            if (fileNameRef.current && fileNameRef.current !== newFileName) {
              try {
                await directory.getFileHandle(fileNameRef.current);
                await directory.removeEntry(fileNameRef.current);
                fileStampRef.current = undefined; // 新文件，重置冲突检测基准
              } catch {
                addToast("旧版简历文件无法自动删除，请手动清理", "info");
              }
            }

            fileNameRef.current = newFileName;
            const handle = await directory.getFileHandle(newFileName, {
              create: true,
            });
            fileStampRef.current = await writeResumeFile(
              handle,
              resume,
              fileStampRef.current,
            );
            currentResumeSynced = true;
            markDirectorySynced(directory);
          } else {
            markDirectoryUnsynced("permission");
          }
        } else {
          markDirectoryUnsynced(mobile ? "mobile" : "unbound");
        }
        await saveResume(resume);
        setSaveState(currentResumeSynced ? "synced" : "unsynced");
        lastSaveNoticeRef.current = "";
      } catch (error) {
        await saveResume(resume);
        const message =
          error instanceof DirectoryConflictError
            ? "本地目录文件有外部修改，当前简历未同步"
            : "目录同步失败，当前简历已保存到浏览器缓存";
        markDirectoryUnsynced(
          error instanceof DirectoryConflictError ? "conflict" : "error",
        );
        setSaveState("unsynced");
        if (lastSaveNoticeRef.current !== message) {
          addToast(
            message,
            error instanceof DirectoryConflictError ? "error" : "info",
          );
          lastSaveNoticeRef.current = message;
        }
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [
    addToast,
    markDirectorySynced,
    markDirectoryUnsynced,
    ready,
    resume,
    setSaveState,
  ]);

  const download = async () => {
    const pages = pageRefs.current.filter((page): page is HTMLDivElement =>
      Boolean(page),
    );
    if (!resume || pages.length === 0) return;
    await exportResumePdf(pages, resume.title, resume);
  };

  const handleImportedResume = async (importedResume: ResumeDocument) => {
    if (!resume) return;
    const replacement: ResumeDocument = {
      ...importedResume,
      id: resume.id,
      createdAt: resume.createdAt,
      updatedAt: new Date().toISOString(),
    };
    load(replacement);
    await saveResume(replacement);
    const syncResult = await syncResumeToDirectory(replacement);
    if (syncResult.status === "synced") {
      fileStampRef.current = syncResult.lastModified;
      fileNameRef.current = syncResult.fileName;
    }
    setSaveState(syncResult.status === "synced" ? "synced" : "unsynced");
  };

  useEffect(() => {
    if (
      !ready ||
      !resume ||
      directorySyncStatus !== "synced" ||
      saveState === "synced"
    ) {
      return;
    }

    let cancelled = false;
    const syncCurrentResume = async () => {
      const syncResult = await syncResumeToDirectory(resume);
      if (cancelled) return;
      if (syncResult.status === "synced") {
        fileStampRef.current = syncResult.lastModified;
        fileNameRef.current = syncResult.fileName;
        lastSaveNoticeRef.current = "";
        setSaveState("synced");
      } else {
        setSaveState("unsynced");
      }
    };
    syncCurrentResume();
    return () => {
      cancelled = true;
    };
  }, [
    directorySyncStatus,
    ready,
    resume,
    saveState,
    setSaveState,
    syncResumeToDirectory,
  ]);

  const handleApplyTemplate = (templateResume: ResumeDocument) => {
    applyTemplateLayout(templateResume);
    setTemplateModalOpen(false);
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
          <Link className="hidden md:block xl:hidden" href="/">
            <BrandMark compact />
          </Link>
          <Link className="hidden xl:block" href="/">
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
          <InkButton
            variant="blue"
            className="min-h-11 px-3 md:px-4"
            onClick={() => setImportResumeOpen(true)}
            pressable
          >
            <FileUp size={18} />
            <span className="hidden xl:inline">重新导入</span>
            <span className="xl:hidden">导入</span>
          </InkButton>
          <InkButton
            variant="pink"
            className="min-h-11 px-3 md:px-4"
            onClick={() => setTemplateModalOpen(true)}
            pressable
          >
            <LayoutTemplate size={18} />
            <span className="hidden xl:inline">更换模板</span>
            <span className="xl:hidden">模板</span>
          </InkButton>
          <InkButton
            variant="yellow"
            className="min-h-11 px-3 md:px-5"
            onClick={download}
            pressable
          >
            <Download size={18} />
            <span className="hidden sm:inline">导出 PDF</span>
            <span className="sm:hidden">导出</span>
          </InkButton>
        </div>
      </header>

      {importResumeOpen && (
        <ImportResumeModal
          initialTemplateId={resume.templateId}
          onClose={() => setImportResumeOpen(false)}
          onImportedResume={handleImportedResume}
          open={importResumeOpen}
          submitLabel="替换当前简历"
        />
      )}

      {templateModalOpen && (
        <TemplateSwitchModal
          currentTemplateId={resume.templateId}
          onApply={handleApplyTemplate}
          onClose={() => setTemplateModalOpen(false)}
          open={templateModalOpen}
        />
      )}

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
              side="left"
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
    synced: "已同步",
    unsynced: "未同步",
  };
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${
        state === "synced"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {state === "synced" ? (
        <LayoutDashboard size={12} />
      ) : (
        <Sparkles size={12} />
      )}
      {labels[state]}
    </span>
  );
}

function TemplateSwitchModal({
  currentTemplateId,
  open,
  onApply,
  onClose,
}: {
  currentTemplateId: TemplateId;
  open: boolean;
  onApply: (templateResume: ResumeDocument) => void;
  onClose: () => void;
}) {
  const templateEntries = useMemo(() => listTemplates(), []);
  const availableTemplateEntries = useMemo(
    () => templateEntries.filter((entry) => entry.id !== currentTemplateId),
    [currentTemplateId, templateEntries],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    availableTemplateEntries[0]?.id ?? currentTemplateId,
  );

  const selectedEntry =
    availableTemplateEntries.find((entry) => entry.id === selectedTemplateId) ??
    availableTemplateEntries[0];

  const apply = () => {
    const factory = builtinTemplateFactories[selectedTemplateId];
    if (!factory) return;
    onApply(factory());
  };

  return (
    <Modal
      ariaLabelledby="switch-template-title"
      className="flex flex-col"
      onClose={onClose}
      open={open}
      size="md"
    >
      <div className="comic-dots border-b-2 border-black bg-[#fff7cc] px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--yellow) shadow-[3px_3px_0_black]">
            <LayoutTemplate size={28} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 pt-1">
            <span className="text-xs font-black tracking-[0.18em] text-(--blue)">
              TEMPLATE
            </span>
            <h2 className="mt-1 text-2xl font-black" id="switch-template-title">
              更换模板
            </h2>
          </div>
        </div>
        <InkButton
          aria-label="关闭更换模板弹窗"
          className="absolute right-4 top-4 hover:bg-(--yellow)"
          iconOnly
          onClick={onClose}
          size="icon"
          type="button"
          variant="paper"
        >
          <X size={20} />
        </InkButton>
      </div>

      <div className="bg-(--canvas) p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <section className="rounded-3xl border-2 border-black bg-(--paper) p-4 shadow-[4px_4px_0_#d9d1c3]">
            <h3 className="mb-3 text-lg font-black">选择模板</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {availableTemplateEntries.map((entry) => {
                const active = entry.id === selectedTemplateId;
                return (
                  <button
                    className={`rounded-2xl border-2 px-3 py-2.5 text-left transition ${
                      active
                        ? "border-black bg-(--yellow) shadow-[3px_3px_0_black]"
                        : "border-black/20 bg-white hover:border-black"
                    }`}
                    key={entry.id}
                    onClick={() => setSelectedTemplateId(entry.id)}
                    type="button"
                  >
                    <span className="block font-black">{entry.name}</span>
                  </button>
                );
              })}
              {availableTemplateEntries.length === 0 && (
                <p className="rounded-2xl border-2 border-dashed border-black/20 bg-white px-3 py-4 text-sm font-bold text-black/45">
                  暂无其他模板
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border-2 border-black bg-(--paper) p-4 shadow-[4px_4px_0_#d9d1c3]">
            <h3 className="mb-3 text-lg font-black">模板预览</h3>
            <div className="grid h-[356px] place-items-center overflow-hidden rounded-2xl border-2 border-black bg-[#e7ebf1] p-3">
              {selectedEntry ? (
                <TemplateSkeletonPreview
                  ariaLabel={`${selectedEntry.name}模板骨架预览`}
                  className="h-[324px] w-[229px] shadow-[4px_4px_0_black]"
                  templateId={selectedEntry.id}
                />
              ) : (
                <div className="grid min-h-72 place-items-center text-sm font-bold text-black/45">
                  暂无预览
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-(--paper) px-5 py-4">
        <p className="text-sm font-medium text-black/45">
          只替换模板布局和样式，当前填写的内容会保留。
        </p>
        <div className="flex gap-3">
          <InkButton onClick={onClose} variant="paper">
            取消
          </InkButton>
          <InkButton onClick={apply} variant="pink">
            <LayoutTemplate size={17} />
            应用模板
          </InkButton>
        </div>
      </footer>
    </Modal>
  );
}
