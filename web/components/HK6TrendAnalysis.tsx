"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Filter, TrendingUp, Palette } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface WaveStats {
    count: number;
    frequency: number;
}

interface WaveData {
    total: number;
    wave_stats: {
        red: WaveStats;
        blue: WaveStats;
        green: WaveStats;
    };
    special_wave: {
        red: WaveStats;
        blue: WaveStats;
        green: WaveStats;
    };
    history: {
        period: string;
        date: string;
        waves: { red: number; blue: number; green: number };
        special_wave: string;
    }[];
}

interface ZodiacStats {
    zodiac: string;
    count: number;
    frequency: number;
}

interface ZodiacData {
    total: number;
    zodiac_stats: ZodiacStats[];
    special_zodiac: ZodiacStats[];
    history: {
        period: string;
        date: string;
        special: number;
        special_zodiac: string;
    }[];
}

type TabMode = "wave" | "zodiac";

export function HK6TrendAnalysis() {
    const [waveData, setWaveData] = useState<WaveData | null>(null);
    const [zodiacData, setZodiacData] = useState<ZodiacData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [limit, setLimit] = useState<number>(50);
    const [showFilters, setShowFilters] = useState(false);
    const [tabMode, setTabMode] = useState<TabMode>("wave");

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set("limit", String(limit));

            const [waveRes, zodiacRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/analysis/hk6/wave?${params}`),
                fetch(`${API_BASE_URL}/api/analysis/hk6/zodiac?${params}`),
            ]);

            if (!waveRes.ok || !zodiacRes.ok) throw new Error("获取数据失败");

            setWaveData(await waveRes.json());
            setZodiacData(await zodiacRes.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // 获取波色颜色
    const getWaveColorClass = (wave: string) => {
        switch (wave) {
            case "red": return "bg-red-500";
            case "blue": return "bg-blue-500";
            case "green": return "bg-green-500";
            default: return "bg-gray-500";
        }
    };

    const getWaveLabel = (wave: string) => {
        switch (wave) {
            case "red": return "红波";
            case "blue": return "蓝波";
            case "green": return "绿波";
            default: return wave;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">六合彩 - 走势分析</h2>
                    <p className="text-sm text-muted-foreground mt-1">波色与生肖统计分析</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-border", showFilters && "bg-primary/10 text-primary")}>
                        <Filter className="w-4 h-4" /> 筛选
                    </button>
                    <button onClick={loadData} disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 刷新
                    </button>
                </div>
            </div>

            {/* 筛选面板 */}
            {showFilters && (
                <div className="glass-card p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">期数:</span>
                            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
                                className="px-3 py-1.5 rounded-md bg-muted border border-border text-sm">
                                <option value="30">最近30期</option>
                                <option value="50">最近50期</option>
                                <option value="100">最近100期</option>
                            </select>
                        </div>
                        <button onClick={loadData} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm">应用</button>
                    </div>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : (!waveData || !zodiacData) ? (
                <div className="text-center py-12 text-muted-foreground">暂无数据，请先同步六合彩开奖数据</div>
            ) : (
                <>
                    {/* 标签切换 */}
                    <div className="glass-card p-1 inline-flex gap-1">
                        <button onClick={() => setTabMode("wave")}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                tabMode === "wave" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                            <Palette className="w-4 h-4" /> 波色分析
                        </button>
                        <button onClick={() => setTabMode("zodiac")}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                tabMode === "zodiac" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                            <TrendingUp className="w-4 h-4" /> 生肖分析
                        </button>
                    </div>

                    {/* 波色分析 */}
                    {tabMode === "wave" && waveData && (
                        <div className="space-y-6">
                            {/* 波色统计总览 */}
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">波色统计总览 ({waveData.total}期)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 六个正码 */}
                                    <div>
                                        <h4 className="text-sm text-muted-foreground mb-3">正码波色分布</h4>
                                        <div className="flex gap-4">
                                            {(["red", "blue", "green"] as const).map((wave) => {
                                                const stats = waveData.wave_stats[wave];
                                                return (
                                                    <div key={wave} className="flex-1 text-center">
                                                        <div className={cn("w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold", getWaveColorClass(wave))}>
                                                            {(stats.frequency * 100).toFixed(0)}%
                                                        </div>
                                                        <div className="mt-2 font-medium text-sm">{getWaveLabel(wave)}</div>
                                                        <div className="text-xs text-muted-foreground">{stats.count}次</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* 特码 */}
                                    <div>
                                        <h4 className="text-sm text-muted-foreground mb-3">特码波色分布</h4>
                                        <div className="flex gap-4">
                                            {(["red", "blue", "green"] as const).map((wave) => {
                                                const stats = waveData.special_wave[wave];
                                                return (
                                                    <div key={wave} className="flex-1 text-center">
                                                        <div className={cn("w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold ring-2 ring-amber-400", getWaveColorClass(wave))}>
                                                            {(stats.frequency * 100).toFixed(0)}%
                                                        </div>
                                                        <div className="mt-2 font-medium text-sm">{getWaveLabel(wave)}</div>
                                                        <div className="text-xs text-muted-foreground">{stats.count}次</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 最近波色走势 */}
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">最近特码波色走势</h3>
                                <div className="flex flex-wrap gap-2">
                                    {waveData.history.slice(0, 20).map((item) => (
                                        <div key={item.period} className="flex flex-col items-center">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", getWaveColorClass(item.special_wave))}>
                                                {getWaveLabel(item.special_wave).charAt(0)}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1">{item.period.slice(-3)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 生肖分析 */}
                    {tabMode === "zodiac" && zodiacData && (
                        <div className="space-y-6">
                            {/* 生肖统计 */}
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">生肖出现频率 ({zodiacData.total}期)</h3>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                    {zodiacData.zodiac_stats.map((item) => {
                                        const maxCount = Math.max(...zodiacData.zodiac_stats.map((z) => z.count));
                                        const ratio = item.count / maxCount;
                                        const bgOpacity = Math.max(0.2, ratio);
                                        return (
                                            <div key={item.zodiac} className="text-center p-3 rounded-lg" style={{ backgroundColor: `rgba(59, 130, 246, ${bgOpacity})` }}>
                                                <div className="text-2xl mb-1">{item.zodiac}</div>
                                                <div className="text-sm font-medium">{item.count}次</div>
                                                <div className="text-xs text-muted-foreground">{(item.frequency * 100).toFixed(1)}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 特码生肖统计 */}
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">特码生肖分布</h3>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                    {zodiacData.special_zodiac.map((item) => {
                                        const maxCount = Math.max(...zodiacData.special_zodiac.map((z) => z.count));
                                        const ratio = maxCount > 0 ? item.count / maxCount : 0;
                                        const bgOpacity = Math.max(0.2, ratio);
                                        return (
                                            <div key={item.zodiac} className="text-center p-3 rounded-lg" style={{ backgroundColor: `rgba(245, 158, 11, ${bgOpacity})` }}>
                                                <div className="text-2xl mb-1">{item.zodiac}</div>
                                                <div className="text-sm font-medium">{item.count}次</div>
                                                <div className="text-xs text-muted-foreground">{(item.frequency * 100).toFixed(1)}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 最近特码生肖走势 */}
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">最近特码生肖走势</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">期号</th>
                                                <th className="px-3 py-2 text-center font-medium">特码</th>
                                                <th className="px-3 py-2 text-center font-medium">生肖</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {zodiacData.history.map((item) => (
                                                <tr key={item.period} className="hover:bg-muted/30">
                                                    <td className="px-3 py-2 text-muted-foreground">{item.period}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                                                            {item.special.toString().padStart(2, "0")}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-lg">{item.special_zodiac}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
