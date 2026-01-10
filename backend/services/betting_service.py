"""
投注服务 - 中奖计算、注数计算等
"""
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models.bet import Bet, Watchlist, SSQ_PRIZE_RULES, DLT_PRIZE_RULES, BetStatus
from models.user import User
import math


class BettingService:
    """投注服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ==================== 用户管理 ==================== #
    
    def get_or_create_user(self, clerk_id: str, email: str = None, username: str = None) -> User:
        """获取或创建用户，第一个用户自动成为管理员"""
        user = self.db.query(User).filter(User.clerk_id == clerk_id).first()
        if user:
            return user
        
        # 检查是否第一个用户
        user_count = self.db.query(User).count()
        is_admin = user_count == 0
        
        user = User(
            clerk_id=clerk_id,
            email=email,
            username=username,
            is_admin=is_admin
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_user_by_clerk_id(self, clerk_id: str) -> Optional[User]:
        """通过 Clerk ID 获取用户"""
        return self.db.query(User).filter(User.clerk_id == clerk_id).first()
    
    # ==================== 收藏管理 ==================== #
    
    def add_to_watchlist(
        self, 
        user_id: int, 
        lottery_type: str, 
        numbers: dict, 
        source: str = "manual",
        note: str = None
    ) -> Watchlist:
        """添加到收藏"""
        item = Watchlist(
            user_id=user_id,
            lottery_type=lottery_type,
            numbers=numbers,
            source=source,
            note=note
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
    
    def get_watchlist(self, user_id: int, lottery_type: str = None) -> List[Watchlist]:
        """获取用户收藏列表"""
        query = self.db.query(Watchlist).filter(Watchlist.user_id == user_id)
        if lottery_type:
            query = query.filter(Watchlist.lottery_type == lottery_type)
        return query.order_by(Watchlist.created_at.desc()).all()
    
    def update_watchlist_item(self, item_id: int, user_id: int, numbers: dict) -> Optional[Watchlist]:
        """更新收藏号码"""
        item = self.db.query(Watchlist).filter(
            Watchlist.id == item_id, 
            Watchlist.user_id == user_id
        ).first()
        if item:
            item.numbers = numbers
            self.db.commit()
            self.db.refresh(item)
        return item
    
    def delete_watchlist_item(self, item_id: int, user_id: int) -> bool:
        """删除收藏"""
        item = self.db.query(Watchlist).filter(
            Watchlist.id == item_id,
            Watchlist.user_id == user_id
        ).first()
        if item:
            self.db.delete(item)
            self.db.commit()
            return True
        return False
    
    # ==================== 投注计算 ==================== #
    
    @staticmethod
    def calculate_combinations(n: int, r: int) -> int:
        """计算组合数 C(n, r)"""
        if n < r or r < 0:
            return 0
        return math.factorial(n) // (math.factorial(r) * math.factorial(n - r))
    
    def calculate_bet_count(self, lottery_type: str, bet_type: str, numbers: dict) -> int:
        """
        计算注数
        - 单式: 1注
        - 复式: C(red_count, 6) * C(blue_count, 1) (SSQ)
        - 胆拖: C(tuo_count, 6-dan_count) * blue_count
        """
        if lottery_type == "ssq":
            red_need = 6
            blue_need = 1
        else:  # dlt
            red_need = 5
            blue_need = 2
        
        if bet_type == "single":
            return 1
        
        elif bet_type == "multiple":
            if lottery_type == "ssq":
                red_count = len(numbers.get("red", []))
                blue_count = len(numbers.get("blue", [])) if isinstance(numbers.get("blue"), list) else 1
                return self.calculate_combinations(red_count, 6) * self.calculate_combinations(blue_count, 1)
            else:  # dlt
                front_count = len(numbers.get("front", []))
                back_count = len(numbers.get("back", []))
                return self.calculate_combinations(front_count, 5) * self.calculate_combinations(back_count, 2)
        
        elif bet_type == "dantuo":
            if lottery_type == "ssq":
                dan_count = len(numbers.get("dan_red", []))
                tuo_count = len(numbers.get("tuo_red", []))
                blue_count = len(numbers.get("blue", [])) if isinstance(numbers.get("blue"), list) else 1
                return self.calculate_combinations(tuo_count, 6 - dan_count) * blue_count
            else:  # dlt
                dan_front = len(numbers.get("dan_front", []))
                tuo_front = len(numbers.get("tuo_front", []))
                dan_back = len(numbers.get("dan_back", []))
                tuo_back = len(numbers.get("tuo_back", []))
                front_comb = self.calculate_combinations(tuo_front, 5 - dan_front)
                back_comb = self.calculate_combinations(tuo_back, 2 - dan_back)
                return front_comb * back_comb
        
        return 0
    
    def calculate_amount(self, bet_count: int, multiple: int = 1) -> float:
        """计算投注金额 (每注2元)"""
        return bet_count * multiple * 2.0
    
    # ==================== 投注记录 ==================== #
    
    def create_bet(
        self,
        user_id: int,
        lottery_type: str,
        bet_type: str,
        target_period: int,
        numbers: dict,
        multiple: int = 1
    ) -> Bet:
        """创建投注记录"""
        bet_count = self.calculate_bet_count(lottery_type, bet_type, numbers)
        amount = self.calculate_amount(bet_count, multiple)
        
        bet = Bet(
            user_id=user_id,
            lottery_type=lottery_type,
            bet_type=bet_type,
            target_period=target_period,
            numbers=numbers,
            bet_count=bet_count,
            multiple=multiple,
            amount=amount,
            status=BetStatus.PENDING.value
        )
        self.db.add(bet)
        self.db.commit()
        self.db.refresh(bet)
        return bet
    
    def get_user_bets(
        self, 
        user_id: int, 
        lottery_type: str = None,
        status: str = None,
        limit: int = 50
    ) -> List[Bet]:
        """获取用户投注记录"""
        query = self.db.query(Bet).filter(Bet.user_id == user_id)
        if lottery_type:
            query = query.filter(Bet.lottery_type == lottery_type)
        if status:
            query = query.filter(Bet.status == status)
        return query.order_by(Bet.created_at.desc()).limit(limit).all()
    
    def get_pending_bets(self, lottery_type: str, period: int) -> List[Bet]:
        """获取指定期号的待开奖投注"""
        return self.db.query(Bet).filter(
            Bet.lottery_type == lottery_type,
            Bet.target_period == period,
            Bet.status == BetStatus.PENDING.value
        ).all()
    
    # ==================== 中奖计算 ==================== #
    
    def check_ssq_prize(self, bet_numbers: dict, draw_result: dict) -> Tuple[str, int, bool]:
        """
        检查双色球中奖
        bet_numbers: {"red": [1,2,3,4,5,6], "blue": 7}
        draw_result: {"red": [1,2,3,4,5,6], "blue": 7}
        返回: (奖级, 中红球数, 是否中蓝球)
        """
        draw_red = set(draw_result.get("red", []))
        draw_blue = draw_result.get("blue")
        
        # 处理单式
        bet_red = set(bet_numbers.get("red", []))
        bet_blue = bet_numbers.get("blue")
        
        matched_red = len(bet_red & draw_red)
        matched_blue = bet_blue == draw_blue
        
        # 匹配奖级
        for rule in SSQ_PRIZE_RULES:
            if matched_red == rule["red"] and matched_blue == rule["blue"]:
                return rule["level"], matched_red, matched_blue
        
        return None, matched_red, matched_blue
    
    def check_dlt_prize(self, bet_numbers: dict, draw_result: dict) -> Tuple[str, int, int]:
        """
        检查大乐透中奖
        bet_numbers: {"front": [1,2,3,4,5], "back": [1,2]}
        draw_result: {"front": [1,2,3,4,5], "back": [1,2]}
        返回: (奖级, 中前区数, 中后区数)
        """
        draw_front = set(draw_result.get("front", []))
        draw_back = set(draw_result.get("back", []))
        
        bet_front = set(bet_numbers.get("front", []))
        bet_back = set(bet_numbers.get("back", []))
        
        matched_front = len(bet_front & draw_front)
        matched_back = len(bet_back & draw_back)
        
        # 匹配奖级
        for rule in DLT_PRIZE_RULES:
            if matched_front == rule["front"] and matched_back == rule["back"]:
                return rule["level"], matched_front, matched_back
        
        return None, matched_front, matched_back
    
    def check_bet(self, bet: Bet, draw_result: dict) -> Bet:
        """检查单个投注并更新状态"""
        if bet.lottery_type == "ssq":
            prize_level, matched_red, matched_blue = self.check_ssq_prize(bet.numbers, draw_result)
            bet.matched_red = matched_red
            bet.matched_blue = matched_blue
            
            # 计算奖金
            if prize_level:
                bet.prize_level = prize_level
                for rule in SSQ_PRIZE_RULES:
                    if rule["level"] == prize_level:
                        if rule["prize"] is None:
                            # 一二等奖为浮动奖金，标记为-1表示大奖
                            bet.prize_amount = -1
                        else:
                            bet.prize_amount = rule["prize"] * bet.multiple
                        break
        else:  # dlt
            prize_level, matched_front, matched_back = self.check_dlt_prize(bet.numbers, draw_result)
            bet.matched_red = matched_front
            bet.matched_blue = matched_back > 0
            
            if prize_level:
                bet.prize_level = prize_level
                for rule in DLT_PRIZE_RULES:
                    if rule["level"] == prize_level:
                        if rule["prize"] is None:
                            # 一二等奖为浮动奖金，标记为-1表示大奖
                            bet.prize_amount = -1
                        else:
                            bet.prize_amount = rule["prize"] * bet.multiple
                        break
        
        bet.status = BetStatus.CHECKED.value
        bet.checked_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(bet)
        return bet
    
    def check_all_pending_bets(self, lottery_type: str, period: int, draw_result: dict) -> List[Bet]:
        """检查所有待开奖投注"""
        pending_bets = self.get_pending_bets(lottery_type, period)
        checked = []
        for bet in pending_bets:
            checked.append(self.check_bet(bet, draw_result))
        return checked
    
    # ==================== 统计 ==================== #
    
    def get_user_stats(self, user_id: int) -> dict:
        """获取用户投注统计"""
        bets = self.db.query(Bet).filter(Bet.user_id == user_id).all()
        
        total_bets = len(bets)
        total_amount = sum(b.amount for b in bets)
        total_prize = sum(b.prize_amount or 0 for b in bets)
        winning_bets = [b for b in bets if b.prize_level]
        
        return {
            "total_bets": total_bets,
            "total_amount": total_amount,
            "total_prize": total_prize,
            "winning_count": len(winning_bets),
            "profit": total_prize - total_amount
        }
