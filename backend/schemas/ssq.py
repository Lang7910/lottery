"""
双色球 Pydantic 模式
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class SSQResultSchema(BaseModel):
    """双色球开奖结果响应"""
    period: int = Field(..., description="期数")
    date: str = Field(..., description="开奖日期")
    weekday: str = Field(..., description="星期")
    red: List[int] = Field(..., description="红球号码 (6个)")
    blue: int = Field(..., description="蓝球号码")

    class Config:
        from_attributes = True


class SSQResultCreate(BaseModel):
    """双色球数据创建"""
    period: int
    date: str
    weekday: str
    red1: int
    red2: int
    red3: int
    red4: int
    red5: int
    red6: int
    blue: int


class SSQFetchRequest(BaseModel):
    """双色球数据获取请求"""
    mode: str = Field("count", description="查询模式: count/period/date")
    count: Optional[int] = Field(None, description="期数数量")
    start_period: Optional[str] = Field(None, description="起始期号")
    end_period: Optional[str] = Field(None, description="结束期号")
    start_date: Optional[str] = Field(None, description="起始日期 YYYY-MM-DD")
    end_date: Optional[str] = Field(None, description="结束日期 YYYY-MM-DD")


class SSQListResponse(BaseModel):
    """双色球列表响应"""
    total: int
    items: List[SSQResultSchema]
