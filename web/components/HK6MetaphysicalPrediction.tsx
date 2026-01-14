"use client";

import React, { useState, useEffect } from "react";
import {
    RefreshCw, Sparkles, Moon, Flame, Droplets, Wind, Mountain,
    Zap, Calendar, TrendingUp, Palette, Settings, ChevronDown, ChevronUp
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import { AddToWatchlist } from "@/components/AddToWatchlist";

// 五行配置
const WUXING_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    金: { icon: <Mountain className="w-4 h-4" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    木: { icon: <Wind className="w-4 h-4" />, color: "text-green-400", bgColor: "bg-green-500/20" },
    水: { icon: <Droplets className="w-4 h-4" />, color: "text-blue-400", bgColor: "bg-blue-500/20" },
    火: { icon: <Flame className="w-4 h-4" />, color: "text-red-400", bgColor: "bg-red-500/20" },
    土: { icon: <Mountain className="w-4 h-4" />, color: "text-amber-600", bgColor: "bg-amber-600/20" },
};

// 波色配置
const WAVE_CONFIG: Record<string, { color: string; bgColor: string }> = {
    "红波": { color: "text-red-500", bgColor: "bg-red-500" },
    "蓝波": { color: "text-blue-500", bgColor: "bg-blue-500" },
    "绿波": { color: "text-green-500", bgColor: "bg-green-500" },
};

// 波色映射
const RED_WAVE = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
const BLUE_WAVE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];

function getWaveClass(num: number): string {
    if (RED_WAVE.includes(num)) return "ball-red";
    if (BLUE_WAVE.includes(num)) return "ball-blue";
    return "ball-green";
}

function getWaveBgClass(num: number): string {
    if (RED_WAVE.includes(num)) return "bg-red-500";
    if (BLUE_WAVE.includes(num)) return "bg-blue-500";
    return "bg-green-500";
}

// 方法配置
const HK6_METHODS = [
    { key: "zodiac_prediction", name: "生肖预测", icon: <Moon className="w-4 h-4" />, desc: "六合/三合贵人" },
    { key: "wave_wuxing", name: "波色五行", icon: <Palette className="w-4 h-4" />, desc: "五行旺衰分析" },
    { key: "bazi_wuxing", name: "八字五行", icon: <Sparkles className="w-4 h-4" />, desc: "开奖时间五行" },
    { key: "meihua", name: "梅花易数", icon: <Zap className="w-4 h-4" />, desc: "卦象起数" },
    { key: "jiazi_cycle", name: "六十甲子", icon: <Calendar className="w-4 h-4" />, desc: "干支周期" },
];

export function HK6MetaphysicalPrediction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [nextPeriod, setNextPeriod] = useState<number>(0);

    // 配置选项
    const [showSettings, setShowSettings] = useState(false);
    const [numSets, setNumSets] = useState(5);
    const [selectedMethods, setSelectedMethods] = useState<string[]>(
        ["zodiac_prediction", "wave_wuxing", "bazi_wuxing"]
    );

    const toggleMethod = (key: string) => {
        setSelectedMethods(prev =>
            prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
        );
    };

    // 获取下一期期号
    useEffect(() => {
        const fetchNextPeriod = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/hk6/?limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0];
                        // HK6 period format: year*1000 + no, e.g., 26*1000+5 = 26005
                        // Next period: if no < 999, increment no; otherwise new year
                        const year = parseInt(item.year) || 26;
                        const no = parseInt(item.no) || 0;
                        // Calculate next period as year * 1000 + (no + 1)
                        // e.g., 26/005 -> next is 26006
                        setNextPeriod(year * 1000 + no + 1);
                    }
                }
            } catch (err) {
                console.error("获取期号失败:", err);
            }
        };
        fetchNextPeriod();
    }, []);

    const predict = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set("num_sets", String(numSets));
            // Note: methods are handled by backend for now

            const res = await fetch(`${API_BASE_URL}/api/analysis/hk6/metaphysical?${params}`);
            if (!res.ok) throw new Error("预测请求失败");
            setResult(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { predict(); }, []);

    // 五行分数条
    const renderWuxingBar = (scores: Record<string, number>) => {
        if (!scores) return null;
        const maxScore = Math.max(...Object.values(scores));
        return (
            <div className="space-y-2">
                {Object.entries(scores).map(([wx, score]) => {
                    const config = WUXING_CONFIG[wx];
                    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                    return (
                        <div key={wx} className="flex items-center gap-2">
                            <div className={cn("w-8 flex items-center gap-1", config?.color)}>
                                {config?.icon}
                                <span className="text-sm font-medium">{wx}</span>
                            </div>
                            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", config?.bgColor)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{score}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题和控制 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">六合彩 - 玄学预测</h2>
                    <p className="text-sm text-muted-foreground mt-1">生肖、波色、五行综合预测</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            "bg-muted hover:bg-border",
                            showSettings && "bg-primary/10 text-primary"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        设置
                        {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <select
                        value={numSets}
                        onChange={(e) => setNumSets(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={3}>3组</option>
                        <option value={5}>5组</option>
                        <option value={8}>8组</option>
                        <option value={10}>10组</option>
                    </select>
                    <button
                        onClick={predict}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        {loading ? "预测中..." : "重新预测"}
                    </button>
                </div>
            </div>

            {/* 设置面板 */}
            {showSettings && (
                <div className="glass-card p-4">
                    <h3 className="font-semibold mb-3 text-sm">预测方法选择</h3>
                    <div className="flex flex-wrap gap-2">
                        {HK6_METHODS.map(method => (
                            <button
                                key={method.key}
                                onClick={() => toggleMethod(method.key)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    selectedMethods.includes(method.key)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-border"
                                )}
                            >
                                {method.icon}
                                <span>{method.name}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        选择要使用的预测方法，多种方法结合可提高准确度
                    </p>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

            {result && (
                <>
                    {/* 基础信息 */}
                    <div className="glass-card p-4">
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>开奖时间: <strong>{result.draw_time}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>农历: <strong>{result.lunar_year}年 ({result.year_zodiac}年)</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* 推荐生肖和波色 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.recommended_zodiacs?.length > 0 && (
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" /> 推荐生肖
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.recommended_zodiacs.map((z: string, i: number) => (
                                        <span key={i} className={cn(
                                            "px-3 py-1.5 rounded-lg text-lg font-medium",
                                            i === 0 ? "bg-amber-500 text-white" : "bg-muted"
                                        )}>
                                            {z}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    六合贵人最吉，三合次吉
                                </p>
                            </div>
                        )}

                        {result.recommended_waves?.length > 0 && (
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-primary" /> 推荐波色
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.recommended_waves.map((w: string, i: number) => {
                                        const config = WAVE_CONFIG[w];
                                        return (
                                            <span key={i} className={cn(
                                                "px-4 py-1.5 rounded-lg text-white font-medium",
                                                config?.bgColor
                                            )}>
                                                {w}
                                            </span>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    基于五行旺衰分析
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 各方法详情 */}
                    <div className="space-y-4">
                        {/* 生肖预测法 */}
                        {result.methods?.zodiac_prediction && (
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Moon className="w-4 h-4" /> 生肖预测法
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                    <div>
                                        <span className="text-muted-foreground">开奖日干支: </span>
                                        <span className="font-medium">{result.methods.zodiac_prediction.draw_ganzhi}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">太岁: </span>
                                        <span className="font-medium text-amber-500">{result.methods.zodiac_prediction.taisui_zodiac}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">六合贵人: </span>
                                        <span className="font-medium text-green-500">{result.methods.zodiac_prediction.liuhe_zodiac}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">相冲: </span>
                                        <span className="font-medium text-red-500">{result.methods.zodiac_prediction.chong_zodiac || "无"}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{result.methods.zodiac_prediction.explanation}</p>
                            </div>
                        )}

                        {/* 波色五行法 */}
                        {result.methods?.wave_wuxing && (
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Flame className="w-4 h-4" /> 波色五行法
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-2">五行旺衰</span>
                                        {renderWuxingBar(result.methods.wave_wuxing.wuxing_scores)}
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-2">波色推荐度</span>
                                        <div className="space-y-2">
                                            {Object.entries(result.methods.wave_wuxing.wave_scores || {}).map(([wave, score]: [string, any]) => {
                                                const config = WAVE_CONFIG[wave];
                                                const maxScore = Math.max(...Object.values(result.methods.wave_wuxing.wave_scores || {}) as number[]);
                                                const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                                                return (
                                                    <div key={wave} className="flex items-center gap-2">
                                                        <span className={cn("w-12 text-sm font-medium", config?.color)}>{wave}</span>
                                                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                                            <div className={cn("h-full rounded-full", config?.bgColor)} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(score)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-3">{result.methods.wave_wuxing.explanation}</p>
                            </div>
                        )}

                        {/* 梅花易数 */}
                        {result.methods?.meihua && (
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> 梅花易数法
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">卦象: </span>
                                        <span className="font-medium">{result.methods.meihua.hexagram}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">动爻: </span>
                                        <span className="font-medium">第{result.methods.meihua.yao}爻</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">体用: </span>
                                        <span className="font-medium">{result.methods.meihua.ti_yong_relation}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 推荐号码组 - 带收藏按钮 */}
                    {result.recommended_sets?.length > 0 && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" /> 推荐号码组
                            </h3>
                            <div className="space-y-3">
                                {result.recommended_sets.map((set: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                            {i + 1}
                                        </span>
                                        <div className="flex items-center gap-1 flex-wrap flex-1">
                                            {set.numbers.map((num: number, j: number) => (
                                                <span key={j} className={cn("ball", getWaveClass(num))}>
                                                    {num.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                            <span className="text-muted-foreground mx-1">+</span>
                                            <div className="flex flex-col items-center">
                                                <span className={cn("ball ring-2 ring-amber-400", getWaveClass(set.special))}>
                                                    {set.special.toString().padStart(2, "0")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    {set.special_zodiac}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded text-xs text-white", getWaveBgClass(set.special))}>
                                                {set.special_wave}
                                            </span>
                                            {/* 收藏按钮 */}
                                            <AddToWatchlist
                                                lotteryType="hk6"
                                                numbers={{
                                                    numbers: set.numbers,
                                                    special: set.special
                                                }}
                                                source="metaphysical"
                                                targetPeriod={nextPeriod || undefined}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 热门号码池 */}
                    {(result.combined_hot?.length > 0 || result.combined_warm?.length > 0) && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-3">号码池</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.combined_hot?.length > 0 && (
                                    <div>
                                        <span className="text-sm text-muted-foreground mb-2 block">🔥 热门号码 ({result.combined_hot.length}个)</span>
                                        <div className="flex flex-wrap gap-1">
                                            {result.combined_hot.slice(0, 20).map((num: number) => (
                                                <span key={num} className={cn("w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center", getWaveBgClass(num))}>
                                                    {num.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {result.combined_warm?.length > 0 && (
                                    <div>
                                        <span className="text-sm text-muted-foreground mb-2 block">🌤️ 温和号码 ({result.combined_warm.length}个)</span>
                                        <div className="flex flex-wrap gap-1">
                                            {result.combined_warm.slice(0, 20).map((num: number) => (
                                                <span key={num} className={cn("w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center opacity-70", getWaveBgClass(num))}>
                                                    {num.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
