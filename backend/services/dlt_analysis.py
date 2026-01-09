"""
大乐透统计分析服务
"""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from collections import defaultdict

from models.dlt import DLTResult


class DLTAnalysisService:
    """大乐透统计分析"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_position_frequency(
        self,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict:
        """获取每个位置每个数字的出现频率"""
        query = self.db.query(DLTResult)
        
        if start_period:
            query = query.filter(DLTResult.period >= start_period)
        if end_period:
            query = query.filter(DLTResult.period <= end_period)
        
        query = query.order_by(DLTResult.period.desc())
        
        if limit:
            query = query.limit(limit)
        
        results = query.all()
        total = len(results)
        
        if total == 0:
            return {"total": 0, "front_positions": [], "back_positions": []}
        
        # 统计前区每个位置
        front_counts = [defaultdict(int) for _ in range(5)]
        back_counts = [defaultdict(int) for _ in range(2)]
        
        for r in results:
            fronts = [r.front1, r.front2, r.front3, r.front4, r.front5]
            backs = [r.back1, r.back2]
            
            for i, num in enumerate(fronts):
                front_counts[i][num] += 1
            for i, num in enumerate(backs):
                back_counts[i][num] += 1
        
        # 转换为频率 - 前区
        front_positions = []
        for i in range(5):
            position_data = []
            for num in range(1, 36):  # 前区 1-35
                count = front_counts[i].get(num, 0)
                position_data.append({
                    "number": num,
                    "count": count,
                    "frequency": round(count / total, 4) if total > 0 else 0,
                })
            front_positions.append({
                "position": i + 1,
                "stats": position_data,
            })
        
        # 转换为频率 - 后区
        back_positions = []
        for i in range(2):
            position_data = []
            for num in range(1, 13):  # 后区 1-12
                count = back_counts[i].get(num, 0)
                position_data.append({
                    "number": num,
                    "count": count,
                    "frequency": round(count / total, 4) if total > 0 else 0,
                })
            back_positions.append({
                "position": i + 1,
                "stats": position_data,
            })
        
        return {
            "total": total,
            "front_positions": front_positions,
            "back_positions": back_positions,
        }
