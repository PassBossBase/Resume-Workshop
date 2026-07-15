"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { InkButton } from "@/components/anime-ui/ui";
import { useToastStore, type ToastType } from "@/stores/toast-store";

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const iconSurfaceMap: Record<ToastType, string> = {
  success: "bg-[#7ee6d5]/20 text-[#b9f2e8]",
  error: "bg-[#ff8a80]/20 text-[#ffd0cb]",
  info: "bg-[#8cc7ff]/20 text-[#c7e8ff]",
};

/** 全局玻璃通知容器，固定于视口顶部居中。 */
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
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-[18px] border border-white/40 bg-[#063c4d]/88 px-3 py-3 text-white shadow-[0_18px_45px_rgb(2_35_48_/_42%)] ring-1 ring-inset ring-white/10 backdrop-blur-2xl animate-pop"
            role="status"
          >
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/16 ${iconSurfaceMap[toast.type]}`}
            >
              <Icon size={20} strokeWidth={2.25} />
            </span>
            <span className="min-w-0 text-sm font-semibold leading-5 text-white/94">
              {toast.message}
            </span>
            <InkButton
              aria-label="关闭提示"
              className="ml-1 h-8 w-8 shrink-0 rounded-full border border-white/14 bg-white/8 p-0 text-white/76 shadow-none hover:bg-white/16 hover:text-white focus-visible:outline-white"
              iconOnly
              onClick={() => removeToast(toast.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X size={15} strokeWidth={2.5} />
            </InkButton>
          </div>
        );
      })}
    </div>
  );
}
