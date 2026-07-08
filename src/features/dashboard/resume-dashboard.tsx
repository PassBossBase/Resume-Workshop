"use client";

import {
  AlertTriangle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  InkButton,
  Modal,
  PageContainer,
  PageHeading,
} from "@/components/anime-ui/ui";
import { ImportResumeModal } from "@/features/dashboard/import-resume-modal";
import { NewResumeModal } from "@/features/dashboard/new-resume-modal";
import {
  EmptyResumeState,
  ResumeCardGrid,
  ResumeDashboardLoadingGrid,
} from "@/features/dashboard/resume-dashboard-cards";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import {
  deleteResume,
  listResumes,
  saveResume,
} from "@/features/storage/resume-repository";
import { buildContinuousResumePage } from "@/features/templates/resume-pages";
import { useToastStore } from "@/stores/toast-store";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";

/** 简历列表页：新建 / 复制 / 删除，加载骨架屏与卡片入口 */
export function ResumeDashboard({
  initialResumes,
}: {
  initialResumes: ResumeDocument[];
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [isLoading, setIsLoading] = useState(initialResumes.length === 0);
  const [importResume, setImportResume] = useState(false);
  const [newResumeOpen, setNewResumeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ResumeDocument>();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    listResumes()
      .then(setResumes)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const addToast = useToastStore((s) => s.addToast);
  const syncResumeToDirectory = useDirectorySyncStore((s) => s.syncResume);
  const deleteResumeFromDirectory = useDirectorySyncStore(
    (s) => s.deleteResume,
  );

  const duplicate = async (resume: ResumeDocument) => {
    const copy = {
      ...resume,
      id: crypto.randomUUID(),
      title: `${resume.title} · 副本`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveResume(copy);
    const syncResult = await syncResumeToDirectory(copy);
    setResumes(await listResumes());
    addToast(`「${resume.title}」复制成功`);
    if (syncResult.status === "unsynced" && syncResult.issue === "error") {
      addToast("目录未同步，副本已保存到浏览器缓存", "info");
    }
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteResume(pendingDelete.id);
      const syncResult = await deleteResumeFromDirectory(
        pendingDelete.id,
        pendingDelete.title,
      );
      setResumes((current) =>
        current.filter((resume) => resume.id !== pendingDelete.id),
      );
      addToast(`「${pendingDelete.title}」已删除`, "info");
      if (syncResult.status === "unsynced" && syncResult.issue === "error") {
        addToast("目录文件未能同步删除，请稍后手动检查", "info");
      }
      setPendingDelete(undefined);
    } catch {
      addToast("删除失败，请重试", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const resumePageMap = useMemo(
    () => new Map(resumes.map((r) => [r.id, buildContinuousResumePage(r)])),
    [resumes],
  );

  return (
    <PageContainer className="flex h-full flex-col overflow-hidden gap-4">
      <div className="flex flex-wrap items-end justify-between gap-5 shrink-0">
        <div>
          <PageHeading
            badge="LOCAL RESUME STUDIO"
            badgeColor="bg-(--yellow)"
            badgeRotation="rotate-[-2deg]"
            title={"我的简历"}
            subtitle="把经历整理成一份清晰、专业又属于你的简历。"
          />
        </div>
        <div className="flex gap-4">
          <InkButton
            onClick={() => setImportResume(true)}
            pressable
            variant="blue"
          >
            <Upload size={17} />
            导入简历
          </InkButton>
          <InkButton
            onClick={() => setNewResumeOpen(true)}
            pressable
            variant="pink"
          >
            新建简历
          </InkButton>
        </div>
      </div>
      <div className="comic-card-scrollbar flex-1 overflow-y-auto">
        {isLoading ? (
          <ResumeDashboardLoadingGrid />
        ) : resumes.length === 0 ? (
          <EmptyResumeState onCreate={() => setNewResumeOpen(true)} />
        ) : (
          <ResumeCardGrid
            onDelete={setPendingDelete}
            onDuplicate={duplicate}
            onOpen={(resumeId) => router.push(`/resume/${resumeId}`)}
            resumePageMap={resumePageMap}
            resumes={resumes}
          />
        )}
      </div>

      <Modal
        ariaLabelledby="delete-resume-title"
        disabled={isDeleting}
        onClose={() => setPendingDelete(undefined)}
        open={Boolean(pendingDelete)}
        size="sm"
      >
        <div className="comic-dots border-b-2 border-black bg-[#fff0e6] px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--pink) text-white">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-1">
              <span className="text-xs font-black tracking-[0.18em] text-red-600">
                DANGER ZONE
              </span>
              <h2 className="mt-1 text-2xl font-black" id="delete-resume-title">
                确认删除简历？
              </h2>
            </div>
          </div>
          <InkButton
            aria-label="关闭删除确认"
            className="absolute right-4 top-4 hover:bg-(--yellow)"
            disabled={isDeleting}
            iconOnly
            onClick={() => setPendingDelete(undefined)}
            size="icon"
            type="button"
            pressable
            variant="paper"
          >
            <X size={20} />
          </InkButton>
        </div>

        <div className="p-6">
          <p className="leading-7 text-black/60">
            你正在删除
            <strong className="mx-1 text-black">
              &ldquo;{pendingDelete?.title}&rdquo;
            </strong>
            。此操作无法撤销，保存在当前设备中的数据也会一并移除。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InkButton
              disabled={isDeleting}
              onClick={() => setPendingDelete(undefined)}
              variant="paper"
              pressable
            >
              取消
            </InkButton>
            <InkButton
              aria-label="确认删除"
              className="bg-red-500 text-white"
              disabled={isDeleting}
              onClick={confirmRemove}
              variant="pink"
              pressable
            >
              <Trash2 size={17} />
              {isDeleting ? "正在删除..." : "确认删除"}
            </InkButton>
          </div>
        </div>
      </Modal>

      <NewResumeModal
        open={newResumeOpen}
        onClose={() => setNewResumeOpen(false)}
        defaultTitle={`我的简历 ${resumes.length + 1}`}
      />
      <ImportResumeModal
        open={importResume}
        onClose={() => setImportResume(false)}
      />
    </PageContainer>
  );
}
