import { ArrowLeft, Download, FileUp, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { BrandMark, InkButton } from "@/components/anime-ui/ui";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/lib/i18n";
import { SaveStatus, type SaveStatusState } from "./save-status";

export function EditorShellHeader({
  onBack,
  onDownload,
  onImport,
  onRename,
  onSwitchTemplate,
  saveState,
  title,
}: {
  onBack: () => void;
  onDownload: () => void;
  onImport: () => void;
  onRename: (title: string) => void;
  onSwitchTemplate: () => void;
  saveState: SaveStatusState;
  title: string;
}) {
  const t = useT();

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
          className="shadow-[3px_3px_0_var(--line)] w-15"
        />
        <InkButton
          className="min-h-11 px-3 shadow-[3px_3px_0_var(--line)] md:px-4"
          onClick={onImport}
          pressable
          variant="blue"
        >
          <FileUp size={18} />
          <span className="hidden xl:inline">{t.editor.reimportFull}</span>
          <span className="xl:hidden">{t.editor.reimportShort}</span>
        </InkButton>
        <InkButton
          className="min-h-11 px-3 shadow-[3px_3px_0_var(--line)] md:px-4"
          onClick={onSwitchTemplate}
          pressable
          variant="pink"
        >
          <LayoutTemplate size={18} />
          <span className="hidden xl:inline">
            {t.editor.switchTemplateFull}
          </span>
          <span className="xl:hidden">{t.editor.switchTemplateShort}</span>
        </InkButton>
        <InkButton
          className="min-h-11 px-3 shadow-[3px_3px_0_var(--line)] md:px-5"
          onClick={onDownload}
          pressable
          variant="yellow"
        >
          <Download size={18} />
          <span className="hidden sm:inline">{t.editor.exportPdfFull}</span>
          <span className="sm:hidden">{t.editor.exportPdfShort}</span>
        </InkButton>
      </div>
    </header>
  );
}
