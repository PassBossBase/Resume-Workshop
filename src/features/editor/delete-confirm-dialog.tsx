import { InkButton } from "@/components/anime-ui/ui";
import { useT } from "@/lib/i18n";

/** 删除模块或条目前要求用户确认的轻量对话框。 */
export function DeleteConfirmDialog({
  moduleTitle,
  onConfirm,
  onCancel,
}: {
  moduleTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-80 rounded-2xl border-2 border-black bg-white p-6">
        <h3 className="mb-3 text-lg font-black">{t.customModule.deleteTitle}</h3>
        <p className="mb-5 text-sm text-black/70">
          {t.customModule.deleteBody(moduleTitle)}
        </p>
        <div className="flex gap-3">
          <InkButton
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-black px-4 py-2 font-bold transition hover:bg-gray-100"
            type="button"
            unstyled
          >
            {t.customModule.cancel}
          </InkButton>
          <InkButton
            onClick={onConfirm}
            className="flex-1 rounded-xl border-2 border-black bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
            type="button"
            unstyled
          >
            {t.editor.delete}
          </InkButton>
        </div>
      </div>
    </div>
  );
}
