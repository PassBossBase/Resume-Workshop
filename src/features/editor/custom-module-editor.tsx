"use client";

import { useState } from "react";
import {
  Pencil,
  Plus,
} from "lucide-react";
import { InkButton, SectionCard } from "@/components/anime-ui/ui";
import { useResumeStore } from "@/stores/resume-store";
import type { CustomResumeModule } from "@/features/resume-model/resume-model";
import { CustomEntryCard } from "./custom-entry-card";
import { useT } from "@/lib/i18n";

/**
 * 自定义模块编辑区：模块名称编辑 + 自定义项目列表。
 * 项目支持折叠/展开、拖拽排序（上下按钮）、显隐切换和删除。
 */
export function CustomModuleEditor({ module: customModule }: { module: CustomResumeModule }) {
  const t = useT();
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
    <div className="editor-form-sheet min-h-full p-5 md:p-7 xl:p-9">
      {/* 模块名称区域 */}
      <SectionCard className="editor-form-heading mb-7 flex items-center gap-3 px-5 py-4" variant="white">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-black bg-[#6366f1]">
          <Pencil color="white" size={21} strokeWidth={2.7} />
        </span>
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex items-center gap-4">
              <input
                autoFocus
                className="editor-form-input h-10 w-36 px-3 text-xl font-black outline-none"
                maxLength={6}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={handleRenameKeyDown}
              />
              <p className="ml-auto text-xs text-black/35">
                {t.customModule.nameLimit}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <h2 className="flex items-center gap-2 text-2xl font-black">
                {customModule.title || t.customModule.unnamed}
                <InkButton
                  aria-label={t.customModule.rename}
                  onClick={startRename}
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10"
                  type="button"
                  unstyled
                >
                  <Pencil size={15} />
                </InkButton>
              </h2>
              <p className="ml-auto text-xs text-black/35">
                {t.customModule.nameLimit}
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 自定义项目列表 */}
      {customModule.items.length === 0 ? (
        <div className="editor-form-empty-state py-16 text-center">
          <p className="mb-3 text-lg font-black text-black/40">
            {t.customModule.emptyTitle}
          </p>
          <p className="mb-6 text-sm text-black/30">
            {t.customModule.emptyCopy}
          </p>
          <InkButton
            onClick={() => addCustomEntry(moduleId)}
            className="editor-form-add-button inline-flex items-center gap-2 px-6 py-3 font-black"
            type="button"
            unstyled
          >
            <Plus size={19} />
            {t.customModule.addItem}
          </InkButton>
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
          <InkButton
            onClick={() => addCustomEntry(moduleId)}
            className="editor-form-add-button flex w-full items-center justify-center gap-2 py-4 font-black"
            type="button"
            unstyled
          >
            <Plus size={19} />
            {t.customModule.addItem}
          </InkButton>
        </div>
      )}
    </div>
  );
}
