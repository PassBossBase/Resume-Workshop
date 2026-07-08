export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const defaultLocale: AppLocale = "zh-CN";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function getLocaleLabel(locale: AppLocale): string {
  return locale === "zh-CN" ? "中文" : "English";
}

export function getOppositeLocale(locale: AppLocale): AppLocale {
  return locale === "zh-CN" ? "en-US" : "zh-CN";
}

