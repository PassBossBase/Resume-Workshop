import { openDB, type DBSchema } from "idb";
import {
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
  return value ? resumeDocumentSchema.parse(value) : undefined;
}

export async function listResumes(): Promise<ResumeDocument[]> {
  const db = await dbPromise();
  const values = await db.getAllFromIndex("resumes", "by-updated");
  return values.reverse().map((value) => resumeDocumentSchema.parse(value));
}

export async function deleteResume(id: string): Promise<void> {
  const db = await dbPromise();
  await db.delete("resumes", id);
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await dbPromise();
  await db.put("settings", value, key);
}

export async function loadSetting<T>(key: string): Promise<T | undefined> {
  const db = await dbPromise();
  return (await db.get("settings", key)) as T | undefined;
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
