import { describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import {
  DirectoryConflictError,
  readResumeFile,
  writeResumeFile,
  type ResumeFileHandle,
} from "./directory-sync";

class MemoryFileHandle implements ResumeFileHandle {
  content = "";
  lastModified = 0;

  async getFile() {
    return {
      lastModified: this.lastModified,
      text: async () => this.content,
    };
  }

  async createWritable() {
    return {
      write: async (value: string) => {
        this.content = value;
      },
      close: async () => {
        this.lastModified += 1;
      },
    };
  }
}

describe("directory sync", () => {
  it("writes and reads a validated resume document", async () => {
    const handle = new MemoryFileHandle();
    const resume = createDefaultResume("directory-resume");

    const stamp = await writeResumeFile(handle, resume);

    expect(stamp).toBe(1);
    expect(await readResumeFile(handle)).toEqual({
      resume,
      lastModified: 1,
    });
  });

  it("rejects a write when the file changed outside the session", async () => {
    const handle = new MemoryFileHandle();
    const resume = createDefaultResume("directory-resume");
    await writeResumeFile(handle, resume);
    handle.lastModified = 9;

    await expect(writeResumeFile(handle, resume, 1)).rejects.toBeInstanceOf(
      DirectoryConflictError,
    );
  });
});
