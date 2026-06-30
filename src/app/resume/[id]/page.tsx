import { EditorShellLoader } from "@/features/editor/editor-shell-loader";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditorShellLoader id={id} />;
}
