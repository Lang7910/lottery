"use client";

import React, { useState, useEffect } from "react";
import {
    RefreshCw, Layers, Clock, Scissors, Moon, ChevronDown, ChevronUp,
    Sparkles, AlertTriangle, CheckCircle2, TrendingUp
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface ComprehensiveRecommendationProps {
    lotteryType?: "ssq" | "dlt";
}

interface NumberScore {
    num: number;
    score: number;
    sources: string[];
}

export function ComprehensiveRecommendation({ lotteryType = "ssq" }: ComprehensiveRecommendationProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 各模块数据
    const [timeseriesData, setTimeseriesData] = useState<any>(null);
    const [killData, setKillData] = useState<any>(null);
    const [metaphysicalData, setMetaphysicalData] = useState<any>(null);

    // 综合结果
    const [redScores, setRedScores] = useState<NumberScore[]>([]);
    const [blueScores, setBlueScores] = useState<NumberScore[]>([]);
    const [recommendedSets, setRecommendedSets] = useState<any[]>([]);

    // 设置
    const [numSets, setNumSets] = useState(5);
    const [showDetails, setShowDetails] = useState(false);

    // 权重配置
    const [weights, setWeights] = useState({
        timeseries: 0.4,
        kill: 0.3,
        metaphysical: 0.3
    });

    const redMax = lotteryType === "ssq" ? 33 : 35;
    const blueMax = lotteryType === "ssq" ? 16 : 12;

    const loadAllData = async () => {
        setLoading(true);
        setError(null);

        try {
            // 并行请求三个数据源
            const [tsRes, killRes, metaRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/analysis/${lotteryType}/recommend?num_sets=5&aggregation=weighted`),
                lotteryType === "ssq"
                    ? fetch(`${API_BASE_URL}/api/analysis/ssq/kill?lookback=100`)
                    : Promise.resolve(null),
                fetch(`${API_BASE_URL}/api/analysis/${lotteryType}/metaphysical?num_sets=5`)
            ]);

            if (tsRes.ok) {
                setTimeseriesData(await tsRes.json());
            }
            if (killRes?.ok) {
                setKillData(await killRes.json());
            }
            if (metaRes.ok) {
                setMetaphysicalData(await metaRes.json());
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "数据加载失败");
        } finally {
            setLoading(false);
        }
    };

    // 综合计算号码得分
    useEffect(() => {
        if (!timeseriesData && !killData && !metaphysicalData) return;

        const redScoreMap = new Map<number, NumberScore>();
        const blueScoreMap = new Map<number, NumberScore>();

        // 初始化所有号码
        for (let i = 1; i <= redMax; i++) {
            redScoreMap.set(i, { num: i, score: 50, sources: [] });
        }
        for (let i = 1; i <= blueMax; i++) {
            blueScoreMap.set(i, { num: i, score: 50, sources: [] });
        }

        // 1. 时间序列贡献
        if (timeseriesData?.recommendations) {
            const tsWeight = weights.timeseries;
            timeseriesData.recommendations.forEach((rec: any) => {
                const nums = rec.red || rec.front || [];
                nums.forEach((n: number, idx: number) => {
                    const item = redScoreMap.get(n)!;
                    item.score += (30 - idx * 3) * tsWeight;
                    if (!item.sources.includes("时序")) item.sources.push("时序");
                });
                const blues = rec.blue !== undefined ? [rec.blue] : (rec.back || []);
                blues.forEach((n: number) => {
                    const item = blueScoreMap.get(n);
                    if (item) {
                        item.score += 20 * tsWeight;
                        if (!item.sources.includes("时序")) item.sources.push("时序");
                    }
                });
            });
        }

        // 2. 杀号贡献 (反向 - 被杀的号码减分)
        if (killData) {
            const killWeight = weights.kill;
            // 红球杀号
            killData.summary?.killed_reds?.forEach((n: number) => {
                const item = redScoreMap.get(n);
                if (item) {
                    item.score -= 25 * killWeight;
                    if (!item.sources.includes("杀号")) item.sources.push("杀号");
                }
            });
            // 蓝球杀号
            killData.summary?.killed_blues?.forEach((n: number) => {
                const item = blueScoreMap.get(n);
                if (item) {
                    item.score -= 25 * killWeight;
                    if (!item.sources.includes("杀号")) item.sources.push("杀号");
                }
            });
        }

        // 3. 玄学贡献
        if (metaphysicalData) {
            const metaWeight = weights.metaphysical;
            // 热门号码加分
            metaphysicalData.combined_hot?.forEach((n: number) => {
                const item = redScoreMap.get(n);
                if (item) {
                    item.score += 20 * metaWeight;
                    if (!item.sources.includes("玄学")) item.sources.push("玄学");
                }
            });
            // 推荐组中的号码也加分
            metaphysicalData.recommended_sets?.forEach((set: any) => {
                const nums = set.red || set.front || [];
                nums.forEach((n: number) => {
                    const item = redScoreMap.get(n);
                    if (item) {
                        item.score += 10 * metaWeight;
                        if (!item.sources.includes("玄学")) item.sources.push("玄学");
                    }
                });
            });
        }

        // 排序
        const sortedRed = Array.from(redScoreMap.values()).sort((a, b) => b.score - a.score);
        const sortedBlue = Array.from(blueScoreMap.values()).sort((a, b) => b.score - a.score);

        setRedScores(sortedRed);
        setBlueScores(sortedBlue);

        // 生成推荐号码组
        generateRecommendations(sortedRed, sortedBlue);
    }, [timeseriesData, killData, metaphysicalData, weights]);

    const generateRecommendations = (reds: NumberScore[], blues: NumberScore[]) => {
        const sets: any[] = [];
        const redCount = lotteryType === "ssq" ? 6 : 5;
        const blueCount = lotteryType === "ssq" ? 1 : 2;

        const used = new Set<string>();

        for (let i = 0; i < numSets * 2 && sets.length < numSets; i++) {
            // 从高分区随机选择
            const topReds = reds.slice(0, 15);
            const selected: number[] = [];

            // 随机选择红球，偏向高分
            const shuffled = [...topReds].sort(() => Math.random() - 0.5);
            for (const item of shuffled) {
                if (selected.length >= redCount) break;
                if (!selected.includes(item.num)) {
                    selected.push(item.num);
                }
            }

            selected.sort((a, b) => a - b);

            // 选择蓝球
            const topBlues = blues.slice(0, 5);
            let blueNums: number[];
            if (blueCount === 1) {
                blueNums = [topBlues[Math.floor(Math.random() * topBlues.length)].num];
            } else {
                const shuffledBlue = [...topBlues].sort(() => Math.random() - 0.5);
                blueNums = shuffledBlue.slice(0, blueCount).map(b => b.num).sort((a, b) => a - b);
            }

            const key = [...selected, ...blueNums].join(",");
            if (!used.has(key)) {
                used.add(key);
                if (lotteryType === "ssq") {
                    sets.push({ red: selected, blue: blueNums[0] });
                } else {
                    sets.push({ front: selected, back: blueNums });
                }
            }
        }

        setRecommendedSets(sets);
    };

    useEffect(() => {
        loadAllData();
    }, [lotteryType]);

    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-400";
        if (score >= 50) return "text-yellow-400";
        return "text-red-400";
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return "bg-green-500/20";
        if (score >= 50) return "bg-yellow-500/20";
        return "bg-red-500/20";
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">综合推荐</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        融合时序预测 · 杀号策略 · 玄学推演 - {lotteryType === "ssq" ? "双色球" : "大乐透"}
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
                        onClick={() => setShowDetails(!showDetails)}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            showDetails ? "bg-primary/10 text-primary" : "bg-muted hover:bg-border"
                        )}
                    >
                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={loadAllData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 综合推算
                    </button>
                </div>
            </div>

            {/* 数据源状态 */}
            <div className="grid grid-cols-3 gap-3">
                <div className={cn(
                    "p-3 rounded-lg border flex items-center gap-2",
                    timeseriesData ? "bg-green-500/10 border-green-500/30" : "bg-muted border-border"
                )}>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">时序预测</span>
                    {timeseriesData && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>
                <div className={cn(
                    "p-3 rounded-lg border flex items-center gap-2",
                    killData ? "bg-green-500/10 border-green-500/30" : "bg-muted border-border"
                )}>
                    <Scissors className="w-4 h-4" />
                    <span className="text-sm">杀号策略</span>
                    {killData && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>
                <div className={cn(
                    "p-3 rounded-lg border flex items-center gap-2",
                    metaphysicalData ? "bg-green-500/10 border-green-500/30" : "bg-muted border-border"
                )}>
                    <Moon className="w-4 h-4" />
                    <span className="text-sm">玄学推演</span>
                    {metaphysicalData && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>
            </div>

            {/* 权重调节 */}
            {showDetails && (
                <div className="glass-card p-4 space-y-4">
                    <h3 className="font-semibold">方法权重</h3>
                    <div className="space-y-3">
                        {[
                            { key: "timeseries", label: "时序预测", icon: <Clock className="w-4 h-4" /> },
                            { key: "kill", label: "杀号策略", icon: <Scissors className="w-4 h-4" /> },
                            { key: "metaphysical", label: "玄学推演", icon: <Moon className="w-4 h-4" /> },
                        ].map(item => (
                            <div key={item.key} className="flex items-center gap-3">
                                {item.icon}
                                <span className="text-sm w-20">{item.label}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={weights[item.key as keyof typeof weights] * 100}
                                    onChange={(e) => setWeights(prev => ({
                                        ...prev,
                                        [item.key]: Number(e.target.value) / 100
                                    }))}
                                    className="flex-1 accent-primary"
                                />
                                <span className="text-sm w-12 text-right">
                                    {Math.round(weights[item.key as keyof typeof weights] * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">正在综合分析...</div>
            ) : (
                <>
                    {/* 号码热度榜 */}
                    {showDetails && redScores.length > 0 && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> 红球热度榜 TOP15
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                                {redScores.slice(0, 15).map((item, idx) => (
                                    <div
                                        key={item.num}
                                        className={cn(
                                            "relative flex flex-col items-center p-2 rounded-lg",
                                            getScoreBg(item.score)
                                        )}
                                    >
                                        <span className="ball ball-red text-xs" style={{ width: 28, height: 28 }}>
                                            {item.num.toString().padStart(2, "0")}
                                        </span>
                                        <span className={cn("text-[10px] mt-1", getScoreColor(item.score))}>
                                            {Math.round(item.score)}分
                                        </span>
                                        <div className="flex gap-0.5 mt-0.5">
                                            {item.sources.map(s => (
                                                <span key={s} className="w-1.5 h-1.5 rounded-full bg-primary/50" title={s} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 蓝球热度 */}
                    {showDetails && blueScores.length > 0 && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-3">蓝球热度</h3>
                            <div className="flex gap-2 flex-wrap">
                                {blueScores.slice(0, 8).map((item) => (
                                    <div
                                        key={item.num}
                                        className={cn(
                                            "flex flex-col items-center p-2 rounded-lg",
                                            getScoreBg(item.score)
                                        )}
                                    >
                                        <span className="ball ball-blue text-xs" style={{ width: 28, height: 28 }}>
                                            {item.num.toString().padStart(2, "0")}
                                        </span>
                                        <span className={cn("text-[10px] mt-1", getScoreColor(item.score))}>
                                            {Math.round(item.score)}分
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 综合推荐号码 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" /> 综合推荐号码
                        </h3>
                        <div className="space-y-3">
                            {recommendedSets.map((set, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 border border-border/50">
                                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-white text-sm font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {(set.red || set.front || []).map((n: number, i: number) => (
                                            <div key={i} className="ball ball-red text-xs" style={{ width: 30, height: 30 }}>
                                                {n.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-muted-foreground">+</span>
                                    {set.blue !== undefined ? (
                                        <div className="ball ball-blue text-xs" style={{ width: 30, height: 30 }}>
                                            {set.blue.toString().padStart(2, "0")}
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            {(set.back || []).map((n: number, i: number) => (
                                                <div key={i} className="ball ball-blue text-xs" style={{ width: 30, height: 30 }}>
                                                    {n.toString().padStart(2, "0")}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        ⚠️ 综合推荐仅供参考，彩票开奖为随机事件
                    </div>
                </>
            )}
        </div>
    );
}
