"use client";

import { type DragEvent, useState } from "react";
import { GripVertical, Palette, Plus, SlidersHorizontal } from "lucide-react";
import { InkSelect } from "@/components/anime-ui/ui";
import { useResumeStore } from "@/stores/resume-store";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { ThemeColorPicker } from "./style-color-picker";
import { StyleModuleCard } from "./style-module-card";
import { Control, Panel } from "./style-panel-shell";

const colors = [
  "#171717",
  "#3f57e8",
  "#ff4f91",
  "#ff7a1a",
  "#8b5cf6",
  "#27c59a",
  "#b41f3f",
];

const headingTextColors = ["#ffffff", "#171717"];
const fontFamilyOptions = [
  { value: "sans", label: "清晰黑体" },
  { value: "serif", label: "优雅宋体" },
  { value: "rounded", label: "圆润字体" },
];

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
  const updateLayoutConfig = useResumeStore(
    (state) => state.updateLayoutConfig,
  );

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  if (!resume) return null;

  const sectionBannerConfig =
    resume.layoutConfig.type === "single_column_section_banner"
      ? resume.layoutConfig
      : null;

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: DragEvent, index: number) => {
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

  return (
    <div className="space-y-5 p-5">
      <Panel title="布局" icon={<GripVertical size={18} />}>
        <div className="space-y-3">
          {resume.modules.map((module, index) => (
            <StyleModuleCard
              activeModuleId={activeModuleId}
              dragIndex={dragIndex}
              dropTarget={dropTarget}
              index={index}
              key={module.id}
              module={module}
              onDeleteClick={handleDeleteClick}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onSelect={setActiveModule}
              onToggle={toggleModule}
            />
          ))}

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

      {sectionBannerConfig && (
        <Panel
          title="标题文字颜色"
          icon={<Palette size={18} />}
          action={
            <ThemeColorPicker
              value={sectionBannerConfig.headingTextColor}
              onCommit={(color) =>
                updateLayoutConfig({ headingTextColor: color })
              }
            />
          }
        >
          <div className="flex flex-wrap gap-3">
            {headingTextColors.map((color) => (
              <button
                aria-label={`标题文字颜色 ${color}`}
                key={color}
                className={`h-9 w-9 cursor-pointer rounded-full border-2 border-black transition hover:scale-110 ${
                  sectionBannerConfig.headingTextColor === color
                    ? "ring-4 ring-(--yellow) ring-offset-2"
                    : ""
                }`}
                style={{ background: color }}
                onClick={() => updateLayoutConfig({ headingTextColor: color })}
              />
            ))}
          </div>
        </Panel>
      )}

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
          <InkSelect
            ariaLabel="选择字体风格"
            options={fontFamilyOptions}
            value={resume.styles.fontFamily}
            onValueChange={(value) => updateStyle("fontFamily", value)}
          />
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
