"use client";

import { useRouter } from "next/navigation";
import { ImportResumeModal } from "@/features/dashboard/import-resume-modal";
import { EditorShellHeader } from "./editor-shell-header";
import { EditorWorkbench } from "./editor-workbench";
import { PrintableResume } from "@/features/templates/printable-resume";
import { TemplateSwitchModal } from "./template-switch-modal";
import { EditorWorkspaceLoading } from "./editor-workspace-loading";
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
    return <EditorWorkspaceLoading />;
  }

  return (
    <>
      <div className="editor-screen editor-workspace h-screen overflow-hidden">
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
          onPrint={editor.print}
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
      <PrintableResume resume={editor.resume} />
    </>
  );
}
