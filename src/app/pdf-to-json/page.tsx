import { FileJson } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageContainer, PageHeading, StickerCard } from "@/components/anime-ui/ui";

export default function PdfToJsonPage() {
  return (
    <AppShell>
      <PageContainer>
        <PageHeading
          badge="COMING SOON"
          badgeColor="bg-[var(--purple)]"
          badgeTextColor="text-white"
          badgeRotation="rotate-[-2deg]"
          title="PDF转JSON"
          subtitle="上传 PDF 简历，自动提取文字内容并转换为 JSON 格式，方便导入到简历工坊编辑。"
        />

        <StickerCard className="mt-8 p-8 text-center md:p-12">
          <FileJson className="mx-auto mb-5 text-[var(--purple)]" size={56} />
          <h2 className="text-2xl font-black">功能即将推出</h2>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-black/60">
            PDF 转 JSON 工具正在开发中。该功能将支持从文本型 PDF（如 Word
            直接导出的 PDF）中提取简历内容，转换为标准的简历 JSON
            格式，便于导入编辑。
          </p>
          <div className="mt-6 inline-block rounded-2xl border-2 border-black bg-[var(--yellow)] px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_black]">
            敬请期待
          </div>
        </StickerCard>
      </PageContainer>
    </AppShell>
  );
}
