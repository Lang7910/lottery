"""
香港六合彩 (HK6) 数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from database import Base


class HK6Result(Base):
    """香港六合彩开奖结果"""
    __tablename__ = "hk6_results"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(20), unique=True, index=True, comment="期号 如 20264N")
    year = Column(Integer, comment="年份")
    no = Column(Integer, comment="当年期数")
    date = Column(String(20), comment="开奖日期")
    num1 = Column(Integer, comment="号码1")
    num2 = Column(Integer, comment="号码2")
    num3 = Column(Integer, comment="号码3")
    num4 = Column(Integer, comment="号码4")
    num5 = Column(Integer, comment="号码5")
    num6 = Column(Integer, comment="号码6")
    special = Column(Integer, comment="特别号码")
    snowball_code = Column(String(20), nullable=True, comment="金多宝代码")
    snowball_name = Column(String(50), nullable=True, comment="金多宝名称")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "period": self.period,
            "year": self.year,
            "no": self.no,
            "date": self.date,
            "numbers": [self.num1, self.num2, self.num3, self.num4, self.num5, self.num6],
            "special": self.special,
            "snowball_code": self.snowball_code,
            "snowball_name": self.snowball_name,
        }
