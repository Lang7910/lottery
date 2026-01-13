"""测试HK6 GraphQL - 获取更多期数"""
import asyncio
from services.hk6_service import HK6Service
from database import SessionLocal

async def test():
    db = SessionLocal()
    try:
        service = HK6Service(db)
        # 测试获取50期
        data = await service.fetch_from_hkjc(50)
        print(f"请求50期，获取到 {len(data)} 条记录")
        if data:
            print(f"最新: {data[0]['period']}")
            print(f"最旧: {data[-1]['period']}")
        
        # 测试获取100期
        data = await service.fetch_from_hkjc(100)
        print(f"\n请求100期，获取到 {len(data)} 条记录")
        if data:
            print(f"最新: {data[0]['period']}")
            print(f"最旧: {data[-1]['period']}")
    finally:
        db.close()

asyncio.run(test())
