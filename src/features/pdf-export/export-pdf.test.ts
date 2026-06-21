import { describe, expect, it } from "vitest";
import { calculatePdfSlices } from "./export-pdf";

describe("calculatePdfSlices", () => {
  it("moves a page break before a text line that would be cut by the PDF page gap", () => {
    const slices = calculatePdfSlices(2400, 1123, [
      { top: 1118, bottom: 1140 },
    ]);

    expect(slices[0]).toEqual({ y: 0, height: 1114 });
    expect(slices[1].y).toBe(1114);
  });

  it("keeps the normal A4 break when no protected content crosses it", () => {
    expect(calculatePdfSlices(1800, 1123, [{ top: 900, bottom: 1000 }])[0]).toEqual({
      y: 0,
      height: 1123,
    });
  });

  it("does not move a page break to the start of a large module", () => {
    const slices = calculatePdfSlices(2400, 1123, [
      { top: 150, bottom: 172 },
      { top: 1117, bottom: 1139 },
    ]);

    expect(slices[0].height).toBe(1113);
    expect(1123 - slices[0].height).toBeLessThanOrEqual(12);
  });

  it("does not create an unusably short page when the safe point is too close", () => {
    expect(calculatePdfSlices(1800, 1123, [{ top: 120, bottom: 1200 }])[0]).toEqual({
      y: 0,
      height: 1123,
    });
  });
});
