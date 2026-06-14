export interface MeasuredBlock {
  id: string;
  height: number;
  split?: boolean;
}

export function paginateBlocks<T extends MeasuredBlock>(
  blocks: T[],
  pageHeight: number,
): Array<Array<T | (T & { split: true })>> {
  const pages: Array<Array<T | (T & { split: true })>> = [];
  let page: Array<T | (T & { split: true })> = [];
  let used = 0;

  for (const block of blocks) {
    if (block.height > pageHeight) {
      if (page.length) pages.push(page);
      pages.push([{ ...block, split: true }]);
      page = [];
      used = 0;
      continue;
    }

    if (page.length && used + block.height > pageHeight) {
      pages.push(page);
      page = [];
      used = 0;
    }

    page.push(block);
    used += block.height;
  }

  if (page.length) pages.push(page);
  return pages;
}
