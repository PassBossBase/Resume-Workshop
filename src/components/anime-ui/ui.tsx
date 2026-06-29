import { clsx } from "clsx";
import {
  memo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export const StickerCard = memo(function StickerCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[26px] border-2 border-(--line) bg-(--paper) transition-shadow hover:shadow-[5px_5px_0_var(--line)]",
        className,
      )}
      {...props}
    />
  );
});

export const InkButton = memo(function InkButton({
  className,
  variant = "dark",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "paper" | "pink" | "yellow" | "blue";
}) {
  const variants = {
    dark: "bg-(--ink) text-white",
    paper: "bg-white text-(--ink)",
    pink: "bg-(--pink) text-white",
    blue: "bg-(--blue) text-white",
    yellow: "bg-(--yellow) text-(--ink)",
  };
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-(--line) px-4 font-bold shadow-[3px_3px_0_var(--line)] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

export function ColorTag({
  children,
  color = "yellow",
}: {
  children: ReactNode;
  color?: "yellow" | "pink" | "blue" | "mint" | "purple";
}) {
  const colors = {
    yellow: "bg-(--yellow)",
    pink: "bg-(--pink) text-white",
    blue: "bg-(--blue) text-white",
    mint: "bg-(--mint)",
    purple: "bg-(--purple) text-white",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border-2 border-(--line) px-3 py-1 text-xs font-black",
        colors[color],
      )}
    >
      {children}
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3 font-black">
      <span className="relative grid h-10 w-10 rotate-[-5deg] place-items-center rounded-[14px] border-2 border-black bg-(--yellow) shadow-[3px_3px_0_black]">
        <span className="text-xl">R</span>
        <i className="absolute -right-2 -top-2 h-3 w-3 rounded-full border-2 border-black bg-(--pink)" />
      </span>
      {!compact && (
        <span className="whitespace-nowrap text-xl tracking-tight">
          简历<span className="text-(--blue)">工坊</span>
        </span>
      )}
    </div>
  );
}

/** 页面外层容器，统一三个页面的最大宽度与间距 */
export function PageContainer({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "mx-auto max-w-375 px-5 py-8 md:px-10 lg:py-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** 页面标题区：彩色 badge + 大标题 + 副标题 */
export function PageHeading({
  badge,
  badgeColor = "bg-(--yellow)",
  badgeTextColor,
  badgeRotation = "-rotate-1",
  title,
  subtitle,
}: {
  badge: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeRotation?: string;
  title: string | React.ReactNode;
  subtitle: string;
}) {
  return (
    <>
      <span
        className={clsx(
          "inline-block rounded-full border-2 border-black px-4 py-1 text-sm font-black",
          badgeRotation,
          badgeColor,
          badgeTextColor,
        )}
      >
        {badge}
      </span>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-base font-medium text-black/60">
        {subtitle}
      </p>
    </>
  );
}

/** 通用模态框：遮罩层 + 弹窗卡片，支持点击遮罩关闭和 aria 属性 */
export function Modal({
  open,
  onClose,
  size = "sm",
  disabled,
  className,
  ariaLabelledby,
  children,
}: {
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  ariaLabelledby?: string;
  children: ReactNode;
}) {
  if (!open) return null;

  const sizeConfig = {
    sm: { maxWidth: "max-w-lg", backdrop: "bg-black/70" },
    md: { maxWidth: "max-w-4xl", backdrop: "bg-black/75" },
    lg: { maxWidth: "max-w-5xl", backdrop: "bg-black/75" },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={clsx(
        "fixed inset-0 z-100 grid place-items-center p-4",
        config.backdrop,
      )}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !disabled) onClose();
      }}
    >
      <section
        aria-labelledby={ariaLabelledby}
        aria-modal="true"
        role="dialog"
        className={clsx(
          "animate-pop relative w-full overflow-hidden rounded-[28px] border-2 border-black bg-(--paper) shadow-[8px_8px_0_black]",
          config.maxWidth,
          className,
        )}
      >
        {children}
      </section>
    </div>
  );
}

/** 圆角卡片区域，三种变体：default / beige / white */
export function SectionCard({
  children,
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "beige" | "white";
}) {
  const variants = {
    default: "border-black bg-(--paper) shadow-[4px_4px_0_#d9d1c3]",
    beige: "border-black bg-white shadow-[4px_4px_0_#dcd5c7]",
    white: "border-black bg-white shadow-[4px_4px_0_black]",
  };

  return (
    <section
      className={clsx("rounded-[24px] border-2", variants[variant], className)}
      {...props}
    >
      {children}
    </section>
  );
}
