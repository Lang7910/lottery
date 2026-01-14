"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import { getWaveColor, getZodiacByDate } from "@/lib/hk6Utils";

interface HK6Result {
    period: string;
    year: number;
    no: number;
    date: string;
    numbers: number[];
    special: number;
    snowball_code: string | null;
    snowball_name: string | null;
}

interface HK6Data {
    total: number;
    items: HK6Result[];
}

export function HK6Panel() {
    const [data, setData] = useState<HK6Data | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // 分页
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    // 筛选
    const [showFilters, setShowFilters] = useState(false);
    const [filterStartPeriod, setFilterStartPeriod] = useState("");
    const [filterEndPeriod, setFilterEndPeriod] = useState("");

    // 显示模式：是否显示波色和生肖
    const [showDetails, setShowDetails] = useState(false);

    const totalPages = Math.ceil(totalCount / pageSize);

    // 构建查询参数
    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.set("limit", String(pageSize));
        params.set("offset", String((page - 1) * pageSize));

        if (filterStartPeriod) params.set("start_period", filterStartPeriod);
        if (filterEndPeriod) params.set("end_period", filterEndPeriod);

        return params.toString();
    };

    // 加载数据
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/hk6?${buildQueryParams()}`);
            if (!res.ok) throw new Error("获取数据失败");
            const json = await res.json();
            setData(json);
            setTotalCount(json.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    // 增量同步
    const syncData = async () => {
        setSyncing(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/hk6/sync`, { method: "POST" });
            if (!res.ok) throw new Error("同步失败");
            const json = await res.json();
            setMessage(json.message);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setSyncing(false);
        }
    };

    // 全量刷新 (获取更多历史数据)
    const refreshData = async () => {
        setSyncing(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/hk6/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: 50 })
            });
            if (!res.ok) throw new Error("刷新失败");
            const json = await res.json();
            setMessage(json.message);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize]);

    const applyFilters = () => {
        setPage(1);
        loadData();
    };

    // 格式化期号显示
    const formatPeriod = (item: HK6Result) => {
        return `${String(item.year).slice(2)}/${String(item.no).padStart(3, "0")}`;
    };

    // 格式化日期
    const formatDate = (date: string) => {
        if (!date) return "";
        const d = new Date(date);
        const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}(${weekdays[d.getDay()]})`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题栏 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">六合彩</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        6 个号码 (1-49) + 1 个特别号码
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-muted hover:bg-border transition-colors",
                            showDetails && "bg-primary/10 text-primary"
                        )}
                    >
                        <Eye className="w-4 h-4" />
                        波色/生肖
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-muted hover:bg-border transition-colors",
                            showFilters && "bg-primary/10 text-primary"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        筛选
                    </button>
                    <button
                        onClick={syncData}
                        disabled={syncing}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-primary text-primary-foreground hover:opacity-90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                        增量同步
                    </button>
                    <button
                        onClick={refreshData}
                        disabled={syncing}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-accent text-accent-foreground hover:opacity-90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                        全量刷新
                    </button>
                </div>
            </div>

            {/* 筛选面板 */}
            {showFilters && (
                <div className="glass-card p-4 space-y-4">
                    <h4 className="font-medium text-foreground">筛选数据</h4>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">期号:</span>
                            <input type="text" placeholder="起始" value={filterStartPeriod}
                                onChange={(e) => setFilterStartPeriod(e.target.value)}
                                className="w-28 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                            <span>-</span>
                            <input type="text" placeholder="结束" value={filterEndPeriod}
                                onChange={(e) => setFilterEndPeriod(e.target.value)}
                                className="w-28 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                        </div>
                        <button onClick={applyFilters}
                            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm">
                            应用筛选
                        </button>
                    </div>
                </div>
            )}

            {/* 消息提示 */}
            {message && (
                <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">{message}</div>
            )}
            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {/* 最新一期 */}
            {data && data.items.length > 0 && (() => {
                const latest = data.items[0];
                const specialWave = getWaveColor(latest.special);
                const specialZodiac = getZodiacByDate(latest.special, latest.date);
                const specialBallClass = specialWave === "red" ? "ball-red" : specialWave === "blue" ? "ball-blue" : "ball-green";

                return (
                    <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">最新一期</span>
                            <span className="text-sm text-muted-foreground">
                                第 {latest.period} 期 | {formatDate(latest.date)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {latest.numbers.map((num, i) => {
                                const wave = getWaveColor(num);
                                const ballClass = wave === "red" ? "ball-red" : wave === "blue" ? "ball-blue" : "ball-green";
                                return (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className={cn("ball", ballClass)}>
                                            {num.toString().padStart(2, "0")}
                                        </div>
                                        {showDetails && (
                                            <span className="text-xs text-muted-foreground mt-1">
                                                {getZodiacByDate(num, latest.date)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            <span className="text-xl text-muted-foreground mx-1">+</span>
                            <div className="flex flex-col items-center">
                                <div className={cn("ball ring-2 ring-amber-400", specialBallClass)}>
                                    {latest.special.toString().padStart(2, "0")}
                                </div>
                                {showDetails && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {specialZodiac}
                                    </span>
                                )}
                            </div>
                            {showDetails && (
                                <div className="ml-4 flex items-center gap-2">
                                    <span className={cn("px-2 py-1 rounded text-white text-sm font-medium", specialBallClass)}>
                                        {specialWave === "red" ? "红波" : specialWave === "blue" ? "蓝波" : "绿波"}
                                    </span>
                                    <span className="text-lg font-medium">{specialZodiac}</span>
                                </div>
                            )}
                            {latest.snowball_name && (
                                <span className="ml-2 px-2 py-1 rounded bg-yellow-500/20 text-yellow-600 text-xs font-medium">
                                    {latest.snowball_name}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* 历史开奖 */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold">历史开奖 (共 {totalCount} 期)</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">每页</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="px-2 py-1 rounded bg-muted border border-border text-sm"
                        >
                            {[20, 50, 100].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span className="text-sm text-muted-foreground">条</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">加载中...</div>
                ) : data && data.items.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">期号</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">日期</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">开奖号码</th>
                                        {showDetails && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">特码生肖/波色</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.items.map((item) => {
                                        const specialWave = getWaveColor(item.special);
                                        const specialZodiac = getZodiacByDate(item.special, item.date);
                                        const waveColorClass = specialWave === "red" ? "bg-red-500" : specialWave === "blue" ? "bg-blue-500" : "bg-green-500";

                                        return (
                                            <tr key={item.period} className="hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">{formatPeriod(item)}</span>
                                                    {item.snowball_code && (
                                                        <span className="ml-1 text-xs text-yellow-600">{item.snowball_code}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {formatDate(item.date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        {item.numbers.map((num, i) => {
                                                            const wave = getWaveColor(num);
                                                            const bgClass = wave === "red" ? "bg-red-500" : wave === "blue" ? "bg-blue-500" : "bg-green-500";
                                                            return (
                                                                <div key={i} className="flex flex-col items-center">
                                                                    <span className={cn("w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center", bgClass)}>
                                                                        {num.toString().padStart(2, "0")}
                                                                    </span>
                                                                    {showDetails && (
                                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                            {getZodiacByDate(num, item.date)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <span className="mx-1 text-muted-foreground">+</span>
                                                        <div className="flex flex-col items-center">
                                                            <span className={cn("w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ring-2 ring-amber-400", waveColorClass)}>
                                                                {item.special.toString().padStart(2, "0")}
                                                            </span>
                                                            {showDetails && (
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                    {specialZodiac}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {showDetails && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("px-2 py-0.5 rounded text-white text-xs font-medium", waveColorClass)}>
                                                                {specialWave === "red" ? "红波" : specialWave === "blue" ? "蓝波" : "绿波"}
                                                            </span>
                                                            <span className="text-sm">{specialZodiac}</span>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* 分页 */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded hover:bg-muted disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded hover:bg-muted disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        暂无数据，请点击"增量同步"获取数据
                    </div>
                )}
            </div>
        </div>
    );
}
