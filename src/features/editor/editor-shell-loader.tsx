"use client";

import dynamic from "next/dynamic";
import { EditorWorkspaceLoading } from "./editor-workspace-loading";

const EditorShell = dynamic(
  () => import("./editor-shell").then((module) => module.EditorShell),
  {
    ssr: false,
    loading: EditorWorkspaceLoading,
  },
);

/** 延迟加载编辑器客户端壳层，降低动态路由首次加载负担。 */
export function EditorShellLoader({ id }: { id: string }) {
  return <EditorShell id={id} />;
}
