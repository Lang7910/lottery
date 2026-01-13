"""
香港六合彩 Pydantic 模式
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class HK6ResultSchema(BaseModel):
    """香港六合彩开奖结果响应"""
    period: str = Field(..., description="期号")
    year: int = Field(..., description="年份")
    no: int = Field(..., description="当年期数")
    date: str = Field(..., description="开奖日期")
    numbers: List[int] = Field(..., description="6个正码")
    special: int = Field(..., description="特别号码")
    snowball_code: Optional[str] = Field(None, description="金多宝代码")
    snowball_name: Optional[str] = Field(None, description="金多宝名称")

    class Config:
        from_attributes = True


class HK6ListResponse(BaseModel):
    """香港六合彩列表响应"""
    total: int
    items: List[HK6ResultSchema]
