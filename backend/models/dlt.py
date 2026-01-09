"""
大乐透 (DLT) 数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from database import Base


class DLTResult(Base):
    """大乐透开奖结果"""
    __tablename__ = "dlt_results"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(20), unique=True, index=True, comment="期号")
    front1 = Column(Integer, comment="前区1")
    front2 = Column(Integer, comment="前区2")
    front3 = Column(Integer, comment="前区3")
    front4 = Column(Integer, comment="前区4")
    front5 = Column(Integer, comment="前区5")
    back1 = Column(Integer, comment="后区1")
    back2 = Column(Integer, comment="后区2")
    sale_begin_time = Column(String(30), comment="开售时间")
    sale_end_time = Column(String(30), comment="停售时间")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "period": self.period,
            "front": [self.front1, self.front2, self.front3, self.front4, self.front5],
            "back": [self.back1, self.back2],
            "sale_begin_time": self.sale_begin_time,
            "sale_end_time": self.sale_end_time,
        }
