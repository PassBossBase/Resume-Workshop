"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast-store";

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: "border-green-500 bg-green-50 text-green-800",
  error: "border-red-400 bg-red-50 text-red-700",
  info: "border-blue-400 bg-blue-50 text-blue-700",
};

const iconColorMap: Record<ToastType, string> = {
  success: "text-green-600",
  error: "text-red-500",
  info: "text-blue-600",
};

/** 全局 toast 通知容器，固定于视口顶部居中 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="通知"
      aria-live="polite"
      className="no-print pointer-events-none fixed top-5 left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-3"
    >
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-bold shadow-[4px_4px_0_black] animate-pop whitespace-nowrap ${colorMap[toast.type]}`}
            role="status"
          >
            <Icon
              aria-hidden="true"
              className={`shrink-0 ${iconColorMap[toast.type]}`}
              size={20}
              strokeWidth={2.5}
            />
            <span className="text-sm">{toast.message}</span>
            <button
              aria-label="关闭提示"
              className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg transition hover:bg-black/10"
              onClick={() => removeToast(toast.id)}
              type="button"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
