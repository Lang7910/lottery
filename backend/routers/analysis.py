"""
统计分析 API 路由
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from services.ssq_analysis import SSQAnalysisService
from services.dlt_analysis import DLTAnalysisService
from services.hk6_analysis import HK6AnalysisService
from models.ssq import SSQResult
from models.dlt import DLTResult

router = APIRouter(prefix="/analysis", tags=["统计分析"])


@router.get("/ssq/frequency")
def get_ssq_frequency(
    weekday: Optional[str] = Query(None, description="星期筛选 (二/四/日)"),
    start_period: Optional[int] = Query(None, description="起始期号"),
    end_period: Optional[int] = Query(None, description="结束期号"),
    limit: Optional[int] = Query(None, description="限制期数"),
    db: Session = Depends(get_db),
):
    """获取双色球位置频率统计"""
    service = SSQAnalysisService(db)
    return service.get_position_frequency(
        weekday=weekday,
        start_period=start_period,
        end_period=end_period,
        limit=limit,
    )


@router.get("/ssq/trend")
def get_ssq_trend(
    limit: int = Query(50, description="期数限制", ge=10, le=200),
    db: Session = Depends(get_db),
):
    """获取双色球走势数据"""
    results = db.query(SSQResult).order_by(desc(SSQResult.period)).limit(limit).all()
    results = list(reversed(results))  # 按时间正序
    
    return {
        "periods": [r.period for r in results],
        "red1": [r.red1 for r in results],
        "red2": [r.red2 for r in results],
        "red3": [r.red3 for r in results],
        "red4": [r.red4 for r in results],
        "red5": [r.red5 for r in results],
        "red6": [r.red6 for r in results],
        "blue": [r.blue for r in results],
    }


@router.get("/ssq/weekday-options")
def get_ssq_weekday_options(db: Session = Depends(get_db)):
    """获取双色球星期选项"""
    service = SSQAnalysisService(db)
    return service.get_weekday_options()


@router.get("/dlt/frequency")
def get_dlt_frequency(
    start_period: Optional[str] = Query(None, description="起始期号"),
    end_period: Optional[str] = Query(None, description="结束期号"),
    limit: Optional[int] = Query(None, description="限制期数"),
    db: Session = Depends(get_db),
):
    """获取大乐透位置频率统计"""
    service = DLTAnalysisService(db)
    return service.get_position_frequency(
        start_period=start_period,
        end_period=end_period,
        limit=limit,
    )


@router.get("/dlt/trend")
def get_dlt_trend(
    limit: int = Query(50, description="期数限制", ge=10, le=200),
    db: Session = Depends(get_db),
):
    """获取大乐透走势数据"""
    results = db.query(DLTResult).order_by(desc(DLTResult.period)).limit(limit).all()
    results = list(reversed(results))  # 按时间正序
    
    return {
        "periods": [r.period for r in results],
        "front1": [r.front1 for r in results],
        "front2": [r.front2 for r in results],
        "front3": [r.front3 for r in results],
        "front4": [r.front4 for r in results],
        "front5": [r.front5 for r in results],
        "back1": [r.back1 for r in results],
        "back2": [r.back2 for r in results],
    }


# ==================== 预测 API ==================== #

@router.get("/ssq/method-params")
def get_ssq_method_params():
    """获取双色球预测方法可调参数"""
    from services.prediction_service import SSQPredictionService
    return SSQPredictionService.METHOD_PARAMS


@router.get("/ssq/predict")
def predict_ssq(
    method: str = Query("ma", description="预测方法: ma, es, rf, svr, arima"),
    lookback: int = Query(100, description="历史数据量", ge=20, le=500),
    # 方法参数
    window: int = Query(5, description="MA窗口大小"),
    alpha: float = Query(0.3, description="ES平滑系数"),
    n_lags: int = Query(5, description="ML滞后期数"),
    n_estimators: int = Query(50, description="RF树数量"),
    p: int = Query(1, description="ARIMA p"),
    d: int = Query(0, description="ARIMA d"),
    q: int = Query(1, description="ARIMA q"),
    db: Session = Depends(get_db),
):
    """双色球时间序列预测"""
    from services.prediction_service import SSQPredictionService
    params = {"window": window, "alpha": alpha, "n_lags": n_lags, 
              "n_estimators": n_estimators, "p": p, "d": d, "q": q}
    service = SSQPredictionService(db)
    return service.predict(method, lookback, params)


@router.get("/ssq/predict-all")
def predict_ssq_all(
    lookback: int = Query(100, description="历史数据量", ge=20, le=500),
    db: Session = Depends(get_db),
):
    """双色球全部方法预测"""
    from services.prediction_service import SSQPredictionService
    service = SSQPredictionService(db)
    return service.predict_all_methods(lookback)


@router.get("/ssq/recommend")
def recommend_ssq(
    lookback: int = Query(100, description="历史数据量", ge=20, le=500),
    num_sets: int = Query(5, description="推荐组数", ge=1, le=20),
    aggregation: str = Query("all", description="聚合方法: vote, average, weighted, all"),
    db: Session = Depends(get_db),
):
    """双色球综合推荐（多组号码）"""
    from services.prediction_service import SSQPredictionService
    service = SSQPredictionService(db)
    return service.generate_recommendations(lookback, num_sets, aggregation=aggregation)


@router.get("/dlt/method-params")
def get_dlt_method_params():
    """获取大乐透预测方法可调参数"""
    from services.prediction_service import DLTPredictionService
    return DLTPredictionService.METHOD_PARAMS


@router.get("/dlt/predict")
def predict_dlt(
    method: str = Query("ma", description="预测方法: ma, es, rf, svr, arima"),
    lookback: int = Query(100, description="历史数据量", ge=20, le=500),
    window: int = Query(5, description="MA窗口大小"),
    alpha: float = Query(0.3, description="ES平滑系数"),
    n_lags: int = Query(5, description="ML滞后期数"),
    n_estimators: int = Query(50, description="RF树数量"),
    p: int = Query(1, description="ARIMA p"),
    d: int = Query(0, description="ARIMA d"),
    q: int = Query(1, description="ARIMA q"),
    db: Session = Depends(get_db),
):
    """大乐透时间序列预测"""
    from services.prediction_service import DLTPredictionService
    params = {"window": window, "alpha": alpha, "n_lags": n_lags,
              "n_estimators": n_estimators, "p": p, "d": d, "q": q}
    service = DLTPredictionService(db)
    return service.predict(method, lookback, params)


@router.get("/dlt/predict-all")
def predict_dlt_all(
    lookback: int = Query(100, description="历史数据量", ge=20, le=500),
    db: Session = Depends(get_db),
):
    """大乐透全部方法预测"""
    from services.prediction_service import DLTPredictionService
    service = DLTPredictionService(db)
    return service.predict_all_methods(lookback)


@router.get("/dlt/recommend")
def recommend_dlt(
    lookback: int = Query(100, description="历史数据量", ge=20, le=500),
    num_sets: int = Query(5, description="推荐组数", ge=1, le=20),
    aggregation: str = Query("all", description="聚合方法: vote, average, weighted, all"),
    db: Session = Depends(get_db),
):
    """大乐透综合推荐（多组号码）"""
    from services.prediction_service import DLTPredictionService
    service = DLTPredictionService(db)
    return service.generate_recommendations(lookback, num_sets, aggregation=aggregation)


# ==================== 杀号 API ==================== #

@router.get("/ssq/kill")
def get_ssq_kill_analysis(
    lookback: int = Query(100, description="历史数据量", ge=20, le=2000),
    num_sets: int = Query(5, description="每策略推荐组数", ge=1, le=10),
    page: int = Query(1, description="历史记录页码", ge=1),
    page_size: int = Query(20, description="每页记录数", ge=10, le=50),
    db: Session = Depends(get_db),
):
    """双色球杀号分析（17种红球+6种蓝球方法，含效率指标和多策略推荐）"""
    from services.kill_service import SSQKillService
    service = SSQKillService(db)
    return service.get_kill_analysis(lookback, num_sets, page, page_size)


@router.get("/dlt/kill")
def get_dlt_kill_analysis(
    lookback: int = Query(100, description="历史数据量", ge=20, le=2000),
    num_sets: int = Query(5, description="每策略推荐组数", ge=1, le=10),
    page: int = Query(1, description="历史记录页码", ge=1),
    page_size: int = Query(20, description="每页记录数", ge=10, le=50),
    db: Session = Depends(get_db),
):
    """大乐透杀号分析（6种前区+3种后区方法，含效率指标和多策略推荐）"""
    from services.dlt_kill_service import DLTKillService
    service = DLTKillService(db)
    return service.get_kill_analysis(lookback, num_sets, page, page_size)



# ==================== 玄学预测 API ==================== #

from pydantic import BaseModel
from typing import Optional, List

class MetaphysicalRequest(BaseModel):
    """玄学预测请求"""
    methods: Optional[List[str]] = None  # 选择的方法
    num_sets: int = 5
    # 天时
    custom_time: Optional[str] = None  # 自定义开奖时间
    # 地利
    location: Optional[str] = None  # 省市名
    # 人和
    birth_date: Optional[str] = None  # 出生日期 YYYY-MM-DD
    birth_hour: Optional[int] = None  # 出生时辰 0-23
    gender: Optional[str] = "male"  # male/female
    # 梅花易数
    meihua_seed: Optional[int] = None


@router.post("/{lottery}/metaphysical")
def predict_metaphysical(
    lottery: str,
    request: MetaphysicalRequest,
):
    """
    玄学预测 (多方法)
    
    lottery: ssq / dlt
    
    methods可选值:
    - bazi_wuxing: 八字五行法 (需要天时)
    - wealth_element: 本命财星法 (需要人和.birth_date)
    - conflict_check: 刑冲合害校验 (需要天时+人和)
    - mingua_direction: 命卦空间法 (需要人和+地利)
    - meihua: 梅花易数法
    - jiazi_cycle: 六十甲子周期法 (需要天时)
    
    不传methods则自动启用所有可用方法
    """
    from services.metaphysical_service import MetaphysicalService
    from datetime import datetime
    
    service = MetaphysicalService()
    
    # 解析时间
    draw_time = None
    if request.custom_time:
        try:
            draw_time = datetime.fromisoformat(
                request.custom_time.replace("T", " ").replace("Z", "")
            )
        except:
            pass
    
    # 解析出生日期
    birth_dt = None
    if request.birth_date:
        try:
            birth_dt = datetime.strptime(request.birth_date, "%Y-%m-%d")
            if request.birth_hour is not None:
                birth_dt = birth_dt.replace(hour=request.birth_hour)
        except:
            pass
    
    return service.predict(
        lottery_type=lottery,
        methods=request.methods,
        num_sets=request.num_sets,
        draw_time=draw_time,
        location=request.location,
        birth_date=birth_dt,
        birth_hour=request.birth_hour,
        gender=request.gender or "male",
        meihua_seed=request.meihua_seed
    )


@router.get("/{lottery}/metaphysical")
def get_metaphysical_simple(
    lottery: str,
    num_sets: int = Query(5, description="推荐组数", ge=1, le=10),
    custom_time: str = Query(None, description="自定义时间"),
):
    """简单GET接口 (仅八字五行法)"""
    from services.metaphysical_service import MetaphysicalService
    from datetime import datetime
    
    service = MetaphysicalService()
    draw_time = None
    if custom_time:
        try:
            draw_time = datetime.fromisoformat(
                custom_time.replace("T", " ").replace("Z", "")
            )
        except:
            pass
    
    # HK6 使用专用方法
    if lottery == "hk6":
        return service.predict_hk6(
            draw_time=draw_time,
            num_sets=num_sets,
            methods=["zodiac_prediction", "wave_wuxing", "bazi_wuxing", "meihua", "jiazi_cycle"]
        )
    
    return service.predict(
        lottery_type=lottery,
        methods=["bazi_wuxing", "meihua", "jiazi_cycle"],
        num_sets=num_sets,
        draw_time=draw_time
    )


# ================================
# 六合彩分析接口
# ================================

@router.get("/hk6/frequency")
def get_hk6_frequency(
    start_period: Optional[str] = Query(None, description="起始期号"),
    end_period: Optional[str] = Query(None, description="结束期号"),
    limit: Optional[int] = Query(None, description="限制期数"),
    db: Session = Depends(get_db),
):
    """获取六合彩号码频率统计"""
    service = HK6AnalysisService(db)
    return service.get_number_frequency(
        start_period=start_period,
        end_period=end_period,
        limit=limit,
    )


@router.get("/hk6/wave")
def get_hk6_wave_stats(
    start_period: Optional[str] = Query(None, description="起始期号"),
    end_period: Optional[str] = Query(None, description="结束期号"),
    limit: Optional[int] = Query(None, description="限制期数"),
    db: Session = Depends(get_db),
):
    """获取六合彩波色统计"""
    service = HK6AnalysisService(db)
    return service.get_wave_color_stats(
        start_period=start_period,
        end_period=end_period,
        limit=limit,
    )


@router.get("/hk6/zodiac")
def get_hk6_zodiac_stats(
    start_period: Optional[str] = Query(None, description="起始期号"),
    end_period: Optional[str] = Query(None, description="结束期号"),
    limit: Optional[int] = Query(None, description="限制期数"),
    db: Session = Depends(get_db),
):
    """获取六合彩生肖统计"""
    service = HK6AnalysisService(db)
    return service.get_zodiac_stats(
        start_period=start_period,
        end_period=end_period,
        limit=limit,
    )


@router.get("/hk6/metaphysical")
def get_hk6_metaphysical(
    num_sets: int = Query(5, description="推荐组数", ge=1, le=10),
    custom_time: Optional[str] = Query(None, description="自定义时间 YYYY-MM-DD HH:MM"),
):
    """六合彩玄学预测"""
    from services.metaphysical_service import MetaphysicalService
    from datetime import datetime
    
    service = MetaphysicalService()
    draw_time = None
    if custom_time:
        try:
            draw_time = datetime.fromisoformat(
                custom_time.replace("T", " ").replace("Z", "")
            )
        except:
            pass
    
    return service.predict_hk6(
        draw_time=draw_time,
        num_sets=num_sets,
        methods=["zodiac_prediction", "wave_wuxing", "bazi_wuxing", "meihua", "jiazi_cycle"]
    )
