import { clsx } from "clsx";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadixSelect from "@radix-ui/react-select";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { Check, ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  memo,
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type StickerCardVariant = "comic" | "scenic";

/** 支持漫画纸张与玻璃工作区两种语气的圆角卡片容器。 */
export const StickerCard = memo(function StickerCard({
  className,
  variant = "comic",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: StickerCardVariant }) {
  return (
    <div
      className={clsx(
        variant === "scenic"
          ? "rounded-[26px] border border-white/34 bg-[#063846]/62 shadow-[0_16px_42px_rgb(4_41_55/28%)] backdrop-blur-xl"
          : "rounded-[26px] border-2 border-(--line) bg-(--paper)",
        "transition-shadow",
        className,
      )}
      {...props}
    />
  );
});

export type InkButtonVariant =
  | "dark"
  | "paper"
  | "pink"
  | "yellow"
  | "blue"
  | "mint"
  | "purple"
  | "danger"
  | "ghost"
  | "glass";

type InkButtonSize = "sm" | "md" | "lg" | "icon";

type InkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: InkButtonVariant;
  size?: InkButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  iconOnly?: boolean;
  pressable?: boolean;
  hoverLabel?: ReactNode;
  hoverLabelClassName?: string;
  unstyled?: boolean;
};

/** 统一处理尺寸、配色、按压与加载状态的漫画风按钮。 */
export const InkButton = memo(
  forwardRef<HTMLButtonElement, InkButtonProps>(function InkButton(
    {
      children,
      className,
      disabled,
      hoverLabel,
      hoverLabelClassName,
      iconOnly = false,
      loading = false,
      loadingLabel = "处理中",
      pressable = false,
      size,
      unstyled = false,
      variant = "dark",
      ...props
    }: InkButtonProps,
    ref,
  ) {
    const resolvedSize = size ?? (iconOnly ? "icon" : "md");
    const ariaLabel =
      props["aria-label"] ?? (iconOnly && loading ? loadingLabel : undefined);
    const showHoverLabel = Boolean(hoverLabel) && !loading;
    const variants: Record<InkButtonVariant, string> = {
      dark: "border-2 border-(--line) bg-(--ink) text-white",
      paper: "border-2 border-(--line) bg-white text-(--ink)",
      pink: "border-2 border-(--line) bg-(--pink) text-white",
      blue: "border-2 border-(--line) bg-(--blue) text-white",
      yellow: "border-2 border-(--line) bg-(--yellow) text-(--ink)",
      mint: "border-2 border-(--line) bg-(--mint) text-(--ink)",
      purple: "border-2 border-(--line) bg-(--purple) text-white",
      danger: "border-2 border-(--line) bg-red-500 text-white",
      ghost:
        "border-0 bg-transparent text-(--ink) shadow-none active:shadow-none",
      glass:
        "border border-white/45 bg-white/16 text-white shadow-[0_10px_26px_rgb(4_42_61_/_22%)] backdrop-blur-xl hover:bg-white/24 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white active:scale-[0.98]",
    };
    const sizes: Record<InkButtonSize, string> = {
      sm: "min-h-9 rounded-xl px-3 text-sm",
      md: "min-h-11 rounded-2xl px-4",
      lg: "min-h-13 rounded-[20px] px-5 text-base",
      icon: "h-10 w-10 rounded-xl p-0",
    };

    return (
      <button
        {...props}
        ref={ref}
        aria-busy={loading || undefined}
        aria-label={ariaLabel}
        className={twMerge(
          clsx(
            !unstyled &&
              "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition",
            !unstyled && sizes[resolvedSize],
            !unstyled && variants[variant],
            showHoverLabel && "group/ink-button relative overflow-hidden",
            pressable &&
              "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
            className,
          ),
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
        ) : showHoverLabel ? (
          <>
            <span className="flex items-center justify-center transition-all duration-200 group-hover/ink-button:scale-75 group-hover/ink-button:opacity-0 group-focus-visible/ink-button:scale-75 group-focus-visible/ink-button:opacity-0">
              {children}
            </span>
            <span
              className={twMerge(
                clsx(
                  "absolute inset-0 flex scale-75 items-center justify-center text-xs font-black opacity-0 transition-all duration-200 group-hover/ink-button:scale-100 group-hover/ink-button:opacity-100 group-focus-visible/ink-button:scale-100 group-focus-visible/ink-button:opacity-100",
                  hoverLabelClassName,
                ),
              )}
            >
              {hoverLabel}
            </span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }),
);

/** 用于状态、分类和简短标识的彩色胶囊标签。 */
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

/** 应用品牌标识，可在紧凑导航中隐藏文字。 */
export function BrandMark({
  compact = false,
  prefix = "简历",
  suffix = "工坊",
}: {
  compact?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 font-black">
      <span className="relative grid h-10 w-10 rotate-[-5deg] place-items-center rounded-[14px] border-2 border-black bg-(--yellow) shadow-[3px_3px_0_black]">
        <span className="text-xl">R</span>
        <i className="absolute -right-2 -top-2 h-3 w-3 rounded-full border-2 border-black bg-(--pink)" />
      </span>
      {!compact && (
        <span className="whitespace-nowrap text-xl tracking-tight">
          {prefix}
          <span className="text-(--blue)">{suffix}</span>
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
  appearance = "comic",
  open,
  onClose,
  size = "sm",
  disabled,
  className,
  ariaLabelledby,
  children,
}: {
  appearance?: "comic" | "glass";
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
            appearance === "glass"
              ? "bg-[#022f44]/72 backdrop-blur-md"
              : config.backdrop,
          )}
        >
          <Dialog.Content
            aria-describedby={undefined}
            aria-labelledby={ariaLabelledby}
            className={clsx(
              "animate-pop relative w-full overflow-hidden rounded-[28px]",
              appearance === "glass"
                ? "glass-modal border border-white/32 bg-[#063c4d]/86 text-white shadow-[0_24px_70px_rgb(2_33_46_/_42%)] backdrop-blur-2xl"
                : "border-2 border-black bg-(--paper)",
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

/** 封装 Radix Select 的项目统一下拉选择器。 */
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
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border-2 border-black bg-white px-3 text-left font-bold transition hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--blue) disabled:cursor-not-allowed disabled:opacity-50",
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
          className="z-100 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-2xl border-2 border-black bg-white p-1"
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

/** 为图标或紧凑控件补充悬浮说明的轻量提示框。 */
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
    default: "border-black bg-(--paper)",
    beige: "border-black bg-white",
    white: "border-black bg-white",
  };

  return (
    <section
      className={clsx("rounded-3xl border-2", variants[variant], className)}
      {...props}
    >
      {children}
    </section>
  );
}
