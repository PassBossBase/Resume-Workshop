import { useCallback, useEffect, useRef, useState } from "react";
import { exportResumePdf } from "@/features/pdf-export/export-pdf";
import {
  createDefaultResume,
  type ResumeDocument,
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
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useResumeStore } from "@/stores/resume-store";
import { useToastStore } from "@/stores/toast-store";
import { useLocale } from "@/lib/i18n";
import type { MobileTab } from "./editor-mobile-tabs";
import { usePanelResize } from "./use-panel-resize";

export function useEditorShellState(id: string) {
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
  const { locale, t } = useLocale();
  const localeRef = useRef(locale);
  const messagesRef = useRef(t);

  useEffect(() => {
    localeRef.current = locale;
    messagesRef.current = t;
  }, [locale, t]);

  useEffect(() => {
    initializeDirectorySync();
  }, [initializeDirectorySync]);

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
        value =
          cached ??
          createDefaultResume(
            id,
            localeRef.current === "en-US" ? "My New Resume" : "我的新简历",
            localeRef.current,
          );
        if (!cached) await saveResume(value);
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

            if (fileNameRef.current && fileNameRef.current !== newFileName) {
              try {
                await directory.getFileHandle(fileNameRef.current);
                await directory.removeEntry(fileNameRef.current);
                fileStampRef.current = undefined;
              } catch {
                addToast(messagesRef.current.editor.oldFileDeleteFailed, "info");
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
            ? messagesRef.current.editor.directoryConflict
            : messagesRef.current.editor.directorySaveFailed;
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

  const registerPage = useCallback(
    (index: number, node: HTMLDivElement | null) => {
      pageRefs.current[index] = node;
      pageRefs.current.length = 1;
    },
    [],
  );

  const download = async () => {
    const pages = pageRefs.current.filter((page): page is HTMLDivElement =>
      Boolean(page),
    );
    if (!resume || pages.length === 0) return;
    await exportResumePdf(pages, resume.title, resume, {
      canvasFailed: messagesRef.current.editor.pdfCanvasFailed,
      fallbackFileName: messagesRef.current.editor.fallbackFileName,
      noPage: messagesRef.current.editor.pdfNoPage,
    });
  };

  const print = useCallback(() => {
    window.print();
  }, []);

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

  const handleApplyTemplate = (templateResume: ResumeDocument) => {
    applyTemplateLayout(templateResume);
    setTemplateModalOpen(false);
  };

  return {
    activeModuleId,
    download,
    print,
    handleApplyTemplate,
    handleImportedResume,
    importResumeOpen,
    mobileTab,
    ready,
    registerPage,
    rename,
    resize,
    resume,
    saveState,
    setActiveModule,
    setImportResumeOpen,
    setMobileTab,
    setTemplateModalOpen,
    templateModalOpen,
  };
}
