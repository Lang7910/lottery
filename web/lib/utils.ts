import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API 基础 URL - 生产环境使用同域名，开发环境使用 localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// 格式化期号显示
export function formatPeriod(period: string | number): string {
  const str = String(period);
  if (str.length > 3) {
    return str.slice(-3);
  }
  return str;
}
