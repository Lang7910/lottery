"""
玄学预测服务 - 多方法预测系统
包含: 八字五行、本命财星、六十甲子、刑冲合害、命卦空间、梅花易数、综合推荐

三才模型:
- 天时: 开奖时间 (SSQ: 周二四日 21:15, DLT: 周一三六 21:25)
- 地利: 购彩地点 (省市 -> 方位五行)
- 人和: 购彩者信息 (出生日期、性别)
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Set, Optional
import random

logger = logging.getLogger(__name__)

# ==================== 基础映射表 ==================== #

# 河图五行数 - 核心映射
HETU_WUXING = {
    "水": [1, 6],  # 一六共宗
    "火": [2, 7],  # 二七同道
    "木": [3, 8],  # 三八为朋
    "金": [4, 9],  # 四九为友
    "土": [5, 0],  # 五十同途 (0代表尾数10)
}

# 五行相生: 木生火, 火生土, 土生金, 金生水, 水生木
WUXING_SHENG = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
# 五行相克: 木克土, 土克水, 水克火, 火克金, 金克木 (我克者为财)
WUXING_KE = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}
# 被克关系 (克我者为官)
WUXING_KEWO = {"木": "金", "土": "木", "水": "土", "火": "水", "金": "火"}

# 天干
TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
# 地支
DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# 天干五行
TIANGAN_WUXING = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水"
}

# 地支五行
DIZHI_WUXING = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木",
    "辰": "土", "巳": "火", "午": "火", "未": "土",
    "申": "金", "酉": "金", "戌": "土", "亥": "水"
}

# 地支相冲
DIZHI_CHONG = {
    "子": "午", "丑": "未", "寅": "申", "卯": "酉",
    "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
    "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
}

# 地支相合 (六合)
DIZHI_HE = {
    "子": "丑", "丑": "子", "寅": "亥", "卯": "戌",
    "辰": "酉", "巳": "申", "午": "未", "未": "午",
    "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
}

# 生肖对应
SHENGXIAO = {
    "子": "鼠", "丑": "牛", "寅": "虎", "卯": "兔",
    "辰": "龙", "巳": "蛇", "午": "马", "未": "羊",
    "申": "猴", "酉": "鸡", "戌": "狗", "亥": "猪"
}

# 八卦 (先天八卦数)
BAGUA = {
    "乾": {"num": 1, "wuxing": "金", "direction": "西北"},
    "兑": {"num": 2, "wuxing": "金", "direction": "西"},
    "离": {"num": 3, "wuxing": "火", "direction": "南"},
    "震": {"num": 4, "wuxing": "木", "direction": "东"},
    "巽": {"num": 5, "wuxing": "木", "direction": "东南"},
    "坎": {"num": 6, "wuxing": "水", "direction": "北"},
    "艮": {"num": 7, "wuxing": "土", "direction": "东北"},
    "坤": {"num": 8, "wuxing": "土", "direction": "西南"},
}

# 省市方位五行映射
LOCATION_WUXING = {
    # 东方 (木)
    "上海": "木", "江苏": "木", "浙江": "木", "安徽": "木", "山东": "木", "福建": "木",
    # 南方 (火)
    "广东": "火", "广西": "火", "海南": "火", "湖南": "火", "江西": "火", "云南": "火",
    # 西方 (金)
    "四川": "金", "重庆": "金", "贵州": "金", "西藏": "金", "陕西": "金", "甘肃": "金", "青海": "金", "新疆": "金", "宁夏": "金",
    # 北方 (水)
    "北京": "水", "天津": "水", "河北": "水", "山西": "水", "内蒙古": "水", "辽宁": "水", "吉林": "水", "黑龙江": "水",
    # 中央 (土)
    "河南": "土", "湖北": "土",
}

# 时辰对应 (按小时划分)
SHICHEN_MAP = [
    (23, 1, "子"), (1, 3, "丑"), (3, 5, "寅"), (5, 7, "卯"),
    (7, 9, "辰"), (9, 11, "巳"), (11, 13, "午"), (13, 15, "未"),
    (15, 17, "申"), (17, 19, "酉"), (19, 21, "戌"), (21, 23, "亥")
]

# ==================== 六合彩专用常量 ==================== #

# 十二生肖列表 (按顺序)
HK6_ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]

# 地支对应生肖索引
DIZHI_ZODIAC_IDX = {
    "子": 0, "丑": 1, "寅": 2, "卯": 3, "辰": 4, "巳": 5,
    "午": 6, "未": 7, "申": 8, "酉": 9, "戌": 10, "亥": 11
}

# 六合关系 (地支六合)
LIUHE = {
    "子": "丑", "丑": "子",  # 子丑合土
    "寅": "亥", "亥": "寅",  # 寅亥合木
    "卯": "戌", "戌": "卯",  # 卯戌合火
    "辰": "酉", "酉": "辰",  # 辰酉合金
    "巳": "申", "申": "巳",  # 巳申合水
    "午": "未", "未": "午",  # 午未合土
}

# 三合关系 (地支三合局)
SANHE = {
    "申": ["子", "辰"],  # 申子辰合水
    "子": ["申", "辰"],
    "辰": ["申", "子"],
    "寅": ["午", "戌"],  # 寅午戌合火
    "午": ["寅", "戌"],
    "戌": ["寅", "午"],
    "巳": ["酉", "丑"],  # 巳酉丑合金
    "酉": ["巳", "丑"],
    "丑": ["巳", "酉"],
    "亥": ["卯", "未"],  # 亥卯未合木
    "卯": ["亥", "未"],
    "未": ["亥", "卯"],
}

# 波色映射 (固定)
HK6_WAVE_RED = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46]
HK6_WAVE_BLUE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48]
HK6_WAVE_GREEN = [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49]

# 波色与五行对应
WAVE_WUXING = {
    "红波": "火",
    "蓝波": "水", 
    "绿波": "木",
}

# 农历新年日期表
HK6_LUNAR_NEW_YEAR = {
    2024: (2, 10), 2025: (1, 29), 2026: (2, 17), 2027: (2, 6),
    2028: (1, 26), 2029: (2, 13), 2030: (2, 3),
}

# 年份对应生肖索引 (该年农历新年后)
HK6_YEAR_ZODIAC = {
    2024: 4,  # 龙
    2025: 5,  # 蛇
    2026: 6,  # 马
    2027: 7,  # 羊
    2028: 8,  # 猴
    2029: 9,  # 鸡
    2030: 10, # 狗
}


def get_hk6_lunar_year(date: datetime) -> int:
    """获取日期对应的农历年份"""
    year = date.year
    cny = HK6_LUNAR_NEW_YEAR.get(year)
    if cny:
        cny_month, cny_day = cny
        if date.month < cny_month or (date.month == cny_month and date.day < cny_day):
            return year - 1
    return year


def get_hk6_year_zodiac_idx(lunar_year: int) -> int:
    """获取农历年对应的生肖索引"""
    if lunar_year in HK6_YEAR_ZODIAC:
        return HK6_YEAR_ZODIAC[lunar_year]
    # 计算
    base_year = 2024
    base_zodiac = 4  # 龙
    return (base_zodiac + (lunar_year - base_year)) % 12


def zodiac_to_numbers(zodiac_idx: int, lunar_year: int) -> List[int]:
    """将生肖转换为当年对应的号码列表"""
    year_zodiac_idx = get_hk6_year_zodiac_idx(lunar_year)
    numbers = []
    for num in range(1, 50):
        num_offset = (num - 1) % 12
        num_zodiac_idx = (year_zodiac_idx - num_offset + 12) % 12
        if num_zodiac_idx == zodiac_idx:
            numbers.append(num)
    return numbers


def get_wave_color(num: int) -> str:
    """获取号码的波色"""
    if num in HK6_WAVE_RED:
        return "红波"
    elif num in HK6_WAVE_BLUE:
        return "蓝波"
    else:
        return "绿波"



def get_shichen(hour: int) -> str:
    """根据小时获取时辰"""
    for start, end, zhi in SHICHEN_MAP:
        if start <= hour < end or (start > end and (hour >= start or hour < end)):
            return zhi
    return "亥"


def calculate_ganzhi_day(date: datetime) -> Tuple[str, str]:
    """简化版日干支计算 (基于1900年1月31日=甲辰日)"""
    base_date = datetime(1900, 1, 31)
    days = (date - base_date).days
    gan_idx = days % 10
    zhi_idx = days % 12
    return TIANGAN[gan_idx], DIZHI[zhi_idx]


def calculate_ganzhi_year(year: int) -> Tuple[str, str]:
    """年干支计算"""
    # 1984年为甲子年
    offset = year - 1984
    gan_idx = offset % 10
    zhi_idx = offset % 12
    return TIANGAN[gan_idx], DIZHI[zhi_idx]


def calculate_ganzhi_hour(day_gan: str, hour: int) -> Tuple[str, str]:
    """根据日干和时辰计算时干支"""
    shichen = get_shichen(hour)
    zhi_idx = DIZHI.index(shichen)
    day_gan_idx = TIANGAN.index(day_gan)
    base_gan = (day_gan_idx % 5) * 2
    hour_gan_idx = (base_gan + zhi_idx) % 10
    return TIANGAN[hour_gan_idx], shichen


def get_day_master(birth_date: datetime) -> str:
    """获取日主五行"""
    day_gan, _ = calculate_ganzhi_day(birth_date)
    return TIANGAN_WUXING[day_gan]


def get_wealth_element(day_master: str) -> str:
    """获取财星五行 (我克者为财)"""
    return WUXING_KE[day_master]


def calculate_mingua(birth_year: int, gender: str) -> int:
    """
    计算命卦 (八宅法)
    男命: (100 - 后两位) % 9, 余0取9, 余5取坤2
    女命: (后两位 - 4) % 9, 余0取9, 余5取艮8
    """
    last_two = birth_year % 100
    if gender == "male":
        result = (100 - last_two) % 9
        if result == 0:
            result = 9
        elif result == 5:
            result = 2  # 坤
    else:
        result = (last_two - 4) % 9
        if result == 0:
            result = 9
        elif result == 5:
            result = 8  # 艮
    return result


def expand_numbers_by_tail(tails: List[int], max_num: int) -> List[int]:
    """根据尾数扩展到完整号码范围"""
    result = []
    for tail in tails:
        for base in range(0, max_num + 1, 10):
            num = base + tail
            if 1 <= num <= max_num:
                result.append(num)
    return sorted(result)


def analyze_wuxing_strength(day_gan: str, day_zhi: str, hour_gan: str, hour_zhi: str) -> Dict[str, int]:
    """分析五行强弱"""
    scores = {"金": 0, "木": 0, "水": 0, "火": 0, "土": 0}
    scores[TIANGAN_WUXING[day_gan]] += 30
    scores[DIZHI_WUXING[day_zhi]] += 20
    scores[TIANGAN_WUXING[hour_gan]] += 15
    scores[DIZHI_WUXING[hour_zhi]] += 15
    for wx in scores:
        sheng = WUXING_SHENG[wx]
        if scores[sheng] > 0:
            scores[wx] += 5
    return scores


# ==================== 预测方法类 ==================== #

class MetaphysicalService:
    """玄学预测服务 - 多方法支持"""
    
    DRAW_TIMES = {
        "ssq": {"weekdays": [1, 3, 6], "hour": 21, "minute": 15},
        "dlt": {"weekdays": [0, 2, 5], "hour": 21, "minute": 25}
    }
    
    def get_next_draw_time(self, lottery_type: str = "ssq") -> datetime:
        """获取下一期开奖时间"""
        config = self.DRAW_TIMES[lottery_type]
        now = datetime.now()
        for i in range(14):
            check_date = now + timedelta(days=i)
            if check_date.weekday() in config["weekdays"]:
                draw_time = check_date.replace(
                    hour=config["hour"], minute=config["minute"], second=0, microsecond=0
                )
                if draw_time > now:
                    return draw_time
        return now
    
    # ==================== 方法1: 八字五行法 ==================== #
    def method_bazi_wuxing(self, draw_time: datetime, red_max: int = 33, blue_max: int = 16) -> Dict:
        """方法1: 八字五行法 - 基于开奖时间的五行分析"""
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        hour_gan, hour_zhi = calculate_ganzhi_hour(day_gan, draw_time.hour)
        
        wuxing_scores = analyze_wuxing_strength(day_gan, day_zhi, hour_gan, hour_zhi)
        sorted_wx = sorted(wuxing_scores.items(), key=lambda x: -x[1])
        wang = sorted_wx[0][0]
        xiang = sorted_wx[1][0]
        shuai = sorted_wx[-1][0]
        
        hot_reds = expand_numbers_by_tail(HETU_WUXING[wang], red_max)
        warm_reds = expand_numbers_by_tail(HETU_WUXING[xiang], red_max)
        cold_reds = expand_numbers_by_tail(HETU_WUXING[shuai], red_max)
        hot_blues = expand_numbers_by_tail(HETU_WUXING[TIANGAN_WUXING[hour_gan]], blue_max)
        
        return {
            "method": "bazi_wuxing",
            "name": "八字五行法",
            "description": "基于开奖时间八字推算五行旺衰",
            "bazi": {
                "day": f"{day_gan}{day_zhi}",
                "hour": f"{hour_gan}{hour_zhi}",
                "day_wuxing": TIANGAN_WUXING[day_gan],
                "hour_wuxing": TIANGAN_WUXING[hour_gan]
            },
            "wuxing_scores": wuxing_scores,
            "analysis": {"wang": wang, "xiang": xiang, "shuai": shuai},
            "hot_numbers": hot_reds,
            "warm_numbers": warm_reds,
            "cold_numbers": cold_reds,
            "blue_numbers": hot_blues
        }
    
    # ==================== 方法2: 本命财星法 ==================== #
    def method_wealth_element(self, birth_date: datetime, red_max: int = 33, blue_max: int = 16) -> Dict:
        """方法2: 本命财星法 - 基于个人八字的财星五行加权"""
        day_master = get_day_master(birth_date)
        wealth_element = get_wealth_element(day_master)
        
        # 财星数字优先
        wealth_numbers = expand_numbers_by_tail(HETU_WUXING[wealth_element], red_max)
        # 生财的数字次优 (生我者为印)
        sheng_wealth = [k for k, v in WUXING_SHENG.items() if v == wealth_element][0]
        support_numbers = expand_numbers_by_tail(HETU_WUXING[sheng_wealth], red_max)
        
        return {
            "method": "wealth_element",
            "name": "本命财星法",
            "description": f"基于日主{day_master},财星为{wealth_element}",
            "day_master": day_master,
            "wealth_element": wealth_element,
            "wealth_numbers": wealth_numbers,
            "support_numbers": support_numbers,
            "explanation": f"日主{day_master}克{wealth_element},故{wealth_element}为财"
        }
    
    # ==================== 方法3: 刑冲合害校验 ==================== #
    def method_conflict_check(self, draw_time: datetime, birth_date: datetime) -> Dict:
        """方法3: 刑冲合害校验 - 检测日期与个人的冲突关系"""
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        _, birth_zhi = calculate_ganzhi_year(birth_date.year)
        
        # 检查相冲
        is_chong = DIZHI_CHONG.get(day_zhi) == birth_zhi
        # 检查相合
        is_he = DIZHI_HE.get(day_zhi) == birth_zhi
        
        # 运势判定
        if is_chong:
            fortune = "凶"
            advice = f"今日{day_zhi}冲{birth_zhi}({SHENGXIAO[birth_zhi]}),财运受阻,建议守财"
            luck_score = 30
        elif is_he:
            fortune = "吉"
            advice = f"今日{day_zhi}合{birth_zhi}({SHENGXIAO[birth_zhi]}),贵人相助,可适度投注"
            luck_score = 90
        else:
            fortune = "平"
            advice = "今日运势平稳,正常投注即可"
            luck_score = 60
        
        return {
            "method": "conflict_check",
            "name": "刑冲合害校验",
            "description": "检测开奖日与生肖的冲合关系",
            "draw_day": f"{day_gan}{day_zhi}",
            "birth_animal": SHENGXIAO[birth_zhi],
            "birth_zhi": birth_zhi,
            "is_chong": is_chong,
            "is_he": is_he,
            "fortune": fortune,
            "luck_score": luck_score,
            "advice": advice
        }
    
    # ==================== 方法4: 命卦空间法 ==================== #
    def method_mingua_direction(self, birth_year: int, gender: str, location: str = None) -> Dict:
        """方法4: 命卦空间法 - 基于八宅法的方位吉凶"""
        mingua = calculate_mingua(birth_year, gender)
        
        # 命卦对应八卦
        gua_names = ["", "坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"]
        gua_name = gua_names[mingua] if mingua <= 9 else "坤"
        
        # 东四命: 坎1,震3,巽4,离9; 西四命: 坤2,乾6,兑7,艮8
        is_east = mingua in [1, 3, 4, 9]
        lucky_directions = ["东", "南", "东南", "北"] if is_east else ["西", "西北", "西南", "东北"]
        
        # 地利五行
        location_wx = LOCATION_WUXING.get(location, "土") if location else None
        location_match = None
        if location:
            # 检查地点五行是否与命卦相生
            gua_wx = BAGUA.get(gua_name, {}).get("wuxing", "土")
            if WUXING_SHENG.get(location_wx) == gua_wx:
                location_match = "相生,有利"
            elif WUXING_KE.get(location_wx) == gua_wx:
                location_match = "相克,不利"
            else:
                location_match = "平和"
        
        return {
            "method": "mingua_direction",
            "name": "命卦空间法",
            "description": f"命卦{gua_name},{'东四命' if is_east else '西四命'}",
            "mingua": mingua,
            "gua_name": gua_name,
            "is_east_life": is_east,
            "lucky_directions": lucky_directions,
            "location": location,
            "location_wuxing": location_wx,
            "location_match": location_match
        }
    
    # ==================== 方法5: 梅花易数法 ==================== #
    def method_meihua(self, seed: int = None) -> Dict:
        """方法5: 梅花易数 - 基于时间戳起卦"""
        if seed is None:
            seed = int(datetime.now().timestamp() * 1000)
        
        gua_list = list(BAGUA.keys())
        upper = gua_list[(seed // 8) % 8]
        lower = gua_list[(seed // 80) % 8]
        yao = (seed // 6) % 6 + 1
        
        upper_info = BAGUA[upper]
        lower_info = BAGUA[lower]
        
        # 体用生克
        ti_wx = lower_info["wuxing"]  # 下卦为体
        yong_wx = upper_info["wuxing"]  # 上卦为用
        
        if WUXING_SHENG.get(yong_wx) == ti_wx:
            relation = "用生体,吉"
        elif WUXING_KE.get(yong_wx) == ti_wx:
            relation = "用克体,凶"
        elif WUXING_SHENG.get(ti_wx) == yong_wx:
            relation = "体生用,泄气"
        else:
            relation = "比和,平"
        
        # 推荐数字 (卦象相关)
        hot_tails = list(set(HETU_WUXING[ti_wx] + HETU_WUXING[yong_wx]))
        hot_numbers = expand_numbers_by_tail(hot_tails, 33)
        
        return {
            "method": "meihua",
            "name": "梅花易数法",
            "description": f"得{upper}{lower}卦,动爻{yao}",
            "hexagram": f"{upper}{lower}",
            "upper": {"name": upper, **upper_info},
            "lower": {"name": lower, **lower_info},
            "yao": yao,
            "ti_yong_relation": relation,
            "hot_numbers": hot_numbers
        }
    
    # ==================== 方法6: 六十甲子周期法 ==================== #
    def method_jiazi_cycle(self, draw_time: datetime) -> Dict:
        """方法6: 六十甲子周期法 - 寻找相同干支日的历史规律"""
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        ganzhi = f"{day_gan}{day_zhi}"
        
        # 六十甲子周期 = 60天
        # 找出同干支日的尾数特征
        gan_wx = TIANGAN_WUXING[day_gan]
        zhi_wx = DIZHI_WUXING[day_zhi]
        
        # 干支五行合并
        cycle_tails = list(set(HETU_WUXING[gan_wx] + HETU_WUXING[zhi_wx]))
        cycle_numbers = expand_numbers_by_tail(cycle_tails, 33)
        
        return {
            "method": "jiazi_cycle",
            "name": "六十甲子周期法",
            "description": f"开奖日干支{ganzhi},周期共振分析",
            "ganzhi": ganzhi,
            "gan_wuxing": gan_wx,
            "zhi_wuxing": zhi_wx,
            "cycle_numbers": cycle_numbers,
            "note": "历史上同干支日出现的号码具有参考价值"
        }
    
    # ==================== 综合预测 ==================== #
    def predict(
        self,
        lottery_type: str = "ssq",
        methods: List[str] = None,
        num_sets: int = 5,
        # 天时
        draw_time: datetime = None,
        # 地利
        location: str = None,
        # 人和
        birth_date: datetime = None,
        birth_hour: int = None,
        gender: str = "male",
        # 梅花种子
        meihua_seed: int = None
    ) -> Dict:
        """
        综合预测入口
        methods: 选择的方法列表,如 ["bazi_wuxing", "wealth_element"]
        """
        if draw_time is None:
            draw_time = self.get_next_draw_time(lottery_type)
        
        red_max = 33 if lottery_type == "ssq" else 35
        blue_max = 16 if lottery_type == "ssq" else 12
        
        # 默认启用所有可用方法
        if methods is None:
            methods = ["bazi_wuxing"]
            if birth_date:
                methods.extend(["wealth_element", "conflict_check"])
            if birth_date and gender:
                methods.append("mingua_direction")
            methods.extend(["meihua", "jiazi_cycle"])
        
        results = {
            "lottery_type": lottery_type,
            "draw_time": draw_time.strftime("%Y-%m-%d %H:%M"),
            "methods": {},
            "combined_hot": [],
            "combined_warm": [],
            "recommended_sets": []
        }
        
        # 执行各方法
        hot_pool = set()
        warm_pool = set()
        
        if "bazi_wuxing" in methods:
            r = self.method_bazi_wuxing(draw_time, red_max, blue_max)
            results["methods"]["bazi_wuxing"] = r
            hot_pool.update(r["hot_numbers"])
            warm_pool.update(r["warm_numbers"])
        
        if "wealth_element" in methods and birth_date:
            r = self.method_wealth_element(birth_date, red_max, blue_max)
            results["methods"]["wealth_element"] = r
            hot_pool.update(r["wealth_numbers"])
            warm_pool.update(r["support_numbers"])
        
        if "conflict_check" in methods and birth_date:
            r = self.method_conflict_check(draw_time, birth_date)
            results["methods"]["conflict_check"] = r
            results["fortune"] = r["fortune"]
            results["advice"] = r["advice"]
        
        if "mingua_direction" in methods and birth_date:
            birth_year = birth_date.year
            r = self.method_mingua_direction(birth_year, gender, location)
            results["methods"]["mingua_direction"] = r
        
        if "meihua" in methods:
            r = self.method_meihua(meihua_seed)
            results["methods"]["meihua"] = r
            warm_pool.update(r["hot_numbers"])
        
        if "jiazi_cycle" in methods:
            r = self.method_jiazi_cycle(draw_time)
            results["methods"]["jiazi_cycle"] = r
            warm_pool.update(r["cycle_numbers"])
        
        # 汇总号码池
        results["combined_hot"] = sorted(list(hot_pool))
        results["combined_warm"] = sorted(list(warm_pool - hot_pool))
        
        # 生成推荐号码
        results["recommended_sets"] = self._generate_sets(
            list(hot_pool), list(warm_pool), num_sets,
            lottery_type, red_max, blue_max
        )
        
        return results
    
    def _generate_sets(
        self,
        hot: List[int],
        warm: List[int],
        num_sets: int,
        lottery_type: str,
        red_max: int,
        blue_max: int
    ) -> List[Dict]:
        """生成推荐号码组"""
        red_count = 6 if lottery_type == "ssq" else 5
        blue_count = 1 if lottery_type == "ssq" else 2
        
        sets = []
        used = set()
        
        for _ in range(num_sets * 3):
            if len(sets) >= num_sets:
                break
            
            selected = []
            # 热门选3-4个
            hot_pick = min(random.choice([3, 4]), len(hot))
            if hot_pick > 0:
                selected.extend(random.sample(hot, hot_pick))
            
            # 温和补充
            remaining = red_count - len(selected)
            warm_avail = [n for n in warm if n not in selected]
            if warm_avail and remaining > 0:
                add = min(remaining, 2, len(warm_avail))
                selected.extend(random.sample(warm_avail, add))
            
            # 补足
            remaining = red_count - len(selected)
            if remaining > 0:
                all_avail = [n for n in range(1, red_max + 1) if n not in selected]
                selected.extend(random.sample(all_avail, remaining))
            
            selected = sorted(selected[:red_count])
            
            # 蓝球
            if lottery_type == "ssq":
                blue = random.randint(1, blue_max)
                combo = tuple(selected + [blue])
            else:
                back = sorted(random.sample(range(1, blue_max + 1), blue_count))
                combo = tuple(selected + back)
            
            if combo not in used:
                used.add(combo)
                if lottery_type == "ssq":
                    sets.append({"red": selected, "blue": combo[-1]})
                else:
                    sets.append({"front": selected, "back": list(combo[-2:])})
        
        return sets[:num_sets]
    
    # 兼容旧API
    def predict_ssq(self, draw_time: datetime = None, num_sets: int = 5) -> Dict:
        return self.predict("ssq", draw_time=draw_time, num_sets=num_sets)
    
    def predict_dlt(self, draw_time: datetime = None, num_sets: int = 5) -> Dict:
        return self.predict("dlt", draw_time=draw_time, num_sets=num_sets)
    
    # ==================== 六合彩专用方法 ==================== #
    
    def method_zodiac_prediction(self, draw_time: datetime) -> Dict:
        """六合彩生肖预测法 - 基于开奖日地支推算吉利生肖"""
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        lunar_year = get_hk6_lunar_year(draw_time)
        year_zodiac_idx = get_hk6_year_zodiac_idx(lunar_year)
        
        # 当日地支对应的生肖索引 (太岁)
        taisui_idx = DIZHI_ZODIAC_IDX[day_zhi]
        taisui_zodiac = HK6_ZODIACS[taisui_idx]
        
        # 六合贵人
        liuhe_zhi = LIUHE.get(day_zhi, day_zhi)
        liuhe_idx = DIZHI_ZODIAC_IDX[liuhe_zhi]
        liuhe_zodiac = HK6_ZODIACS[liuhe_idx]
        
        # 三合贵人
        sanhe_zhis = SANHE.get(day_zhi, [])
        sanhe_zodiacs = [HK6_ZODIACS[DIZHI_ZODIAC_IDX[z]] for z in sanhe_zhis]
        
        # 相冲生肖 (回避)
        chong_zhi = DIZHI_CHONG.get(day_zhi, "")
        chong_idx = DIZHI_ZODIAC_IDX.get(chong_zhi, -1)
        chong_zodiac = HK6_ZODIACS[chong_idx] if chong_idx >= 0 else ""
        
        # 转换为号码
        hot_numbers = []  # 六合号码 (最吉)
        hot_numbers.extend(zodiac_to_numbers(liuhe_idx, lunar_year))
        
        warm_numbers = []  # 三合号码
        for z in sanhe_zhis:
            idx = DIZHI_ZODIAC_IDX[z]
            warm_numbers.extend(zodiac_to_numbers(idx, lunar_year))
        
        cold_numbers = []  # 相冲号码 (回避)
        if chong_idx >= 0:
            cold_numbers = zodiac_to_numbers(chong_idx, lunar_year)
        
        return {
            "method": "zodiac_prediction",
            "name": "生肖预测法",
            "description": f"开奖日{day_gan}{day_zhi},太岁{taisui_zodiac}",
            "draw_ganzhi": f"{day_gan}{day_zhi}",
            "lunar_year": lunar_year,
            "year_zodiac": HK6_ZODIACS[year_zodiac_idx],
            "taisui_zodiac": taisui_zodiac,
            "liuhe_zodiac": liuhe_zodiac,
            "sanhe_zodiacs": sanhe_zodiacs,
            "chong_zodiac": chong_zodiac,
            "hot_numbers": sorted(list(set(hot_numbers))),
            "warm_numbers": sorted(list(set(warm_numbers))),
            "cold_numbers": cold_numbers,
            "explanation": f"六合{liuhe_zodiac}大吉,三合{'/'.join(sanhe_zodiacs)}次吉" + (f",{chong_zodiac}相冲宜避" if chong_zodiac else "")
        }
    
    def method_wave_wuxing(self, draw_time: datetime) -> Dict:
        """六合彩波色五行法 - 基于五行旺衰推荐波色"""
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        hour_gan, hour_zhi = calculate_ganzhi_hour(day_gan, draw_time.hour)
        
        wuxing_scores = analyze_wuxing_strength(day_gan, day_zhi, hour_gan, hour_zhi)
        sorted_wx = sorted(wuxing_scores.items(), key=lambda x: -x[1])
        
        # 波色推荐
        wave_scores = {
            "红波": wuxing_scores["火"] + wuxing_scores["土"] * 0.5,  # 火旺利红
            "蓝波": wuxing_scores["水"] + wuxing_scores["金"] * 0.5,  # 水旺利蓝
            "绿波": wuxing_scores["木"] + wuxing_scores["水"] * 0.5,  # 木旺利绿
        }
        sorted_waves = sorted(wave_scores.items(), key=lambda x: -x[1])
        
        hot_wave = sorted_waves[0][0]
        warm_wave = sorted_waves[1][0]
        cold_wave = sorted_waves[2][0]
        
        # 获取各波色号码
        wave_numbers = {
            "红波": HK6_WAVE_RED.copy(),
            "蓝波": HK6_WAVE_BLUE.copy(),
            "绿波": HK6_WAVE_GREEN.copy(),
        }
        
        return {
            "method": "wave_wuxing",
            "name": "波色五行法",
            "description": f"五行旺衰分析 - {hot_wave}最旺",
            "bazi": f"{day_gan}{day_zhi}日{hour_gan}{hour_zhi}时",
            "wuxing_scores": wuxing_scores,
            "wave_scores": wave_scores,
            "hot_wave": hot_wave,
            "warm_wave": warm_wave,
            "cold_wave": cold_wave,
            "hot_numbers": wave_numbers[hot_wave],
            "warm_numbers": wave_numbers[warm_wave],
            "cold_numbers": wave_numbers[cold_wave],
            "explanation": f"今日{sorted_wx[0][0]}旺{sorted_wx[-1][0]}衰,{hot_wave}为首选"
        }
    
    def predict_hk6(
        self,
        draw_time: datetime = None,
        num_sets: int = 5,
        methods: List[str] = None,
        birth_date: datetime = None,
        meihua_seed: int = None
    ) -> Dict:
        """六合彩综合预测"""
        if draw_time is None:
            # 六合彩开奖时间：周二、四、六、日 21:30
            now = datetime.now()
            hk6_weekdays = [1, 3, 5, 6]  # 周二、四、六、日
            for i in range(14):
                check_date = now + timedelta(days=i)
                if check_date.weekday() in hk6_weekdays:
                    draw_time = check_date.replace(hour=21, minute=30, second=0, microsecond=0)
                    if draw_time > now:
                        break
        
        lunar_year = get_hk6_lunar_year(draw_time)
        
        if methods is None:
            methods = ["zodiac_prediction", "wave_wuxing", "bazi_wuxing", "meihua", "jiazi_cycle"]
        
        results = {
            "lottery_type": "hk6",
            "draw_time": draw_time.strftime("%Y-%m-%d %H:%M"),
            "lunar_year": lunar_year,
            "year_zodiac": HK6_ZODIACS[get_hk6_year_zodiac_idx(lunar_year)],
            "methods": {},
            "combined_hot": [],
            "combined_warm": [],
            "recommended_zodiacs": [],
            "recommended_waves": [],
            "recommended_sets": []
        }
        
        hot_pool = set()
        warm_pool = set()
        
        # 生肖预测
        if "zodiac_prediction" in methods:
            r = self.method_zodiac_prediction(draw_time)
            results["methods"]["zodiac_prediction"] = r
            hot_pool.update(r["hot_numbers"])
            warm_pool.update(r["warm_numbers"])
            results["recommended_zodiacs"] = [r["liuhe_zodiac"]] + r["sanhe_zodiacs"]
        
        # 波色五行
        if "wave_wuxing" in methods:
            r = self.method_wave_wuxing(draw_time)
            results["methods"]["wave_wuxing"] = r
            hot_pool.update(r["hot_numbers"][:8])  # 取部分热门波色号
            warm_pool.update(r["warm_numbers"][:8])
            results["recommended_waves"] = [r["hot_wave"], r["warm_wave"]]
        
        # 八字五行 (扩展到49)
        if "bazi_wuxing" in methods:
            r = self.method_bazi_wuxing(draw_time, red_max=49, blue_max=49)
            results["methods"]["bazi_wuxing"] = r
            hot_pool.update(r["hot_numbers"])
            warm_pool.update(r["warm_numbers"])
        
        # 梅花易数
        if "meihua" in methods:
            r = self.method_meihua(meihua_seed)
            # 扩展到49号
            hot_tails = list(set(HETU_WUXING[r["lower"]["wuxing"]] + HETU_WUXING[r["upper"]["wuxing"]]))
            meihua_nums = expand_numbers_by_tail(hot_tails, 49)
            r["hot_numbers"] = meihua_nums
            results["methods"]["meihua"] = r
            warm_pool.update(meihua_nums)
        
        # 六十甲子
        if "jiazi_cycle" in methods:
            day_gan, day_zhi = calculate_ganzhi_day(draw_time)
            gan_wx = TIANGAN_WUXING[day_gan]
            zhi_wx = DIZHI_WUXING[day_zhi]
            cycle_tails = list(set(HETU_WUXING[gan_wx] + HETU_WUXING[zhi_wx]))
            cycle_numbers = expand_numbers_by_tail(cycle_tails, 49)
            results["methods"]["jiazi_cycle"] = {
                "method": "jiazi_cycle",
                "name": "六十甲子周期法",
                "ganzhi": f"{day_gan}{day_zhi}",
                "cycle_numbers": cycle_numbers
            }
            warm_pool.update(cycle_numbers)
        
        # 汇总
        results["combined_hot"] = sorted(list(hot_pool))
        results["combined_warm"] = sorted(list(warm_pool - hot_pool))
        
        # 生成推荐号码组
        results["recommended_sets"] = self._generate_hk6_sets(
            list(hot_pool), list(warm_pool), num_sets, lunar_year
        )
        
        return results
    
    def _generate_hk6_sets(
        self,
        hot: List[int],
        warm: List[int],
        num_sets: int,
        lunar_year: int
    ) -> List[Dict]:
        """生成六合彩推荐号码组"""
        sets = []
        used = set()
        
        for _ in range(num_sets * 3):
            if len(sets) >= num_sets:
                break
            
            selected = []
            
            # 热门选3-4个
            hot_avail = [n for n in hot if 1 <= n <= 49]
            hot_pick = min(random.choice([3, 4]), len(hot_avail))
            if hot_pick > 0:
                selected.extend(random.sample(hot_avail, hot_pick))
            
            # 温和补充到5个
            remaining = 6 - len(selected)
            warm_avail = [n for n in warm if n not in selected and 1 <= n <= 49]
            if warm_avail and remaining > 0:
                add = min(remaining, 2, len(warm_avail))
                selected.extend(random.sample(warm_avail, add))
            
            # 补足到6个
            remaining = 6 - len(selected)
            if remaining > 0:
                all_avail = [n for n in range(1, 50) if n not in selected]
                selected.extend(random.sample(all_avail, remaining))
            
            selected = sorted(selected[:6])
            
            # 特码：从热门或温和中选
            special_pool = [n for n in (hot + warm) if n not in selected and 1 <= n <= 49]
            if not special_pool:
                special_pool = [n for n in range(1, 50) if n not in selected]
            special = random.choice(special_pool)
            
            combo = tuple(selected + [special])
            if combo not in used:
                used.add(combo)
                
                # 计算生肖和波色
                year_zodiac_idx = get_hk6_year_zodiac_idx(lunar_year)
                special_offset = (special - 1) % 12
                special_zodiac_idx = (year_zodiac_idx - special_offset + 12) % 12
                
                sets.append({
                    "numbers": selected,
                    "special": special,
                    "special_zodiac": HK6_ZODIACS[special_zodiac_idx],
                    "special_wave": get_wave_color(special)
                })
        
        return sets[:num_sets]
