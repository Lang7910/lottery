"use client";

import React, { useState, useEffect } from "react";
import {
    RefreshCw, Sparkles, Moon, Sun, Flame, Droplets, Mountain, Wind,
    Zap, Settings, Calendar, MapPin, User, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import { AddToWatchlist } from "@/components/AddToWatchlist";

// 五行配置
const WUXING_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    金: { icon: <Mountain className="w-4 h-4" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    木: { icon: <Wind className="w-4 h-4" />, color: "text-green-400", bgColor: "bg-green-500/20" },
    水: { icon: <Droplets className="w-4 h-4" />, color: "text-blue-400", bgColor: "bg-blue-500/20" },
    火: { icon: <Flame className="w-4 h-4" />, color: "text-red-400", bgColor: "bg-red-500/20" },
    土: { icon: <Mountain className="w-4 h-4" />, color: "text-amber-600", bgColor: "bg-amber-600/20" },
};

// 省份列表
const PROVINCES = [
    "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
    "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东",
    "河南", "湖北", "湖南", "广东", "广西", "海南",
    "重庆", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"
];

// 方法配置
const METHODS = [
    { key: "bazi_wuxing", name: "八字五行", icon: <Moon className="w-4 h-4" />, requires: ["天时"] },
    { key: "wealth_element", name: "本命财星", icon: <Sparkles className="w-4 h-4" />, requires: ["人和"] },
    { key: "conflict_check", name: "刑冲合害", icon: <AlertTriangle className="w-4 h-4" />, requires: ["天时", "人和"] },
    { key: "mingua_direction", name: "命卦空间", icon: <MapPin className="w-4 h-4" />, requires: ["人和", "地利"] },
    { key: "meihua", name: "梅花易数", icon: <Zap className="w-4 h-4" />, requires: [] },
    { key: "jiazi_cycle", name: "六十甲子", icon: <Calendar className="w-4 h-4" />, requires: ["天时"] },
];

interface MetaphysicalPredictionProps {
    lotteryType?: "ssq" | "dlt";
}

export function MetaphysicalPrediction({ lotteryType = "ssq" }: MetaphysicalPredictionProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    // 三才输入
    const [showInputPanel, setShowInputPanel] = useState(true);
    // 天时
    const [useCustomTime, setUseCustomTime] = useState(false);
    const [customTime, setCustomTime] = useState("");
    // 地利
    const [location, setLocation] = useState("");
    // 人和
    const [birthDate, setBirthDate] = useState("");
    const [birthHour, setBirthHour] = useState<number | "">("");
    const [gender, setGender] = useState<"male" | "female">("male");

    // 方法选择
    const [selectedMethods, setSelectedMethods] = useState<string[]>(["bazi_wuxing", "meihua"]);
    const [activeMethodTab, setActiveMethodTab] = useState("bazi_wuxing");
    const [numSets, setNumSets] = useState(5);

    // 检查方法是否可用
    const isMethodAvailable = (method: typeof METHODS[0]) => {
        for (const req of method.requires) {
            if (req === "天时" && !useCustomTime) continue; // 自动天时总是可用
            if (req === "人和" && !birthDate) return false;
            if (req === "地利" && !location) return false;
        }
        return true;
    };

    const toggleMethod = (key: string) => {
        setSelectedMethods(prev =>
            prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
        );
    };

    const predict = async () => {
        setLoading(true);
        setError(null);
        try {
            const body: any = {
                methods: selectedMethods.length > 0 ? selectedMethods : null,
                num_sets: numSets,
                gender
            };
            if (useCustomTime && customTime) {
                body.custom_time = customTime;
            }
            if (location) body.location = location;
            if (birthDate) body.birth_date = birthDate;
            if (birthHour !== "") body.birth_hour = birthHour;

            const res = await fetch(`${API_BASE_URL}/api/analysis/${lotteryType}/metaphysical`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error("预测请求失败");
            setResult(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        predict();
    }, [lotteryType]);

    const renderWuxingBar = (scores: Record<string, number>) => {
        if (!scores) return null;
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        return (
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {Object.entries(scores).map(([wx, score]) => (
                    <div
                        key={wx}
                        className={cn("transition-all", WUXING_CONFIG[wx]?.bgColor)}
                        style={{ width: `${(score / total) * 100}%` }}
                        title={`${wx}: ${score}分`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">玄学预测</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        天时 · 地利 · 人和 - {lotteryType === "ssq" ? "双色球" : "大乐透"}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <select
                        value={numSets}
                        onChange={(e) => setNumSets(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value={3}>3注</option>
                        <option value={5}>5注</option>
                        <option value={10}>10注</option>
                    </select>
                    <button
                        onClick={() => setShowInputPanel(!showInputPanel)}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            showInputPanel ? "bg-primary/10 text-primary" : "bg-muted hover:bg-border"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={predict}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 推算
                    </button>
                </div>
            </div>

            {/* 三才输入面板 */}
            {showInputPanel && (
                <div className="glass-card p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> 三才配置
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 天时 */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="w-4 h-4 text-primary" /> 天时
                            </div>
                            <label className="flex items-center gap-2 text-xs">
                                <input
                                    type="checkbox"
                                    checked={useCustomTime}
                                    onChange={(e) => setUseCustomTime(e.target.checked)}
                                    className="accent-primary"
                                />
                                自定义开奖时间
                            </label>
                            {useCustomTime && (
                                <input
                                    type="datetime-local"
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
                                />
                            )}
                            {!useCustomTime && (
                                <p className="text-xs text-muted-foreground">自动计算下期开奖时间</p>
                            )}
                        </div>

                        {/* 地利 */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <MapPin className="w-4 h-4 text-primary" /> 地利
                            </div>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
                            >
                                <option value="">选择购彩地点 (可选)</option>
                                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <p className="text-xs text-muted-foreground">用于命卦空间法</p>
                        </div>

                        {/* 人和 */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <User className="w-4 h-4 text-primary" /> 人和
                            </div>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                placeholder="出生日期"
                                className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
                            />
                            <div className="flex gap-2">
                                <select
                                    value={birthHour}
                                    onChange={(e) => setBirthHour(e.target.value ? Number(e.target.value) : "")}
                                    className="flex-1 px-2 py-1 rounded bg-background border border-border text-xs"
                                >
                                    <option value="">时辰(可选)</option>
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i}时</option>
                                    ))}
                                </select>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as "male" | "female")}
                                    className="flex-1 px-2 py-1 rounded bg-background border border-border text-xs"
                                >
                                    <option value="male">男</option>
                                    <option value="female">女</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 方法选择 */}
            <div className="glass-card p-4">
                <h3 className="font-semibold mb-3">选择预测方法</h3>
                <div className="flex flex-wrap gap-2">
                    {METHODS.map(method => {
                        const available = isMethodAvailable(method);
                        const selected = selectedMethods.includes(method.key);
                        return (
                            <button
                                key={method.key}
                                onClick={() => available && toggleMethod(method.key)}
                                disabled={!available}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    selected && available ? "bg-primary text-primary-foreground" :
                                        available ? "bg-muted hover:bg-border" :
                                            "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {method.icon}
                                {method.name}
                                {!available && <span className="text-[10px]">(需{method.requires.join("+")})</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-accent/10 text-accent text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">正在推算天机...</div>
            ) : result && (
                <>
                    {/* 运势提示 */}
                    {result.fortune && (
                        <div className={cn(
                            "p-4 rounded-lg border",
                            result.fortune === "吉" ? "bg-green-500/10 border-green-500/30" :
                                result.fortune === "凶" ? "bg-red-500/10 border-red-500/30" :
                                    "bg-yellow-500/10 border-yellow-500/30"
                        )}>
                            <div className="flex items-center gap-2">
                                {result.fortune === "吉" ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                                    result.fortune === "凶" ? <XCircle className="w-5 h-5 text-red-500" /> :
                                        <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                <span className="font-medium">今日运势: {result.fortune}</span>
                            </div>
                            {result.advice && <p className="text-sm text-muted-foreground mt-1">{result.advice}</p>}
                        </div>
                    )}

                    {/* 方法结果标签页 */}
                    <div className="glass-card overflow-hidden">
                        <div className="flex border-b border-border overflow-x-auto">
                            {Object.keys(result.methods || {}).map(key => {
                                const method = METHODS.find(m => m.key === key);
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveMethodTab(key)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                                            activeMethodTab === key
                                                ? "bg-primary/10 text-primary border-b-2 border-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {method?.icon}
                                        {method?.name || key}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-4">
                            {result.methods?.[activeMethodTab] && (
                                <MethodResult method={activeMethodTab} data={result.methods[activeMethodTab]} />
                            )}
                        </div>
                    </div>

                    {/* 综合热门号码 */}
                    {result.combined_hot?.length > 0 && (
                        <div className="glass-card p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-red-400" /> 综合热门号码
                            </h3>
                            <div className="flex gap-1.5 flex-wrap">
                                {result.combined_hot.map((n: number) => (
                                    <span key={n} className="ball ball-red text-xs" style={{ width: 26, height: 26 }}>
                                        {n.toString().padStart(2, "0")}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 推荐号码 */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" /> 推荐号码
                        </h3>
                        <div className="space-y-3">
                            {result.recommended_sets?.map((set: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 border border-border/50">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {(set.red || set.front || []).map((n: number, i: number) => (
                                            <div key={i} className="ball ball-red text-xs" style={{ width: 28, height: 28 }}>
                                                {n.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-muted-foreground">+</span>
                                    {set.blue !== undefined ? (
                                        <div className="ball ball-blue text-xs" style={{ width: 28, height: 28 }}>
                                            {set.blue.toString().padStart(2, "0")}
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            {(set.back || []).map((n: number, i: number) => (
                                                <div key={i} className="ball ball-blue text-xs" style={{ width: 28, height: 28 }}>
                                                    {n.toString().padStart(2, "0")}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <AddToWatchlist
                                        lotteryType={lotteryType}
                                        numbers={set.blue !== undefined
                                            ? { red: set.red || set.front, blue: set.blue }
                                            : { front: set.front || set.red, back: set.back }
                                        }
                                        source="metaphysical"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        ⚠️ 玄学推演仅供娱乐参考，不构成任何投注建议
                    </div>
                </>
            )}
        </div>
    );
}

// 方法结果展示组件
function MethodResult({ method, data }: { method: string; data: any }) {
    if (!data) return null;

    switch (method) {
        case "bazi_wuxing":
            return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <div className="text-2xl font-bold font-serif">{data.bazi?.day}</div>
                            <div className="text-xs text-muted-foreground">日柱 ({data.bazi?.day_wuxing})</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <div className="text-2xl font-bold font-serif">{data.bazi?.hour}</div>
                            <div className="text-xs text-muted-foreground">时柱 ({data.bazi?.hour_wuxing})</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {["wang", "xiang", "shuai"].map((key, idx) => {
                            const wx = data.analysis?.[key];
                            const labels = ["最旺", "次旺", "最衰"];
                            return wx ? (
                                <div key={key} className={cn("p-2 rounded-lg", WUXING_CONFIG[wx]?.bgColor, idx === 2 && "opacity-50")}>
                                    <span className={cn("text-lg font-bold", WUXING_CONFIG[wx]?.color)}>{wx}</span>
                                    <div className="text-xs text-muted-foreground">{labels[idx]}</div>
                                </div>
                            ) : null;
                        })}
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-2">热门号码 ({data.analysis?.wang})</div>
                        <div className="flex gap-1 flex-wrap">
                            {data.hot_numbers?.map((n: number) => (
                                <span key={n} className="ball ball-red text-xs" style={{ width: 24, height: 24 }}>{n}</span>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "wealth_element":
            return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-sm text-muted-foreground">日主</div>
                        <div className={cn("text-3xl font-bold", WUXING_CONFIG[data.day_master]?.color)}>{data.day_master}</div>
                        <div className="text-xs text-muted-foreground mt-2">{data.explanation}</div>
                    </div>
                    <div className={cn("p-4 rounded-lg", WUXING_CONFIG[data.wealth_element]?.bgColor)}>
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className={cn("w-5 h-5", WUXING_CONFIG[data.wealth_element]?.color)} />
                            <span className={cn("text-xl font-bold", WUXING_CONFIG[data.wealth_element]?.color)}>
                                财星: {data.wealth_element}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-2">财星号码</div>
                        <div className="flex gap-1 flex-wrap">
                            {data.wealth_numbers?.map((n: number) => (
                                <span key={n} className="ball ball-red text-xs" style={{ width: 24, height: 24 }}>{n}</span>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "conflict_check":
            return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-sm text-muted-foreground">开奖日</div>
                            <div className="text-xl font-bold">{data.draw_day}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-sm text-muted-foreground">生肖</div>
                            <div className="text-xl font-bold">{data.birth_animal}</div>
                        </div>
                    </div>
                    <div className={cn(
                        "p-4 rounded-lg text-center",
                        data.fortune === "吉" ? "bg-green-500/20" :
                            data.fortune === "凶" ? "bg-red-500/20" : "bg-yellow-500/20"
                    )}>
                        <div className="text-2xl font-bold">{data.fortune}</div>
                        <div className="text-sm text-muted-foreground mt-1">{data.advice}</div>
                    </div>
                </div>
            );

        case "mingua_direction":
            return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-sm text-muted-foreground">命卦</div>
                        <div className="text-3xl font-bold">{data.gua_name}</div>
                        <div className="text-sm text-muted-foreground">{data.is_east_life ? "东四命" : "西四命"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-2">吉利方位</div>
                        <div className="flex gap-2">
                            {data.lucky_directions?.map((d: string) => (
                                <span key={d} className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">{d}</span>
                            ))}
                        </div>
                    </div>
                    {data.location && (
                        <div className="text-sm">
                            购彩地点: {data.location} ({data.location_wuxing}) - {data.location_match}
                        </div>
                    )}
                </div>
            );

        case "meihua":
            return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-sm text-muted-foreground">上卦</div>
                            <div className="text-2xl font-bold">{data.upper?.name}</div>
                            <div className="text-xs text-muted-foreground">{data.upper?.wuxing} / {data.upper?.direction}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-sm text-muted-foreground">下卦</div>
                            <div className="text-2xl font-bold">{data.lower?.name}</div>
                            <div className="text-xs text-muted-foreground">{data.lower?.wuxing} / {data.lower?.direction}</div>
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 text-center">
                        <div className="text-sm">动爻: 第{data.yao}爻</div>
                        <div className="font-medium text-primary">{data.ti_yong_relation}</div>
                    </div>
                </div>
            );

        case "jiazi_cycle":
            return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-sm text-muted-foreground">开奖日干支</div>
                        <div className="text-3xl font-bold font-serif">{data.ganzhi}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            天干{data.gan_wuxing} + 地支{data.zhi_wuxing}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-2">周期共振号码</div>
                        <div className="flex gap-1 flex-wrap">
                            {data.cycle_numbers?.map((n: number) => (
                                <span key={n} className="ball ball-red text-xs" style={{ width: 24, height: 24 }}>{n}</span>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{data.note}</p>
                </div>
            );

        default:
            return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
    }
}
