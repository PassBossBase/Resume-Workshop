import { LayoutDashboard, Sparkles } from "lucide-react";
import { useResumeStore } from "@/stores/resume-store";

export type SaveStatusState = ReturnType<
  typeof useResumeStore.getState
>["saveState"];

export function SaveStatus({
  state,
}: {
  state: SaveStatusState;
}) {
  const labels = {
    synced: "已同步",
    unsynced: "未同步",
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
