"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { SectionCard } from "@/components/anime-ui/ui";
import { RichTextEditor } from "@/features/rich-text/rich-text-editor";
import { DateInput } from "./date-input";
import { useResumeStore } from "@/stores/resume-store";
import type { CustomResumeEntry, CustomResumeModule } from "@/features/resume-model/resume-model";

/**
 * 自定义模块编辑区：模块名称编辑 + 自定义项目列表。
 * 项目支持折叠/展开、拖拽排序（上下按钮）、显隐切换和删除。
 */
export function CustomModuleEditor({ module: customModule }: { module: CustomResumeModule }) {
  const renameModule = useResumeStore((state) => state.renameModule);
  const addCustomEntry = useResumeStore((state) => state.addCustomEntry);
  const removeCustomEntry = useResumeStore((state) => state.removeCustomEntry);
  const moveCustomEntry = useResumeStore((state) => state.moveCustomEntry);
  const updateCustomEntry = useResumeStore((state) => state.updateCustomEntry);
  const toggleCustomEntry = useResumeStore((state) => state.toggleCustomEntry);

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(customModule.title);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const moduleId = customModule.id;

  const startRename = () => {
    setDraftName(customModule.title);
    setIsRenaming(true);
  };

  const confirmRename = () => {
    const trimmed = draftName.trim().slice(0, 6);
    if (trimmed) {
      renameModule(moduleId, trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmRename();
    if (e.key === "Escape") cancelRename();
  };

  const toggleCollapse = (entryId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  return (
    <div className="min-h-full bg-(--paper) p-5 md:p-7 xl:p-9">
      {/* 模块名称区域 */}
      <SectionCard className="mb-8 flex items-center gap-3 px-5 py-4" variant="white">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-black bg-[#6366f1]">
          <Pencil color="white" size={21} strokeWidth={2.7} />
        </span>
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex items-center gap-4">
              <input
                autoFocus
                className="h-10 w-36 rounded-xl border-2 border-black px-3 text-xl font-black outline-none"
                maxLength={6}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={handleRenameKeyDown}
              />
              <p className="ml-auto text-xs text-black/35">自定义名称已限制在6位数</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <h2 className="flex items-center gap-2 text-2xl font-black">
                {customModule.title || "未命名模块"}
                <button
                  aria-label="重命名模块"
                  onClick={startRename}
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10"
                >
                  <Pencil size={15} />
                </button>
              </h2>
              <p className="ml-auto text-xs text-black/35">自定义名称已限制在6位数</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 自定义项目列表 */}
      {customModule.items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-black/25 bg-white/60 py-16 text-center">
          <p className="mb-3 text-lg font-black text-black/40">还没有自定义项目</p>
          <p className="mb-6 text-sm text-black/30">
            点击下方按钮添加你的第一个项目
          </p>
          <button
            onClick={() => addCustomEntry(moduleId)}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-black bg-(--yellow) px-6 py-3 font-black transition hover:-translate-y-0.5"
          >
            <Plus size={19} />
            添加项目
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {customModule.items.map((item, index) => {
            const isCollapsed = collapsed.has(item.id);
            return (
              <CustomEntryCard
                key={item.id}
                entry={item}
                index={index}
                total={customModule.items.length}
                collapsed={isCollapsed}
                onToggleCollapse={() => toggleCollapse(item.id)}
                onChange={(patch) => updateCustomEntry(moduleId, item.id, patch)}
                onMove={(dir) => moveCustomEntry(moduleId, item.id, dir)}
                onToggleVisibility={() => toggleCustomEntry(moduleId, item.id)}
                onRemove={() => removeCustomEntry(moduleId, item.id)}
                deletingEntryId={deletingEntryId}
                setDeletingEntryId={setDeletingEntryId}
              />
            );
          })}
          <button
            onClick={() => addCustomEntry(moduleId)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black bg-(--yellow) py-4 font-black transition hover:-translate-y-0.5"
          >
            <Plus size={19} />
            添加项目
          </button>
        </div>
      )}
    </div>
  );
}

/** 单个自定义项目卡片 */
function CustomEntryCard({
  entry,
  index,
  total,
  collapsed,
  onToggleCollapse,
  onChange,
  onMove,
  onToggleVisibility,
  onRemove,
  deletingEntryId,
  setDeletingEntryId,
}: {
  entry: CustomResumeEntry;
  index: number;
  total: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onChange: (patch: Partial<CustomResumeEntry>) => void;
  onMove: (direction: -1 | 1) => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  deletingEntryId: string | null;
  setDeletingEntryId: (id: string | null) => void;
}) {
  return (
    <SectionCard variant="beige" className="p-5">
      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 折叠/展开 */}
          <button
            aria-label={collapsed ? "展开项目" : "折叠项目"}
            onClick={onToggleCollapse}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>
          <span
            className={`rounded-full border-2 px-3 py-1 text-xs font-black ${
              entry.visible
                ? "border-black bg-(--yellow)"
                : "border-black/25 bg-white text-black/35"
            }`}
          >
            {entry.title || `项目 ${index + 1}`}
          </span>
          {!entry.visible && (
            <span className="text-xs font-bold text-black/35">已隐藏</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 上移/下移 */}
          <button
            aria-label="上移"
            disabled={index === 0}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10 disabled:opacity-25"
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={16} />
          </button>
          <button
            aria-label="下移"
            disabled={index === total - 1}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10 disabled:opacity-25"
            onClick={() => onMove(1)}
          >
            <ArrowDown size={16} />
          </button>
          {/* 显隐切换 */}
          <button
            aria-label={entry.visible ? "隐藏项目" : "显示项目"}
            onClick={onToggleVisibility}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
          >
            {entry.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          {/* 删除 */}
          {deletingEntryId === entry.id ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => { onRemove(); setDeletingEntryId(null); }}
                className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white"
              >
                确认
              </button>
              <button
                onClick={() => setDeletingEntryId(null)}
                className="rounded-lg border border-black px-2 py-1 text-xs font-bold"
              >
                取消
              </button>
            </span>
          ) : (
            <button
              aria-label="删除项目"
              onClick={() => setDeletingEntryId(entry.id)}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-100"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* 展开内容 */}
      {!collapsed && (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="标题" value={entry.title} onChange={(title) => onChange({ title })} />
            <Field label="副标题" value={entry.subtitle} onChange={(subtitle) => onChange({ subtitle })} />
            <DateInput
              label="开始时间"
              value={entry.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <DateInput
              label="结束时间"
              value={entry.endDate}
              onChange={(endDate) => onChange({ endDate })}
            />
          </div>
          <div className="mt-4">
            <span className="mb-2 block text-sm font-bold">详细描述</span>
            <RichTextEditor
              label={`自定义项目 ${index + 1} 描述`}
              value={entry.description}
              onChange={(description) => onChange({ description })}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="h-12 w-full rounded-2xl border-2 border-black/15 px-4 outline-none focus:border-black"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
