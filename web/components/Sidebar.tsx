"use client";

import { cn } from "@/lib/utils";
import { BarChart3, ListOrdered, ChevronRight, TrendingUp, Sparkles, Clock, Scissors, Moon, Layers } from "lucide-react";

export type MainSection = "results" | "analysis" | "prediction";
export type AnalysisTab = "basic" | "trend";
export type PredictionTab = "timeseries" | "kill" | "metaphysical" | "comprehensive";
export type LotteryType = "ssq" | "dlt";

interface SidebarProps {
    mainSection: MainSection;
    analysisTab: AnalysisTab;
    predictionTab: PredictionTab;
    lotteryType: LotteryType;
    onMainSectionChange: (section: MainSection) => void;
    onAnalysisTabChange: (tab: AnalysisTab) => void;
    onPredictionTabChange: (tab: PredictionTab) => void;
    onLotteryTypeChange: (type: LotteryType) => void;
}

export function Sidebar({
    mainSection,
    analysisTab,
    predictionTab,
    lotteryType,
    onMainSectionChange,
    onAnalysisTabChange,
    onPredictionTabChange,
    onLotteryTypeChange,
}: SidebarProps) {
    return (
        <aside className="w-56 shrink-0 border-r border-border bg-card/50 min-h-[calc(100vh-64px)]">
            <div className="p-4 space-y-6">
                {/* 彩种选择 */}
                <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        彩种
                    </h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onLotteryTypeChange("ssq")}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                lotteryType === "ssq"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-border"
                            )}
                        >
                            双色球
                        </button>
                        <button
                            onClick={() => onLotteryTypeChange("dlt")}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                lotteryType === "dlt"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-border"
                            )}
                        >
                            大乐透
                        </button>
                    </div>
                </div>

                {/* 主导航 */}
                <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        功能
                    </h3>

                    <button
                        onClick={() => onMainSectionChange("results")}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            mainSection === "results"
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                        )}
                    >
                        <ListOrdered className="w-4 h-4" />
                        开奖结果
                    </button>

                    <button
                        onClick={() => onMainSectionChange("analysis")}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            mainSection === "analysis"
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                        )}
                    >
                        <BarChart3 className="w-4 h-4" />
                        数据分析
                        <ChevronRight className={cn(
                            "w-4 h-4 ml-auto transition-transform",
                            mainSection === "analysis" && "rotate-90"
                        )} />
                    </button>

                    {/* 数据分析子导航 */}
                    {mainSection === "analysis" && (
                        <div className="pl-4 space-y-1 border-l-2 border-border ml-3">
                            <button
                                onClick={() => onAnalysisTabChange("basic")}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    analysisTab === "basic"
                                        ? "bg-muted text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                基础分析
                            </button>
                            <button
                                onClick={() => onAnalysisTabChange("trend")}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    analysisTab === "trend"
                                        ? "bg-muted text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                走势分析
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => onMainSectionChange("prediction")}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            mainSection === "prediction"
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                        )}
                    >
                        <Sparkles className="w-4 h-4" />
                        号码推荐
                        <ChevronRight className={cn(
                            "w-4 h-4 ml-auto transition-transform",
                            mainSection === "prediction" && "rotate-90"
                        )} />
                    </button>

                    {/* 号码推荐子导航 */}
                    {mainSection === "prediction" && (
                        <div className="pl-4 space-y-1 border-l-2 border-border ml-3">
                            <button
                                onClick={() => onPredictionTabChange("timeseries")}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    predictionTab === "timeseries"
                                        ? "bg-muted text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                时间序列
                            </button>
                            <button
                                onClick={() => onPredictionTabChange("kill")}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    predictionTab === "kill"
                                        ? "bg-muted text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Scissors className="w-3.5 h-3.5" />
                                杀号策略
                            </button>
                            <button
                                onClick={() => onPredictionTabChange("metaphysical")}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    predictionTab === "metaphysical"
                                        ? "bg-muted text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Moon className="w-3.5 h-3.5" />
                                玄学预测
                            </button>
                            <button
                                onClick={() => onPredictionTabChange("comprehensive")}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    predictionTab === "comprehensive"
                                        ? "bg-muted text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                综合推荐
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
