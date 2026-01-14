"use client";

import React, { useState, useEffect } from "react";
import { Filter, RefreshCw, Table, Grid3X3, BarChart3 } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface NumberStats {
    number: number;
    count: number;
    special_count: number;
    frequency: number;
    wave: "red" | "blue" | "green";
}

interface FrequencyData {
    total: number;
    numbers: NumberStats[];
}

type ViewMode = "table" | "heatmap" | "distribution";

export function HK6BasicAnalysis() {
    const [data, setData] = useState<FrequencyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [limit, setLimit] = useState<number | "">(50);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (limit) params.set("limit", String(limit));

            const res = await fetch(`${API_BASE_URL}/api/analysis/hk6/frequency?${params}`);
            if (!res.ok) throw new Error("获取数据失败");
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // 获取热门号码 TOP5
    const getTopNumbers = (n = 5) => {
        if (!data) return [];
        return [...data.numbers].sort((a, b) => b.count - a.count).slice(0, n);
    };

    // 获取冷门号码 TOP5
    const getColdNumbers = (n = 5) => {
        if (!data) return [];
        return [...data.numbers].sort((a, b) => a.count - b.count).slice(0, n);
    };

    // 获取热力图颜色
    const getHeatColor = (count: number, max: number) => {
        if (count === 0) return "bg-slate-100 dark:bg-slate-800 text-slate-400";
        const ratio = count / max;
        if (ratio > 0.8) return "bg-red-600 text-white";
        if (ratio > 0.6) return "bg-orange-500 text-white";
        if (ratio > 0.4) return "bg-yellow-400 text-slate-900";
        if (ratio > 0.2) return "bg-green-400 text-slate-900";
        return "bg-green-100 text-slate-700";
    };

    // 获取波色颜色类
    const getWaveColorClass = (wave: string) => {
        switch (wave) {
            case "red": return "ball-red";
            case "blue": return "ball-blue";
            case "green": return "ball-green";
            default: return "ball-green";
        }
    };

    const getMaxCount = () => {
        if (!data) return 1;
        return Math.max(...data.numbers.map((n) => n.count)) || 1;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">六合彩 - 基础分析</h2>
                    <p className="text-sm text-muted-foreground mt-1">号码出现频率统计 (1-49)</p>
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
                            <select value={limit} onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}
                                className="px-3 py-1.5 rounded-md bg-muted border border-border text-sm">
                                <option value="">全部</option>
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
            ) : !data || data.total === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无数据，请先同步六合彩开奖数据</div>
            ) : (
                <>
                    {/* 统计概览 + 视图切换 */}
                    <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-4">
                        <span className="text-sm text-muted-foreground">
                            统计样本：{data.total} 期
                        </span>
                        <div className="flex gap-1">
                            {(["table", "heatmap", "distribution"] as ViewMode[]).map((mode) => (
                                <button key={mode} onClick={() => setViewMode(mode)}
                                    className={cn("p-2 rounded-lg", viewMode === mode ? "bg-primary text-primary-foreground" : "bg-muted")}
                                    title={mode === "table" ? "统计表" : mode === "heatmap" ? "热力图" : "分布图"}>
                                    {mode === "table" ? <Table className="w-4 h-4" /> : mode === "heatmap" ? <Grid3X3 className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 热门号码 TOP5 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-3">热门/冷门号码</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-sm text-muted-foreground mb-2 block">🔥 热号 TOP5</span>
                                <div className="flex gap-3">
                                    {getTopNumbers().map((s) => (
                                        <div key={s.number} className="flex flex-col items-center">
                                            <span className={cn("ball", getWaveColorClass(s.wave))}>{s.number.toString().padStart(2, "0")}</span>
                                            <span className="text-xs text-muted-foreground mt-1">{s.count}次</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground mb-2 block">❄️ 冷号 TOP5</span>
                                <div className="flex gap-3">
                                    {getColdNumbers().map((s) => (
                                        <div key={s.number} className="flex flex-col items-center">
                                            <span className={cn("ball", getWaveColorClass(s.wave))}>{s.number.toString().padStart(2, "0")}</span>
                                            <span className="text-xs text-muted-foreground mt-1">{s.count}次</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 统计表 */}
                    {viewMode === "table" && (
                        <div className="glass-card overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <h3 className="font-semibold">号码频率统计表</h3>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">号码</th>
                                            <th className="px-3 py-2 text-center font-medium">波色</th>
                                            <th className="px-3 py-2 text-right font-medium">出现次数</th>
                                            <th className="px-3 py-2 text-right font-medium">其中特码</th>
                                            <th className="px-3 py-2 text-right font-medium">出现频率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.numbers.map((item) => (
                                            <tr key={item.number} className="hover:bg-muted/30">
                                                <td className="px-3 py-2">
                                                    <span className={cn("ball text-xs", getWaveColorClass(item.wave))} style={{ width: 24, height: 24 }}>
                                                        {item.number.toString().padStart(2, "0")}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={cn("px-2 py-0.5 rounded text-xs text-white",
                                                        item.wave === "red" ? "bg-red-500" : item.wave === "blue" ? "bg-blue-500" : "bg-green-500")}>
                                                        {item.wave === "red" ? "红波" : item.wave === "blue" ? "蓝波" : "绿波"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">{item.count}</td>
                                                <td className="px-3 py-2 text-right text-muted-foreground">{item.special_count}</td>
                                                <td className="px-3 py-2 text-right text-muted-foreground">{(item.frequency * 100).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 热力图 - 7x7 网格 */}
                    {viewMode === "heatmap" && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-4">号码热力图 (7×7)</h3>
                            <div className="grid grid-cols-7 gap-1 max-w-lg mx-auto">
                                {data.numbers.map((item) => (
                                    <div key={item.number}
                                        className={cn("aspect-square flex flex-col items-center justify-center rounded text-xs font-medium", getHeatColor(item.count, getMaxCount()))}
                                        title={`${item.number}号: ${item.count}次`}>
                                        <span>{item.number.toString().padStart(2, "0")}</span>
                                        <span className="text-[10px] opacity-70">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                                <span>冷</span>
                                <div className="flex gap-0.5">
                                    <div className="w-6 h-4 bg-green-100 rounded"></div>
                                    <div className="w-6 h-4 bg-green-400 rounded"></div>
                                    <div className="w-6 h-4 bg-yellow-400 rounded"></div>
                                    <div className="w-6 h-4 bg-orange-500 rounded"></div>
                                    <div className="w-6 h-4 bg-red-600 rounded"></div>
                                </div>
                                <span>热</span>
                            </div>
                        </div>
                    )}

                    {/* 分布图 */}
                    {viewMode === "distribution" && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-4">号码出现次数分布</h3>
                            <div className="overflow-x-auto">
                                <div className="min-w-[800px]">
                                    {/* 图表区域 */}
                                    <div className="relative h-64 border-l border-b border-border">
                                        {(() => {
                                            const maxCount = getMaxCount();
                                            const barWidth = 100 / data.numbers.length;
                                            return data.numbers.map((item, index) => {
                                                const barHeight = maxCount > 0 ? Math.round((item.count / maxCount) * 240) : 0;
                                                const bgColor = item.wave === "red" ? "bg-red-500" : item.wave === "blue" ? "bg-blue-500" : "bg-green-500";
                                                return (
                                                    <div
                                                        key={item.number}
                                                        className="absolute bottom-0"
                                                        style={{
                                                            left: `${index * barWidth}%`,
                                                            width: `${barWidth}%`,
                                                            paddingLeft: 1,
                                                            paddingRight: 1,
                                                        }}
                                                    >
                                                        <div
                                                            className={cn("w-full rounded-t transition-colors hover:opacity-80", bgColor)}
                                                            style={{ height: barHeight }}
                                                        />
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                    {/* X轴标签 */}
                                    <div className="flex mt-1">
                                        {data.numbers.map((item) => (
                                            <div key={item.number} className="flex-1 text-center text-[9px] text-muted-foreground">
                                                {item.number}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center text-sm text-muted-foreground mt-2">号码 (按波色着色)</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 波色分布 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-4">波色分布统计</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {["red", "blue", "green"].map((wave) => {
                                const waveNumbers = data.numbers.filter((n) => n.wave === wave);
                                const totalCount = waveNumbers.reduce((sum, n) => sum + n.count, 0);
                                const waveLabel = wave === "red" ? "红波" : wave === "blue" ? "蓝波" : "绿波";
                                const bgClass = wave === "red" ? "bg-red-500" : wave === "blue" ? "bg-blue-500" : "bg-green-500";
                                return (
                                    <div key={wave} className="text-center">
                                        <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-lg font-bold", bgClass)}>
                                            {waveNumbers.length}个
                                        </div>
                                        <div className="mt-2 font-medium">{waveLabel}</div>
                                        <div className="text-sm text-muted-foreground">共{totalCount}次</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
