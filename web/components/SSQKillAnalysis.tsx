"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Scissors, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Eye, Table2, ChevronLeft, ChevronRight, Zap, Target, Shield, BarChart } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface MethodStats {
    success_rate: number;
    avg_kills: number;
    max_kills: number;
    min_kills: number;
    efficiency: number;
}

interface KillResult {
    kills: number[];
    success?: boolean | null;
    name?: string;
}

interface HistoryItem {
    period: string;
    red_balls: number[];
    blue: number;
    red_kills: Record<string, KillResult>;
    blue_kills: Record<string, KillResult>;
    red_success_count: number;
}

interface RecommendedSet {
    red: number[];
    blue: number;
}

interface Strategy {
    name: string;
    description: string;
    methods_used?: number[];
    sets: RecommendedSet[];
}

interface KillData {
    history: HistoryItem[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
    };
    red_method_names: Record<string, string>;
    blue_method_names: Record<string, string>;
    red_stats: Record<string, MethodStats>;
    blue_stats: Record<string, MethodStats>;
    summary_stats: {
        total_periods: number;
        max_total_kills: number;
        min_total_kills: number;
        avg_total_kills: number;
        all_methods_success: number;
        methods_success_10: number;
        methods_success_15: number;
        combined_success_rate: number;
    };
    next_prediction: {
        period: string;
        red_kills: Record<string, KillResult & MethodStats>;
        blue_kills: Record<string, KillResult & MethodStats>;
        priority_kills: {
            high: number[];
            medium: number[];
            low: number[];
        };
        available_reds: number[];
        available_blues: number[];
        killed_red_count: number;
        killed_blue_count: number;
    };
    recommended_sets: Record<string, Strategy>;
}

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
    random: <Sparkles className="w-4 h-4" />,
    high_success: <Target className="w-4 h-4" />,
    high_efficiency: <Zap className="w-4 h-4" />,
    multi_kill: <BarChart className="w-4 h-4" />,
    conservative: <Shield className="w-4 h-4" />,
};

export function SSQKillAnalysis() {
    const [data, setData] = useState<KillData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lookback, setLookback] = useState(100);
    const [customLookback, setCustomLookback] = useState("");
    const [numSets, setNumSets] = useState(5);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [showAllMethods, setShowAllMethods] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [activeStrategy, setActiveStrategy] = useState("random");

    const loadData = async (newPage: number = page) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/analysis/ssq/kill?lookback=${lookback}&num_sets=${numSets}&page=${newPage}&page_size=${pageSize}`
            );
            if (!res.ok) throw new Error("获取杀号数据失败");
            const result = await res.json();
            setData(result);
            setPage(newPage);
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(1);
    }, []);

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 80) return "text-green-500";
        if (rate >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getEfficiencyColor = (eff: number) => {
        if (eff >= 1.5) return "text-green-500";
        if (eff >= 0.8) return "text-yellow-500";
        return "text-muted-foreground";
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">双色球 - 杀号策略</h2>
                    <p className="text-sm text-muted-foreground mt-1">17种红球杀号 + 6种蓝球杀号方法</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <select
                        value={[50, 100, 200, 500].includes(lookback) ? lookback : "custom"}
                        onChange={(e) => {
                            if (e.target.value === "custom") {
                                setCustomLookback(lookback.toString());
                            } else {
                                setLookback(Number(e.target.value));
                                setCustomLookback("");
                            }
                        }}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={50}>最近50期</option>
                        <option value={100}>最近100期</option>
                        <option value={200}>最近200期</option>
                        <option value={500}>最近500期</option>
                        <option value="custom">自定义</option>
                    </select>
                    {(customLookback || ![50, 100, 200, 500].includes(lookback)) && (
                        <input
                            type="number"
                            value={customLookback || lookback}
                            onChange={(e) => {
                                const val = e.target.value;
                                setCustomLookback(val);
                                const num = parseInt(val);
                                if (num >= 20 && num <= 2000) {
                                    setLookback(num);
                                }
                            }}
                            placeholder="20-2000"
                            min={20}
                            max={2000}
                            className="w-20 px-2 py-2 rounded-lg bg-muted border border-border text-sm"
                        />
                    )}
                    <select
                        value={numSets}
                        onChange={(e) => setNumSets(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={3}>每策略3注</option>
                        <option value={5}>每策略5注</option>
                        <option value={10}>每策略10注</option>
                    </select>
                    <button
                        onClick={() => loadData(1)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 计算
                    </button>
                </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading && !data ? (
                <div className="text-center py-12 text-muted-foreground">计算中...</div>
            ) : data && (
                <>
                    {/* 综合统计 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <BarChart className="w-4 h-4" /> 综合统计
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold text-foreground">{data.summary_stats.avg_total_kills}</div>
                                <div className="text-xs text-muted-foreground">平均杀号数</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold text-foreground">{data.summary_stats.combined_success_rate}%</div>
                                <div className="text-xs text-muted-foreground">全部成功率</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold text-green-500">{data.summary_stats.methods_success_15}</div>
                                <div className="text-xs text-muted-foreground">≥15方法成功</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold text-yellow-500">{data.summary_stats.methods_success_10}</div>
                                <div className="text-xs text-muted-foreground">≥10方法成功</div>
                            </div>
                        </div>
                    </div>

                    {/* 多策略推荐号码 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold">推荐号码（多策略）</h3>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(data.recommended_sets).map(([key, strategy]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveStrategy(key)}
                                        className={cn(
                                            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                            activeStrategy === key
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted hover:bg-border"
                                        )}
                                    >
                                        {STRATEGY_ICONS[key]}
                                        {strategy.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {data.recommended_sets[activeStrategy] && (
                            <div className="p-4">
                                <p className="text-xs text-muted-foreground mb-3">
                                    {data.recommended_sets[activeStrategy].description}
                                    {data.recommended_sets[activeStrategy].methods_used && (
                                        <span className="ml-2 text-primary">
                                            使用方法: {data.recommended_sets[activeStrategy].methods_used.join(", ")}
                                        </span>
                                    )}
                                </p>
                                <div className="space-y-3">
                                    {data.recommended_sets[activeStrategy].sets.map((set, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <div className="flex gap-1.5">
                                                {set.red.map((n, i) => (
                                                    <div key={i} className="ball ball-red text-xs" style={{ width: 28, height: 28 }}>
                                                        {n.toString().padStart(2, "0")}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-muted-foreground text-xs">+</span>
                                            <div className="ball ball-blue text-xs" style={{ width: 28, height: 28 }}>
                                                {set.blue.toString().padStart(2, "0")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 杀号预测详情 */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Scissors className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">下期杀号预测</h3>
                                <span className="text-xs text-muted-foreground">基于 {data.next_prediction.period} 期</span>
                            </div>
                            <button
                                onClick={() => setShowAllMethods(!showAllMethods)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded text-xs",
                                    showAllMethods ? "bg-primary/10 text-primary" : "bg-muted hover:bg-border"
                                )}
                            >
                                <Eye className="w-3 h-3" />
                                {showAllMethods ? "收起" : "展开全部方法"}
                            </button>
                        </div>

                        {/* 综合杀号 */}
                        <div className="mb-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-accent" />
                                <span className="text-sm font-medium">综合杀号</span>
                                <span className="text-xs text-muted-foreground">
                                    (红球: 已杀{data.next_prediction.killed_red_count}个, 剩余{data.next_prediction.available_reds.length}个 | 蓝球: 已杀{data.next_prediction.killed_blue_count}个, 剩余{data.next_prediction.available_blues.length}个)
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">重点杀(≥4):</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {data.next_prediction.priority_kills.high.map(n => (
                                            <span key={n} className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                                                {n.toString().padStart(2, "0")}
                                            </span>
                                        ))}
                                        {data.next_prediction.priority_kills.high.length === 0 && <span className="text-xs text-muted-foreground">无</span>}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">红球可选:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {data.next_prediction.available_reds.slice(0, 15).map(n => (
                                            <span key={n} className="w-5 h-5 rounded-full bg-green-500/80 text-white text-[10px] flex items-center justify-center">
                                                {n}
                                            </span>
                                        ))}
                                        {data.next_prediction.available_reds.length > 15 && (
                                            <span className="text-xs text-muted-foreground">...共{data.next_prediction.available_reds.length}个</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">蓝球可选:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {data.next_prediction.available_blues.map(n => (
                                            <span key={n} className="w-5 h-5 rounded-full bg-blue-500/80 text-white text-[10px] flex items-center justify-center">
                                                {n}
                                            </span>
                                        ))}
                                        {data.next_prediction.available_blues.length === 0 && (
                                            <span className="text-xs text-muted-foreground">无</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 方法详情表格 */}
                        {showAllMethods && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-3">红球杀号 (17种方法)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">#</th>
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">方法</th>
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">杀号</th>
                                                    <th className="text-center py-2 px-1 font-medium text-muted-foreground">平均杀</th>
                                                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">成功率</th>
                                                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">效率</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(data.next_prediction.red_kills).map(([m, k]) => (
                                                    <tr key={m} className="border-b border-border/50 hover:bg-muted/30">
                                                        <td className="py-1.5 px-1 text-muted-foreground">{m}</td>
                                                        <td className="py-1.5 px-1 max-w-[120px] truncate">{k.name}</td>
                                                        <td className="py-1.5 px-1">
                                                            <div className="flex gap-0.5 flex-wrap">
                                                                {k.kills.slice(0, 5).map(n => (
                                                                    <span key={n} className="ball ball-red" style={{ width: 18, height: 18, fontSize: 9 }}>
                                                                        {n}
                                                                    </span>
                                                                ))}
                                                                {k.kills.length > 5 && <span className="text-muted-foreground">+{k.kills.length - 5}</span>}
                                                                {k.kills.length === 0 && <span className="text-muted-foreground">-</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-1.5 px-1 text-center">{k.avg_kills}</td>
                                                        <td className="py-1.5 px-1 text-right">
                                                            <span className={getSuccessRateColor(k.success_rate)}>{k.success_rate}%</span>
                                                        </td>
                                                        <td className="py-1.5 px-1 text-right">
                                                            <span className={getEfficiencyColor(k.efficiency)}>{k.efficiency}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-3">蓝球杀号 (6种方法)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">#</th>
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">方法</th>
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">杀号</th>
                                                    <th className="text-center py-2 px-1 font-medium text-muted-foreground">平均</th>
                                                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">成功率</th>
                                                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">效率</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(data.next_prediction.blue_kills).map(([m, k]) => (
                                                    <tr key={m} className="border-b border-border/50 hover:bg-muted/30">
                                                        <td className="py-1.5 px-1 text-muted-foreground">{m}</td>
                                                        <td className="py-1.5 px-1">{k.name}</td>
                                                        <td className="py-1.5 px-1">
                                                            <div className="flex gap-0.5">
                                                                {k.kills.map(n => (
                                                                    <span key={n} className="ball ball-blue" style={{ width: 18, height: 18, fontSize: 9 }}>
                                                                        {n}
                                                                    </span>
                                                                ))}
                                                                {k.kills.length === 0 && <span className="text-muted-foreground">-</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-1.5 px-1 text-center">{k.avg_kills}</td>
                                                        <td className="py-1.5 px-1 text-right">
                                                            <span className={getSuccessRateColor(k.success_rate)}>{k.success_rate}%</span>
                                                        </td>
                                                        <td className="py-1.5 px-1 text-right">
                                                            <span className={getEfficiencyColor(k.efficiency)}>{k.efficiency}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 历史记录 */}
                    <div className="glass-card overflow-hidden">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Table2 className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">历史杀号记录</h3>
                                <span className="text-xs text-muted-foreground">
                                    第 {data.pagination.page}/{data.pagination.total_pages} 页, 共 {data.pagination.total} 期
                                </span>
                            </div>
                            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showHistory && (
                            <>
                                <div className="border-t border-border overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="py-2 px-2 text-left font-medium sticky left-0 bg-muted/30">期号</th>
                                                <th className="py-2 px-2 text-left font-medium">开奖号码</th>
                                                <th className="py-2 px-2 text-center font-medium">成功数</th>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(m => (
                                                    <th key={m} className="py-2 px-1 text-center font-medium" title={data.red_method_names[m.toString()]}>
                                                        红{m}
                                                    </th>
                                                ))}
                                                {[1, 2, 3].map(m => (
                                                    <th key={m} className="py-2 px-1 text-center font-medium" title={data.blue_method_names[m.toString()]}>
                                                        蓝{m}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.history.map((h, idx) => (
                                                <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                                                    <td className="py-2 px-2 font-medium sticky left-0 bg-background">{h.period}</td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex gap-0.5 items-center">
                                                            {h.red_balls.map((n, i) => (
                                                                <span key={i} className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                                                                    {n}
                                                                </span>
                                                            ))}
                                                            <span className="mx-0.5 text-muted-foreground">+</span>
                                                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                                                                {h.blue}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                            h.red_success_count >= 15 ? "bg-green-500/20 text-green-500" :
                                                                h.red_success_count >= 10 ? "bg-yellow-500/20 text-yellow-500" :
                                                                    "bg-red-500/20 text-red-500"
                                                        )}>
                                                            {h.red_success_count}/17
                                                        </span>
                                                    </td>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(m => {
                                                        const k = h.red_kills[m.toString()];
                                                        return (
                                                            <td key={m} className="py-2 px-1 text-center">
                                                                {k?.success === true && <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto" />}
                                                                {k?.success === false && <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto" />}
                                                                {(k?.success === null || k?.success === undefined) && <span className="text-muted-foreground">-</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    {[1, 2, 3].map(m => {
                                                        const k = h.blue_kills[m.toString()];
                                                        return (
                                                            <td key={m} className="py-2 px-1 text-center">
                                                                {k?.success === true && <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto" />}
                                                                {k?.success === false && <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto" />}
                                                                {(k?.success === null || k?.success === undefined) && <span className="text-muted-foreground">-</span>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 分页 */}
                                <div className="p-3 border-t border-border flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        显示 {(data.pagination.page - 1) * data.pagination.page_size + 1} - {Math.min(data.pagination.page * data.pagination.page_size, data.pagination.total)} 条
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => loadData(data.pagination.page - 1)}
                                            disabled={data.pagination.page <= 1 || loading}
                                            className="p-1.5 rounded bg-muted hover:bg-border disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {[...Array(Math.min(5, data.pagination.total_pages))].map((_, i) => {
                                            let pageNum: number;
                                            if (data.pagination.total_pages <= 5) {
                                                pageNum = i + 1;
                                            } else if (data.pagination.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (data.pagination.page >= data.pagination.total_pages - 2) {
                                                pageNum = data.pagination.total_pages - 4 + i;
                                            } else {
                                                pageNum = data.pagination.page - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => loadData(pageNum)}
                                                    disabled={loading}
                                                    className={cn(
                                                        "px-2 py-1 rounded text-xs",
                                                        pageNum === data.pagination.page
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted hover:bg-border"
                                                    )}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => loadData(data.pagination.page + 1)}
                                            disabled={data.pagination.page >= data.pagination.total_pages || loading}
                                            className="p-1.5 rounded bg-muted hover:bg-border disabled:opacity-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        注：杀号结果仅供参考 | 效率 = 成功率% × 平均杀号数 | 基于最近 {lookback} 期统计
                    </div>
                </>
            )}
        </div>
    );
}
