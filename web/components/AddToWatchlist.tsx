"use client";

import { Plus, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn, API_BASE_URL } from "@/lib/utils";

interface AddToWatchlistProps {
    lotteryType: "ssq" | "dlt" | "hk6";
    numbers: {
        red?: number[];
        blue?: number | number[];
        front?: number[];
        back?: number[];
        // HK6 specific
        numbers?: number[];  // 正码
        special?: number;    // 特码
    };
    source?: string;
    targetPeriod?: number;  // 目标期号
    className?: string;
}

// 生成号码的唯一标识
function getNumbersKey(lotteryType: string, numbers: any): string {
    if (lotteryType === "ssq") {
        const red = (numbers.red || []).sort((a: number, b: number) => a - b).join(",");
        const blue = numbers.blue;
        return `ssq:${red}+${blue}`;
    } else if (lotteryType === "hk6") {
        const nums = (numbers.numbers || []).sort((a: number, b: number) => a - b).join(",");
        const special = numbers.special;
        return `hk6:${nums}+${special}`;
    } else {
        const front = (numbers.front || []).sort((a: number, b: number) => a - b).join(",");
        const back = (numbers.back || []).sort((a: number, b: number) => a - b).join(",");
        return `dlt:${front}+${back}`;
    }
}

// 全局缓存已添加的号码
const addedNumbersCache = new Set<string>();

export function AddToWatchlist({
    lotteryType,
    numbers,
    source = "recommendation",
    targetPeriod,
    className
}: AddToWatchlistProps) {
    const { isSignedIn, userId } = useAuth();
    const [loading, setLoading] = useState(false);

    // 基于号码计算 key
    const numbersKey = getNumbersKey(lotteryType, numbers);
    const [added, setAdded] = useState(() => addedNumbersCache.has(numbersKey));

    // 当号码变化时，检查是否已添加
    const prevKeyRef = useRef(numbersKey);
    useEffect(() => {
        if (prevKeyRef.current !== numbersKey) {
            prevKeyRef.current = numbersKey;
            setAdded(addedNumbersCache.has(numbersKey));
        }
    }, [numbersKey]);

    const handleAdd = async () => {
        if (!isSignedIn) {
            window.location.href = "/sign-in";
            return;
        }

        if (added) return; // 已添加过，不重复添加

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/betting/watchlist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Clerk-User-Id": userId || "",
                },
                body: JSON.stringify({
                    lottery_type: lotteryType,
                    numbers,
                    source,
                    target_period: targetPeriod,
                }),
            });

            if (res.ok) {
                addedNumbersCache.add(numbersKey);
                setAdded(true);
            }
        } catch (err) {
            console.error("添加失败:", err);
        } finally {
            setLoading(false);
        }
    };

    // 登录后才显示按钮
    if (!isSignedIn) {
        return null;
    }

    return (
        <button
            onClick={handleAdd}
            disabled={loading || added}
            className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                added
                    ? "bg-green-500/20 text-green-500 cursor-default"
                    : "bg-muted/50 hover:bg-primary/20 hover:text-primary text-muted-foreground",
                loading && "opacity-50 cursor-not-allowed",
                className
            )}
            title={added ? "已收藏" : "添加到收藏"}
        >
            {added ? (
                <Check className="w-4 h-4" />
            ) : (
                <Plus className="w-4 h-4" />
            )}
        </button>
    );
}

