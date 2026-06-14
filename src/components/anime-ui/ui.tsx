import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function StickerCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[26px] border-2 border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow)]",
        className,
      )}
      {...props}
    />
  );
}

export function InkButton({
  className,
  variant = "dark",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "paper" | "pink" | "yellow";
}) {
  const variants = {
    dark: "bg-[var(--ink)] text-white",
    paper: "bg-white text-[var(--ink)]",
    pink: "bg-[var(--pink)] text-white",
    yellow: "bg-[var(--yellow)] text-[var(--ink)]",
  };
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-[var(--line)] px-4 font-bold shadow-[3px_3px_0_var(--line)] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ColorTag({
  children,
  color = "yellow",
}: {
  children: ReactNode;
  color?: "yellow" | "pink" | "blue" | "mint" | "purple";
}) {
  const colors = {
    yellow: "bg-[var(--yellow)]",
    pink: "bg-[var(--pink)] text-white",
    blue: "bg-[var(--blue)] text-white",
    mint: "bg-[var(--mint)]",
    purple: "bg-[var(--purple)] text-white",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border-2 border-[var(--line)] px-3 py-1 text-xs font-black",
        colors[color],
      )}
    >
      {children}
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 font-black">
      <span className="relative grid h-10 w-10 rotate-[-5deg] place-items-center rounded-[14px] border-2 border-black bg-[var(--yellow)] shadow-[3px_3px_0_black]">
        <span className="text-xl">R</span>
        <i className="absolute -right-2 -top-2 h-3 w-3 rounded-full border-2 border-black bg-[var(--pink)]" />
      </span>
      {!compact && (
        <span className="text-xl tracking-tight">
          简历<span className="text-[var(--blue)]">工坊</span>
        </span>
      )}
    </div>
  );
}
