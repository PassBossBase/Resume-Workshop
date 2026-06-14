import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "./rich-text-editor";

describe("RichTextEditor", () => {
  it("provides the required formatting commands", () => {
    render(
      <RichTextEditor
        label="专业技能内容"
        value="用户研究\n交互设计"
        onChange={vi.fn()}
      />,
    );

    [
      "撤销",
      "恢复",
      "加粗",
      "下划线",
      "无序列表",
      "有序列表",
      "首行缩进 2 字符",
      "插入超链接",
      "左对齐",
      "居中对齐",
      "右对齐",
      "两端对齐",
    ].forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
    expect(screen.getByLabelText("字体颜色")).toBeInTheDocument();
  });
});
