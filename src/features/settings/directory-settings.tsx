"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  HardDrive,
  RefreshCcw,
  ShieldCheck,
  Unplug,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InkButton, Modal, PageContainer, PageHeading, StickerCard } from "@/components/anime-ui/ui";
import { useOverlay } from "@/hooks/use-overlay";
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
  const [showDisconnect, setShowDisconnect] = useState(false);
  const closeDisconnectRef = useRef<HTMLButtonElement>(null);
  const [syncResult, setSyncResult] = useState<{
    directoryName: string;
    resumeCount: number;
  } | null>(null);
  const closeSyncResultRef = useRef<HTMLButtonElement>(null);

  useOverlay(showDisconnect, {
    focusRef: closeDisconnectRef,
    onClose: () => setShowDisconnect(false),
  });
  useOverlay(Boolean(syncResult), {
    focusRef: closeSyncResultRef,
    onClose: () => setSyncResult(null),
  });

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
    return resumes.length;
  };

  const choose = async () => {
    let directory: FileSystemDirectoryHandle;
    try {
      directory = await window.showDirectoryPicker({
        id: "resume-workshop",
        mode: "readwrite",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    }
    const permission = await directory.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      setStatus("denied");
      setMessage("目录授权未完成");
      return;
    }
    await saveSetting("directory-handle", directory);
    setHandle(directory);
    const count = await syncCachedResumes(directory);
    setSyncResult({ directoryName: directory.name, resumeCount: count });
  };

  const reconnect = async () => {
    if (!handle) return choose();
    const permission = await handle.requestPermission({ mode: "readwrite" });
    if (permission === "granted") {
      const count = await syncCachedResumes(handle);
      setSyncResult({ directoryName: handle.name, resumeCount: count });
    }
  };

  const disconnect = async () => {
    await saveSetting("directory-handle", null);
    setHandle(undefined);
    setStatus("idle");
    setMessage("已断开目录，之后将继续保存到浏览器缓存");
  };

  return (
    <PageContainer>
      <PageHeading
        badge="PRIVATE BY DEFAULT"
        badgeColor="bg-[var(--mint)]"
        badgeRotation="rotate-1"
        title="通用设置"
        subtitle="桌面 Chrome 可以把本地目录作为权威数据源；手机始终使用浏览器缓存。"
      />

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
                <InkButton onClick={() => setShowDisconnect(true)} variant="paper">
                  <Unplug size={17} />
                  断开
                </InkButton>
              )}
            </div>
          </div>
        </div>
      </StickerCard>

      <Modal
        ariaLabelledby="disconnect-dir-title"
        onClose={() => setShowDisconnect(false)}
        open={showDisconnect}
        size="sm"
      >
        <div className="comic-dots border-b-2 border-black bg-[#fff0e6] px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--orange) text-white shadow-[3px_3px_0_black]">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-1">
              <span className="text-xs font-black tracking-[0.18em] text-orange-700">
                同步设置
              </span>
              <h2
                className="mt-1 text-2xl font-black"
                id="disconnect-dir-title"
              >
                确认断开目录同步？
              </h2>
            </div>
          </div>
          <button
            aria-label="关闭断开确认"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white transition hover:bg-(--yellow)"
            onClick={() => setShowDisconnect(false)}
            ref={closeDisconnectRef}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="leading-7 text-black/60">
            你正在断开目录
            <strong className="mx-1 text-black">
              &ldquo;{handle?.name}&rdquo;
            </strong>
            。断开后简历将继续保存到浏览器缓存，不会删除本地文件夹中已有的文件。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InkButton
              onClick={() => setShowDisconnect(false)}
              variant="paper"
            >
              取消
            </InkButton>
            <InkButton
              aria-label="确认断开"
              className="bg-orange-500 text-white"
              onClick={() => {
                disconnect();
                setShowDisconnect(false);
              }}
              variant="pink"
            >
              <Unplug size={17} />
              确认断开
            </InkButton>
          </div>
        </div>
      </Modal>

      <Modal
        ariaLabelledby="sync-result-title"
        onClose={() => setSyncResult(null)}
        open={Boolean(syncResult)}
        size="sm"
      >
        <div className="comic-dots border-b-2 border-black bg-[#f0faf0] px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-emerald-500 text-white shadow-[3px_3px_0_black]">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-1">
              <span className="text-xs font-black tracking-[0.18em] text-emerald-700">
                同步完成
              </span>
              <h2
                className="mt-1 text-2xl font-black"
                id="sync-result-title"
              >
                目录连接成功
              </h2>
            </div>
          </div>
          <button
            aria-label="关闭同步结果"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white transition hover:bg-(--yellow)"
            onClick={() => setSyncResult(null)}
            ref={closeSyncResultRef}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="leading-7 text-black/60">
            已成功连接目录
            <strong className="mx-1 text-black">
              &ldquo;{syncResult?.directoryName}&rdquo;
            </strong>
            ，共同步
            <strong className="mx-1 text-black">
              {syncResult?.resumeCount}
            </strong>
            份简历。之后所有修改都会自动写入该目录。
          </p>
          <div className="mt-6">
            <InkButton
              className="w-full"
              onClick={() => setSyncResult(null)}
              variant="yellow"
            >
              知道了
            </InkButton>
          </div>
        </div>
      </Modal>

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
    </PageContainer>
  );
}
