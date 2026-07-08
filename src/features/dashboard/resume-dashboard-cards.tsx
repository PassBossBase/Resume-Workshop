import { Copy, FilePlus2, Trash2 } from "lucide-react";
import { InkButton, StickerCard } from "@/components/anime-ui/ui";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { ResumeContentThumbnail } from "@/features/templates/resume-content-thumbnail";
import type { ResumePageData } from "@/features/templates/resume-pages";

export function ResumeDashboardLoadingGrid() {
  return (
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
  );
}

export function EmptyResumeState({ onCreate }: { onCreate: () => void }) {
  return (
    <StickerCard className="relative overflow-hidden p-10 text-center md:p-16">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-2 border-black bg-(--blue) opacity-90" />
      <div className="absolute -bottom-8 -left-8 h-28 w-28 rotate-12 border-2 border-black bg-(--yellow)" />
      <FilePlus2 className="mx-auto mb-5" size={54} />
      <h2 className="text-3xl font-black">从第一份简历开始</h2>
      <p className="mx-auto mt-3 max-w-md leading-7 text-black/60">
        内容自动保存在浏览器。桌面 Chrome 还可以连接本地文件夹。
      </p>
      <InkButton className="mt-7" onClick={onCreate} variant="yellow" pressable>
        创建第一份简历
      </InkButton>
    </StickerCard>
  );
}

export function ResumeCardGrid({
  onDelete,
  onDuplicate,
  onOpen,
  resumePageMap,
  resumes,
}: {
  onDelete: (resume: ResumeDocument) => void;
  onDuplicate: (resume: ResumeDocument) => void;
  onOpen: (resumeId: string) => void;
  resumePageMap: Map<string, ResumePageData>;
  resumes: ResumeDocument[];
}) {
  return (
    <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
      {resumes.map((resume, index) => (
        <StickerCard
          key={resume.id}
          className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden border-0  text-white shadow-none hover:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
          style={{ animationDelay: `${index * 60}ms` }}
          role="button"
          tabIndex={0}
          aria-label={`编辑 ${resume.title}`}
          onClick={() => onOpen(resume.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(resume.id);
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

          <div
            className="absolute flex top-3 right-3 z-10 gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <InkButton
              type="button"
              aria-label={`复制 ${resume.title}`}
              className="group/copy relative overflow-hidden rounded-full shadow-none hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
              iconOnly
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(resume);
              }}
              size="icon"
              variant="paper"
            >
              <Copy
                size={16}
                className="transition-all duration-200 group-hover/copy:scale-75 group-hover/copy:opacity-0 group-focus-visible/copy:scale-75 group-focus-visible/copy:opacity-0"
              />
              <span className="absolute inset-0 flex scale-75 items-center justify-center text-xs font-black opacity-0 transition-all duration-200 group-hover/copy:scale-100 group-hover/copy:opacity-100 group-focus-visible/copy:scale-100 group-focus-visible/copy:opacity-100">
                复制
              </span>
            </InkButton>

            <InkButton
              type="button"
              aria-label={`删除 ${resume.title}`}
              className="group/del relative overflow-hidden rounded-full text-red-600 shadow-none hover:bg-[#ffe1e1] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
              iconOnly
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resume);
              }}
              size="icon"
              variant="paper"
            >
              <Trash2
                size={16}
                className="transition-all duration-200 group-hover/del:scale-75 group-hover/del:opacity-0 group-focus-visible/del:scale-75 group-focus-visible/del:opacity-0"
              />
              <span className="absolute inset-0 flex scale-75 items-center justify-center text-xs font-black opacity-0 transition-all duration-200 group-hover/del:scale-100 group-hover/del:opacity-100 group-focus-visible/del:scale-100 group-focus-visible/del:opacity-100">
                删除
              </span>
            </InkButton>
          </div>
        </StickerCard>
      ))}
    </div>
  );
}
