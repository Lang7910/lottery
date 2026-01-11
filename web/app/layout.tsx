import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import dynamic from "next/dynamic";

// 动态导入 ClerkProvider，禁用 SSR 以避免构建时错误
const ClerkProviderWrapper = dynamic(
  () => import("@/components/ClerkProviderWrapper").then(mod => mod.ClerkProviderWrapper),
  { ssr: false }
);

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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ClerkProviderWrapper>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}


