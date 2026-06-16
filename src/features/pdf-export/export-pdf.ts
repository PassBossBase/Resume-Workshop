import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_PAGE_WIDTH = 794;
const A4_PAGE_HEIGHT = 1123;

/** 将简历页面 DOM 节点截图拼接为 A4 PDF 并触发下载 */
export async function exportResumePdf(
  pages: HTMLElement[],
  fileName: string,
): Promise<void> {
  if (pages.length === 0) throw new Error("没有可导出的简历页面");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  let hasPage = false;

  for (const page of pages) {
    const width = Math.max(A4_PAGE_WIDTH, Math.ceil(page.scrollWidth || page.offsetWidth));
    const height = Math.max(A4_PAGE_HEIGHT, Math.ceil(page.scrollHeight || page.offsetHeight));
    const canvas = await toCanvas(page, {
      width,
      height,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      filter: (node) =>
        !(node instanceof HTMLElement && node.dataset.pdfExclude === "true"),
      style: {
        height: `${height}px`,
        width: `${width}px`,
      },
    });

    const scale = canvas.width / width;
    const sliceHeight = Math.round(A4_PAGE_HEIGHT * scale);
    const sliceWidth = Math.round(A4_PAGE_WIDTH * scale);
    const pageCount = Math.max(1, Math.ceil(canvas.height / sliceHeight));

    for (let index = 0; index < pageCount; index += 1) {
      const slice = document.createElement("canvas");
      slice.width = sliceWidth;
      slice.height = sliceHeight;
      const context = slice.getContext("2d");
      if (!context) throw new Error("无法创建 PDF 页面画布");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(
        canvas,
        0,
        index * sliceHeight,
        sliceWidth,
        Math.min(sliceHeight, canvas.height - index * sliceHeight),
        0,
        0,
        sliceWidth,
        Math.min(sliceHeight, canvas.height - index * sliceHeight),
      );

      if (hasPage) pdf.addPage("a4", "portrait");
      pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");
      hasPage = true;
    }
  }

  pdf.save(`${sanitizeFileName(fileName)}.pdf`);
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "简历";
}
