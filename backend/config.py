"""
配置管理模块
"""
import os
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.resolve()

# 数据库配置
DATABASE_URL = f"sqlite:///{PROJECT_ROOT}/lottery.db"

# 双色球 (SSQ) API 配置 - 中国福利彩票
SSQ_CONFIG = {
    "url": "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        "Cookie": os.getenv("SSQ_COOKIE", ""),
    },
    "default_params": {
        "name": "ssq",
        "pageNo": "1",
        "pageSize": "30",
        "systemType": "PC",
    }
}

# 大乐透 (DLT) API 配置 - 体育彩票
DLT_CONFIG = {
    "url": "https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry",
    "headers": {
        "User-Agent": os.getenv(
            "DLT_USER_AGENT",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
        ),
        "Cookie": os.getenv("DLT_COOKIE", ""),
        "Referer": os.getenv("DLT_REFERER", "https://www.lottery.gov.cn/"),
        "Origin": os.getenv("DLT_ORIGIN", "https://www.lottery.gov.cn"),
        "Accept-Language": os.getenv("DLT_ACCEPT_LANGUAGE", "zh-CN,zh;q=0.9,en;q=0.8"),
    },
    # 备用源（中彩网 JSON/JSONP）
    "fallback_url": "https://jc.zhcw.com/port/client_json.php",
    "fallback_headers": {
        "User-Agent": os.getenv(
            "DLT_FALLBACK_USER_AGENT",
            os.getenv(
                "DLT_USER_AGENT",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
            )
        ),
        "Cookie": os.getenv("DLT_FALLBACK_COOKIE", ""),
        "Referer": os.getenv("DLT_FALLBACK_REFERER", "https://jc.zhcw.com/kjxx/dlt/"),
        "Origin": os.getenv("DLT_FALLBACK_ORIGIN", "https://jc.zhcw.com"),
        "Accept-Language": os.getenv("DLT_ACCEPT_LANGUAGE", "zh-CN,zh;q=0.9,en;q=0.8"),
    },
    "default_params": {
        "gameNo": "85",
        "provinceId": "0",
        "pageNo": "1",
        "pageSize": "30",
        "isVerify": "1",
    },
    "fallback_default_params": {
        "transactionType": "10001001",
        "lotteryId": "281",
        "issueCount": "30",
        "startIssue": "",
        "endIssue": "",
        "startDate": "",
        "endDate": "",
        "type": "0",
        "pageNum": "1",
        "pageSize": "30",
    },
}

# CORS 配置
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
