"use client";

import {
  AlertTriangle,
  Copy,
  FilePlus2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InkButton, StickerCard } from "@/components/anime-ui/ui";
import {
  createDefaultResume,
  type ResumeDocument,
} from "@/features/resume-model/resume-model";
import {
  deleteResume,
  listResumes,
  saveResume,
} from "@/features/storage/resume-repository";
import { ClassicTemplatePage } from "@/features/templates/classic-template";
import { buildResumePages } from "@/features/templates/resume-pages";

export function ResumeDashboard({
  initialResumes,
}: {
  initialResumes: ResumeDocument[];
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [isLoading, setIsLoading] = useState(initialResumes.length === 0);
  const [pendingDelete, setPendingDelete] = useState<ResumeDocument>();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    listResumes()
      .then(setResumes)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!pendingDelete) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) setPendingDelete(undefined);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDeleting, pendingDelete]);

  const createResume = async () => {
    const id = crypto.randomUUID();
    const resume = createDefaultResume(id, `我的简历 ${resumes.length + 1}`);
    await saveResume(resume);
    router.push(`/resume/${id}`);
  };

  const duplicate = async (resume: ResumeDocument) => {
    const copy = {
      ...resume,
      id: crypto.randomUUID(),
      title: `${resume.title} · 副本`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveResume(copy);
    setResumes(await listResumes());
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteResume(pendingDelete.id);
      setResumes((current) =>
        current.filter((resume) => resume.id !== pendingDelete.id),
      );
      setPendingDelete(undefined);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="mx-auto max-w-375 px-5 py-8 md:px-10 lg:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="inline-block rotate-[-2deg] rounded-full border-2 border-black bg-[var(--yellow)] px-4 py-1 text-sm font-black">
            LOCAL RESUME STUDIO
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            我的简历
          </h1>
          <p className="mt-3 max-w-xl text-base font-medium text-black/60">
            把经历整理成一份清晰、专业又属于你的简历。
          </p>
        </div>
        <InkButton onClick={createResume} variant="pink">
          <Plus size={19} />
          新建简历
        </InkButton>
      </div>

      {isLoading ? (
        <div
          aria-label="正在读取简历"
          className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3"
          role="status"
        >
          {[0, 1, 2].map((item) => (
            <StickerCard
              aria-hidden="true"
              className="overflow-hidden"
              key={item}
            >
              <div className="h-64 animate-pulse border-b-2 border-black bg-black/5 p-6">
                <div className="mx-auto h-full max-w-[180px] rounded bg-white/70 shadow-sm" />
              </div>
              <div className="space-y-3 p-5">
                <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-black/10" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[0, 1, 2].map((button) => (
                    <div
                      className="h-11 animate-pulse rounded-2xl bg-black/10"
                      key={button}
                    />
                  ))}
                </div>
              </div>
            </StickerCard>
          ))}
          <span className="sr-only">正在读取简历</span>
        </div>
      ) : resumes.length === 0 ? (
        <StickerCard className="relative overflow-hidden p-10 text-center md:p-16">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-2 border-black bg-[var(--blue)] opacity-90" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rotate-12 border-2 border-black bg-[var(--yellow)]" />
          <FilePlus2 className="mx-auto mb-5" size={54} />
          <h2 className="text-3xl font-black">从第一份简历开始</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-black/60">
            内容自动保存在浏览器。桌面 Chrome 还可以连接本地文件夹。
          </p>
          <InkButton className="mt-7" onClick={createResume} variant="yellow">
            创建第一份简历
          </InkButton>
        </StickerCard>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume, index) => (
            <StickerCard
              key={resume.id}
              className="animate-pop overflow-hidden"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div
                aria-label={`${resume.title}简历内容预览`}
                className="relative h-64 overflow-hidden border-b-2 border-black bg-[#e7ebf1]"
              >
                <div className="template-thumbnail-page absolute left-1/2 top-4 -translate-x-1/2 shadow-[0_16px_35px_rgb(30_40_60/24%)]">
                  <div>
                    <ClassicTemplatePage
                      page={buildResumePages(resume)[0]}
                      resume={resume}
                    />
                  </div>
                </div>
                <div className="absolute right-4 top-4 rounded-full border-2 border-black bg-(--yellow) px-3 py-1 text-xs font-black shadow-[2px_2px_0_black]">
                  经典单栏
                </div>
              </div>
              <div className="p-5">
                <h2 className="truncate text-xl font-black">{resume.title}</h2>
                <p className="mt-1 text-sm text-black/50">
                  更新于 {new Date(resume.updatedAt).toLocaleString("zh-CN")}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <InkButton
                    aria-label={`编辑 ${resume.title}`}
                    className="px-2 max-lg:gap-0"
                    onClick={() => router.push(`/resume/${resume.id}`)}
                    title="编辑"
                    variant="yellow"
                  >
                    <Pencil size={16} />
                    <span className="max-lg:sr-only" data-action-label>
                      编辑
                    </span>
                  </InkButton>
                  <InkButton
                    aria-label={`复制 ${resume.title}`}
                    className="px-2 max-lg:gap-0"
                    onClick={() => duplicate(resume)}
                    title="复制"
                    variant="paper"
                  >
                    <Copy size={16} />
                    <span className="max-lg:sr-only" data-action-label>
                      复制
                    </span>
                  </InkButton>
                  <InkButton
                    aria-label={`删除 ${resume.title}`}
                    className="px-2 text-red-600 max-lg:gap-0"
                    onClick={() => setPendingDelete(resume)}
                    title="删除"
                    variant="paper"
                  >
                    <Trash2 size={16} />
                    <span className="max-lg:sr-only" data-action-label>
                      删除
                    </span>
                  </InkButton>
                </div>
              </div>
            </StickerCard>
          ))}
        </div>
      )}

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-black/70 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isDeleting) {
              setPendingDelete(undefined);
            }
          }}
        >
          <section
            aria-labelledby="delete-resume-title"
            aria-modal="true"
            className="animate-pop relative w-full max-w-lg overflow-hidden rounded-[28px] border-2 border-black bg-(--paper) shadow-[8px_8px_0_black]"
            role="dialog"
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
                  <h2
                    className="mt-1 text-2xl font-black"
                    id="delete-resume-title"
                  >
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
                  “{pendingDelete.title}”
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
          </section>
        </div>
      ) : null}
    </section>
  );
}
