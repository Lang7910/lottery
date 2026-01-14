"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { WatchlistManager } from "@/components/WatchlistManager";
import { BettingPanel } from "@/components/BettingPanel";
import { HK6BettingPanel } from "@/components/HK6BettingPanel";
import { BetHistory } from "@/components/BetHistory";
import { Dice5, Bookmark, Send, History, ArrowLeft, Loader2 } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import Link from "next/link";

// 禁用静态预渲染，因为需要 Clerk 认证
export const dynamic = "force-dynamic";

type Tab = "watchlist" | "betting" | "history";
type LotteryType = "ssq" | "dlt" | "hk6";

function BettingContent() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // 从 URL 读取初始状态
    const [activeTab, setActiveTab] = useState<Tab>(
        (searchParams.get("tab") as Tab) || "watchlist"
    );
    const [lotteryType, setLotteryType] = useState<LotteryType>(
        (searchParams.get("type") as LotteryType) || "ssq"
    );
    const [selectedNumbers, setSelectedNumbers] = useState<any>(null);
    const [nextPeriod, setNextPeriod] = useState<number>(0);
    const [isInitialized, setIsInitialized] = useState(false);

    // 同步状态到 URL
    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true);
            return;
        }

        const params = new URLSearchParams();
        params.set("type", lotteryType);
        params.set("tab", activeTab);

        const newUrl = `/betting?${params.toString()}`;
        const currentUrl = window.location.pathname + window.location.search;

        if (newUrl !== currentUrl) {
            router.replace(newUrl, { scroll: false });
        }
    }, [lotteryType, activeTab, router, isInitialized]);

    // 获取最新期号，计算下一期
    useEffect(() => {
        const fetchLatestPeriod = async () => {
            try {
                // HK6 uses hk6 endpoint
                const endpoint = lotteryType === "hk6" ? "hk6" : lotteryType;
                const res = await fetch(`${API_BASE_URL}/api/${endpoint}/?limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0];
                        if (lotteryType === "hk6") {
                            // HK6: year * 1000 + no, e.g., 26/005 -> 26005, next is 26006
                            const year = parseInt(item.year) || 26;
                            const no = parseInt(item.no) || 0;
                            setNextPeriod(year * 1000 + no + 1);
                        } else {
                            // SSQ/DLT: simple +1
                            const latestPeriod = parseInt(item.period);
                            setNextPeriod(latestPeriod + 1);
                        }
                    }
                }
            } catch (err) {
                console.error("获取期号失败:", err);
            }
        };
        fetchLatestPeriod();
    }, [lotteryType]);

    const handleSelectForBet = (item: any) => {
        setSelectedNumbers(item.numbers);
        setActiveTab("betting");
    };

    const tabs = [
        { key: "watchlist", label: "我的收藏", icon: Bookmark },
        { key: "betting", label: "投注", icon: Send },
        { key: "history", label: "投注记录", icon: History },
    ];

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Dice5 className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">请先登录</h2>
                    <p className="text-muted-foreground mb-4">登录后可使用投注功能</p>
                    <Link href="/" className="text-primary hover:underline">
                        ← 返回首页
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* 头部 */}
            <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/80 backdrop-blur-md">
                <div className="h-full px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/?type=${lotteryType}`}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="返回首页"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Dice5 className="w-6 h-6 text-primary" />
                            <span className="font-semibold">投注中心</span>
                        </div>
                    </div>
                    {/* 彩种切换 */}
                    <div className="flex gap-1">
                        {["ssq", "dlt", "hk6"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setLotteryType(type as any)}
                                className={cn(
                                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                                    lotteryType === type
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-border"
                                )}
                            >
                                {type === "ssq" ? "双色球" : type === "dlt" ? "大乐透" : "六合彩"}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Tab 导航 */}
            <div className="border-b border-border bg-card/50">
                <div className="flex gap-1 p-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as Tab)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === tab.key
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 内容区 */}
            <main className="p-4 max-w-4xl mx-auto">
                {activeTab === "watchlist" && (
                    <WatchlistManager
                        lotteryType={lotteryType}
                        onSelectForBet={handleSelectForBet}
                    />
                )}
                {activeTab === "betting" && (
                    lotteryType === "hk6" ? (
                        <HK6BettingPanel
                            onSuccess={() => {
                                setSelectedNumbers(null);
                            }}
                        />
                    ) : (
                        <BettingPanel
                            lotteryType={lotteryType}
                            initialNumbers={selectedNumbers}
                            targetPeriod={nextPeriod}
                            onSuccess={() => {
                                setSelectedNumbers(null);
                                setActiveTab("history");
                            }}
                        />
                    )
                )}
                {activeTab === "history" && (
                    <BetHistory lotteryType={lotteryType} />
                )}
            </main>
        </div>
    );
}

// Suspense wrapper for useSearchParams
export default function BettingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <BettingContent />
        </Suspense>
    );
}
