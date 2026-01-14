"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Send, Calculator, Trash2, Plus, Minus, Star,
    AlertCircle, CheckCircle, RefreshCw
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

// 波色映射
const RED_WAVE = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
const BLUE_WAVE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];

function getWaveClass(num: number): string {
    if (RED_WAVE.includes(num)) return "bg-red-500";
    if (BLUE_WAVE.includes(num)) return "bg-blue-500";
    return "bg-green-500";
}

function getWaveName(num: number): string {
    if (RED_WAVE.includes(num)) return "红波";
    if (BLUE_WAVE.includes(num)) return "蓝波";
    return "绿波";
}

// 生肖计算 (简化版，基于2026年马年)
const ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
function getZodiac(num: number, year: number = 2026): string {
    const yearZodiacIdx = 6; // 马 in 2026
    const numOffset = (num - 1) % 12;
    const zodiacIdx = (yearZodiacIdx - numOffset + 12) % 12;
    return ZODIACS[zodiacIdx];
}

interface HK6BettingPanelProps {
    initialNumbers?: { numbers?: number[]; special?: number };
    targetPeriod?: number;
    onSuccess?: () => void;
}

export function HK6BettingPanel({
    initialNumbers,
    targetPeriod,
    onSuccess
}: HK6BettingPanelProps) {
    const { isSignedIn, userId } = useAuth();

    // 号码状态: 6个正码 + 1个特码
    const [numbers, setNumbers] = useState<number[]>([]);
    const [special, setSpecial] = useState<number | null>(null);
    const [selectMode, setSelectMode] = useState<"numbers" | "special">("numbers");
    const [multiple, setMultiple] = useState(1);
    const [period, setPeriod] = useState(targetPeriod || 0);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // 初始化
    useEffect(() => {
        if (initialNumbers) {
            if (initialNumbers.numbers) setNumbers(initialNumbers.numbers);
            if (initialNumbers.special) setSpecial(initialNumbers.special);
        }
    }, [initialNumbers]);

    // 获取期号
    useEffect(() => {
        if (!targetPeriod) {
            fetch(`${API_BASE_URL}/api/hk6?limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data.items?.[0]) {
                        const { year, no } = data.items[0];
                        setPeriod(year * 1000 + no + 1);
                    }
                })
                .catch(console.error);
        } else {
            setPeriod(targetPeriod);
        }
    }, [targetPeriod]);

    const toggleNumber = (num: number) => {
        if (selectMode === "special") {
            if (numbers.includes(num)) {
                setResult({ success: false, message: "该号码已被选为正码" });
                return;
            }
            setSpecial(special === num ? null : num);
        } else {
            if (special === num) {
                setResult({ success: false, message: "该号码已被选为特码" });
                return;
            }
            if (numbers.includes(num)) {
                setNumbers(numbers.filter(n => n !== num));
            } else if (numbers.length < 6) {
                setNumbers([...numbers, num].sort((a, b) => a - b));
            }
        }
    };

    const clearAll = () => {
        setNumbers([]);
        setSpecial(null);
        setResult(null);
    };

    const randomSelect = () => {
        const available = Array.from({ length: 49 }, (_, i) => i + 1);
        const shuffled = available.sort(() => Math.random() - 0.5);
        setNumbers(shuffled.slice(0, 6).sort((a, b) => a - b));
        setSpecial(shuffled[6]);
    };

    const handleSubmit = async () => {
        if (!isSignedIn || !userId) {
            setResult({ success: false, message: "请先登录" });
            return;
        }

        if (numbers.length !== 6 || !special) {
            setResult({ success: false, message: "请选择6个正码和1个特码" });
            return;
        }

        if (!period) {
            setResult({ success: false, message: "请输入目标期号" });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/betting/bets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Clerk-User-Id": userId,
                },
                body: JSON.stringify({
                    lottery_type: "hk6",
                    bet_type: "single",
                    target_period: period,
                    numbers: { numbers, special },
                    multiple,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setResult({
                    success: true,
                    message: `投注成功！${data.bet_count || 1}注 × ${multiple}倍`
                });
                onSuccess?.();
            } else {
                const error = await res.json().catch(() => ({}));
                setResult({ success: false, message: error.detail || "投注失败" });
            }
        } catch (err) {
            setResult({ success: false, message: "网络错误" });
        } finally {
            setLoading(false);
        }
    };

    // 计算金额 (简化：每注10港币)
    const betAmount = numbers.length === 6 && special ? 10 * multiple : 0;

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
            {/* 模式切换 */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSelectMode("numbers")}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectMode === "numbers"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-border"
                    )}
                >
                    选正码 ({numbers.length}/6)
                </button>
                <button
                    onClick={() => setSelectMode("special")}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectMode === "special"
                            ? "bg-amber-500 text-white"
                            : "bg-muted hover:bg-border"
                    )}
                >
                    <Star className="w-4 h-4 inline mr-1" />
                    选特码 ({special ? 1 : 0}/1)
                </button>
            </div>

            {/* 号码选择网格 */}
            <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                    {selectMode === "numbers" ? "点击选择6个正码" : "点击选择1个特码"}
                </div>
                <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
                        const isSelectedNumber = numbers.includes(num);
                        const isSelectedSpecial = special === num;
                        const bgClass = getWaveClass(num);

                        return (
                            <button
                                key={num}
                                onClick={() => toggleNumber(num)}
                                className={cn(
                                    "relative w-8 h-8 rounded-full text-xs font-bold transition-all",
                                    isSelectedNumber || isSelectedSpecial
                                        ? cn(bgClass, "text-white ring-2",
                                            isSelectedSpecial ? "ring-amber-400" : "ring-white/50")
                                        : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                                )}
                            >
                                {num.toString().padStart(2, "0")}
                                {isSelectedSpecial && (
                                    <Star className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 fill-amber-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 已选号码预览 */}
            {(numbers.length > 0 || special) && (
                <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-2">已选号码</div>
                    <div className="flex items-center gap-1 flex-wrap">
                        {numbers.map(num => (
                            <div key={num} className="flex flex-col items-center">
                                <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", getWaveClass(num))}>
                                    {num.toString().padStart(2, "0")}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{getZodiac(num)}</span>
                            </div>
                        ))}
                        {numbers.length > 0 && <span className="text-muted-foreground mx-1">+</span>}
                        {special && (
                            <div className="flex flex-col items-center">
                                <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-amber-400", getWaveClass(special))}>
                                    {special.toString().padStart(2, "0")}
                                </span>
                                <span className="text-[10px] text-amber-500 font-medium">{getZodiac(special)}</span>
                            </div>
                        )}
                    </div>
                    {numbers.length === 6 && special && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            特码: {getWaveName(special)} · {getZodiac(special)}
                        </div>
                    )}
                </div>
            )}

            {/* 倍数和期号 */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">倍数:</span>
                    <button
                        onClick={() => setMultiple(Math.max(1, multiple - 1))}
                        className="p-1 rounded bg-muted hover:bg-border"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{multiple}</span>
                    <button
                        onClick={() => setMultiple(Math.min(99, multiple + 1))}
                        className="p-1 rounded bg-muted hover:bg-border"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">期号:</span>
                    <input
                        type="number"
                        value={period}
                        onChange={(e) => setPeriod(parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 rounded bg-muted border border-border text-sm text-center"
                    />
                </div>
                <div className="ml-auto text-sm">
                    <span className="text-muted-foreground">金额: </span>
                    <span className="font-bold text-primary">{betAmount}港币</span>
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
                    onClick={randomSelect}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-border text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> 随机
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || numbers.length !== 6 || !special}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                    {loading ? "提交中..." : "确认投注"}
                </button>
            </div>
        </div>
    );
}
