"use client";

import {
  CheckCircle2,
  FolderOpen,
  HardDrive,
  RefreshCcw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { useEffect, useState } from "react";
import { InkButton, StickerCard } from "@/components/anime-ui/ui";
import {
  resumeFileName,
  writeResumeFile,
} from "@/features/storage/directory-sync";
import {
  listResumes,
  loadSetting,
  saveSetting,
} from "@/features/storage/resume-repository";

type Status = "unsupported" | "idle" | "granted" | "denied" | "syncing";

export function DirectorySettings() {
  const [handle, setHandle] = useState<FileSystemDirectoryHandle>();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("尚未连接同步目录");

  useEffect(() => {
    const restore = async () => {
      if (!("showDirectoryPicker" in window)) {
        setStatus("unsupported");
        setMessage("当前浏览器不支持目录同步，请使用桌面版 Chrome");
        return;
      }
      const stored =
        await loadSetting<FileSystemDirectoryHandle>("directory-handle");
      if (!stored) return;
      setHandle(stored);
      const permission = await stored.queryPermission({ mode: "readwrite" });
      setStatus(permission === "granted" ? "granted" : "denied");
      setMessage(
        permission === "granted"
          ? `已连接：${stored.name}`
          : `需要重新授权：${stored.name}`,
      );
    };
    restore().catch(() => setStatus("denied"));
  }, []);

  const syncCachedResumes = async (directory: FileSystemDirectoryHandle) => {
    setStatus("syncing");
    setMessage("正在迁移浏览器缓存...");
    const resumes = await listResumes();
    for (const resume of resumes) {
      const file = await directory.getFileHandle(resumeFileName(resume.id), {
        create: true,
      });
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
    setStatus("granted");
    setMessage(`已连接：${directory.name}，迁移 ${resumes.length} 份简历`);
  };

  const choose = async () => {
    const directory = await window.showDirectoryPicker({
      id: "resume-workshop",
      mode: "readwrite",
    });
    const permission = await directory.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      setStatus("denied");
      setMessage("目录授权未完成");
      return;
    }
    await saveSetting("directory-handle", directory);
    setHandle(directory);
    await syncCachedResumes(directory);
  };

  const reconnect = async () => {
    if (!handle) return choose();
    const permission = await handle.requestPermission({ mode: "readwrite" });
    if (permission === "granted") await syncCachedResumes(handle);
  };

  const disconnect = async () => {
    await saveSetting("directory-handle", null);
    setHandle(undefined);
    setStatus("idle");
    setMessage("已断开目录，之后将继续保存到浏览器缓存");
  };

  return (
    <div className="mx-auto max-w-375 px-5 py-8 md:px-10 lg:py-10">
      <span className="inline-block rotate-1 rounded-full border-2 border-black bg-[var(--mint)] px-4 py-1 text-sm font-black">
        PRIVATE BY DEFAULT
      </span>
      <h1 className="mt-4 text-4xl font-black md:text-6xl">通用设置</h1>
      <p className="mt-3 text-black/55">
        桌面 Chrome 可以把本地目录作为权威数据源；手机始终使用浏览器缓存。
      </p>

      <StickerCard className="mt-9 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b-2 border-black bg-[#fff0e6] p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-black bg-[var(--orange)] text-white shadow-[3px_3px_0_black]">
            <FolderOpen />
          </span>
          <div>
            <h2 className="text-2xl font-black">同步目录</h2>
            <p className="mt-1 text-black/55">选择一个文件夹保存和备份简历。</p>
          </div>
        </div>
        <div className="p-6">
          <div
            className={`flex flex-wrap items-center justify-between gap-5 rounded-2xl border-2 border-dashed border-black p-5 ${
              status === "granted" ? "bg-emerald-50" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4">
              {status === "granted" ? (
                <CheckCircle2 className="text-emerald-600" size={28} />
              ) : (
                <HardDrive size={28} />
              )}
              <div>
                <strong className="block">{message}</strong>
                <small className="text-black/45">
                  简历文件名使用内部 ID，避免重名覆盖。
                </small>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <InkButton
                disabled={status === "unsupported" || status === "syncing"}
                onClick={status === "denied" ? reconnect : choose}
                variant="yellow"
              >
                {status === "denied" ? (
                  <RefreshCcw size={17} />
                ) : (
                  <FolderOpen size={17} />
                )}
                {status === "denied" ? "重新授权" : "选择文件夹"}
              </InkButton>
              {handle && (
                <InkButton onClick={disconnect} variant="paper">
                  <Unplug size={17} />
                  断开
                </InkButton>
              )}
            </div>
          </div>
        </div>
      </StickerCard>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <StickerCard className="p-6">
          <ShieldCheck className="mb-4 text-[var(--blue)]" size={32} />
          <h3 className="text-xl font-black">数据不会上传</h3>
          <p className="mt-2 leading-7 text-black/55">
            应用没有账号、服务器或云同步，目录读写均发生在当前设备。
          </p>
        </StickerCard>
        <StickerCard className="p-6">
          <HardDrive className="mb-4 text-[var(--pink)]" size={32} />
          <h3 className="text-xl font-black">移动端独立保存</h3>
          <p className="mt-2 leading-7 text-black/55">
            手机使用 IndexedDB，支持完整编辑，但不会与桌面目录自动互通。
          </p>
        </StickerCard>
      </div>
    </div>
  );
}
