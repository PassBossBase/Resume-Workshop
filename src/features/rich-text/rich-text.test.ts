import { describe, expect, it } from "vitest";
import {
  normalizeRichText,
  richTextToPlainText,
  sanitizeRichText,
} from "./rich-text";

describe("rich text helpers", () => {
  it("converts legacy newline text into paragraph HTML", () => {
    expect(normalizeRichText("第一条\n第二条")).toBe(
      "<p>第一条</p><p>第二条</p>",
    );
  });

  it("preserves supported formatting and removes unsafe markup", () => {
    expect(
      sanitizeRichText(
        '<p style="text-align:center;color:#ff0000"><strong>重点</strong><script>alert(1)</script></p>',
      ),
    ).toBe(
      '<p style="text-align: center; color: #ff0000"><strong>重点</strong>alert(1)</p>',
    );
  });

  it("extracts readable text for pagination estimates", () => {
    expect(
      richTextToPlainText("<ul><li>用户研究</li><li>交互设计</li></ul>"),
    ).toBe("用户研究\n交互设计");
  });
});
