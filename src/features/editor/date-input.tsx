"use client";

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
        className="h-12 w-full rounded-2xl border-2 border-black/15 bg-white px-4 font-medium outline-none transition focus:border-black focus:shadow-[3px_3px_0_var(--yellow)]"
        placeholder="例如：2026 / 06"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
