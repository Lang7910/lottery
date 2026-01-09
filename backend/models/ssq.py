"""
双色球 (SSQ) 数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from database import Base


class SSQResult(Base):
    """双色球开奖结果"""
    __tablename__ = "ssq_results"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(Integer, unique=True, index=True, comment="期数")
    date = Column(String(20), comment="开奖日期")
    weekday = Column(String(10), comment="星期")
    red1 = Column(Integer, comment="红球1")
    red2 = Column(Integer, comment="红球2")
    red3 = Column(Integer, comment="红球3")
    red4 = Column(Integer, comment="红球4")
    red5 = Column(Integer, comment="红球5")
    red6 = Column(Integer, comment="红球6")
    blue = Column(Integer, comment="蓝球")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "period": self.period,
            "date": self.date,
            "weekday": self.weekday,
            "red": [self.red1, self.red2, self.red3, self.red4, self.red5, self.red6],
            "blue": self.blue,
        }
