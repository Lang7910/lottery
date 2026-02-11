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
import re

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

    @staticmethod
    def _first_non_empty(item: Dict[str, Any], keys: List[str], default: str = "") -> str:
        for key in keys:
            value = item.get(key)
            if value is not None and str(value).strip() != "":
                return str(value).strip()
        return default

    @staticmethod
    def _extract_draw_numbers(raw: Any) -> List[int]:
        """
        兼容多种开奖号码格式:
        - "04 05 10 23 31 07 12"
        - "04 05 10 23 31 + 07 12"
        - "04,05,10,23,31,07,12"
        """
        if raw is None:
            return []
        if isinstance(raw, list):
            nums = []
            for n in raw:
                try:
                    nums.append(int(n))
                except (TypeError, ValueError):
                    continue
            return nums

        text = str(raw)
        # 直接提取所有连续数字，自动忽略 "+" 等分隔符
        return [int(x) for x in re.findall(r"\d+", text)]
    
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
        # 同一请求做多组参数重试，兼容接口策略变化或风控差异
        candidate_params = []
        base_params = params.copy()
        candidate_params.append(base_params)

        no_term = base_params.copy()
        no_term.pop("termLimits", None)
        candidate_params.append(no_term)

        no_verify = no_term.copy()
        no_verify["isVerify"] = "0"
        candidate_params.append(no_verify)

        # 去重，防止重复请求同参数
        dedup = []
        seen = set()
        for p in candidate_params:
            key = tuple(sorted((k, str(v)) for k, v in p.items()))
            if key not in seen:
                seen.add(key)
                dedup.append(p)

        last_error = None
        for attempt, p in enumerate(dedup, start=1):
            try:
                response = requests.get(
                    self.url,
                    headers=self.headers,
                    params=p,
                    timeout=15
                )

                # 兼容接口返回非200但body仍是可用JSON的情况（例如 567）
                text = response.text or ""
                try:
                    data = response.json()
                except ValueError:
                    data = None

                if data:
                    value = data.get("value", {})
                    if isinstance(value, dict) and "list" in value:
                        if response.status_code >= 400:
                            logger.warning(
                                "DLT API 第 %s 页状态码 %s 但JSON可用, attempt=%s, params=%s",
                                page_no,
                                response.status_code,
                                attempt,
                                p
                            )
                        return data

                # JSON不可用或结构异常，记录后继续重试
                last_error = (
                    f"status={response.status_code}, "
                    f"attempt={attempt}, params={p}, body={text[:280]}"
                )
                logger.warning("DLT API 第 %s 页响应不可用: %s", page_no, last_error)
            except Exception as e:
                last_error = f"attempt={attempt}, params={p}, err={e}"
                logger.warning("DLT API 第 %s 页请求异常: %s", page_no, last_error)

        logger.error("获取大乐透第 %s 页数据失败: %s", page_no, last_error or "未知错误")
        return {}
    
    def _parse_results(self, json_data: dict) -> List[Dict[str, Any]]:
        """解析响应数据"""
        results = []
        value = json_data.get("value", {})
        for item in value.get("list", []):
            try:
                period = self._first_non_empty(
                    item,
                    ["lotteryDrawNum", "lotteryDrawNumDsp", "drawNum", "period"]
                )
                draw_raw = self._first_non_empty(
                    item,
                    ["lotteryDrawResult", "drawResult", "lotteryResult"]
                )
                draw_nums = self._extract_draw_numbers(draw_raw)
                if len(draw_nums) < 7:
                    logger.warning(
                        "解析大乐透号码失败: period=%s, draw_raw=%s, item_keys=%s",
                        period,
                        draw_raw,
                        list(item.keys())[:20]
                    )
                    continue

                front_area = draw_nums[:5]
                back_area = draw_nums[5:7]

                results.append({
                    "period": period,
                    "front1": front_area[0],
                    "front2": front_area[1],
                    "front3": front_area[2],
                    "front4": front_area[3],
                    "front5": front_area[4],
                    "back1": back_area[0],
                    "back2": back_area[1],
                    "sale_begin_time": self._first_non_empty(
                        item,
                        ["lotterySaleBeginTime", "saleBeginTime", "lotteryDrawTime"]
                    ),
                    "sale_end_time": self._first_non_empty(
                        item,
                        ["lotterySaleEndTime", "lotterySaleEndtime", "saleEndTime", "lotteryDrawTime"]
                    ),
                })
            except (KeyError, ValueError, IndexError) as e:
                logger.error(f"解析大乐透数据失败: {e}")
                continue
        return results
