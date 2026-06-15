"use client";

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  ModuleType,
  ResumeEntry,
} from "@/features/resume-model/resume-model";
import { RichTextEditor } from "@/features/rich-text/rich-text-editor";
import { SectionCard } from "@/components/anime-ui/ui";
import { DateInput } from "./date-input";
import { moduleMeta } from "./module-meta";
import { useResumeStore } from "@/stores/resume-store";

/**
 * 编辑器中间面板：基本信息表单、模块条目列表、富文本编辑与日期输入。
 */
const basicFields = [
  ["name", "姓名"],
  ["role", "职位"],
  ["status", "求职状态"],
  ["email", "邮箱"],
  ["phone", "电话"],
  ["location", "所在地"],
  ["website", "个人网站"],
] as const;

export function EditorContent() {
  const resume = useResumeStore((state) => state.resume);
  const activeModule = useResumeStore((state) => state.activeModule);
  const updateBasic = useResumeStore((state) => state.updateBasic);
  const updateEntry = useResumeStore((state) => state.updateEntry);
  const addEntry = useResumeStore((state) => state.addEntry);
  const removeEntry = useResumeStore((state) => state.removeEntry);
  const moveEntry = useResumeStore((state) => state.moveEntry);

  if (!resume) return null;
  const activeSection = resume.modules.find((item) => item.type === activeModule);
  if (!activeSection) return null;
  const meta = moduleMeta[activeModule];
  const Icon = meta.icon;

  return (
    <div className="min-h-full bg-[var(--paper)] p-5 md:p-7 xl:p-9">
      <SectionCard className="mb-8 flex items-center gap-3 px-5 py-4" variant="white">
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
          <h2 className="text-2xl font-black">{meta.label}</h2>
        </div>
      </SectionCard>

      {activeModule === "basics" && activeSection.basics ? (
        <div className="space-y-7">
          <section>
            <h3 className="mb-3 text-lg font-black">头像</h3>
            <label className="flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-dashed border-black bg-[#f7f4ec] p-4">
              <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-2 border-black bg-[var(--yellow)]">
                {activeSection.basics.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="头像预览"
                    className="h-full w-full object-cover"
                    src={activeSection.basics.avatar}
                  />
                ) : (
                  <ImagePlus />
                )}
              </span>
              <span>
                <strong className="block">上传个人头像</strong>
                <small className="text-black/50">JPG / PNG，建议使用正方形照片</small>
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
                }}
              />
            </label>
          </section>
          <section>
            <h3 className="mb-4 text-lg font-black">基础字段</h3>
            <div className="grid gap-4">
              {basicFields.map(([key, label]) => (
                <label key={key} className="grid gap-2 md:grid-cols-[110px_1fr] md:items-center">
                  <span className="font-bold">{label}</span>
                  <input
                    aria-label={label}
                    className="h-12 rounded-2xl border-2 border-black/15 bg-white px-4 font-medium outline-none transition focus:border-black focus:shadow-[3px_3px_0_var(--yellow)]"
                    value={activeSection.basics?.[key] ?? ""}
                    onChange={(event) => updateBasic(key, event.target.value)}
                  />
                </label>
              ))}
              <div className="grid gap-2 md:grid-cols-[110px_1fr] md:items-center">
                <span className="font-bold">出生日期</span>
                <DateInput
                  hideLabel
                  label="出生日期"
                  value={activeSection.basics.birthday}
                  onChange={(value) => updateBasic("birthday", value)}
                />
              </div>
            </div>
          </section>
        </div>
      ) : activeModule === "skills" ? (
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
                updateEntry("skills", firstItem.id, { description });
              } else {
                addEntry("skills");
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
              type={activeModule as Exclude<ModuleType, "basics">}
              onChange={(patch) =>
                updateEntry(
                  activeModule as Exclude<ModuleType, "basics">,
                  item.id,
                  patch,
                )
              }
              onMove={(direction) =>
                moveEntry(
                  activeModule as Exclude<ModuleType, "basics">,
                  item.id,
                  direction,
                )
              }
              onRemove={() =>
                removeEntry(
                  activeModule as Exclude<ModuleType, "basics">,
                  item.id,
                )
              }
            />
          ))}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black bg-[var(--yellow)] py-4 font-black transition hover:-translate-y-0.5"
            onClick={() =>
              addEntry(activeModule as Exclude<ModuleType, "basics">)
            }
          >
            <Plus size={19} />
            添加{meta.label}
          </button>
        </div>
      )}
    </div>
  );
}

function EntryEditor({
  item,
  index,
  onChange,
  onMove,
  onRemove,
}: {
  item: ResumeEntry;
  index: number;
  type: Exclude<ModuleType, "basics">;
  onChange: (patch: Partial<ResumeEntry>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <SectionCard variant="beige" className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <span className="rounded-full border-2 border-black bg-[var(--yellow)] px-3 py-1 text-xs font-black">
          条目 {index + 1}
        </span>
        <div className="flex gap-2">
          <button aria-label="上移" className="rounded-xl border-2 border-black p-2" onClick={() => onMove(-1)}>
            <ArrowUp size={16} />
          </button>
          <button aria-label="下移" className="rounded-xl border-2 border-black p-2" onClick={() => onMove(1)}>
            <ArrowDown size={16} />
          </button>
          <button aria-label="删除条目" className="rounded-xl border-2 border-black p-2 text-red-600" onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="名称" value={item.title} onChange={(title) => onChange({ title })} />
        <Field label="职位 / 专业" value={item.subtitle} onChange={(subtitle) => onChange({ subtitle })} />
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
