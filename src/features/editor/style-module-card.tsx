import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import type { DragEvent } from "react";
import { InkButton } from "@/components/anime-ui/ui";
import type { ResumeModule } from "@/features/resume-model/resume-model";
import { getModuleMeta } from "./module-meta";
import { useLocale } from "@/lib/i18n";

export function StyleModuleCard({
  activeModuleId,
  dragIndex,
  dropTarget,
  index,
  module,
  onDeleteClick,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onSelect,
  onToggle,
}: {
  activeModuleId: string;
  dragIndex: number | null;
  dropTarget: number | null;
  index: number;
  module: ResumeModule;
  onDeleteClick: (moduleId: string) => void;
  onDragEnd: () => void;
  onDragLeave: () => void;
  onDragOver: (event: DragEvent, index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onSelect: (moduleId: string) => void;
  onToggle: (moduleId: string) => void;
}) {
  const { locale, t } = useLocale();
  const meta = getModuleMeta(module, locale);
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
              ? "border-black bg-(--yellow) "
              : "border-black/15 bg-white"
      }`}
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => onDragOver(event, index)}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
    >
      <InkButton
        className="flex min-w-0 flex-1 items-center gap-3 text-left font-bold"
        onClick={() => onSelect(module.id)}
        aria-label={t.stylePanel.editAria(meta.displayTitle)}
        type="button"
        unstyled
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-black"
          style={{ background: meta.color }}
        >
          <Icon size={16} color="white" />
        </span>
        <span className="truncate">{meta.displayTitle}</span>
      </InkButton>
      {!isBasics && (
        <div className="flex shrink-0 items-center gap-0">
          <span
            className="grid h-7 w-7 cursor-grab place-items-center rounded-lg text-black/55 transition-colors hover:bg-black/10 active:cursor-grabbing"
            aria-label={t.stylePanel.dragAria(meta.displayTitle)}
          >
            <GripVertical size={16} />
          </span>
          <InkButton
            aria-label={
              module.visible
                ? t.stylePanel.hideAria(meta.displayTitle)
                : t.stylePanel.showAria(meta.displayTitle)
            }
            className="h-7 w-7 p-0 rounded-lg border-0 text-black/55 hover:bg-black/10"
            iconOnly
            onClick={() => onToggle(module.id)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {module.visible ? <Eye size={17} /> : <EyeOff size={17} />}
          </InkButton>
          {isCustom && (
            <InkButton
              aria-label={t.stylePanel.deleteAria(meta.displayTitle)}
              className="h-7 w-7 p-0 rounded-lg border-0 text-red-500 shadow-none hover:bg-black/10"
              iconOnly
              onClick={() => onDeleteClick(module.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 size={16} />
            </InkButton>
          )}
        </div>
      )}
    </div>
  );
}
