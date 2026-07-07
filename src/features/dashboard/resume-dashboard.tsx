"use client";

import {
  AlertTriangle,
  Copy,
  FilePlus2,
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
  StickerCard,
} from "@/components/anime-ui/ui";
import { ImportResumeModal } from "@/features/dashboard/import-resume-modal";
import { NewResumeModal } from "@/features/dashboard/new-resume-modal";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import {
  deleteResume,
  listResumes,
  saveResume,
} from "@/features/storage/resume-repository";
import { buildContinuousResumePage } from "@/features/templates/resume-pages";
import { ResumeContentThumbnail } from "@/features/templates/resume-content-thumbnail";
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
          <InkButton onClick={() => setImportResume(true)} variant="blue">
            <Upload size={17} />
            导入简历
          </InkButton>
          <InkButton onClick={() => setNewResumeOpen(true)} variant="pink">
            新建简历
          </InkButton>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            aria-label="正在读取简历"
            className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4"
            role="status"
          >
            {[0, 1, 2].map((item) => (
              <StickerCard
                aria-hidden="true"
                className="relative h-84 overflow-hidden border-0  shadow-none hover:shadow-none"
                key={item}
              >
                <div className="h-full animate-pulse bg-white/90" />
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/80" />
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/80" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 space-y-3 p-6">
                  <div className="h-7 w-2/3 animate-pulse rounded bg-white/75" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/45" />
                </div>
              </StickerCard>
            ))}
            <span className="sr-only">正在读取简历</span>
          </div>
        ) : resumes.length === 0 ? (
          <StickerCard className="relative overflow-hidden p-10 text-center md:p-16">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-2 border-black bg-(--blue) opacity-90" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rotate-12 border-2 border-black bg-(--yellow)" />
            <FilePlus2 className="mx-auto mb-5" size={54} />
            <h2 className="text-3xl font-black">从第一份简历开始</h2>
            <p className="mx-auto mt-3 max-w-md leading-7 text-black/60">
              内容自动保存在浏览器。桌面 Chrome 还可以连接本地文件夹。
            </p>
            <InkButton
              className="mt-7"
              onClick={() => setNewResumeOpen(true)}
              variant="yellow"
            >
              创建第一份简历
            </InkButton>
          </StickerCard>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
            {resumes.map((resume, index) => (
              <StickerCard
                key={resume.id}
                className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden border-0  text-white shadow-none hover:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
                style={{ animationDelay: `${index * 60}ms` }}
                role="button"
                tabIndex={0}
                aria-label={`编辑 ${resume.title}`}
                onClick={() => router.push(`/resume/${resume.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/resume/${resume.id}`);
                  }
                }}
              >
                <ResumeContentThumbnail
                  ariaLabel={`${resume.title}简历内容预览`}
                  className="pointer-events-none"
                  fitToWidth
                  page={resumePageMap.get(resume.id)!}
                  resume={resume}
                />

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-10 bg-[rgba(59,59,203,0.92)] px-5 py-3 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
                  <h2 className="truncate text-[16px] font-black text-white">
                    {resume.title}
                  </h2>
                  <p className="mt-1 truncate text-xs font-medium text-white/90">
                    更新于 {new Date(resume.updatedAt).toLocaleString("zh-CN")}
                  </p>
                </div>

                {/* 右上角操作按钮 */}
                <div
                  className="absolute flex top-3 right-3 z-10 gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ease-out"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label={`复制 ${resume.title}`}
                    className="group/copy relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-black bg-white text-(--ink) transition hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicate(resume);
                    }}
                  >
                    <Copy
                      size={16}
                      className="transition-all duration-200 group-hover/copy:scale-75 group-hover/copy:opacity-0 group-focus-visible/copy:scale-75 group-focus-visible/copy:opacity-0"
                    />
                    <span className="absolute inset-0 flex scale-75 items-center justify-center text-xs font-black opacity-0 transition-all duration-200 group-hover/copy:scale-100 group-hover/copy:opacity-100 group-focus-visible/copy:scale-100 group-focus-visible/copy:opacity-100">
                      复制
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={`删除 ${resume.title}`}
                    className="group/del relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-black bg-white text-red-600 transition hover:bg-[#ffe1e1] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(resume);
                    }}
                  >
                    <Trash2
                      size={16}
                      className="transition-all duration-200 group-hover/del:scale-75 group-hover/del:opacity-0 group-focus-visible/del:scale-75 group-focus-visible/del:opacity-0"
                    />
                    <span className="absolute inset-0 flex scale-75 items-center justify-center text-xs font-black opacity-0 transition-all duration-200 group-hover/del:scale-100 group-hover/del:opacity-100 group-focus-visible/del:scale-100 group-focus-visible/del:opacity-100">
                      删除
                    </span>
                  </button>
                </div>
              </StickerCard>
            ))}
          </div>
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
            <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--pink) text-white shadow-[3px_3px_0_black]">
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
          <button
            aria-label="关闭删除确认"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white transition hover:bg-(--yellow)"
            disabled={isDeleting}
            onClick={() => setPendingDelete(undefined)}
            type="button"
          >
            <X size={20} />
          </button>
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
            >
              取消
            </InkButton>
            <InkButton
              aria-label="确认删除"
              className="bg-red-500 text-white"
              disabled={isDeleting}
              onClick={confirmRemove}
              variant="pink"
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
