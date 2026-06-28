"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Pipette,
  Eye,
  EyeOff,
  GripVertical,
  Palette,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { SectionCard } from "@/components/anime-ui/ui";
import { getModuleMeta } from "./module-meta";
import { useResumeStore } from "@/stores/resume-store";
import type { ResumeModule } from "@/features/resume-model/resume-model";

const colors = [
  "#171717",
  "#3f57e8",
  "#ff4f91",
  "#ff7a1a",
  "#8b5cf6",
  "#27c59a",
  "#b41f3f",
];

type HsvColor = {
  h: number;
  s: number;
  v: number;
};

/* ─── 颜色工具函数 ─────────────────────────────── */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stripHash(hex: string): string {
  return hex.startsWith("#") ? hex.slice(1) : hex;
}

/** 将 3 或 6 位 hex 字符串规范化为 `#RRGGBB`，非法输入返回 null */
function normalizeHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length === 3) {
    const [r, g, b] = cleaned.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (cleaned.length === 6) {
    return `#${cleaned}`.toLowerCase();
  }
  return null;
}

function hexToHsv(hex: string): HsvColor {
  let h = hex;
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / delta + 2) / 6;
    else hue = ((r - g) / delta + 4) / 6;
  }
  return {
    h: Math.round(hue * 360),
    s: max === 0 ? 0 : Math.round((delta / max) * 100) / 100,
    v: Math.round(max * 100) / 100,
  };
}

function hsvToHex(hsv: HsvColor): string {
  const { h, s, v } = hsv;
  const hue = h / 360;
  const i = Math.floor(hue * 6);
  const f = hue * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
      break;
  }
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 左侧样式面板：模块排序与显隐、主题色、字号行高页边距等排版设置 */
export function StylePanel() {
  const resume = useResumeStore((state) => state.resume);
  const activeModuleId = useResumeStore((state) => state.activeModuleId);
  const setActiveModule = useResumeStore((state) => state.setActiveModule);
  const toggleModule = useResumeStore((state) => state.toggleModule);
  const reorderModule = useResumeStore((state) => state.reorderModule);
  const addCustomModule = useResumeStore((state) => state.addCustomModule);
  const removeCustomModule = useResumeStore(
    (state) => state.removeCustomModule,
  );
  const updateStyle = useResumeStore((state) => state.updateStyle);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  if (!resume) return null;

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTarget(index);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      reorderModule(dragIndex, index);
    }
    setDragIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropTarget(null);
  };

  const handleDeleteClick = (moduleId: string) => {
    setDeletingModuleId(moduleId);
  };

  const confirmDelete = () => {
    if (deletingModuleId) {
      removeCustomModule(deletingModuleId);
      setDeletingModuleId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingModuleId(null);
  };

  const renderModuleCard = (module: ResumeModule, index: number) => {
    const meta = getModuleMeta(module);
    const Icon = meta.icon;
    const active = module.id === activeModuleId;
    const isDragging = dragIndex === index;
    const isDropTarget = dropTarget === index && dragIndex !== index;
    const isBasics = module.type === "basics";
    const isCustom = module.type === "custom";

    return (
      <div
        key={module.id}
        draggable={!isBasics}
        className={`group flex items-center gap-2 rounded-2xl border-2 p-2 transition ${
          isDragging
            ? "opacity-50"
            : isDropTarget
              ? "border-black border-dashed bg-(--yellow)/30"
              : active
                ? "border-black bg-(--yellow) shadow-[3px_3px_0_black]"
                : "border-black/15 bg-white"
        }`}
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(index)}
        onDragEnd={handleDragEnd}
      >
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left font-bold"
          onClick={() => setActiveModule(module.id)}
          aria-label={`编辑${meta.displayTitle}`}
        >
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-black"
            style={{ background: meta.color }}
          >
            <Icon size={16} color="white" />
          </span>
          <span className="truncate">{meta.displayTitle}</span>
        </button>
        {!isBasics && (
          <div className="flex shrink-0 items-center gap-1">
            <span
              className="grid h-7 w-7 cursor-grab place-items-center rounded-lg hover:bg-black/10 active:cursor-grabbing"
              aria-label={`拖拽移动${meta.displayTitle}`}
            >
              <GripVertical size={16} />
            </span>
            <button
              aria-label={
                module.visible
                  ? `隐藏${meta.displayTitle}`
                  : `显示${meta.displayTitle}`
              }
              onClick={() => toggleModule(module.id)}
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10"
            >
              {module.visible ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
            {isCustom && (
              <button
                aria-label={`删除${meta.displayTitle}`}
                onClick={() => handleDeleteClick(module.id)}
                className="grid h-7 w-7 place-items-center rounded-lg hover:bg-red-100"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 p-5">
      <Panel title="布局" icon={<GripVertical size={18} />}>
        <div className="space-y-3">
          {resume.modules.map((module, index) =>
            renderModuleCard(module, index),
          )}

          {/* 添加自定义模块按钮 */}
          <button
            onClick={addCustomModule}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/25 bg-white/50 py-3 text-sm font-bold text-black/50 transition hover:border-black hover:text-black hover:bg-(--yellow)/10"
          >
            <Plus size={16} />
            添加模块
          </button>
        </div>
      </Panel>

      <Panel
        title="主题色"
        icon={<Palette size={18} />}
        action={
          <ThemeColorPicker
            value={resume.styles.accent}
            onCommit={(color) => updateStyle("accent", color)}
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              aria-label={`主题色 ${color}`}
              key={color}
              className={`h-9 w-9 cursor-pointer rounded-full border-2 border-black transition hover:scale-110 ${
                resume.styles.accent === color
                  ? "ring-4 ring-(--yellow) ring-offset-2"
                  : ""
              }`}
              style={{ background: color }}
              onClick={() => updateStyle("accent", color)}
            />
          ))}
        </div>
      </Panel>

      <Panel title="排版" icon={<SlidersHorizontal size={18} />}>
        <Control label="正文字号" value={`${resume.styles.fontSize}px`}>
          <input
            max="20"
            min="12"
            type="range"
            value={resume.styles.fontSize}
            onChange={(event) =>
              updateStyle("fontSize", Number(event.target.value))
            }
          />
        </Control>
        <Control label="行高" value={resume.styles.lineHeight.toFixed(2)}>
          <input
            max="2"
            min="1.2"
            step="0.05"
            type="range"
            value={resume.styles.lineHeight}
            onChange={(event) =>
              updateStyle("lineHeight", Number(event.target.value))
            }
          />
        </Control>
        <Control label="页边距" value={`${resume.styles.pageMargin}px`}>
          <input
            max="64"
            min="24"
            type="range"
            value={resume.styles.pageMargin}
            onChange={(event) =>
              updateStyle("pageMargin", Number(event.target.value))
            }
          />
        </Control>
        <Control label="模块间距" value={`${resume.styles.sectionGap}px`}>
          <input
            max="52"
            min="16"
            type="range"
            value={resume.styles.sectionGap}
            onChange={(event) =>
              updateStyle("sectionGap", Number(event.target.value))
            }
          />
        </Control>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-bold">字体风格</span>
          <select
            className="h-11 w-full rounded-xl border-2 border-black bg-white px-3"
            value={resume.styles.fontFamily}
            onChange={(event) => updateStyle("fontFamily", event.target.value)}
          >
            <option value="sans">清晰黑体</option>
            <option value="serif">优雅宋体</option>
            <option value="rounded">圆润字体</option>
          </select>
        </label>
      </Panel>

      {/* 删除确认弹窗 */}
      {deletingModuleId && (
        <DeleteConfirmDialog
          moduleTitle={
            resume.modules.find((m) => m.id === deletingModuleId)?.title ??
            "自定义"
          }
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

function ThemeColorPicker({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (color: string) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(normalizeHex(value) ?? "#3f57e8");
  const [inputValue, setInputValue] = useState(stripHash(draft));
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const hsv = useMemo(() => hexToHsv(draft), [draft]);

  const syncDraft = useCallback((color: string) => {
    const next = normalizeHex(color) ?? "#3f57e8";
    setDraft(next);
    setInputValue(stripHash(next));
  }, []);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      left: Math.min(rect.right - 320, window.innerWidth - 336),
      top: rect.bottom + 10,
    });
  }, []);

  const openPicker = () => {
    syncDraft(value);
    updatePosition();
    setOpen(true);
  };

  const commitAndClose = useCallback(() => {
    const validInput = normalizeHex(inputValue);
    onCommit(validInput ?? draft);
    setOpen(false);
  }, [draft, inputValue, onCommit]);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.setTimeout(() => popoverRef.current?.focus(), 0);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      commitAndClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") commitAndClose();
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [commitAndClose, open, updatePosition]);

  const setFromHsv = (next: HsvColor) => {
    const nextHex = hsvToHex(next);
    setDraft(nextHex);
    setInputValue(stripHash(nextHex));
  };

  const updateSaturationValue = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    setFromHsv({ ...hsv, s: x, v: 1 - y });
  };

  const updateHue = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setFromHsv({ ...hsv, h: x * 360 });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setInputValue(raw);

    const next = normalizeHex(raw);
    if (next) setDraft(next);
  };

  return (
    <>
      <button
        title="自定义主题色"
        aria-expanded={open}
        aria-label="自定义主题色"
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-black bg-white transition hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--blue)"
        onClick={() => {
          if (open) commitAndClose();
          else openPicker();
        }}
        ref={buttonRef}
        style={{ color: value }}
        type="button"
      >
        <Pipette size={17} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-100 w-80 rounded-xl border border-black/10 bg-white p-2 shadow-[0_12px_32px_rgb(0_0_0/18%)]"
              onBlurCapture={() => {
                window.setTimeout(() => {
                  const active = document.activeElement;
                  if (
                    active &&
                    (buttonRef.current?.contains(active) ||
                      popoverRef.current?.contains(active))
                  ) {
                    return;
                  }
                  commitAndClose();
                }, 0);
              }}
              ref={popoverRef}
              role="dialog"
              style={{
                left: Math.max(8, position.left),
                top: position.top,
              }}
              tabIndex={-1}
            >
              <div
                aria-label="选择颜色深浅"
                className="relative h-64 cursor-crosshair overflow-hidden rounded-t-xl"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  updateSaturationValue(event);
                }}
                onPointerMove={(event) => {
                  if (event.buttons !== 1) return;
                  updateSaturationValue(event);
                }}
                style={{
                  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-11 w-11 rounded-full border-3 border-white shadow-[0_1px_4px_rgb(0_0_0/45%)]"
                  style={{
                    left: `${hsv.s * 100}%`,
                    top: `${(1 - hsv.v) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>

              <div
                aria-label="选择颜色"
                className="relative h-9 cursor-pointer rounded-b-xl"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  updateHue(event);
                }}
                onPointerMove={(event) => {
                  if (event.buttons !== 1) return;
                  updateHue(event);
                }}
                style={{
                  background:
                    "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 h-10 w-10 rounded-full border-3 border-white shadow-[0_1px_5px_rgb(0_0_0/45%)]"
                  style={{
                    background: `hsl(${hsv.h} 100% 50%)`,
                    left: `${(hsv.h / 360) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>

              <label className="mt-4 flex items-center gap-3 px-2 pb-2">
                <span className="text-lg font-bold text-black/45">#</span>
                <input
                  aria-label="主题色十六进制值"
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-5 text-lg outline-none transition focus:border-black"
                  maxLength={6}
                  onBlur={() => {
                    const next = normalizeHex(inputValue);
                    if (next) syncDraft(next);
                  }}
                  onChange={handleInputChange}
                  value={inputValue}
                />
              </label>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** 删除自定义模块的二次确认弹窗 */
function DeleteConfirmDialog({
  moduleTitle,
  onConfirm,
  onCancel,
}: {
  moduleTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-80 rounded-2xl border-2 border-black bg-white p-6 shadow-[5px_5px_0_black]">
        <h3 className="mb-3 text-lg font-black">确认删除</h3>
        <p className="mb-5 text-sm text-black/70">
          将删除模块「{moduleTitle}」及其所有项目，此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-black px-4 py-2 font-bold transition hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl border-2 border-black bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

const Panel = memo(function Panel({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard className="p-4">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
        {icon}
        {title}
        {action && <span className="ml-auto">{action}</span>}
      </h3>
      {children}
    </SectionCard>
  );
});

const Control = memo(function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 flex justify-between text-sm font-bold">
        {label}
        <b>{value}</b>
      </span>
      <span className="block [&_input]:w-full [&_input]:accent-black">
        {children}
      </span>
    </label>
  );
});
