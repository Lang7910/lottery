"""
双色球业务逻辑服务
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.ssq import SSQResult
from sources.scraper.ssq_scraper import SSQScraper

logger = logging.getLogger(__name__)


class SSQService:
    """双色球服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.scraper = SSQScraper()
    
    async def sync_latest(self) -> dict:
        """增量同步：只获取数据库中缺失的最新数据"""
        latest_db = self.get_latest()
        latest_period = latest_db.period if latest_db else 0
        
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
        gap = newest_period - latest_period
        
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
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[SSQResult]:
        """根据模式获取并保存双色球数据"""
        if mode == "count" and count:
            data = await self.scraper.fetch_by_count(count)
        elif mode == "period" and start_period and end_period:
            data = await self.scraper.fetch_by_period(start_period, end_period)
        elif mode == "date" and start_date and end_date:
            data = await self.scraper.fetch_by_date(start_date, end_date)
        else:
            data = await self.scraper.fetch_by_count(30)
        
        return self._save_data(data)
    
    async def refresh_all(self, count: int = 100) -> dict:
        """全量刷新：获取指定期数的所有数据并更新数据库"""
        data = await self.scraper.fetch_by_count(count)
        saved = self._save_data(data)
        return {"refreshed": len(saved), "message": f"已刷新 {len(saved)} 期数据"}
    
    def _save_data(self, data: List[dict]) -> List[SSQResult]:
        """保存数据到数据库"""
        saved_results = []
        for item in data:
            existing = self.db.query(SSQResult).filter(
                SSQResult.period == item["period"]
            ).first()
            
            if existing:
                for key, value in item.items():
                    setattr(existing, key, value)
                saved_results.append(existing)
            else:
                result = SSQResult(**item)
                self.db.add(result)
                saved_results.append(result)
        
        self.db.commit()
        logger.info(f"已保存 {len(saved_results)} 条双色球数据")
        return saved_results
    
    def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        start_period: Optional[int] = None,
        end_period: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[SSQResult]:
        """获取双色球数据（支持筛选）"""
        query = self.db.query(SSQResult)
        
        if start_period:
            query = query.filter(SSQResult.period >= start_period)
        if end_period:
            query = query.filter(SSQResult.period <= end_period)
        if start_date:
            query = query.filter(SSQResult.date >= start_date)
        if end_date:
            query = query.filter(SSQResult.date <= end_date)
        
        return (
            query.order_by(SSQResult.period.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    
    def get_by_period(self, period: int) -> Optional[SSQResult]:
        """根据期号获取数据"""
        return self.db.query(SSQResult).filter(SSQResult.period == period).first()
    
    def get_count(
        self,
        start_period: Optional[int] = None,
        end_period: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """获取数据总数（支持筛选）"""
        query = self.db.query(func.count(SSQResult.id))
        
        if start_period:
            query = query.filter(SSQResult.period >= start_period)
        if end_period:
            query = query.filter(SSQResult.period <= end_period)
        if start_date:
            query = query.filter(SSQResult.date >= start_date)
        if end_date:
            query = query.filter(SSQResult.date <= end_date)
        
        return query.scalar()
    
    def get_latest(self) -> Optional[SSQResult]:
        """获取最新一期数据"""
        return self.db.query(SSQResult).order_by(SSQResult.period.desc()).first()
