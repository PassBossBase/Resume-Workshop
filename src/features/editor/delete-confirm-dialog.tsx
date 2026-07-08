export function DeleteConfirmDialog({
  moduleTitle,
  onConfirm,
  onCancel,
}: {
  moduleTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-80 rounded-2xl border-2 border-black bg-white p-6">
        <h3 className="mb-3 text-lg font-black">确认删除</h3>
        <p className="mb-5 text-sm text-black/70">
          将删除模块「{moduleTitle}」及其所有项目，此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-black px-4 py-2 font-bold transition hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl border-2 border-black bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
