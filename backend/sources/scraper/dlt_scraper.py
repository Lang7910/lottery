"""
大乐透数据爬虫
从体育彩票官网获取数据
"""
import logging
from typing import List, Dict, Any
import requests
import asyncio
from concurrent.futures import ThreadPoolExecutor
import math

from sources.base import DataSource
from config import DLT_CONFIG

logger = logging.getLogger(__name__)

# 创建线程池用于同步请求
_executor = ThreadPoolExecutor(max_workers=5)


class DLTScraper(DataSource):
    """大乐透数据爬虫"""
    
    PAGE_SIZE = 30  # API 每页最多30条
    
    def __init__(self):
        self.url = DLT_CONFIG["url"]
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Origin": "https://www.lottery.gov.cn",
            "Referer": "https://www.lottery.gov.cn/",
            "Connection": "keep-alive",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        }
        self.default_params = DLT_CONFIG["default_params"].copy()
    
    async def fetch_by_count(self, count: int) -> List[Dict[str, Any]]:
        """按期数获取大乐透数据 - 通过多页获取超过100期"""
        all_results = []
        total_pages = math.ceil(count / self.PAGE_SIZE)
        
        loop = asyncio.get_event_loop()
        
        for page_no in range(1, total_pages + 1):
            params = {
                **self.default_params,
                "pageNo": str(page_no),
                "pageSize": str(self.PAGE_SIZE),
            }
            
            page_data = await loop.run_in_executor(
                _executor, self._sync_fetch_page, params, page_no
            )
            
            if not page_data:
                break
                
            parsed = self._parse_results(page_data)
            all_results.extend(parsed)
            
            # 检查是否已获取足够数据
            if len(all_results) >= count:
                break
            
            # 检查是否还有更多页
            value = page_data.get("value", {})
            api_total_pages = value.get("pages", 1)
            if page_no >= api_total_pages:
                break
        
        return all_results[:count]
    
    async def fetch_by_period(self, start: str, end: str) -> List[Dict[str, Any]]:
        """按期号范围获取大乐透数据"""
        all_results = []
        page_no = 1
        
        loop = asyncio.get_event_loop()
        
        while True:
            params = {
                **self.default_params,
                "pageNo": str(page_no),
                "pageSize": str(self.PAGE_SIZE),
                "startTerm": start,
                "endTerm": end,
            }
            
            page_data = await loop.run_in_executor(
                _executor, self._sync_fetch_page, params, page_no
            )
            
            if not page_data:
                break
                
            parsed = self._parse_results(page_data)
            if not parsed:
                break
                
            all_results.extend(parsed)
            
            # 检查是否还有更多页
            value = page_data.get("value", {})
            total_pages = value.get("pages", 1)
            if page_no >= total_pages:
                break
            
            page_no += 1
        
        return all_results
    
    def _sync_fetch_page(self, params: dict, page_no: int) -> Dict[str, Any]:
        """同步获取单页数据"""
        try:
            response = requests.get(
                self.url, 
                headers=self.headers, 
                params=params,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            if "value" not in data or "list" not in data.get("value", {}):
                logger.warning(f"DLT API 第 {page_no} 页响应格式异常")
                return {}
            
            return data
        except Exception as e:
            logger.error(f"获取大乐透第 {page_no} 页数据失败: {e}")
            return {}
    
    def _parse_results(self, json_data: dict) -> List[Dict[str, Any]]:
        """解析响应数据"""
        results = []
        value = json_data.get("value", {})
        for item in value.get("list", []):
            try:
                draw_result = item["lotteryDrawResult"].split()
                front_area = list(map(int, draw_result[:5]))
                back_area = list(map(int, draw_result[5:]))
                
                results.append({
                    "period": item["lotteryDrawNum"],
                    "front1": front_area[0],
                    "front2": front_area[1],
                    "front3": front_area[2],
                    "front4": front_area[3],
                    "front5": front_area[4],
                    "back1": back_area[0],
                    "back2": back_area[1],
                    "sale_begin_time": item.get("lotterySaleBeginTime", ""),
                    "sale_end_time": item.get("lotterySaleEndtime", ""),
                })
            except (KeyError, ValueError, IndexError) as e:
                logger.error(f"解析大乐透数据失败: {e}")
                continue
        return results
