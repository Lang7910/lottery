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
    red_positions: PositionStats[];
    blue: { number: number; count: number; frequency: number }[];
}

type ViewMode = "table" | "heatmap" | "distribution";

export function SSQBasicAnalysis() {
    const [data, setData] = useState<FrequencyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [weekday, setWeekday] = useState("");
    const [limit, setLimit] = useState<number | "">("");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (weekday) params.set("weekday", weekday);
            if (limit) params.set("limit", String(limit));

            const res = await fetch(`${API_BASE_URL}/api/analysis/ssq/frequency?${params}`);
            if (!res.ok) throw new Error("获取数据失败");
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // 计算红球总出现次数
    const getRedTotalCounts = () => {
        if (!data) return [];
        const totals: { number: number; count: number }[] = [];
        for (let num = 1; num <= 33; num++) {
            let total = 0;
            data.red_positions.forEach((pos) => {
                const stat = pos.stats.find((s) => s.number === num);
                if (stat) total += stat.count;
            });
            totals.push({ number: num, count: total });
        }
        return totals;
    };

    // 获取热门号码 TOP5
    const getTopNumbers = (stats: { number: number; count: number }[], n = 5) => {
        return [...stats].sort((a, b) => b.count - a.count).slice(0, n);
    };

    // 获取热力图颜色
    const getHeatColor = (count: number, max: number) => {
        if (count === 0) return "bg-slate-100 dark:bg-slate-800 text-slate-400";
        const ratio = count / max;
        if (ratio > 0.8) return "bg-blue-600 text-white";
        if (ratio > 0.6) return "bg-blue-500 text-white";
        if (ratio > 0.4) return "bg-cyan-400 text-slate-900";
        if (ratio > 0.2) return "bg-yellow-300 text-slate-900";
        return "bg-yellow-100 text-slate-700";
    };

    const getMaxCount = () => {
        if (!data) return 1;
        let max = 0;
        data.red_positions.forEach((pos) => pos.stats.forEach((s) => { if (s.count > max) max = s.count; }));
        return max || 1;
    };

    // 获取频率渐变色 (从冷色到暖色的连续渐变，优化文字对比度)
    const getFrequencyColor = (value: number, max: number): React.CSSProperties => {
        if (value === 0 || max === 0) return {};
        const ratio = Math.min(value / max, 1);
        // HSL 色相从 200(蓝) 渐变到 0(红)
        const hue = Math.round(200 - ratio * 200);
        const saturation = 60 + ratio * 30;
        // 使用更深的背景色保证白色文字可读
        const lightness = 75 - ratio * 40;
        return {
            backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            color: '#000',
            fontWeight: ratio > 0.5 ? 600 : 400
        };
    };

    // 获取蓝球频率渐变色
    const getBlueFrequencyColor = (value: number, max: number): React.CSSProperties => {
        if (value === 0 || max === 0) return {};
        const ratio = Math.min(value / max, 1);
        const lightness = 80 - ratio * 40;
        return {
            backgroundColor: `hsl(210, 70%, ${lightness}%)`,
            color: ratio > 0.6 ? '#fff' : '#000',
            fontWeight: ratio > 0.5 ? 600 : 400
        };
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">双色球 - 基础分析</h2>
                    <p className="text-sm text-muted-foreground mt-1">各位置号码出现频率统计</p>
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
                            <span className="text-sm text-muted-foreground">星期:</span>
                            <select value={weekday} onChange={(e) => setWeekday(e.target.value)}
                                className="px-3 py-1.5 rounded-md bg-muted border border-border text-sm">
                                <option value="">全部</option>
                                <option value="二">星期二</option>
                                <option value="四">星期四</option>
                                <option value="日">星期日</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">期数:</span>
                            <input type="number" placeholder="全部" value={limit}
                                onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}
                                className="w-24 px-3 py-1.5 rounded-md bg-muted border border-border text-sm" />
                        </div>
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
                    {/* 统计概览 + 视图切换 */}
                    <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-4">
                        <span className="text-sm text-muted-foreground">
                            统计样本：{data.total} 期 {weekday && `(星期${weekday})`}
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
                        <h3 className="font-semibold mb-3">热门号码 TOP5</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground mb-2 block">红球综合</span>
                                <div className="flex gap-2">
                                    {getTopNumbers(getRedTotalCounts()).map((s, i) => (
                                        <div key={s.number} className="flex flex-col items-center">
                                            <span className="ball ball-red">{s.number.toString().padStart(2, "0")}</span>
                                            <span className="text-xs text-muted-foreground mt-1">{s.count}次</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground mb-2 block">蓝球</span>
                                <div className="flex gap-2">
                                    {getTopNumbers(data.blue).map((s) => (
                                        <div key={s.number} className="flex flex-col items-center">
                                            <span className="ball ball-blue">{s.number.toString().padStart(2, "0")}</span>
                                            <span className="text-xs text-muted-foreground mt-1">{s.count}次</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 完整统计表 */}
                    {viewMode === "table" && (
                        <div className="glass-card overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <h3 className="font-semibold">红球位置统计表</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="px-2 py-2 text-left font-medium border-r border-border">号码</th>
                                            {[1, 2, 3, 4, 5, 6].map((pos) => (
                                                <th key={pos} colSpan={2} className="px-2 py-2 text-center font-medium border-r border-border">位置{pos}</th>
                                            ))}
                                            <th colSpan={2} className="px-2 py-2 text-center font-medium text-blue-500">蓝球</th>
                                        </tr>
                                        <tr className="text-muted-foreground">
                                            <th className="border-r border-border"></th>
                                            {[1, 2, 3, 4, 5, 6].map((pos) => (
                                                <React.Fragment key={pos}><th className="px-1 py-1 text-right">次</th><th className="px-1 py-1 text-right border-r border-border">频率</th></React.Fragment>
                                            ))}
                                            <th className="px-1 py-1 text-right">次</th><th className="px-1 py-1 text-right">频率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(() => {
                                            const maxCount = getMaxCount();
                                            const blueMaxCount = Math.max(...data.blue.map(b => b.count));
                                            return Array.from({ length: 33 }, (_, i) => i + 1).map((num) => {
                                                const blueItem = num <= 16 ? data.blue.find((b) => b.number === num) : null;
                                                return (
                                                    <tr key={num} className="hover:bg-muted/30">
                                                        <td className="px-2 py-1 border-r border-border">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">{num.toString().padStart(2, "0")}</span>
                                                        </td>
                                                        {data.red_positions.map((pos) => {
                                                            const stat = pos.stats.find((s) => s.number === num);
                                                            const count = stat?.count || 0;
                                                            return (
                                                                <React.Fragment key={pos.position}>
                                                                    <td className="px-1 py-1 text-right text-sm" style={getFrequencyColor(count, maxCount)}>{count}</td>
                                                                    <td className="px-1 py-1 text-right text-sm border-r border-border" style={getFrequencyColor(count, maxCount)}>{stat ? (stat.frequency * 100).toFixed(2) : "0.00"}%</td>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                        <td className="px-1 py-1 text-right text-sm" style={blueItem ? getBlueFrequencyColor(blueItem.count, blueMaxCount) : {}}>{blueItem?.count ?? "-"}</td>
                                                        <td className="px-1 py-1 text-right text-sm" style={blueItem ? getBlueFrequencyColor(blueItem.count, blueMaxCount) : {}}>{blueItem ? (blueItem.frequency * 100).toFixed(2) + "%" : "-"}</td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 热力图 */}
                    {viewMode === "heatmap" && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-4">红球号码热力图</h3>
                            <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                    <div className="flex mb-1">
                                        <div className="w-10 shrink-0"></div>
                                        {[1, 2, 3, 4, 5, 6].map((pos) => (
                                            <div key={pos} className="flex-1 text-center text-xs font-medium text-muted-foreground">位置{pos}</div>
                                        ))}
                                    </div>
                                    {Array.from({ length: 33 }, (_, i) => i + 1).map((num) => (
                                        <div key={num} className="flex mb-0.5">
                                            <div className="w-10 shrink-0 flex items-center text-xs text-muted-foreground">{num.toString().padStart(2, "0")}</div>
                                            {data.red_positions.map((pos) => {
                                                const stat = pos.stats.find((s) => s.number === num);
                                                const count = stat?.count || 0;
                                                return (
                                                    <div key={pos.position} className={cn("flex-1 h-6 flex items-center justify-center text-xs font-medium mx-0.5 rounded", getHeatColor(count, getMaxCount()))}>
                                                        {count}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                                        <span>低</span>
                                        <div className="flex gap-0.5">
                                            <div className="w-6 h-4 bg-yellow-100 rounded"></div>
                                            <div className="w-6 h-4 bg-yellow-300 rounded"></div>
                                            <div className="w-6 h-4 bg-cyan-400 rounded"></div>
                                            <div className="w-6 h-4 bg-blue-500 rounded"></div>
                                            <div className="w-6 h-4 bg-blue-600 rounded"></div>
                                        </div>
                                        <span>高</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 红球分布图 */}
                    {viewMode === "distribution" && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-4">红球号码分布 (总出现次数)</h3>
                            <div className="overflow-x-auto">
                                <div className="min-w-[700px]">
                                    {/* 图表区域 - 使用绝对定位 */}
                                    <div className="relative h-64 border-l border-b border-border">
                                        {(() => {
                                            const counts = getRedTotalCounts();
                                            const maxCount = Math.max(...counts.map((t) => t.count));
                                            const barWidth = 100 / counts.length;
                                            return counts.map((item, index) => {
                                                // 使用像素高度，最大240px
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
                                        {getRedTotalCounts().map((item) => (
                                            <div key={item.number} className="flex-1 text-center text-[9px] text-muted-foreground">
                                                {item.count}
                                            </div>
                                        ))}
                                    </div>
                                    {/* X轴标签 */}
                                    <div className="flex">
                                        {getRedTotalCounts().map((item) => (
                                            <div key={item.number} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">
                                                {item.number}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center text-sm text-muted-foreground mt-2">号码</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 蓝球分布 - 独立的卡片 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-4">蓝球分布</h3>
                        {/* 图表区域 - 使用绝对定位 */}
                        <div className="relative h-48 border-l border-b border-border mb-2">
                            {(() => {
                                const maxCount = Math.max(...data.blue.map((b) => b.count));
                                const barWidth = 100 / data.blue.length;
                                return data.blue.map((item, index) => {
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
                                                className="w-full bg-blue-600 hover:bg-blue-500 rounded-t transition-colors"
                                                style={{ height: barHeight }}
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        {/* 数值和标签 */}
                        <div className="flex">
                            {data.blue.map((item) => (
                                <div key={item.number} className="flex-1 flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground mb-1">{item.count}</span>
                                    <div className="ball ball-blue text-xs" style={{ width: 24, height: 24 }}>
                                        {item.number.toString().padStart(2, "0")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
