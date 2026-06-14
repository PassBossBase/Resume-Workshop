export function formatMonthValue(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? `${match[1]} / ${match[2]}` : value;
}

export function parseMonthValue(value: string): string {
  const match = /^(\d{4})\s*[-/.年]\s*(\d{1,2})/.exec(value.trim());
  if (!match) return "";
  return `${match[1]}-${match[2].padStart(2, "0")}`;
}
