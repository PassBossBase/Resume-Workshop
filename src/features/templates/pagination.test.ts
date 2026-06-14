import { describe, expect, it } from "vitest";
import { paginateBlocks } from "./pagination";

describe("paginateBlocks", () => {
  it("moves a regular block to the next page instead of splitting it", () => {
    expect(
      paginateBlocks(
        [
          { id: "a", height: 700 },
          { id: "b", height: 250 },
        ],
        900,
      ),
    ).toEqual([
      [{ id: "a", height: 700 }],
      [{ id: "b", height: 250 }],
    ]);
  });

  it("marks a block taller than one page as splittable", () => {
    expect(paginateBlocks([{ id: "long", height: 1200 }], 900)).toEqual([
      [{ id: "long", height: 1200, split: true }],
    ]);
  });
});
