import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API 基础 URL
// 生产环境: 默认空字符串 (相对路径，nginx 代理到后端)
// 开发环境: 设置 NEXT_PUBLIC_API_URL=http://localhost:8000
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// 格式化期号显示
export function formatPeriod(period: string | number): string {
  const str = String(period);
  if (str.length > 3) {
    return str.slice(-3);
  }
  return str;
}
