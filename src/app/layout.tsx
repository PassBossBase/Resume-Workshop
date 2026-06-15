import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "简历工坊",
  description: "一款活泼、私密、完全本地运行的简历编辑器",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
