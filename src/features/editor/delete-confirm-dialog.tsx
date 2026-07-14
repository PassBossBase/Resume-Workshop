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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#022f44]/72 p-4 backdrop-blur-md">
      <div className="w-80 rounded-2xl border border-white/32 bg-[#063c4d]/92 p-6 text-white shadow-[0_24px_70px_rgb(2_33_46_/_42%)] backdrop-blur-2xl">
        <h3 className="mb-3 text-lg font-black">{t.customModule.deleteTitle}</h3>
        <p className="mb-5 text-sm text-white/72">
          {t.customModule.deleteBody(moduleTitle)}
        </p>
        <div className="flex gap-3">
          <InkButton
            onClick={onCancel}
            className="flex-1 rounded-xl"
            type="button"
            variant="glass"
          >
            {t.customModule.cancel}
          </InkButton>
          <InkButton
            onClick={onConfirm}
            className="flex-1 rounded-xl border-rose-100/45 bg-rose-400/34 text-white hover:bg-rose-400/46"
            type="button"
            variant="glass"
          >
            {t.editor.delete}
          </InkButton>
        </div>
      </div>
    </div>
  );
}
