"""
投注与收藏模型
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Float, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class BetType(str, enum.Enum):
    """投注类型"""
    SINGLE = "single"       # 单式
    MULTIPLE = "multiple"   # 复式
    DANTUO = "dantuo"       # 胆拖


class BetStatus(str, enum.Enum):
    """投注状态"""
    PENDING = "pending"     # 待开奖
    CHECKED = "checked"     # 已开奖
    CANCELLED = "cancelled" # 已取消


class Watchlist(Base):
    """号码收藏表"""
    __tablename__ = "watchlist"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lottery_type = Column(String(10), nullable=False)  # ssq / dlt
    numbers = Column(JSON, nullable=False)  # {"red": [1,2,3,4,5,6], "blue": 7} 或 {"front": [...], "back": [...]}
    source = Column(String(50), nullable=True)  # 来源: timeseries, metaphysical, manual 等
    note = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    user = relationship("User", backref="watchlist_items")


class Bet(Base):
    """投注记录表"""
    __tablename__ = "bets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lottery_type = Column(String(10), nullable=False)  # ssq / dlt
    bet_type = Column(String(20), nullable=False)  # single, multiple, dantuo
    target_period = Column(Integer, nullable=False, index=True)  # 目标期号
    
    # 号码信息
    # 单式: {"red": [1,2,3,4,5,6], "blue": 7}
    # 复式: {"red": [1,2,3,4,5,6,7,8], "blue": [1,2]}
    # 胆拖: {"dan_red": [1,2], "tuo_red": [3,4,5,6,7], "blue": 7}
    numbers = Column(JSON, nullable=False)
    
    # 投注信息
    bet_count = Column(Integer, nullable=False, default=1)  # 注数
    multiple = Column(Integer, nullable=False, default=1)   # 倍数
    amount = Column(Float, nullable=False)  # 投注金额
    
    # 开奖结果
    status = Column(String(20), default=BetStatus.PENDING.value)
    prize_level = Column(String(20), nullable=True)  # 中奖等级: 一等奖, 二等奖...
    prize_amount = Column(Float, nullable=True, default=0)  # 中奖金额
    matched_red = Column(Integer, nullable=True)  # 中红球数
    matched_blue = Column(Boolean, nullable=True)  # 是否中蓝球
    
    # 时间
    created_at = Column(DateTime, default=datetime.utcnow)
    checked_at = Column(DateTime, nullable=True)
    
    # 关系
    user = relationship("User", backref="bets")


# 双色球中奖规则
SSQ_PRIZE_RULES = [
    {"level": "一等奖", "red": 6, "blue": True, "prize": None},  # 浮动奖金
    {"level": "二等奖", "red": 6, "blue": False, "prize": None},
    {"level": "三等奖", "red": 5, "blue": True, "prize": 3000},
    {"level": "四等奖", "red": 5, "blue": False, "prize": 200},
    {"level": "四等奖", "red": 4, "blue": True, "prize": 200},
    {"level": "五等奖", "red": 4, "blue": False, "prize": 10},
    {"level": "五等奖", "red": 3, "blue": True, "prize": 10},
    {"level": "六等奖", "red": 2, "blue": True, "prize": 5},
    {"level": "六等奖", "red": 1, "blue": True, "prize": 5},
    {"level": "六等奖", "red": 0, "blue": True, "prize": 5},
]

# 大乐透中奖规则
DLT_PRIZE_RULES = [
    {"level": "一等奖", "front": 5, "back": 2, "prize": None},
    {"level": "二等奖", "front": 5, "back": 1, "prize": None},
    {"level": "三等奖", "front": 5, "back": 0, "prize": 10000},
    {"level": "四等奖", "front": 4, "back": 2, "prize": 3000},
    {"level": "五等奖", "front": 4, "back": 1, "prize": 300},
    {"level": "六等奖", "front": 3, "back": 2, "prize": 200},
    {"level": "七等奖", "front": 4, "back": 0, "prize": 100},
    {"level": "八等奖", "front": 3, "back": 1, "prize": 15},
    {"level": "八等奖", "front": 2, "back": 2, "prize": 15},
    {"level": "九等奖", "front": 3, "back": 0, "prize": 5},
    {"level": "九等奖", "front": 2, "back": 1, "prize": 5},
    {"level": "九等奖", "front": 1, "back": 2, "prize": 5},
    {"level": "九等奖", "front": 0, "back": 2, "prize": 5},
]
