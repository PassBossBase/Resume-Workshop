import * as RadixTabs from "@radix-ui/react-tabs";
import { Eye, FileText, Palette, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ResumeModule } from "@/features/resume-model/resume-model";
import { getModuleMeta } from "./module-meta";
import { useLocale } from "@/lib/i18n";

export type MobileTab = "content" | "style" | "preview";

export function MobileEditorTabs({
  content,
  onValueChange,
  preview,
  style,
  value,
}: {
  content: ReactNode;
  onValueChange: (value: MobileTab) => void;
  preview: ReactNode;
  style: ReactNode;
  value: MobileTab;
}) {
  const { t } = useLocale();
  return (
    <RadixTabs.Root
      className="h-[calc(100vh-78px)] lg:hidden"
      onValueChange={(nextValue) => onValueChange(nextValue as MobileTab)}
      value={value}
    >
      <RadixTabs.Content
        className="h-full overflow-y-auto pb-24 focus-visible:outline-none"
        value="content"
      >
        {content}
      </RadixTabs.Content>
      <RadixTabs.Content
        className="h-full overflow-y-auto bg-[#f6f1e7] pb-24 focus-visible:outline-none"
        value="style"
      >
        {style}
      </RadixTabs.Content>
      <RadixTabs.Content
        className="h-full overflow-auto pb-24 focus-visible:outline-none"
        value="preview"
      >
        {preview}
      </RadixTabs.Content>
      <RadixTabs.List
        aria-label={t.editor.mobileViews}
        className="fixed bottom-0 left-0 right-0 z-30 grid h-19 grid-cols-3 border-t-2 border-black bg-(--paper)"
      >
        <MobileTabTrigger
          active={value === "content"}
          icon={FileText}
          label={t.editor.content}
          value="content"
        />
        <MobileTabTrigger
          active={value === "style"}
          icon={Palette}
          label={t.editor.style}
          value="style"
        />
        <MobileTabTrigger
          active={value === "preview"}
          icon={Eye}
          label={t.editor.preview}
          value="preview"
        />
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}

export function ModuleTabs({
  modules,
  activeModuleId,
  onChange,
}: {
  modules: ResumeModule[];
  activeModuleId: string;
  onChange: (moduleId: string) => void;
}) {
  const { locale, t } = useLocale();
  return (
    <RadixTabs.Root onValueChange={onChange} value={activeModuleId}>
      <RadixTabs.List
        aria-label={t.editor.modules}
        className="scrollbar-thin flex gap-2 overflow-x-auto border-b-2 border-black/10 bg-(--paper) p-3"
      >
        {modules.map((module) => {
          const meta = getModuleMeta(module, locale);
          const Icon = meta.icon;
          const active = module.id === activeModuleId;
          return (
            <RadixTabs.Trigger
              className={`flex shrink-0 items-center gap-2 rounded-full border-2 border-black px-4 py-2 font-bold ${
                active ? "bg-black text-white" : "bg-white"
              }`}
              key={module.id}
              value={module.id}
            >
              <Icon
                size={16}
                style={{ color: active ? meta.color : undefined }}
              />
              <span className="max-w-28 truncate">{meta.displayTitle}</span>
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}

function MobileTabTrigger({
  active,
  icon: Icon,
  label,
  value,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  value: MobileTab;
}) {
  return (
    <RadixTabs.Trigger
      className={`relative grid place-items-center text-sm font-bold ${
        active ? "text-black" : "text-black/45"
      }`}
      value={value}
    >
      <span className="flex flex-col items-center gap-1">
        <Icon size={23} strokeWidth={active ? 2.8 : 2} />
        {label}
      </span>
      {active && (
        <i className="absolute bottom-0 h-1.5 w-16 rounded-t-full bg-(--pink)" />
      )}
    </RadixTabs.Trigger>
  );
}
