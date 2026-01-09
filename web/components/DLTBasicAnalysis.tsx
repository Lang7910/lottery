"use client";

import React, { useState, useEffect } from "react";
import { Filter, RefreshCw, Table, Grid3X3, BarChart3 } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface PositionStats {
    position: number;
    stats: { number: number; count: number; frequency: number }[];
}

interface FrequencyData {
    total: number;
    front_positions: PositionStats[];
    back_positions: PositionStats[];
}

type ViewMode = "table" | "heatmap" | "distribution";

export function DLTBasicAnalysis() {
    const [data, setData] = useState<FrequencyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState<number | "">("");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (limit) params.set("limit", String(limit));
            const res = await fetch(`${API_BASE_URL}/api/analysis/dlt/frequency?${params}`);
            if (!res.ok) throw new Error("获取数据失败");
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const getFrontTotalCounts = () => {
        if (!data) return [];
        return Array.from({ length: 35 }, (_, i) => {
            const num = i + 1;
            let total = 0;
            data.front_positions.forEach((pos) => {
                const stat = pos.stats.find((s) => s.number === num);
                if (stat) total += stat.count;
            });
            return { number: num, count: total };
        });
    };

    const getBackTotalCounts = () => {
        if (!data) return [];
        return Array.from({ length: 12 }, (_, i) => {
            const num = i + 1;
            let total = 0;
            data.back_positions.forEach((pos) => {
                const stat = pos.stats.find((s) => s.number === num);
                if (stat) total += stat.count;
            });
            return { number: num, count: total };
        });
    };

    const getHeatColor = (count: number, max: number) => {
        if (count === 0) return "bg-slate-100 dark:bg-slate-800";
        const ratio = count / max;
        if (ratio > 0.8) return "bg-red-600 text-white";
        if (ratio > 0.6) return "bg-red-500 text-white";
        if (ratio > 0.4) return "bg-orange-400 text-slate-900";
        if (ratio > 0.2) return "bg-yellow-300 text-slate-900";
        return "bg-yellow-100 text-slate-700";
    };

    const getMaxFrontCount = () => {
        if (!data) return 1;
        let max = 0;
        data.front_positions.forEach((pos) => pos.stats.forEach((s) => { if (s.count > max) max = s.count; }));
        return max || 1;
    };

    const getMaxBackCount = () => {
        if (!data) return 1;
        let max = 0;
        data.back_positions.forEach((pos) => pos.stats.forEach((s) => { if (s.count > max) max = s.count; }));
        return max || 1;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">大乐透 - 基础分析</h2>
                    <p className="text-sm text-muted-foreground mt-1">各位置号码出现频率统计</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-border", showFilters && "bg-primary/10 text-primary")}>
                        <Filter className="w-4 h-4" /> 筛选
                    </button>
                    <button onClick={loadData} disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50">
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 刷新
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="glass-card p-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">期数:</span>
                        <input type="number" placeholder="全部" value={limit}
                            onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}
                            className="w-24 px-3 py-1.5 rounded-md bg-muted border border-border text-sm" />
                        <button onClick={loadData} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm">应用</button>
                    </div>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : !data || data.total === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无数据</div>
            ) : (
                <>
                    <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-4">
                        <span className="text-sm text-muted-foreground">统计样本：{data.total} 期</span>
                        <div className="flex gap-1">
                            {(["table", "heatmap", "distribution"] as ViewMode[]).map((mode) => (
                                <button key={mode} onClick={() => setViewMode(mode)}
                                    className={cn("p-2 rounded-lg", viewMode === mode ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                    {mode === "table" ? <Table className="w-4 h-4" /> : mode === "heatmap" ? <Grid3X3 className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 统计表 */}
                    {viewMode === "table" && (
                        <>
                            <div className="glass-card overflow-hidden">
                                <div className="p-4 border-b border-border"><h3 className="font-semibold">前区位置统计表 (1-35)</h3></div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-2 py-2 text-left border-r border-border">号码</th>
                                                {[1, 2, 3, 4, 5].map((pos) => (
                                                    <th key={pos} colSpan={2} className="px-2 py-2 text-center border-r border-border">位置{pos}</th>
                                                ))}
                                            </tr>
                                            <tr className="text-muted-foreground">
                                                <th className="border-r border-border"></th>
                                                {[1, 2, 3, 4, 5].map((pos) => (
                                                    <React.Fragment key={pos}>
                                                        <th className="px-1 py-1 text-right">次</th>
                                                        <th className="px-1 py-1 text-right border-r border-border">频率</th>
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {Array.from({ length: 35 }, (_, i) => i + 1).map((num) => (
                                                <tr key={num} className="hover:bg-muted/30">
                                                    <td className="px-2 py-1 border-r border-border">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">{num.toString().padStart(2, "0")}</span>
                                                    </td>
                                                    {data.front_positions.map((pos) => {
                                                        const stat = pos.stats.find((s) => s.number === num);
                                                        return (
                                                            <React.Fragment key={pos.position}>
                                                                <td className="px-1 py-1 text-right text-muted-foreground">{stat?.count || 0}</td>
                                                                <td className="px-1 py-1 text-right text-muted-foreground border-r border-border">{stat ? (stat.frequency * 100).toFixed(2) : "0.00"}%</td>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="glass-card overflow-hidden">
                                <div className="p-4 border-b border-border"><h3 className="font-semibold">后区位置统计表 (1-12)</h3></div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-2 py-2 text-left border-r border-border">号码</th>
                                                {[1, 2].map((pos) => (
                                                    <th key={pos} colSpan={2} className="px-2 py-2 text-center border-r border-border">位置{pos}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                                                <tr key={num} className="hover:bg-muted/30">
                                                    <td className="px-2 py-1 border-r border-border">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs">{num.toString().padStart(2, "0")}</span>
                                                    </td>
                                                    {data.back_positions.map((pos) => {
                                                        const stat = pos.stats.find((s) => s.number === num);
                                                        return (
                                                            <React.Fragment key={pos.position}>
                                                                <td className="px-1 py-1 text-right text-muted-foreground">{stat?.count || 0}</td>
                                                                <td className="px-1 py-1 text-right text-muted-foreground border-r border-border">{stat ? (stat.frequency * 100).toFixed(2) : "0.00"}%</td>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* 热力图 */}
                    {viewMode === "heatmap" && (
                        <>
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">前区号码热力图</h3>
                                <div className="overflow-x-auto">
                                    <div className="min-w-[500px]">
                                        <div className="flex mb-1">
                                            <div className="w-10 shrink-0"></div>
                                            {[1, 2, 3, 4, 5].map((pos) => (
                                                <div key={pos} className="flex-1 text-center text-xs font-medium text-muted-foreground">位置{pos}</div>
                                            ))}
                                        </div>
                                        {Array.from({ length: 35 }, (_, i) => i + 1).map((num) => (
                                            <div key={num} className="flex mb-0.5">
                                                <div className="w-10 shrink-0 flex items-center text-xs text-muted-foreground">{num.toString().padStart(2, "0")}</div>
                                                {data.front_positions.map((pos) => {
                                                    const stat = pos.stats.find((s) => s.number === num);
                                                    const count = stat?.count || 0;
                                                    return (
                                                        <div key={pos.position} className={cn("flex-1 h-5 flex items-center justify-center text-xs font-medium mx-0.5 rounded", getHeatColor(count, getMaxFrontCount()))}>
                                                            {count}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">后区号码热力图</h3>
                                <div className="flex mb-1">
                                    <div className="w-10 shrink-0"></div>
                                    {[1, 2].map((pos) => (<div key={pos} className="flex-1 text-center text-xs font-medium text-muted-foreground">位置{pos}</div>))}
                                </div>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                                    <div key={num} className="flex mb-0.5">
                                        <div className="w-10 shrink-0 flex items-center text-xs text-muted-foreground">{num.toString().padStart(2, "0")}</div>
                                        {data.back_positions.map((pos) => {
                                            const stat = pos.stats.find((s) => s.number === num);
                                            const count = stat?.count || 0;
                                            return (
                                                <div key={pos.position} className={cn("flex-1 h-6 flex items-center justify-center text-xs font-medium mx-0.5 rounded", getHeatColor(count, getMaxBackCount()))}>
                                                    {count}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* 分布图 */}
                    {viewMode === "distribution" && (
                        <>
                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">前区号码分布 (总出现次数)</h3>
                                <div className="overflow-x-auto">
                                    <div className="min-w-[700px]">
                                        {/* 图表区域 - 使用绝对定位 */}
                                        <div className="relative h-64 border-l border-b border-border">
                                            {(() => {
                                                const counts = getFrontTotalCounts();
                                                const maxCount = Math.max(...counts.map((t) => t.count));
                                                const barWidth = 100 / counts.length;
                                                return counts.map((item, index) => {
                                                    const barHeight = maxCount > 0 ? Math.round((item.count / maxCount) * 240) : 0;
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
                                                                className="w-full bg-red-500 hover:bg-red-400 rounded-t transition-colors"
                                                                style={{ height: barHeight }}
                                                            />
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        {/* 数值标签 */}
                                        <div className="flex mt-1">
                                            {getFrontTotalCounts().map((item) => (
                                                <div key={item.number} className="flex-1 text-center text-[9px] text-muted-foreground">
                                                    {item.count}
                                                </div>
                                            ))}
                                        </div>
                                        {/* X轴标签 */}
                                        <div className="flex">
                                            {getFrontTotalCounts().map((item) => (
                                                <div key={item.number} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">
                                                    {item.number}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-4">
                                <h3 className="font-semibold mb-4">后区号码分布</h3>
                                {/* 图表区域 - 使用绝对定位 */}
                                <div className="relative h-48 border-l border-b border-border mb-2">
                                    {(() => {
                                        const counts = getBackTotalCounts();
                                        const maxCount = Math.max(...counts.map((t) => t.count));
                                        const barWidth = 100 / counts.length;
                                        return counts.map((item, index) => {
                                            const barHeight = maxCount > 0 ? Math.round((item.count / maxCount) * 180) : 0;
                                            return (
                                                <div
                                                    key={item.number}
                                                    className="absolute bottom-0"
                                                    style={{
                                                        left: `${index * barWidth}%`,
                                                        width: `${barWidth}%`,
                                                        paddingLeft: 4,
                                                        paddingRight: 4,
                                                    }}
                                                >
                                                    <div
                                                        className="w-full bg-blue-500 hover:bg-blue-400 rounded-t transition-colors"
                                                        style={{ height: barHeight }}
                                                    />
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                                {/* 数值和标签 */}
                                <div className="flex">
                                    {getBackTotalCounts().map((item) => (
                                        <div key={item.number} className="flex-1 flex flex-col items-center">
                                            <span className="text-xs text-muted-foreground mb-1">{item.count}</span>
                                            <div className="ball ball-back text-xs" style={{ width: 24, height: 24 }}>
                                                {item.number.toString().padStart(2, "0")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
