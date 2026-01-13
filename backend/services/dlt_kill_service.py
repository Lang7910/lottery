"""
大乐透杀号策略服务 - 前区6种 + 后区3种
"""
import logging
from typing import List, Dict, Set, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.dlt import DLTResult

logger = logging.getLogger(__name__)

# 前区杀号方法名称 (28种)
FRONT_KILL_METHOD_NAMES = {
    # 基础方法 (1-6)
    1: "分区杀号法",
    2: "上期杀号法",
    3: "上期前三码加3法",
    4: "相邻号码相减法",
    5: "上期前三码减1,2,3",
    6: "去年本期杀号法",
    # 首尾和相关 (7-9)
    7: "上期首尾和杀号",
    8: "首尾和除以3杀号",
    9: "首尾和相减杀号",
    # 跨度相关 (10-11)
    10: "前跨杀号",
    11: "前跨后跨组合杀号",
    # 和值相关 (12-14)
    12: "后和杀号",
    13: "后区之和加3杀号",
    14: "后区之积加3杀号",
    # 红球组合 (15-20)
    15: "一位加后区小号杀号",
    16: "一位加后区大号杀号",
    17: "红球一位加二位杀号",
    18: "红球一二位除2杀号",
    19: "五码尾数和杀号",
    20: "五码尾数除2杀号",
    # 龙头凤尾 (21-26)
    21: "龙头加10杀号",
    22: "龙头加12杀号",
    23: "凤尾个十位相加杀号",
    24: "凤尾个十位互减杀号",
    25: "凤尾减上上期龙头杀号",
    26: "凤尾减两期龙头杀号",
    # 其他特殊 (27-28)
    27: "第三位乘7除10杀号",
    28: "黄金分割杀号",
}

# 后区杀号方法名称 (5种)
BACK_KILL_METHOD_NAMES = {
    1: "上期后区杀号",
    2: "和值尾数杀号",
    3: "相邻号码相减",
    4: "后区和加3杀号",
    5: "后区积取整杀号",
}


def get_zone(num: int) -> int:
    """获取号码所属分区 (1-5)"""
    if 1 <= num <= 7:
        return 1
    elif 8 <= num <= 14:
        return 2
    elif 15 <= num <= 21:
        return 3
    elif 22 <= num <= 28:
        return 4
    else:
        return 5


def get_numbers_in_zone(zone: int) -> List[int]:
    """获取某分区的所有号码"""
    zones = {
        1: list(range(1, 8)),
        2: list(range(8, 15)),
        3: list(range(15, 22)),
        4: list(range(22, 29)),
        5: list(range(29, 36)),
    }
    return zones.get(zone, [])


def get_front_kill_numbers(
    front_balls: List[int],
    back_balls: List[int],
    prev_front: Optional[List[int]] = None,
    prev_prev_front: Optional[List[int]] = None,
    last_year_front: Optional[List[int]] = None
) -> Dict[int, List[int]]:
    """
    根据上期数据计算28种前区杀号
    front_balls: 上期前区5个号码（已排序）
    back_balls: 上期后区2个号码
    prev_front: 上上期前区5个号码
    prev_prev_front: 上上上期前区号码
    last_year_front: 去年同期前区号码
    """
    kills = {}
    
    # 龙头(最小) 和 凤尾(最大)
    dragon = front_balls[0]  # 龙头
    phoenix = front_balls[4]  # 凤尾
    back_min = min(back_balls) if back_balls else 0
    back_max = max(back_balls) if back_balls else 0
    
    def valid_kill(n):
        """确保杀号在1-35范围内"""
        if n > 35:
            n = n - 35
        if n < 1:
            n = abs(n) if abs(n) <= 35 else 0
        return n if 1 <= n <= 35 else 0
    
    # === 基础方法 (1-6) ===
    
    # 方法1: 分区杀号法
    zone_counts = {i: 0 for i in range(1, 6)}
    for ball in front_balls:
        zone_counts[get_zone(ball)] += 1
    zero_zones = [z for z, count in zone_counts.items() if count == 0]
    kills[1] = get_numbers_in_zone(zero_zones[0]) if zero_zones else []
    
    # 方法2: 上期杀号法
    kills[2] = list(front_balls)
    
    # 方法3: 上期前三码加3法
    kills[3] = [valid_kill(front_balls[i] + 3) for i in range(3)]
    kills[3] = [k for k in kills[3] if k]
    
    # 方法4: 相邻号码相减法
    kills[4] = list(set(abs(front_balls[i + 1] - front_balls[i]) 
                       for i in range(4) if 1 <= abs(front_balls[i + 1] - front_balls[i]) <= 35))
    
    # 方法5: 上期前三码减1,2,3
    kills[5] = [valid_kill(front_balls[i] - (i + 1)) for i in range(3)]
    kills[5] = [k for k in kills[5] if k]
    
    # 方法6: 去年本期杀号法
    kills[6] = list(last_year_front) if last_year_front else []
    
    # === 首尾和相关 (7-9) ===
    
    # 方法7: 上期首尾和杀号 (大于35则减去35)
    head_tail_sum = dragon + phoenix
    kills[7] = [valid_kill(head_tail_sum)]
    kills[7] = [k for k in kills[7] if k]
    
    # 方法8: 首尾和除以3杀号 (取整)
    kills[8] = [valid_kill(head_tail_sum // 3)]
    kills[8] = [k for k in kills[8] if k]
    
    # 方法9: 首尾和相减杀号 (用上两期首尾和相减)
    if prev_front:
        prev_head_tail_sum = prev_front[0] + prev_front[4]
        diff = abs(head_tail_sum - prev_head_tail_sum)
        kills[9] = [valid_kill(diff)]
        kills[9] = [k for k in kills[9] if k]
    else:
        kills[9] = []
    
    # === 跨度相关 (10-11) ===
    
    # 方法10: 前跨杀号 (前区跨度 = 凤尾 - 龙头)
    front_span = phoenix - dragon
    kills[10] = [valid_kill(front_span)]
    kills[10] = [k for k in kills[10] if k]
    
    # 方法11: 前跨后跨组合杀号 (前跨 × 后跨 / 8 取整)
    back_span = abs(back_max - back_min) if back_balls else 0
    kills[11] = [valid_kill((front_span * back_span) // 8)] if back_span else []
    kills[11] = [k for k in kills[11] if k]
    
    # === 和值相关 (12-14) ===
    
    # 方法12: 后和杀号 (后区和值)
    back_sum = sum(back_balls) if back_balls else 0
    kills[12] = [valid_kill(back_sum)]
    kills[12] = [k for k in kills[12] if k]
    
    # 方法13: 后区之和加3杀号
    kills[13] = [valid_kill(back_sum + 3)]
    kills[13] = [k for k in kills[13] if k]
    
    # 方法14: 后区之积加3杀号 (大于35则依次减12)
    back_product = (back_balls[0] * back_balls[1]) if len(back_balls) >= 2 else 0
    kill14 = back_product + 3
    while kill14 > 35:
        kill14 -= 12
    kills[14] = [kill14] if 1 <= kill14 <= 35 else []
    
    # === 红球组合 (15-20) ===
    
    # 方法15: 一位加后区小号杀号
    kills[15] = [valid_kill(dragon + back_min)]
    kills[15] = [k for k in kills[15] if k]
    
    # 方法16: 一位加后区大号杀号
    kills[16] = [valid_kill(dragon + back_max)]
    kills[16] = [k for k in kills[16] if k]
    
    # 方法17: 红球一位加二位杀号
    kills[17] = [valid_kill(front_balls[0] + front_balls[1])]
    kills[17] = [k for k in kills[17] if k]
    
    # 方法18: 红球一二位除2杀号 (进位取整)
    kills[18] = [valid_kill((front_balls[0] + front_balls[1] + 1) // 2)]
    kills[18] = [k for k in kills[18] if k]
    
    # 方法19: 五码尾数和杀号
    tail_sum = sum(b % 10 for b in front_balls)
    kills[19] = [valid_kill(tail_sum)]
    kills[19] = [k for k in kills[19] if k]
    
    # 方法20: 五码尾数除2杀号 (进位取整)
    kills[20] = [valid_kill((tail_sum + 1) // 2)]
    kills[20] = [k for k in kills[20] if k]
    
    # === 龙头凤尾 (21-26) ===
    
    # 方法21: 龙头加10杀号
    kills[21] = [valid_kill(dragon + 10)]
    kills[21] = [k for k in kills[21] if k]
    
    # 方法22: 龙头加12杀号
    kills[22] = [valid_kill(dragon + 12)]
    kills[22] = [k for k in kills[22] if k]
    
    # 方法23: 凤尾个十位相加杀号
    phoenix_units = phoenix % 10
    phoenix_tens = phoenix // 10
    kills[23] = [valid_kill(phoenix_units + phoenix_tens)]
    kills[23] = [k for k in kills[23] if k]
    
    # 方法24: 凤尾个十位互减杀号
    kills[24] = [valid_kill(abs(phoenix_units - phoenix_tens))]
    kills[24] = [k for k in kills[24] if k]
    
    # 方法25: 凤尾减上上期龙头杀号
    if prev_front:
        kills[25] = [valid_kill(phoenix - prev_front[0])]
        kills[25] = [k for k in kills[25] if k]
    else:
        kills[25] = []
    
    # 方法26: 凤尾减两期龙头杀号 (上期+上上期龙头)
    if prev_front and prev_prev_front:
        kills[26] = [valid_kill(phoenix - prev_front[0] - prev_prev_front[0])]
        kills[26] = [k for k in kills[26] if k]
    else:
        kills[26] = []
    
    # === 其他特殊 (27-28) ===
    
    # 方法27: 第三位乘7除10杀号 (取整)
    kills[27] = [valid_kill((front_balls[2] * 7) // 10)]
    kills[27] = [k for k in kills[27] if k]
    
    # 方法28: 黄金分割杀号 (各号码 × 0.618 取整后作为杀号)
    golden_kills = set()
    for n in front_balls:
        golden = int(n * 0.618)
        if 1 <= golden <= 35:
            golden_kills.add(golden)
    kills[28] = list(golden_kills)
    
    return kills



def get_back_kill_numbers(
    back_balls: List[int],
    prev_back_balls: Optional[List[int]] = None
) -> Dict[int, List[int]]:
    """
    根据上1-2期后区计算5种杀号
    back_balls: 上期后区2个号码
    prev_back_balls: 上上期后区2个号码
    """
    kills = {}
    
    def valid_back_kill(n):
        """确保杀号在1-12范围内"""
        return n if 1 <= n <= 12 else 0
    
    # 方法1: 上期后区杀号
    kills[1] = list(back_balls) if back_balls else []
    
    # 方法2: 和值尾数杀号 - 上两期后区和的尾数
    if back_balls and prev_back_balls:
        total = sum(back_balls) + sum(prev_back_balls)
        tail = total % 10
        kills[2] = [tail] if 1 <= tail <= 12 else []
    else:
        kills[2] = []
    
    # 方法3: 相邻号码相减
    if back_balls and len(back_balls) >= 2:
        diff = abs(back_balls[1] - back_balls[0])
        kills[3] = [diff] if 1 <= diff <= 12 else []
    else:
        kills[3] = []
    
    # 方法4: 后区和加3杀号
    if back_balls:
        back_sum = sum(back_balls) + 3
        while back_sum > 12:
            back_sum -= 12
        kills[4] = [back_sum] if 1 <= back_sum <= 12 else []
    else:
        kills[4] = []
    
    # 方法5: 后区积取整杀号 (后区两号相乘除以10取整)
    if back_balls and len(back_balls) >= 2:
        product = (back_balls[0] * back_balls[1]) // 10
        kills[5] = [product] if 1 <= product <= 12 else []
    else:
        kills[5] = []
    
    return kills


class DLTKillService:
    """大乐透杀号服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_kill_analysis(
        self, 
        lookback: int = 100, 
        num_sets: int = 5, 
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        """
        获取杀号分析数据
        lookback: 计算成功率的历史期数
        num_sets: 每种策略生成的推荐组数
        page/page_size: 历史记录分页
        """
        # 获取历史数据
        results = self.db.query(DLTResult).order_by(desc(DLTResult.period)).limit(lookback + 2).all()
        
        if len(results) < 3:
            return {"error": "历史数据不足"}
        
        # 转换数据格式
        history = []
        for r in results:
            history.append({
                "period": r.period,
                "front": [r.front1, r.front2, r.front3, r.front4, r.front5],
                "back": [r.back1, r.back2],
            })
        
        latest = history[0]
        prev = history[1]
        
        # 获取去年同期数据
        last_year_data = self._get_last_year_same_period(latest["period"])
        last_year_front = last_year_data["front"] if last_year_data else None
        
        # 计算下期杀号
        prev_prev = history[2] if len(history) > 2 else None
        next_front_kills = get_front_kill_numbers(
            latest["front"], latest["back"],
            prev["front"], prev_prev["front"] if prev_prev else None,
            last_year_front
        )
        next_back_kills = get_back_kill_numbers(latest["back"], prev["back"])
        
        # 统计历史成功率 (28种前区方法 + 5种后区方法)
        front_success = {i: 0 for i in range(1, 29)}
        front_kill_counts = {i: 0 for i in range(1, 29)}
        back_success = {i: 0 for i in range(1, 6)}
        back_kill_counts = {i: 0 for i in range(1, 6)}
        
        history_records = []
        
        for i in range(len(history) - 2):
            if i >= lookback:
                break
            
            current = history[i]
            prev_data = history[i + 1]
            prev_prev = history[i + 2]
            
            # 获取去年同期
            last_year = self._get_last_year_same_period(prev_data["period"])
            last_year_f = last_year["front"] if last_year else None
            
            # 计算杀号
            prev_prev_prev = history[i + 3] if i + 3 < len(history) else None
            front_kills = get_front_kill_numbers(
                prev_data["front"], prev_data["back"],
                prev_prev["front"], prev_prev_prev["front"] if prev_prev_prev else None,
                last_year_f
            )
            back_kills = get_back_kill_numbers(prev_data["back"], prev_prev["back"])
            
            # 验证成功率
            current_front_set = set(current["front"])
            current_back_set = set(current["back"])
            
            record = {
                "period": current["period"],
                "front": current["front"],
                "back": current["back"],
                "front_kills": {},
                "back_kills": {},
            }
            
            for method_id, kill_nums in front_kills.items():
                success = len(current_front_set.intersection(kill_nums)) == 0
                if success:
                    front_success[method_id] += 1
                front_kill_counts[method_id] += len(kill_nums)
                record["front_kills"][method_id] = {
                    "kills": kill_nums,
                    "success": success
                }
            
            for method_id, kill_nums in back_kills.items():
                success = len(current_back_set.intersection(kill_nums)) == 0
                if success:
                    back_success[method_id] += 1
                back_kill_counts[method_id] += len(kill_nums)
                record["back_kills"][method_id] = {
                    "kills": kill_nums,
                    "success": success
                }
            
            history_records.append(record)
        
        total_periods = len(history_records)
        
        # 计算方法统计
        def calc_method_stats(success_dict, kill_counts_dict, total):
            stats = {}
            for method_id in success_dict.keys():
                succ = success_dict[method_id]
                rate = succ / total if total > 0 else 0
                avg_kills = kill_counts_dict[method_id] / total if total > 0 else 0
                # 效率指标 = 成功率% × 平均杀号数 / 100 (杀号贡献度)
                efficiency = (rate * 100) * avg_kills / 100 if avg_kills > 0 else 0
                stats[method_id] = {
                    "success_count": succ,
                    "success_rate": round(rate * 100, 2),
                    "avg_kills": round(avg_kills, 2),
                    "efficiency": round(efficiency, 2),  # 效率 = 成功率% × 平均杀号数
                }
            return stats
        
        front_stats = calc_method_stats(front_success, front_kill_counts, total_periods)
        back_stats = calc_method_stats(back_success, back_kill_counts, total_periods)
        
        # 计算可选号码
        all_fronts = set(range(1, 36))
        all_backs = set(range(1, 13))
        
        # 根据优先级杀号
        priority_front_kills = {"high": [], "medium": [], "low": []}
        for method_id, nums in next_front_kills.items():
            rate = front_stats[method_id]["success_rate"]
            if rate >= 85:
                priority_front_kills["high"].extend(nums)
            elif rate >= 70:
                priority_front_kills["medium"].extend(nums)
            else:
                priority_front_kills["low"].extend(nums)
        
        priority_front_kills["high"] = list(set(priority_front_kills["high"]))
        priority_front_kills["medium"] = list(set(priority_front_kills["medium"]) - set(priority_front_kills["high"]))
        priority_front_kills["low"] = list(set(priority_front_kills["low"]) - set(priority_front_kills["high"]) - set(priority_front_kills["medium"]))
        
        # 计算可选号码（杀掉高优先级）
        killed_fronts = set(priority_front_kills["high"])
        killed_backs = set()
        for method_id, nums in next_back_kills.items():
            if back_stats[method_id]["success_rate"] >= 70:
                killed_backs.update(nums)
        
        available_fronts = sorted(all_fronts - killed_fronts)
        available_backs = sorted(all_backs - killed_backs)
        
        # 分析方法组合 - 找出最佳组合
        method_combinations = self._analyze_method_combinations(
            history_records, next_front_kills, front_stats, total_periods
        )
        
        # 生成推荐号码 - 使用最佳方法组合
        recommended_sets = self._generate_recommendations(
            available_fronts, available_backs,
            next_front_kills, next_back_kills,
            front_stats, back_stats,
            method_combinations,
            num_sets
        )
        
        # 分页历史记录
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_history = history_records[start_idx:end_idx]
        
        return {
            "base_period": latest["period"],
            "next_prediction": {
                "period": str(int(latest["period"]) + 1),
                "front_kills": {
                    method_id: {
                        "kills": nums,
                        "method_name": FRONT_KILL_METHOD_NAMES[method_id],
                        **front_stats[method_id]
                    }
                    for method_id, nums in next_front_kills.items()
                },
                "back_kills": {
                    method_id: {
                        "kills": nums,
                        "method_name": BACK_KILL_METHOD_NAMES[method_id],
                        **back_stats[method_id]
                    }
                    for method_id, nums in next_back_kills.items()
                },
                "priority_kills": priority_front_kills,
                "available_fronts": available_fronts,
                "available_backs": available_backs,
                "killed_front_count": 35 - len(available_fronts),  # 去重后的杀号数
                "killed_back_count": 12 - len(available_backs),   # 去重后的杀号数
            },
            "statistics": {
                "total_periods": total_periods,
                "front_methods": front_stats,
                "back_methods": back_stats,
                "total_unique_kills": (35 - len(available_fronts)) + (12 - len(available_backs)),
            },
            "method_combinations": method_combinations,  # 方法组合排名
            "recommended_sets": recommended_sets,
            "history": {
                "page": page,
                "page_size": page_size,
                "total": total_periods,
                "records": paged_history,
            },
            "method_names": {
                "front": FRONT_KILL_METHOD_NAMES,
                "back": BACK_KILL_METHOD_NAMES,
            }
        }
    
    def _get_last_year_same_period(self, current_period: str) -> Optional[Dict]:
        """获取去年同一期的数据"""
        try:
            # 期号格式: yyxxx (如 25005 = 2025年第5期)
            year = int(current_period[:2])
            seq = current_period[2:]
            last_year_period = f"{year - 1:02d}{seq}"
            
            result = self.db.query(DLTResult).filter(
                DLTResult.period == last_year_period
            ).first()
            
            if result:
                return {
                    "period": result.period,
                    "front": [result.front1, result.front2, result.front3, result.front4, result.front5],
                    "back": [result.back1, result.back2]
                }
        except Exception as e:
            logger.warning(f"获取去年同期数据失败: {e}")
        
        return None
    
    def _analyze_method_combinations(
        self,
        history_records: List[Dict],
        next_front_kills: Dict[int, List[int]],
        front_stats: Dict[int, Dict],
        total_periods: int
    ) -> List[Dict]:
        """
        分析方法组合的效果
        找出成功率高且杀号多的最佳组合
        """
        from itertools import combinations
        
        # 获取成功率≥60%的方法作为候选
        candidate_methods = [m for m, s in front_stats.items() if s["success_rate"] >= 60]
        
        if len(candidate_methods) < 3:
            candidate_methods = list(front_stats.keys())
        
        # 限制候选方法数量以控制计算量
        if len(candidate_methods) > 15:
            # 按效率排序，取前15个
            sorted_methods = sorted(
                candidate_methods, 
                key=lambda m: front_stats[m]["efficiency"], 
                reverse=True
            )[:15]
            candidate_methods = sorted_methods
        
        combo_results = []
        
        # 评估不同大小的组合 (2-8个方法的组合)
        for combo_size in range(2, min(9, len(candidate_methods) + 1)):
            for combo in combinations(candidate_methods, combo_size):
                # 计算这个组合在历史上的表现
                combo_success_count = 0
                
                for record in history_records:
                    # 检查组合中的所有方法是否都成功
                    all_success = all(
                        record["front_kills"].get(m, {}).get("success", False)
                        for m in combo
                    )
                    if all_success:
                        combo_success_count += 1
                
                # 计算组合的杀号数（去重）
                combo_kills = set()
                for m in combo:
                    combo_kills.update(next_front_kills.get(m, []))
                unique_kills = len(combo_kills)
                
                # 计算组合成功率
                combo_success_rate = (combo_success_count / total_periods * 100) if total_periods > 0 else 0
                
                # 计算组合效率 = 成功率 × 杀号数 / 100
                # 这样高成功率且杀号多的组合会排在前面
                efficiency = combo_success_rate * unique_kills / 100
                
                combo_results.append({
                    "methods": list(combo),
                    "method_names": [FRONT_KILL_METHOD_NAMES.get(m, f"方法{m}") for m in combo],
                    "success_rate": round(combo_success_rate, 2),
                    "unique_kills": unique_kills,
                    "kill_numbers": sorted(combo_kills),
                    "efficiency": round(efficiency, 2),
                    "method_count": len(combo),
                })
        
        # 按效率排序，取前20个最佳组合
        combo_results.sort(key=lambda x: (-x["efficiency"], -x["success_rate"], -x["unique_kills"]))
        
        return combo_results[:20]
    
    def _generate_recommendations(
        self,
        available_fronts: List[int],
        available_backs: List[int],
        front_kills: Dict[int, List[int]],
        back_kills: Dict[int, List[int]],
        front_stats: Dict[int, Dict],
        back_stats: Dict[int, Dict],
        method_combinations: List[Dict],
        num_sets: int
    ) -> Dict[str, Dict]:
        """生成多种策略的推荐号码"""
        import random
        
        recommendations = {}
        
        # 策略1: 使用排名第一的方法组合
        if method_combinations and len(method_combinations) > 0:
            top1 = method_combinations[0]
            top1_available = sorted([n for n in range(1, 36) if n not in top1["kill_numbers"]])
            recommendations["top_combo_1"] = {
                "name": f"最佳组合 #{1}",
                "description": f"成功率{top1['success_rate']}%，杀{top1['unique_kills']}码: {', '.join(top1['method_names'])}",
                "methods_used": top1["methods"],
                "combo_info": top1,
                "sets": self._random_select(top1_available, available_backs, num_sets)
            }
        
        # 策略2: 使用排名第二的方法组合
        if method_combinations and len(method_combinations) > 1:
            top2 = method_combinations[1]
            top2_available = sorted([n for n in range(1, 36) if n not in top2["kill_numbers"]])
            recommendations["top_combo_2"] = {
                "name": f"最佳组合 #{2}",
                "description": f"成功率{top2['success_rate']}%，杀{top2['unique_kills']}码: {', '.join(top2['method_names'])}",
                "methods_used": top2["methods"],
                "combo_info": top2,
                "sets": self._random_select(top2_available, available_backs, num_sets)
            }
        
        # 策略3: 使用排名第三的方法组合
        if method_combinations and len(method_combinations) > 2:
            top3 = method_combinations[2]
            top3_available = sorted([n for n in range(1, 36) if n not in top3["kill_numbers"]])
            recommendations["top_combo_3"] = {
                "name": f"最佳组合 #{3}",
                "description": f"成功率{top3['success_rate']}%，杀{top3['unique_kills']}码: {', '.join(top3['method_names'])}",
                "methods_used": top3["methods"],
                "combo_info": top3,
                "sets": self._random_select(top3_available, available_backs, num_sets)
            }
        
        # 策略4: 剩余号码随机选择
        recommendations["random"] = {
            "name": "杀号后随机选择",
            "description": "从杀号后剩余可选号码中随机选择",
            "sets": self._random_select(available_fronts, available_backs, num_sets)
        }
        
        # 策略5: 高成功率方法筛选（只用成功率≥80%的方法）
        high_rate_methods = [m for m, s in front_stats.items() if s["success_rate"] >= 80]
        high_rate_kills = set()
        for m in high_rate_methods:
            high_rate_kills.update(front_kills.get(m, []))
        high_rate_available = sorted([n for n in range(1, 36) if n not in high_rate_kills])
        
        recommendations["high_success"] = {
            "name": "高成功率方法",
            "description": f"只使用成功率≥80%的{len(high_rate_methods)}种方法杀号",
            "methods_used": high_rate_methods,
            "sets": self._random_select(high_rate_available, available_backs, num_sets)
        }
        
        return recommendations
    
    def _random_select(
        self, 
        available_fronts: List[int], 
        available_backs: List[int], 
        num_sets: int
    ) -> List[Dict]:
        """从可选号码中随机选择"""
        import random
        
        sets = []
        used_combos: Set[tuple] = set()
        
        # 确保有足够号码
        if len(available_fronts) < 5:
            available_fronts = list(range(1, 36))
        if len(available_backs) < 2:
            available_backs = list(range(1, 13))
        
        for i in range(num_sets):
            attempts = 0
            while attempts < 100:
                front_sample = sorted(random.sample(available_fronts, min(5, len(available_fronts))))
                while len(front_sample) < 5:
                    extra = random.randint(1, 35)
                    if extra not in front_sample:
                        front_sample.append(extra)
                        front_sample = sorted(front_sample)
                
                back_sample = sorted(random.sample(available_backs, min(2, len(available_backs))))
                while len(back_sample) < 2:
                    extra = random.randint(1, 12)
                    if extra not in back_sample:
                        back_sample.append(extra)
                        back_sample = sorted(back_sample)
                
                combo = tuple(front_sample + back_sample)
                
                if combo not in used_combos:
                    used_combos.add(combo)
                    break
                attempts += 1
            
            sets.append({"front": front_sample, "back": back_sample})
        
        return sets

