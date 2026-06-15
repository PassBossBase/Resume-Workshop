"use client";

import { useEffect, type RefObject } from "react";

interface UseOverlayOptions {
  /** 为 true 时忽略 Escape 按键 */
  disabled?: boolean;
  /** 为 true 时锁定页面滚动。默认 true */
  lockScroll?: boolean;
  /** 弹窗打开时自动聚焦的 ref */
  focusRef?: RefObject<HTMLElement | null>;
  /** 弹窗关闭回调 */
  onClose: () => void;
}

/**
 * 封装弹窗通用生命周期：Escape 关闭、body 滚动锁定、可选的自动聚焦。
 * 用于模态框、对话框、移动端导航等场景。
 */
export function useOverlay(open: boolean, options: UseOverlayOptions) {
  const { disabled = false, lockScroll = true, focusRef, onClose } = options;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = lockScroll
      ? document.body.style.overflow
      : undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) onClose();
    };

    if (lockScroll) document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    focusRef?.current?.focus();

    return () => {
      if (lockScroll) document.body.style.overflow = previousOverflow ?? "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, disabled, lockScroll, focusRef, onClose]);
}
