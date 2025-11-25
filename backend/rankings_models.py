"""
Player Rankings Models
Global and regional rankings system
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RankingCategory(str, Enum):
    BATTER = "batter"
    BOWLER = "bowler"
    ALL_ROUNDER = "all_rounder"
    FIELDER = "fielder"
    POWER_HITTER = "power_hitter"
    EMERGING = "emerging"

class RankingScope(str, Enum):
    GLOBAL = "global"
    REGIONAL = "regional"
    NATIONAL = "national"
    STATE = "state"
    LOCAL = "local"
    LEAGUE = "league"

class PlayerStats(BaseModel):
    """Aggregated player statistics"""
    player_id: str
    
    # Batting stats
    matches_played: int = 0
    innings_batted: int = 0
    runs_scored: int = 0
    highest_score: int = 0
    batting_average: float = 0.0
    strike_rate: float = 0.0
    centuries: int = 0
    half_centuries: int = 0
    sixes: int = 0
    fours: int = 0
    
    # Bowling stats
    innings_bowled: int = 0
    wickets: int = 0
    best_bowling: Optional[str] = None
    bowling_average: float = 0.0
    economy_rate: float = 0.0
    five_wickets: int = 0
    
    # Fielding
    catches: int = 0
    stumpings: int = 0
    run_outs: int = 0
    
    # Metadata
    last_updated: datetime
    is_verified: bool = False  # Verified by league admin

class PlayerRanking(BaseModel):
    id: str
    player_id: str
    player_name: str
    player_avatar: Optional[str] = None
    
    category: RankingCategory
    scope: RankingScope
    region: Optional[str] = None  # Country, state, or league_id
    
    rank: int
    points: float
    previous_rank: Optional[int] = None
    rank_change: int = 0  # +5, -2, etc.
    
    # Key stats for this ranking
    key_stat_value: float
    key_stat_label: str  # "Batting Avg", "Wickets", etc.
    
    stats: PlayerStats
    
    is_verified: bool = False
    updated_at: datetime

class RankingConfig(BaseModel):
    """Configuration for ranking calculations"""
    category: RankingCategory
    scope: RankingScope
    region: Optional[str] = None
    
    # Weighting factors
    weight_recent_form: float = 0.4
    weight_overall_stats: float = 0.3
    weight_match_impact: float = 0.2
    weight_opposition_quality: float = 0.1
    
    # Filters
    min_matches: int = 5
    max_age: Optional[int] = None  # For emerging rankings
    
    updated_at: datetime
