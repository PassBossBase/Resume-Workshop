import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateInput } from "./date-input";

describe("DateInput", () => {
  it("supports typed input, month selection and an ongoing shortcut", () => {
    const onChange = vi.fn();
    render(
      <DateInput
        allowOngoing
        label="结束时间"
        value="2026 / 06"
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("结束时间"), {
      target: { value: "2027 / 08" },
    });
    expect(onChange).toHaveBeenCalledWith("2027 / 08");

    fireEvent.change(screen.getByLabelText("选择结束时间"), {
      target: { value: "2028-09" },
    });
    expect(onChange).toHaveBeenCalledWith("2028 / 09");

    fireEvent.click(screen.getByRole("button", { name: "设为至今" }));
    expect(onChange).toHaveBeenCalledWith("至今");
  });
});
