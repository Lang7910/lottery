"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { AddToWatchlist } from "@/components/AddToWatchlist";
import { getWaveColor } from "@/lib/hk6Utils";

interface PredictionResult {
    method: string;
    method_name: string;
    numbers: number[];
    special: number;
    wave_prediction?: { predicted: string; confidence: number };
    zodiac_prediction?: { predicted: string; confidence: number };
    error?: string;
}

interface RecommendedSet {
    numbers: number[];
    special: number;
    agg_method: string;
}

interface RecommendResponse {
    predictions: PredictionResult[];
    sets: RecommendedSet[];
    aggregation: string;
    wave_trend?: { predicted: string };
    zodiac_trend?: { predicted: string };
    error?: string;
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

export function HK6Prediction() {
    const [data, setData] = useState<RecommendResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPeriod, setNextPeriod] = useState<number>(0);

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
                `${API_BASE_URL}/api/analysis/hk6/recommend?lookback=${lookback}&num_sets=${numSets}&aggregation=all`
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
        // 获取下一期期号
        fetch(`${API_BASE_URL}/api/hk6?limit=1`)
            .then(res => res.json())
            .then(data => {
                if (data.items?.[0]) {
                    const { year, no } = data.items[0];
                    setNextPeriod(year * 1000 + no + 1);
                }
            })
            .catch(console.error);
    }, []);

    const getBallClass = (num: number) => {
        const wave = getWaveColor(num);
        return wave === "red" ? "ball-red" : wave === "blue" ? "ball-blue" : "ball-green";
    };

    const getWaveLabel = (wave: string) => {
        return wave === "red" ? "红波" : wave === "blue" ? "蓝波" : "绿波";
    };

    const getWaveBgClass = (wave: string) => {
        return wave === "red" ? "bg-red-500" : wave === "blue" ? "bg-blue-500" : "bg-green-500";
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">六合彩 - 时间序列预测</h2>
                    <p className="text-sm text-muted-foreground mt-1">基于历史数据的下期号码、波色、生肖预测</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "bg-muted hover:bg-border transition-colors",
                            showAdvanced && "bg-primary/10 text-primary"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        参数
                        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={loadPredictions}
                        disabled={loading}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                            "bg-primary text-primary-foreground hover:opacity-90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        预测
                    </button>
                </div>
            </div>

            {/* 高级参数面板 */}
            {showAdvanced && (
                <div className="glass-card p-4 space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">历史期数:</span>
                            <input
                                type="number"
                                min={20}
                                max={500}
                                value={lookback}
                                onChange={(e) => setLookback(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded bg-muted border border-border text-sm"
                            />
                        </label>
                        <label className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">推荐组数:</span>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={numSets}
                                onChange={(e) => setNumSets(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded bg-muted border border-border text-sm"
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {/* 加载中 */}
            {loading && (
                <div className="glass-card p-8 text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-muted-foreground">正在分析历史数据...</p>
                </div>
            )}

            {/* 预测结果 */}
            {!loading && data && data.error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {data.error}
                </div>
            )}

            {!loading && data && !data.error && (
                <>
                    {/* 趋势预测 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-card p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">波色趋势</h4>
                            <div className="flex items-center gap-3">
                                <span className={cn("px-3 py-1.5 rounded-lg text-white font-medium", getWaveBgClass(data.wave_trend?.predicted || "red"))}>
                                    {getWaveLabel(data.wave_trend?.predicted || "red")}
                                </span>
                                <span className="text-sm text-muted-foreground">预测下期特码可能开出</span>
                            </div>
                        </div>
                        <div className="glass-card p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">生肖趋势</h4>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">
                                    {data.zodiac_trend?.predicted || "龙"}
                                </span>
                                <span className="text-sm text-muted-foreground">预测下期特码可能生肖</span>
                            </div>
                        </div>
                    </div>

                    {/* 推荐号码组 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                推荐号码组
                            </h3>
                            <span className="text-xs text-muted-foreground">共 {data.sets?.length || 0} 组</span>
                        </div>
                        <div className="divide-y divide-border">
                            {(data.sets || []).map((set, idx) => (
                                <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                            {set.agg_method}
                                        </span>
                                        <AddToWatchlist
                                            lotteryType="hk6"
                                            numbers={{ numbers: set.numbers, special: set.special }}
                                            targetPeriod={nextPeriod}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {set.numbers.map((num, i) => (
                                            <div key={i} className={cn("ball", getBallClass(num))}>
                                                {num.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                        <span className="text-xl text-muted-foreground mx-1">+</span>
                                        <div className={cn("ball ring-2 ring-amber-400", getBallClass(set.special))}>
                                            {set.special.toString().padStart(2, "0")}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 各方法详细预测 */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold">算法详情</h3>
                            <p className="text-xs text-muted-foreground mt-1">5种时间序列预测方法的独立结果</p>
                        </div>
                        <div className="divide-y divide-border">
                            {(data.predictions || []).map((pred, idx) => (
                                <div key={idx} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">{pred.method_name}</span>
                                        {pred.error ? (
                                            <span className="text-xs text-destructive">{pred.error}</span>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {pred.wave_prediction && (
                                                    <span className={cn("px-2 py-0.5 rounded text-white", getWaveBgClass(pred.wave_prediction.predicted))}>
                                                        {getWaveLabel(pred.wave_prediction.predicted)}
                                                    </span>
                                                )}
                                                {pred.zodiac_prediction && (
                                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                                        {pred.zodiac_prediction.predicted}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {!pred.error && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {pred.numbers.map((num, i) => (
                                                <span key={i} className={cn("w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center", getWaveBgClass(getWaveColor(num)))}>
                                                    {num.toString().padStart(2, "0")}
                                                </span>
                                            ))}
                                            <span className="mx-1 text-muted-foreground">+</span>
                                            <span className={cn("w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ring-2 ring-amber-400", getWaveBgClass(getWaveColor(pred.special)))}>
                                                {pred.special.toString().padStart(2, "0")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
