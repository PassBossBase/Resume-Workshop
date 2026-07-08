"use client";

import { PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { InkButton } from "@/components/anime-ui/ui";
import { useT } from "@/lib/i18n";

/**
 * 两个面板之间的拖拽分隔条。
 * 6px 宽点击区域，hover / 拖拽中高亮竖线。
 */
export function ResizeHandle({
  position,
  onMouseDown,
  onDoubleClick,
}: {
  position: "left" | "middle";
  onMouseDown: (clientX: number) => void;
  onDoubleClick?: () => void;
}) {
  const t = useT();
  const label =
    position === "left" ? t.editor.dragStylePanel : t.editor.dragEditorPanel;

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      tabIndex={-1}
      className="group w-1.5 shrink-0 cursor-col-resize flex justify-center transition-colors duration-150 hover:bg-(--ink)/8 active:bg-(--ink)/12"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(e.clientX);
      }}
      onDoubleClick={onDoubleClick}
    >
      <span className="block w-0.5 h-full rounded-full transition-colors duration-150 group-hover:bg-(--ink)/25" />
    </div>
  );
}

/**
 * 面板折叠后出现的恢复按钮条。
 * 44px 宽竖条，顶部放置展开按钮。
 */
export function PanelRestoreButton({
  onClick,
  label,
  side,
}: {
  onClick: () => void;
  label: string;
  side: "left" | "right";
}) {
  const Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;

  return (
    <div
      className={`h-full w-11 shrink-0 flex flex-col items-center pt-5 bg-[#f6f1e7] ${
        side === "left" ? "border-r-2" : "border-l-2"
      } border-black/10`}
    >
      <InkButton
        onClick={onClick}
        aria-label={label}
        title={label}
        className="grid h-9 w-9 place-items-center rounded-xl border-2 border-black bg-white shadow-[2px_2px_0_black] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_black]"
        type="button"
        unstyled
      >
        <Icon size={16} />
      </InkButton>
    </div>
  );
}
