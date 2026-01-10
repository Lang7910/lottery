"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles, Settings, ChevronDown, ChevronUp, Sliders } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { AddToWatchlist } from "@/components/AddToWatchlist";

interface PredictionResult {
    method: string;
    method_name: string;
    front: number[];
    back: number[];
    params?: Record<string, number>;
    error?: string;
}

interface RecommendedSet {
    front: number[];
    back: number[];
    agg_method: string;
}

interface RecommendResponse {
    predictions: PredictionResult[];
    sets: RecommendedSet[];
    aggregation: string;
}

interface MethodParams {
    ma: { window: number };
    es: { alpha: number };
    rf: { n_lags: number; n_estimators: number };
    svr: { n_lags: number };
    arima: { p: number; d: number; q: number };
}

const DEFAULT_PARAMS: MethodParams = {
    ma: { window: 5 },
    es: { alpha: 0.3 },
    rf: { n_lags: 5, n_estimators: 50 },
    svr: { n_lags: 5 },
    arima: { p: 1, d: 0, q: 1 }
};

export function DLTPrediction() {
    const [data, setData] = useState<RecommendResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lookback, setLookback] = useState(100);
    const [numSets, setNumSets] = useState(5);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showParams, setShowParams] = useState(false);
    const [params, setParams] = useState<MethodParams>(DEFAULT_PARAMS);

    const updateParam = (method: keyof MethodParams, key: string, value: number) => {
        setParams(prev => ({
            ...prev,
            [method]: { ...prev[method], [key]: value }
        }));
    };

    const loadPredictions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/analysis/dlt/recommend?lookback=${lookback}&num_sets=${numSets}&aggregation=all`
            );
            if (!res.ok) throw new Error("获取预测失败");
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPredictions();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">大乐透 - 时间序列预测</h2>
                    <p className="text-sm text-muted-foreground mt-1">基于历史数据的下期号码预测</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <select
                        value={lookback}
                        onChange={(e) => setLookback(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={50}>最近50期</option>
                        <option value={100}>最近100期</option>
                        <option value={200}>最近200期</option>
                        <option value={500}>最近500期</option>
                    </select>
                    <select
                        value={numSets}
                        onChange={(e) => setNumSets(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={3}>推荐3注</option>
                        <option value={5}>推荐5注</option>
                        <option value={10}>推荐10注</option>
                    </select>
                    <button
                        onClick={() => setShowParams(!showParams)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            showParams ? "bg-primary/10 text-primary" : "bg-muted hover:bg-border"
                        )}
                    >
                        <Sliders className="w-4 h-4" /> 参数
                    </button>
                    <button
                        onClick={loadPredictions}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 预测
                    </button>
                </div>
            </div>

            {/* 参数调节面板 */}
            {showParams && (
                <div className="glass-card p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Sliders className="w-4 h-4" /> 方法参数调节
                    </h3>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* MA */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="text-sm font-medium">移动平均 (MA)</div>
                            <label className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">窗口大小</span>
                                <input
                                    type="number"
                                    min={3}
                                    max={20}
                                    value={params.ma.window}
                                    onChange={(e) => updateParam("ma", "window", Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-background border border-border text-center"
                                />
                            </label>
                        </div>

                        {/* ES */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="text-sm font-medium">指数平滑 (ES)</div>
                            <label className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">平滑系数 α</span>
                                <input
                                    type="number"
                                    min={0.1}
                                    max={0.9}
                                    step={0.1}
                                    value={params.es.alpha}
                                    onChange={(e) => updateParam("es", "alpha", Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-background border border-border text-center"
                                />
                            </label>
                        </div>

                        {/* RF */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="text-sm font-medium">随机森林 (RF)</div>
                            <label className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">滞后期数</span>
                                <input
                                    type="number"
                                    min={3}
                                    max={15}
                                    value={params.rf.n_lags}
                                    onChange={(e) => updateParam("rf", "n_lags", Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-background border border-border text-center"
                                />
                            </label>
                            <label className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">树数量</span>
                                <input
                                    type="number"
                                    min={10}
                                    max={200}
                                    step={10}
                                    value={params.rf.n_estimators}
                                    onChange={(e) => updateParam("rf", "n_estimators", Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-background border border-border text-center"
                                />
                            </label>
                        </div>

                        {/* SVR */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="text-sm font-medium">支持向量机 (SVR)</div>
                            <label className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">滞后期数</span>
                                <input
                                    type="number"
                                    min={3}
                                    max={15}
                                    value={params.svr.n_lags}
                                    onChange={(e) => updateParam("svr", "n_lags", Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-background border border-border text-center"
                                />
                            </label>
                        </div>

                        {/* ARIMA */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2 sm:col-span-2 lg:col-span-1">
                            <div className="text-sm font-medium">ARIMA</div>
                            <div className="flex gap-2">
                                <label className="flex-1 text-xs">
                                    <span className="text-muted-foreground block mb-1">p (AR)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={5}
                                        value={params.arima.p}
                                        onChange={(e) => updateParam("arima", "p", Number(e.target.value))}
                                        className="w-full px-2 py-1 rounded bg-background border border-border text-center"
                                    />
                                </label>
                                <label className="flex-1 text-xs">
                                    <span className="text-muted-foreground block mb-1">d (差分)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={2}
                                        value={params.arima.d}
                                        onChange={(e) => updateParam("arima", "d", Number(e.target.value))}
                                        className="w-full px-2 py-1 rounded bg-background border border-border text-center"
                                    />
                                </label>
                                <label className="flex-1 text-xs">
                                    <span className="text-muted-foreground block mb-1">q (MA)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={5}
                                        value={params.arima.q}
                                        onChange={(e) => updateParam("arima", "q", Number(e.target.value))}
                                        className="w-full px-2 py-1 rounded bg-background border border-border text-center"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setParams(DEFAULT_PARAMS)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-border"
                        >
                            重置默认
                        </button>
                        <button
                            onClick={loadPredictions}
                            disabled={loading}
                            className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                        >
                            应用并预测
                        </button>
                    </div>
                </div>
            )}

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">预测中...</div>
            ) : data && (
                <>
                    {/* 推荐号码组 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">推荐号码</h3>
                            <span className="text-xs text-muted-foreground ml-2">共 {data.sets.length} 注</span>
                        </div>
                        <div className="divide-y divide-border">
                            {data.sets.map((set, idx) => (
                                <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                                                {set.agg_method}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex gap-1.5">
                                                {set.front?.map((n, i) => (
                                                    <div key={i} className="ball ball-front text-xs" style={{ width: 30, height: 30 }}>
                                                        {n.toString().padStart(2, "0")}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-muted-foreground text-xs">+</span>
                                            <div className="flex gap-1.5">
                                                {set.back?.map((n, i) => (
                                                    <div key={i} className="ball ball-back text-xs" style={{ width: 30, height: 30 }}>
                                                        {n.toString().padStart(2, "0")}
                                                    </div>
                                                ))}
                                            </div>
                                            <AddToWatchlist
                                                lotteryType="dlt"
                                                numbers={{ front: set.front, back: set.back }}
                                                source="timeseries"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 各方法详细结果 */}
                    <div className="glass-card overflow-hidden">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">各方法预测详情</h3>
                            </div>
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showAdvanced && (
                            <div className="border-t border-border divide-y divide-border">
                                {data.predictions.map((pred) => (
                                    <div key={pred.method} className="p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium w-24">{pred.method_name}</span>
                                                <span className="text-xs text-muted-foreground uppercase">{pred.method}</span>
                                            </div>
                                            {pred.error ? (
                                                <span className="text-sm text-accent">{pred.error}</span>
                                            ) : (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="flex gap-1.5">
                                                        {pred.front?.map((n, i) => (
                                                            <div key={i} className="ball ball-front text-xs" style={{ width: 26, height: 26 }}>
                                                                {n.toString().padStart(2, "0")}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-muted-foreground text-xs">+</span>
                                                    <div className="flex gap-1.5">
                                                        {pred.back?.map((n, i) => (
                                                            <div key={i} className="ball ball-back text-xs" style={{ width: 26, height: 26 }}>
                                                                {n.toString().padStart(2, "0")}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 说明 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-3">聚合方法说明</h3>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div><span className="font-medium text-foreground">多数投票</span> - 选择各方法预测中出现最多的号码</div>
                            <div><span className="font-medium text-foreground">平均法</span> - 取各方法预测值的平均</div>
                            <div><span className="font-medium text-foreground">加权平均</span> - ML方法权重更高的加权平均</div>
                            <div><span className="font-medium text-foreground">变体</span> - 基于综合结果的随机微调</div>
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        注：预测结果仅供参考，彩票开奖为随机事件，请理性购彩
                    </div>
                </>
            )}
        </div>
    );
}
