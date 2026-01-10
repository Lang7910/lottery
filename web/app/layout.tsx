import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";

export const metadata: Metadata = {
  title: "彩票数据分析",
  description: "双色球和大乐透数据获取、统计与预测",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={zhCN}>
      <html lang="zh-CN" suppressHydrationWarning>
        <body className="antialiased font-sans">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

