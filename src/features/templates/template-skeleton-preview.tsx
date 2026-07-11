import type { ReactNode } from "react";
import type { TemplateId } from "@/features/resume-model/resume-model";

type SkeletonVariant =
  | "blank"
  | "classic"
  | "header"
  | "sidebar"
  | "timeline"
  | "line"
  | "banner";

interface SkeletonConfig {
  accent: string;
  muted: string;
  title: string;
  variant: SkeletonVariant;
}

const skeletonConfig: Record<TemplateId, SkeletonConfig> = {
  blank: {
    accent: "#1f2937",
    muted: "#d6d9df",
    title: "基础模板骨架预览",
    variant: "blank",
  },
  classic: {
    accent: "#3157d5",
    muted: "#dfe5f4",
    title: "经典单栏模板骨架预览",
    variant: "classic",
  },
  single_column_header_full_width: {
    accent: "#2b6cb0",
    muted: "#d7e8f8",
    title: "顶部全宽蓝色头部模板骨架预览",
    variant: "header",
  },
  two_column_sidebar_left: {
    accent: "#23395d",
    muted: "#dfe6ef",
    title: "左侧侧边栏模板骨架预览",
    variant: "sidebar",
  },
  single_column_timeline_block: {
    accent: "#4a90e2",
    muted: "#e3ecf6",
    title: "时间轴色块模板骨架预览",
    variant: "timeline",
  },
  single_column_line_separate: {
    accent: "#334155",
    muted: "#e3e7eb",
    title: "分割线模板骨架预览",
    variant: "line",
  },
  single_column_section_banner: {
    accent: "#394084",
    muted: "#e3e7eb",
    title: "自定义标题背景模板骨架预览",
    variant: "banner",
  },
};

/** 模板骨架预览中复用的占位文本行组。 */
function Lines({
  count = 3,
  x,
  y,
  width,
  gap = 26,
  color,
}: {
  count?: number;
  x: number;
  y: number;
  width: number;
  gap?: number;
  color: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <rect
          fill={color}
          height="10"
          key={`${x}-${y}-${index}`}
          rx="5"
          width={width - index * 34}
          x={x}
          y={y + index * gap}
        />
      ))}
    </>
  );
}

/** 经典单栏模板的轻量骨架缩略图。 */
function ClassicSkeleton({ accent, muted }: SkeletonConfig) {
  // 经典单栏模板特征：顶部 accent 横条 + 头像+accent竖条+姓名 + icon 基本信息行 + 模块标题 accent 竖条 + 条目标题/副标题/日期/描述
  return (
    <>
      {/* 顶部 accent 横条（对应 absolute h-2 w-full） */}
      <rect fill={accent} height="3" rx="1.5" width="682" x="56" y="56" />

      {/* 头像占位（88x112px 比例缩放，左侧） */}
      <rect
        fill={muted}
        height="88"
        opacity="0.5"
        rx="4"
        width="66"
        x="88"
        y="88"
      />

      {/* 姓名左侧 accent 竖条（对应 h-14 w-1.5 rounded-full） */}
      <rect fill={accent} height="48" rx="3" width="6" x="172" y="94" />
      {/* 姓名标题 */}
      <rect fill={accent} height="28" rx="14" width="160" x="194" y="96" />

      {/* 基本信息：icon 圆圈 + label:value 文字条，两行 flex-wrap */}
      {/* 第一行 3 组 */}
      <circle cx="94" cy="206" fill={muted} r="5" />
      <rect fill={muted} height="9" rx="4.5" width="120" x="106" y="201" />
      <circle cx="266" cy="206" fill={muted} r="5" />
      <rect fill={muted} height="9" rx="4.5" width="110" x="278" y="201" />
      <circle cx="430" cy="206" fill={muted} r="5" />
      <rect fill={muted} height="9" rx="4.5" width="100" x="442" y="201" />
      {/* 第二行 2 组 */}
      <circle cx="94" cy="230" fill={muted} r="5" />
      <rect fill={muted} height="9" rx="4.5" width="130" x="106" y="225" />
      <circle cx="266" cy="230" fill={muted} r="5" />
      <rect fill={muted} height="9" rx="4.5" width="90" x="278" y="225" />

      {/* 头部分隔线（对应 border-b pb-7） */}
      <rect
        fill={accent}
        height="1.5"
        opacity="0.18"
        width="618"
        x="88"
        y="262"
      />

      {/* 4 个模块区域 */}
      {[302, 472, 642, 812].map((y) => (
        <g key={y}>
          {/* 模块标题：accent 竖条（对应 h-5 w-1.5 rounded-full）+ 标题文字 */}
          <rect fill={accent} height="18" rx="3" width="6" x="88" y={y} />
          <rect
            fill={accent}
            height="13"
            rx="6.5"
            width="100"
            x="106"
            y={y + 3}
          />
          {/* 模块底部分隔线 */}
          <rect
            fill={accent}
            height="1.5"
            opacity="0.18"
            width="618"
            x="88"
            y={y + 30}
          />

          {/* 模块内 2 个条目 */}
          {[0, 1].map((ei) => {
            const ey = y + 48 + ei * 66;
            return (
              <g key={`entry-${ei}`}>
                {/* 条目标题（font-black，深色） */}
                <rect
                  fill="#182235"
                  height="10"
                  rx="5"
                  width="120"
                  x="88"
                  y={ey}
                />
                {/* 条目副标题（semibold, 0.857em） */}
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="80"
                  x="224"
                  y={ey + 1}
                />
                {/* 日期 pill（右对齐） */}
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="64"
                  x="588"
                  y={ey + 1}
                />
                {/* 描述行 */}
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="468"
                  x="88"
                  y={ey + 20}
                />
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="430"
                  x="88"
                  y={ey + 34}
                />
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}

/** 基础模板的轻量骨架缩略图。 */
function BlankSkeleton({ accent, muted }: SkeletonConfig) {
  // 基础模板特征：居中圆形头像 + 姓名 + 角色 + icon 联系方式行 + 分割线分隔模块
  return (
    <>
      {/* 圆形头像（居中，对应 96x96 rounded-full） */}
      <circle cx="397" cy="78" fill={muted} opacity="0.5" r="36" />
      {/* 姓名（居中） */}
      <rect fill={accent} height="28" rx="14" width="176" x="309" y="128" />
      {/* 职位/角色（居中） */}
      <rect fill={muted} height="10" rx="5" width="130" x="332" y="168" />
      {/* 联系方式行（居中 flex-wrap，icon 圆圈 + value 文字条） */}
      <circle cx="216" cy="200" fill={muted} r="4" />
      <rect fill={muted} height="8" rx="4" width="80" x="226" y="196" />
      <circle cx="338" cy="200" fill={muted} r="4" />
      <rect fill={muted} height="8" rx="4" width="75" x="348" y="196" />
      <circle cx="458" cy="200" fill={muted} r="4" />
      <rect fill={muted} height="8" rx="4" width="70" x="468" y="196" />
      <circle cx="572" cy="200" fill={muted} r="4" />
      <rect fill={muted} height="8" rx="4" width="65" x="582" y="196" />
      {/* 头部分割线 */}
      <rect fill={muted} height="2" width="616" x="89" y="226" />
      {/* 5 个模块区域 */}
      {[294, 420, 546, 672, 798].map((y) => (
        <g key={y}>
          {/* 分割线 + accent 竖条 + 标题文字 */}
          <rect fill={muted} height="1.5" width="616" x="89" y={y} />
          <rect fill={accent} height="14" rx="2" width="5" x="90" y={y + 10} />
          <rect
            fill={accent}
            height="11"
            rx="5.5"
            width="96"
            x="106"
            y={y + 12}
          />
          {/* 条目：标题 + 日期（右对齐）+ 副标题 + 描述行 */}
          <rect
            fill="#171717"
            height="10"
            rx="5"
            width="110"
            x="90"
            y={y + 36}
          />
          <rect fill={muted} height="8" rx="4" width="55" x="590" y={y + 37} />
          <rect fill={muted} height="8" rx="4" width="80" x="90" y={y + 52} />
          <rect fill={muted} height="8" rx="4" width="450" x="90" y={y + 68} />
          <rect fill={muted} height="8" rx="4" width="410" x="90" y={y + 82} />
        </g>
      ))}
    </>
  );
}

/** 蓝色头部单栏模板的轻量骨架缩略图。 */
function HeaderSkeleton({ accent, muted }: SkeletonConfig) {
  // 蓝色全宽头部特征：全宽色块 + 右上角头像 + 2 列信息网格 + icon 标题模块
  return (
    <>
      {/* 全宽蓝色头部 */}
      <rect fill={accent} height="200" width="794" x="0" y="0" />
      {/* 头像（右上角绝对定位，对应 88x112px） */}
      <rect
        fill="#ffffff"
        height="70"
        opacity="0.5"
        rx="4"
        width="55"
        x="660"
        y="36"
      />
      {/* 姓名 */}
      <rect
        fill="#ffffff"
        height="30"
        opacity="0.92"
        rx="15"
        width="180"
        x="78"
        y="52"
      />
      {/* 信息行 grid 2 列（label：value 格式） */}
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.72"
        rx="5.5"
        width="180"
        x="78"
        y="114"
      />
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.54"
        rx="5.5"
        width="160"
        x="340"
        y="114"
      />
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.72"
        rx="5.5"
        width="170"
        x="78"
        y="138"
      />
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.54"
        rx="5.5"
        width="150"
        x="340"
        y="138"
      />
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.48"
        rx="5.5"
        width="140"
        x="78"
        y="162"
      />
      {/* 4 个模块区域（含 icon 圆圈 + 标题 + 底边线 + 条目内容） */}
      {[266, 428, 590, 752].map((y) => (
        <g key={y}>
          {/* 模块标题：icon 圆圈 + 标题文字 + 底边线 */}
          <circle cx="94" cy={y + 7} fill={accent} opacity="0.6" r="7" />
          <rect fill={accent} height="12" rx="6" width="96" x="110" y={y + 2} />
          <rect
            fill={accent}
            height="1.5"
            opacity="0.28"
            width="618"
            x="88"
            y={y + 24}
          />
          {/* 条目：标题 + 副标题 + 日期 + 描述 */}
          <rect
            fill="#2d3748"
            height="10"
            rx="5"
            width="120"
            x="88"
            y={y + 40}
          />
          <rect fill={muted} height="8" rx="4" width="70" x="224" y={y + 41} />
          <rect fill={muted} height="8" rx="4" width="55" x="588" y={y + 41} />
          <rect fill={muted} height="8" rx="4" width="460" x="88" y={y + 58} />
          <rect fill={muted} height="8" rx="4" width="420" x="88" y={y + 72} />
        </g>
      ))}
    </>
  );
}

/** 深色侧边栏双栏模板的轻量骨架缩略图。 */
function SidebarSkeleton({ accent, muted }: SkeletonConfig) {
  // 深色侧边栏双栏特征：左侧深色栏含头像+信息+edu 模块；右侧主体含姓名头部+各模块
  return (
    <>
      {/* 左侧深色侧边栏 */}
      <rect fill={accent} height="1123" width="250" x="0" y="0" />
      {/* 圆形头像（居中，对应 80x80 rounded-full） */}
      <circle cx="125" cy="88" fill="#ffffff" opacity="0.88" r="34" />
      {/* 个人信息标题 */}
      <rect
        fill="#ffffff"
        height="12"
        opacity="0.85"
        rx="6"
        width="72"
        x="88"
        y="148"
      />
      {/* 信息行（label: value 格式） */}
      <Lines color="#ffffff" count={4} gap={28} width={150} x={72} y={178} />
      {/* 侧边栏教育模块标题 */}
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.75"
        rx="5.5"
        width="56"
        x="88"
        y="320"
      />
      <rect
        fill="#ffffff"
        height="1"
        opacity="0.3"
        width={146}
        x="88"
        y="342"
      />
      <Lines color="#ffffff" count={3} gap={24} width={138} x={72} y={358} />
      {/* 侧边栏第二教育模块 */}
      <rect
        fill="#ffffff"
        height="11"
        opacity="0.75"
        rx="5.5"
        width="56"
        x="88"
        y="480"
      />
      <rect
        fill="#ffffff"
        height="1"
        opacity="0.3"
        width={146}
        x="88"
        y="502"
      />
      <Lines color="#ffffff" count={2} gap={24} width={138} x={72} y={518} />

      {/* 右侧主内容区 */}
      {/* 姓名 + 底边线（对应 header border-b） */}
      <rect fill={accent} height="28" rx="14" width="160" x="306" y="62" />
      <rect
        fill={accent}
        height="1.5"
        opacity="0.25"
        width="420"
        x="306"
        y="112"
      />
      {/* 4 个模块区域（含 accent 竖条 + 标题 + 底边线 + 条目内容） */}
      {[148, 326, 504, 682].map((y) => (
        <g key={y}>
          {/* 模块标题：accent 竖条 + 标题文字 + 底边线 */}
          <rect fill={accent} height="14" rx="2" width="5" x="306" y={y} />
          <rect fill={accent} height="12" rx="6" width="96" x="322" y={y + 1} />
          <rect
            fill={accent}
            height="1.5"
            opacity="0.25"
            width="420"
            x="306"
            y={y + 22}
          />
          {/* 条目：标题 + 副标题 + 日期 + 描述 */}
          <rect
            fill={accent}
            height="10"
            opacity="0.85"
            rx="5"
            width="120"
            x="306"
            y={y + 38}
          />
          <rect fill={muted} height="8" rx="4" width="70" x="440" y={y + 39} />
          <rect fill={muted} height="8" rx="4" width="55" x="588" y={y + 39} />
          <rect fill={muted} height="8" rx="4" width="380" x="306" y={y + 56} />
          <rect fill={muted} height="8" rx="4" width="340" x="306" y={y + 70} />
        </g>
      ))}
    </>
  );
}

/** 时间轴色块模板的轻量骨架缩略图。 */
function TimelineSkeleton({ accent, muted }: SkeletonConfig) {
  const blockColors = ["#4a90e2", "#60b8a8", "#d87890", "#90c978"];
  const timelineLineColor = accent;
  const timelineLineOpacity = "0.38";
  // 左侧栏内容区 x 起点
  const leftX = 88;
  // 右侧时间轴 x 起点
  const rightX = 358;
  const rightWidth = 348;
  // 时间轴竖线 x 位置（对应实际模板 left:10px）
  const timelineX = rightX + 11;
  // 条目卡片 x 起点
  const cardX = rightX + 32;

  return (
    <>
      {/* ====== 头部 ====== */}
      {/* 姓名标题条 */}
      <rect fill={accent} height="28" rx="14" width="200" x={leftX} y="80" />
      {/* 头像占位 */}
      <rect
        fill={muted}
        height="88"
        opacity="0.45"
        rx="6"
        width="66"
        x="634"
        y="72"
      />
      {/* 副标题线 */}
      <Lines color={muted} count={1} width={260} x={leftX} y={128} />
      <Lines color={muted} count={1} width={170} x={leftX} y={148} />

      {/* ====== 左侧栏：个人信息 ====== */}
      <rect fill={accent} height="13" rx="6.5" width="80" x={leftX} y="190" />
      <Lines color={muted} count={3} gap={18} width={220} x={leftX} y={218} />

      {/* ====== 左侧栏：模块一（技能） ====== */}
      <rect fill={accent} height="12" rx="6" width="72" x={leftX} y="300" />
      <rect
        fill={accent}
        height="1.5"
        opacity="0.35"
        width={146}
        x={leftX}
        y="324"
      />
      <Lines color={muted} count={3} gap={20} width={210} x={leftX} y={342} />

      {/* ====== 左侧栏：模块二（教育） ====== */}
      <rect fill={accent} height="12" rx="6" width="72" x={leftX} y="470" />
      <rect
        fill={accent}
        height="1.5"
        opacity="0.35"
        width={146}
        x={leftX}
        y="494"
      />
      <Lines color={muted} count={4} gap={18} width={200} x={leftX} y={512} />

      {/* ====== 左侧栏：模块三（证书） ====== */}
      <rect fill={accent} height="12" rx="6" width="72" x={leftX} y="650" />
      <rect
        fill={accent}
        height="1.5"
        opacity="0.35"
        width={146}
        x={leftX}
        y="674"
      />
      <Lines color={muted} count={3} gap={20} width={210} x={leftX} y={692} />

      {/* ====== 右侧时间轴：模块标题（工作经历） ====== */}
      <rect fill={accent} height="14" rx="7" width="90" x={rightX} y="190" />
      <rect
        fill={accent}
        height="2"
        opacity="0.42"
        width={rightWidth}
        x={rightX}
        y="218"
      />

      {/* ====== 时间轴竖线 ====== */}
      <line
        stroke={timelineLineColor}
        strokeOpacity={timelineLineOpacity}
        strokeWidth="2"
        x1={timelineX}
        x2={timelineX}
        y1="250"
        y2="840"
      />

      {/* ====== 4 个时间轴条目 ====== */}
      {[260, 410, 560, 710].map((y, index) => {
        const cardColor = blockColors[index % blockColors.length];
        return (
          <g key={y}>
            {/* 空心圆点（14px 直径，白底 + accent 边框） */}
            <circle
              cx={timelineX}
              cy={y + 8}
              fill="#ffffff"
              r="7"
              stroke={timelineLineColor}
              strokeOpacity={timelineLineOpacity}
              strokeWidth="2"
            />
            {/* 日期条 */}
            <rect
              fill={muted}
              height="8"
              rx="4"
              width="60"
              x={cardX}
              y={y + 4}
            />
            {/* 色块卡片 */}
            <rect
              fill={cardColor}
              height="66"
              rx="8"
              width="290"
              x={cardX}
              y={y + 26}
            />
            {/* 卡片内标题 */}
            <rect
              fill="#ffffff"
              height="10"
              opacity="0.92"
              rx="5"
              width="150"
              x={cardX + 18}
              y={y + 38}
            />
            {/* 卡片内副标题 */}
            <rect
              fill="#ffffff"
              height="6"
              opacity="0.55"
              rx="3"
              width="210"
              x={cardX + 18}
              y={y + 54}
            />
            {/* 卡片内描述行 */}
            <rect
              fill="#ffffff"
              height="6"
              opacity="0.55"
              rx="3"
              width="250"
              x={cardX + 18}
              y={y + 66}
            />
            <rect
              fill="#ffffff"
              height="6"
              opacity="0.55"
              rx="3"
              width="218"
              x={cardX + 18}
              y={y + 76}
            />
          </g>
        );
      })}
    </>
  );
}

/** 复古分割线模板的轻量骨架缩略图。 */
function LineSkeleton({ accent, muted }: SkeletonConfig) {
  // 复古分割线特征：姓名左对齐 + 右上方双圆形 icon + 分割线 + 2 列信息网格 + 头像 + 分段线模块
  return (
    <>
      {/* 顶部：姓名左对齐 + 两个圆形 icon 按钮右对齐 + 分割线 */}
      <rect fill={accent} height="30" rx="15" width="178" x="88" y="72" />
      <circle
        cx="616"
        cy="80"
        fill="none"
        r="18"
        stroke={accent}
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      <circle
        cx="666"
        cy="80"
        fill="none"
        r="18"
        stroke={accent}
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      <rect fill={accent} height="3" width="618" x="88" y="126" />
      {/* 信息网格（2 列 label：value）+ 头像（右上角绝对定位） */}
      <rect
        fill={muted}
        height="60"
        opacity="0.4"
        rx="4"
        width="46"
        x="660"
        y="148"
      />
      <rect fill={muted} height="9" rx="4.5" width="160" x="88" y="156" />
      <rect fill={muted} height="9" rx="4.5" width="170" x="350" y="156" />
      <rect fill={muted} height="9" rx="4.5" width="140" x="88" y="176" />
      <rect fill={muted} height="9" rx="4.5" width="150" x="350" y="176" />
      <rect fill={muted} height="9" rx="4.5" width="130" x="88" y="196" />
      {/* 4 个模块（分段线样式：分割线 + accent 竖条 + 标题 + 条目） */}
      {[260, 422, 584, 746].map((y) => (
        <g key={y}>
          {/* 分割线 + accent 竖条 + 标题文字 */}
          <rect
            fill={accent}
            height="2"
            opacity="0.65"
            width="618"
            x="88"
            y={y}
          />
          <rect fill={accent} height="14" rx="2" width="5" x="88" y={y + 12} />
          <rect
            fill={accent}
            height="12"
            rx="6"
            width="100"
            x="104"
            y={y + 13}
          />
          {/* 条目：标题 + 副标题 + 日期 + 描述 */}
          <rect
            fill={accent}
            height="10"
            opacity="0.85"
            rx="5"
            width="120"
            x="88"
            y={y + 40}
          />
          <rect fill={muted} height="8" rx="4" width="70" x="224" y={y + 41} />
          <rect fill={muted} height="8" rx="4" width="55" x="588" y={y + 41} />
          <rect fill={muted} height="8" rx="4" width="460" x="88" y={y + 58} />
          <rect fill={muted} height="8" rx="4" width="420" x="88" y={y + 72} />
        </g>
      ))}
    </>
  );
}

/** 自定义标题背景模板的轻量骨架缩略图。 */
function BannerSkeleton({ accent, muted }: SkeletonConfig) {
  // 自定义标题背景：顶部主题色信息横幅 + 模块整条标题背景 + 日期右侧
  return (
    <>
      {/* 顶部信息横幅 */}
      <rect fill={accent} height="188" width="794" x="0" y="0" />
      <rect
        fill="#ffffff"
        height="28"
        opacity="0.94"
        rx="14"
        width="170"
        x="88"
        y="54"
      />
      <rect
        fill="#ffffff"
        height="10"
        opacity="0.68"
        rx="5"
        width="128"
        x="88"
        y="100"
      />
      <rect
        fill="#ffffff"
        height="9"
        opacity="0.72"
        rx="4.5"
        width="150"
        x="88"
        y="134"
      />
      <rect
        fill="#ffffff"
        height="9"
        opacity="0.55"
        rx="4.5"
        width="160"
        x="324"
        y="134"
      />
      <rect
        fill="#ffffff"
        height="9"
        opacity="0.72"
        rx="4.5"
        width="132"
        x="88"
        y="156"
      />
      <rect
        fill="#ffffff"
        height="9"
        opacity="0.55"
        rx="4.5"
        width="118"
        x="324"
        y="156"
      />
      <rect
        fill="#ffffff"
        height="82"
        opacity="0.48"
        rx="4"
        width="64"
        x="642"
        y="52"
      />

      {[244, 410, 576, 742].map((y, index) => (
        <g key={y}>
          {/* 整条模块标题背景 */}
          <rect fill={accent} height="30" rx="2" width="618" x="88" y={y} />
          <rect
            fill="#ffffff"
            height="30"
            opacity="0.12"
            width="30"
            x="88"
            y={y}
          />
          <circle cx="103" cy={y + 15} fill="#ffffff" opacity="0.86" r="6" />
          <rect
            fill="#ffffff"
            height="10"
            opacity="0.92"
            rx="5"
            width={index === 0 ? "92" : "108"}
            x="130"
            y={y + 10}
          />

          {/* 条目：日期左列 + 内容右列 */}
          {[0, 1].map((entryIndex) => {
            const rowY = y + 54 + entryIndex * 58;
            return (
              <g key={`${y}-${entryIndex}`}>
                <rect
                  fill="#333333"
                  height="10"
                  rx="5"
                  width="132"
                  x="88"
                  y={rowY}
                />
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="86"
                  x="234"
                  y={rowY + 1}
                />
                <rect
                  fill="#545454"
                  height="8"
                  opacity="0.58"
                  rx="4"
                  width="72"
                  x="584"
                  y={rowY + 2}
                />
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="450"
                  x="88"
                  y={rowY + 20}
                />
                <rect
                  fill={muted}
                  height="8"
                  rx="4"
                  width="398"
                  x="88"
                  y={rowY + 34}
                />
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}

function renderSkeleton(config: SkeletonConfig): ReactNode {
  switch (config.variant) {
    case "blank":
      return <BlankSkeleton {...config} />;
    case "header":
      return <HeaderSkeleton {...config} />;
    case "sidebar":
      return <SidebarSkeleton {...config} />;
    case "timeline":
      return <TimelineSkeleton {...config} />;
    case "line":
      return <LineSkeleton {...config} />;
    case "banner":
      return <BannerSkeleton {...config} />;
    default:
      return <ClassicSkeleton {...config} />;
  }
}

/** 根据模板 ID 选择对应骨架结构，用于模板库与创建弹窗。 */
export function TemplateSkeletonPreview({
  templateId,
  ariaLabel,
  className = "",
}: {
  templateId: TemplateId;
  ariaLabel?: string;
  className?: string;
}) {
  const config = skeletonConfig[templateId] ?? skeletonConfig.classic;

  return (
    <div
      aria-label={ariaLabel ?? config.title}
      className={`overflow-hidden bg-white ${className}`}
      role="img"
      style={{ aspectRatio: "794 / 1123" }}
    >
      <svg
        aria-hidden="true"
        className="block h-full w-full"
        focusable="false"
        viewBox="0 0 794 1123"
      >
        <rect fill="#ffffff" height="1123" width="794" x="0" y="0" />
        <rect fill="#f8fafc" height="1083" width="754" x="20" y="20" />
        <rect fill="#ffffff" height="1011" width="682" x="56" y="56" />
        {renderSkeleton(config)}
      </svg>
    </div>
  );
}
