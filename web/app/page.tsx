"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar, MainSection, AnalysisTab, PredictionTab, LotteryType } from "@/components/Sidebar";
import { SSQPanel } from "@/components/SSQPanel";
import { DLTPanel } from "@/components/DLTPanel";
import { SSQBasicAnalysis } from "@/components/SSQBasicAnalysis";
import { DLTBasicAnalysis } from "@/components/DLTBasicAnalysis";
import { SSQTrendAnalysis } from "@/components/SSQTrendAnalysis";
import { DLTTrendAnalysis } from "@/components/DLTTrendAnalysis";
import { SSQPrediction } from "@/components/SSQPrediction";
import { DLTPrediction } from "@/components/DLTPrediction";
import { SSQKillAnalysis } from "@/components/SSQKillAnalysis";
import { MetaphysicalPrediction } from "@/components/MetaphysicalPrediction";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  // 同步状态到 URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("section", mainSection);
    params.set("tab", analysisTab);
    params.set("ptab", predictionTab);
    params.set("type", lotteryType);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [mainSection, analysisTab, predictionTab, lotteryType, router]);

  const renderContent = () => {
    if (mainSection === "results") {
      return lotteryType === "ssq" ? <SSQPanel /> : <DLTPanel />;
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
        return <SSQKillAnalysis />;
      }
      if (predictionTab === "metaphysical") {
        return <MetaphysicalPrediction lotteryType={lotteryType} />;
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
          <ThemeToggle />
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

        {/* 内容区 */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* 页脚 */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border ml-56">
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
