"use client";

import { RefreshCw, Unplug, X } from "lucide-react";
import { useState } from "react";
import { InkButton } from "@/components/anime-ui/ui";
import type { UseDirectoryAuthResult } from "@/hooks/use-directory-auth";
import { useToastStore } from "@/stores/toast-store";

/**
 * 目录授权恢复提示条。
 * 当已绑定的目录权限丢失时显示，提供一键恢复入口。
 */
export function DirectoryAuthPrompt({
  permission,
  reauthorize,
}: Pick<UseDirectoryAuthResult, "permission" | "reauthorize">) {
  const [dismissed, setDismissed] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  if (
    dismissed ||
    permission === "granted" ||
    permission === "unset"
  ) {
    return null;
  }

  const handleRecover = async () => {
    setRecovering(true);
    try {
      const ok = await reauthorize();
      if (ok) {
        addToast("目录同步已恢复", "success");
        // 成功后组件会因为 permission 变为 "granted" 而自动卸载
      } else {
        setRecovering(false);
        addToast("目录授权失败，请重试", "error");
      }
    } catch {
      setRecovering(false);
      addToast("目录授权失败，请重试", "error");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--line)] bg-[#fff0e6] px-4 py-2.5 md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-[var(--line)] bg-[var(--orange)] text-white">
          <Unplug size={16} />
        </span>
        <span className="truncate text-sm font-bold text-[var(--ink)]">
          目录同步已断开，编辑内容仅保存在浏览器缓存中
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <InkButton
          className="min-h-9 px-3 text-sm"
          disabled={recovering}
          onClick={handleRecover}
          variant="yellow"
        >
          <RefreshCw
            className={recovering ? "animate-spin" : ""}
            size={15}
          />
          {recovering ? "恢复中..." : "点击恢复"}
        </InkButton>
        <button
          aria-label="关闭目录同步提示"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-transparent text-[var(--ink)]/45 transition hover:border-[var(--line)] hover:text-[var(--ink)]"
          onClick={() => setDismissed(true)}
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
