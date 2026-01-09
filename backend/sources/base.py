"""
数据源抽象基类
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class DataSource(ABC):
    """数据源抽象基类"""
    
    @abstractmethod
    async def fetch_by_count(self, count: int) -> List[Dict[str, Any]]:
        """按期数获取数据
        
        Args:
            count: 获取的期数数量
            
        Returns:
            开奖结果列表
        """
        pass
    
    @abstractmethod
    async def fetch_by_period(self, start: str, end: str) -> List[Dict[str, Any]]:
        """按期号范围获取数据
        
        Args:
            start: 起始期号
            end: 结束期号
            
        Returns:
            开奖结果列表
        """
        pass
    
    async def fetch_by_date(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """按日期范围获取数据（可选实现）
        
        Args:
            start_date: 起始日期 YYYY-MM-DD
            end_date: 结束日期 YYYY-MM-DD
            
        Returns:
            开奖结果列表
        """
        raise NotImplementedError("该数据源不支持按日期查询")
