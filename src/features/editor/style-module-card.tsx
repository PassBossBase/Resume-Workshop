import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import type { DragEvent } from "react";
import { InkButton } from "@/components/anime-ui/ui";
import type { ResumeModule } from "@/features/resume-model/resume-model";
import { getModuleMeta } from "./module-meta";

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
              ? "border-black bg-(--yellow) "
              : "border-black/15 bg-white"
      }`}
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => onDragOver(event, index)}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left font-bold"
        onClick={() => onSelect(module.id)}
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
        <div className="flex shrink-0 items-center gap-0">
          <span
            className="grid h-7 w-7 cursor-grab place-items-center rounded-lg text-black/55 transition-colors hover:bg-black/10 active:cursor-grabbing"
            aria-label={`拖拽移动${meta.displayTitle}`}
          >
            <GripVertical size={16} />
          </span>
          <InkButton
            aria-label={
              module.visible
                ? `隐藏${meta.displayTitle}`
                : `显示${meta.displayTitle}`
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
              aria-label={`删除${meta.displayTitle}`}
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
