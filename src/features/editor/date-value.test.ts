import { describe, expect, it } from "vitest";
import { formatMonthValue, parseMonthValue } from "./date-value";

describe("date value helpers", () => {
  it("formats a month picker value for the resume", () => {
    expect(formatMonthValue("2026-06")).toBe("2026 / 06");
  });

  it("parses supported typed values back into a month picker value", () => {
    expect(parseMonthValue("2026 / 06")).toBe("2026-06");
    expect(parseMonthValue("2026-6")).toBe("2026-06");
    expect(parseMonthValue("至今")).toBe("");
  });
});
