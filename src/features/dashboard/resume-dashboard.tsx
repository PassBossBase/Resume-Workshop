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
import { useLocale } from "@/lib/i18n";

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
  const { t } = useLocale();

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
      title: t.dashboard.copyTitle(resume.title),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveResume(copy);
    const syncResult = await syncResumeToDirectory(copy);
    setResumes(await listResumes());
    addToast(t.dashboard.copiedToast(resume.title));
    if (syncResult.status === "unsynced" && syncResult.issue === "error") {
      addToast(t.dashboard.copyUnsyncedToast, "info");
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
      addToast(t.dashboard.deletedToast(pendingDelete.title), "info");
      if (syncResult.status === "unsynced" && syncResult.issue === "error") {
        addToast(t.dashboard.deleteUnsyncedToast, "info");
      }
      setPendingDelete(undefined);
    } catch {
      addToast(t.dashboard.deleteFailedToast, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const resumePageMap = useMemo(
    () => new Map(resumes.map((r) => [r.id, buildContinuousResumePage(r)])),
    [resumes],
  );

  return (
    <PageContainer className="flex h-full flex-col gap-7 overflow-hidden text-white">
      <div className="flex flex-wrap items-end justify-between gap-5 shrink-0">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-white/72">RESUME WORKSHOP</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">{t.dashboard.title}</h1>
          <p className="mt-3 max-w-xl text-base font-medium leading-7 text-white/78">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex gap-4">
          <InkButton
            className="rounded-2xl"
            onClick={() => setImportResume(true)}
            variant="glass"
          >
            <Upload size={17} />
            {t.dashboard.import}
          </InkButton>
          <InkButton
            className="rounded-2xl bg-white/24 hover:bg-white/32"
            onClick={() => setNewResumeOpen(true)}
            variant="glass"
          >
            {t.dashboard.create}
          </InkButton>
        </div>
      </div>
      <div className="scenic-scrollbar flex-1 overflow-y-auto pb-2">
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
        appearance="glass"
        ariaLabelledby="delete-resume-title"
        disabled={isDeleting}
        onClose={() => setPendingDelete(undefined)}
        open={Boolean(pendingDelete)}
        size="sm"
      >
        <div className="glass-modal-header border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-rose-100/45 bg-rose-300/22 text-rose-50">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-1">
              <span className="text-xs font-black tracking-[0.18em] text-rose-200">
                DANGER ZONE
              </span>
              <h2 className="mt-1 text-2xl font-black" id="delete-resume-title">
                {t.dashboard.deleteTitle}
              </h2>
            </div>
          </div>
          <InkButton
            aria-label={t.dashboard.closeDelete}
            className="absolute right-4 top-4"
            disabled={isDeleting}
            iconOnly
            onClick={() => setPendingDelete(undefined)}
            size="icon"
            type="button"
            variant="glass"
          >
            <X size={20} />
          </InkButton>
        </div>

        <div className="glass-modal-body p-6">
          <p className="glass-modal-muted leading-7">
            {pendingDelete ? t.dashboard.deleteBody(pendingDelete.title) : ""}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InkButton
              className="rounded-2xl"
              disabled={isDeleting}
              onClick={() => setPendingDelete(undefined)}
              variant="glass"
            >
              {t.dashboard.cancel}
            </InkButton>
            <InkButton
              aria-label={t.dashboard.confirmDelete}
              className="border-rose-100/45 bg-rose-400/34 text-white hover:bg-rose-400/46"
              disabled={isDeleting}
              onClick={confirmRemove}
              variant="glass"
            >
              <Trash2 size={17} />
              {isDeleting ? t.dashboard.deleting : t.dashboard.confirmDelete}
            </InkButton>
          </div>
        </div>
      </Modal>

      <NewResumeModal
        open={newResumeOpen}
        onClose={() => setNewResumeOpen(false)}
      />
      <ImportResumeModal
        open={importResume}
        onClose={() => setImportResume(false)}
      />
    </PageContainer>
  );
}
