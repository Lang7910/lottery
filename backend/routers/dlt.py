"""
大乐透 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.dlt_service import DLTService
from schemas.dlt import DLTResultSchema, DLTFetchRequest, DLTListResponse

router = APIRouter(prefix="/dlt", tags=["大乐透"])


class SyncResponse(BaseModel):
    synced: int
    message: str


class RefreshRequest(BaseModel):
    count: int = 100


class RefreshResponse(BaseModel):
    refreshed: int
    message: str


@router.get("/", response_model=DLTListResponse)
def get_dlt_list(
    limit: int = Query(100, ge=1, le=500, description="每页数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    start_period: Optional[str] = Query(None, description="起始期号 yyxxx"),
    end_period: Optional[str] = Query(None, description="结束期号 yyxxx"),
    db: Session = Depends(get_db),
):
    """获取大乐透开奖数据列表（支持筛选）"""
    service = DLTService(db)
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
    return DLTListResponse(
        total=total,
        items=[
            DLTResultSchema(
                period=item.period,
                front=[item.front1, item.front2, item.front3, item.front4, item.front5],
                back=[item.back1, item.back2],
                sale_begin_time=item.sale_begin_time,
                sale_end_time=item.sale_end_time,
            )
            for item in items
        ],
    )


@router.get("/latest", response_model=Optional[DLTResultSchema])
def get_latest_dlt(db: Session = Depends(get_db)):
    """获取最新一期大乐透数据"""
    service = DLTService(db)
    item = service.get_latest()
    if not item:
        return None
    return DLTResultSchema(
        period=item.period,
        front=[item.front1, item.front2, item.front3, item.front4, item.front5],
        back=[item.back1, item.back2],
        sale_begin_time=item.sale_begin_time,
        sale_end_time=item.sale_end_time,
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_dlt_data(db: Session = Depends(get_db)):
    """增量同步：只获取缺失的最新数据"""
    service = DLTService(db)
    result = await service.sync_latest()
    return SyncResponse(**result)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_dlt_data(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    """全量刷新：获取指定期数的所有数据"""
    service = DLTService(db)
    result = await service.refresh_all(count=request.count)
    return RefreshResponse(**result)


@router.post("/fetch", response_model=DLTListResponse)
async def fetch_dlt_data(
    request: DLTFetchRequest,
    db: Session = Depends(get_db),
):
    """按条件获取并保存大乐透数据"""
    service = DLTService(db)
    items = await service.fetch_and_save(
        mode=request.mode,
        count=request.count,
        start_period=request.start_period,
        end_period=request.end_period,
    )
    return DLTListResponse(
        total=len(items),
        items=[
            DLTResultSchema(
                period=item.period,
                front=[item.front1, item.front2, item.front3, item.front4, item.front5],
                back=[item.back1, item.back2],
                sale_begin_time=item.sale_begin_time,
                sale_end_time=item.sale_end_time,
            )
            for item in items
        ],
    )


@router.get("/{period}", response_model=Optional[DLTResultSchema])
def get_dlt_by_period(period: str, db: Session = Depends(get_db)):
    """根据期号获取大乐透数据"""
    service = DLTService(db)
    item = service.get_by_period(period)
    if not item:
        return None
    return DLTResultSchema(
        period=item.period,
        front=[item.front1, item.front2, item.front3, item.front4, item.front5],
        back=[item.back1, item.back2],
        sale_begin_time=item.sale_begin_time,
        sale_end_time=item.sale_end_time,
    )
