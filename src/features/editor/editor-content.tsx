"use client";

import { useState, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  // CalendarDays,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  // Mail,
  // MapPin,
  Plus,
  // Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import type {
  BasicsData,
  OptionalBasicFieldKey,
  ResumeEntry,
} from "@/features/resume-model/resume-model";
import { DEFAULT_OPTIONAL_BASIC_FIELD_ORDER } from "@/features/resume-model/resume-model";
import { RichTextEditor } from "@/features/rich-text/rich-text-editor";
import { InkButton, InkSelect, SectionCard } from "@/components/anime-ui/ui";
import { DateInput } from "./date-input";
import { getModuleMeta } from "./module-meta";
import { CustomModuleEditor } from "./custom-module-editor";
import { useResumeStore } from "@/stores/resume-store";

/**
 * 编辑器中间面板：基本信息表单、模块条目列表、富文本编辑与日期输入。
 * 根据活动模块的 type 分派到对应的编辑器（basics / skills / 固定条目模块 / 自定义模块）。
 */
const basicFields = [
  ["name", "姓名"],
  ["role", "职位"],
  ["status", "状态"],
  ["birthday", "生日"],
  ["email", "邮箱"],
  ["phone", "电话"],
  ["location", "地址"],
] as const;

const fixedBasicFields = basicFields.slice(0, 2);
const optionalBasicFields = basicFields.slice(2) as Array<
  readonly [OptionalBasicFieldKey, string]
>;
const noSectionIconValue = "__none__";
const sectionIconOptions = [
  { value: noSectionIconValue, label: "无图标" },
  { value: "work", label: "工作" },
  { value: "edu", label: "教育" },
  { value: "skill", label: "技能" },
  { value: "cert", label: "证书" },
  { value: "eval", label: "评价" },
  { value: "project", label: "项目" },
  { value: "user", label: "用户" },
];

// const optionalFieldIcons: Record<OptionalBasicFieldKey, typeof UserRound> = {
//   status: UserRound,
//   birthday: CalendarDays,
//   email: Mail,
//   phone: Phone,
//   location: MapPin,
// };

function getOrderedOptionalBasicFields(
  fieldOrder: OptionalBasicFieldKey[] = DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
) {
  const order = [
    ...fieldOrder.filter(
      (field, index, fields) =>
        DEFAULT_OPTIONAL_BASIC_FIELD_ORDER.includes(field) &&
        fields.indexOf(field) === index,
    ),
    ...DEFAULT_OPTIONAL_BASIC_FIELD_ORDER.filter(
      (field) => !fieldOrder.includes(field),
    ),
  ];
  return order.map((field) => {
    const label =
      optionalBasicFields.find(([key]) => key === field)?.[1] ?? field;
    return [field, label] as const;
  });
}

function moveItemToTarget<T>(items: T[], item: T, targetItem: T): T[] {
  const fromIndex = items.indexOf(item);
  const targetIndex = items.indexOf(targetItem);
  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex)
    return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function moveItemToEnd<T>(items: T[], item: T): T[] {
  return [...items.filter((candidate) => candidate !== item), item];
}

function moveIndexToTarget<T>(
  items: T[],
  fromIndex: number,
  targetIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex >= items.length ||
    targetIndex >= items.length ||
    fromIndex === targetIndex
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function EditorContent() {
  const [draggedBasicField, setDraggedBasicField] =
    useState<OptionalBasicFieldKey | null>(null);
  const [basicDropTarget, setBasicDropTarget] =
    useState<OptionalBasicFieldKey | null>(null);
  const [draggedCustomIndex, setDraggedCustomIndex] = useState<number | null>(
    null,
  );
  const [customDropTarget, setCustomDropTarget] = useState<number | null>(null);
  const resume = useResumeStore((state) => state.resume);
  const activeModuleId = useResumeStore((state) => state.activeModuleId);
  const updateBasic = useResumeStore((state) => state.updateBasic);
  const updateBasicsField = useResumeStore((state) => state.updateBasicsField);
  const updateEntry = useResumeStore((state) => state.updateEntry);
  const addEntry = useResumeStore((state) => state.addEntry);
  const removeEntry = useResumeStore((state) => state.removeEntry);
  const moveEntry = useResumeStore((state) => state.moveEntry);
  const updateModuleMeta = useResumeStore((state) => state.updateModuleMeta);
  const updateEntryStyle = useResumeStore((state) => state.updateEntryStyle);

  if (!resume) return null;
  const activeSection = resume.modules.find(
    (item) => item.id === activeModuleId,
  );
  if (!activeSection) return null;
  const meta = getModuleMeta(activeSection);
  const Icon = meta.icon;
  const canEditSectionIcon =
    resume.templateId === "single_column_header_full_width" &&
    ["work", "projects", "education"].includes(activeSection.type);

  // 自定义模块使用独立编辑器
  if (activeSection.type === "custom") {
    return <CustomModuleEditor module={activeSection} />;
  }

  return (
    <div className="min-h-full bg-(--paper) p-5 md:p-7 xl:p-9">
      <SectionCard
        className="mb-8 flex items-center gap-3 px-5 py-4"
        variant="white"
      >
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-black"
          style={{ background: meta.color }}
        >
          <Icon color="white" size={21} strokeWidth={2.7} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/40">
            正在编辑
          </p>
          <h2 className="text-2xl font-black">{meta.displayTitle}</h2>
        </div>
      </SectionCard>

      {canEditSectionIcon && (
        <div className="mb-8">
          <label className="grid gap-1">
            <span className="text-sm font-bold">模块图标</span>
            <InkSelect
              ariaLabel="选择模块图标"
              options={sectionIconOptions}
              value={activeSection.sectionIcon ?? noSectionIconValue}
              onValueChange={(value) =>
                updateModuleMeta(activeSection.id, {
                  sectionIcon:
                    value === noSectionIconValue ? undefined : value,
                })
              }
            />
          </label>
        </div>
      )}

      {activeSection.type === "basics" && activeSection.basics ? (
        (() => {
          const basics = activeSection.basics;
          const orderedOptionalBasicFields = getOrderedOptionalBasicFields(
            basics.fieldOrder,
          );
          return (
            <div className="space-y-7">
              <section>
                <h3 className="mb-3 text-lg font-black">头像</h3>
                <label className="flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-dashed border-black bg-[#f7f4ec] p-4">
                  <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-2 border-black bg-(--yellow)">
                    {basics.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt="头像预览"
                        className="h-full w-full object-cover"
                        src={basics.avatar}
                      />
                    ) : (
                      <ImagePlus />
                    )}
                  </span>
                  <span>
                    <strong className="block">上传个人头像</strong>
                    <small className="text-black/50">
                      JPG / PNG，建议使用正方形照片
                    </small>
                  </span>
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        updateBasic("avatar", String(reader.result ?? ""));
                      reader.readAsDataURL(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {basics.avatar && (
                  <div className="mt-4">
                    <button
                      aria-label="取消个人头像"
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border-2 border-black bg-white px-4 text-sm font-black shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5"
                      type="button"
                      onClick={() => updateBasic("avatar", "")}
                    >
                      <Trash2 className="h-4 w-4" />
                      取消头像
                    </button>
                  </div>
                )}
              </section>
              <section>
                <h3 className="mb-4 text-lg font-black">基础字段</h3>
                <div>
                  {fixedBasicFields.map(([key, label]) => (
                    <BasicFieldRow
                      fixed
                      key={key}
                      label={label}
                      value={basics[key] ?? ""}
                      onChange={(value) => updateBasic(key, value)}
                    />
                  ))}
                  {orderedOptionalBasicFields
                    .filter(([key]) => !basics.removedFields.includes(key))
                    .map(([key, label]) => (
                      <BasicFieldRow
                        hidden={basics.hiddenFields.includes(key)}
                        // icon={optionalFieldIcons[key]}
                        isDragging={draggedBasicField === key}
                        isDropTarget={
                          basicDropTarget === key && draggedBasicField !== key
                        }
                        key={key}
                        label={label}
                        onDragEnd={() => {
                          setDraggedBasicField(null);
                          setBasicDropTarget(null);
                        }}
                        onDragLeave={() => setBasicDropTarget(null)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setBasicDropTarget(key);
                        }}
                        onDragStart={() => setDraggedBasicField(key)}
                        onDrop={() => {
                          if (!draggedBasicField || draggedBasicField === key)
                            return;
                          updateBasicsField({
                            fieldOrder: moveItemToTarget(
                              orderedOptionalBasicFields.map(
                                ([field]) => field,
                              ),
                              draggedBasicField,
                              key,
                            ),
                          });
                          setDraggedBasicField(null);
                          setBasicDropTarget(null);
                        }}
                        value={basics[key] ?? ""}
                        onChange={(value) => updateBasic(key, value)}
                        onRemove={() => {
                          updateBasicsField({
                            hiddenFields: basics.hiddenFields.filter(
                              (field) => field !== key,
                            ),
                            removedFields: [
                              ...new Set([...basics.removedFields, key]),
                            ],
                          });
                        }}
                        onToggle={() => {
                          const hidden = basics.hiddenFields.includes(key)
                            ? basics.hiddenFields.filter(
                                (field) => field !== key,
                              )
                            : [...basics.hiddenFields, key];
                          updateBasicsField({ hiddenFields: hidden });
                        }}
                      />
                    ))}
                  {basics.removedFields.length > 0 && (
                    <div className="rounded-3xl border-2 border-dashed border-black/15 bg-white/50 p-4">
                      <p className="mb-3 text-sm font-bold text-black/55">
                        添加基础字段
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {optionalBasicFields
                          .filter(([key]) => basics.removedFields.includes(key))
                          .map(([key, label]) => {
                            // const Icon = optionalFieldIcons[key];
                            return (
                              <button
                                className="inline-flex h-10 items-center gap-2 rounded-2xl border-2 border-black/15 bg-white px-3 text-sm font-bold transition hover:border-black hover:shadow-[3px_3px_0_var(--yellow)]"
                                key={key}
                                onClick={() => {
                                  updateBasicsField({
                                    fieldOrder: moveItemToEnd(
                                      basics.fieldOrder ??
                                        DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
                                      key,
                                    ),
                                    removedFields: basics.removedFields.filter(
                                      (field) => field !== key,
                                    ),
                                  });
                                }}
                              >
                                {/* <Icon size={16} /> */}
                                {label}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <section>
                <h3 className="mb-4 text-lg font-black">自定义字段</h3>
                <div className="space-y-3">
                  {basics.infoItems.map((item, index) => (
                    <CustomBasicFieldRow
                      isDragging={draggedCustomIndex === index}
                      isDropTarget={
                        customDropTarget === index &&
                        draggedCustomIndex !== index
                      }
                      item={item}
                      key={index}
                      onDragEnd={() => {
                        setDraggedCustomIndex(null);
                        setCustomDropTarget(null);
                      }}
                      onDragLeave={() => setCustomDropTarget(null)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setCustomDropTarget(index);
                      }}
                      onDragStart={() => setDraggedCustomIndex(index)}
                      onDrop={() => {
                        if (
                          draggedCustomIndex === null ||
                          draggedCustomIndex === index
                        )
                          return;
                        updateBasicsField({
                          infoItems: moveIndexToTarget(
                            basics.infoItems,
                            draggedCustomIndex,
                            index,
                          ),
                        });
                        setDraggedCustomIndex(null);
                        setCustomDropTarget(null);
                      }}
                      onChange={(patch) => {
                        const next = [...basics.infoItems];
                        next[index] = { ...next[index], ...patch };
                        updateBasicsField({ infoItems: next });
                      }}
                      onRemove={() => {
                        const next = basics.infoItems.filter(
                          (_, i) => i !== index,
                        );
                        updateBasicsField({ infoItems: next });
                      }}
                      onToggle={() => {
                        const next = [...basics.infoItems];
                        next[index] = {
                          ...next[index],
                          visible: item.visible === false,
                        };
                        updateBasicsField({ infoItems: next });
                      }}
                    />
                  ))}
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/25 bg-(--yellow)/50 py-3 font-bold transition hover:border-black hover:bg-(--yellow)"
                    onClick={() => {
                      const next = [
                        ...basics.infoItems,
                        { label: "", value: "", visible: true },
                      ];
                      updateBasicsField({ infoItems: next });
                    }}
                  >
                    <Plus size={16} />
                    添加信息项
                  </button>
                </div>
              </section>
            </div>
          );
        })()
      ) : activeSection.type === "skills" ? (
        <SectionCard variant="beige" className="p-5">
          <div className="mb-4">
            <h3 className="text-lg font-black">专业技能内容</h3>
            <p className="mt-1 text-sm text-black/50">
              可直接使用列表、颜色、链接和多种段落对齐方式组织全部技能。
            </p>
          </div>
          <RichTextEditor
            label="专业技能内容"
            value={activeSection.items[0]?.description ?? ""}
            onChange={(description) => {
              const firstItem = activeSection.items[0];
              if (firstItem) {
                updateEntry(activeSection.id, firstItem.id, { description });
              } else {
                addEntry(activeSection.id);
              }
            }}
          />
        </SectionCard>
      ) : (
        <div className="space-y-5">
          {activeSection.items.map((item, index) => (
            <EntryEditor
              key={item.id}
              index={index}
              item={item}
              moduleType={activeSection.type}
              onChange={(patch) =>
                updateEntry(activeSection.id, item.id, patch)
              }
              onMove={(direction) =>
                moveEntry(activeSection.id, item.id, direction)
              }
              onRemove={() => removeEntry(activeSection.id, item.id)}
              onStyleChange={
                resume.templateId === "single_column_timeline_block"
                  ? (style) => updateEntryStyle(activeSection.id, item.id, style)
                  : undefined
              }
            />
          ))}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black bg-(--yellow) py-4 font-black transition hover:-translate-y-0.5"
            onClick={() => addEntry(activeSection.id)}
          >
            <Plus size={19} />
            添加{meta.displayTitle}
          </button>
        </div>
      )}
    </div>
  );
}

function BasicFieldRow({
  fixed = false,
  hidden = false,
  icon: Icon,
  isDragging = false,
  isDropTarget = false,
  label,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  value,
  onChange,
  onRemove,
  onToggle,
}: {
  fixed?: boolean;
  hidden?: boolean;
  icon?: typeof UserRound;
  isDragging?: boolean;
  isDropTarget?: boolean;
  label: string;
  onDragEnd?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragStart?: () => void;
  onDrop?: () => void;
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div
      className={[
        "grid items-center rounded-2xl border-2 p-2 transition",
        fixed
          ? "grid-cols-[92px_minmax(0,1fr)] border-transparent md:grid-cols-[100px_minmax(0,1fr)]"
          : "grid-cols-[92px_minmax(0,1fr)_136px] md:grid-cols-[100px_minmax(0,1fr)_136px]",
        isDragging
          ? "opacity-50"
          : isDropTarget
            ? "border-black border-dashed bg-(--yellow)/30"
            : fixed
              ? ""
              : "border-transparent",
        hidden ? "opacity-55" : "",
      ].join(" ")}
      data-drag-row
      draggable={!fixed}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDragStart={(event) => {
        if (fixed) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", label);
        onDragStart?.();
      }}
      onDrop={onDrop}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="shrink-0" size={19} />}
        <span className="shrink-0 font-bold">{label}</span>
      </div>
      {label === "生日" ? (
        <DateInput hideLabel label="生日" value={value} onChange={onChange} />
      ) : (
        <input
          aria-label={label}
          className="h-12 w-full rounded-2xl border-2 border-black/15 bg-white px-4 font-medium outline-none transition focus:border-black focus:shadow-[3px_3px_0_var(--yellow)]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {(onToggle || onRemove) && (
        <div className="flex justify-end">
          {!fixed && (
            <span
              aria-label={`拖拽排序${label}`}
              className="grid h-11 w-8 cursor-grab place-items-center rounded-2xl text-black/45 transition hover:bg-black/10 active:cursor-grabbing"
            >
              <GripVertical size={19} />
            </span>
          )}
          {onToggle && (
            <InkButton
              aria-label={`${hidden ? "显示" : "隐藏"}${label}`}
              className="h-11 w-8 rounded-2xl border-2 border-transparent shadow-none hover:border-black/15 hover:bg-white"
              iconOnly
              onClick={onToggle}
              size="icon"
              type="button"
              variant="ghost"
            >
              {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </InkButton>
          )}
          {onRemove && (
            <InkButton
              aria-label={`删除${label}`}
              className="h-11 w-8 rounded-2xl border-2 border-transparent text-red-500 shadow-none hover:border-red-200 hover:bg-red-50"
              iconOnly
              onClick={onRemove}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 size={18} />
            </InkButton>
          )}
        </div>
      )}
    </div>
  );
}

function CustomBasicFieldRow({
  isDragging = false,
  isDropTarget = false,
  item,
  onChange,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onRemove,
  onToggle,
}: {
  isDragging?: boolean;
  isDropTarget?: boolean;
  item: BasicsData["infoItems"][number];
  onChange: (patch: Partial<BasicsData["infoItems"][number]>) => void;
  onDragEnd: () => void;
  onDragLeave: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const itemName = item.label || "自定义字段";
  const hidden = item.visible === false;

  return (
    <div
      className={[
        "grid items-center gap-3 rounded-3xl pr-3  transition md:grid-cols-[96px_minmax(0,1fr)_96px]",
        isDragging
          ? "opacity-50"
          : isDropTarget
            ? "border-black border-dashed bg-(--yellow)/30"
            : "border-black/10",
        hidden ? "opacity-55" : "",
      ].join(" ")}
      data-drag-row
      draggable
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", itemName);
        onDragStart();
      }}
      onDrop={onDrop}
    >
      <input
        aria-label="标签"
        className="h-12 w-full rounded-2xl border-2 border-black/10 bg-white px-4 font-medium outline-none transition focus:border-black focus:shadow-[3px_3px_0_var(--yellow)]"
        placeholder="标签"
        value={item.label}
        onChange={(event) => onChange({ label: event.target.value })}
      />
      <input
        aria-label="值"
        className="h-12 w-full rounded-2xl border-2 border-black/10 bg-white px-4 font-medium outline-none transition focus:border-black focus:shadow-[3px_3px_0_var(--yellow)]"
        placeholder="值"
        value={item.value}
        onChange={(event) => onChange({ value: event.target.value })}
      />
      <div className="flex justify-end gap-2">
        <span
          aria-label={`拖拽排序${itemName}`}
          className="grid h-11 w-9 cursor-grab place-items-center rounded-2xl text-black/45 transition hover:bg-black/10 active:cursor-grabbing"
        >
          <GripVertical size={19} />
        </span>
        <InkButton
          aria-label={`${hidden ? "显示" : "隐藏"}${itemName}`}
          className="h-11 w-11 rounded-2xl border-2 border-transparent shadow-none hover:border-black/15 hover:bg-white"
          iconOnly
          onClick={onToggle}
          size="icon"
          type="button"
          variant="ghost"
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </InkButton>
        <InkButton
          aria-label={`删除${itemName}`}
          className="h-11 w-11 rounded-2xl border-2 border-transparent text-red-500 shadow-none hover:border-red-200 hover:bg-red-50"
          iconOnly
          onClick={onRemove}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 size={18} />
        </InkButton>
      </div>
    </div>
  );
}

function EntryEditor({
  item,
  index,
  moduleType,
  onChange,
  onMove,
  onRemove,
  onStyleChange,
}: {
  item: ResumeEntry;
  index: number;
  moduleType: string;
  onChange: (patch: Partial<ResumeEntry>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onStyleChange?: (style: { bgColor?: string } | undefined) => void;
}) {
  const canToggleVisibility = ["work", "projects", "education"].includes(
    moduleType,
  );
  const hidden = item.visible === false;
  const entryLabel = item.title.trim() || `条目 ${index + 1}`;

  return (
    <SectionCard
      variant="beige"
      className={["p-5", hidden ? "opacity-55" : ""].join(" ")}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border-2 border-black bg-(--yellow) px-3 py-1 text-xs font-black">
            条目 {index + 1}
          </span>
          {hidden && (
            <span className="text-xs font-bold text-black/35">已隐藏</span>
          )}
        </div>
        <div className="flex gap-2">
          <InkButton
            aria-label="上移"
            className="h-9 w-9 rounded-xl p-0 shadow-none"
            iconOnly
            onClick={() => onMove(-1)}
            size="icon"
            type="button"
            variant="paper"
          >
            <ArrowUp size={16} />
          </InkButton>
          <InkButton
            aria-label="下移"
            className="h-9 w-9 rounded-xl p-0 shadow-none"
            iconOnly
            onClick={() => onMove(1)}
            size="icon"
            type="button"
            variant="paper"
          >
            <ArrowDown size={16} />
          </InkButton>
          {canToggleVisibility && (
            <InkButton
              aria-label={`${hidden ? "显示" : "隐藏"}${entryLabel}`}
              className="h-9 w-9 rounded-xl p-0 shadow-none"
              iconOnly
              onClick={() => onChange({ visible: hidden })}
              size="icon"
              type="button"
              variant="paper"
            >
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </InkButton>
          )}
          <InkButton
            aria-label="删除条目"
            className="h-9 w-9 rounded-xl p-0 text-red-600 shadow-none"
            iconOnly
            onClick={onRemove}
            size="icon"
            type="button"
            variant="paper"
          >
            <Trash2 size={16} />
          </InkButton>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="名称"
          value={item.title}
          onChange={(title) => onChange({ title })}
        />
        <Field
          label="职位 / 专业"
          value={item.subtitle}
          onChange={(subtitle) => onChange({ subtitle })}
        />
        <DateInput
          label="开始时间"
          value={item.startDate}
          onChange={(startDate) => onChange({ startDate })}
        />
        <DateInput
          label="结束时间"
          value={item.endDate}
          onChange={(endDate) => onChange({ endDate })}
        />
      </div>
      <div className="mt-4">
        <span className="mb-2 block text-sm font-bold">描述</span>
        <RichTextEditor
          label={`条目 ${index + 1} 描述`}
          value={item.description}
          onChange={(description) => onChange({ description })}
        />
      </div>
      {onStyleChange && (
        <div className="mt-3">
          <label className="grid gap-1">
            <span className="text-sm font-bold">
              背景颜色（时间轴色块模板使用）
            </span>
            <div className="flex items-center gap-2">
              <input
                className="h-10 w-20 rounded-xl border-2 border-black/15 px-2 outline-none"
                type="color"
                value={item.entryStyle?.bgColor ?? "#4a90e2"}
                onChange={(e) => onStyleChange({ bgColor: e.target.value })}
              />
              {item.entryStyle?.bgColor && (
                <button
                  aria-label="清除背景颜色"
                  className="h-10 rounded-xl border-2 border-black/15 px-3 text-sm font-bold text-red-500 transition hover:border-black"
                  onClick={() => onStyleChange(undefined)}
                >
                  清除
                </button>
              )}
            </div>
          </label>
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
