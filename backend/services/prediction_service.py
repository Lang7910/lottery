"""
时间序列预测服务 - 增强版
支持方法: MA(移动平均), ES(指数平滑), RF(随机森林), SVR, ARIMA
支持参数调节和多组推荐
"""
import logging
import numpy as np
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from collections import Counter

# 预测方法依赖
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.linear_model import BayesianRidge

logger = logging.getLogger(__name__)


def to_native(val):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    if isinstance(val, (np.floating, np.float64, np.float32)):
        return float(val)
    if isinstance(val, np.ndarray):
        return [to_native(v) for v in val]
    if isinstance(val, list):
        return [to_native(v) for v in val]
    return val


def create_supervised_data(values: np.ndarray, n_lags: int = 5):
    """将时间序列转换为监督学习格式"""
    X, Y = [], []
    for i in range(len(values) - n_lags):
        X.append(values[i:i + n_lags])
        Y.append(values[i + n_lags])
    return np.array(X), np.array(Y)


def moving_average_prediction(series: np.ndarray, window: int = 5) -> float:
    """移动平均预测"""
    if len(series) < window:
        return float(series[-1])
    return float(np.mean(series[-window:]))


def exponential_smoothing_prediction(series: np.ndarray, alpha: float = 0.3) -> float:
    """指数平滑预测"""
    try:
        from statsmodels.tsa.holtwinters import SimpleExpSmoothing
        model = SimpleExpSmoothing(series.astype(float)).fit(smoothing_level=alpha, optimized=False)
        forecast = model.forecast(1)
        return float(forecast[0])
    except Exception as e:
        logger.warning(f"指数平滑预测失败: {e}, 使用移动平均替代")
        return moving_average_prediction(series)


def ml_prediction(series: np.ndarray, method: str = "rf", n_lags: int = 5, n_estimators: int = 50) -> float:
    """机器学习预测 (RF/SVR/Bayes)"""
    try:
        X, Y = create_supervised_data(series, n_lags)
        if len(X) < 1:
            return float(series[-1])

        if method == "rf":
            model = RandomForestRegressor(n_estimators=n_estimators, random_state=42, n_jobs=-1)
        elif method == "svr":
            model = SVR(kernel='rbf')
        elif method == "bayes":
            model = BayesianRidge()
        else:
            return float(series[-1])

        model.fit(X, Y)
        last_data = series[-n_lags:].reshape(1, -1)
        predicted = model.predict(last_data)
        return float(predicted[0])
    except Exception as e:
        logger.warning(f"ML预测失败 ({method}): {e}")
        return float(series[-1])


def arima_prediction(series: np.ndarray, p: int = 1, d: int = 0, q: int = 1) -> float:
    """ARIMA预测"""
    try:
        from statsmodels.tsa.arima.model import ARIMA
        if len(series) < max(p, d, q) + 5:
            return float(series[-1])
        
        model = ARIMA(series, order=(p, d, q))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=1)
        return float(forecast[0])
    except Exception as e:
        logger.warning(f"ARIMA预测失败: {e}, 使用移动平均替代")
        return moving_average_prediction(series)


def predict_next_number(series: np.ndarray, method: str = "ma", 
                        min_val: int = 1, max_val: int = 33,
                        params: Dict = None) -> int:
    """预测下一个号码并限制在有效范围内"""
    params = params or {}
    
    if method == "ma":
        pred = moving_average_prediction(series, window=params.get("window", 5))
    elif method == "es":
        pred = exponential_smoothing_prediction(series, alpha=params.get("alpha", 0.3))
    elif method == "rf":
        pred = ml_prediction(series, method="rf", 
                            n_lags=params.get("n_lags", 5),
                            n_estimators=params.get("n_estimators", 50))
    elif method == "svr":
        pred = ml_prediction(series, method="svr", n_lags=params.get("n_lags", 5))
    elif method == "arima":
        pred = arima_prediction(series, 
                               p=params.get("p", 1),
                               d=params.get("d", 0),
                               q=params.get("q", 1))
    else:
        pred = moving_average_prediction(series)
    
    # 四舍五入并限制范围
    result = int(round(pred))
    return max(min_val, min(max_val, result))


class SSQPredictionService:
    """双色球时间序列预测服务"""
    
    METHODS = ["ma", "es", "rf", "svr", "arima"]
    METHOD_NAMES = {
        "ma": "移动平均",
        "es": "指数平滑", 
        "rf": "随机森林",
        "svr": "支持向量机",
        "arima": "ARIMA"
    }
    METHOD_PARAMS = {
        "ma": {"window": {"default": 5, "min": 3, "max": 20, "label": "窗口大小"}},
        "es": {"alpha": {"default": 0.3, "min": 0.1, "max": 0.9, "step": 0.1, "label": "平滑系数"}},
        "rf": {"n_lags": {"default": 5, "min": 3, "max": 15, "label": "滞后期数"},
               "n_estimators": {"default": 50, "min": 10, "max": 200, "label": "树数量"}},
        "svr": {"n_lags": {"default": 5, "min": 3, "max": 15, "label": "滞后期数"}},
        "arima": {"p": {"default": 1, "min": 0, "max": 5, "label": "自回归阶数"},
                  "d": {"default": 0, "min": 0, "max": 2, "label": "差分阶数"},
                  "q": {"default": 1, "min": 0, "max": 5, "label": "移动平均阶数"}}
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_method_params(self) -> Dict:
        """获取所有方法的可调参数"""
        return self.METHOD_PARAMS
    
    def predict(self, method: str = "ma", lookback: int = 100, params: Dict = None) -> Dict:
        """使用指定方法预测下一期号码"""
        from models.ssq import SSQResult
        params = params or {}
        
        results = self.db.query(SSQResult).order_by(desc(SSQResult.period)).limit(lookback).all()
        if len(results) < 10:
            return {"error": "数据不足", "red": [], "blue": None}
        
        results = list(reversed(results))
        
        red_predictions = []
        position_limits = [(1, 11), (2, 18), (5, 24), (8, 28), (15, 32), (20, 33)]
        
        for i, (min_v, max_v) in enumerate(position_limits):
            pos_key = f"red{i+1}"
            series = np.array([getattr(r, pos_key) for r in results])
            pred = predict_next_number(series, method, min_v, max_v, params)
            red_predictions.append(pred)
        
        red_predictions = self._ensure_sorted_unique(red_predictions, 1, 33)
        
        blue_series = np.array([r.blue for r in results])
        blue_pred = predict_next_number(blue_series, method, 1, 16, params)
        
        return {
            "method": method,
            "method_name": self.METHOD_NAMES.get(method, method),
            "red": red_predictions,
            "blue": blue_pred,
            "params": params,
            "sample_size": len(results)
        }
    
    def predict_all_methods(self, lookback: int = 100, method_params: Dict = None) -> List[Dict]:
        """使用所有方法预测"""
        method_params = method_params or {}
        results = []
        for method in self.METHODS:
            try:
                params = method_params.get(method, {})
                result = self.predict(method, lookback, params)
                results.append(result)
            except Exception as e:
                logger.error(f"方法 {method} 预测失败: {e}")
                results.append({
                    "method": method,
                    "method_name": self.METHOD_NAMES.get(method, method),
                    "error": str(e)
                })
        return results
    
    def generate_recommendations(self, lookback: int = 100, num_sets: int = 5, 
                                  method_params: Dict = None,
                                  aggregation: str = "vote") -> Dict:
        """生成多组推荐号码"""
        predictions = self.predict_all_methods(lookback, method_params)
        valid_predictions = [p for p in predictions if "error" not in p]
        
        if not valid_predictions:
            return {"error": "无有效预测结果", "sets": []}
        
        sets = []
        
        if aggregation == "vote":
            # 多数投票法
            sets.append(self._aggregate_voting(valid_predictions))
        elif aggregation == "average":
            # 平均法
            sets.append(self._aggregate_average(valid_predictions))
        elif aggregation == "weighted":
            # 加权平均（近期方法权重更高）
            weights = {"ma": 1.0, "es": 1.2, "rf": 1.5, "svr": 1.3, "arima": 1.4}
            sets.append(self._aggregate_weighted(valid_predictions, weights))
        elif aggregation == "all":
            # 所有聚合方法
            sets.append({**self._aggregate_voting(valid_predictions), "agg_method": "多数投票"})
            sets.append({**self._aggregate_average(valid_predictions), "agg_method": "平均法"})
            weights = {"ma": 1.0, "es": 1.2, "rf": 1.5, "svr": 1.3, "arima": 1.4}
            sets.append({**self._aggregate_weighted(valid_predictions, weights), "agg_method": "加权平均"})
        
        # 生成多组变体
        if num_sets > len(sets):
            base_set = sets[0] if sets else self._aggregate_voting(valid_predictions)
            for i in range(num_sets - len(sets)):
                variant = self._generate_variant(base_set, i + 1)
                sets.append(variant)
        
        return {
            "predictions": predictions,
            "sets": sets[:num_sets],
            "aggregation": aggregation
        }
    
    def _aggregate_voting(self, predictions: List[Dict]) -> Dict:
        """多数投票聚合"""
        red_votes = Counter()
        blue_votes = Counter()
        
        for p in predictions:
            for n in p.get("red", []):
                red_votes[n] += 1
            blue_votes[p.get("blue", 0)] += 1
        
        top_red = sorted([to_native(n) for n, _ in red_votes.most_common(6)])
        top_blue = to_native(blue_votes.most_common(1)[0][0]) if blue_votes else 1
        
        return {"red": top_red, "blue": top_blue, "agg_method": "多数投票"}
    
    def _aggregate_average(self, predictions: List[Dict]) -> Dict:
        """平均法聚合"""
        red_avg = []
        for i in range(6):
            vals = [p["red"][i] for p in predictions if len(p.get("red", [])) > i]
            if vals:
                red_avg.append(int(round(np.mean(vals))))
        
        blue_vals = [p.get("blue", 0) for p in predictions if p.get("blue")]
        blue_avg = int(round(np.mean(blue_vals))) if blue_vals else 1
        
        red_avg = [to_native(x) for x in self._ensure_sorted_unique(red_avg, 1, 33)]
        blue_avg = to_native(max(1, min(16, blue_avg)))
        
        return {"red": red_avg, "blue": blue_avg, "agg_method": "平均法"}
    
    def _aggregate_weighted(self, predictions: List[Dict], weights: Dict) -> Dict:
        """加权平均聚合"""
        red_weighted = []
        for i in range(6):
            total_weight = 0
            weighted_sum = 0
            for p in predictions:
                if len(p.get("red", [])) > i:
                    w = weights.get(p["method"], 1.0)
                    weighted_sum += p["red"][i] * w
                    total_weight += w
            if total_weight > 0:
                red_weighted.append(int(round(weighted_sum / total_weight)))
        
        blue_weighted_sum = 0
        blue_total_weight = 0
        for p in predictions:
            if p.get("blue"):
                w = weights.get(p["method"], 1.0)
                blue_weighted_sum += p["blue"] * w
                blue_total_weight += w
        
        blue_weighted = int(round(blue_weighted_sum / blue_total_weight)) if blue_total_weight > 0 else 1
        
        red_weighted = [to_native(x) for x in self._ensure_sorted_unique(red_weighted, 1, 33)]
        blue_weighted = to_native(max(1, min(16, blue_weighted)))
        
        return {"red": red_weighted, "blue": blue_weighted, "agg_method": "加权平均"}
    
    def _generate_variant(self, base: Dict, seed: int) -> Dict:
        """基于基础结果生成变体"""
        np.random.seed(seed)
        red = list(base.get("red", []))
        blue = base.get("blue", 1)
        
        # 随机调整1-2个红球
        for _ in range(min(2, len(red))):
            idx = np.random.randint(0, len(red))
            delta = np.random.choice([-2, -1, 1, 2])
            new_val = max(1, min(33, red[idx] + delta))
            if new_val not in red:
                red[idx] = new_val
        
        red = sorted(set([to_native(x) for x in red]))[:6]
        while len(red) < 6:
            new_num = int(np.random.randint(1, 34))
            if new_num not in red:
                red.append(new_num)
        red = sorted(red)
        
        # 随机调整蓝球
        if np.random.random() > 0.5:
            blue = int(max(1, min(16, blue + np.random.choice([-1, 1]))))
        
        return {"red": [to_native(x) for x in red], "blue": to_native(blue), "agg_method": f"变体{seed}"}
    
    def _ensure_sorted_unique(self, predictions: List[int], min_val: int, max_val: int) -> List[int]:
        """确保预测号码递增且不重复"""
        result = []
        used = set()
        
        for pred in predictions:
            if pred in used:
                for delta in range(1, max_val):
                    if pred + delta <= max_val and pred + delta not in used:
                        pred = pred + delta
                        break
                    if pred - delta >= min_val and pred - delta not in used:
                        pred = pred - delta
                        break
            
            if result and pred <= result[-1]:
                pred = result[-1] + 1
                while pred in used and pred <= max_val:
                    pred += 1
            
            if pred <= max_val:
                result.append(pred)
                used.add(pred)
        
        return sorted(result)


class DLTPredictionService:
    """大乐透时间序列预测服务"""
    
    METHODS = ["ma", "es", "rf", "svr", "arima"]
    METHOD_NAMES = {
        "ma": "移动平均",
        "es": "指数平滑",
        "rf": "随机森林", 
        "svr": "支持向量机",
        "arima": "ARIMA"
    }
    METHOD_PARAMS = SSQPredictionService.METHOD_PARAMS
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_method_params(self) -> Dict:
        return self.METHOD_PARAMS
    
    def predict(self, method: str = "ma", lookback: int = 100, params: Dict = None) -> Dict:
        from models.dlt import DLTResult
        params = params or {}
        
        results = self.db.query(DLTResult).order_by(desc(DLTResult.period)).limit(lookback).all()
        if len(results) < 10:
            return {"error": "数据不足", "front": [], "back": []}
        
        results = list(reversed(results))
        
        front_predictions = []
        front_limits = [(1, 10), (3, 18), (8, 26), (15, 32), (22, 35)]
        
        for i, (min_v, max_v) in enumerate(front_limits):
            pos_key = f"front{i+1}"
            series = np.array([getattr(r, pos_key) for r in results])
            pred = predict_next_number(series, method, min_v, max_v, params)
            front_predictions.append(pred)
        
        front_predictions = self._ensure_sorted_unique(front_predictions, 1, 35)
        
        back_predictions = []
        back_limits = [(1, 8), (4, 12)]
        
        for i, (min_v, max_v) in enumerate(back_limits):
            pos_key = f"back{i+1}"
            series = np.array([getattr(r, pos_key) for r in results])
            pred = predict_next_number(series, method, min_v, max_v, params)
            back_predictions.append(pred)
        
        back_predictions = self._ensure_sorted_unique(back_predictions, 1, 12)
        
        return {
            "method": method,
            "method_name": self.METHOD_NAMES.get(method, method),
            "front": front_predictions,
            "back": back_predictions,
            "params": params,
            "sample_size": len(results)
        }
    
    def predict_all_methods(self, lookback: int = 100, method_params: Dict = None) -> List[Dict]:
        method_params = method_params or {}
        results = []
        for method in self.METHODS:
            try:
                params = method_params.get(method, {})
                result = self.predict(method, lookback, params)
                results.append(result)
            except Exception as e:
                logger.error(f"方法 {method} 预测失败: {e}")
                results.append({
                    "method": method,
                    "method_name": self.METHOD_NAMES.get(method, method),
                    "error": str(e)
                })
        return results
    
    def generate_recommendations(self, lookback: int = 100, num_sets: int = 5,
                                  method_params: Dict = None,
                                  aggregation: str = "vote") -> Dict:
        predictions = self.predict_all_methods(lookback, method_params)
        valid_predictions = [p for p in predictions if "error" not in p]
        
        if not valid_predictions:
            return {"error": "无有效预测结果", "sets": []}
        
        sets = []
        
        if aggregation == "vote":
            sets.append(self._aggregate_voting(valid_predictions))
        elif aggregation == "average":
            sets.append(self._aggregate_average(valid_predictions))
        elif aggregation == "weighted":
            weights = {"ma": 1.0, "es": 1.2, "rf": 1.5, "svr": 1.3, "arima": 1.4}
            sets.append(self._aggregate_weighted(valid_predictions, weights))
        elif aggregation == "all":
            sets.append({**self._aggregate_voting(valid_predictions), "agg_method": "多数投票"})
            sets.append({**self._aggregate_average(valid_predictions), "agg_method": "平均法"})
            weights = {"ma": 1.0, "es": 1.2, "rf": 1.5, "svr": 1.3, "arima": 1.4}
            sets.append({**self._aggregate_weighted(valid_predictions, weights), "agg_method": "加权平均"})
        
        if num_sets > len(sets):
            base_set = sets[0] if sets else self._aggregate_voting(valid_predictions)
            for i in range(num_sets - len(sets)):
                variant = self._generate_variant(base_set, i + 1)
                sets.append(variant)
        
        return {
            "predictions": predictions,
            "sets": sets[:num_sets],
            "aggregation": aggregation
        }
    
    def _aggregate_voting(self, predictions: List[Dict]) -> Dict:
        front_votes = Counter()
        back_votes = Counter()
        
        for p in predictions:
            for n in p.get("front", []):
                front_votes[n] += 1
            for n in p.get("back", []):
                back_votes[n] += 1
        
        top_front = sorted([to_native(n) for n, _ in front_votes.most_common(5)])
        top_back = sorted([to_native(n) for n, _ in back_votes.most_common(2)])
        
        return {"front": top_front, "back": top_back, "agg_method": "多数投票"}
    
    def _aggregate_average(self, predictions: List[Dict]) -> Dict:
        front_avg = []
        for i in range(5):
            vals = [p["front"][i] for p in predictions if len(p.get("front", [])) > i]
            if vals:
                front_avg.append(int(round(np.mean(vals))))
        
        back_avg = []
        for i in range(2):
            vals = [p["back"][i] for p in predictions if len(p.get("back", [])) > i]
            if vals:
                back_avg.append(int(round(np.mean(vals))))
        
        front_avg = [to_native(x) for x in self._ensure_sorted_unique(front_avg, 1, 35)]
        back_avg = [to_native(x) for x in self._ensure_sorted_unique(back_avg, 1, 12)]
        
        return {"front": front_avg, "back": back_avg, "agg_method": "平均法"}
    
    def _aggregate_weighted(self, predictions: List[Dict], weights: Dict) -> Dict:
        front_weighted = []
        for i in range(5):
            total_weight = 0
            weighted_sum = 0
            for p in predictions:
                if len(p.get("front", [])) > i:
                    w = weights.get(p["method"], 1.0)
                    weighted_sum += p["front"][i] * w
                    total_weight += w
            if total_weight > 0:
                front_weighted.append(int(round(weighted_sum / total_weight)))
        
        back_weighted = []
        for i in range(2):
            total_weight = 0
            weighted_sum = 0
            for p in predictions:
                if len(p.get("back", [])) > i:
                    w = weights.get(p["method"], 1.0)
                    weighted_sum += p["back"][i] * w
                    total_weight += w
            if total_weight > 0:
                back_weighted.append(int(round(weighted_sum / total_weight)))
        
        front_weighted = [to_native(x) for x in self._ensure_sorted_unique(front_weighted, 1, 35)]
        back_weighted = [to_native(x) for x in self._ensure_sorted_unique(back_weighted, 1, 12)]
        
        return {"front": front_weighted, "back": back_weighted, "agg_method": "加权平均"}
    
    def _generate_variant(self, base: Dict, seed: int) -> Dict:
        np.random.seed(seed)
        front = list(base.get("front", []))
        back = list(base.get("back", []))
        
        for _ in range(min(2, len(front))):
            idx = np.random.randint(0, len(front))
            delta = np.random.choice([-2, -1, 1, 2])
            new_val = max(1, min(35, front[idx] + delta))
            if new_val not in front:
                front[idx] = new_val
        
        front = sorted(set([to_native(x) for x in front]))[:5]
        while len(front) < 5:
            new_num = int(np.random.randint(1, 36))
            if new_num not in front:
                front.append(new_num)
        front = sorted(front)
        
        if np.random.random() > 0.5 and len(back) > 0:
            idx = int(np.random.randint(0, len(back)))
            back[idx] = int(max(1, min(12, back[idx] + np.random.choice([-1, 1]))))
        back = sorted(set([to_native(x) for x in back]))[:2]
        
        return {"front": [to_native(x) for x in front], "back": [to_native(x) for x in back], "agg_method": f"变体{seed}"}
    
    def _ensure_sorted_unique(self, predictions: List[int], min_val: int, max_val: int) -> List[int]:
        result = []
        used = set()
        
        for pred in predictions:
            if pred in used:
                for delta in range(1, max_val):
                    if pred + delta <= max_val and pred + delta not in used:
                        pred = pred + delta
                        break
                    if pred - delta >= min_val and pred - delta not in used:
                        pred = pred - delta
                        break
            
            if result and pred <= result[-1]:
                pred = result[-1] + 1
                while pred in used and pred <= max_val:
                    pred += 1
            
            if pred <= max_val:
                result.append(pred)
                used.add(pred)
        
        return sorted(result)
