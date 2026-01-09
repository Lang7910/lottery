"""
大乐透 Pydantic 模式
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class DLTResultSchema(BaseModel):
    """大乐透开奖结果响应"""
    period: str = Field(..., description="期号")
    front: List[int] = Field(..., description="前区号码 (5个, 1-35)")
    back: List[int] = Field(..., description="后区号码 (2个, 1-12)")
    sale_begin_time: Optional[str] = Field(None, description="开售时间")
    sale_end_time: Optional[str] = Field(None, description="停售时间")

    class Config:
        from_attributes = True


class DLTResultCreate(BaseModel):
    """大乐透数据创建"""
    period: str
    front1: int
    front2: int
    front3: int
    front4: int
    front5: int
    back1: int
    back2: int
    sale_begin_time: Optional[str] = None
    sale_end_time: Optional[str] = None


class DLTFetchRequest(BaseModel):
    """大乐透数据获取请求"""
    mode: str = Field("count", description="查询模式: count/period")
    count: Optional[int] = Field(None, description="期数数量 (1-100)")
    start_period: Optional[str] = Field(None, description="起始期号 yyxxx")
    end_period: Optional[str] = Field(None, description="结束期号 yyxxx")


class DLTListResponse(BaseModel):
    """大乐透列表响应"""
    total: int
    items: List[DLTResultSchema]
