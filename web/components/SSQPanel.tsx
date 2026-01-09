"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Download, Filter, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, API_BASE_URL, formatPeriod } from "@/lib/utils";

interface SSQResult {
    period: number;
    date: string;
    weekday: string;
    red: number[];
    blue: number;
}

interface SSQData {
    total: number;
    items: SSQResult[];
}

type FetchMode = "count" | "period" | "date";

export function SSQPanel() {
    const [data, setData] = useState<SSQData | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // 分页
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    // 获取数据配置
    const [showFetchConfig, setShowFetchConfig] = useState(false);
    const [fetchMode, setFetchMode] = useState<FetchMode>("count");
    const [fetchCount, setFetchCount] = useState(100);
    const [fetchStartPeriod, setFetchStartPeriod] = useState("");
    const [fetchEndPeriod, setFetchEndPeriod] = useState("");
    const [fetchStartDate, setFetchStartDate] = useState("");
    const [fetchEndDate, setFetchEndDate] = useState("");

    // 显示筛选配置
    const [showFilters, setShowFilters] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [filterStartPeriod, setFilterStartPeriod] = useState("");
    const [filterEndPeriod, setFilterEndPeriod] = useState("");

    const totalPages = Math.ceil(totalCount / pageSize);

    // 构建显示查询参数
    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.set("limit", String(pageSize));
        params.set("offset", String((page - 1) * pageSize));

        if (filterStartDate && filterEndDate) {
            params.set("start_date", filterStartDate);
            params.set("end_date", filterEndDate);
        }
        if (filterStartPeriod && filterEndPeriod) {
            params.set("start_period", filterStartPeriod);
            params.set("end_period", filterEndPeriod);
        }

        return params.toString();
    };

    // 加载本地数据（显示）
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/ssq/?${buildQueryParams()}`);
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
        setFetching(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/ssq/sync`, { method: "POST" });
            if (!res.ok) throw new Error("同步失败");
            const json = await res.json();
            setMessage(json.message);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setFetching(false);
        }
    };

    // 按配置获取数据
    const fetchData = async () => {
        setFetching(true);
        setError(null);
        setMessage(null);
        try {
            const body: Record<string, unknown> = { mode: fetchMode };

            if (fetchMode === "count") {
                body.count = fetchCount;
            } else if (fetchMode === "period") {
                body.start_period = fetchStartPeriod;
                body.end_period = fetchEndPeriod;
            } else if (fetchMode === "date") {
                body.start_date = fetchStartDate;
                body.end_date = fetchEndDate;
            }

            const res = await fetch(`${API_BASE_URL}/api/ssq/fetch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("获取数据失败");
            const json = await res.json();
            setMessage(`已获取 ${json.total} 期数据`);
            setShowFetchConfig(false);
            setPage(1);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setFetching(false);
        }
    };

    // 页面变化时重新加载
    useEffect(() => {
        loadData();
    }, [page, pageSize]);

    // 筛选变化时重置页码
    const applyFilters = () => {
        setPage(1);
        loadData();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题栏 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">双色球</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        红球 6 个 (1-33) + 蓝球 1 个 (1-16)
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => { setShowFetchConfig(!showFetchConfig); setShowFilters(false); }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-muted hover:bg-border transition-colors",
                            showFetchConfig && "bg-primary/10 text-primary"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        获取配置
                    </button>
                    <button
                        onClick={() => { setShowFilters(!showFilters); setShowFetchConfig(false); }}
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
                        disabled={fetching}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-primary text-primary-foreground hover:opacity-90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", fetching && "animate-spin")} />
                        增量同步
                    </button>
                </div>
            </div>

            {/* 获取数据配置面板 */}
            {showFetchConfig && (
                <div className="glass-card p-4 space-y-4">
                    <h4 className="font-medium text-foreground">获取数据方式</h4>
                    <div className="flex flex-wrap gap-2">
                        {(["count", "period", "date"] as FetchMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFetchMode(mode)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-sm",
                                    fetchMode === mode ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}
                            >
                                {mode === "count" ? "按期数" : mode === "period" ? "按期号范围" : "按日期范围"}
                            </button>
                        ))}
                    </div>

                    {fetchMode === "count" && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">获取最近</label>
                            <input
                                type="number"
                                min={1}
                                max={2000}
                                value={fetchCount}
                                onChange={(e) => setFetchCount(Number(e.target.value))}
                                className="w-24 px-3 py-1.5 rounded-md bg-muted border border-border text-sm"
                            />
                            <span className="text-sm text-muted-foreground">期</span>
                        </div>
                    )}

                    {fetchMode === "period" && (
                        <div className="flex flex-wrap items-center gap-2">
                            <input type="text" placeholder="起始期号" value={fetchStartPeriod}
                                onChange={(e) => setFetchStartPeriod(e.target.value)}
                                className="w-32 px-3 py-1.5 rounded-md bg-muted border border-border text-sm" />
                            <span className="text-muted-foreground">至</span>
                            <input type="text" placeholder="结束期号" value={fetchEndPeriod}
                                onChange={(e) => setFetchEndPeriod(e.target.value)}
                                className="w-32 px-3 py-1.5 rounded-md bg-muted border border-border text-sm" />
                        </div>
                    )}

                    {fetchMode === "date" && (
                        <div className="flex flex-wrap items-center gap-2">
                            <input type="date" value={fetchStartDate}
                                onChange={(e) => setFetchStartDate(e.target.value)}
                                className="px-3 py-1.5 rounded-md bg-muted border border-border text-sm" />
                            <span className="text-muted-foreground">至</span>
                            <input type="date" value={fetchEndDate}
                                onChange={(e) => setFetchEndDate(e.target.value)}
                                className="px-3 py-1.5 rounded-md bg-muted border border-border text-sm" />
                        </div>
                    )}

                    <button onClick={fetchData} disabled={fetching}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                            "bg-accent text-accent-foreground hover:opacity-90",
                            "disabled:opacity-50"
                        )}>
                        <Download className={cn("w-4 h-4", fetching && "animate-spin")} />
                        开始获取
                    </button>
                </div>
            )}

            {/* 筛选面板 */}
            {showFilters && (
                <div className="glass-card p-4 space-y-4">
                    <h4 className="font-medium text-foreground">筛选已有数据</h4>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">日期:</span>
                            <input type="date" value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                            <span>-</span>
                            <input type="date" value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">期号:</span>
                            <input type="text" placeholder="起始" value={filterStartPeriod}
                                onChange={(e) => setFilterStartPeriod(e.target.value)}
                                className="w-24 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                            <span>-</span>
                            <input type="text" placeholder="结束" value={filterEndPeriod}
                                onChange={(e) => setFilterEndPeriod(e.target.value)}
                                className="w-24 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                        </div>
                        <button onClick={applyFilters}
                            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm">
                            应用
                        </button>
                        <button onClick={() => {
                            setFilterStartDate(""); setFilterEndDate("");
                            setFilterStartPeriod(""); setFilterEndPeriod("");
                            setPage(1); loadData();
                        }} className="px-3 py-1 rounded-md bg-muted text-sm">
                            清除
                        </button>
                    </div>
                </div>
            )}

            {/* 提示/错误信息 */}
            {message && (
                <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm">
                    {message}
                </div>
            )}
            {error && (
                <div className="p-3 rounded-lg bg-accent/10 text-accent border border-accent/20 text-sm">
                    {error}
                </div>
            )}

            {/* 最新一期 */}
            {data?.items?.[0] && page === 1 && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">最新一期</span>
                        <span className="text-sm text-muted-foreground">
                            第 {data.items[0].period} 期 | {data.items[0].date} {data.items[0].weekday}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {data.items[0].red.map((num, idx) => (
                            <span key={idx} className="ball ball-red">
                                {num.toString().padStart(2, "0")}
                            </span>
                        ))}
                        <span className="mx-2 text-muted-foreground">+</span>
                        <span className="ball ball-blue">
                            {data.items[0].blue.toString().padStart(2, "0")}
                        </span>
                    </div>
                </div>
            )}

            {/* 历史数据表格 */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold text-foreground">
                        历史开奖 (共 {totalCount} 期)
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">每页</span>
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="px-2 py-1 rounded-md bg-muted border border-border text-sm">
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                        <span className="text-sm text-muted-foreground">条</span>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">期号</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">日期</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">开奖号码</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
                            ) : !data?.items?.length ? (
                                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
                            ) : (
                                data.items.map((item) => (
                                    <tr key={item.period} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{formatPeriod(item.period)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.date}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.red.map((num, idx) => (
                                                    <span key={idx} className="ball ball-red text-xs" style={{ width: 26, height: 26 }}>
                                                        {num.toString().padStart(2, "0")}
                                                    </span>
                                                ))}
                                                <span className="ball ball-blue text-xs" style={{ width: 26, height: 26 }}>
                                                    {item.blue.toString().padStart(2, "0")}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            第 {page} / {totalPages} 页
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(1)} disabled={page === 1}
                                className="px-2 py-1 rounded bg-muted text-sm disabled:opacity-50">首页</button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1 rounded bg-muted disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{page}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1 rounded bg-muted disabled:opacity-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                                className="px-2 py-1 rounded bg-muted text-sm disabled:opacity-50">末页</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
