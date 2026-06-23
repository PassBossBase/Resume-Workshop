"use client";

import { AlertCircle, FileText, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { InkButton, Modal } from "@/components/anime-ui/ui";
import { useOverlay } from "@/hooks/use-overlay";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { buildResumePages } from "@/features/templates/resume-pages";
import { ClassicTemplatePage } from "@/features/templates/classic-template";
import {
  getTemplate,
  listTemplates,
} from "@/features/templates/template-registry";
import {
  IMPORT_PDF_MAX_BYTES,
  buildResumeFromImport,
  extractImportedResumeFromPdf,
  type ImportedResumeDraft,
} from "@/features/dashboard/resume-import";

import "@/features/templates/blank-template";
import "@/features/templates/header-full-width-template";
import "@/features/templates/sidebar-left-template";
import "@/features/templates/timeline-block-template";
import "@/features/templates/line-separate-template";

type ImportStatus = "idle" | "parsing" | "ready" | "saving" | "error";

export function ImportResumeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("blank");
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<ImportedResumeDraft | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState("");

  useOverlay(open, {
    disabled: status === "parsing" || status === "saving",
    focusRef: closeButtonRef,
    onClose,
  });

  const templatePreviews = useMemo(
    () =>
      listTemplates().map((entry) => {
        const resume = builtinTemplateFactories[entry.id]?.();
        return {
          entry,
          page: resume ? buildResumePages(resume)[0] : null,
          resume: resume ?? null,
        };
      }),
    [],
  );

  const selectedTemplatePreview = useMemo(
    () =>
      templatePreviews.find(({ entry }) => entry.id === selectedTemplateId) ??
      templatePreviews[0] ??
      null,
    [selectedTemplateId, templatePreviews],
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDraft(null);
    setError("");

    if (file.size > IMPORT_PDF_MAX_BYTES) {
      setStatus("error");
      setError("PDF 文件过大，请选择 10MB 以内的文件。");
      return;
    }

    setStatus("parsing");
    try {
      const parsed = await extractImportedResumeFromPdf(file);
      setDraft(parsed);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "PDF 解析失败，请换一个文件试试。",
      );
    }
  };

  const handleImport = async () => {
    if (!draft) return;
    const factory = builtinTemplateFactories[selectedTemplateId];
    if (!factory) return;

    setStatus("saving");
    try {
      const resume = buildResumeFromImport(factory(), draft, fileName);
      await saveResume(resume);
      router.push(`/resume/${resume.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "导入失败，请稍后重试。");
    }
  };

  const parsedSummary = draft
    ? [
        [
          "来源",
          draft.source === "embedded" ? "简历工坊 PDF" : "普通 PDF 文本",
        ],
        ["姓名", draft.basics.name || "未识别"],
        ["岗位", draft.basics.role || "未识别"],
        ["联系方式", draft.basics.phone || draft.basics.email || "未识别"],
        [
          "内容",
          `${draft.skills.length} 技能 / ${draft.work.length} 工作 / ${draft.projects.length} 项目 / ${draft.education.length} 教育`,
        ],
      ]
    : [];

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
              导入简历
            </h2>
          </div>
        </div>
        <button
          aria-label="关闭导入简历弹窗"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white transition hover:bg-(--yellow)"
          disabled={status === "parsing" || status === "saving"}
          onClick={close}
          ref={closeButtonRef}
          type="button"
        >
          <X size={20} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-(--canvas) p-4 sm:p-6 lg:p-7">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-2xl border-2 border-black bg-(--yellow) px-4 py-3 text-left font-black shadow-[3px_3px_0_black]"
            type="button"
          >
            导入内容到模板
            <span className="mt-1 block text-sm font-medium text-black/55">
              读取 PDF 文本，自动填入字段
            </span>
          </button>
          <button
            className="rounded-2xl border-2 border-black bg-white px-4 py-3 text-left font-black opacity-55"
            disabled
            type="button"
          >
            导入原有简历样式
            <span className="mt-1 block text-sm font-medium text-black/55">
              暂未开放
            </span>
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <section className="rounded-3xl border-2 border-black bg-(--paper) p-5 shadow-[4px_4px_0_#d9d1c3]">
            <h3 className="text-lg font-black">1. 上传 PDF</h3>
            <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black bg-white p-5 text-center transition hover:bg-[#fff7cc]">
              <FileText className="mb-3" size={36} />
              <span className="font-black">
                {fileName || "选择一份 PDF 简历"}
              </span>
              <span className="mt-2 text-sm font-medium text-black/50">
                支持文字型 PDF，扫描件暂不支持
              </span>
              <input
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={status === "parsing" || status === "saving"}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
            </label>

            <div className="mt-5 rounded-2xl border-2 border-black bg-white p-4">
              <h4 className="font-black">识别结果</h4>
              {status === "idle" ? (
                <p className="mt-2 text-sm leading-6 text-black/55">
                  上传后会在本地浏览器中解析，不会上传到服务器。
                </p>
              ) : status === "parsing" ? (
                <p className="mt-2 text-sm font-bold text-(--blue)">
                  正在读取 PDF 文本...
                </p>
              ) : status === "error" ? (
                <div className="mt-2 flex gap-2 text-sm leading-6 text-red-600">
                  <AlertCircle className="mt-0.5 shrink-0" size={17} />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
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

            {draft?.warnings.length ? (
              <div className="mt-4 rounded-2xl border-2 border-black bg-[#fff0e6] p-4 text-sm leading-6 text-black/65">
                {draft.warnings.map((warning) => (
                  <p key={warning}>- {warning}</p>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border-2 border-black bg-(--paper) p-5 shadow-[4px_4px_0_#d9d1c3]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">2. 选择目标模板</h3>
              <select
                aria-label="选择目标模板"
                className="max-w-[180px]  border-2 border-black bg-white px-3 py-1.5 text-sm font-black outline-none transition focus:bg-(--yellow)"
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                value={selectedTemplateId}
              >
                {templatePreviews.map(({ entry }) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 min-h-[300px] overflow-hidden rounded-2xl border-2 border-black bg-[#e7ebf1]">
              <div className="scrollbar-thin max-h-[300px] overflow-auto p-3 sm:p-4">
                {selectedTemplatePreview?.resume &&
                selectedTemplatePreview.page ? (
                  <div
                    className="mx-auto shadow-[0_20px_60px_rgb(30_40_60/25%)]"
                    style={{ height: 606, width: 429 }}
                  >
                    <div
                      style={{
                        height: 1123,
                        transform: "scale(0.54)",
                        transformOrigin: "left top",
                        width: 794,
                      }}
                    >
                      {(() => {
                        const entry = getTemplate(
                          selectedTemplatePreview.resume.templateId,
                        );
                        const Renderer =
                          entry?.component ?? ClassicTemplatePage;
                        return (
                          <Renderer
                            page={selectedTemplatePreview.page}
                            resume={selectedTemplatePreview.resume}
                          />
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="grid min-h-80 place-items-center rounded-xl border-2 border-dashed border-black/25 bg-white text-sm font-bold text-black/40">
                    暂无预览
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-(--paper) px-5 py-4">
        <p className="text-sm font-medium text-black/45">
          第一版会尽量识别字段，导入后仍建议人工检查。
        </p>
        <div className="flex gap-3">
          <InkButton
            disabled={status === "parsing" || status === "saving"}
            onClick={close}
            variant="paper"
          >
            取消
          </InkButton>
          <InkButton
            disabled={!draft || status === "parsing" || status === "saving"}
            onClick={handleImport}
            variant="pink"
          >
            <Upload size={17} />
            {status === "saving" ? "正在生成..." : "导入到模板"}
          </InkButton>
        </div>
      </footer>
    </Modal>
  );
}
