"use client";

import { AppShell } from "@/components/app-shell";
import { LanguageToggle } from "@/components/language-toggle";
import {
  ArrowRight,
  FilePlus2,
  FolderSync,
  LayoutTemplate,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

const actionLinkBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/40 px-5 font-bold text-white shadow-[0_10px_28px_rgb(1_12_28_/_28%)] backdrop-blur-xl transition-colors hover:bg-white/24 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-w-44";

export default function Home() {
  const t = useT();
  const featureCards = [
    {
      title: t.home.localTitle,
      copy: t.home.localCopy,
      icon: ShieldCheck,
      color: "bg-(--yellow)",
    },
    {
      title: t.home.templateTitle,
      copy: t.home.templateCopy,
      icon: LayoutTemplate,
      color: "bg-(--pink) text-white",
    },
    {
      title: t.home.syncTitle,
      copy: t.home.syncCopy,
      icon: FolderSync,
      color: "bg-(--mint)",
    },
  ];

  return (
    <AppShell>
      <section className="relative isolate  text-white">
        <video
          aria-hidden="true"
          autoPlay
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src="/home-hero.mp4" type="video/mp4" />
        </video>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 "
        />

        <div className="relative z-20 mx-auto flex min-h-dvh max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-8">
          <header className="flex items-center justify-end">
            <LanguageToggle
              className="border-white/40 bg-white/12 text-white backdrop-blur-xl hover:bg-white/24"
              pressable
              variant="paper"
            />
          </header>

          <div className="flex flex-1">
            <div className="max-w-3xl">
              <h1 className="max-w-3xl text-4xl leading-[0.96] font-black tracking-tight text-balance drop-shadow-[0_4px_0_rgb(0_0_0_/_35%)] sm:text-5xl md:text-6xl lg:text-7xl">
                {t.home.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 font-medium text-white/86 sm:text-lg sm:leading-8">
                {t.home.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  className={`${actionLinkBase} bg-white/18`}
                  href="/dashboard"
                >
                  <FilePlus2 aria-hidden="true" size={19} strokeWidth={2.8} />
                  {t.home.start}
                  <ArrowRight aria-hidden="true" size={19} strokeWidth={2.8} />
                </Link>
                <Link
                  className={`${actionLinkBase} bg-white/10`}
                  href="/templates"
                >
                  <LayoutTemplate
                    aria-hidden="true"
                    size={19}
                    strokeWidth={2.8}
                  />
                  {t.home.templates}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pb-1 sm:grid-cols-3 sm:gap-4">
            {featureCards.map(({ title, copy, icon: Icon, color }) => (
              <article
                className="flex items-start gap-3 rounded-3xl border border-white/30 bg-white/12 p-4 text-white shadow-[0_16px_40px_rgb(1_12_28_/_32%)] backdrop-blur-xl"
                key={title}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/35 shadow-[0_6px_16px_rgb(1_12_28_/_30%)] ${color}`}
                >
                  <Icon aria-hidden="true" size={20} strokeWidth={2.7} />
                </span>
                <div>
                  <h2 className="text-base font-black">{title}</h2>
                  <p className="mt-1 text-sm leading-6 font-medium text-white/72">
                    {copy}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
