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
      className="editor-resize-handle group flex w-1.5 shrink-0 cursor-col-resize justify-center transition-colors duration-150"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(e.clientX);
      }}
      onDoubleClick={onDoubleClick}
    >
      <span className="editor-resize-handle-line block h-full w-0.5 rounded-full transition-colors duration-150" />
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
      className={`editor-glass-panel h-full w-11 shrink-0 flex flex-col items-center pt-5 ${
        side === "left" ? "border-r" : "border-l"
      }`}
    >
      <InkButton
        onClick={onClick}
        aria-label={label}
        title={label}
        className="grid h-9 w-9 place-items-center rounded-xl"
        type="button"
        variant="glass"
      >
        <Icon size={16} />
      </InkButton>
    </div>
  );
}
