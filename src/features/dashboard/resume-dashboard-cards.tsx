import { Copy, FilePlus2, Trash2 } from "lucide-react";
import { InkButton, StickerCard } from "@/components/anime-ui/ui";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { ResumeContentThumbnail } from "@/features/templates/resume-content-thumbnail";
import type { ResumePageData } from "@/features/templates/resume-pages";
import { formatLocaleDateTime, useLocale } from "@/lib/i18n";

/** 仪表盘加载简历列表时展示的卡片骨架。 */
export function ResumeDashboardLoadingGrid() {
  const { t } = useLocale();
  return (
    <div
      aria-label={t.dashboard.loading}
      className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4"
      role="status"
    >
      {[0, 1, 2].map((item) => (
        <StickerCard
          aria-hidden="true"
          className="relative h-84 overflow-hidden"
          key={item}
          variant="scenic"
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
      <span className="sr-only">{t.dashboard.loading}</span>
    </div>
  );
}

/** 没有本地简历时引导用户创建第一份简历。 */
export function EmptyResumeState({ onCreate }: { onCreate: () => void }) {
  const { t } = useLocale();
  return (
    <StickerCard className="relative overflow-hidden p-10 text-center text-white md:p-16" variant="scenic">
      <FilePlus2 className="mx-auto mb-5 text-cyan-100" size={54} />
      <h2 className="text-3xl font-black">{t.dashboard.emptyTitle}</h2>
      <p className="mx-auto mt-3 max-w-md leading-7 text-white/72">
        {t.dashboard.emptyCopy}
      </p>
      <InkButton
        className="mt-7"
        onClick={onCreate}
        variant="glass"
      >
        {t.dashboard.emptyAction}
      </InkButton>
    </StickerCard>
  );
}

/** 按更新时间展示简历卡片及其编辑、复制、删除入口。 */
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
  const { locale, t } = useLocale();
  return (
    <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
      {resumes.map((resume, index) => (
        <StickerCard
          key={resume.id}
          className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden text-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ animationDelay: `${index * 60}ms` }}
          role="button"
          tabIndex={0}
          aria-label={t.dashboard.editAria(resume.title)}
          onClick={() => onOpen(resume.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(resume.id);
            }
          }}
          variant="scenic"
        >
          <ResumeContentThumbnail
            ariaLabel={
              locale === "en-US"
                ? `${resume.title} resume content preview`
                : `${resume.title}简历内容预览`
            }
            className="pointer-events-none"
            fitToWidth
            page={resumePageMap.get(resume.id)!}
            resume={resume}
          />

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-10 border-t border-white/25 bg-[#063c4d]/76 px-5 py-3 opacity-0 backdrop-blur-xl transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
            <h2 className="truncate text-[16px] font-black text-white">
              {resume.title}
            </h2>
            <p className="mt-1 truncate text-xs font-medium text-white/90">
              {t.dashboard.updatedAt(
                formatLocaleDateTime(resume.updatedAt, locale),
              )}
            </p>
          </div>

          <div
            className="absolute flex top-3 right-3 z-10 gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <InkButton
              type="button"
              aria-label={t.dashboard.duplicateAria(resume.title)}
              className="rounded-full bg-white/88 text-[#064458] hover:bg-white"
              hoverLabel={t.dashboard.duplicateAction}
              iconOnly
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(resume);
              }}
              size="icon"
              variant="glass"
            >
              <Copy size={16} />
            </InkButton>

            <InkButton
              type="button"
              aria-label={t.dashboard.deleteAria(resume.title)}
              className="rounded-full bg-white/88 text-[#a61f35] hover:bg-white"
              hoverLabel={t.dashboard.deleteAction}
              iconOnly
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resume);
              }}
              size="icon"
              variant="glass"
            >
              <Trash2 size={16} />
            </InkButton>
          </div>
        </StickerCard>
      ))}
    </div>
  );
}
