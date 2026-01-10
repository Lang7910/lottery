"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { WatchlistManager } from "@/components/WatchlistManager";
import { BettingPanel } from "@/components/BettingPanel";
import { BetHistory } from "@/components/BetHistory";
import { Dice5, Bookmark, Send, History, ArrowLeft } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import Link from "next/link";

type Tab = "watchlist" | "betting" | "history";

export default function BettingPage() {
    const { isSignedIn } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("watchlist");
    const [lotteryType, setLotteryType] = useState<"ssq" | "dlt">("ssq");
    const [selectedNumbers, setSelectedNumbers] = useState<any>(null);
    const [nextPeriod, setNextPeriod] = useState<number>(0);

    // 获取最新期号，计算下一期
    useEffect(() => {
        const fetchLatestPeriod = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/${lotteryType}/?limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.items && data.items.length > 0) {
                        const latestPeriod = parseInt(data.items[0].period);
                        // 简单+1计算下一期 (跨年边界留给用户手动调整)
                        setNextPeriod(latestPeriod + 1);
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
                            href="/"
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
                        {["ssq", "dlt"].map((type) => (
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
                                {type === "ssq" ? "双色球" : "大乐透"}
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
                    <BettingPanel
                        lotteryType={lotteryType}
                        initialNumbers={selectedNumbers}
                        targetPeriod={nextPeriod}
                        onSuccess={() => {
                            setSelectedNumbers(null);
                            setActiveTab("history");
                        }}
                    />
                )}
                {activeTab === "history" && (
                    <BetHistory lotteryType={lotteryType} />
                )}
            </main>
        </div>
    );
}

