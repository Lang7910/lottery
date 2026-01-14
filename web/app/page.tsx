"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar, MainSection, AnalysisTab, PredictionTab, LotteryType } from "@/components/Sidebar";
import { SSQPanel } from "@/components/SSQPanel";
import { DLTPanel } from "@/components/DLTPanel";
import { HK6Panel } from "@/components/HK6Panel";
import { SSQBasicAnalysis } from "@/components/SSQBasicAnalysis";
import { DLTBasicAnalysis } from "@/components/DLTBasicAnalysis";
import { HK6BasicAnalysis } from "@/components/HK6BasicAnalysis";
import { SSQTrendAnalysis } from "@/components/SSQTrendAnalysis";
import { DLTTrendAnalysis } from "@/components/DLTTrendAnalysis";
import { HK6TrendAnalysis } from "@/components/HK6TrendAnalysis";
import { SSQPrediction } from "@/components/SSQPrediction";
import { DLTPrediction } from "@/components/DLTPrediction";
import { SSQKillAnalysis } from "@/components/SSQKillAnalysis";
import { DLTKillAnalysis } from "@/components/DLTKillAnalysis";
import { MetaphysicalPrediction } from "@/components/MetaphysicalPrediction";
import { HK6MetaphysicalPrediction } from "@/components/HK6MetaphysicalPrediction";
import { ComprehensiveRecommendation } from "@/components/ComprehensiveRecommendation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAuthButton } from "@/components/UserAuthButton";
import { Dice5, Loader2 } from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从 URL 读取初始状态
  const [mainSection, setMainSection] = useState<MainSection>(
    (searchParams.get("section") as MainSection) || "results"
  );
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>(
    (searchParams.get("tab") as AnalysisTab) || "basic"
  );
  const [predictionTab, setPredictionTab] = useState<PredictionTab>(
    (searchParams.get("ptab") as PredictionTab) || "timeseries"
  );
  const [lotteryType, setLotteryType] = useState<LotteryType>(
    (searchParams.get("type") as LotteryType) || "ssq"
  );

  // 标记是否已完成初始化
  const [isInitialized, setIsInitialized] = useState(false);

  // 同步状态到 URL (仅在状态变化时，且已初始化后)
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("section", mainSection);
    params.set("tab", analysisTab);
    params.set("ptab", predictionTab);
    params.set("type", lotteryType);

    const newUrl = `?${params.toString()}`;
    const currentUrl = window.location.search;

    // 只有当 URL 真正变化时才更新，避免无限循环
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [mainSection, analysisTab, predictionTab, lotteryType, router, isInitialized]);

  const renderContent = () => {
    if (mainSection === "results") {
      if (lotteryType === "ssq") return <SSQPanel />;
      if (lotteryType === "dlt") return <DLTPanel />;
      if (lotteryType === "hk6") return <HK6Panel />;
    }

    // HK6 分析
    if (lotteryType === "hk6" && mainSection === "analysis") {
      if (analysisTab === "basic") return <HK6BasicAnalysis />;
      if (analysisTab === "trend") return <HK6TrendAnalysis />;
    }

    // HK6 预测功能
    if (lotteryType === "hk6" && mainSection === "prediction") {
      if (predictionTab === "metaphysical") {
        return <HK6MetaphysicalPrediction />;
      }
      // 其他预测功能暂不支持
      return (
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">六合彩此预测功能开发中</h2>
          <p className="text-muted-foreground">请使用玄学预测功能</p>
        </div>
      );
    }

    if (mainSection === "analysis") {
      if (analysisTab === "basic") {
        return lotteryType === "ssq" ? <SSQBasicAnalysis /> : <DLTBasicAnalysis />;
      }
      if (analysisTab === "trend") {
        return lotteryType === "ssq" ? <SSQTrendAnalysis /> : <DLTTrendAnalysis />;
      }
    }

    if (mainSection === "prediction") {
      if (predictionTab === "timeseries") {
        return lotteryType === "ssq" ? <SSQPrediction /> : <DLTPrediction />;
      }
      if (predictionTab === "kill") {
        return lotteryType === "ssq" ? <SSQKillAnalysis /> : <DLTKillAnalysis />;
      }
      if (predictionTab === "metaphysical") {
        return <MetaphysicalPrediction lotteryType={lotteryType as "ssq" | "dlt"} />;
      }
      if (predictionTab === "comprehensive") {
        return <ComprehensiveRecommendation lotteryType={lotteryType as "ssq" | "dlt"} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dice5 className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold text-foreground">彩票分析</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/betting?type=${lotteryType}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-border transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              投注中心
            </a>
            <UserAuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主体布局 */}
      <div className="flex pt-16">
        {/* 侧边栏 */}
        <Sidebar
          mainSection={mainSection}
          analysisTab={analysisTab}
          predictionTab={predictionTab}
          lotteryType={lotteryType}
          onMainSectionChange={setMainSection}
          onAnalysisTabChange={setAnalysisTab}
          onPredictionTabChange={setPredictionTab}
          onLotteryTypeChange={setLotteryType}
        />

        {/* 内容区 - 移动端全宽，桌面端减去侧边栏 */}
        <main className="flex-1 p-4 md:p-6 overflow-auto w-full md:w-auto">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* 页脚 - 移动端无左边距 */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border md:ml-56">
        <p>彩票数据仅供参考，请理性购彩</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
