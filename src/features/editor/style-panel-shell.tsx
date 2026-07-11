import { memo, type ReactNode } from "react";
import { SectionCard } from "@/components/anime-ui/ui";

/** 样式面板内带标题和说明的分组容器。 */
export const Panel = memo(function Panel({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <SectionCard className="p-4">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
        {icon}
        {title}
        {action && <span className="ml-auto">{action}</span>}
      </h3>
      {children}
    </SectionCard>
  );
});

/** 样式面板中统一标签、提示和控件间距的字段包装器。 */
export const Control = memo(function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 flex justify-between text-sm font-bold">
        {label}
        <b>{value}</b>
      </span>
      <span className="block [&_input]:w-full [&_input]:accent-black">
        {children}
      </span>
    </label>
  );
});
