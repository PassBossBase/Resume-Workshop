import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import {
  buildPdfImportPayload,
  embedPdfImportPayload,
} from "@/features/pdf-export/pdf-import-payload";

const A4_PAGE_WIDTH = 794;
const A4_PAGE_HEIGHT = 1123;
const PAGE_BREAK_GUARD = 4;
const MIN_SAFE_SLICE_RATIO = 0.38;

interface ProtectedRange {
  top: number;
  bottom: number;
}

interface PdfSlice {
  y: number;
  height: number;
}

/** 将简历页面 DOM 节点截图拼接为 A4 PDF 并触发下载 */
export async function exportResumePdf(
  pages: HTMLElement[],
  fileName: string,
  resume: ResumeDocument,
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
    const slices = calculatePdfSlices(
      height,
      A4_PAGE_HEIGHT,
      collectProtectedRanges(page),
    );

    for (const sliceRange of slices) {
      const sourceY = Math.round(sliceRange.y * scale);
      const sourceHeight = Math.min(
        sliceHeight,
        Math.max(1, Math.round(sliceRange.height * scale)),
      );
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
        sourceY,
        sliceWidth,
        sourceHeight,
        0,
        0,
        sliceWidth,
        sourceHeight,
      );

      if (hasPage) pdf.addPage("a4", "portrait");
      pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");
      hasPage = true;
    }
  }

  embedPdfImportPayload(pdf, buildPdfImportPayload(resume));
  pdf.save(`${sanitizeFileName(fileName)}.pdf`);
}

export function calculatePdfSlices(
  contentHeight: number,
  pageHeight: number,
  protectedRanges: ProtectedRange[] = [],
): PdfSlice[] {
  const slices: PdfSlice[] = [];
  const minSafeSliceHeight = pageHeight * MIN_SAFE_SLICE_RATIO;
  let y = 0;

  while (y < contentHeight) {
    const remaining = contentHeight - y;
    if (remaining <= pageHeight) {
      slices.push({ y, height: remaining });
      break;
    }

    const idealBreak = y + pageHeight;
    const safeBreak = findSafeBreak(
      y,
      idealBreak,
      protectedRanges,
      minSafeSliceHeight,
    );
    slices.push({ y, height: safeBreak - y });
    y = safeBreak;
  }

  return slices;
}

function findSafeBreak(
  sliceTop: number,
  idealBreak: number,
  protectedRanges: ProtectedRange[],
  minSafeSliceHeight: number,
): number {
  const crossingRanges = protectedRanges
    .filter((range) =>
      range.top + PAGE_BREAK_GUARD < idealBreak &&
      range.bottom - PAGE_BREAK_GUARD > idealBreak,
    )
    .sort((a, b) => a.top - b.top);

  for (const range of crossingRanges) {
    const candidate = Math.floor(range.top - PAGE_BREAK_GUARD);
    if (candidate - sliceTop >= minSafeSliceHeight) return candidate;
  }

  return idealBreak;
}

function collectProtectedRanges(page: HTMLElement): ProtectedRange[] {
  const pageRect = page.getBoundingClientRect();
  const renderedHeight = pageRect.height || page.offsetHeight || page.scrollHeight;
  const scaleY = renderedHeight > 0 ? page.scrollHeight / renderedHeight : 1;
  const ranges = [
    ...collectTextLineRanges(page, pageRect, scaleY),
    ...collectElementRanges(page, pageRect, scaleY),
  ];

  return mergeProtectedRanges(ranges).sort((a, b) => a.top - b.top);
}

function collectTextLineRanges(
  page: HTMLElement,
  pageRect: DOMRect,
  scaleY: number,
): ProtectedRange[] {
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest('[data-pdf-exclude="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const ranges: ProtectedRange[] = [];
  let node = walker.nextNode();

  while (node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.height <= 0) continue;
      ranges.push(toProtectedRange(rect, pageRect, scaleY));
    }
    range.detach();
    node = walker.nextNode();
  }

  return ranges;
}

function collectElementRanges(
  page: HTMLElement,
  pageRect: DOMRect,
  scaleY: number,
): ProtectedRange[] {
  return Array.from(page.querySelectorAll("img,h1,h2,h3,h4"))
    .filter((node) => !node.closest('[data-pdf-exclude="true"]'))
    .map((node) => toProtectedRange(node.getBoundingClientRect(), pageRect, scaleY));
}

function toProtectedRange(
  rect: DOMRect,
  pageRect: DOMRect,
  scaleY: number,
): ProtectedRange {
  return {
    top: Math.max(0, (rect.top - pageRect.top) * scaleY),
    bottom: Math.max(0, (rect.bottom - pageRect.top) * scaleY),
  };
}

function mergeProtectedRanges(ranges: ProtectedRange[]): ProtectedRange[] {
  const sorted = ranges
    .filter((range) => range.bottom > range.top)
    .sort((a, b) => a.top - b.top);
  const merged: ProtectedRange[] = [];

  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range.top <= last.bottom + PAGE_BREAK_GUARD) {
      last.bottom = Math.max(last.bottom, range.bottom);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}
function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "简历";
}
