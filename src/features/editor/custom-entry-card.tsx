import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { SectionCard } from "@/components/anime-ui/ui";
import type { CustomResumeEntry } from "@/features/resume-model/resume-model";
import { RichTextEditor } from "@/features/rich-text/rich-text-editor";
import { DateInput } from "./date-input";

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
  return (
    <SectionCard variant="beige" className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          <button
            aria-label={entry.visible ? "隐藏项目" : "显示项目"}
            onClick={onToggleVisibility}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"
          >
            {entry.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          {deletingEntryId === entry.id ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => {
                  onRemove();
                  setDeletingEntryId(null);
                }}
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

      {!collapsed && (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="标题"
              value={entry.title}
              onChange={(title) => onChange({ title })}
            />
            <Field
              label="副标题"
              value={entry.subtitle}
              onChange={(subtitle) => onChange({ subtitle })}
            />
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
