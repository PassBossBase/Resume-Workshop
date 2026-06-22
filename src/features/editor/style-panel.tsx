"use client";

import { memo, useState } from "react";
import {
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

/** 左侧样式面板：模块排序与显隐、主题色、字号行高页边距等排版设置 */
export function StylePanel() {
  const resume = useResumeStore((state) => state.resume);
  const activeModuleId = useResumeStore((state) => state.activeModuleId);
  const setActiveModule = useResumeStore((state) => state.setActiveModule);
  const toggleModule = useResumeStore((state) => state.toggleModule);
  const reorderModule = useResumeStore((state) => state.reorderModule);
  const addCustomModule = useResumeStore((state) => state.addCustomModule);
  const removeCustomModule = useResumeStore((state) => state.removeCustomModule);
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
              aria-label={module.visible ? `隐藏${meta.displayTitle}` : `显示${meta.displayTitle}`}
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
          {resume.modules.map((module, index) => renderModuleCard(module, index))}

          {/* 添加自定义模块按钮 */}
          <button
            onClick={addCustomModule}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/25 bg-white/50 py-3 text-sm font-bold text-black/50 transition hover:border-black hover:text-black hover:bg-[var(--yellow)]/10"
          >
            <Plus size={16} />
            添加模块
          </button>
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
        <Control label="模块间距" value={`${resume.styles.sectionGap}px`}>
          <input
            max="52"
            min="16"
            type="range"
            value={resume.styles.sectionGap}
            onChange={(event) => updateStyle("sectionGap", Number(event.target.value))}
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
                event.target.value,
              )
            }
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
            resume.modules.find((m) => m.id === deletingModuleId)?.title ?? "自定义"
          }
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
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
