"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Scissors, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Eye, Table2, ChevronLeft, ChevronRight, Zap, Target, Shield, BarChart, Trophy } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import { AddToWatchlist } from "@/components/AddToWatchlist";

interface MethodStats {
    success_rate: number;
    avg_kills: number;
    efficiency: number;
    success_count: number;
}

interface KillResult {
    kills: number[];
    success?: boolean | null;
    method_name?: string;
}

interface HistoryItem {
    period: string;
    front: number[];
    back: number[];
    front_kills: Record<string, KillResult>;
    back_kills: Record<string, KillResult>;
}

interface RecommendedSet {
    front: number[];
    back: number[];
}

interface Strategy {
    name: string;
    description: string;
    methods_used?: number[];
    sets: RecommendedSet[];
}

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
    top_combo_1: <Trophy className="w-4 h-4" />,
    top_combo_2: <Trophy className="w-4 h-4" />,
    top_combo_3: <Trophy className="w-4 h-4" />,
    random: <Sparkles className="w-4 h-4" />,
    high_success: <Target className="w-4 h-4" />,
    high_efficiency: <Zap className="w-4 h-4" />,
    multi_kill: <BarChart className="w-4 h-4" />,
    conservative: <Shield className="w-4 h-4" />,
};

interface KillData {
    base_period: string;
    next_prediction: {
        period: string;
        front_kills: Record<string, KillResult & MethodStats>;
        back_kills: Record<string, KillResult & MethodStats>;
        priority_kills: {
            high: number[];
            medium: number[];
            low: number[];
        };
        available_fronts: number[];
        available_backs: number[];
        killed_front_count?: number;
        killed_back_count?: number;
    };
    statistics: {
        total_periods: number;
        front_methods: Record<string, MethodStats>;
        back_methods: Record<string, MethodStats>;
    };
    method_combinations: MethodCombination[];  // 方法组合排名
    recommended_sets: Record<string, Strategy>;
    history: {
        page: number;
        page_size: number;
        total: number;
        records: HistoryItem[];
    };
    method_names: {
        front: Record<string, string>;
        back: Record<string, string>;
    };
}

interface MethodCombination {
    methods: number[];
    method_names: string[];
    success_rate: number;
    unique_kills: number;
    kill_numbers: number[];
    efficiency: number;
    method_count: number;
}

// 杀号方法详细描述 (28种前区方法)
const FRONT_METHOD_DESCRIPTIONS: Record<string, string> = {
    // 基础方法 (1-6)
    "1": "将1-35分为5区，杀掉上期没有开出号码的分区",
    "2": "杀掉上期开奖的所有5个前区号码（重复概率<20%）",
    "3": "上期前3个号码分别+3，得到3个必杀号",
    "4": "上期相邻号码相减(大-小)，得到4个必杀号",
    "5": "上期第1个号-1，第2个号-2，第3个号-3",
    "6": "杀掉去年同一期的开奖号码（重号概率约10%）",
    // 首尾和相关 (7-9)
    "7": "用上期的首尾和可杀一码（大于35则减去35）",
    "8": "用上期的首尾和除以3的得数可杀一码（取整）",
    "9": "用上两期的首尾和相减（大号-小号）的得数可杀一码",
    // 跨度相关 (10-11)
    "10": "用上期的前跨（凤尾-龙头）可杀一码",
    "11": "用上期的前跨乘以后跨再除以8的得数可杀一码（取整）",
    // 和值相关 (12-14)
    "12": "用上期的后和可杀一码",
    "13": "用上期的后区之和+3可杀一码",
    "14": "用上期的后区之积+3可杀一码（大于35则依次减去12）",
    // 红球组合 (15-20)
    "15": "用上期第一位红球加上后区小号的得数可杀一码",
    "16": "用上期第一位红球加上后区大号的得数可杀一码",
    "17": "用上期红球的一位加二位的得数可杀一码",
    "18": "用上期红球的一位加二位的得数再除以2（进位取整）可杀一码",
    "19": "用上期五码红球的尾数（个位）相加的得数可杀一码",
    "20": "用上期五码红球的尾数相加后再除以2（进位取整）的得数可杀一码",
    // 龙头凤尾 (21-26)
    "21": "用上期的龙头加10可杀一码",
    "22": "用上期的龙头+12可杀一码",
    "23": "用上期凤尾的个位+十位可杀一码",
    "24": "用上期凤尾的个位与十位互减的得数可杀一码",
    "25": "用上期凤尾减去上上期龙头的得数可杀一码",
    "26": "用上期的凤尾减去上期与上上期龙头的得数可杀一码",
    // 其他特殊 (27-28)
    "27": "用上期第三位红球乘以7再除以10的得数可杀一码（取整）",
    "28": "黄金分割杀号：各号码×0.618取整后作为杀号",
};

// 后区杀号方法描述 (5种)
const BACK_METHOD_DESCRIPTIONS: Record<string, string> = {
    "1": "杀掉上期后区的2个号码",
    "2": "上两期后区4个号码之和的尾数",
    "3": "上期后区两号相减的绝对值",
    "4": "后区和加3杀号（大于12则减12）",
    "5": "后区两号相乘除以10取整",
};

export function DLTKillAnalysis() {
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
                `${API_BASE_URL}/api/analysis/dlt/kill?lookback=${lookback}&num_sets=${numSets}&page=${newPage}&page_size=${pageSize}`
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
                    <h2 className="text-2xl font-bold text-foreground">大乐透 - 杀号策略</h2>
                    <p className="text-sm text-muted-foreground mt-1">28种前区杀号 + 5种后区杀号方法</p>
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

            {/* 错误提示 */}
            {error && (
                <div className="glass-card p-4 bg-red-500/10 border-red-500/20">
                    <p className="text-red-500">{error}</p>
                </div>
            )}

            {/* 加载状态 */}
            {loading && !data && (
                <div className="glass-card p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">正在计算杀号数据...</p>
                </div>
            )}

            {/* 主内容 */}
            {data && (
                <>
                    {/* 综合统计 */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-lg">综合统计</h3>
                            <span className="text-xs text-muted-foreground">基于最近 {data.statistics.total_periods} 期</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                                <div className="text-2xl font-bold text-foreground">
                                    {data.next_prediction.killed_front_count || (35 - data.next_prediction.available_fronts.length)} + {data.next_prediction.killed_back_count || (12 - data.next_prediction.available_backs.length)}
                                </div>
                                <div className="text-xs text-muted-foreground">杀号数 (前+后)</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                                <div className="text-2xl font-bold text-green-500">
                                    {(Object.values(data.statistics.front_methods).filter(m => m.success_rate >= 80).length / 28 * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-muted-foreground">方法成功率≥80%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                                <div className="text-2xl font-bold text-foreground">
                                    {Object.values(data.statistics.front_methods).filter(m => m.success_rate >= 85).length}
                                </div>
                                <div className="text-xs text-muted-foreground">前区方法≥85%</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                                <div className="text-2xl font-bold text-foreground">
                                    {data.next_prediction.available_fronts.length} / {data.next_prediction.available_backs.length}
                                </div>
                                <div className="text-xs text-muted-foreground">可选号码 (前/后)</div>
                            </div>
                        </div>
                    </div>

                    {/* 方法组合排名 */}
                    {data.method_combinations && data.method_combinations.length > 0 && (
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">最佳方法组合排名</h3>
                                <span className="text-xs text-muted-foreground">按效率排序 (效率 = 成功率 × 杀号数)</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">排名</th>
                                            <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">方法组合</th>
                                            <th className="py-2 px-2 text-center text-xs font-medium text-muted-foreground">成功率</th>
                                            <th className="py-2 px-2 text-center text-xs font-medium text-muted-foreground">杀号数</th>
                                            <th className="py-2 px-2 text-center text-xs font-medium text-muted-foreground">效率</th>
                                            <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">杀号</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.method_combinations.slice(0, 10).map((combo, idx) => (
                                            <tr key={idx} className={cn(
                                                "border-b border-border/50 hover:bg-muted/20",
                                                idx < 3 && "bg-primary/5"
                                            )}>
                                                <td className="py-2 px-2 font-bold">
                                                    {idx < 3 ? (
                                                        <span className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                                            idx === 0 && "bg-yellow-500 text-black",
                                                            idx === 1 && "bg-gray-400 text-black",
                                                            idx === 2 && "bg-amber-700 text-white"
                                                        )}>
                                                            {idx + 1}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{idx + 1}</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {combo.method_names.map((name, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "py-2 px-2 text-center font-semibold",
                                                    combo.success_rate >= 70 ? "text-green-500" : combo.success_rate >= 50 ? "text-yellow-500" : "text-red-500"
                                                )}>
                                                    {combo.success_rate}%
                                                </td>
                                                <td className="py-2 px-2 text-center font-semibold text-foreground">
                                                    {combo.unique_kills}
                                                </td>
                                                <td className="py-2 px-2 text-center font-bold text-primary">
                                                    {combo.efficiency}
                                                </td>
                                                <td className="py-2 px-2">
                                                    <div className="flex gap-0.5 flex-wrap">
                                                        {combo.kill_numbers.slice(0, 10).map(n => (
                                                            <span key={n} className="w-5 h-5 rounded-full bg-red-500/80 text-white text-[10px] flex items-center justify-center">
                                                                {n.toString().padStart(2, "0")}
                                                            </span>
                                                        ))}
                                                        {combo.kill_numbers.length > 10 && (
                                                            <span className="text-xs text-muted-foreground">+{combo.kill_numbers.length - 10}</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

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
                                    {data.recommended_sets[activeStrategy].sets.map((set: RecommendedSet, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <div className="flex gap-1.5">
                                                {set.front.map((n: number, i: number) => (
                                                    <div key={i} className="ball ball-red text-xs" style={{ width: 28, height: 28 }}>
                                                        {n.toString().padStart(2, "0")}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-muted-foreground text-xs">+</span>
                                            <div className="flex gap-1.5">
                                                {set.back.map((n: number, i: number) => (
                                                    <div key={i} className="ball ball-blue text-xs" style={{ width: 28, height: 28 }}>
                                                        {n.toString().padStart(2, "0")}
                                                    </div>
                                                ))}
                                            </div>
                                            <AddToWatchlist
                                                lotteryType="dlt"
                                                numbers={{ front: set.front, back: set.back }}
                                                source="kill"
                                                targetPeriod={parseInt(data.next_prediction.period)}
                                            />
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
                                    (前区: 剩余{data.next_prediction.available_fronts.length}个 | 后区: 剩余{data.next_prediction.available_backs.length}个)
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">重点杀:</span>
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
                                    <span className="text-xs text-muted-foreground w-20">前区可选:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {data.next_prediction.available_fronts.slice(0, 20).map(n => (
                                            <span key={n} className="w-5 h-5 rounded-full bg-green-500/80 text-white text-[10px] flex items-center justify-center">
                                                {n}
                                            </span>
                                        ))}
                                        {data.next_prediction.available_fronts.length > 20 && (
                                            <span className="text-xs text-muted-foreground">...共{data.next_prediction.available_fronts.length}个</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">后区可选:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {data.next_prediction.available_backs.map(n => (
                                            <span key={n} className="w-5 h-5 rounded-full bg-blue-500/80 text-white text-[10px] flex items-center justify-center">
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 方法详情 */}
                        {showAllMethods && (
                            <div className="space-y-4 mt-4">
                                {/* 前区杀号 */}
                                <div>
                                    <h4 className="text-sm font-medium mb-2 text-red-500">前区杀号 (35选5)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(data.next_prediction.front_kills).map(([id, result]) => (
                                            <div key={id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{data.method_names.front[id] || `方法${id}`}</span>
                                                    <span className={cn("text-xs", getSuccessRateColor(result.success_rate))}>
                                                        成功率 {result.success_rate}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{FRONT_METHOD_DESCRIPTIONS[id]}</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {result.kills.map(n => (
                                                        <span key={n} className="w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center">
                                                            {n.toString().padStart(2, "0")}
                                                        </span>
                                                    ))}
                                                    {result.kills.length === 0 && <span className="text-xs text-muted-foreground">无杀号</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 后区杀号 */}
                                <div>
                                    <h4 className="text-sm font-medium mb-2 text-blue-500">后区杀号 (12选2)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {Object.entries(data.next_prediction.back_kills).map(([id, result]) => (
                                            <div key={id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{data.method_names.back[id] || `方法${id}`}</span>
                                                    <span className={cn("text-xs", getSuccessRateColor(result.success_rate))}>
                                                        成功率 {result.success_rate}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{BACK_METHOD_DESCRIPTIONS[id]}</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {result.kills.map(n => (
                                                        <span key={n} className="w-6 h-6 rounded-full bg-blue-500/80 text-white text-xs flex items-center justify-center">
                                                            {n.toString().padStart(2, "0")}
                                                        </span>
                                                    ))}
                                                    {result.kills.length === 0 && <span className="text-xs text-muted-foreground">无杀号</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 历史验证 */}
                    <div className="glass-card p-5">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <div className="flex items-center gap-2">
                                <Table2 className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">历史验证</h3>
                                <span className="text-xs text-muted-foreground">
                                    共 {data.history.total} 期
                                </span>
                            </div>
                            {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>

                        {showHistory && (
                            <div className="mt-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-background">期号</th>
                                                <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">开奖号码</th>
                                                {Object.keys(data.method_names.front).map(id => (
                                                    <th key={`f${id}`} className="py-2 px-2 text-center text-xs font-medium text-muted-foreground" title={data.method_names.front[id]}>
                                                        前{id}
                                                    </th>
                                                ))}
                                                {Object.keys(data.method_names.back).map(id => (
                                                    <th key={`b${id}`} className="py-2 px-2 text-center text-xs font-medium text-muted-foreground" title={data.method_names.back[id]}>
                                                        后{id}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.history.records.map((h) => (
                                                <tr key={h.period} className="border-b border-border/50 hover:bg-muted/20">
                                                    <td className="py-2 px-2 font-medium sticky left-0 bg-background">{h.period}</td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex gap-1">
                                                            {h.front.map((n, i) => (
                                                                <span key={i} className="inline-block w-5 h-5 rounded-full bg-red-500/80 text-white text-[10px] text-center leading-5">
                                                                    {n.toString().padStart(2, "0")}
                                                                </span>
                                                            ))}
                                                            <span className="text-muted-foreground">+</span>
                                                            {h.back.map((n, i) => (
                                                                <span key={i} className="inline-block w-5 h-5 rounded-full bg-blue-500/80 text-white text-[10px] text-center leading-5">
                                                                    {n.toString().padStart(2, "0")}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    {Object.entries(h.front_kills).map(([id, result]) => (
                                                        <td key={`f${id}`} className="py-2 px-2 text-center">
                                                            {result.success ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                                            )}
                                                        </td>
                                                    ))}
                                                    {Object.entries(h.back_kills).map(([id, result]) => (
                                                        <td key={`b${id}`} className="py-2 px-2 text-center">
                                                            {result.success ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 分页 */}
                                {data.history.total > pageSize && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <button
                                            onClick={() => loadData(page - 1)}
                                            disabled={page <= 1 || loading}
                                            className="p-2 rounded bg-muted hover:bg-border disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm">
                                            {page} / {Math.ceil(data.history.total / pageSize)}
                                        </span>
                                        <button
                                            onClick={() => loadData(page + 1)}
                                            disabled={page >= Math.ceil(data.history.total / pageSize) || loading}
                                            className="p-2 rounded bg-muted hover:bg-border disabled:opacity-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
