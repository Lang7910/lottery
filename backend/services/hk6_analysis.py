"""
香港六合彩统计分析服务
"""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict
from datetime import datetime

from models.hk6 import HK6Result

# 波色映射（固定不变）
RED_WAVE = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46]
BLUE_WAVE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48]
GREEN_WAVE = [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49]

# 十二生肖
ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]

# 农历新年日期表
LUNAR_NEW_YEAR_DATES = {
    2020: (1, 25), 2021: (2, 12), 2022: (2, 1), 2023: (1, 22),
    2024: (2, 10), 2025: (1, 29), 2026: (2, 17), 2027: (2, 6),
    2028: (1, 26), 2029: (2, 13), 2030: (2, 3),
}

# 公历年份对应的农历生肖索引
YEAR_ZODIAC = {
    2020: 0, 2021: 1, 2022: 2, 2023: 3, 2024: 4, 2025: 5,
    2026: 6, 2027: 7, 2028: 8, 2029: 9, 2030: 10,
}


def get_wave_color(num: int) -> str:
    """获取号码的波色"""
    if num in RED_WAVE:
        return "red"
    elif num in BLUE_WAVE:
        return "blue"
    else:
        return "green"


def get_lunar_year(year: int, month: int, day: int) -> int:
    """根据公历日期判断农历年份"""
    cny = LUNAR_NEW_YEAR_DATES.get(year)
    if not cny:
        # 估算：2月中旬
        if month < 2 or (month == 2 and day < 15):
            return year - 1
        return year
    
    cny_month, cny_day = cny
    if month < cny_month or (month == cny_month and day < cny_day):
        return year - 1
    return year


def get_zodiac(num: int, lunar_year: int) -> str:
    """获取号码对应的生肖"""
    base_year = 2020
    base_zodiac = 0  # 鼠
    
    if lunar_year in YEAR_ZODIAC:
        year_zodiac_idx = YEAR_ZODIAC[lunar_year]
    else:
        diff = lunar_year - base_year
        year_zodiac_idx = (base_zodiac + diff) % 12
    
    # 1号是当年生肖，逆推
    num_offset = (num - 1) % 12
    zodiac_idx = (year_zodiac_idx - num_offset + 12) % 12
    
    return ZODIACS[zodiac_idx]


class HK6AnalysisService:
    """香港六合彩统计分析"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_number_frequency(
        self,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict:
        """获取号码出现频率统计
        
        Returns:
            total: 总期数
            numbers: 1-49号码的统计数据
            positions: 每个位置的号码统计
        """
        query = self.db.query(HK6Result)
        
        if start_period:
            query = query.filter(HK6Result.period >= start_period)
        if end_period:
            query = query.filter(HK6Result.period <= end_period)
        
        query = query.order_by(HK6Result.year.desc(), HK6Result.no.desc())
        
        if limit:
            query = query.limit(limit)
        
        results = query.all()
        total = len(results)
        
        if total == 0:
            return {"total": 0, "numbers": [], "positions": []}
        
        # 统计每个号码的总出现次数
        number_counts = defaultdict(int)
        special_counts = defaultdict(int)
        
        # 统计每个位置的号码
        position_counts = [defaultdict(int) for _ in range(6)]
        
        for r in results:
            nums = [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6]
            for i, num in enumerate(nums):
                number_counts[num] += 1
                position_counts[i][num] += 1
            
            # 特码单独统计
            special_counts[r.special] += 1
            number_counts[r.special] += 1
        
        # 转换为列表格式
        numbers = []
        for num in range(1, 50):
            count = number_counts.get(num, 0)
            special = special_counts.get(num, 0)
            numbers.append({
                "number": num,
                "count": count,
                "special_count": special,
                "frequency": round(count / (total * 7), 4) if total > 0 else 0,
                "wave": get_wave_color(num),
            })
        
        # 每个位置的统计
        positions = []
        for i in range(6):
            pos_data = []
            for num in range(1, 50):
                count = position_counts[i].get(num, 0)
                pos_data.append({
                    "number": num,
                    "count": count,
                    "frequency": round(count / total, 4) if total > 0 else 0,
                })
            positions.append({
                "position": i + 1,
                "stats": pos_data,
            })
        
        return {
            "total": total,
            "numbers": numbers,
            "positions": positions,
        }
    
    def get_wave_color_stats(
        self,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict:
        """获取波色统计"""
        query = self.db.query(HK6Result)
        
        if start_period:
            query = query.filter(HK6Result.period >= start_period)
        if end_period:
            query = query.filter(HK6Result.period <= end_period)
        
        query = query.order_by(HK6Result.year.desc(), HK6Result.no.desc())
        
        if limit:
            query = query.limit(limit)
        
        results = query.all()
        total = len(results)
        
        if total == 0:
            return {"total": 0, "wave_stats": {}, "special_wave": {}, "history": []}
        
        # 统计所有号码的波色
        wave_counts = {"red": 0, "blue": 0, "green": 0}
        special_wave_counts = {"red": 0, "blue": 0, "green": 0}
        
        history = []
        
        for r in results:
            nums = [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6]
            period_waves = {"red": 0, "blue": 0, "green": 0}
            
            for num in nums:
                wave = get_wave_color(num)
                wave_counts[wave] += 1
                period_waves[wave] += 1
            
            # 特码波色
            special_wave = get_wave_color(r.special)
            special_wave_counts[special_wave] += 1
            
            history.append({
                "period": r.period,
                "date": r.date,
                "waves": period_waves,
                "special_wave": special_wave,
            })
        
        total_balls = total * 6
        
        return {
            "total": total,
            "wave_stats": {
                "red": {
                    "count": wave_counts["red"],
                    "frequency": round(wave_counts["red"] / total_balls, 4) if total_balls > 0 else 0,
                },
                "blue": {
                    "count": wave_counts["blue"],
                    "frequency": round(wave_counts["blue"] / total_balls, 4) if total_balls > 0 else 0,
                },
                "green": {
                    "count": wave_counts["green"],
                    "frequency": round(wave_counts["green"] / total_balls, 4) if total_balls > 0 else 0,
                },
            },
            "special_wave": {
                "red": {
                    "count": special_wave_counts["red"],
                    "frequency": round(special_wave_counts["red"] / total, 4) if total > 0 else 0,
                },
                "blue": {
                    "count": special_wave_counts["blue"],
                    "frequency": round(special_wave_counts["blue"] / total, 4) if total > 0 else 0,
                },
                "green": {
                    "count": special_wave_counts["green"],
                    "frequency": round(special_wave_counts["green"] / total, 4) if total > 0 else 0,
                },
            },
            "history": history[:20],  # 只返回最近20期
        }
    
    def get_zodiac_stats(
        self,
        start_period: Optional[str] = None,
        end_period: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict:
        """获取生肖统计"""
        query = self.db.query(HK6Result)
        
        if start_period:
            query = query.filter(HK6Result.period >= start_period)
        if end_period:
            query = query.filter(HK6Result.period <= end_period)
        
        query = query.order_by(HK6Result.year.desc(), HK6Result.no.desc())
        
        if limit:
            query = query.limit(limit)
        
        results = query.all()
        total = len(results)
        
        if total == 0:
            return {"total": 0, "zodiac_stats": [], "special_zodiac": [], "history": []}
        
        # 统计所有号码的生肖
        zodiac_counts = defaultdict(int)
        special_zodiac_counts = defaultdict(int)
        
        history = []
        
        for r in results:
            # 解析日期获取农历年
            try:
                date_str = r.date.split("+")[0] if "+" in r.date else r.date
                dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
                lunar_year = get_lunar_year(dt.year, dt.month, dt.day)
            except:
                lunar_year = r.year
            
            nums = [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6]
            period_zodiacs = defaultdict(int)
            
            for num in nums:
                zodiac = get_zodiac(num, lunar_year)
                zodiac_counts[zodiac] += 1
                period_zodiacs[zodiac] += 1
            
            # 特码生肖
            special_zodiac = get_zodiac(r.special, lunar_year)
            special_zodiac_counts[special_zodiac] += 1
            
            history.append({
                "period": r.period,
                "date": r.date,
                "special": r.special,
                "special_zodiac": special_zodiac,
            })
        
        total_balls = total * 6
        
        # 转换为列表格式
        zodiac_stats = []
        special_zodiac_stats = []
        
        for zodiac in ZODIACS:
            zodiac_stats.append({
                "zodiac": zodiac,
                "count": zodiac_counts.get(zodiac, 0),
                "frequency": round(zodiac_counts.get(zodiac, 0) / total_balls, 4) if total_balls > 0 else 0,
            })
            special_zodiac_stats.append({
                "zodiac": zodiac,
                "count": special_zodiac_counts.get(zodiac, 0),
                "frequency": round(special_zodiac_counts.get(zodiac, 0) / total, 4) if total > 0 else 0,
            })
        
        return {
            "total": total,
            "zodiac_stats": zodiac_stats,
            "special_zodiac": special_zodiac_stats,
            "history": history[:20],
        }
