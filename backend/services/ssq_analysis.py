"""
双色球统计分析服务
"""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict

from models.ssq import SSQResult


class SSQAnalysisService:
    """双色球统计分析"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_position_frequency(
        self,
        weekday: Optional[str] = None,
        start_period: Optional[int] = None,
        end_period: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> Dict:
        """获取每个位置每个数字的出现频率
        
        Args:
            weekday: 筛选星期 (二/四/日)，None 表示全部
            start_period: 起始期号
            end_period: 结束期号
            limit: 限制期数
        """
        query = self.db.query(SSQResult)
        
        if weekday:
            query = query.filter(SSQResult.weekday.contains(weekday))
        if start_period:
            query = query.filter(SSQResult.period >= start_period)
        if end_period:
            query = query.filter(SSQResult.period <= end_period)
        
        query = query.order_by(SSQResult.period.desc())
        
        if limit:
            query = query.limit(limit)
        
        results = query.all()
        total = len(results)
        
        if total == 0:
            return {"total": 0, "red_positions": [], "blue": {}}
        
        # 统计红球每个位置
        red_counts = [defaultdict(int) for _ in range(6)]
        blue_counts = defaultdict(int)
        
        for r in results:
            reds = [r.red1, r.red2, r.red3, r.red4, r.red5, r.red6]
            for i, num in enumerate(reds):
                red_counts[i][num] += 1
            blue_counts[r.blue] += 1
        
        # 转换为频率
        red_positions = []
        for i in range(6):
            position_data = []
            for num in range(1, 34):  # 红球 1-33
                count = red_counts[i].get(num, 0)
                position_data.append({
                    "number": num,
                    "count": count,
                    "frequency": round(count / total, 4) if total > 0 else 0,
                })
            red_positions.append({
                "position": i + 1,
                "stats": position_data,
            })
        
        blue_data = []
        for num in range(1, 17):  # 蓝球 1-16
            count = blue_counts.get(num, 0)
            blue_data.append({
                "number": num,
                "count": count,
                "frequency": round(count / total, 4) if total > 0 else 0,
            })
        
        return {
            "total": total,
            "red_positions": red_positions,
            "blue": blue_data,
        }
    
    def get_weekday_options(self) -> List[Dict]:
        """获取可用的星期选项"""
        return [
            {"value": "", "label": "全部"},
            {"value": "二", "label": "星期二"},
            {"value": "四", "label": "星期四"},
            {"value": "日", "label": "星期日"},
        ]
