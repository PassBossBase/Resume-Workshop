import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

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

  for (let index = 0; index < pages.length; index += 1) {
    const image = await toPng(pages[index], {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
    if (index > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(image, "PNG", 0, 0, 210, 297, undefined, "FAST");
  }

  pdf.save(`${sanitizeFileName(fileName)}.pdf`);
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "简历";
}
