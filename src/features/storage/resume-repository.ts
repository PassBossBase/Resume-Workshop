import { openDB, type DBSchema } from "idb";
import type { z } from "zod";
import {
  parseAndMigrateResume,
  resumeDocumentSchema,
  type ResumeDocument,
} from "@/features/resume-model/resume-model";

interface ResumeDatabase extends DBSchema {
  resumes: {
    key: string;
    value: ResumeDocument;
    indexes: { "by-updated": string };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const dbPromise = () =>
  openDB<ResumeDatabase>("resume-workshop", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("resumes")) {
        const store = db.createObjectStore("resumes", { keyPath: "id" });
        store.createIndex("by-updated", "updatedAt");
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }
    },
  });

/** 保存简历到 IndexedDB，写入前通过 Zod schema 校验 */
export async function saveResume(resume: ResumeDocument): Promise<void> {
  const validResume = resumeDocumentSchema.parse(resume);
  const db = await dbPromise();
  await db.put("resumes", validResume);
}

export async function loadResume(
  id: string,
): Promise<ResumeDocument | undefined> {
  const db = await dbPromise();
  const value = await db.get("resumes", id);
  return value ? parseAndMigrateResume(value) : undefined;
}

export async function listResumes(): Promise<ResumeDocument[]> {
  const db = await dbPromise();
  const values = await db.getAllFromIndex("resumes", "by-updated");
  return values.reverse().map((value) => parseAndMigrateResume(value));
}

export async function deleteResume(id: string): Promise<void> {
  const db = await dbPromise();
  await db.delete("resumes", id);
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await dbPromise();
  await db.put("settings", value, key);
}

/**
 * 从 IndexedDB 读取一条设置。提供 Zod schema 时会在返回前做运行时校验，
 * 与 loadResume / saveResume 保持一致。
 */
export async function loadSetting<T>(
  key: string,
  schema?: z.Schema<T>,
): Promise<T | undefined> {
  const db = await dbPromise();
  const raw = await db.get("settings", key);
  if (raw === undefined) return undefined;
  if (schema) return schema.parse(raw);
  return raw as T;
}

export async function clearResumeDatabase(): Promise<void> {
  const db = await dbPromise();
  const transaction = db.transaction(["resumes", "settings"], "readwrite");
  await Promise.all([
    transaction.objectStore("resumes").clear(),
    transaction.objectStore("settings").clear(),
    transaction.done,
  ]);
}
