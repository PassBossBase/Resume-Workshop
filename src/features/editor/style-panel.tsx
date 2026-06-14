"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { moduleMeta } from "./module-meta";
import { useResumeStore } from "./resume-store";

const colors = [
  "#171717",
  "#3f57e8",
  "#ff4f91",
  "#ff7a1a",
  "#8b5cf6",
  "#27c59a",
  "#b41f3f",
];

export function StylePanel() {
  const resume = useResumeStore((state) => state.resume);
  const activeModule = useResumeStore((state) => state.activeModule);
  const setActiveModule = useResumeStore((state) => state.setActiveModule);
  const toggleModule = useResumeStore((state) => state.toggleModule);
  const moveModule = useResumeStore((state) => state.moveModule);
  const updateStyle = useResumeStore((state) => state.updateStyle);
  if (!resume) return null;

  return (
    <div className="space-y-5 p-5">
      <Panel title="布局" icon={<GripVertical size={18} />}>
        <div className="space-y-3">
          {resume.modules.map((module) => {
            const meta = moduleMeta[module.type];
            const Icon = meta.icon;
            const active = module.type === activeModule;
            return (
              <div
                key={module.id}
                className={`flex items-center gap-2 rounded-2xl border-2 p-2 ${
                  active
                    ? "border-black bg-[var(--yellow)] shadow-[3px_3px_0_black]"
                    : "border-black/15 bg-white"
                }`}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left font-bold"
                  onClick={() => setActiveModule(module.type)}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-black"
                    style={{ background: meta.color }}
                  >
                    <Icon size={16} color="white" />
                  </span>
                  <span className="truncate">{module.title}</span>
                </button>
                {module.type !== "basics" && (
                  <>
                    <button aria-label={`上移${module.title}`} onClick={() => moveModule(module.type, -1)}>
                      <ArrowUp size={15} />
                    </button>
                    <button aria-label={`下移${module.title}`} onClick={() => moveModule(module.type, 1)}>
                      <ArrowDown size={15} />
                    </button>
                    <button aria-label={`切换${module.title}`} onClick={() => toggleModule(module.type)}>
                      {module.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                  </>
                )}
              </div>
            );
          })}
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
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-bold">字体风格</span>
          <select
            className="h-11 w-full rounded-xl border-2 border-black bg-white px-3"
            value={resume.styles.fontFamily}
            onChange={(event) =>
              updateStyle(
                "fontFamily",
                event.target.value as "sans" | "serif" | "rounded",
              )
            }
          >
            <option value="sans">清晰黑体</option>
            <option value="serif">优雅宋体</option>
            <option value="rounded">圆润字体</option>
          </select>
        </label>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border-2 border-black bg-[var(--paper)] p-4 shadow-[4px_4px_0_#d9d1c3]">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Control({
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
}
