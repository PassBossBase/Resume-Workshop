"use client";

import { CalendarDays } from "lucide-react";
import { formatMonthValue, parseMonthValue } from "./date-value";

export function DateInput({
  label,
  value,
  onChange,
  allowOngoing = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowOngoing?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <span className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          aria-label={label}
          className="h-12 min-w-0 rounded-2xl border-2 border-black/15 px-4 outline-none focus:border-black"
          placeholder="例如：2026 / 06"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border-2 border-black bg-[var(--yellow)]">
          <CalendarDays size={19} />
          <input
            aria-label={`选择${label}`}
            className="absolute inset-0 cursor-pointer opacity-0"
            type="month"
            value={parseMonthValue(value)}
            onChange={(event) => onChange(formatMonthValue(event.target.value))}
          />
        </span>
      </span>
      {allowOngoing && (
        <button
          className="mt-2 rounded-full border border-black/20 bg-[#f4f1e8] px-3 py-1 text-xs font-bold hover:border-black"
          type="button"
          onClick={() => onChange("至今")}
        >
          设为至今
        </button>
      )}
    </label>
  );
}
