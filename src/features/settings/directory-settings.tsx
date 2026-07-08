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

const statusText = {
  synced: "已同步",
  unsynced: "未同步",
  checking: "正在检测同步状态...",
};

const reasonText = {
  unbound: "尚未连接同步目录",
  permission: "目录需要重新授权",
  mobile: "移动端暂不支持本地目录同步",
  unsupported: "当前浏览器不支持目录同步，请使用桌面版 Chrome",
  error: "目录同步失败，请重新选择目录",
  conflict: "目录文件有外部修改，请处理冲突后再同步",
  disconnected: "已断开目录，之后将继续保存到浏览器缓存",
  unknown: "选择一个文件夹保存和备份简历",
};

export function DirectorySettings() {
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
      directoryName: result.directoryName ?? "同步目录",
      resumeCount: result.resumeCount ?? 0,
    });
  };

  const statusLabel = statusText[status];
  const detailLabel =
    status === "synced" && directoryName
      ? `已连接：${directoryName}`
      : reasonText[reason];

  return (
    <PageContainer>
      <PageHeading
        badge="PRIVATE BY DEFAULT"
        badgeColor="bg-(--mint)"
        badgeRotation="rotate-1"
        title="通用设置"
        subtitle="桌面 Chrome 可以把本地目录作为权威数据源；手机始终使用浏览器缓存。"
      />

      <StickerCard className="mt-9 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b-2 border-black bg-[#fff0e6] p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-black bg-(--orange) text-white">
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
                disabled={!isSupported || isSyncing || reason === "mobile"}
                onClick={connect}
                variant="yellow"
                pressable
              >
                {handle ? <RefreshCcw size={17} /> : <FolderOpen size={17} />}
                {isSyncing ? "同步中..." : handle ? "重新授权" : "选择文件夹"}
              </InkButton>
              {handle && (
                <InkButton
                  onClick={() => setShowDisconnect(true)}
                  variant="paper"
                  pressable
                >
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
          <InkButton
            aria-label="关闭断开确认"
            className="absolute right-4 top-4 hover:bg-(--yellow)"
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
            你正在断开目录
            <strong className="mx-1 text-black">
              &ldquo;{handle?.name}&rdquo;
            </strong>
            。断开后简历将继续保存到浏览器缓存，不会删除本地文件夹中已有的文件。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InkButton onClick={() => setShowDisconnect(false)} variant="paper">
              取消
            </InkButton>
            <InkButton
              aria-label="确认断开"
              className="bg-orange-500 text-white"
              onClick={() => {
                disconnectDirectory();
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
              <h2 className="mt-1 text-2xl font-black" id="sync-result-title">
                目录连接成功
              </h2>
            </div>
          </div>
          <InkButton
            aria-label="关闭同步结果"
            className="absolute right-4 top-4 hover:bg-(--yellow)"
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
    </PageContainer>
  );
}
