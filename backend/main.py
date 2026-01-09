"""
彩票数据分析 API 服务
FastAPI 入口
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import init_db
from routers import ssq_router, dlt_router
from routers.analysis import router as analysis_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    logger.info("初始化数据库...")
    init_db()
    logger.info("数据库初始化完成")
    yield
    # 关闭时清理资源
    logger.info("应用关闭")


app = FastAPI(
    title="彩票数据分析 API",
    description="双色球和大乐透数据获取、统计与预测",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(ssq_router, prefix="/api")
app.include_router(dlt_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")


@app.get("/")
def root():
    """API 根路径"""
    return {
        "message": "彩票数据分析 API",
        "docs": "/docs",
        "endpoints": {
            "ssq": "/api/ssq",
            "dlt": "/api/dlt",
        },
    }


@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
