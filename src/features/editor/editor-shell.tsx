"use client";

import { useRouter } from "next/navigation";
import { ImportResumeModal } from "@/features/dashboard/import-resume-modal";
import { EditorShellHeader } from "./editor-shell-header";
import { EditorWorkbench } from "./editor-workbench";
import { TemplateSwitchModal } from "./template-switch-modal";
import { useEditorShellState } from "./use-editor-shell-state";
import { useT } from "@/lib/i18n";

/**
 * 编辑器顶层容器：三栏布局（样式 / 内容 / 预览），
 * 负责数据加载、自动保存与移动端底部 tab 切换。
 */
export function EditorShell({ id }: { id: string }) {
  const router = useRouter();
  const editor = useEditorShellState(id);
  const t = useT();

  if (!editor.ready || !editor.resume) {
    return (
      <div className="grid min-h-screen place-items-center bg-(--yellow)">
        <div className="animate-bounce rounded-[28px] border-2 border-black bg-white px-7 py-5 text-xl font-black shadow-[5px_5px_0_black]">
          {t.editor.opening}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#ebe7de]">
      <EditorShellHeader
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }}
        onDownload={editor.download}
        onImport={() => editor.setImportResumeOpen(true)}
        onRename={editor.rename}
        onSwitchTemplate={() => editor.setTemplateModalOpen(true)}
        saveState={editor.saveState}
        title={editor.resume.title}
      />

      {editor.importResumeOpen && (
        <ImportResumeModal
          initialTemplateId={editor.resume.templateId}
          onClose={() => editor.setImportResumeOpen(false)}
          onImportedResume={editor.handleImportedResume}
          open={editor.importResumeOpen}
          submitLabel={t.importResume.replaceSubmit}
        />
      )}

      {editor.templateModalOpen && (
        <TemplateSwitchModal
          currentTemplateId={editor.resume.templateId}
          onApply={editor.handleApplyTemplate}
          onClose={() => editor.setTemplateModalOpen(false)}
          open={editor.templateModalOpen}
        />
      )}

      <EditorWorkbench
        activeModuleId={editor.activeModuleId}
        mobileTab={editor.mobileTab}
        onMobileTabChange={editor.setMobileTab}
        onModuleChange={editor.setActiveModule}
        registerPage={editor.registerPage}
        resize={editor.resize}
        resume={editor.resume}
      />
    </div>
  );
}
