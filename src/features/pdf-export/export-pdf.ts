import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import {
  buildPdfImportPayload,
  embedPdfImportPayload,
} from "@/features/pdf-export/pdf-import-payload";

const A4_PAGE_WIDTH = 794;
const A4_PAGE_HEIGHT = 1123;
const PDF_PAGE_WIDTH = 210;
const PDF_PAGE_HEIGHT = 297;
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

interface ExportPdfMessages {
  noPage: string;
  canvasFailed: string;
  fallbackFileName: string;
}

interface PageBox {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

interface PdfLinkArea extends PageBox {
  href: string;
}

/** 将简历页面 DOM 节点截图拼接为 A4 PDF 并触发下载 */
export async function exportResumePdf(
  pages: HTMLElement[],
  fileName: string,
  resume: ResumeDocument,
  messages: ExportPdfMessages = {
    noPage: "没有可导出的简历页面",
    canvasFailed: "无法创建 PDF 页面画布",
    fallbackFileName: "简历",
  },
): Promise<void> {
  if (pages.length === 0) throw new Error(messages.noPage);
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
    const linkAreas = collectPdfLinkAreas(page);
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
    const protectedRanges = collectProtectedRanges(page);
    const slices = calculatePdfSlices(
      getEffectiveContentHeight(height, A4_PAGE_HEIGHT, protectedRanges),
      A4_PAGE_HEIGHT,
      protectedRanges,
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
      if (!context) throw new Error(messages.canvasFailed);

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
      pdf.addImage(
        slice.toDataURL("image/png"),
        "PNG",
        0,
        0,
        PDF_PAGE_WIDTH,
        PDF_PAGE_HEIGHT,
        undefined,
        "FAST",
      );
      addLinkAnnotations(pdf, linkAreas, sliceRange);
      hasPage = true;
    }
  }

  embedPdfImportPayload(pdf, buildPdfImportPayload(resume));
  pdf.save(`${sanitizeFileName(fileName, messages.fallbackFileName)}.pdf`);
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

function getEffectiveContentHeight(
  renderedHeight: number,
  pageHeight: number,
  protectedRanges: ProtectedRange[],
): number {
  const contentBottom = protectedRanges.reduce(
    (bottom, range) => Math.max(bottom, range.bottom),
    0,
  );
  if (contentBottom <= 0) return renderedHeight;
  return Math.min(renderedHeight, Math.max(pageHeight, contentBottom + PAGE_BREAK_GUARD));
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

function collectPdfLinkAreas(page: HTMLElement): PdfLinkArea[] {
  const geometry = getPageGeometry(page);
  const links: PdfLinkArea[] = [];

  page.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    if (shouldSkipPdfNode(anchor)) return;
    const href = normalizePdfHref(anchor.getAttribute("href") ?? "");
    if (!href) return;

    for (const rect of Array.from(anchor.getClientRects())) {
      if (rect.width <= 0 || rect.height <= 0) continue;
      const box = toPageBox(rect, geometry);
      if (box.width <= 0 || box.height <= 0) continue;
      links.push({ ...box, href });
    }
  });

  return links;
}

function addLinkAnnotations(
  pdf: jsPDF,
  linkAreas: PdfLinkArea[],
  slice: PdfSlice,
): void {
  const sliceBottom = slice.y + slice.height;

  for (const area of linkAreas) {
    const top = Math.max(area.top, slice.y);
    const bottom = Math.min(area.bottom, sliceBottom);
    if (bottom <= top) continue;

    pdf.link(
      cssPxToPdfX(area.left),
      cssPxToPdfY(top - slice.y),
      cssPxToPdfWidth(area.width),
      cssPxToPdfHeight(bottom - top),
      { url: area.href },
    );
  }
}

function getPageGeometry(page: HTMLElement) {
  const pageRect = page.getBoundingClientRect();
  const renderedWidth = pageRect.width || page.offsetWidth || page.scrollWidth;
  const renderedHeight = pageRect.height || page.offsetHeight || page.scrollHeight;
  return {
    pageRect,
    scaleX: renderedWidth > 0 ? page.scrollWidth / renderedWidth : 1,
    scaleY: renderedHeight > 0 ? page.scrollHeight / renderedHeight : 1,
  };
}

function toPageBox(
  rect: DOMRect,
  geometry: ReturnType<typeof getPageGeometry>,
): PageBox {
  const left = Math.max(0, (rect.left - geometry.pageRect.left) * geometry.scaleX);
  const top = Math.max(0, (rect.top - geometry.pageRect.top) * geometry.scaleY);
  const width = Math.max(0, rect.width * geometry.scaleX);
  const height = Math.max(0, rect.height * geometry.scaleY);

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function shouldSkipPdfNode(node: Element): boolean {
  if (node.closest('[data-pdf-exclude="true"]')) return true;
  const element = node instanceof HTMLElement ? node : null;
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display === "none" || style.visibility === "hidden";
}

function normalizePdfHref(value: string): string | null {
  const href = value.trim();
  if (!href || href.startsWith("#")) return null;
  const compactHref = href.replace(/[\u0000-\u0020]+/g, "");
  return /^(javascript|data|vbscript):/i.test(compactHref) ? null : href;
}

function cssPxToPdfX(value: number): number {
  return (value / A4_PAGE_WIDTH) * PDF_PAGE_WIDTH;
}

function cssPxToPdfY(value: number): number {
  return (value / A4_PAGE_HEIGHT) * PDF_PAGE_HEIGHT;
}

function cssPxToPdfWidth(value: number): number {
  return (value / A4_PAGE_WIDTH) * PDF_PAGE_WIDTH;
}

function cssPxToPdfHeight(value: number): number {
  return (value / A4_PAGE_HEIGHT) * PDF_PAGE_HEIGHT;
}

function sanitizeFileName(value: string, fallback: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || fallback;
}
