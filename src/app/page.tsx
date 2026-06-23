import { AppShell } from "@/components/app-shell";
import {
  ArrowRight,
  FilePlus2,
  FolderSync,
  LayoutTemplate,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const actionLinkBase =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-[var(--line)] px-4 font-bold shadow-[3px_3px_0_var(--line)] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const featureCards = [
  {
    title: "本地保存",
    copy: "默认只存在当前设备，没有账号、云同步或后端 API。",
    icon: ShieldCheck,
    color: "bg-[var(--yellow)]",
  },
  {
    title: "模板开局",
    copy: "空白模板加 5 套内置模板，点一下就能开始编辑。",
    icon: LayoutTemplate,
    color: "bg-[var(--pink)] text-white",
  },
  {
    title: "目录同步",
    copy: "桌面 Chrome 可连接本地文件夹，把简历保存成 JSON。",
    icon: FolderSync,
    color: "bg-[var(--mint)]",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="relative min-h-screen overflow-hidden px-5 py-6 md:px-10 lg:py-8">
        <div className="pointer-events-none absolute -right-16 top-14 h-48 w-48 rotate-12 rounded-[38px] border-2 border-black bg-[var(--yellow)] opacity-70" />
        <div className="pointer-events-none absolute bottom-8 left-8 hidden h-26 w-26 rotate-[-10deg] border-2 border-black bg-[var(--pink)] opacity-55 md:block" />

        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
          <div className="relative z-10 w-full">
            <h1 className="mt-5 max-w-3xl text-5xl leading-[0.98] font-black tracking-tight md:text-7xl">
              <span className="relative left-68 top-6 grid h-10 w-10 rotate-[-5deg] place-items-center rounded-[14px] border-2 border-black bg-[var(--yellow)] shadow-[3px_3px_0_black]">
                <span className="text-xl">R</span>
                <i className="absolute -right-2 -top-2 h-3 w-3 rounded-full border-2 border-black bg-[var(--pink)]" />
              </span>
              简历工坊
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 font-medium text-black/62 md:text-lg">
              纯本地简历编辑器。选模板、填内容、调样式、看 A4 预览，再导出一份的
              PDF。
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                className={`${actionLinkBase} bg-[var(--pink)] text-white`}
                href="/dashboard"
              >
                <FilePlus2 aria-hidden="true" size={18} />
                制作简历
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                className={`${actionLinkBase} bg-white text-[var(--ink)]`}
                href="/templates"
              >
                <LayoutTemplate aria-hidden="true" size={18} />
                模板列表
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {featureCards.map(({ title, copy, icon: Icon, color }) => (
                <article
                  className="rounded-[24px] border-2 border-black bg-[var(--paper)] p-4 shadow-[4px_4px_0_#d9d1c3]"
                  key={title}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl border-2 border-black shadow-[2px_2px_0_black] ${color}`}
                  >
                    <Icon aria-hidden="true" size={20} strokeWidth={2.7} />
                  </span>
                  <h2 className="mt-3 text-lg font-black">{title}</h2>
                  <p className="mt-1 text-sm leading-6 font-medium text-black/58">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
