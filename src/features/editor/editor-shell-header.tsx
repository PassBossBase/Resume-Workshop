import {
  ArrowLeft,
  Download,
  FileImage,
  FileUp,
  LayoutTemplate,
  Printer,
} from "lucide-react";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { InkButton } from "@/components/anime-ui/ui";
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

  return (
    <header className="editor-glass-panel no-print flex h-19.5 items-center justify-between gap-4 border-b px-4 text-white md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <InkButton
          aria-label={t.editor.back}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          onClick={onBack}
          variant="glass"
        >
          <ArrowLeft size={20} />
        </InkButton>
        <input
          aria-label={t.editor.resumeName}
          className="min-w-0 max-w-65 rounded-xl border border-white/28 bg-white/12 px-3 py-2 font-bold text-white outline-none placeholder:text-white/55 focus:border-white/65"
          onChange={(event) => onRename(event.target.value)}
          value={title}
        />
        <SaveStatus state={saveState} />
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle
          compact
          variant="glass"
          className="h-11 w-14 rounded-xl"
        />
        <InkButton
          className="group min-h-11 gap-2.5 px-2.5 md:px-3"
          onClick={onImport}
          title={t.editor.reimportFull}
          variant="glass"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg  transition-transform duration-150 group-hover:-rotate-6">
            <FileUp aria-hidden="true" size={17} strokeWidth={2.8} />
          </span>
          <span className="hidden xl:inline">{t.editor.reimportFull}</span>
          <span className="xl:hidden">{t.editor.reimportShort}</span>
        </InkButton>
        <InkButton
          className="group min-h-11 gap-2.5 px-2.5 md:px-3"
          onClick={onSwitchTemplate}
          title={t.editor.switchTemplateFull}
          variant="glass"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-150 group-hover:rotate-6">
            <LayoutTemplate aria-hidden="true" size={17} strokeWidth={2.8} />
          </span>
          <span className="hidden xl:inline">
            {t.editor.switchTemplateFull}
          </span>
          <span className="xl:hidden">{t.editor.switchTemplateShort}</span>
        </InkButton>
        <Popover.Root open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
          <Popover.Trigger asChild>
            <InkButton
              aria-expanded={exportMenuOpen}
              aria-haspopup="menu"
              aria-label={t.editor.exportMenuAria}
              className="group min-h-11 gap-2.5 px-2.5 pr-2 md:px-3"
              variant="glass"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-150 group-hover:-rotate-6">
                <Download aria-hidden="true" size={17} strokeWidth={2.8} />
              </span>
              <span className="hidden tracking-tight sm:inline">
                {t.editor.exportPdfFull}
              </span>
              <span className="sm:hidden">{t.editor.exportPdfShort}</span>
            </InkButton>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              aria-label={t.editor.exportMenuAria}
              className="editor-export-menu z-100 w-80"
              collisionPadding={12}
              role="menu"
              sideOffset={10}
            >
              <div className="mb-2 border-b border-white/18 px-2 pb-2">
                <span className="text-sm font-black">{t.editor.exportMenuAria}</span>
              </div>
              <div className="grid gap-2">
                <button
                  className="editor-export-option group/export-option flex w-full items-center gap-3 p-3 text-left"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onDownload();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span className="editor-export-option-icon editor-export-option-icon-visual grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                    <FileImage aria-hidden="true" size={20} strokeWidth={2.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">
                      {t.editor.visualPdfTitle}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium leading-4 text-white/70">
                      {t.editor.visualPdfDescription}
                    </span>
                  </span>
                  <span className="text-lg font-black transition-transform group-hover/export-option:translate-x-0.5">
                    →
                  </span>
                </button>
                <button
                  className="editor-export-option group/export-option flex w-full items-center gap-3 p-3 text-left"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onPrint();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span className="editor-export-option-icon editor-export-option-icon-print grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                    <Printer aria-hidden="true" size={20} strokeWidth={2.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">
                      {t.editor.printPdfTitle}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium leading-4 text-white/70">
                      {t.editor.printPdfDescription}
                    </span>
                  </span>
                  <span className="text-lg font-black transition-transform group-hover/export-option:translate-x-0.5">
                    →
                  </span>
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </header>
  );
}
