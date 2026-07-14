import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { InkButton, SectionCard } from "@/components/anime-ui/ui";
import type { CustomResumeEntry } from "@/features/resume-model/resume-model";
import { RichTextEditor } from "@/features/rich-text/rich-text-editor";
import { DateInput } from "./date-input";
import { useT } from "@/lib/i18n";

/** 编辑单条自定义模块内容，并提供排序、显隐和删除操作。 */
export function CustomEntryCard({
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
  const t = useT();
  return (
    <SectionCard variant="beige" className="editor-entry-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InkButton
            aria-label={collapsed ? t.customModule.expand : t.customModule.collapse}
            onClick={onToggleCollapse}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
            type="button"
            unstyled
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </InkButton>
          <span
            className={`rounded-full border-2 px-3 py-1 text-xs font-black ${
              entry.visible
                ? "border-black bg-(--yellow)"
                : "border-black/25 bg-white text-black/35"
            }`}
          >
            {entry.title || t.customModule.item(index + 1)}
          </span>
          {!entry.visible && (
            <span className="text-xs font-bold text-black/35">
              {t.customModule.hidden}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {index > 0 && (
            <InkButton
              aria-label={t.editor.moveUp}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
              onClick={() => onMove(-1)}
              type="button"
              unstyled
            >
              <ArrowUp size={16} />
            </InkButton>
          )}
          {index < total - 1 && (
            <InkButton
              aria-label={t.editor.moveDown}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
              onClick={() => onMove(1)}
              type="button"
              unstyled
            >
              <ArrowDown size={16} />
            </InkButton>
          )}
          <InkButton
            aria-label={entry.visible ? t.customModule.hide : t.customModule.show}
            onClick={onToggleVisibility}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
            type="button"
            unstyled
          >
            {entry.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </InkButton>
          {deletingEntryId === entry.id ? (
            <span className="flex items-center gap-1">
              <InkButton
                onClick={() => {
                  onRemove();
                  setDeletingEntryId(null);
                }}
                className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white"
                type="button"
                unstyled
              >
                {t.customModule.confirm}
              </InkButton>
              <InkButton
                onClick={() => setDeletingEntryId(null)}
                className="rounded-lg border border-black px-2 py-1 text-xs font-bold"
                type="button"
                unstyled
              >
                {t.customModule.cancel}
              </InkButton>
            </span>
          ) : (
            <InkButton
              aria-label={t.customModule.delete}
              onClick={() => setDeletingEntryId(entry.id)}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-100"
              type="button"
              unstyled
            >
              <Trash2 size={16} className="text-red-500" />
            </InkButton>
          )}
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={t.customModule.title}
              value={entry.title}
              onChange={(title) => onChange({ title })}
            />
            <Field
              label={t.customModule.subtitle}
              value={entry.subtitle}
              onChange={(subtitle) => onChange({ subtitle })}
            />
            <DateInput
              label={t.editor.startDate}
              value={entry.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <DateInput
              label={t.editor.endDate}
              value={entry.endDate}
              onChange={(endDate) => onChange({ endDate })}
            />
          </div>
          <div className="mt-4">
            <span className="mb-2 block text-sm font-bold">
              {t.customModule.details}
            </span>
            <RichTextEditor
              label={t.customModule.descriptionLabel(index + 1)}
              value={entry.description}
              onChange={(description) => onChange({ description })}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/** 自定义条目内复用的带标签表单字段。 */
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
        className="editor-form-input h-12 w-full px-4 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
