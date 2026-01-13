"use client";

import { cn } from "@/lib/utils";
import { BarChart3, ListOrdered, ChevronRight, TrendingUp, Sparkles, Clock, Scissors, Moon, Layers, ChevronDown } from "lucide-react";

export type MainSection = "results" | "analysis" | "prediction";
export type AnalysisTab = "basic" | "trend";
export type PredictionTab = "timeseries" | "kill" | "metaphysical" | "comprehensive";
export type LotteryType = "ssq" | "dlt" | "hk6";

const LOTTERY_OPTIONS = [
    { value: "ssq", label: "双色球", color: "text-red-500" },
    { value: "dlt", label: "大乐透", color: "text-blue-500" },
    { value: "hk6", label: "六合彩", color: "text-green-500" },
] as const;

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
    const currentLottery = LOTTERY_OPTIONS.find(o => o.value === lotteryType);

    return (
        <aside className="w-56 shrink-0 border-r border-border bg-card/50 min-h-[calc(100vh-64px)]">
            <div className="p-4 space-y-6">
                {/* 彩种选择 - 下拉菜单 */}
                <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        彩种
                    </h3>
                    <div className="relative">
                        <select
                            value={lotteryType}
                            onChange={(e) => onLotteryTypeChange(e.target.value as LotteryType)}
                            className={cn(
                                "w-full px-3 py-2.5 rounded-lg text-sm font-semibold appearance-none cursor-pointer",
                                "bg-muted border border-border hover:bg-border/80 transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                                currentLottery?.color
                            )}
                        >
                            {LOTTERY_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
