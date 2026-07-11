"use client";

import { FolderSync, RefreshCw, X } from "lucide-react";
import { InkButton } from "@/components/anime-ui/ui";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useToastStore } from "@/stores/toast-store";
import { useT } from "@/lib/i18n";

/** 展示本地目录同步状态、错误和下一步操作的全局提示。 */
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
  const t = useT();

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
      addToast(t.directoryMessage.syncedToast(result.resumeCount ?? 0));
      return;
    }
    addToast(t.directoryMessage.failedToast, "error");
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
            {t.directoryMessage.title}
          </strong>
          <p className="mt-1 text-sm leading-6 font-bold text-black/60">
            {t.directoryMessage.reason[reason]}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <InkButton
              className="min-h-10 px-3 shadow-[3px_3px_0_var(--line)]"
              disabled={isSyncing}
              onClick={handleSync}
              pressable
              variant="yellow"
            >
              <RefreshCw
                className={isSyncing ? "animate-spin" : undefined}
                size={16}
              />
              {isSyncing ? t.directoryMessage.syncing : t.directoryMessage.sync}
            </InkButton>
          </div>
        </div>
        <InkButton
          aria-label={t.directoryMessage.close}
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
