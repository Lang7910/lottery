"""
香港六合彩业务逻辑服务
"""
import logging
import httpx
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.hk6 import HK6Result

logger = logging.getLogger(__name__)

# HKJC GraphQL API
HKJC_GRAPHQL_URL = "https://info.cld.hkjc.com/graphql/base/"

# 必须使用官网完全相同的查询格式（包含lotteryPool），否则会被白名单拒绝
GRAPHQL_QUERY = "fragment lotteryDrawsFragment on LotteryDraw {\n  id\n  year\n  no\n  openDate\n  closeDate\n  drawDate\n  status\n  snowballCode\n  snowballName_en\n  snowballName_ch\n  lotteryPool {\n    sell\n    status\n    totalInvestment\n    jackpot\n    unitBet\n    estimatedPrize\n    derivedFirstPrizeDiv\n    lotteryPrizes {\n      type\n      winningUnit\n      dividend\n    }\n  }\n  drawResult {\n    drawnNo\n    xDrawnNo\n  }\n}\n\nquery marksixResult($lastNDraw: Int, $startDate: String, $endDate: String, $drawType: LotteryDrawType) {\n  lotteryDraws(\n    lastNDraw: $lastNDraw\n    startDate: $startDate\n    endDate: $endDate\n    drawType: $drawType\n  ) {\n    ...lotteryDrawsFragment\n  }\n}"


class HK6Service:
    """香港六合彩服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def fetch_from_hkjc(self, last_n_draw: int = 50) -> List[dict]:
        """从HKJC官网获取六合彩数据"""
        payload = {
            "operationName": "marksixResult",
            "variables": {
                "lastNDraw": last_n_draw,
                "drawType": "All",
                "startDate": None,
                "endDate": None
            },
            "query": GRAPHQL_QUERY
        }
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(HKJC_GRAPHQL_URL, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                draws = data.get("data", {}).get("lotteryDraws", [])
                results = []
                
                for draw in draws:
                    if draw.get("status") != "Result":
                        continue
                    
                    draw_result = draw.get("drawResult", {})
                    numbers = draw_result.get("drawnNo", [])
                    special = draw_result.get("xDrawnNo")
                    
                    if len(numbers) != 6 or special is None:
                        continue
                    
                    # 解析日期
                    draw_date = draw.get("drawDate", "")
                    if "+" in draw_date:
                        draw_date = draw_date.split("+")[0]
                    
                    results.append({
                        "period": draw.get("id"),
                        "year": int(draw.get("year", 0)),
                        "no": draw.get("no"),
                        "date": draw_date,
                        "num1": numbers[0],
                        "num2": numbers[1],
                        "num3": numbers[2],
                        "num4": numbers[3],
                        "num5": numbers[4],
                        "num6": numbers[5],
                        "special": special,
                        "snowball_code": draw.get("snowballCode") or None,
                        "snowball_name": draw.get("snowballName_ch") or None,
                    })
                
                return results
        except Exception as e:
            logger.error(f"获取六合彩数据失败: {e}")
            return []
    
    async def sync_latest(self) -> dict:
        """增量同步：只获取数据库中缺失的最新数据"""
        latest_db = self.get_latest()
        
        # 获取最近10期数据
        data = await self.fetch_from_hkjc(10)
        if not data:
            return {"synced": 0, "message": "无法获取数据"}
        
        # 找出需要同步的期数
        existing_periods = set(
            r.period for r in self.db.query(HK6Result.period).all()
        )
        new_data = [d for d in data if d["period"] not in existing_periods]
        
        if not new_data:
            return {"synced": 0, "message": "已是最新数据"}
        
        # 保存新数据
        saved = self._save_data(new_data)
        return {"synced": len(saved), "message": f"已同步 {len(saved)} 期新数据"}
    
    async def refresh_all(self, count: int = 100) -> dict:
        """全量刷新：获取指定期数的所有数据并更新数据库"""
        data = await self.fetch_from_hkjc(count)
        saved = self._save_data(data)
        return {"refreshed": len(saved), "message": f"已刷新 {len(saved)} 期数据"}
    
    def _save_data(self, data: List[dict]) -> List[HK6Result]:
        """保存数据到数据库"""
        saved_results = []
        for item in data:
            existing = self.db.query(HK6Result).filter(
                HK6Result.period == item["period"]
            ).first()
            
            if existing:
                for key, value in item.items():
                    setattr(existing, key, value)
                saved_results.append(existing)
            else:
                result = HK6Result(**item)
                self.db.add(result)
                saved_results.append(result)
        
        self.db.commit()
        logger.info(f"已保存 {len(saved_results)} 条六合彩数据")
        return saved_results
    
    def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
    ) -> List[HK6Result]:
        """获取六合彩数据"""
        query = self.db.query(HK6Result)
        
        if start_period:
            query = query.filter(HK6Result.period >= start_period)
        if end_period:
            query = query.filter(HK6Result.period <= end_period)
        
        return (
            query.order_by(HK6Result.year.desc(), HK6Result.no.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    
    def get_by_period(self, period: str) -> Optional[HK6Result]:
        """根据期号获取数据"""
        return self.db.query(HK6Result).filter(HK6Result.period == period).first()
    
    def get_count(
        self,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
    ) -> int:
        """获取数据总数"""
        query = self.db.query(func.count(HK6Result.id))
        
        if start_period:
            query = query.filter(HK6Result.period >= start_period)
        if end_period:
            query = query.filter(HK6Result.period <= end_period)
        
        return query.scalar()
    
    def get_latest(self) -> Optional[HK6Result]:
        """获取最新一期数据"""
        return self.db.query(HK6Result).order_by(
            HK6Result.year.desc(), HK6Result.no.desc()
        ).first()
