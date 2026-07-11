import { LayoutDashboard, Sparkles } from "lucide-react";
import { useResumeStore } from "@/stores/resume-store";
import { useT } from "@/lib/i18n";

export type SaveStatusState = ReturnType<
  typeof useResumeStore.getState
>["saveState"];

/** 显示当前简历的保存或目录同步状态。 */
export function SaveStatus({
  state,
}: {
  state: SaveStatusState;
}) {
  const t = useT();
  const labels = {
    synced: t.editor.saveSynced,
    unsynced: t.editor.saveUnsynced,
  };
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${
        state === "synced"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {state === "synced" ? (
        <LayoutDashboard size={12} />
      ) : (
        <Sparkles size={12} />
      )}
      {labels[state]}
    </span>
  );
}
