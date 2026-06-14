import {
  resumeDocumentSchema,
  type ResumeDocument,
} from "@/features/resume-model/resume-model";

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
  const resume = resumeDocumentSchema.parse(JSON.parse(await file.text()));
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
}

export function resumeFileName(id: string): string {
  return `resume-${id}.json`;
}
