"use client";

import React, { useState, useEffect, useRef } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface TrendData {
    periods: number[];
    red1: number[];
    red2: number[];
    red3: number[];
    red4: number[];
    red5: number[];
    red6: number[];
    blue: number[];
}

// 单行趋势 - 不单独滚动
function TrendRow({
    data,
    maxValue,
    minValue,
    color,
    label,
    width,
}: {
    data: number[];
    maxValue: number;
    minValue: number;
    color: string;
    label: string;
    width: number;
}) {
    const height = 70;
    const paddingTop = 16; // 留出顶部空间显示数字
    const paddingBottom = 4;
    const range = maxValue - minValue || 1;

    const points = data.map((v, i) => {
        const x = 20 + (i / (data.length - 1)) * (width - 40);
        const y = paddingTop + ((maxValue - v) / range) * (height - paddingTop - paddingBottom);
        return { x, y, value: v };
    });

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
        <div className="flex items-center border-b border-border last:border-b-0">
            <div className="w-14 shrink-0 text-xs text-muted-foreground font-medium px-2 py-2">{label}</div>
            <div className="flex-1">
                <svg width={width} height={height} className="block">
                    {/* 中线 */}
                    <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeOpacity={0.05} />
                    {/* 折线 */}
                    <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
                    {/* 数据点和数值 */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r={3} fill={color} />
                            <text
                                x={p.x}
                                y={p.y - 8}
                                fontSize={9}
                                fill="currentColor"
                                textAnchor="middle"
                                className="fill-muted-foreground"
                            >
                                {p.value}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
            <div className="w-12 shrink-0 text-xs text-muted-foreground text-right px-2">
                {minValue}-{maxValue}
            </div>
        </div>
    );
}

export function SSQTrendAnalysis() {
    const [data, setData] = useState<TrendData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState(50);
    const [showFilters, setShowFilters] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chartWidth = data ? Math.max(800, data.periods.length * 18) : 800;

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/analysis/ssq/trend?limit=${limit}`);
            if (!res.ok) throw new Error("获取数据失败");
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 滚动到最右边（最新数据）
    useEffect(() => {
        if (scrollContainerRef.current && data) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [data]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">双色球 - 走势分析</h2>
                    <p className="text-sm text-muted-foreground mt-1">各位置号码走势图</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-border",
                            showFilters && "bg-primary/10 text-primary"
                        )}
                    >
                        <Filter className="w-4 h-4" /> 筛选
                    </button>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 刷新
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="glass-card p-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">期数:</span>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="px-3 py-1.5 rounded-md bg-muted border border-border text-sm"
                        >
                            <option value={30}>最近30期</option>
                            <option value={50}>最近50期</option>
                            <option value={100}>最近100期</option>
                            <option value={200}>最近200期</option>
                        </select>
                        <button onClick={loadData} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm">
                            应用
                        </button>
                    </div>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : !data || data.periods.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无数据</div>
            ) : (
                <>
                    <div className="glass-card p-4">
                        <span className="text-sm text-muted-foreground">
                            显示最近 {data.periods.length} 期走势
                            （{data.periods[0]} ~ {data.periods[data.periods.length - 1]}）
                        </span>
                    </div>

                    {/* 红球走势 - 统一滚动容器 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold">红球走势</h3>
                        </div>
                        <div ref={scrollContainerRef} className="overflow-x-auto">
                            <div style={{ width: chartWidth + 80 }}>
                                <TrendRow data={data.red1} minValue={1} maxValue={11} color="#ef4444" label="位置1" width={chartWidth} />
                                <TrendRow data={data.red2} minValue={2} maxValue={18} color="#ef4444" label="位置2" width={chartWidth} />
                                <TrendRow data={data.red3} minValue={5} maxValue={24} color="#ef4444" label="位置3" width={chartWidth} />
                                <TrendRow data={data.red4} minValue={8} maxValue={28} color="#ef4444" label="位置4" width={chartWidth} />
                                <TrendRow data={data.red5} minValue={15} maxValue={32} color="#ef4444" label="位置5" width={chartWidth} />
                                <TrendRow data={data.red6} minValue={20} maxValue={33} color="#ef4444" label="位置6" width={chartWidth} />
                            </div>
                        </div>
                    </div>

                    {/* 蓝球走势 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold">蓝球走势</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <div style={{ width: chartWidth + 80 }}>
                                <TrendRow data={data.blue} minValue={1} maxValue={16} color="#3b82f6" label="蓝球" width={chartWidth} />
                            </div>
                        </div>
                    </div>

                    {/* 走势表格 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold">详细走势表</h3>
                        </div>
                        <div className="overflow-x-auto max-h-80">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium">期号</th>
                                        <th className="px-2 py-2 text-center text-red-500">位置1</th>
                                        <th className="px-2 py-2 text-center text-red-500">位置2</th>
                                        <th className="px-2 py-2 text-center text-red-500">位置3</th>
                                        <th className="px-2 py-2 text-center text-red-500">位置4</th>
                                        <th className="px-2 py-2 text-center text-red-500">位置5</th>
                                        <th className="px-2 py-2 text-center text-red-500">位置6</th>
                                        <th className="px-2 py-2 text-center text-blue-500">蓝球</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.periods.map((period, i) => (
                                        <tr key={period} className="hover:bg-muted/30">
                                            <td className="px-2 py-1 font-medium">{period}</td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                                                    {data.red1[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                                                    {data.red2[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                                                    {data.red3[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                                                    {data.red4[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                                                    {data.red5[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                                                    {data.red6[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs">
                                                    {data.blue[i].toString().padStart(2, "0")}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
