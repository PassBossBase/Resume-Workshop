import { LayoutTemplate, X } from "lucide-react";
import { useMemo, useState } from "react";
import { InkButton, Modal } from "@/components/anime-ui/ui";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import type {
  ResumeDocument,
  TemplateId,
} from "@/features/resume-model/resume-model";
import { listTemplates } from "@/features/templates/template-registry";
import { TemplateSkeletonPreview } from "@/features/templates/template-skeleton-preview";
import { useLocale } from "@/lib/i18n";

/** 在不改变简历内容的前提下预览并切换内置模板的弹窗。 */
export function TemplateSwitchModal({
  currentTemplateId,
  open,
  onApply,
  onClose,
}: {
  currentTemplateId: TemplateId;
  open: boolean;
  onApply: (templateResume: ResumeDocument) => void;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const templateEntries = useMemo(() => listTemplates(), []);
  const availableTemplateEntries = useMemo(
    () => templateEntries.filter((entry) => entry.id !== currentTemplateId),
    [currentTemplateId, templateEntries],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    availableTemplateEntries[0]?.id ?? currentTemplateId,
  );

  const selectedEntry =
    availableTemplateEntries.find((entry) => entry.id === selectedTemplateId) ??
    availableTemplateEntries[0];

  const apply = () => {
    const factory = builtinTemplateFactories[selectedTemplateId];
    if (!factory) return;
    onApply(factory(locale));
  };

  return (
    <Modal
      ariaLabelledby="switch-template-title"
      className="flex flex-col"
      onClose={onClose}
      open={open}
      size="md"
    >
      <div className="comic-dots border-b-2 border-black bg-[#fff7cc] px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--yellow) shadow-[3px_3px_0_black]">
            <LayoutTemplate size={28} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 pt-1">
            <span className="text-xs font-black tracking-[0.18em] text-(--blue)">
              {t.templateSwitch.badge}
            </span>
            <h2 className="mt-1 text-2xl font-black" id="switch-template-title">
              {t.templateSwitch.title}
            </h2>
          </div>
        </div>
        <InkButton
          aria-label={t.templateSwitch.close}
          className="absolute right-4 top-4 shadow-[3px_3px_0_var(--line)] hover:bg-(--yellow)"
          iconOnly
          onClick={onClose}
          size="icon"
          type="button"
          variant="paper"
        >
          <X size={20} />
        </InkButton>
      </div>

      <div className="bg-(--canvas) p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <section className="rounded-3xl border-2 border-black bg-(--paper) p-4 shadow-[4px_4px_0_#d9d1c3]">
            <h3 className="mb-3 text-lg font-black">
              {t.templateSwitch.choose}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {availableTemplateEntries.map((entry) => {
                const active = entry.id === selectedTemplateId;
                return (
                  <InkButton
                    className={`rounded-2xl border-2 px-3 py-2.5 text-left transition ${
                      active
                        ? "border-black bg-(--yellow) shadow-[3px_3px_0_black]"
                        : "border-black/20 bg-white hover:border-black"
                    }`}
                    key={entry.id}
                    onClick={() => setSelectedTemplateId(entry.id)}
                    type="button"
                    unstyled
                  >
                    <span className="block font-black">
                      {t.templates.names[entry.id]}
                    </span>
                  </InkButton>
                );
              })}
              {availableTemplateEntries.length === 0 && (
                <p className="rounded-2xl border-2 border-dashed border-black/20 bg-white px-3 py-4 text-sm font-bold text-black/45">
                  {t.templateSwitch.noOther}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border-2 border-black bg-(--paper) p-4 shadow-[4px_4px_0_#d9d1c3]">
            <h3 className="mb-3 text-lg font-black">
              {t.templateSwitch.preview}
            </h3>
            <div className="grid h-[356px] place-items-center overflow-hidden rounded-2xl border-2 border-black bg-[#e7ebf1] p-3">
              {selectedEntry ? (
                <TemplateSkeletonPreview
                  ariaLabel={t.templates.previewAria(
                    t.templates.names[selectedEntry.id],
                  )}
                  className="h-[324px] w-[229px] shadow-[4px_4px_0_black]"
                  templateId={selectedEntry.id}
                />
              ) : (
                <div className="grid min-h-72 place-items-center text-sm font-bold text-black/45">
                  {t.templateSwitch.noPreview}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-(--paper) px-5 py-4">
        <p className="text-sm font-medium text-black/45">
          {t.templateSwitch.note}
        </p>
        <div className="flex gap-3">
          <InkButton
            className="shadow-[3px_3px_0_var(--line)]"
            onClick={onClose}
            variant="paper"
          >
            {t.templateSwitch.cancel}
          </InkButton>
          <InkButton
            className="shadow-[3px_3px_0_var(--line)]"
            onClick={apply}
            variant="pink"
          >
            <LayoutTemplate size={17} />
            {t.templateSwitch.apply}
          </InkButton>
        </div>
      </footer>
    </Modal>
  );
}
