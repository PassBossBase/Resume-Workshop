"use client";

import { create } from "zustand";
import {
  resumeFileName,
  syncResumeToDirectoryIfBound,
  deleteResumeFromDirectoryIfBound,
  writeResumeFile,
  type DirectorySyncIssue,
  type DirectorySyncResult,
} from "@/features/storage/directory-sync";
import {
  listResumes,
  loadSetting,
  saveSetting,
} from "@/features/storage/resume-repository";
import type { ResumeDocument } from "@/features/resume-model/resume-model";

type DirectorySyncStatus = "checking" | "synced" | "unsynced";
type DirectorySyncReason =
  | DirectorySyncIssue
  | "unsupported"
  | "disconnected"
  | "unknown";

interface ConnectDirectoryResult {
  ok: boolean;
  cancelled?: boolean;
  directoryName?: string;
  resumeCount?: number;
  reason?: DirectorySyncReason;
}

interface DirectorySyncState {
  status: DirectorySyncStatus;
  reason: DirectorySyncReason;
  handle?: FileSystemDirectoryHandle;
  directoryName: string;
  isMobile: boolean;
  isSupported: boolean;
  dismissed: boolean;
  initialized: boolean;
  isSyncing: boolean;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  connectDirectory: () => Promise<ConnectDirectoryResult>;
  disconnectDirectory: () => Promise<void>;
  syncResume: (resume: ResumeDocument) => Promise<DirectorySyncResult>;
  deleteResume: (id: string, title?: string) => Promise<DirectorySyncResult>;
  markSynced: (directory: FileSystemDirectoryHandle | string) => void;
  markUnsynced: (reason: DirectorySyncReason) => void;
  dismissPrompt: () => void;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getIsMobile() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(max-width: 1023px)").matches ?? true;
}

async function syncCachedResumesToDirectory(
  directory: FileSystemDirectoryHandle,
) {
  const resumes = await listResumes();
  for (const resume of resumes) {
    const file = await directory.getFileHandle(
      resumeFileName(resume.id, resume.title),
      { create: true },
    );
    await writeResumeFile(file, resume);
  }

  const manifest = await directory.getFileHandle("resume-workshop.json", {
    create: true,
  });
  const writer = await manifest.createWritable();
  await writer.write(
    JSON.stringify(
      {
        version: 1,
        updatedAt: new Date().toISOString(),
        resumes: resumes.map(({ id, title, updatedAt }) => ({
          id,
          title,
          updatedAt,
        })),
      },
      null,
      2,
    ),
  );
  await writer.close();
  return resumes.length;
}

function resultReason(result: DirectorySyncResult): DirectorySyncReason {
  return result.status === "synced" ? "unknown" : result.issue;
}

export const useDirectorySyncStore = create<DirectorySyncState>((set, get) => ({
  status: "checking",
  reason: "unknown",
  directoryName: "",
  isMobile: true,
  isSupported: false,
  dismissed: false,
  initialized: false,
  isSyncing: false,

  async initialize() {
    if (get().initialized) return;
    await get().refresh();
  },

  async refresh() {
    if (typeof window === "undefined") return;
    const isMobile = getIsMobile();
    const isSupported = "showDirectoryPicker" in window;

    if (isMobile) {
      set({
        status: "unsynced",
        reason: "mobile",
        handle: undefined,
        directoryName: "",
        isMobile,
        isSupported,
        initialized: true,
      });
      return;
    }

    if (!isSupported) {
      set({
        status: "unsynced",
        reason: "unsupported",
        handle: undefined,
        directoryName: "",
        isMobile,
        isSupported,
        initialized: true,
      });
      return;
    }

    const stored =
      await loadSetting<FileSystemDirectoryHandle>("directory-handle");
    if (!stored) {
      set({
        status: "unsynced",
        reason: "unbound",
        handle: undefined,
        directoryName: "",
        isMobile,
        isSupported,
        initialized: true,
      });
      return;
    }

    try {
      const permission = await stored.queryPermission({ mode: "readwrite" });
      set({
        status: permission === "granted" ? "synced" : "unsynced",
        reason: permission === "granted" ? "unknown" : "permission",
        handle: stored,
        directoryName: stored.name,
        isMobile,
        isSupported,
        initialized: true,
      });
    } catch {
      set({
        status: "unsynced",
        reason: "permission",
        handle: stored,
        directoryName: stored.name,
        isMobile,
        isSupported,
        initialized: true,
      });
    }
  },

  async connectDirectory() {
    if (typeof window === "undefined" || getIsMobile()) {
      set({ status: "unsynced", reason: "mobile" });
      return { ok: false, reason: "mobile" };
    }
    if (!("showDirectoryPicker" in window)) {
      set({ status: "unsynced", reason: "unsupported", isSupported: false });
      return { ok: false, reason: "unsupported" };
    }

    set({ isSyncing: true });
    try {
      const directory = await window.showDirectoryPicker({
        id: "resume-workshop",
        mode: "readwrite",
      });
      const permission = await directory.requestPermission({
        mode: "readwrite",
      });
      if (permission !== "granted") {
        set({
          status: "unsynced",
          reason: "permission",
          handle: directory,
          directoryName: directory.name,
          dismissed: false,
          initialized: true,
          isSyncing: false,
        });
        return { ok: false, directoryName: directory.name, reason: "permission" };
      }

      await saveSetting("directory-handle", directory);
      const resumeCount = await syncCachedResumesToDirectory(directory);
      set({
        status: "synced",
        reason: "unknown",
        handle: directory,
        directoryName: directory.name,
        isMobile: false,
        isSupported: true,
        dismissed: false,
        initialized: true,
        isSyncing: false,
      });
      return {
        ok: true,
        directoryName: directory.name,
        resumeCount,
      };
    } catch (error) {
      if (isAbortError(error)) {
        set({ isSyncing: false });
        return { ok: false, cancelled: true };
      }
      set({
        status: "unsynced",
        reason: "error",
        initialized: true,
        isSyncing: false,
      });
      return { ok: false, reason: "error" };
    }
  },

  async disconnectDirectory() {
    await saveSetting("directory-handle", null);
    set({
      status: "unsynced",
      reason: "disconnected",
      handle: undefined,
      directoryName: "",
      dismissed: true,
    });
  },

  async syncResume(resume) {
    const result = await syncResumeToDirectoryIfBound(resume);
    if (result.status === "synced") {
      set({
        status: "synced",
        reason: "unknown",
        directoryName: result.directoryName,
      });
    } else {
      set({ status: "unsynced", reason: resultReason(result) });
    }
    return result;
  },

  async deleteResume(id, title) {
    const result = await deleteResumeFromDirectoryIfBound(id, title);
    if (result.status === "synced") {
      set({
        status: "synced",
        reason: "unknown",
        directoryName: result.directoryName,
      });
    } else {
      set({ status: "unsynced", reason: resultReason(result) });
    }
    return result;
  },

  markSynced(directory) {
    set({
      status: "synced",
      reason: "unknown",
      directoryName:
        typeof directory === "string" ? directory : directory.name,
      handle: typeof directory === "string" ? get().handle : directory,
    });
  },

  markUnsynced(reason) {
    set({ status: "unsynced", reason });
  },

  dismissPrompt() {
    set({ dismissed: true });
  },
}));
