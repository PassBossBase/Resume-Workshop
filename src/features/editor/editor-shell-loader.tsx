"use client";

import dynamic from "next/dynamic";

const EditorShell = dynamic(
  () => import("./editor-shell").then((module) => module.EditorShell),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[#ebe7de] px-6 text-center">
        <div className="rounded-3xl border-2 border-black bg-white px-6 py-5 font-black shadow-[5px_5px_0_#111]">
          正在打开简历编辑器...
        </div>
      </div>
    ),
  },
);

export function EditorShellLoader({ id }: { id: string }) {
  return <EditorShell id={id} />;
}
