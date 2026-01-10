"""
投注 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import get_db
from services.betting_service import BettingService

router = APIRouter(prefix="/betting", tags=["投注"])


# ==================== Pydantic 模型 ==================== #

class UserCreate(BaseModel):
    clerk_id: str
    email: Optional[str] = None
    username: Optional[str] = None


class WatchlistCreate(BaseModel):
    lottery_type: str
    numbers: Dict[str, Any]
    source: Optional[str] = "manual"
    note: Optional[str] = None


class WatchlistUpdate(BaseModel):
    numbers: Dict[str, Any]


class BetCreate(BaseModel):
    lottery_type: str
    bet_type: str  # single, multiple, dantuo
    target_period: int
    numbers: Dict[str, Any]
    multiple: int = 1


class CalculateRequest(BaseModel):
    lottery_type: str
    bet_type: str
    numbers: Dict[str, Any]
    multiple: int = 1


# ==================== 辅助函数 ==================== #

def get_clerk_id(x_clerk_user_id: str = Header(None, alias="X-Clerk-User-Id")) -> str:
    """从请求头获取 Clerk 用户 ID"""
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="未登录")
    return x_clerk_user_id


def get_current_user(clerk_id: str = Depends(get_clerk_id), db: Session = Depends(get_db)):
    """获取当前用户"""
    service = BettingService(db)
    user = service.get_user_by_clerk_id(clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


# ==================== 用户 API ==================== #

@router.post("/user/sync")
def sync_user(data: UserCreate, db: Session = Depends(get_db)):
    """同步 Clerk 用户到本地数据库"""
    service = BettingService(db)
    user = service.get_or_create_user(
        clerk_id=data.clerk_id,
        email=data.email,
        username=data.username
    )
    return {
        "id": user.id,
        "clerk_id": user.clerk_id,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat()
    }


@router.get("/user/me")
def get_me(
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """获取当前用户信息"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    stats = service.get_user_stats(user.id)
    return {
        "id": user.id,
        "clerk_id": user.clerk_id,
        "email": user.email,
        "username": user.username,
        "is_admin": user.is_admin,
        "stats": stats
    }


# ==================== 收藏 API ==================== #

@router.get("/watchlist")
def get_watchlist(
    lottery_type: str = None,
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """获取收藏列表"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    items = service.get_watchlist(user.id, lottery_type)
    return [
        {
            "id": item.id,
            "lottery_type": item.lottery_type,
            "numbers": item.numbers,
            "source": item.source,
            "note": item.note,
            "created_at": item.created_at.isoformat()
        }
        for item in items
    ]


@router.post("/watchlist")
def add_to_watchlist(
    data: WatchlistCreate,
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """添加到收藏"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    item = service.add_to_watchlist(
        user_id=user.id,
        lottery_type=data.lottery_type,
        numbers=data.numbers,
        source=data.source,
        note=data.note
    )
    return {
        "id": item.id,
        "message": "添加成功"
    }


@router.put("/watchlist/{item_id}")
def update_watchlist_item(
    item_id: int,
    data: WatchlistUpdate,
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """更新收藏号码"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    item = service.update_watchlist_item(item_id, user.id, data.numbers)
    if not item:
        raise HTTPException(status_code=404, detail="收藏不存在")
    return {"id": item.id, "numbers": item.numbers}


@router.delete("/watchlist/{item_id}")
def delete_watchlist_item(
    item_id: int,
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """删除收藏"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    success = service.delete_watchlist_item(item_id, user.id)
    if not success:
        raise HTTPException(status_code=404, detail="收藏不存在")
    return {"message": "删除成功"}


# ==================== 投注 API ==================== #

@router.post("/calculate")
def calculate_bet(data: CalculateRequest, db: Session = Depends(get_db)):
    """计算注数和金额 (无需登录)"""
    service = BettingService(db)
    bet_count = service.calculate_bet_count(data.lottery_type, data.bet_type, data.numbers)
    amount = service.calculate_amount(bet_count, data.multiple)
    return {
        "bet_count": bet_count,
        "multiple": data.multiple,
        "amount": amount
    }


@router.post("/bets")
def create_bet(
    data: BetCreate,
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """创建投注"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    bet = service.create_bet(
        user_id=user.id,
        lottery_type=data.lottery_type,
        bet_type=data.bet_type,
        target_period=data.target_period,
        numbers=data.numbers,
        multiple=data.multiple
    )
    return {
        "id": bet.id,
        "bet_count": bet.bet_count,
        "amount": bet.amount,
        "target_period": bet.target_period,
        "status": bet.status
    }


@router.get("/bets")
def get_bets(
    lottery_type: str = None,
    status: str = None,
    limit: int = 50,
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """获取投注记录"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    bets = service.get_user_bets(user.id, lottery_type, status, limit)
    return [
        {
            "id": bet.id,
            "lottery_type": bet.lottery_type,
            "bet_type": bet.bet_type,
            "target_period": bet.target_period,
            "numbers": bet.numbers,
            "bet_count": bet.bet_count,
            "multiple": bet.multiple,
            "amount": bet.amount,
            "status": bet.status,
            "prize_level": bet.prize_level,
            "prize_amount": bet.prize_amount,
            "matched_red": bet.matched_red,
            "matched_blue": bet.matched_blue,
            "created_at": bet.created_at.isoformat()
        }
        for bet in bets
    ]


@router.get("/stats")
def get_stats(
    clerk_id: str = Depends(get_clerk_id),
    db: Session = Depends(get_db)
):
    """获取投注统计"""
    service = BettingService(db)
    user = service.get_or_create_user(clerk_id)
    return service.get_user_stats(user.id)
