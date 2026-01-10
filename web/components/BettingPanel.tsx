"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Send, Calculator, Trash2, Plus, Minus,
    AlertCircle, CheckCircle
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface BettingPanelProps {
    lotteryType?: "ssq" | "dlt";
    initialNumbers?: {
        red?: number[];
        blue?: number | number[];
        front?: number[];
        back?: number[];
    };
    targetPeriod?: number;
    onSuccess?: () => void;
}

type BetType = "single" | "multiple" | "dantuo";

export function BettingPanel({
    lotteryType = "ssq",
    initialNumbers,
    targetPeriod,
    onSuccess
}: BettingPanelProps) {
    const { isSignedIn, userId } = useAuth();
    const [betType, setBetType] = useState<BetType>("single");
    const [multiple, setMultiple] = useState(1);

    // 号码状态
    const [redNumbers, setRedNumbers] = useState<number[]>([]);
    const [blueNumbers, setBlueNumbers] = useState<number[]>([]);
    const [danRed, setDanRed] = useState<number[]>([]);
    const [tuoRed, setTuoRed] = useState<number[]>([]);

    // 计算结果
    const [betCount, setBetCount] = useState(0);
    const [amount, setAmount] = useState(0);
    const [period, setPeriod] = useState(targetPeriod || 0);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // 号码范围
    const redMax = lotteryType === "ssq" ? 33 : 35;
    const blueMax = lotteryType === "ssq" ? 16 : 12;
    const redNeed = lotteryType === "ssq" ? 6 : 5;
    const blueNeed = lotteryType === "ssq" ? 1 : 2;

    // 初始化号码
    useEffect(() => {
        if (initialNumbers) {
            if (lotteryType === "ssq") {
                setRedNumbers(initialNumbers.red || []);
                setBlueNumbers(
                    typeof initialNumbers.blue === "number"
                        ? [initialNumbers.blue]
                        : (initialNumbers.blue || [])
                );
            } else {
                setRedNumbers(initialNumbers.front || []);
                setBlueNumbers(initialNumbers.back || []);
            }
        }
    }, [initialNumbers]);

    // 计算注数
    useEffect(() => {
        calculateBet();
    }, [redNumbers, blueNumbers, danRed, tuoRed, multiple, betType]);

    const calculateBet = async () => {
        let numbers: any;

        if (betType === "single" || betType === "multiple") {
            if (lotteryType === "ssq") {
                numbers = {
                    red: redNumbers,
                    blue: betType === "single" ? blueNumbers[0] : blueNumbers
                };
            } else {
                numbers = { front: redNumbers, back: blueNumbers };
            }
        } else {
            // 胆拖
            if (lotteryType === "ssq") {
                numbers = {
                    dan_red: danRed,
                    tuo_red: tuoRed,
                    blue: blueNumbers[0]
                };
            } else {
                numbers = {
                    dan_front: danRed,
                    tuo_front: tuoRed,
                    dan_back: [],
                    tuo_back: blueNumbers
                };
            }
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/betting/calculate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lottery_type: lotteryType,
                    bet_type: betType,
                    numbers,
                    multiple,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setBetCount(data.bet_count);
                setAmount(data.amount);
            }
        } catch (err) {
            console.error("计算失败:", err);
        }
    };

    const toggleNumber = (num: number, type: "red" | "blue" | "dan" | "tuo") => {
        const setState = {
            red: setRedNumbers,
            blue: setBlueNumbers,
            dan: setDanRed,
            tuo: setTuoRed,
        }[type];

        const state = {
            red: redNumbers,
            blue: blueNumbers,
            dan: danRed,
            tuo: tuoRed,
        }[type];

        if (state.includes(num)) {
            setState(state.filter(n => n !== num));
        } else {
            setState([...state, num].sort((a, b) => a - b));
        }
    };

    const clearAll = () => {
        setRedNumbers([]);
        setBlueNumbers([]);
        setDanRed([]);
        setTuoRed([]);
    };

    const handleSubmit = async () => {
        if (!isSignedIn || !userId) {
            setResult({ success: false, message: "请先登录" });
            return;
        }

        if (betCount === 0) {
            setResult({ success: false, message: "请选择号码" });
            return;
        }

        if (!period) {
            setResult({ success: false, message: "请输入目标期号" });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            let numbers: any;
            if (betType === "single" || betType === "multiple") {
                if (lotteryType === "ssq") {
                    numbers = {
                        red: redNumbers,
                        blue: betType === "single" ? blueNumbers[0] : blueNumbers
                    };
                } else {
                    numbers = { front: redNumbers, back: blueNumbers };
                }
            } else {
                if (lotteryType === "ssq") {
                    numbers = { dan_red: danRed, tuo_red: tuoRed, blue: blueNumbers[0] };
                } else {
                    numbers = { dan_front: danRed, tuo_front: tuoRed, dan_back: [], tuo_back: blueNumbers };
                }
            }

            const res = await fetch(`${API_BASE_URL}/api/betting/bets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Clerk-User-Id": userId,
                },
                body: JSON.stringify({
                    lottery_type: lotteryType,
                    bet_type: betType,
                    target_period: period,
                    numbers,
                    multiple,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setResult({
                    success: true,
                    message: `投注成功！${data.bet_count}注 × ${multiple}倍 = ${data.amount}元`
                });
                onSuccess?.();
            } else {
                setResult({ success: false, message: "投注失败" });
            }
        } catch (err) {
            setResult({ success: false, message: "网络错误" });
        } finally {
            setLoading(false);
        }
    };

    const renderNumberGrid = (
        max: number,
        selected: number[],
        type: "red" | "blue" | "dan" | "tuo",
        isRed: boolean
    ) => (
        <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: max }, (_, i) => i + 1).map(num => {
                const isSelected = selected.includes(num);
                // 胆拖模式下，胆码和拖码互斥
                const isDisabled =
                    (type === "dan" && tuoRed.includes(num)) ||
                    (type === "tuo" && danRed.includes(num));

                return (
                    <button
                        key={num}
                        onClick={() => !isDisabled && toggleNumber(num, type)}
                        disabled={isDisabled}
                        className={cn(
                            "w-7 h-7 rounded-full text-xs font-medium transition-all",
                            isSelected
                                ? isRed
                                    ? "bg-red-500 text-white"
                                    : "bg-blue-500 text-white"
                                : "bg-muted hover:bg-muted/80 text-foreground",
                            isDisabled && "opacity-30 cursor-not-allowed"
                        )}
                    >
                        {num.toString().padStart(2, "0")}
                    </button>
                );
            })}
        </div>
    );

    if (!isSignedIn) {
        return (
            <div className="glass-card p-6 text-center text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>登录后可使用投注功能</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-4 space-y-4">
            {/* 投注类型 */}
            <div className="flex gap-2">
                {[
                    { key: "single", label: "单式" },
                    { key: "multiple", label: "复式" },
                    { key: "dantuo", label: "胆拖" },
                ].map(item => (
                    <button
                        key={item.key}
                        onClick={() => setBetType(item.key as BetType)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            betType === item.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-border"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 号码选择 */}
            <div className="space-y-3">
                {betType === "dantuo" ? (
                    <>
                        {/* 胆拖模式 */}
                        <div>
                            <label className="text-sm font-medium text-red-500 mb-2 block">
                                胆码 (必中，最多5个)
                            </label>
                            {renderNumberGrid(redMax, danRed, "dan", true)}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-red-400 mb-2 block">
                                拖码 (选择区)
                            </label>
                            {renderNumberGrid(redMax, tuoRed, "tuo", true)}
                        </div>
                    </>
                ) : (
                    <>
                        {/* 普通模式 */}
                        <div>
                            <label className="text-sm font-medium text-red-500 mb-2 block">
                                {lotteryType === "ssq" ? "红球" : "前区"}
                                ({redNumbers.length}/{betType === "single" ? redNeed : `${redNeed}+`})
                            </label>
                            {renderNumberGrid(redMax, redNumbers, "red", true)}
                        </div>
                    </>
                )}

                <div>
                    <label className="text-sm font-medium text-blue-500 mb-2 block">
                        {lotteryType === "ssq" ? "蓝球" : "后区"}
                        ({blueNumbers.length}/{betType === "single" ? blueNeed : `${blueNeed}+`})
                    </label>
                    {renderNumberGrid(blueMax, blueNumbers, "blue", false)}
                </div>
            </div>

            {/* 目标期号和倍数 */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">目标期号</label>
                    <input
                        type="number"
                        value={period || ""}
                        onChange={(e) => setPeriod(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                        placeholder="如 2024001"
                    />
                </div>
                <div className="w-32">
                    <label className="text-xs text-muted-foreground mb-1 block">倍数</label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMultiple(Math.max(1, multiple - 1))}
                            className="p-2 rounded bg-muted hover:bg-border"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center font-medium">{multiple}</span>
                        <button
                            onClick={() => setMultiple(Math.min(99, multiple + 1))}
                            className="p-2 rounded bg-muted hover:bg-border"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 统计 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="text-sm">
                    <span className="text-muted-foreground">共 </span>
                    <span className="font-bold text-lg">{betCount}</span>
                    <span className="text-muted-foreground"> 注 × </span>
                    <span className="font-bold">{multiple}</span>
                    <span className="text-muted-foreground"> 倍</span>
                </div>
                <div className="text-right">
                    <span className="text-muted-foreground">合计：</span>
                    <span className="text-xl font-bold text-primary">¥{amount}</span>
                </div>
            </div>

            {/* 结果提示 */}
            {result && (
                <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    result.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                    {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {result.message}
                </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
                <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-border text-sm"
                >
                    <Trash2 className="w-4 h-4" /> 清空
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || betCount === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                    {loading ? "提交中..." : "确认投注"}
                </button>
            </div>
        </div>
    );
}
