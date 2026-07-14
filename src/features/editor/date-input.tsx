"use client";

/** 统一处理简历经历日期输入与清空操作。 */
export function DateInput({
  label,
  value,
  onChange,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  return (
    <label className="block">
      {!hideLabel && (
        <span className="mb-2 block text-sm font-bold">{label}</span>
      )}
      <input
        aria-label={label}
        className="editor-form-input h-12 w-full px-4 font-medium outline-none transition"
        placeholder="例如：2026 / 06"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
