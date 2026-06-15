import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateInput } from "./date-input";

describe("DateInput", () => {
  it("renders label and supports typed input", () => {
    const onChange = vi.fn();
    render(
      <DateInput
        label="结束时间"
        value="2026 / 06"
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("结束时间"), {
      target: { value: "2027 / 08" },
    });
    expect(onChange).toHaveBeenCalledWith("2027 / 08");
  });

  it("hides label when hideLabel is true", () => {
    render(
      <DateInput
        hideLabel
        label="出生日期"
        value=""
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("出生日期")).toBeDefined();
    expect(screen.queryByText("出生日期")).toBeNull();
  });
});
