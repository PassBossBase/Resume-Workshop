"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n";

/** 动态加载编辑器壳层时显示的本地化占位界面。 */
function EditorShellDynamicLoading() {
  const t = useT();

  return (
    <div className="grid min-h-screen place-items-center bg-[#ebe7de] px-6 text-center">
      <div className="rounded-3xl border-2 border-black bg-white px-6 py-5 font-black shadow-[5px_5px_0_#111]">
        {t.editor.opening}
      </div>
    </div>
  );
}

const EditorShell = dynamic(
  () => import("./editor-shell").then((module) => module.EditorShell),
  {
    ssr: false,
    loading: EditorShellDynamicLoading,
  },
);

/** 延迟加载编辑器客户端壳层，降低动态路由首次加载负担。 */
export function EditorShellLoader({ id }: { id: string }) {
  return <EditorShell id={id} />;
}
