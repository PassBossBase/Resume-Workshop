import type { CSSProperties, ReactNode } from "react";
import type { BasicDisplayItem } from "@/features/resume-model/resume-model";

const URL_LIKE_PATTERN =
  /^(https?:\/\/|www\.|[a-z0-9-]+(\.[a-z0-9-]+)+)(\/[^\s]*)?$/i;

export function getBasicInfoHref(item: BasicDisplayItem): string | null {
  const value = item.value.trim();
  if (!value) return null;

  if (item.key === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `mailto:${value}`;
  }

  if (item.key === "phone") {
    const phone = value.replace(/[^\d+]/g, "");
    return phone ? `tel:${phone}` : null;
  }

  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (URL_LIKE_PATTERN.test(value)) return `https://${value.replace(/^www\./i, "www.")}`;

  return null;
}

/** 固定使用清晰的中文无衬线字体，避免打印 PDF 时字段名被合成为模糊位图。 */
export function BasicInfoLabel({
  item,
  className,
}: {
  item: BasicDisplayItem;
  className?: string;
}) {
  const style: CSSProperties = {
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    fontSynthesis: "none",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };

  return (
    <span className={className} data-basic-label="true" style={style}>
      {item.label}：
    </span>
  );
}

/** 将可识别的邮箱、电话和网址渲染为安全的基础信息链接。 */
export function BasicInfoValue({
  item,
  children,
  className,
}: {
  item: BasicDisplayItem;
  children?: ReactNode;
  className?: string;
}) {
  const href = getBasicInfoHref(item);
  const content = children ?? item.value;

  if (!href) return <span className={className}>{content}</span>;

  return (
    <a
      className={className}
      href={href}
      rel="noopener noreferrer"
      style={{ color: "inherit", textDecoration: "none" }}
      target="_blank"
    >
      {content}
    </a>
  );
}
