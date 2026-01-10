"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    History, Trophy, Clock, ChevronDown, ChevronUp,
    RefreshCw, Filter, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface Bet {
    id: number;
    lottery_type: string;
    bet_type: string;
    target_period: number;
    numbers: any;
    bet_count: number;
    multiple: number;
    amount: number;
    status: string;
    prize_level: string | null;
    prize_amount: number | null;
    matched_red: number | null;
    matched_blue: boolean | null;
    created_at: string;
}

interface BetHistoryProps {
    lotteryType?: "ssq" | "dlt";
}

export function BetHistory({ lotteryType = "ssq" }: BetHistoryProps) {
    const { isSignedIn, userId } = useAuth();
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<"all" | "pending" | "checked">("all");
    const [stats, setStats] = useState<any>(null);
    const [expanded, setExpanded] = useState(true);

    const loadBets = async () => {
        if (!isSignedIn || !userId) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("lottery_type", lotteryType);
            if (filter !== "all") params.set("status", filter);
            params.set("limit", "50");

            const [betsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/betting/bets?${params}`, {
                    headers: { "X-Clerk-User-Id": userId },
                }),
                fetch(`${API_BASE_URL}/api/betting/stats`, {
                    headers: { "X-Clerk-User-Id": userId },
                }),
            ]);

            if (betsRes.ok) setBets(await betsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (err) {
            console.error("加载失败:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBets();
    }, [isSignedIn, userId, lotteryType, filter]);

    const formatBetType = (type: string) => {
        return { single: "单式", multiple: "复式", dantuo: "胆拖" }[type] || type;
    };

    const formatNumbers = (bet: Bet) => {
        const nums = bet.numbers;
        if (bet.lottery_type === "ssq") {
            if (bet.bet_type === "dantuo") {
                return `胆[${nums.dan_red?.join(",")}] 拖[${nums.tuo_red?.join(",")}]+${nums.blue}`;
            }
            const red = nums.red?.join(",") || "";
            const blue = Array.isArray(nums.blue) ? nums.blue.join(",") : nums.blue;
            return `${red}+${blue}`;
        } else {
            if (bet.bet_type === "dantuo") {
                return `胆[${nums.dan_front?.join(",")}] 拖[${nums.tuo_front?.join(",")}]+${nums.tuo_back?.join(",")}`;
            }
            return `${nums.front?.join(",")}+${nums.back?.join(",")}`;
        }
    };

    const getStatusIcon = (bet: Bet) => {
        if (bet.status === "pending") {
            return <Clock className="w-4 h-4 text-yellow-500" />;
        }
        if (bet.prize_level) {
            return <Trophy className="w-4 h-4 text-green-500" />;
        }
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    };

    if (!isSignedIn) {
        return (
            <div className="glass-card p-6 text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>登录后查看投注记录</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 统计卡片 */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="glass-card p-3 text-center">
                        <div className="text-2xl font-bold">{stats.total_bets}</div>
                        <div className="text-xs text-muted-foreground">总投注</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <div className="text-2xl font-bold">¥{stats.total_amount.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">总金额</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <div className="text-2xl font-bold text-green-500">{stats.winning_count}</div>
                        <div className="text-xs text-muted-foreground">中奖次数</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <div className="text-2xl font-bold text-primary">¥{stats.total_prize.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">总奖金</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <div className={cn(
                            "text-2xl font-bold",
                            stats.profit >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                            {stats.profit >= 0 ? "+" : ""}¥{stats.profit.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">盈亏</div>
                    </div>
                </div>
            )}

            {/* 投注记录 */}
            <div className="glass-card overflow-hidden">
                {/* 头部 */}
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">投注记录</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); loadBets(); }}
                            className="p-1.5 rounded hover:bg-muted"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>

                {expanded && (
                    <>
                        {/* 筛选 */}
                        <div className="px-4 pb-2 flex gap-2">
                            {[
                                { key: "all", label: "全部" },
                                { key: "pending", label: "待开奖" },
                                { key: "checked", label: "已开奖" },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key as any)}
                                    className={cn(
                                        "px-3 py-1 rounded text-xs font-medium transition-colors",
                                        filter === item.key
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-border"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* 列表 */}
                        <div className="border-t border-border divide-y divide-border max-h-96 overflow-y-auto">
                            {bets.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">
                                    <p className="text-sm">暂无投注记录</p>
                                </div>
                            ) : (
                                bets.map((bet) => (
                                    <div key={bet.id} className="p-3 hover:bg-muted/20">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getStatusIcon(bet)}
                                                    <span className="font-mono text-sm">{bet.target_period}期</span>
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                                        {formatBetType(bet.bet_type)}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {formatNumbers(bet)}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {bet.bet_count}注 × {bet.multiple}倍 = ¥{bet.amount}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {bet.prize_level ? (
                                                    <>
                                                        <div className="text-sm font-medium text-green-500">
                                                            {bet.prize_level}
                                                        </div>
                                                        {bet.prize_amount === -1 ? (
                                                            <div className="text-lg font-bold text-yellow-400">
                                                                🎉 大奖
                                                            </div>
                                                        ) : (
                                                            <div className="text-lg font-bold text-green-500">
                                                                +¥{bet.prize_amount}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : bet.status === "checked" ? (
                                                    <div className="text-sm text-muted-foreground">未中奖</div>
                                                ) : (
                                                    <div className="text-sm text-yellow-500">待开奖</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
