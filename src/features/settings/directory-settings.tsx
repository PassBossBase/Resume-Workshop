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
  PageHeading,
  StickerCard,
} from "@/components/anime-ui/ui";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useT } from "@/lib/i18n";

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
    <PageContainer>
      <PageHeading
        badge="PRIVATE BY DEFAULT"
        badgeColor="bg-(--mint)"
        badgeRotation="rotate-1"
        title={t.settings.title}
        subtitle={t.settings.subtitle}
      />

      <StickerCard className="mt-9 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b-2 border-black bg-[#fff0e6] p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-black bg-(--orange) text-white">
            <FolderOpen />
          </span>
          <div>
            <h2 className="text-2xl font-black">{t.settings.directoryTitle}</h2>
            <p className="mt-1 text-black/55">{t.settings.directoryCopy}</p>
          </div>
        </div>
        <div className="p-6">
          <div
            className={`flex flex-wrap items-center justify-between gap-5 rounded-2xl border-2 border-dashed border-black p-5 ${
              status === "synced" ? "bg-emerald-50" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4">
              {status === "synced" ? (
                <CheckCircle2 className="text-emerald-600" size={28} />
              ) : (
                <HardDrive size={28} />
              )}
              <div>
                <strong className="block">{statusLabel}</strong>
                <span className="mt-1 block text-sm font-bold text-black/55">
                  {detailLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <InkButton
                className="shadow-[3px_3px_0_var(--line)]"
                disabled={!isSupported || isSyncing || reason === "mobile"}
                onClick={connect}
                variant="yellow"
                pressable
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
                  className="shadow-[3px_3px_0_var(--line)]"
                  onClick={() => setShowDisconnect(true)}
                  variant="paper"
                  pressable
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
            className="absolute right-4 top-4 shadow-[3px_3px_0_var(--line)] hover:bg-(--yellow)"
            iconOnly
            onClick={() => setShowDisconnect(false)}
            size="icon"
            type="button"
            variant="paper"
          >
            <X size={20} />
          </InkButton>
        </div>

        <div className="p-6">
          <p className="leading-7 text-black/60">
            {t.settings.disconnectBody(handle?.name ?? "")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InkButton
              className="shadow-[3px_3px_0_var(--line)]"
              onClick={() => setShowDisconnect(false)}
              variant="paper"
            >
              {t.dashboard.cancel}
            </InkButton>
            <InkButton
              aria-label={t.settings.confirmDisconnect}
              className="bg-orange-500 text-white shadow-[3px_3px_0_var(--line)]"
              onClick={() => {
                disconnectDirectory();
                setShowDisconnect(false);
              }}
              variant="pink"
            >
              <Unplug size={17} />
              {t.settings.confirmDisconnect}
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
                {t.settings.syncDone}
              </span>
              <h2 className="mt-1 text-2xl font-black" id="sync-result-title">
                {t.settings.syncSuccess}
              </h2>
            </div>
          </div>
          <InkButton
            aria-label={t.settings.closeSyncResult}
            className="absolute right-4 top-4 shadow-[3px_3px_0_var(--line)] hover:bg-(--yellow)"
            iconOnly
            onClick={() => setSyncResult(null)}
            size="icon"
            type="button"
            variant="paper"
          >
            <X size={20} />
          </InkButton>
        </div>

        <div className="p-6">
          <p className="leading-7 text-black/60">
            {syncResult
              ? t.settings.syncResultBody(
                  syncResult.directoryName,
                  syncResult.resumeCount,
                )
              : ""}
          </p>
          <div className="mt-6">
            <InkButton
              className="w-full shadow-[3px_3px_0_var(--line)]"
              onClick={() => setSyncResult(null)}
              variant="yellow"
            >
              {t.settings.gotIt}
            </InkButton>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
