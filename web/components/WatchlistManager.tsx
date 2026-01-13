"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Bookmark, Trash2, Edit2, Check, X, RefreshCw,
    ChevronDown, ChevronUp, Send, Minus, Plus, CheckSquare, Square, ArrowRight,
    Clock, Archive
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface WatchlistItem {
    id: number;
    lottery_type: string;
    target_period: number | null;
    numbers: {
        red?: number[];
        blue?: number | number[];
        front?: number[];
        back?: number[];
    };
    source: string;
    note: string | null;
    created_at: string;
}

interface WatchlistManagerProps {
    lotteryType?: "ssq" | "dlt";
    onBatchBet?: (items: Array<{ numbers: any; multiple: number }>, targetPeriod: number) => void;
    onSelectForBet?: (item: WatchlistItem) => void;
}

interface PeriodGroup {
    period: number | null;
    label: string;
    isExpired: boolean;
    isCurrent: boolean;
    items: WatchlistItem[];
}

export function WatchlistManager({ lotteryType = "ssq", onBatchBet, onSelectForBet }: WatchlistManagerProps) {
    const { isSignedIn, userId } = useAuth();
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editNumbers, setEditNumbers] = useState<string>("");
    const [collapsed, setCollapsed] = useState(false);

    // 选择和倍数状态
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [multiples, setMultiples] = useState<Map<number, number>>(new Map());
    const [targetPeriod, setTargetPeriod] = useState<number>(0);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchResult, setBatchResult] = useState<{ success: boolean; message: string } | null>(null);

    // 分组折叠状态（过期的默认折叠）
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["current", "next"]));

    // 获取最新期号
    useEffect(() => {
        const fetchLatestPeriod = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/${lotteryType}?limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.items && data.items.length > 0) {
                        setTargetPeriod(parseInt(data.items[0].period) + 1);
                    }
                }
            } catch (err) {
                console.error("获取期号失败:", err);
            }
        };
        fetchLatestPeriod();
    }, [lotteryType]);

    const loadWatchlist = async () => {
        if (!isSignedIn || !userId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/betting/watchlist?lottery_type=${lotteryType}`,
                {
                    headers: { "X-Clerk-User-Id": userId },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setItems(data);
                // 初始化倍数
                const newMultiples = new Map<number, number>();
                data.forEach((item: WatchlistItem) => newMultiples.set(item.id, 1));
                setMultiples(newMultiples);
            }
        } catch (err) {
            console.error("加载收藏失败:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWatchlist();
    }, [isSignedIn, userId, lotteryType]);

    // 按期号分组
    const periodGroups = useMemo<PeriodGroup[]>(() => {
        const groups = new Map<string, WatchlistItem[]>();
        const latestPeriod = targetPeriod - 1; // 最新已开奖期号

        items.forEach(item => {
            const key = item.target_period ? String(item.target_period) : "general";
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(item);
        });

        const result: PeriodGroup[] = [];

        // 下一期（目标期号）
        if (groups.has(String(targetPeriod))) {
            result.push({
                period: targetPeriod,
                label: `${targetPeriod}期 (下一期)`,
                isExpired: false,
                isCurrent: true,
                items: groups.get(String(targetPeriod))!
            });
        }

        // 其他期号（按期号倒序）
        const periodKeys = Array.from(groups.keys())
            .filter(k => k !== "general" && k !== String(targetPeriod))
            .sort((a, b) => parseInt(b) - parseInt(a));

        periodKeys.forEach(key => {
            const period = parseInt(key);
            const isExpired = period <= latestPeriod;
            result.push({
                period,
                label: `${period}期${isExpired ? " (已过期)" : ""}`,
                isExpired,
                isCurrent: false,
                items: groups.get(key)!
            });
        });

        // 通用收藏（无期号）
        if (groups.has("general")) {
            result.push({
                period: null,
                label: "通用收藏",
                isExpired: false,
                isCurrent: false,
                items: groups.get("general")!
            });
        }

        return result;
    }, [items, targetPeriod]);

    // 切换分组展开
    const toggleGroup = (key: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedGroups(newExpanded);
    };

    const getGroupKey = (group: PeriodGroup) => {
        if (group.isCurrent) return "current";
        if (group.period === null) return "general";
        return String(group.period);
    };

    const handleDelete = async (id: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/betting/watchlist/${id}`, {
                method: "DELETE",
                headers: { "X-Clerk-User-Id": userId },
            });
            if (res.ok) {
                setItems(items.filter(item => item.id !== id));
                selectedIds.delete(id);
                setSelectedIds(new Set(selectedIds));
            }
        } catch (err) {
            console.error("删除失败:", err);
        }
    };

    // 批量删除
    const handleBatchDelete = async () => {
        if (selectedIds.size === 0 || !userId) return;

        setBatchLoading(true);
        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`${API_BASE_URL}/api/betting/watchlist/${id}`, {
                    method: "DELETE",
                    headers: { "X-Clerk-User-Id": userId },
                })
            );
            await Promise.all(deletePromises);
            setItems(items.filter(item => !selectedIds.has(item.id)));
            setSelectedIds(new Set());
            setBatchResult({ success: true, message: `已删除 ${selectedIds.size} 条` });
        } catch (err) {
            setBatchResult({ success: false, message: "批量删除失败" });
        } finally {
            setBatchLoading(false);
            setTimeout(() => setBatchResult(null), 2000);
        }
    };

    // 批量投注
    const handleBatchBet = async () => {
        if (selectedIds.size === 0 || !userId || !targetPeriod) return;

        setBatchLoading(true);
        setBatchResult(null);

        try {
            const selectedItems = items.filter(item => selectedIds.has(item.id));
            const betPromises = selectedItems.map(item => {
                const multiple = multiples.get(item.id) || 1;
                return fetch(`${API_BASE_URL}/api/betting/bets`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Clerk-User-Id": userId,
                    },
                    body: JSON.stringify({
                        lottery_type: lotteryType,
                        bet_type: "single",
                        target_period: targetPeriod,
                        numbers: item.numbers,
                        multiple,
                    }),
                });
            });

            const results = await Promise.all(betPromises);
            const successCount = results.filter(r => r.ok).length;

            if (successCount === selectedItems.length) {
                setBatchResult({
                    success: true,
                    message: `成功投注 ${successCount} 注`
                });
                setSelectedIds(new Set());
            } else {
                setBatchResult({
                    success: false,
                    message: `${successCount}/${selectedItems.length} 成功`
                });
            }
        } catch (err) {
            setBatchResult({ success: false, message: "批量投注失败" });
        } finally {
            setBatchLoading(false);
            setTimeout(() => setBatchResult(null), 3000);
        }
    };

    // 选择操作
    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(item => item.id)));
        }
    };

    // 全选当前分组
    const selectGroup = (group: PeriodGroup) => {
        const newSelected = new Set(selectedIds);
        const allSelected = group.items.every(item => selectedIds.has(item.id));

        if (allSelected) {
            group.items.forEach(item => newSelected.delete(item.id));
        } else {
            group.items.forEach(item => newSelected.add(item.id));
        }
        setSelectedIds(newSelected);
    };

    // 倍数操作
    const setMultiple = (id: number, value: number) => {
        const newMultiples = new Map(multiples);
        newMultiples.set(id, Math.max(1, Math.min(99, value)));
        setMultiples(newMultiples);
    };

    const startEdit = (item: WatchlistItem) => {
        setEditingId(item.id);
        if (lotteryType === "ssq") {
            const red = item.numbers.red?.join(",") || "";
            const blue = item.numbers.blue;
            setEditNumbers(`${red}+${blue}`);
        } else {
            const front = item.numbers.front?.join(",") || "";
            const back = (item.numbers.back as number[])?.join(",") || "";
            setEditNumbers(`${front}+${back}`);
        }
    };

    const saveEdit = async (id: number) => {
        if (!userId) return;

        try {
            let numbers: any;
            const parts = editNumbers.split("+");

            if (lotteryType === "ssq") {
                const red = parts[0].split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                const blue = parseInt(parts[1]?.trim());
                numbers = { red, blue: isNaN(blue) ? 1 : blue };
            } else {
                const front = parts[0].split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                const back = parts[1]?.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n)) || [];
                numbers = { front, back };
            }

            const res = await fetch(`${API_BASE_URL}/api/betting/watchlist/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Clerk-User-Id": userId
                },
                body: JSON.stringify({ numbers }),
            });

            if (res.ok) {
                const updated = await res.json();
                setItems(items.map(item =>
                    item.id === id ? { ...item, numbers: updated.numbers } : item
                ));
                setEditingId(null);
            }
        } catch (err) {
            console.error("更新失败:", err);
        }
    };

    const formatSource = (source: string) => {
        const map: Record<string, string> = {
            timeseries: "时序",
            metaphysical: "玄学",
            kill: "杀号",
            comprehensive: "综合",
            manual: "手动",
            recommendation: "推荐",
        };
        return map[source] || source;
    };

    // 计算选中总金额
    const calculateTotal = () => {
        let total = 0;
        selectedIds.forEach(id => {
            const multiple = multiples.get(id) || 1;
            total += 2 * multiple; // 单式每注2元
        });
        return total;
    };

    // 渲染单个收藏项
    const renderItem = (item: WatchlistItem) => (
        <div key={item.id} className={cn(
            "p-3 transition-colors",
            selectedIds.has(item.id) ? "bg-primary/5" : "hover:bg-muted/20"
        )}>
            {editingId === item.id ? (
                /* 编辑模式 */
                <div className="flex items-center gap-2">
                    <input
                        value={editNumbers}
                        onChange={(e) => setEditNumbers(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm rounded bg-muted border border-border"
                        placeholder={lotteryType === "ssq" ? "1,2,3,4,5,6+7" : "1,2,3,4,5+1,2"}
                    />
                    <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1.5 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                /* 展示模式 */
                <div className="flex items-center gap-3">
                    {/* 选择框 */}
                    <button
                        onClick={() => toggleSelect(item.id)}
                        className="shrink-0"
                    >
                        {selectedIds.has(item.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                        )}
                    </button>

                    {/* 号码 */}
                    <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                        {(item.numbers.red || item.numbers.front || []).map((n, i) => (
                            <span key={i} className="ball ball-red text-xs" style={{ width: 26, height: 26 }}>
                                {n.toString().padStart(2, "0")}
                            </span>
                        ))}
                        <span className="text-muted-foreground text-sm">+</span>
                        {lotteryType === "ssq" ? (
                            <span className="ball ball-blue text-xs" style={{ width: 26, height: 26 }}>
                                {(item.numbers.blue as number)?.toString().padStart(2, "0")}
                            </span>
                        ) : (
                            (item.numbers.back as number[] || []).map((n, i) => (
                                <span key={i} className="ball ball-blue text-xs" style={{ width: 26, height: 26 }}>
                                    {n.toString().padStart(2, "0")}
                                </span>
                            ))
                        )}
                        <span className="text-xs text-muted-foreground ml-1">
                            {formatSource(item.source)}
                        </span>
                    </div>

                    {/* 倍数控制 */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => setMultiple(item.id, (multiples.get(item.id) || 1) - 1)}
                            className="p-1 rounded bg-muted hover:bg-border"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                            {multiples.get(item.id) || 1}
                        </span>
                        <button
                            onClick={() => setMultiple(item.id, (multiples.get(item.id) || 1) + 1)}
                            className="p-1 rounded bg-muted hover:bg-border"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 shrink-0">
                        {onSelectForBet && (
                            <button
                                onClick={() => onSelectForBet(item)}
                                className="p-1.5 rounded hover:bg-primary/20 text-primary"
                                title="添加到投注面板"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded hover:bg-muted"
                            title="编辑"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-500"
                            title="删除"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (!isSignedIn) {
        return (
            <div className="glass-card p-4 text-center text-muted-foreground">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>登录后可使用收藏功能</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            {/* 头部 */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">我的收藏</h3>
                    <span className="text-sm text-muted-foreground">({items.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); loadWatchlist(); }}
                        className="p-1.5 rounded hover:bg-muted"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
            </div>

            {/* 批量操作栏 */}
            {!collapsed && items.length > 0 && (
                <div className="border-t border-border p-3 bg-muted/30 space-y-3">
                    {/* 选择和期号 */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <button
                            onClick={selectAll}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            {selectedIds.size === items.length ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            {selectedIds.size > 0 ? `已选 ${selectedIds.size}` : "全选"}
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">目标期号:</span>
                            <input
                                type="number"
                                value={targetPeriod || ""}
                                onChange={(e) => setTargetPeriod(parseInt(e.target.value) || 0)}
                                className="w-24 px-2 py-1 rounded bg-muted border border-border text-sm text-center"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-sm">
                                <span className="text-muted-foreground">选中 </span>
                                <span className="font-bold">{selectedIds.size}</span>
                                <span className="text-muted-foreground"> 注 | 合计 </span>
                                <span className="font-bold text-primary">¥{calculateTotal()}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBatchDelete}
                                    disabled={batchLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30 disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" /> 批量删除
                                </button>
                                <button
                                    onClick={handleBatchBet}
                                    disabled={batchLoading || !targetPeriod}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" /> 批量投注
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 结果提示 */}
                    {batchResult && (
                        <div className={cn(
                            "text-sm px-3 py-2 rounded",
                            batchResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        )}>
                            {batchResult.message}
                        </div>
                    )}
                </div>
            )}

            {/* 分组列表 */}
            {!collapsed && (
                <div className="border-t border-border">
                    {periodGroups.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            <p className="text-sm">暂无收藏</p>
                            <p className="text-xs mt-1">在推荐号码旁点击 + 添加</p>
                        </div>
                    ) : (
                        periodGroups.map(group => {
                            const key = getGroupKey(group);
                            const isExpanded = expandedGroups.has(key) || group.isCurrent;
                            const groupSelectedCount = group.items.filter(item => selectedIds.has(item.id)).length;

                            return (
                                <div key={key} className="border-b border-border last:border-b-0">
                                    {/* 分组头部 */}
                                    <div
                                        className={cn(
                                            "flex items-center justify-between px-4 py-2 cursor-pointer",
                                            group.isCurrent ? "bg-primary/10" : group.isExpired ? "bg-muted/50" : "bg-muted/30",
                                            "hover:bg-muted/40"
                                        )}
                                        onClick={() => toggleGroup(key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            )}
                                            {group.isCurrent && <Clock className="w-4 h-4 text-primary" />}
                                            {group.isExpired && <Archive className="w-4 h-4 text-muted-foreground" />}
                                            <span className={cn(
                                                "text-sm font-medium",
                                                group.isCurrent ? "text-primary" : group.isExpired ? "text-muted-foreground" : ""
                                            )}>
                                                {group.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ({group.items.length}条)
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); selectGroup(group); }}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            {groupSelectedCount === group.items.length ? "取消全选" : "全选"}
                                        </button>
                                    </div>

                                    {/* 分组内容 */}
                                    {isExpanded && (
                                        <div className="divide-y divide-border">
                                            {group.items.map(renderItem)}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
