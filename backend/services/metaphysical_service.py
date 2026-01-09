"""
玄学预测服务 - 基于河图洛书、八字五行的彩票号码推算
SSQ开奖: 周二/四/日 21:15 (东八区)
DLT开奖: 周一/三/六 21:25 (东八区)
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Set
import random

logger = logging.getLogger(__name__)

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
# 五行相克: 木克土, 土克水, 水克火, 火克金, 金克木
WUXING_KE = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}

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

# 地支数字 (用于六爻纳支)
DIZHI_NUM = {
    "子": 1, "丑": 2, "寅": 3, "卯": 4, "辰": 5, "巳": 6,
    "午": 7, "未": 8, "申": 9, "酉": 10, "戌": 11, "亥": 12
}

# 八卦
BAGUA = {
    "乾": {"num": 1, "wuxing": "金", "nature": "天"},
    "兑": {"num": 2, "wuxing": "金", "nature": "泽"},
    "离": {"num": 3, "wuxing": "火", "nature": "火"},
    "震": {"num": 4, "wuxing": "木", "nature": "雷"},
    "巽": {"num": 5, "wuxing": "木", "nature": "风"},
    "坎": {"num": 6, "wuxing": "水", "nature": "水"},
    "艮": {"num": 7, "wuxing": "土", "nature": "山"},
    "坤": {"num": 8, "wuxing": "土", "nature": "地"},
}

# 时辰对应 (按小时划分)
SHICHEN_MAP = [
    (23, 1, "子"), (1, 3, "丑"), (3, 5, "寅"), (5, 7, "卯"),
    (7, 9, "辰"), (9, 11, "巳"), (11, 13, "午"), (13, 15, "未"),
    (15, 17, "申"), (17, 19, "酉"), (19, 21, "戌"), (21, 23, "亥")
]


def get_shichen(hour: int) -> str:
    """根据小时获取时辰"""
    for start, end, zhi in SHICHEN_MAP:
        if start <= hour < end or (start > end and (hour >= start or hour < end)):
            return zhi
    return "亥"  # 21:15/21:25 都在亥时


def calculate_ganzhi_day(date: datetime) -> Tuple[str, str]:
    """
    简化版日干支计算 (基于已知基准日推算)
    基准: 1900年1月31日 = 甲辰日
    """
    base_date = datetime(1900, 1, 31)
    days = (date - base_date).days
    gan_idx = days % 10
    zhi_idx = days % 12
    return TIANGAN[gan_idx], DIZHI[zhi_idx]


def calculate_ganzhi_hour(day_gan: str, hour: int) -> Tuple[str, str]:
    """
    根据日干和时辰计算时干支
    日上起时: 甲己日起甲子时
    """
    shichen = get_shichen(hour)
    zhi_idx = DIZHI.index(shichen)
    
    # 日上起时规则
    day_gan_idx = TIANGAN.index(day_gan)
    base_gan = (day_gan_idx % 5) * 2  # 甲己/乙庚/丙辛/丁壬/戊癸
    hour_gan_idx = (base_gan + zhi_idx) % 10
    
    return TIANGAN[hour_gan_idx], shichen


def analyze_wuxing_strength(day_gan: str, day_zhi: str, hour_gan: str, hour_zhi: str) -> Dict[str, int]:
    """
    分析五行强弱
    返回各五行的能量分数
    """
    scores = {"金": 0, "木": 0, "水": 0, "火": 0, "土": 0}
    
    # 日干为主 (得分最高)
    scores[TIANGAN_WUXING[day_gan]] += 30
    # 日支
    scores[DIZHI_WUXING[day_zhi]] += 20
    # 时干
    scores[TIANGAN_WUXING[hour_gan]] += 15
    # 时支
    scores[DIZHI_WUXING[hour_zhi]] += 15
    
    # 相生加分
    for wx in scores:
        sheng = WUXING_SHENG[wx]
        if scores[sheng] > 0:
            scores[wx] += 5
    
    return scores


def expand_numbers_by_tail(tails: List[int], max_num: int) -> List[int]:
    """
    根据尾数扩展到完整号码范围
    例: 尾数[2,7], max_num=33 -> [2,7,12,17,22,27,32]
    """
    result = []
    for tail in tails:
        for base in range(0, max_num + 1, 10):
            num = base + tail
            if 1 <= num <= max_num:
                result.append(num)
    return sorted(result)


class MetaphysicalService:
    """玄学预测服务"""
    
    # 开奖时间配置
    DRAW_TIMES = {
        "ssq": {
            "weekdays": [1, 3, 6],  # 周二=1, 周四=3, 周日=6 (0=周一)
            "hour": 21,
            "minute": 15
        },
        "dlt": {
            "weekdays": [0, 2, 5],  # 周一=0, 周三=2, 周六=5
            "hour": 21,
            "minute": 25
        }
    }
    
    def get_next_draw_time(self, lottery_type: str = "ssq") -> datetime:
        """获取下一期开奖时间"""
        config = self.DRAW_TIMES[lottery_type]
        now = datetime.now()
        
        # 找到下一个开奖日
        for i in range(7):
            check_date = now + timedelta(days=i)
            if check_date.weekday() in config["weekdays"]:
                draw_time = check_date.replace(
                    hour=config["hour"],
                    minute=config["minute"],
                    second=0,
                    microsecond=0
                )
                if draw_time > now:
                    return draw_time
        
        # 如果本周没找到，取下周第一个
        for i in range(7, 14):
            check_date = now + timedelta(days=i)
            if check_date.weekday() in config["weekdays"]:
                return check_date.replace(
                    hour=config["hour"],
                    minute=config["minute"],
                    second=0,
                    microsecond=0
                )
        
        return now  # fallback
    
    def predict_ssq(self, draw_time: datetime = None, num_sets: int = 5) -> Dict:
        """
        双色球玄学预测
        红球: 1-33, 选6个
        蓝球: 1-16, 选1个
        """
        if draw_time is None:
            draw_time = self.get_next_draw_time("ssq")
        
        # 计算八字
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        hour_gan, hour_zhi = calculate_ganzhi_hour(day_gan, draw_time.hour)
        
        # 五行分析
        wuxing_scores = analyze_wuxing_strength(day_gan, day_zhi, hour_gan, hour_zhi)
        
        # 排序找出旺衰
        sorted_wx = sorted(wuxing_scores.items(), key=lambda x: -x[1])
        wang_element = sorted_wx[0][0]  # 最旺
        xiang_element = sorted_wx[1][0]  # 次旺
        shuai_element = sorted_wx[-1][0]  # 最衰
        
        # 河图映射 - 获取推荐尾数
        wang_tails = HETU_WUXING[wang_element]
        xiang_tails = HETU_WUXING[xiang_element]
        shuai_tails = HETU_WUXING[shuai_element]
        
        # 扩展到完整号码
        hot_reds = expand_numbers_by_tail(wang_tails, 33)
        warm_reds = expand_numbers_by_tail(xiang_tails, 33)
        cold_reds = expand_numbers_by_tail(shuai_tails, 33)
        
        # 蓝球 - 用时柱五行
        hour_wuxing = TIANGAN_WUXING[hour_gan]
        hot_blues = expand_numbers_by_tail(HETU_WUXING[hour_wuxing], 16)
        
        # 生成推荐号码组
        recommendations = self._generate_balanced_sets(
            hot_reds, warm_reds, cold_reds, hot_blues, 
            num_sets, red_count=6, red_max=33, blue_max=16
        )
        
        return {
            "draw_time": draw_time.strftime("%Y-%m-%d %H:%M"),
            "bazi": {
                "day": f"{day_gan}{day_zhi}",
                "hour": f"{hour_gan}{hour_zhi}",
                "day_wuxing": f"{TIANGAN_WUXING[day_gan]}日 {DIZHI_WUXING[day_zhi]}支",
                "hour_wuxing": f"{TIANGAN_WUXING[hour_gan]}时 {DIZHI_WUXING[hour_zhi]}支"
            },
            "wuxing_analysis": {
                "scores": wuxing_scores,
                "wang": wang_element,
                "xiang": xiang_element,
                "shuai": shuai_element
            },
            "number_pools": {
                "hot": {"element": wang_element, "reds": hot_reds, "description": "旺相之数,出现概率高"},
                "warm": {"element": xiang_element, "reds": warm_reds, "description": "次吉之数"},
                "cold": {"element": shuai_element, "reds": cold_reds, "description": "衰弱之数,建议少选"},
                "blue_hot": {"element": hour_wuxing, "blues": hot_blues, "description": "时柱推荐蓝球"}
            },
            "recommended_sets": recommendations,
            "method_explanation": "基于开奖时间八字五行分析,河图洛书数理映射"
        }
    
    def predict_dlt(self, draw_time: datetime = None, num_sets: int = 5) -> Dict:
        """
        大乐透玄学预测
        前区: 1-35, 选5个
        后区: 1-12, 选2个
        """
        if draw_time is None:
            draw_time = self.get_next_draw_time("dlt")
        
        # 计算八字
        day_gan, day_zhi = calculate_ganzhi_day(draw_time)
        hour_gan, hour_zhi = calculate_ganzhi_hour(day_gan, draw_time.hour)
        
        # 五行分析
        wuxing_scores = analyze_wuxing_strength(day_gan, day_zhi, hour_gan, hour_zhi)
        sorted_wx = sorted(wuxing_scores.items(), key=lambda x: -x[1])
        wang_element = sorted_wx[0][0]
        xiang_element = sorted_wx[1][0]
        shuai_element = sorted_wx[-1][0]
        
        # 河图映射
        hot_fronts = expand_numbers_by_tail(HETU_WUXING[wang_element], 35)
        warm_fronts = expand_numbers_by_tail(HETU_WUXING[xiang_element], 35)
        cold_fronts = expand_numbers_by_tail(HETU_WUXING[shuai_element], 35)
        
        # 后区 - 用时柱和日支
        hour_wuxing = TIANGAN_WUXING[hour_gan]
        hot_backs = expand_numbers_by_tail(HETU_WUXING[hour_wuxing], 12)
        
        # 生成推荐
        recommendations = self._generate_dlt_sets(
            hot_fronts, warm_fronts, cold_fronts, hot_backs, num_sets
        )
        
        return {
            "draw_time": draw_time.strftime("%Y-%m-%d %H:%M"),
            "bazi": {
                "day": f"{day_gan}{day_zhi}",
                "hour": f"{hour_gan}{hour_zhi}",
                "day_wuxing": f"{TIANGAN_WUXING[day_gan]}日 {DIZHI_WUXING[day_zhi]}支",
                "hour_wuxing": f"{TIANGAN_WUXING[hour_gan]}时 {DIZHI_WUXING[hour_zhi]}支"
            },
            "wuxing_analysis": {
                "scores": wuxing_scores,
                "wang": wang_element,
                "xiang": xiang_element,
                "shuai": shuai_element
            },
            "number_pools": {
                "hot": {"element": wang_element, "fronts": hot_fronts, "description": "旺相之数"},
                "warm": {"element": xiang_element, "fronts": warm_fronts, "description": "次吉之数"},
                "cold": {"element": shuai_element, "fronts": cold_fronts, "description": "衰弱之数"},
                "back_hot": {"element": hour_wuxing, "backs": hot_backs, "description": "后区推荐"}
            },
            "recommended_sets": recommendations,
            "method_explanation": "基于开奖时间八字五行分析,河图洛书数理映射"
        }
    
    def _generate_balanced_sets(
        self, hot: List[int], warm: List[int], cold: List[int],
        blues: List[int], num_sets: int, red_count: int, red_max: int, blue_max: int
    ) -> List[Dict]:
        """生成五行平衡的号码组合"""
        sets = []
        used_combos: Set[tuple] = set()
        
        for _ in range(num_sets * 3):  # 多次尝试
            if len(sets) >= num_sets:
                break
            
            # 策略: 从热门选3-4个, 温和选1-2个, 冷门选0-1个
            selected = []
            
            # 热门区选3-4个
            hot_count = random.choice([3, 4])
            if len(hot) >= hot_count:
                selected.extend(random.sample(hot, hot_count))
            else:
                selected.extend(hot)
            
            # 温和区补充
            remaining = red_count - len(selected)
            warm_available = [n for n in warm if n not in selected]
            if warm_available and remaining > 0:
                add_count = min(remaining, random.choice([1, 2]))
                selected.extend(random.sample(warm_available, min(add_count, len(warm_available))))
            
            # 补足到6个
            remaining = red_count - len(selected)
            if remaining > 0:
                all_available = [n for n in range(1, red_max + 1) if n not in selected]
                selected.extend(random.sample(all_available, remaining))
            
            selected = sorted(selected[:red_count])
            
            # 选蓝球
            blue = random.choice(blues) if blues else random.randint(1, blue_max)
            
            combo = tuple(selected + [blue])
            if combo not in used_combos:
                used_combos.add(combo)
                sets.append({
                    "red": selected,
                    "blue": blue,
                    "balance": self._check_wuxing_balance(selected)
                })
        
        return sets[:num_sets]
    
    def _generate_dlt_sets(
        self, hot: List[int], warm: List[int], cold: List[int],
        backs: List[int], num_sets: int
    ) -> List[Dict]:
        """生成大乐透号码组合"""
        sets = []
        used_combos: Set[tuple] = set()
        
        for _ in range(num_sets * 3):
            if len(sets) >= num_sets:
                break
            
            selected = []
            
            # 热门区选2-3个
            hot_count = random.choice([2, 3])
            if len(hot) >= hot_count:
                selected.extend(random.sample(hot, hot_count))
            
            # 温和区补充
            remaining = 5 - len(selected)
            warm_available = [n for n in warm if n not in selected]
            if warm_available and remaining > 0:
                add_count = min(remaining, 2)
                selected.extend(random.sample(warm_available, min(add_count, len(warm_available))))
            
            # 补足到5个
            remaining = 5 - len(selected)
            if remaining > 0:
                all_available = [n for n in range(1, 36) if n not in selected]
                selected.extend(random.sample(all_available, remaining))
            
            selected = sorted(selected[:5])
            
            # 选后区
            if len(backs) >= 2:
                back_nums = sorted(random.sample(backs, 2))
            else:
                back_nums = sorted(random.sample(range(1, 13), 2))
            
            combo = tuple(selected + back_nums)
            if combo not in used_combos:
                used_combos.add(combo)
                sets.append({
                    "front": selected,
                    "back": back_nums,
                    "balance": self._check_wuxing_balance(selected)
                })
        
        return sets[:num_sets]
    
    def _check_wuxing_balance(self, numbers: List[int]) -> str:
        """检查号码组合的五行平衡性"""
        wx_count = {"金": 0, "木": 0, "水": 0, "火": 0, "土": 0}
        
        for num in numbers:
            tail = num % 10
            for wx, tails in HETU_WUXING.items():
                if tail in tails:
                    wx_count[wx] += 1
                    break
        
        # 判断平衡性
        max_count = max(wx_count.values())
        min_count = min(wx_count.values())
        
        if max_count - min_count <= 1:
            return "五行平衡"
        elif max_count >= 4:
            dominant = [k for k, v in wx_count.items() if v == max_count][0]
            return f"{dominant}偏旺"
        else:
            return "略有偏向"
    
    def meihua_predict(self, seed: int = None) -> Dict:
        """
        梅花易数预测 - 基于随机种子起卦
        """
        if seed is None:
            seed = int(datetime.now().timestamp() * 1000)
        
        # 起卦
        upper = list(BAGUA.keys())[(seed // 8) % 8]
        lower = list(BAGUA.keys())[(seed // 80) % 8]
        yao = (seed // 6) % 6 + 1  # 动爻 1-6
        
        upper_info = BAGUA[upper]
        lower_info = BAGUA[lower]
        
        # 从卦象提取数字
        base_num = (upper_info["num"] + lower_info["num"]) % 33 or 33
        
        # 根据上下卦五行获取推荐数字
        upper_tails = HETU_WUXING[upper_info["wuxing"]]
        lower_tails = HETU_WUXING[lower_info["wuxing"]]
        
        hot_numbers = expand_numbers_by_tail(upper_tails + lower_tails, 33)
        
        return {
            "hexagram": f"{upper}{lower}",
            "upper": {"name": upper, **upper_info},
            "lower": {"name": lower, **lower_info},
            "yao": yao,
            "base_number": base_num,
            "hot_numbers": hot_numbers,
            "description": f"上卦{upper}({upper_info['nature']}), 下卦{lower}({lower_info['nature']})"
        }
