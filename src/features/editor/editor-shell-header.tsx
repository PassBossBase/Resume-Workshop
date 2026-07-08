import { ArrowLeft, Download, FileUp, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { BrandMark, InkButton } from "@/components/anime-ui/ui";
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
  return (
    <header className="no-print flex h-19.5 items-center justify-between gap-4 border-b-2 border-black bg-(--paper) px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <InkButton
          aria-label="返回"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-black bg-white"
          onClick={onBack}
          pressable
        >
          <ArrowLeft color="black" size={20} />
        </InkButton>
        <Link className="hidden md:block xl:hidden" href="/">
          <BrandMark compact />
        </Link>
        <Link className="hidden xl:block" href="/">
          <BrandMark />
        </Link>
        <Link className="md:hidden" href="/">
          <BrandMark compact />
        </Link>
        <span className="hidden text-black/25 md:block">/</span>
        <input
          aria-label="简历名称"
          className="min-w-0 max-w-65 rounded-xl border-2 border-transparent bg-[#eee9de] px-3 py-2 font-bold outline-none focus:border-black"
          onChange={(event) => onRename(event.target.value)}
          value={title}
        />
        <SaveStatus state={saveState} />
      </div>
      <div className="flex items-center gap-2">
        <InkButton
          className="min-h-11 px-3 md:px-4"
          onClick={onImport}
          pressable
          variant="blue"
        >
          <FileUp size={18} />
          <span className="hidden xl:inline">重新导入</span>
          <span className="xl:hidden">导入</span>
        </InkButton>
        <InkButton
          className="min-h-11 px-3 md:px-4"
          onClick={onSwitchTemplate}
          pressable
          variant="pink"
        >
          <LayoutTemplate size={18} />
          <span className="hidden xl:inline">更换模板</span>
          <span className="xl:hidden">模板</span>
        </InkButton>
        <InkButton
          className="min-h-11 px-3 md:px-5"
          onClick={onDownload}
          pressable
          variant="yellow"
        >
          <Download size={18} />
          <span className="hidden sm:inline">导出 PDF</span>
          <span className="sm:hidden">导出</span>
        </InkButton>
      </div>
    </header>
  );
}
