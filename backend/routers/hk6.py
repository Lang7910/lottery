"""
香港六合彩 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.hk6_service import HK6Service
from schemas.hk6 import HK6ResultSchema, HK6ListResponse

router = APIRouter(tags=["香港六合彩"])


class SyncResponse(BaseModel):
    synced: int
    message: str


class RefreshRequest(BaseModel):
    count: int = 100


class RefreshResponse(BaseModel):
    refreshed: int
    message: str


@router.get("", response_model=HK6ListResponse)
def get_hk6_list(
    limit: int = Query(100, ge=1, le=500, description="每页数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    start_period: Optional[str] = Query(None, description="起始期号"),
    end_period: Optional[str] = Query(None, description="结束期号"),
    db: Session = Depends(get_db),
):
    """获取六合彩开奖数据列表"""
    service = HK6Service(db)
    items = service.get_all(
        limit=limit,
        offset=offset,
        start_period=start_period,
        end_period=end_period,
    )
    total = service.get_count(
        start_period=start_period,
        end_period=end_period,
    )
    return HK6ListResponse(
        total=total,
        items=[
            HK6ResultSchema(
                period=item.period,
                year=item.year,
                no=item.no,
                date=item.date,
                numbers=[item.num1, item.num2, item.num3, item.num4, item.num5, item.num6],
                special=item.special,
                snowball_code=item.snowball_code,
                snowball_name=item.snowball_name,
            )
            for item in items
        ],
    )


@router.get("/{period}")
def get_hk6_by_period(
    period: str,
    db: Session = Depends(get_db),
):
    """获取指定期号的开奖数据"""
    service = HK6Service(db)
    item = service.get_by_period(period)
    if not item:
        return {"error": "未找到该期数据"}
    return HK6ResultSchema(
        period=item.period,
        year=item.year,
        no=item.no,
        date=item.date,
        numbers=[item.num1, item.num2, item.num3, item.num4, item.num5, item.num6],
        special=item.special,
        snowball_code=item.snowball_code,
        snowball_name=item.snowball_name,
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_hk6(db: Session = Depends(get_db)):
    """增量同步六合彩数据"""
    service = HK6Service(db)
    result = await service.sync_latest()
    return SyncResponse(**result)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_hk6(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    """全量刷新六合彩数据"""
    service = HK6Service(db)
    result = await service.refresh_all(request.count)
    return RefreshResponse(**result)
