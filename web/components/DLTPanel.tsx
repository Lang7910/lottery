"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Download, Filter, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, API_BASE_URL, formatPeriod } from "@/lib/utils";

interface DLTResult {
    period: string;
    front: number[];
    back: number[];
    sale_begin_time?: string;
    sale_end_time?: string;
}

interface DLTData {
    total: number;
    items: DLTResult[];
}

type FetchMode = "count" | "period";

export function DLTPanel() {
    const [data, setData] = useState<DLTData | null>(null);
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

    // 筛选配置
    const [showFilters, setShowFilters] = useState(false);
    const [filterStartPeriod, setFilterStartPeriod] = useState("");
    const [filterEndPeriod, setFilterEndPeriod] = useState("");

    const totalPages = Math.ceil(totalCount / pageSize);

    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.set("limit", String(pageSize));
        params.set("offset", String((page - 1) * pageSize));
        if (filterStartPeriod && filterEndPeriod) {
            params.set("start_period", filterStartPeriod);
            params.set("end_period", filterEndPeriod);
        }
        return params.toString();
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/dlt/?${buildQueryParams()}`);
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

    const syncData = async () => {
        setFetching(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/dlt/sync`, { method: "POST" });
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

    const fetchData = async () => {
        setFetching(true);
        setError(null);
        setMessage(null);
        try {
            const body: Record<string, unknown> = { mode: fetchMode };
            if (fetchMode === "count") {
                body.count = fetchCount;
            } else {
                body.start_period = fetchStartPeriod;
                body.end_period = fetchEndPeriod;
            }
            const res = await fetch(`${API_BASE_URL}/api/dlt/fetch`, {
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

    useEffect(() => {
        loadData();
    }, [page, pageSize]);

    const applyFilters = () => {
        setPage(1);
        loadData();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 标题栏 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">大乐透</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        前区 5 个 (1-35) + 后区 2 个 (1-12)
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setShowFetchConfig(!showFetchConfig); setShowFilters(false); }}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-border", showFetchConfig && "bg-primary/10 text-primary")}>
                        <Settings className="w-4 h-4" /> 获取配置
                    </button>
                    <button onClick={() => { setShowFilters(!showFilters); setShowFetchConfig(false); }}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-border", showFilters && "bg-primary/10 text-primary")}>
                        <Filter className="w-4 h-4" /> 筛选
                    </button>
                    <button onClick={syncData} disabled={fetching}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50")}>
                        <RefreshCw className={cn("w-4 h-4", fetching && "animate-spin")} /> 增量同步
                    </button>
                </div>
            </div>

            {/* 获取配置 */}
            {showFetchConfig && (
                <div className="glass-card p-4 space-y-4">
                    <h4 className="font-medium">获取数据方式</h4>
                    <div className="flex gap-2">
                        <button onClick={() => setFetchMode("count")}
                            className={cn("px-3 py-1.5 rounded-md text-sm", fetchMode === "count" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            按期数
                        </button>
                        <button onClick={() => setFetchMode("period")}
                            className={cn("px-3 py-1.5 rounded-md text-sm", fetchMode === "period" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            按期号范围
                        </button>
                    </div>
                    {fetchMode === "count" && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">获取最近</span>
                            <input type="number" min={1} max={100} value={fetchCount}
                                onChange={(e) => setFetchCount(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                            <span className="text-sm text-muted-foreground">期</span>
                        </div>
                    )}
                    {fetchMode === "period" && (
                        <div className="flex items-center gap-2">
                            <input type="text" placeholder="起始期号" value={fetchStartPeriod}
                                onChange={(e) => setFetchStartPeriod(e.target.value)}
                                className="w-28 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                            <span>至</span>
                            <input type="text" placeholder="结束期号" value={fetchEndPeriod}
                                onChange={(e) => setFetchEndPeriod(e.target.value)}
                                className="w-28 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                        </div>
                    )}
                    <button onClick={fetchData} disabled={fetching}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm disabled:opacity-50">
                        <Download className={cn("w-4 h-4", fetching && "animate-spin")} /> 开始获取
                    </button>
                </div>
            )}

            {/* 筛选 */}
            {showFilters && (
                <div className="glass-card p-4 space-y-4">
                    <h4 className="font-medium">筛选已有数据</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">期号:</span>
                        <input type="text" placeholder="起始" value={filterStartPeriod}
                            onChange={(e) => setFilterStartPeriod(e.target.value)}
                            className="w-24 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                        <span>-</span>
                        <input type="text" placeholder="结束" value={filterEndPeriod}
                            onChange={(e) => setFilterEndPeriod(e.target.value)}
                            className="w-24 px-2 py-1 rounded-md bg-muted border border-border text-sm" />
                        <button onClick={applyFilters} className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm">应用</button>
                        <button onClick={() => { setFilterStartPeriod(""); setFilterEndPeriod(""); setPage(1); loadData(); }}
                            className="px-3 py-1 rounded-md bg-muted text-sm">清除</button>
                    </div>
                </div>
            )}

            {message && <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm">{message}</div>}
            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent border border-accent/20 text-sm">{error}</div>}

            {/* 最新一期 */}
            {data?.items?.[0] && page === 1 && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">最新一期</span>
                        <span className="text-sm text-muted-foreground">第 {data.items[0].period} 期</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {data.items[0].front.map((num, idx) => (
                            <span key={idx} className="ball ball-front">{num.toString().padStart(2, "0")}</span>
                        ))}
                        <span className="mx-2 text-muted-foreground">+</span>
                        {data.items[0].back.map((num, idx) => (
                            <span key={idx} className="ball ball-back">{num.toString().padStart(2, "0")}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* 数据表格 */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold">历史开奖 (共 {totalCount} 期)</h3>
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
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">开奖号码</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
                            ) : !data?.items?.length ? (
                                <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
                            ) : (
                                data.items.map((item) => (
                                    <tr key={item.period} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{formatPeriod(item.period)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.front.map((num, idx) => (
                                                    <span key={idx} className="ball ball-front text-xs" style={{ width: 26, height: 26 }}>{num.toString().padStart(2, "0")}</span>
                                                ))}
                                                <span className="mx-1 text-muted-foreground">+</span>
                                                {item.back.map((num, idx) => (
                                                    <span key={idx} className="ball ball-back text-xs" style={{ width: 26, height: 26 }}>{num.toString().padStart(2, "0")}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
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
