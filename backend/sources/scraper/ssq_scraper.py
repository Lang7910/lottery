"""
双色球数据爬虫
从中国福利彩票官网获取数据
"""
import logging
from typing import List, Dict, Any
import httpx

from sources.base import DataSource
from config import SSQ_CONFIG

logger = logging.getLogger(__name__)


class SSQScraper(DataSource):
    """双色球数据爬虫"""
    
    def __init__(self):
        self.url = SSQ_CONFIG["url"]
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/",
            "Cookie": "HMF_CI=eb51f625c54193e2c3da483f1f8a20849df1836e651910d5c13682ac94490c626fd7ee9b8958ab34c8abc8a8f7fc5dd52f24fdae80b7aaa45255ee8f42c1015380; 21_vq=3",
            "X-Requested-With": "XMLHttpRequest",
        }
        self.default_params = SSQ_CONFIG["default_params"].copy()
    
    async def fetch_by_count(self, count: int) -> List[Dict[str, Any]]:
        """按期数获取双色球数据"""
        params = {
            **self.default_params,
            "issueCount": str(count),
        }
        return await self._fetch_all_pages(params)
    
    async def fetch_by_period(self, start: str, end: str) -> List[Dict[str, Any]]:
        """按期号范围获取双色球数据"""
        params = {
            **self.default_params,
            "issueStart": start,
            "issueEnd": end,
        }
        return await self._fetch_all_pages(params)
    
    async def fetch_by_date(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """按日期范围获取双色球数据"""
        params = {
            **self.default_params,
            "dayStart": start_date,
            "dayEnd": end_date,
        }
        return await self._fetch_all_pages(params)
    
    async def _fetch_all_pages(self, params: dict) -> List[Dict[str, Any]]:
        """获取所有分页数据"""
        all_results = []
        
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,  # 跟随重定向
            verify=False,  # 忽略 SSL 验证问题
        ) as client:
            # 获取第一页确定总页数
            first_page = await self._fetch_page(client, params, 1)
            if not first_page:
                return []
            
            total_pages = first_page.get("pageNum", 1)
            all_results.extend(self._parse_results(first_page))
            
            # 获取剩余页面
            for page_no in range(2, int(total_pages) + 1):
                page_data = await self._fetch_page(client, params, page_no)
                if page_data:
                    all_results.extend(self._parse_results(page_data))
        
        return all_results
    
    async def _fetch_page(
        self, client: httpx.AsyncClient, params: dict, page_no: int
    ) -> Dict[str, Any]:
        """获取单页数据"""
        try:
            params["pageNo"] = str(page_no)
            response = await client.get(
                self.url, headers=self.headers, params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"获取双色球第 {page_no} 页数据失败: {e}")
            return {}
    
    def _parse_results(self, json_data: dict) -> List[Dict[str, Any]]:
        """解析响应数据"""
        results = []
        for item in json_data.get("result", []):
            try:
                red_balls = [int(n) for n in item["red"].split(",")]
                results.append({
                    "period": int(item["code"]),
                    "date": item["date"],
                    "weekday": item["week"],
                    "red1": red_balls[0],
                    "red2": red_balls[1],
                    "red3": red_balls[2],
                    "red4": red_balls[3],
                    "red5": red_balls[4],
                    "red6": red_balls[5],
                    "blue": int(item["blue"]),
                })
            except (KeyError, ValueError, IndexError) as e:
                logger.error(f"解析双色球数据失败: {e}")
                continue
        return results
