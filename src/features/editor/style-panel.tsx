"use client";

import { memo, useState } from "react";
import {
  Eye,
  EyeOff,
  GripVertical,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { SectionCard } from "@/components/anime-ui/ui";
import { moduleMeta } from "./module-meta";
import { useResumeStore } from "@/stores/resume-store";

const colors = [
  "#171717",
  "#3f57e8",
  "#ff4f91",
  "#ff7a1a",
  "#8b5cf6",
  "#27c59a",
  "#b41f3f",
];

/** 左侧样式面板：模块排序与显隐、主题色、字号行高页边距等排版设置 */
export function StylePanel() {
  const resume = useResumeStore((state) => state.resume);
  const activeModule = useResumeStore((state) => state.activeModule);
  const setActiveModule = useResumeStore((state) => state.setActiveModule);
  const toggleModule = useResumeStore((state) => state.toggleModule);
  const reorderModule = useResumeStore((state) => state.reorderModule);
  const updateStyle = useResumeStore((state) => state.updateStyle);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
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

  return (
    <div className="space-y-5 p-5">
      <Panel title="布局" icon={<GripVertical size={18} />}>
        <div className="space-y-3">
          {resume.modules.map((module, index) => {
            const meta = moduleMeta[module.type];
            const Icon = meta.icon;
            const active = module.type === activeModule;
            const isDragging = dragIndex === index;
            const isDropTarget = dropTarget === index && dragIndex !== index;
            return (
              <div
                key={module.id}
                draggable={module.type !== "basics"}
                className={`group flex items-center gap-2 rounded-2xl border-2 p-2 transition ${
                  isDragging
                    ? "opacity-50"
                    : isDropTarget
                      ? "border-black border-dashed bg-[var(--yellow)]/30"
                      : active
                        ? "border-black bg-[var(--yellow)] shadow-[3px_3px_0_black]"
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
                  onClick={() => setActiveModule(module.type)}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-black"
                    style={{ background: meta.color }}
                  >
                    <Icon size={16} color="white" />
                  </span>
                  <span className="whitespace-nowrap">{module.title}</span>
                </button>
                {module.type !== "basics" && (
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      className="grid h-7 w-7 cursor-grab place-items-center rounded-lg hover:bg-black/10 active:cursor-grabbing"
                      aria-label={`拖拽移动${module.title}`}
                    >
                      <GripVertical size={16} />
                    </span>
                    <button aria-label={`切换${module.title}`} onClick={() => toggleModule(module.type)}>
                      {module.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="主题色" icon={<Palette size={18} />}>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              aria-label={`主题色 ${color}`}
              key={color}
              className={`h-9 w-9 rounded-full border-2 border-black transition hover:scale-110 ${
                resume.styles.accent === color
                  ? "ring-4 ring-[var(--yellow)] ring-offset-2"
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
            onChange={(event) => updateStyle("fontSize", Number(event.target.value))}
          />
        </Control>
        <Control label="行高" value={resume.styles.lineHeight.toFixed(2)}>
          <input
            max="2"
            min="1.2"
            step="0.05"
            type="range"
            value={resume.styles.lineHeight}
            onChange={(event) => updateStyle("lineHeight", Number(event.target.value))}
          />
        </Control>
        <Control label="页边距" value={`${resume.styles.pageMargin}px`}>
          <input
            max="64"
            min="24"
            type="range"
            value={resume.styles.pageMargin}
            onChange={(event) => updateStyle("pageMargin", Number(event.target.value))}
          />
        </Control>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-bold">字体风格</span>
          <select
            className="h-11 w-full rounded-xl border-2 border-black bg-white px-3"
            value={resume.styles.fontFamily}
            onChange={(event) =>
              updateStyle(
                "fontFamily",
                event.target.value as "sans" | "serif" | "rounded",
              )
            }
          >
            <option value="sans">清晰黑体</option>
            <option value="serif">优雅宋体</option>
            <option value="rounded">圆润字体</option>
          </select>
        </label>
      </Panel>
    </div>
  );
}

const Panel = memo(function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SectionCard className="p-4">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
        {icon}
        {title}
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
      <span className="block [&_input]:w-full [&_input]:accent-black">{children}</span>
    </label>
  );
});
