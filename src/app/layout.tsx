import type { Metadata } from "next";
import Script from "next/script";
import { AppRuntime } from "@/components/app-runtime";
import { ToastContainer } from "@/components/anime-ui/toast";
import { LocaleProvider } from "@/lib/i18n";
import { localeBootstrapScript } from "@/lib/locale-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "简历工坊 / Resume Workshop",
  description: "一款活泼、私密、完全本地运行的简历编辑器 / A private local resume editor",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Script
          id="resume-workshop-locale-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: localeBootstrapScript }}
        />
        <LocaleProvider>
          {children}
          <AppRuntime />
          <ToastContainer />
        </LocaleProvider>
      </body>
    </html>
  );
}
