"""
双色球 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.ssq_service import SSQService
from schemas.ssq import SSQResultSchema, SSQFetchRequest, SSQListResponse

router = APIRouter(tags=["双色球"])


class SyncResponse(BaseModel):
    synced: int
    message: str


class RefreshRequest(BaseModel):
    count: int = 100


class RefreshResponse(BaseModel):
    refreshed: int
    message: str


@router.get("", response_model=SSQListResponse)
def get_ssq_list(
    limit: int = Query(100, ge=1, le=500, description="每页数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    start_period: Optional[int] = Query(None, description="起始期号"),
    end_period: Optional[int] = Query(None, description="结束期号"),
    start_date: Optional[str] = Query(None, description="起始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """获取双色球开奖数据列表（支持筛选）"""
    service = SSQService(db)
    items = service.get_all(
        limit=limit,
        offset=offset,
        start_period=start_period,
        end_period=end_period,
        start_date=start_date,
        end_date=end_date,
    )
    total = service.get_count(
        start_period=start_period,
        end_period=end_period,
        start_date=start_date,
        end_date=end_date,
    )
    return SSQListResponse(
        total=total,
        items=[
            SSQResultSchema(
                period=item.period,
                date=item.date,
                weekday=item.weekday,
                red=[item.red1, item.red2, item.red3, item.red4, item.red5, item.red6],
                blue=item.blue,
            )
            for item in items
        ],
    )


@router.get("/latest", response_model=Optional[SSQResultSchema])
def get_latest_ssq(db: Session = Depends(get_db)):
    """获取最新一期双色球数据"""
    service = SSQService(db)
    item = service.get_latest()
    if not item:
        return None
    return SSQResultSchema(
        period=item.period,
        date=item.date,
        weekday=item.weekday,
        red=[item.red1, item.red2, item.red3, item.red4, item.red5, item.red6],
        blue=item.blue,
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_ssq_data(db: Session = Depends(get_db)):
    """增量同步：只获取缺失的最新数据"""
    service = SSQService(db)
    result = await service.sync_latest()
    return SyncResponse(**result)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_ssq_data(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    """全量刷新：获取指定期数的所有数据"""
    service = SSQService(db)
    result = await service.refresh_all(count=request.count)
    return RefreshResponse(**result)


@router.post("/fetch", response_model=SSQListResponse)
async def fetch_ssq_data(
    request: SSQFetchRequest,
    db: Session = Depends(get_db),
):
    """按条件获取并保存双色球数据"""
    service = SSQService(db)
    items = await service.fetch_and_save(
        mode=request.mode,
        count=request.count,
        start_period=request.start_period,
        end_period=request.end_period,
        start_date=request.start_date,
        end_date=request.end_date,
    )
    return SSQListResponse(
        total=len(items),
        items=[
            SSQResultSchema(
                period=item.period,
                date=item.date,
                weekday=item.weekday,
                red=[item.red1, item.red2, item.red3, item.red4, item.red5, item.red6],
                blue=item.blue,
            )
            for item in items
        ],
    )


@router.get("/{period}", response_model=Optional[SSQResultSchema])
def get_ssq_by_period(period: int, db: Session = Depends(get_db)):
    """根据期号获取双色球数据"""
    service = SSQService(db)
    item = service.get_by_period(period)
    if not item:
        return None
    return SSQResultSchema(
        period=item.period,
        date=item.date,
        weekday=item.weekday,
        red=[item.red1, item.red2, item.red3, item.red4, item.red5, item.red6],
        blue=item.blue,
    )
