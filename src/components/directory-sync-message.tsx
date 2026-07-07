"use client";

import { FolderSync, RefreshCw, X } from "lucide-react";
import { InkButton } from "@/components/anime-ui/ui";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useToastStore } from "@/stores/toast-store";

const reasonText = {
  unbound: "还没有连接本地同步目录，简历当前只保存在浏览器缓存中。",
  permission: "本地同步目录需要重新授权，简历当前只保存在浏览器缓存中。",
  error: "本地目录写入失败，简历当前只保存在浏览器缓存中。",
  conflict: "本地目录文件有外部修改，当前简历处于未同步状态。",
  disconnected: "目录同步已断开，简历当前只保存在浏览器缓存中。",
  unknown: "本地目录未同步，简历当前只保存在浏览器缓存中。",
  mobile: "移动端暂不支持本地目录同步。",
  unsupported: "当前浏览器不支持目录同步，请使用桌面版 Chrome。",
};

export function DirectorySyncMessage() {
  const status = useDirectorySyncStore((state) => state.status);
  const reason = useDirectorySyncStore((state) => state.reason);
  const dismissed = useDirectorySyncStore((state) => state.dismissed);
  const isMobile = useDirectorySyncStore((state) => state.isMobile);
  const isSupported = useDirectorySyncStore((state) => state.isSupported);
  const isSyncing = useDirectorySyncStore((state) => state.isSyncing);
  const connectDirectory = useDirectorySyncStore(
    (state) => state.connectDirectory,
  );
  const dismissPrompt = useDirectorySyncStore((state) => state.dismissPrompt);
  const addToast = useToastStore((state) => state.addToast);

  if (
    dismissed ||
    status !== "unsynced" ||
    isMobile ||
    !isSupported ||
    reason === "unsupported"
  ) {
    return null;
  }

  const handleSync = async () => {
    const result = await connectDirectory();
    if (result.cancelled) return;
    if (result.ok) {
      addToast(`已同步 ${result.resumeCount ?? 0} 份简历到本地目录`);
      return;
    }
    addToast("目录同步未完成，请稍后重试", "error");
  };

  return (
    <div
      aria-live="polite"
      className="no-print fixed right-4 bottom-4 left-4 z-90 mx-auto max-w-3xl rounded-3xl border-2 border-black bg-[#fff0e6] p-3 md:right-6 md:bottom-6 md:left-auto md:w-100"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-black bg-(--orange) text-white">
          <FolderSync size={21} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm font-black text-(--ink)">
            本地目录未同步
          </strong>
          <p className="mt-1 text-sm leading-6 font-bold text-black/60">
            {reasonText[reason]}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <InkButton
              className="min-h-10 px-3"
              disabled={isSyncing}
              onClick={handleSync}
              pressable
              variant="yellow"
            >
              <RefreshCw
                className={isSyncing ? "animate-spin" : undefined}
                size={16}
              />
              {isSyncing ? "同步中..." : "同步"}
            </InkButton>
          </div>
        </div>
        <InkButton
          aria-label="关闭目录同步提示"
          className="h-9 w-9 shrink-0 rounded-xl border-2 border-transparent text-black/45 hover:border-black hover:bg-white hover:text-black"
          iconOnly
          onClick={dismissPrompt}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X size={17} strokeWidth={2.5} />
        </InkButton>
      </div>
    </div>
  );
}
