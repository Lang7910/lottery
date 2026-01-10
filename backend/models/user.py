"""
用户模型 - 与 Clerk 集成
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from database import Base


class User(Base):
    """用户表 - 存储 Clerk 用户关联信息"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    username = Column(String(100), nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
