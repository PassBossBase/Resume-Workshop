import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { ResumePreview } from "@/features/templates/resume-preview";
import { EditorContent } from "./editor-content";
import { MobileEditorTabs, ModuleTabs, type MobileTab } from "./editor-mobile-tabs";
import { ResizeHandle, PanelRestoreButton } from "./resize-handle";
import { StylePanel } from "./style-panel";
import type { usePanelResize } from "./use-panel-resize";
import { useT } from "@/lib/i18n";

export function EditorWorkbench({
  activeModuleId,
  mobileTab,
  onMobileTabChange,
  onModuleChange,
  registerPage,
  resize,
  resume,
}: {
  activeModuleId: string;
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  onModuleChange: (moduleId: string) => void;
  registerPage: (index: number, node: HTMLDivElement | null) => void;
  resize: ReturnType<typeof usePanelResize>;
  resume: ResumeDocument;
}) {
  const t = useT();
  return (
    <>
      <div className="hidden h-[calc(100vh-78px)] lg:flex">
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: resize.leftCollapsed ? 44 : resize.leftWidth,
            transition: resize.isDragging ? "none" : "width 200ms ease",
          }}
        >
          {resize.leftCollapsed ? (
            <PanelRestoreButton
              label={t.editor.expandStyle}
              onClick={resize.expandLeft}
              side="left"
            />
          ) : (
            <aside className="scrollbar-thin h-full overflow-y-auto bg-[#f6f1e7]">
              <StylePanel />
            </aside>
          )}
        </div>

        {!resize.leftCollapsed && (
          <ResizeHandle
            onDoubleClick={resize.resetLeft}
            onMouseDown={resize.onLeftDragStart}
            position="left"
          />
        )}

        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: resize.middleCollapsed ? 44 : resize.middleWidth,
            transition: resize.isDragging ? "none" : "width 200ms ease",
          }}
        >
          {resize.middleCollapsed ? (
            <PanelRestoreButton
              label={t.editor.expandContent}
              onClick={resize.expandMiddle}
              side="left"
            />
          ) : (
            <section className="scrollbar-thin h-full overflow-y-auto">
              <EditorContent />
            </section>
          )}
        </div>

        {!resize.middleCollapsed && (
          <ResizeHandle
            onDoubleClick={resize.resetMiddle}
            onMouseDown={resize.onMiddleDragStart}
            position="middle"
          />
        )}

        <section className="min-w-0 flex-1 overflow-auto">
          <ResumePreview registerPage={registerPage} />
        </section>
      </div>

      <MobileEditorTabs
        content={
          <>
            <ModuleTabs
              activeModuleId={activeModuleId}
              modules={resume.modules}
              onChange={onModuleChange}
            />
            <EditorContent />
          </>
        }
        onValueChange={onMobileTabChange}
        preview={<ResumePreview registerPage={registerPage} />}
        style={<StylePanel />}
        value={mobileTab}
      />
    </>
  );
}
