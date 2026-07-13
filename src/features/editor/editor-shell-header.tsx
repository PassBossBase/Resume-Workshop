import {
  ArrowLeft,
  Download,
  FileImage,
  FileUp,
  LayoutTemplate,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BrandMark, InkButton } from "@/components/anime-ui/ui";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/lib/i18n";
import { SaveStatus, type SaveStatusState } from "./save-status";

/** 编辑工作台顶部栏：返回、标题、语言、导入、模板和 PDF 操作入口。 */
export function EditorShellHeader({
  onBack,
  onDownload,
  onImport,
  onPrint,
  onRename,
  onSwitchTemplate,
  saveState,
  title,
}: {
  onBack: () => void;
  onDownload: () => void;
  onImport: () => void;
  onPrint: () => void;
  onRename: (title: string) => void;
  onSwitchTemplate: () => void;
  saveState: SaveStatusState;
  title: string;
}) {
  const t = useT();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const closeExportMenu = () => setExportMenuOpen(false);

  return (
    <header className="no-print flex h-19.5 items-center justify-between gap-4 border-b-2 border-black bg-(--paper) px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <InkButton
          aria-label={t.editor.back}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0_var(--line)]"
          onClick={onBack}
          pressable
        >
          <ArrowLeft color="black" size={20} />
        </InkButton>
        <Link className="hidden md:block xl:hidden" href="/">
          <BrandMark
            compact
            prefix={t.app.brandPrefix}
            suffix={t.app.brandSuffix}
          />
        </Link>
        <Link className="hidden xl:block" href="/">
          <BrandMark prefix={t.app.brandPrefix} suffix={t.app.brandSuffix} />
        </Link>
        <Link className="md:hidden" href="/">
          <BrandMark
            compact
            prefix={t.app.brandPrefix}
            suffix={t.app.brandSuffix}
          />
        </Link>
        <span className="hidden text-black/25 md:block">/</span>
        <input
          aria-label={t.editor.resumeName}
          className="min-w-0 max-w-65 rounded-xl border-2 border-transparent bg-[#eee9de] px-3 py-2 font-bold outline-none focus:border-black"
          onChange={(event) => onRename(event.target.value)}
          value={title}
        />
        <SaveStatus state={saveState} />
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle
          compact
          pressable
          variant="purple"
          className="h-11 w-14 rounded-xl border-2 border-black bg-[#7650d8] text-white shadow-[3px_3px_0_var(--line)] hover:bg-[#8d68eb]"
        />
        <InkButton
          className="group min-h-11 gap-2.5 bg-[#3f57e8] px-2.5 shadow-[3px_3px_0_var(--line)] hover:bg-[#536beb] md:px-3"
          onClick={onImport}
          pressable
          title={t.editor.reimportFull}
          variant="blue"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg  transition-transform duration-150 group-hover:-rotate-6">
            <FileUp aria-hidden="true" size={17} strokeWidth={2.8} />
          </span>
          <span className="hidden xl:inline">{t.editor.reimportFull}</span>
          <span className="xl:hidden">{t.editor.reimportShort}</span>
        </InkButton>
        <InkButton
          className="group min-h-11 gap-2.5 bg-[#ff4f91] px-2.5 shadow-[3px_3px_0_var(--line)] hover:bg-[#ff68a3] md:px-3"
          onClick={onSwitchTemplate}
          pressable
          title={t.editor.switchTemplateFull}
          variant="pink"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-150 group-hover:rotate-6">
            <LayoutTemplate aria-hidden="true" size={17} strokeWidth={2.8} />
          </span>
          <span className="hidden xl:inline">
            {t.editor.switchTemplateFull}
          </span>
          <span className="xl:hidden">{t.editor.switchTemplateShort}</span>
        </InkButton>
        <div
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              closeExportMenu();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeExportMenu();
            }
          }}
          onMouseEnter={() => setExportMenuOpen(true)}
          onMouseLeave={closeExportMenu}
        >
          <InkButton
            aria-expanded={exportMenuOpen}
            aria-haspopup="menu"
            aria-label={t.editor.exportMenuAria}
            className="group min-h-11 gap-2.5 bg-[#ffd84d] px-2.5 pr-2 shadow-[3px_3px_0_var(--line)]  hover:bg-[#ffe36f] md:px-3"
            onClick={() => setExportMenuOpen((open) => !open)}
            pressable
            variant="yellow"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg  transition-transform duration-150 group-hover:-rotate-6">
              <Download aria-hidden="true" size={17} strokeWidth={2.8} />
            </span>
            <span className="hidden tracking-tight sm:inline">
              {t.editor.exportPdfFull}
            </span>
            <span className="sm:hidden">{t.editor.exportPdfShort}</span>
          </InkButton>
          {exportMenuOpen && (
            <div
              aria-label={t.editor.exportMenuAria}
              className="absolute right-0 top-full z-100 w-80 pt-2"
              role="menu"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-black bg-(--paper) p-2">
                <div className="mb-2 flex items-center justify-between border-b-2 border-dashed border-black/20 px-2 pb-2">
                  <span className="text-[11px] font-black tracking-[0.16em] text-black/55">
                    PDF OUTPUT
                  </span>
                  <span className="rounded-full border border-black bg-white px-2 py-0.5 text-[10px] font-black">
                    2 OPTIONS
                  </span>
                </div>
                <div className="grid gap-2">
                  <button
                    className="group/export-option flex w-full items-center gap-3 rounded-xl border-2 border-black bg-[#fff0a8] p-2.5 text-left transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#ffe36f] hover:shadow-[4px_4px_0_black] focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:bg-[#ffe36f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--blue)"
                    onClick={() => {
                      closeExportMenu();
                      onDownload();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-black bg-white">
                      <FileImage
                        aria-hidden="true"
                        size={20}
                        strokeWidth={2.8}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">
                        {t.editor.visualPdfTitle}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium leading-4 text-black/65">
                        {t.editor.visualPdfDescription}
                      </span>
                    </span>
                    <span className="text-lg font-black transition-transform group-hover/export-option:translate-x-0.5">
                      →
                    </span>
                  </button>
                  <button
                    className="group/export-option flex w-full items-center gap-3 rounded-xl border-2 border-black bg-[#c9f3df] p-2.5 text-left  transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#aeeccc] hover:shadow-[4px_4px_0_black] focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:bg-[#aeeccc] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--blue)"
                    onClick={() => {
                      closeExportMenu();
                      onPrint();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-black bg-white">
                      <Printer aria-hidden="true" size={20} strokeWidth={2.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">
                        {t.editor.printPdfTitle}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium leading-4 text-black/65">
                        {t.editor.printPdfDescription}
                      </span>
                    </span>
                    <span className="text-lg font-black transition-transform group-hover/export-option:translate-x-0.5">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
