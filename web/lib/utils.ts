import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API 基础 URL
// 生产环境: 使用相对路径 (nginx 代理到后端)
// 开发环境: 使用 localhost:8000
export const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? ""  // 生产环境使用相对路径
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

// 格式化期号显示
export function formatPeriod(period: string | number): string {
  const str = String(period);
  if (str.length > 3) {
    return str.slice(-3);
  }
  return str;
}
