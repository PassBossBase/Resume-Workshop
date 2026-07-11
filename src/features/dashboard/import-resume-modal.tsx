"use client";

import { AlertCircle, FileText, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { InkButton, Modal } from "@/components/anime-ui/ui";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "@/features/templates/template-registry";
import { TemplateSkeletonPreview } from "@/features/templates/template-skeleton-preview";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useLocale } from "@/lib/i18n";
import {
  IMPORT_PDF_MAX_BYTES,
  buildResumeFromImport,
  extractImportedResumeFromJson,
  extractImportedResumeFromPdf,
  type ImportedResumeDraft,
} from "@/features/dashboard/resume-import";
import type {
  ResumeDocument,
  TemplateId,
} from "@/features/resume-model/resume-model";

import "@/features/templates/blank-template";
import "@/features/templates/classic-template";
import "@/features/templates/header-full-width-template";
import "@/features/templates/sidebar-left-template";
import "@/features/templates/timeline-block-template";
import "@/features/templates/line-separate-template";
import "@/features/templates/section-banner-template";

type ImportStatus = "idle" | "parsing" | "ready" | "saving" | "error";

export function ImportResumeModal({
  open,
  onClose,
  initialTemplateId = "blank",
  onImportedResume,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  initialTemplateId?: TemplateId;
  onImportedResume?: (resume: ResumeDocument) => Promise<void> | void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId>(initialTemplateId);
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<ImportedResumeDraft | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const syncResumeToDirectory = useDirectorySyncStore((s) => s.syncResume);

  const yieldToBrowser = () =>
    new Promise<void>((resolve) => window.setTimeout(resolve, 0));

  const templateEntries = useMemo(() => listTemplates(), []);

  const selectedTemplateEntry = useMemo(
    () =>
      templateEntries.find((entry) => entry.id === selectedTemplateId) ??
      templateEntries[0] ??
      null,
    [selectedTemplateId, templateEntries],
  );

  const reset = () => {
    setFileName("");
    setDraft(null);
    setStatus("idle");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const close = () => {
    if (status === "parsing" || status === "saving") return;
    reset();
    onClose();
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setDraft(null);
    setError("");

    const isJson =
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json");

    if (!isJson && file.size > IMPORT_PDF_MAX_BYTES) {
      setStatus("error");
      setError(t.importResume.tooLarge);
      return;
    }

    setStatus("parsing");
    try {
      await yieldToBrowser();
      const parsed = isJson
        ? await extractImportedResumeFromJson(file)
        : await extractImportedResumeFromPdf(file);
      setDraft(parsed);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t.importResume.parseFailed);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleImport = async () => {
    if (!draft) return;
    const factory = builtinTemplateFactories[selectedTemplateId];
    if (!factory) return;

    setStatus("saving");
    try {
      const resume = buildResumeFromImport(factory(locale), draft, fileName);
      if (onImportedResume) {
        await onImportedResume(resume);
        reset();
        onClose();
      } else {
        await saveResume(resume);
        await syncResumeToDirectory(resume);
        router.push(`/resume/${resume.id}`);
      }
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : t.importResume.importFailed,
      );
    }
  };

  const parsedSummary = draft
    ? [
        [
          t.importResume.source,
          draft.source === "embedded"
            ? "简历工坊 PDF"
            : draft.source === "json"
              ? "JSON 文件"
              : "普通 PDF 文本",
        ],
        [t.importResume.name, draft.basics.name || t.importResume.notFound],
        [t.importResume.role, draft.basics.role || t.importResume.notFound],
        [
          t.importResume.contact,
          draft.basics.phone || draft.basics.email || t.importResume.notFound,
        ],
        [
          t.importResume.content,
          t.importResume.contentSummary(
            draft.skills.length,
            draft.work.length,
            draft.projects.length,
            draft.education.length,
          ),
        ],
      ]
    : [];
  const glyphWarning =
    draft?.warnings.find((warning) =>
      warning.includes("PDF 文本层存在无法识别的字形"),
    ) ?? "";
  const secondaryWarnings =
    draft?.warnings.filter((warning) => warning !== glyphWarning) ?? [];

  return (
    <Modal
      ariaLabelledby="import-resume-title"
      className="flex max-h-[94vh] flex-col"
      disabled={status === "parsing" || status === "saving"}
      onClose={close}
      open={open}
      size="lg"
    >
      <div className="comic-dots border-b-2 border-black bg-[#e9fff5] px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--blue) text-white shadow-[3px_3px_0_black]">
            <Upload size={28} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 pt-1">
            <span className="text-xs font-black tracking-[0.18em] text-(--blue)">
              PDF IMPORT
            </span>

            <h2 className="mt-1 text-2xl font-black" id="import-resume-title">
              {t.importResume.title}
            </h2>
          </div>
          <div></div>
        </div>
        <InkButton
          aria-label={t.importResume.close}
          className="absolute right-4 top-4 shadow-[3px_3px_0_var(--line)] hover:bg-(--yellow)"
          disabled={status === "parsing" || status === "saving"}
          iconOnly
          onClick={close}
          size="icon"
          pressable
          type="button"
          variant="paper"
        >
          <X size={20} />
        </InkButton>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-(--canvas) p-4 sm:p-6 lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.42fr)]">
          <section className="rounded-3xl border-2 border-black bg-(--paper) p-5 shadow-[4px_4px_0_#d9d1c3]">
            <h3 className="text-lg font-black">{t.importResume.uploadTitle}</h3>
            <label
              className={[
                "mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black p-5 text-center transition",
                isDragOver
                  ? "border-solid bg-[#fff7cc]"
                  : "bg-white hover:bg-[#fff7cc]",
              ].join(" ")}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileText className="mb-3" size={36} />
              <span className="font-black">
                {fileName
                  ? fileName
                  : isDragOver
                    ? t.importResume.release
                    : t.importResume.choose}
              </span>
              <span className="mt-2 text-sm font-medium text-black/50">
                {t.importResume.supports}
              </span>
              <input
                accept="application/pdf,.pdf,application/json,.json"
                className="sr-only"
                disabled={status === "parsing" || status === "saving"}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
            </label>

            <div className="mt-5 rounded-2xl border-2 border-black bg-white p-4">
              <h4 className="font-black">{t.importResume.resultTitle}</h4>
              {status === "idle" ? (
                <p className="mt-2 text-sm leading-6 text-black/55">
                  {t.importResume.idle}
                </p>
              ) : status === "parsing" ? (
                <p className="mt-2 text-sm font-bold text-(--blue)">
                  {t.importResume.parsing}
                </p>
              ) : status === "error" ? (
                <div className="mt-2 flex gap-2 text-sm leading-6 text-red-600">
                  <AlertCircle className="mt-0.5 shrink-0" size={17} />
                  <span className="whitespace-pre-wrap">{error}</span>
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  {glyphWarning ? (
                    <div className="mb-3 flex gap-2 rounded-xl border-2 border-black bg-[#fff0e6] p-3 text-sm leading-6 text-black/70">
                      <AlertCircle
                        className="mt-0.5 shrink-0 text-red-600"
                        size={17}
                      />
                      <span>{glyphWarning}</span>
                    </div>
                  ) : null}
                  {parsedSummary.map(([label, value]) => (
                    <div
                      className="flex justify-between gap-3 border-b border-black/10 pb-2 last:border-0 last:pb-0"
                      key={label}
                    >
                      <span className="font-bold text-black/45">{label}</span>
                      <span className="text-right font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {secondaryWarnings.length ? (
              <div className="mt-4 rounded-2xl border-2 border-black bg-[#fff0e6] p-4 text-sm leading-6 text-black/65">
                {secondaryWarnings.map((warning) => (
                  <p key={warning}>- {warning}</p>
                ))}
              </div>
            ) : null}
          </section>

          <section className="self-start overflow-hidden rounded-3xl border-2 border-black bg-[#dff4ff] shadow-[4px_4px_0_#1f2937] lg:sticky lg:top-0">
            <div className="border-b-2 border-black bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-black">
                      {t.importResume.templateTitle}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {templateEntries.map((entry) => {
                  const selected = entry.id === selectedTemplateId;
                  return (
                    <InkButton
                      className={[
                        "group flex items-center justify-between gap-3 rounded-2xl border-2 border-black px-3 py-2.5 text-left transition active:translate-y-0.5",
                        selected
                          ? "bg-(--yellow) shadow-[3px_3px_0_black]"
                          : "bg-white hover:-translate-y-0.5 hover:bg-[#fff7cc] hover:shadow-[2px_2px_0_black]",
                      ].join(" ")}
                      key={entry.id}
                      onClick={() => setSelectedTemplateId(entry.id)}
                      type="button"
                      unstyled
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">
                          {t.templates.names[entry.id]}
                        </span>
                      </span>
                    </InkButton>
                  );
                })}
              </div>
            </div>
            <div className="bg-[#cfe7f4] p-4 sm:p-5">
              <div className="grid min-h-[420px] place-items-center rounded-2xl border-2 border-black bg-[#eef6fb] p-3 sm:p-5">
                {selectedTemplateEntry ? (
                  <TemplateSkeletonPreview
                    ariaLabel={t.templates.previewAria(
                      t.templates.names[selectedTemplateEntry.id],
                    )}
                    className="h-[380px] w-[269px] max-h-full shadow-[4px_4px_0_black]"
                    templateId={selectedTemplateEntry.id}
                  />
                ) : (
                  <div className="grid min-h-80 place-items-center rounded-xl border-2 border-dashed border-black/25 bg-white text-sm font-bold text-black/40">
                    {t.importResume.noPreview}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-(--paper) px-5 py-4">
        <p className="text-sm font-medium text-black/45">
          {t.importResume.footer}
        </p>
        <div className="flex gap-3">
          <InkButton
            className="shadow-[3px_3px_0_var(--line)]"
            disabled={status === "parsing" || status === "saving"}
            onClick={close}
            pressable
            variant="paper"
          >
            {t.importResume.cancel}
          </InkButton>
          <InkButton
            className="shadow-[3px_3px_0_var(--line)]"
            disabled={!draft || status === "parsing" || status === "saving"}
            onClick={handleImport}
            variant="pink"
            pressable
          >
            <Upload size={17} />
            {status === "saving"
              ? t.importResume.saving
              : (submitLabel ?? t.importResume.submit)}
          </InkButton>
        </div>
      </footer>
    </Modal>
  );
}
