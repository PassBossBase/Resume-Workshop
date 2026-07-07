import { clsx } from "clsx";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadixSelect from "@radix-ui/react-select";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { Check, ChevronDown } from "lucide-react";
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

type InkButtonVariant =
  | "dark"
  | "paper"
  | "pink"
  | "yellow"
  | "blue"
  | "mint"
  | "purple"
  | "danger"
  | "ghost";

type InkButtonSize = "sm" | "md" | "lg" | "icon";

type InkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: InkButtonVariant;
  size?: InkButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  iconOnly?: boolean;
};

export const InkButton = memo(function InkButton({
  children,
  className,
  disabled,
  iconOnly = false,
  loading = false,
  loadingLabel = "处理中",
  size,
  variant = "dark",
  ...props
}: InkButtonProps) {
  const resolvedSize = size ?? (iconOnly ? "icon" : "md");
  const ariaLabel =
    props["aria-label"] ?? (iconOnly && loading ? loadingLabel : undefined);
  const variants: Record<InkButtonVariant, string> = {
    dark: "bg-(--ink) text-white",
    paper: "bg-white text-(--ink)",
    pink: "bg-(--pink) text-white",
    blue: "bg-(--blue) text-white",
    yellow: "bg-(--yellow) text-(--ink)",
    mint: "bg-(--mint) text-(--ink)",
    purple: "bg-(--purple) text-white",
    danger: "bg-red-500 text-white",
    ghost:
      "bg-transparent text-(--ink) shadow-none hover:bg-white active:shadow-none",
  };
  const sizes: Record<InkButtonSize, string> = {
    sm: "min-h-9 rounded-xl px-3 text-sm shadow-[2px_2px_0_var(--line)]",
    md: "min-h-11 rounded-2xl px-4 shadow-[3px_3px_0_var(--line)]",
    lg: "min-h-13 rounded-[20px] px-5 text-base shadow-[4px_4px_0_var(--line)]",
    icon: "h-10 w-10 rounded-xl p-0 shadow-[3px_3px_0_var(--line)]",
  };

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      className={clsx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-(--line) font-bold transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        sizes[resolvedSize],
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {iconOnly && loading ? (
        <span className="sr-only">{loadingLabel}</span>
      ) : (
        children
      )}
    </button>
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
  const sizeConfig = {
    sm: { maxWidth: "max-w-lg", backdrop: "bg-black/70" },
    md: { maxWidth: "max-w-4xl", backdrop: "bg-black/75" },
    lg: { maxWidth: "max-w-5xl", backdrop: "bg-black/75" },
  };

  const config = sizeConfig[size];

  return (
    <Dialog.Root
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !disabled) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(
            "fixed inset-0 z-100 grid place-items-center p-4",
            config.backdrop,
          )}
        >
          <Dialog.Content
            aria-describedby={undefined}
            aria-labelledby={ariaLabelledby}
            className={clsx(
              "animate-pop relative w-full overflow-hidden rounded-[28px] border-2 border-black bg-(--paper) shadow-[8px_8px_0_black]",
              config.maxWidth,
              className,
            )}
            onEscapeKeyDown={(event) => {
              if (disabled) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              if (disabled) event.preventDefault();
            }}
          >
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export function InkSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder = "请选择",
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadixSelect.Root
      disabled={disabled}
      onValueChange={onValueChange}
      value={value}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={clsx(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border-2 border-black bg-white px-3 text-left font-bold shadow-[2px_2px_0_#d9d1c3] transition hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--blue) disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown aria-hidden="true" size={16} strokeWidth={2.6} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-100 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-2xl border-2 border-black bg-white p-1 shadow-[5px_5px_0_black]"
          collisionPadding={8}
          position="popper"
          sideOffset={6}
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                className="relative flex min-h-10 cursor-pointer select-none items-center rounded-xl py-2 pl-9 pr-3 text-sm font-bold outline-none transition data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-(--yellow)"
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                <RadixSelect.ItemIndicator className="absolute left-3 grid place-items-center">
                  <Check aria-hidden="true" size={15} strokeWidth={2.8} />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export function InkTooltip({
  content,
  children,
  side = "top",
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <RadixTooltip.Provider delayDuration={250} skipDelayDuration={100}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="z-100 rounded-xl border-2 border-black bg-(--ink) px-2.5 py-1.5 text-xs font-black text-white shadow-[3px_3px_0_black]"
            side={side}
            sideOffset={8}
          >
            {content}
            <RadixTooltip.Arrow className="fill-(--ink)" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
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
