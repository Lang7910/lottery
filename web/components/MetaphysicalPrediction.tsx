"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles, Moon, Sun, Flame, Droplets, Mountain, Wind, Zap, Settings, Calendar } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

// 五行对应图标和颜色
const WUXING_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    金: { icon: <Mountain className="w-4 h-4" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    木: { icon: <Wind className="w-4 h-4" />, color: "text-green-400", bgColor: "bg-green-500/20" },
    水: { icon: <Droplets className="w-4 h-4" />, color: "text-blue-400", bgColor: "bg-blue-500/20" },
    火: { icon: <Flame className="w-4 h-4" />, color: "text-red-400", bgColor: "bg-red-500/20" },
    土: { icon: <Mountain className="w-4 h-4" />, color: "text-amber-600", bgColor: "bg-amber-600/20" },
};

interface SSQData {
    draw_time: string;
    bazi: {
        day: string;
        hour: string;
        day_wuxing: string;
        hour_wuxing: string;
    };
    wuxing_analysis: {
        scores: Record<string, number>;
        wang: string;
        xiang: string;
        shuai: string;
    };
    number_pools: {
        hot: { element: string; reds: number[]; description: string };
        warm: { element: string; reds: number[]; description: string };
        cold: { element: string; reds: number[]; description: string };
        blue_hot: { element: string; blues: number[]; description: string };
    };
    recommended_sets: Array<{
        red: number[];
        blue: number;
        balance: string;
    }>;
    method_explanation: string;
}

interface DLTData {
    draw_time: string;
    bazi: {
        day: string;
        hour: string;
        day_wuxing: string;
        hour_wuxing: string;
    };
    wuxing_analysis: {
        scores: Record<string, number>;
        wang: string;
        xiang: string;
        shuai: string;
    };
    number_pools: {
        hot: { element: string; fronts: number[]; description: string };
        warm: { element: string; fronts: number[]; description: string };
        cold: { element: string; fronts: number[]; description: string };
        back_hot: { element: string; backs: number[]; description: string };
    };
    recommended_sets: Array<{
        front: number[];
        back: number[];
        balance: string;
    }>;
    method_explanation: string;
}

interface MetaphysicalPredictionProps {
    lotteryType?: "ssq" | "dlt";
}

export function MetaphysicalPrediction({ lotteryType = "ssq" }: MetaphysicalPredictionProps) {
    const [ssqData, setSSQData] = useState<SSQData | null>(null);
    const [dltData, setDLTData] = useState<DLTData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 参数设置
    const [numSets, setNumSets] = useState(5);
    const [showSettings, setShowSettings] = useState(false);
    const [useCustomTime, setUseCustomTime] = useState(false);
    const [customDateTime, setCustomDateTime] = useState("");

    const loadSSQ = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_BASE_URL}/api/analysis/ssq/metaphysical?num_sets=${numSets}`;
            if (useCustomTime && customDateTime) {
                url += `&custom_time=${encodeURIComponent(customDateTime)}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("获取玄学预测失败");
            setSSQData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    const loadDLT = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_BASE_URL}/api/analysis/dlt/metaphysical?num_sets=${numSets}`;
            if (useCustomTime && customDateTime) {
                url += `&custom_time=${encodeURIComponent(customDateTime)}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("获取玄学预测失败");
            setDLTData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lotteryType === "ssq") {
            loadSSQ();
        } else {
            loadDLT();
        }
    }, [lotteryType]);

    const refresh = () => {
        if (lotteryType === "ssq") {
            loadSSQ();
        } else {
            loadDLT();
        }
    };

    const renderWuxingBar = (scores: Record<string, number>) => {
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        return (
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {Object.entries(scores).map(([wx, score]) => (
                    <div
                        key={wx}
                        className={cn("transition-all", WUXING_CONFIG[wx]?.bgColor)}
                        style={{ width: `${(score / total) * 100}%` }}
                        title={`${wx}: ${score}分`}
                    />
                ))}
            </div>
        );
    };

    const data = lotteryType === "ssq" ? ssqData : dltData;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 头部 - 移除彩种切换，由侧边栏控制 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">玄学预测</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        基于八字五行 · 河图洛书数理推演 · {lotteryType === "ssq" ? "双色球" : "大乐透"}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <select
                        value={numSets}
                        onChange={(e) => setNumSets(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={3}>3注</option>
                        <option value={5}>5注</option>
                        <option value={10}>10注</option>
                    </select>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            showSettings ? "bg-primary/10 text-primary" : "bg-muted hover:bg-border"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 推算
                    </button>
                </div>
            </div>

            {/* 参数设置面板 */}
            {showSettings && (
                <div className="glass-card p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Settings className="w-4 h-4" /> 推算参数
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 时间设置 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> 开奖时间
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={!useCustomTime}
                                        onChange={() => setUseCustomTime(false)}
                                        className="accent-primary"
                                    />
                                    自动（下期开奖时间）
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={useCustomTime}
                                        onChange={() => setUseCustomTime(true)}
                                        className="accent-primary"
                                    />
                                    自定义时间
                                </label>
                                {useCustomTime && (
                                    <input
                                        type="datetime-local"
                                        value={customDateTime}
                                        onChange={(e) => setCustomDateTime(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                                    />
                                )}
                            </div>
                        </div>

                        {/* 历法说明 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">历法说明</label>
                            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
                                <p>• 当前使用<span className="text-primary font-medium">公历</span>计算干支</p>
                                <p>• 八字基于<span className="text-primary font-medium">阳历</span>日期推算</p>
                                <p>• 时辰按<span className="text-primary font-medium">真太阳时</span>划分</p>
                                <p className="text-muted-foreground/70">
                                    SSQ: 周二/四/日 21:15 (亥时)<br />
                                    DLT: 周一/三/六 21:25 (亥时)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">正在推算天机...</div>
            ) : data && (
                <>
                    {/* 八字信息 */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Moon className="w-5 h-5 text-primary" /> 开奖时辰八字
                            </h3>
                            <span className="text-xs text-muted-foreground">{data.draw_time}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold text-foreground font-serif">{data.bazi.day}</div>
                                <div className="text-xs text-muted-foreground mt-1">{data.bazi.day_wuxing}</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold text-foreground font-serif">{data.bazi.hour}</div>
                                <div className="text-xs text-muted-foreground mt-1">{data.bazi.hour_wuxing}</div>
                            </div>
                        </div>

                        {/* 五行能量条 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">五行能量分布</span>
                                <div className="flex gap-2">
                                    {Object.entries(data.wuxing_analysis.scores).map(([wx, score]) => (
                                        <span key={wx} className={cn("flex items-center gap-0.5", WUXING_CONFIG[wx]?.color)}>
                                            {WUXING_CONFIG[wx]?.icon}
                                            {wx}{score}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {renderWuxingBar(data.wuxing_analysis.scores)}
                        </div>

                        {/* 旺衰分析 */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className={cn("p-2 rounded-lg", WUXING_CONFIG[data.wuxing_analysis.wang]?.bgColor)}>
                                <span className={cn("text-lg font-bold", WUXING_CONFIG[data.wuxing_analysis.wang]?.color)}>
                                    {data.wuxing_analysis.wang}
                                </span>
                                <div className="text-xs text-muted-foreground">最旺</div>
                            </div>
                            <div className={cn("p-2 rounded-lg", WUXING_CONFIG[data.wuxing_analysis.xiang]?.bgColor)}>
                                <span className={cn("text-lg font-bold", WUXING_CONFIG[data.wuxing_analysis.xiang]?.color)}>
                                    {data.wuxing_analysis.xiang}
                                </span>
                                <div className="text-xs text-muted-foreground">次旺</div>
                            </div>
                            <div className={cn("p-2 rounded-lg opacity-50", WUXING_CONFIG[data.wuxing_analysis.shuai]?.bgColor)}>
                                <span className={cn("text-lg font-bold", WUXING_CONFIG[data.wuxing_analysis.shuai]?.color)}>
                                    {data.wuxing_analysis.shuai}
                                </span>
                                <div className="text-xs text-muted-foreground">最衰</div>
                            </div>
                        </div>
                    </div>

                    {/* 号码池 */}
                    <div className="glass-card p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" /> 河图洛书数理推演
                        </h3>

                        <div className="space-y-4">
                            {lotteryType === "ssq" && ssqData && (
                                <>
                                    {/* 热门红球 */}
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Flame className="w-4 h-4 text-red-400" />
                                            <span className="text-sm font-medium text-red-400">
                                                旺相之数 ({ssqData.number_pools.hot.element})
                                            </span>
                                            <span className="text-xs text-muted-foreground">{ssqData.number_pools.hot.description}</span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {ssqData.number_pools.hot.reds.map(n => (
                                                <span key={n} className="ball ball-red text-xs" style={{ width: 26, height: 26 }}>
                                                    {n.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 次吉红球 */}
                                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sun className="w-4 h-4 text-yellow-400" />
                                            <span className="text-sm font-medium text-yellow-400">
                                                次吉之数 ({ssqData.number_pools.warm.element})
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {ssqData.number_pools.warm.reds.map(n => (
                                                <span key={n} className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-300 text-[10px] flex items-center justify-center">
                                                    {n.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 蓝球推荐 */}
                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Droplets className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium text-blue-400">
                                                蓝球推荐 ({ssqData.number_pools.blue_hot.element})
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {ssqData.number_pools.blue_hot.blues.map(n => (
                                                <span key={n} className="ball ball-blue text-xs" style={{ width: 26, height: 26 }}>
                                                    {n.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {lotteryType === "dlt" && dltData && (
                                <>
                                    {/* 热门前区 */}
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Flame className="w-4 h-4 text-red-400" />
                                            <span className="text-sm font-medium text-red-400">
                                                前区旺相 ({dltData.number_pools.hot.element})
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {dltData.number_pools.hot.fronts.map(n => (
                                                <span key={n} className="ball ball-red text-xs" style={{ width: 26, height: 26 }}>
                                                    {n.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 后区推荐 */}
                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Droplets className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium text-blue-400">
                                                后区推荐 ({dltData.number_pools.back_hot.element})
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {dltData.number_pools.back_hot.backs.map(n => (
                                                <span key={n} className="ball ball-blue text-xs" style={{ width: 26, height: 26 }}>
                                                    {n.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 推荐号码组 */}
                    <div className="glass-card p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" /> 玄学推荐号码
                        </h3>
                        <div className="space-y-3">
                            {lotteryType === "ssq" && ssqData?.recommended_sets.map((set, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 border border-border/50">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {set.red.map((n, i) => (
                                            <div key={i} className="ball ball-red text-xs" style={{ width: 30, height: 30 }}>
                                                {n.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-muted-foreground">+</span>
                                    <div className="ball ball-blue text-xs" style={{ width: 30, height: 30 }}>
                                        {set.blue.toString().padStart(2, "0")}
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-auto">{set.balance}</span>
                                </div>
                            ))}

                            {lotteryType === "dlt" && dltData?.recommended_sets.map((set, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 border border-border/50">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {set.front.map((n, i) => (
                                            <div key={i} className="ball ball-red text-xs" style={{ width: 30, height: 30 }}>
                                                {n.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-muted-foreground">+</span>
                                    <div className="flex gap-1">
                                        {set.back.map((n, i) => (
                                            <div key={i} className="ball ball-blue text-xs" style={{ width: 30, height: 30 }}>
                                                {n.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-auto">{set.balance}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        ⚠️ 玄学推演仅供娱乐参考，不构成任何投注建议
                    </div>
                </>
            )}
        </div>
    );
}
