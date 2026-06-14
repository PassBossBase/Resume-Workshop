import { EditorShell } from "@/features/editor/editor-shell";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditorShell id={id} />;
}
