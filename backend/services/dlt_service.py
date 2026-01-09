"""
大乐透业务逻辑服务
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.dlt import DLTResult
from sources.scraper.dlt_scraper import DLTScraper

logger = logging.getLogger(__name__)


class DLTService:
    """大乐透服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.scraper = DLTScraper()
    
    async def sync_latest(self) -> dict:
        """增量同步：只获取数据库中缺失的最新数据"""
        latest_db = self.get_latest()
        latest_period = latest_db.period if latest_db else "00000"
        
        # 先获取少量数据判断是否有新期
        data = await self.scraper.fetch_by_count(10)
        if not data:
            return {"synced": 0, "message": "无法获取数据"}
        
        # 找出需要同步的期数
        new_data = [d for d in data if d["period"] > latest_period]
        
        if not new_data:
            return {"synced": 0, "message": "已是最新数据"}
        
        # 如果差距较大，获取更多数据
        newest_period = max(d["period"] for d in data)
        # 计算期号差距（大乐透期号格式: yyxxx）
        try:
            gap = int(newest_period[-3:]) - int(latest_period[-3:])
            if newest_period[:2] != latest_period[:2]:
                gap = 100  # 跨年
        except:
            gap = 10
        
        if gap > 10:
            data = await self.scraper.fetch_by_count(min(gap + 5, 100))
            new_data = [d for d in data if d["period"] > latest_period]
        
        # 保存新数据
        saved = self._save_data(new_data)
        return {"synced": len(saved), "message": f"已同步 {len(saved)} 期新数据"}
    
    async def fetch_and_save(
        self,
        mode: str = "count",
        count: Optional[int] = None,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
    ) -> List[DLTResult]:
        """根据模式获取并保存大乐透数据"""
        if mode == "count" and count:
            data = await self.scraper.fetch_by_count(count)
        elif mode == "period" and start_period and end_period:
            data = await self.scraper.fetch_by_period(start_period, end_period)
        else:
            data = await self.scraper.fetch_by_count(30)
        
        return self._save_data(data)
    
    async def refresh_all(self, count: int = 100) -> dict:
        """全量刷新：获取指定期数的所有数据并更新数据库"""
        data = await self.scraper.fetch_by_count(count)
        saved = self._save_data(data)
        return {"refreshed": len(saved), "message": f"已刷新 {len(saved)} 期数据"}
    
    def _save_data(self, data: List[dict]) -> List[DLTResult]:
        """保存数据到数据库"""
        saved_results = []
        for item in data:
            existing = self.db.query(DLTResult).filter(
                DLTResult.period == item["period"]
            ).first()
            
            if existing:
                for key, value in item.items():
                    setattr(existing, key, value)
                saved_results.append(existing)
            else:
                result = DLTResult(**item)
                self.db.add(result)
                saved_results.append(result)
        
        self.db.commit()
        logger.info(f"已保存 {len(saved_results)} 条大乐透数据")
        return saved_results
    
    def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
    ) -> List[DLTResult]:
        """获取大乐透数据（支持筛选）"""
        query = self.db.query(DLTResult)
        
        if start_period:
            query = query.filter(DLTResult.period >= start_period)
        if end_period:
            query = query.filter(DLTResult.period <= end_period)
        
        return (
            query.order_by(DLTResult.period.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    
    def get_by_period(self, period: str) -> Optional[DLTResult]:
        """根据期号获取数据"""
        return self.db.query(DLTResult).filter(DLTResult.period == period).first()
    
    def get_count(
        self,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
    ) -> int:
        """获取数据总数（支持筛选）"""
        query = self.db.query(func.count(DLTResult.id))
        
        if start_period:
            query = query.filter(DLTResult.period >= start_period)
        if end_period:
            query = query.filter(DLTResult.period <= end_period)
        
        return query.scalar()
    
    def get_latest(self) -> Optional[DLTResult]:
        """获取最新一期数据"""
        return self.db.query(DLTResult).order_by(DLTResult.period.desc()).first()
