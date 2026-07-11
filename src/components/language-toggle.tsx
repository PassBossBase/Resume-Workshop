"use client";

import { clsx } from "clsx";
import { Languages } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { getLocaleLabel } from "@/lib/locale";
import { useLocale } from "@/lib/i18n";
import { InkButton, InkButtonVariant } from "./anime-ui/ui";

/** 切换应用界面语言，并支持紧凑图标模式。 */
export function LanguageToggle({
  className,
  compact = false,
  pressable = false,
  variant = "blue",
}: {
  variant?: InkButtonVariant;
  className?: string;
  compact?: boolean;
  pressable?: boolean;
}) {
  const { locale, toggleLocale, t } = useLocale();
  const localeLabel = getLocaleLabel(locale);

  return (
    <InkButton
      variant={variant}
      aria-label={t.app.languageToggle}
      className={twMerge(clsx(className))}
      hoverLabel={compact ? localeLabel : undefined}
      iconOnly={compact}
      onClick={toggleLocale}
      title={t.app.languageToggle}
      pressable={pressable}
      size={compact ? "icon" : undefined}
    >
      <Languages aria-hidden="true" size={17} strokeWidth={2.7} />
      {!compact && <span>{localeLabel}</span>}
    </InkButton>
  );
}
