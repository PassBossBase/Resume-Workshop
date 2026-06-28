import {
  parseAndMigrateResume,
  resumeDocumentSchema,
  type ResumeDocument,
} from "@/features/resume-model/resume-model";
import { loadSetting } from "@/features/storage/resume-repository";

export type DirectorySyncIssue =
  | "unbound"
  | "mobile"
  | "permission"
  | "conflict"
  | "error";

export type DirectorySyncResult =
  | {
      status: "synced";
      directoryName: string;
      fileName?: string;
      lastModified?: number;
    }
  | {
      status: "unsynced";
      issue: DirectorySyncIssue;
      error?: unknown;
    };

export interface ResumeFileHandle {
  getFile(): Promise<{
    lastModified: number;
    text(): Promise<string>;
  }>;
  createWritable(): Promise<{
    write(value: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

export class DirectoryConflictError extends Error {
  constructor() {
    super("文件已在其他位置更新，请重新载入后再保存。");
    this.name = "DirectoryConflictError";
  }
}

export async function readResumeFile(
  handle: ResumeFileHandle,
): Promise<{ resume: ResumeDocument; lastModified: number }> {
  const file = await handle.getFile();
  const resume = parseAndMigrateResume(JSON.parse(await file.text()));
  return { resume, lastModified: file.lastModified };
}

export async function writeResumeFile(
  handle: ResumeFileHandle,
  resume: ResumeDocument,
  expectedLastModified?: number,
): Promise<number> {
  if (expectedLastModified !== undefined) {
    const current = await handle.getFile();
    if (current.lastModified !== expectedLastModified) {
      throw new DirectoryConflictError();
    }
  }

  const writer = await handle.createWritable();
  await writer.write(JSON.stringify(resumeDocumentSchema.parse(resume), null, 2));
  await writer.close();
  return (await handle.getFile()).lastModified;
}

export interface ResumeDirectoryHandle {
  name: string;
  requestPermission(options?: { mode: "readwrite" }): Promise<PermissionState>;
  queryPermission(options?: { mode: "readwrite" }): Promise<PermissionState>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<ResumeFileHandle>;
  removeEntry(name: string): Promise<void>;
  /** 遍历目录中所有条目，返回 ResumeFileHandle 集合。
   *  需要原生 FileSystemDirectoryHandle 支持（entries / Symbol.asyncIterator）。 */
  entries?(): AsyncIterableIterator<
    [string, ResumeFileHandle | ResumeDirectoryHandle]
  >;
}

// ──────────────────────────────────────
// 文件名工具
// ──────────────────────────────────────

const MAX_TITLE_CHARS = 40;

function sanitizeFileNameSegment(title: string): string {
  const cleaned = title
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .trim()
    .slice(0, MAX_TITLE_CHARS)
    .replace(/-$/g, "");
  return cleaned || "resume";
}

/** 生成目录中的简历文件名，格式为 `{名称}-{id}.json`。 */
export function resumeFileName(id: string, title?: string): string {
  const prefix = title ? sanitizeFileNameSegment(title) : "resume";
  return `${prefix}-${id}.json`;
}

// ──────────────────────────────────────
// 便捷同步函数：有绑定目录时立即写入
// ──────────────────────────────────────

/**
 * 如果当前已绑定本地目录且有读写权限，将简历立即写入目录文件。
 * 静默失败——目录写入失败不影响主流程，IndexedDB 兜底。
 */
export async function syncResumeToDirectoryIfBound(
  resume: ResumeDocument,
): Promise<DirectorySyncResult> {
  try {
    if (typeof window === "undefined") {
      return { status: "unsynced", issue: "unbound" };
    }
    const mobile =
      window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    if (mobile) return { status: "unsynced", issue: "mobile" };

    const directory =
      await loadSetting<FileSystemDirectoryHandle>("directory-handle");
    if (!directory) return { status: "unsynced", issue: "unbound" };

    const permission = await directory.queryPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      return { status: "unsynced", issue: "permission" };
    }

    const newFileName = resumeFileName(resume.id, resume.title);
    const handle = await directory.getFileHandle(newFileName, { create: true });
    const lastModified = await writeResumeFile(handle, resume);

    // 清理旧格式 resume-{id}.json 残留（如果存在）
    try {
      await directory.getFileHandle(resumeFileName(resume.id));
      await directory.removeEntry(resumeFileName(resume.id));
    } catch {
      // 旧文件不存在或无法删除时忽略
    }
    return {
      status: "synced",
      directoryName: directory.name,
      fileName: newFileName,
      lastModified,
    };
  } catch {
    // 目录写入失败时交由调用方展示为“未同步”，IndexedDB 仍兜底。
    return { status: "unsynced", issue: "error" };
  }
}

/**
 * 如果当前已绑定本地目录，删除对应的简历文件。
 * 同时尝试新旧两种命名格式，确保清理干净。
 */
export async function deleteResumeFromDirectoryIfBound(
  id: string,
  title?: string,
): Promise<DirectorySyncResult> {
  try {
    if (typeof window === "undefined") {
      return { status: "unsynced", issue: "unbound" };
    }
    const mobile =
      window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    if (mobile) return { status: "unsynced", issue: "mobile" };

    const directory =
      await loadSetting<FileSystemDirectoryHandle>("directory-handle");
    if (!directory) return { status: "unsynced", issue: "unbound" };

    const permission = await directory.queryPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      return { status: "unsynced", issue: "permission" };
    }

    // 尝试删除新格式 {title}-{id}.json
    if (title) {
      try {
        await directory.getFileHandle(resumeFileName(id, title));
        await directory.removeEntry(resumeFileName(id, title));
      } catch {
        // 文件不存在时忽略
      }
    }

    // 尝试删除旧格式 resume-{id}.json
    try {
      await directory.getFileHandle(resumeFileName(id));
      await directory.removeEntry(resumeFileName(id));
    } catch {
      // 文件不存在时忽略
    }
    return { status: "synced", directoryName: directory.name };
  } catch {
    // 目录删除失败时交由调用方展示为“未同步”。
    return { status: "unsynced", issue: "error" };
  }
}
