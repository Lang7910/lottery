"""
杀号策略服务 - 双色球红球17种 + 蓝球6种
增强版：支持效率指标、多种推荐策略、分页历史记录
"""
import logging
import random
from typing import List, Dict, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

logger = logging.getLogger(__name__)


def is_prime(n: int) -> bool:
    """判断是否为质数"""
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True


def calculate_ac_value(red_balls: List[int]) -> int:
    """计算AC值（红球间隔种类数）"""
    sorted_balls = sorted(red_balls)
    gaps = set()
    for i in range(len(sorted_balls)):
        for j in range(i + 1, len(sorted_balls)):
            gaps.add(sorted_balls[j] - sorted_balls[i])
    return max(0, len(gaps) - 5)


RED_KILL_METHOD_NAMES = {
    1: "蓝号尾数杀号",
    2: "红号尾数之和杀号",
    3: "质数个数杀号",
    4: "红1对称码杀号",
    5: "红1+红6杀号",
    6: "出球顺序1+2+5杀号",
    7: "红号和的和杀号",
    8: "AC值杀号",
    9: "蓝号+AC值杀号",
    10: "蓝号+质数个数杀号",
    11: "AC值×质数个数杀号",
    12: "AC值+质数个数杀号",
    13: "AC值-红6杀号",
    14: "蓝号-红1红6杀号",
    15: "蓝号+AC值+质数杀号",
    16: "红号×0.88杀号",
    17: "红3对称码+7杀号",
}

BLUE_KILL_METHOD_NAMES = {
    1: "15-上期蓝号尾数",
    2: "19-上期蓝号尾数",
    3: "21-上期蓝号尾数",
    4: "上两期蓝头+蓝尾",
    5: "上两期蓝尾+蓝头",
    6: "上两期蓝尾相加",
}


def get_red_kill_numbers(red_balls: List[int], blue: int) -> Dict[int, List[int]]:
    """根据上期数据计算17种红球杀号"""
    kills = {}
    
    # 方法1: 蓝号尾数杀号
    blue_tail = blue % 10
    kills[1] = [n for n in range(1, 34) if n % 10 == blue_tail]
    
    # 方法2: 红号尾数之和杀号
    tail_sum = sum(ball % 10 for ball in red_balls) % 10
    kills[2] = [tail_sum] if 1 <= tail_sum <= 33 else []
    
    # 方法3: 质数个数杀号
    prime_count = sum(1 for ball in red_balls if is_prime(ball))
    kills[3] = [n for n in range(1, 34) if n % 10 == prime_count % 10]
    
    # 方法4: 红1对称码杀号
    symmetric = 34 - red_balls[0]
    kills[4] = [symmetric] if 1 <= symmetric <= 33 else []
    
    # 方法5: 红1 + 红6 杀号
    sum_1_6 = red_balls[0] + red_balls[5]
    kills[5] = [sum_1_6] if 1 <= sum_1_6 <= 33 else []
    
    # 方法6: 出球顺序1+2+5 杀号
    sum_125 = red_balls[0] + red_balls[1] + red_balls[4]
    kill6 = sum_125 % 33 or 33
    kills[6] = [kill6] if 1 <= kill6 <= 33 else []
    
    # 方法7: 红号和的和杀号
    total = sum(red_balls)
    digit_sum = sum(int(d) for d in str(total))
    kills[7] = [digit_sum] if 1 <= digit_sum <= 33 else []
    
    # 方法8: AC值杀号
    ac = calculate_ac_value(red_balls)
    kills[8] = [n for n in range(1, 34) if n % 10 == ac % 10]
    
    # 方法9: 蓝号 + AC值 杀号
    blue_ac = (blue + ac) % 10
    kills[9] = [n for n in range(1, 34) if n % 10 == blue_ac]
    
    # 方法10: 蓝号 + 质数个数 杀号
    blue_prime = blue + prime_count
    kills[10] = [blue_prime] if 1 <= blue_prime <= 33 else []
    
    # 方法11: AC值 × 质数个数 杀号
    ac_prime_mul = ac * prime_count
    kills[11] = [ac_prime_mul] if 1 <= ac_prime_mul <= 33 else []
    
    # 方法12: AC值 + 质数个数 杀号
    ac_prime_add = ac + prime_count
    kills[12] = [ac_prime_add] if 1 <= ac_prime_add <= 33 else []
    
    # 方法13: AC值 - 红6 杀号
    ac_red6 = abs(ac - red_balls[5])
    kills[13] = [ac_red6] if 1 <= ac_red6 <= 33 else []
    
    # 方法14: 蓝号 - 红1 - 红6 杀号
    blue_red16 = abs(blue - red_balls[0] - red_balls[5])
    kills[14] = [blue_red16] if 1 <= blue_red16 <= 33 else []
    
    # 方法15: 蓝号 + AC值 + 质数个数 杀号
    combo = blue + ac + prime_count
    kills[15] = [combo] if 1 <= combo <= 33 else []
    
    # 方法16: 红号×0.88 杀号
    kills[16] = list(set(int(ball * 0.88) for ball in red_balls if 1 <= int(ball * 0.88) <= 33))
    
    # 方法17: 红3对称码+7 杀号
    red3_sym = 34 - red_balls[2] + 7
    kill17 = red3_sym if 1 <= red3_sym <= 33 else (red3_sym % 33 or 33)
    kills[17] = [kill17] if 1 <= kill17 <= 33 else []
    
    return kills


def get_blue_kill_numbers(blue_balls: List[int]) -> Dict[int, List[int]]:
    """根据上1-2期蓝球计算6种蓝球杀号"""
    kills = {}
    prev = blue_balls[0] if blue_balls else 0
    prev2 = blue_balls[1] if len(blue_balls) > 1 else 0
    
    def get_kill_by_tail(tail: int) -> List[int]:
        tail = tail % 10
        result = []
        if tail != 0 and 1 <= tail <= 16:
            result.append(tail)
        if tail + 10 <= 16:
            result.append(tail + 10)
        return result
    
    kills[1] = get_kill_by_tail(15 - (prev % 10))
    kills[2] = get_kill_by_tail(19 - (prev % 10))
    kills[3] = get_kill_by_tail(21 - (prev % 10))
    
    if prev2:
        head1, tail2 = prev2 // 10, prev % 10
        tail1, head2 = prev2 % 10, prev // 10
        kills[4] = get_kill_by_tail(head1 + tail2)
        kills[5] = get_kill_by_tail(tail1 + head2)
        kills[6] = get_kill_by_tail((prev2 % 10) + (prev % 10))
    else:
        kills[4] = []
        kills[5] = []
        kills[6] = []
    
    return kills


class SSQKillService:
    """双色球杀号服务"""
    
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
        from models.ssq import SSQResult
        
        results = self.db.query(SSQResult).order_by(desc(SSQResult.period)).limit(lookback + 2).all()
        if len(results) < 3:
            return {"error": "数据不足"}
        
        results = list(reversed(results))
        
        # 初始化统计
        history = []
        red_success = {i: 0 for i in range(1, 18)}
        red_kill_counts = {i: [] for i in range(1, 18)}  # 每种方法每期杀几个号
        blue_success = {i: 0 for i in range(1, 7)}
        blue_kill_counts = {i: [] for i in range(1, 7)}
        total_red = 0
        total_blue = 0
        
        # 综合统计
        all_methods_success = 0  # 所有方法都成功的次数
        methods_success_10 = 0   # ≥10个方法成功
        methods_success_15 = 0   # ≥15个方法成功
        
        for i in range(1, len(results)):
            prev = results[i - 1]
            curr = results[i]
            prev_reds = [prev.red1, prev.red2, prev.red3, prev.red4, prev.red5, prev.red6]
            prev_blue = prev.blue
            curr_reds = set([curr.red1, curr.red2, curr.red3, curr.red4, curr.red5, curr.red6])
            curr_reds_sorted = sorted(curr_reds)
            curr_blue = curr.blue
            
            # 红球杀号
            red_kills = get_red_kill_numbers(prev_reds, prev_blue)
            red_results = {}
            red_success_count = 0
            
            for m, kills in red_kills.items():
                success = not any(k in curr_reds for k in kills) if kills else None
                red_results[m] = {"kills": kills, "success": success}
                red_kill_counts[m].append(len(kills))
                if kills and success is not None:
                    red_success[m] += int(success)
                    if success:
                        red_success_count += 1
            
            # 蓝球杀号
            blue_balls = [prev_blue]
            if i >= 2:
                blue_balls.append(results[i - 2].blue)
            blue_kills = get_blue_kill_numbers(blue_balls)
            blue_results = {}
            
            for m, kills in blue_kills.items():
                if not kills:
                    blue_results[m] = {"kills": [], "success": None}
                    blue_kill_counts[m].append(0)
                    continue
                success = curr_blue not in kills
                blue_results[m] = {"kills": kills, "success": success}
                blue_kill_counts[m].append(len(kills))
                blue_success[m] += int(success)
            
            # 综合统计
            if red_success_count == 17:
                all_methods_success += 1
            if red_success_count >= 10:
                methods_success_10 += 1
            if red_success_count >= 15:
                methods_success_15 += 1
            
            total_red += 1
            if i >= 2:
                total_blue += 1
            
            history.append({
                "period": curr.period,
                "red_balls": curr_reds_sorted,
                "blue": curr_blue,
                "red_kills": red_results,
                "blue_kills": blue_results,
                "red_success_count": red_success_count
            })
        
        # 计算方法统计数据
        def calc_method_stats(success_dict, kill_counts_dict, total):
            stats = {}
            for m in success_dict.keys():
                counts = kill_counts_dict[m]
                avg_kills = sum(counts) / len(counts) if counts else 0
                max_kills = max(counts) if counts else 0
                min_kills = min(counts) if counts else 0
                success_rate = success_dict[m] / total * 100 if total > 0 else 0
                
                # 效率指标 = 成功率 / 平均杀号数 (杀号越多成功率相对越难)
                # 或者: 成功率 * 平均杀号数 (考虑杀号贡献)
                efficiency = success_rate * avg_kills / 100 if avg_kills > 0 else 0
                
                stats[m] = {
                    "success_rate": round(success_rate, 2),
                    "avg_kills": round(avg_kills, 2),
                    "max_kills": max_kills,
                    "min_kills": min_kills,
                    "efficiency": round(efficiency, 2)  # 效率 = 成功率% × 平均杀号数
                }
            return stats
        
        red_stats = calc_method_stats(red_success, red_kill_counts, total_red)
        blue_stats = calc_method_stats(blue_success, blue_kill_counts, total_blue)
        
        # 总体杀号统计
        all_red_kills = [sum(red_kill_counts[m][i] for m in range(1, 18)) 
                         for i in range(len(red_kill_counts[1]))]
        
        summary_stats = {
            "total_periods": total_red,
            "max_total_kills": max(all_red_kills) if all_red_kills else 0,
            "min_total_kills": min(all_red_kills) if all_red_kills else 0,
            "avg_total_kills": round(sum(all_red_kills) / len(all_red_kills), 2) if all_red_kills else 0,
            "all_methods_success": all_methods_success,
            "methods_success_10": methods_success_10,
            "methods_success_15": methods_success_15,
            "combined_success_rate": round(all_methods_success / total_red * 100, 2) if total_red > 0 else 0
        }
        
        # 计算下期预测
        last = results[-1]
        last_reds = [last.red1, last.red2, last.red3, last.red4, last.red5, last.red6]
        last_blue = last.blue
        last2_blue = results[-2].blue if len(results) >= 2 else None
        
        next_red_kills = get_red_kill_numbers(last_reds, last_blue)
        next_blue_kills = get_blue_kill_numbers([last_blue, last2_blue] if last2_blue else [last_blue])
        
        # 统计杀号次数
        red_kill_count = {}
        for m, kills in next_red_kills.items():
            for k in kills:
                red_kill_count[k] = red_kill_count.get(k, 0) + 1
        
        sorted_kills = sorted(red_kill_count.items(), key=lambda x: -x[1])
        priority_kills = {
            "high": [k for k, c in sorted_kills if c >= 4],
            "medium": [k for k, c in sorted_kills if c == 3],
            "low": [k for k, c in sorted_kills if c == 2],
        }
        
        all_killed_reds = set(red_kill_count.keys())
        available_reds = sorted([n for n in range(1, 34) if n not in all_killed_reds])
        
        blue_kill_count = {}
        for m, kills in next_blue_kills.items():
            for k in kills:
                blue_kill_count[k] = blue_kill_count.get(k, 0) + 1
        all_killed_blues = set(blue_kill_count.keys())
        available_blues = sorted([n for n in range(1, 17) if n not in all_killed_blues])
        
        # 生成多种策略的推荐号码
        recommended_sets = self._generate_recommendations(
            available_reds, available_blues, 
            next_red_kills, next_blue_kills,
            red_stats, blue_stats, num_sets
        )
        
        # 分页历史记录
        total_history = len(history)
        start_idx = max(0, total_history - page * page_size)
        end_idx = max(0, total_history - (page - 1) * page_size)
        paged_history = list(reversed(history[start_idx:end_idx]))
        
        return {
            "history": paged_history,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total_history,
                "total_pages": (total_history + page_size - 1) // page_size
            },
            "red_method_names": RED_KILL_METHOD_NAMES,
            "blue_method_names": BLUE_KILL_METHOD_NAMES,
            "red_stats": red_stats,
            "blue_stats": blue_stats,
            "summary_stats": summary_stats,
            "next_prediction": {
                "period": last.period,
                "red_kills": {m: {"kills": k, "name": RED_KILL_METHOD_NAMES[m], **red_stats[m]} 
                             for m, k in next_red_kills.items()},
                "blue_kills": {m: {"kills": k, "name": BLUE_KILL_METHOD_NAMES[m], **blue_stats[m]} 
                             for m, k in next_blue_kills.items()},
                "priority_kills": priority_kills,
                "available_reds": available_reds,
                "available_blues": available_blues,
                "killed_red_count": len(all_killed_reds),
                "killed_blue_count": len(all_killed_blues)
            },
            "recommended_sets": recommended_sets
        }
    
    def _generate_recommendations(
        self,
        available_reds: List[int],
        available_blues: List[int],
        next_red_kills: Dict[int, List[int]],
        next_blue_kills: Dict[int, List[int]],
        red_stats: Dict[int, Dict],
        blue_stats: Dict[int, Dict],
        num_sets: int
    ) -> Dict[str, List[Dict]]:
        """生成多种策略的推荐号码"""
        
        recommendations = {}
        
        # 策略1: 剩余号码随机选择
        recommendations["random"] = {
            "name": "杀号后随机选择",
            "description": "从杀号后剩余可选号码中随机选择",
            "sets": self._random_select(available_reds, available_blues, num_sets)
        }
        
        # 策略2: 高成功率方法筛选（只用成功率≥70%的方法）
        high_rate_methods = [m for m, s in red_stats.items() if s["success_rate"] >= 70]
        high_rate_kills = set()
        for m in high_rate_methods:
            high_rate_kills.update(next_red_kills.get(m, []))
        high_rate_available = sorted([n for n in range(1, 34) if n not in high_rate_kills])
        
        recommendations["high_success"] = {
            "name": "高成功率方法筛选",
            "description": f"只使用成功率≥70%的{len(high_rate_methods)}种方法杀号",
            "methods_used": high_rate_methods,
            "sets": self._random_select(high_rate_available, available_blues, num_sets)
        }
        
        # 策略3: 高效率方法筛选（效率指标最高的前8个方法）
        sorted_by_efficiency = sorted(red_stats.items(), key=lambda x: -x[1]["efficiency"])
        top_efficiency_methods = [m for m, _ in sorted_by_efficiency[:8]]
        efficiency_kills = set()
        for m in top_efficiency_methods:
            efficiency_kills.update(next_red_kills.get(m, []))
        efficiency_available = sorted([n for n in range(1, 34) if n not in efficiency_kills])
        
        recommendations["high_efficiency"] = {
            "name": "高效率方法筛选",
            "description": f"使用效率指标最高的8种方法杀号 (效率=成功率×平均杀号)",
            "methods_used": top_efficiency_methods,
            "sets": self._random_select(efficiency_available, available_blues, num_sets)
        }
        
        # 策略4: 综合杀号（被≥3个方法杀掉的号码）
        kill_count = {}
        for m, kills in next_red_kills.items():
            for k in kills:
                kill_count[k] = kill_count.get(k, 0) + 1
        multi_killed = set(k for k, c in kill_count.items() if c >= 3)
        multi_available = sorted([n for n in range(1, 34) if n not in multi_killed])
        
        recommendations["multi_kill"] = {
            "name": "多方法综合杀号",
            "description": "只杀被≥3种方法同时杀掉的号码",
            "sets": self._random_select(multi_available, available_blues, num_sets)
        }
        
        # 策略5: 保守杀号（只杀被≥5个方法杀掉的号码）
        conservative_killed = set(k for k, c in kill_count.items() if c >= 5)
        conservative_available = sorted([n for n in range(1, 34) if n not in conservative_killed])
        
        recommendations["conservative"] = {
            "name": "保守杀号策略",
            "description": "只杀被≥5种方法同时杀掉的号码，保留更多选择",
            "sets": self._random_select(conservative_available, available_blues, num_sets)
        }
        
        return recommendations
    
    def _random_select(
        self, 
        available_reds: List[int], 
        available_blues: List[int], 
        num_sets: int
    ) -> List[Dict]:
        """从可选号码中随机选择"""
        sets = []
        used_combos: Set[tuple] = set()
        
        # 确保有足够号码
        if len(available_reds) < 6:
            available_reds = list(range(1, 34))
        if len(available_blues) < 1:
            available_blues = list(range(1, 17))
        
        for i in range(num_sets):
            attempts = 0
            while attempts < 100:
                red_sample = sorted(random.sample(available_reds, min(6, len(available_reds))))
                while len(red_sample) < 6:
                    extra = random.randint(1, 33)
                    if extra not in red_sample:
                        red_sample.append(extra)
                        red_sample = sorted(red_sample)
                
                blue_sample = random.choice(available_blues)
                combo = tuple(red_sample + [blue_sample])
                
                if combo not in used_combos:
                    used_combos.add(combo)
                    break
                attempts += 1
            
            sets.append({"red": red_sample, "blue": blue_sample})
        
        return sets
