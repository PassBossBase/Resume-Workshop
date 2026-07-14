"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  HardDrive,
  RefreshCcw,
  Unplug,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  InkButton,
  Modal,
  PageContainer,
  StickerCard,
} from "@/components/anime-ui/ui";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useT } from "@/lib/i18n";

/** 连接、重新授权、迁移和断开本地同步目录的设置页主体。 */
export function DirectorySettings() {
  const t = useT();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    directoryName: string;
    resumeCount: number;
  } | null>(null);
  const status = useDirectorySyncStore((state) => state.status);
  const reason = useDirectorySyncStore((state) => state.reason);
  const handle = useDirectorySyncStore((state) => state.handle);
  const directoryName = useDirectorySyncStore((state) => state.directoryName);
  const isSupported = useDirectorySyncStore((state) => state.isSupported);
  const isSyncing = useDirectorySyncStore((state) => state.isSyncing);
  const initialize = useDirectorySyncStore((state) => state.initialize);
  const connectDirectory = useDirectorySyncStore(
    (state) => state.connectDirectory,
  );
  const disconnectDirectory = useDirectorySyncStore(
    (state) => state.disconnectDirectory,
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  const connect = async () => {
    const result = await connectDirectory();
    if (!result.ok || result.cancelled) return;
    setSyncResult({
      directoryName: result.directoryName ?? t.settings.syncDirectory,
      resumeCount: result.resumeCount ?? 0,
    });
  };

  const statusLabel = t.settings.status[status];
  const detailLabel =
    status === "synced" && directoryName
      ? t.settings.connected(directoryName)
      : t.settings.reason[reason];

  return (
    <PageContainer className="text-white">
      <p className="text-sm font-bold tracking-[0.18em] text-white/72">
        LOCAL BY DEFAULT
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
        {t.settings.title}
      </h1>
      <p className="mt-3 max-w-xl text-base font-medium leading-7 text-white/78">
        {t.settings.subtitle}
      </p>

      <StickerCard className="mt-9 overflow-hidden text-white" variant="scenic">
        <div className="flex flex-wrap items-center gap-4 border-b border-white/22 bg-white/8 p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/34 bg-cyan-100/16 text-cyan-50 shadow-[0_10px_26px_rgb(4_42_61/20%)]">
            <FolderOpen />
          </span>
          <div>
            <h2 className="text-2xl font-black">{t.settings.directoryTitle}</h2>
            <p className="mt-1 text-white/70">{t.settings.directoryCopy}</p>
          </div>
        </div>
        <div className="p-6">
          <div
            className={`flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/26 p-5 ${
              status === "synced" ? "bg-emerald-300/13" : "bg-white/8"
            }`}
          >
            <div className="flex items-center gap-4">
              {status === "synced" ? (
                <CheckCircle2 className="text-emerald-200" size={28} />
              ) : (
                <HardDrive className="text-cyan-100" size={28} />
              )}
              <div>
                <strong className="block">{statusLabel}</strong>
                <span className="mt-1 block text-sm font-medium text-white/70">
                  {detailLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <InkButton
                className="rounded-2xl"
                disabled={!isSupported || isSyncing || reason === "mobile"}
                onClick={connect}
                variant="glass"
              >
                {handle ? <RefreshCcw size={17} /> : <FolderOpen size={17} />}
                {isSyncing
                  ? t.settings.syncing
                  : handle
                    ? t.settings.reauthorize
                    : t.settings.chooseFolder}
              </InkButton>
              {handle && (
                <InkButton
                  className="rounded-2xl"
                  onClick={() => setShowDisconnect(true)}
                  variant="glass"
                >
                  <Unplug size={17} />
                  {t.settings.disconnect}
                </InkButton>
              )}
            </div>
          </div>
        </div>
      </StickerCard>

      <Modal
        appearance="glass"
        ariaLabelledby="disconnect-dir-title"
        onClose={() => setShowDisconnect(false)}
        open={showDisconnect}
        size="sm"
      >
        <div className="glass-modal-header border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-rose-100/45 bg-rose-300/22 text-rose-50">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-1">
              <span className="text-xs font-black tracking-[0.18em] text-rose-200">
                {t.settings.syncDirectory}
              </span>
              <h2
                className="mt-1 text-2xl font-black"
                id="disconnect-dir-title"
              >
                {t.settings.disconnectTitle}
              </h2>
            </div>
          </div>
          <InkButton
            aria-label={t.settings.closeDisconnect}
            className="absolute right-4 top-4"
            iconOnly
            onClick={() => setShowDisconnect(false)}
            size="icon"
            type="button"
            variant="glass"
          >
            <X size={20} />
          </InkButton>
        </div>

        <div className="glass-modal-body p-6">
          <p className="glass-modal-muted leading-7">
            {t.settings.disconnectBody(handle?.name ?? "")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InkButton
              className="rounded-2xl"
              onClick={() => setShowDisconnect(false)}
              variant="glass"
            >
              {t.dashboard.cancel}
            </InkButton>
            <InkButton
              aria-label={t.settings.confirmDisconnect}
              className="border-rose-100/45 bg-rose-400/34 text-white hover:bg-rose-400/46"
              onClick={() => {
                disconnectDirectory();
                setShowDisconnect(false);
              }}
              variant="glass"
            >
              <Unplug size={17} />
              {t.settings.confirmDisconnect}
            </InkButton>
          </div>
        </div>
      </Modal>

      <Modal
        appearance="glass"
        ariaLabelledby="sync-result-title"
        onClose={() => setSyncResult(null)}
        open={Boolean(syncResult)}
        size="sm"
      >
        <div className="glass-modal-header border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-100/45 bg-emerald-300/20 text-emerald-50">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-1">
              <span className="text-xs font-black tracking-[0.18em] text-emerald-200">
                {t.settings.syncDone}
              </span>
              <h2 className="mt-1 text-2xl font-black" id="sync-result-title">
                {t.settings.syncSuccess}
              </h2>
            </div>
          </div>
          <InkButton
            aria-label={t.settings.closeSyncResult}
            className="absolute right-4 top-4"
            iconOnly
            onClick={() => setSyncResult(null)}
            size="icon"
            type="button"
            variant="glass"
          >
            <X size={20} />
          </InkButton>
        </div>

        <div className="glass-modal-body p-6">
          <p className="glass-modal-muted leading-7">
            {syncResult
              ? t.settings.syncResultBody(
                  syncResult.directoryName,
                  syncResult.resumeCount,
                )
              : ""}
          </p>
          <div className="mt-6">
            <InkButton
              className="w-full rounded-2xl bg-white/24 hover:bg-white/32"
              onClick={() => setSyncResult(null)}
              variant="glass"
            >
              {t.settings.gotIt}
            </InkButton>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
