# League Management & Finance System - Data Models
# Complete models for league operations, team finance, and payments

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# ==================== ENUMS ====================

class LeagueStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    UPCOMING = "upcoming"
    COMPLETED = "completed"

class DivisionLevel(str, Enum):
    DIVISION_1 = "division_1"
    DIVISION_2 = "division_2"
    DIVISION_3 = "division_3"
    CONFERENCE_A = "conference_a"
    CONFERENCE_B = "conference_b"
    PREMIER = "premier"
    ELITE = "elite"

class MatchFormat(str, Enum):
    T20 = "t20"
    T10 = "t10"
    ODI = "odi"
    TEST = "test"
    HUNDRED = "hundred"

class BallType(str, Enum):
    LEATHER = "leather"
    TENNIS = "tennis"
    RUBBER = "rubber"

class PaymentMethod(str, Enum):
    CASH = "cash"
    UPI = "upi"
    ZELLE = "zelle"
    VENMO = "venmo"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    CASHAPP = "cashapp"
    PAYPAL = "paypal"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    STRIPE = "stripe"

class ExpenseCategory(str, Enum):
    GROUND_FEE = "ground_fee"
    UMPIRE_FEE = "umpire_fee"
    SCORER_FEE = "scorer_fee"
    BALLS = "balls"
    NETS_PRACTICE = "nets_practice"
    UNIFORMS = "uniforms"
    EQUIPMENT = "equipment"
    TRAVEL = "travel"
    FOOD = "food"
    REGISTRATION = "registration"
    TOURNAMENT_ENTRY = "tournament_entry"
    OTHER = "other"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    REFUNDED = "refunded"

class SponsorTier(str, Enum):
    PLATINUM = "platinum"
    GOLD = "gold"
    SILVER = "silver"
    PARTNER = "partner"

# ==================== LEAGUE MODELS ====================

class League(BaseModel):
    id: str
    name: str
    short_name: Optional[str] = None
    
    # Location
    country_code: str
    country_name: str
    state_or_region: str
    city: str
    
    # Branding
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: str
    tagline: Optional[str] = None
    
    # League Info
    founded_year: int
    league_type: str  # amateur, professional, youth, women
    ball_type: BallType
    match_format: MatchFormat
    status: LeagueStatus
    
    # Admins
    admins: List[str]  # user IDs
    
    # Social & Contact
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None  # instagram, facebook, twitter
    
    # Stats
    total_teams: int = 0
    total_players: int = 0
    total_matches: int = 0
    current_season: Optional[str] = None
    
    # Settings
    currency: str = "USD"
    allow_public_view: bool = True
    enable_sponsorship: bool = True
    
    created_at: datetime
    updated_at: datetime

class Division(BaseModel):
    id: str
    league_id: str
    name: str
    level: DivisionLevel
    season: str
    teams: List[str]  # team IDs
    max_teams: int
    description: Optional[str] = None
    created_at: datetime

class Season(BaseModel):
    id: str
    league_id: str
    name: str  # e.g., "2024 Spring Season"
    start_date: date
    end_date: date
    registration_deadline: date
    registration_fee: float
    status: str  # upcoming, active, completed
    divisions: List[str]  # division IDs
    created_at: datetime

# ==================== TEAM FINANCE MODELS ====================

class TeamExpense(BaseModel):
    id: str
    team_id: str
    league_id: Optional[str] = None
    
    # Expense Details
    title: str
    description: Optional[str] = None
    category: ExpenseCategory
    total_amount: float
    currency: str = "USD"
    expense_date: date
    
    # Payment
    paid_by_user_id: str
    paid_by_name: str
    payment_method: PaymentMethod
    
    # Split Details
    split_type: str  # equal, custom, percentage
    split_among: List[str]  # user IDs
    custom_splits: Optional[Dict[str, float]] = None  # user_id: amount
    
    # Status
    payment_statuses: Dict[str, PaymentStatus]  # user_id: status
    
    # Receipt
    receipt_url: Optional[str] = None
    receipt_uploaded_at: Optional[datetime] = None
    
    # Metadata
    season: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class PlayerBalance(BaseModel):
    id: str
    team_id: str
    player_id: str
    player_name: str
    
    # Balance
    total_owed: float
    total_paid: float
    balance: float  # negative = owes money, positive = is owed
    
    # Currency
    currency: str = "USD"
    
    # History
    last_payment_date: Optional[date] = None
    payment_count: int = 0
    
    updated_at: datetime

class PaymentRecord(BaseModel):
    id: str
    expense_id: str
    team_id: str
    player_id: str
    player_name: str
    
    # Payment Details
    amount: float
    currency: str
    payment_method: PaymentMethod
    payment_date: date
    
    # Status
    status: PaymentStatus
    
    # Proof
    transaction_id: Optional[str] = None
    receipt_url: Optional[str] = None
    
    # Metadata
    notes: Optional[str] = None
    marked_paid_by: Optional[str] = None
    created_at: datetime

class TeamFinancialSummary(BaseModel):
    team_id: str
    season: str
    
    # Income
    total_collected: float
    
    # Expenses
    total_expenses: float
    
    # By Category
    expenses_by_category: Dict[ExpenseCategory, float]
    
    # Balances
    total_outstanding: float
    players_with_dues: int
    
    # Currency
    currency: str
    
    # Period
    start_date: date
    end_date: date
    generated_at: datetime

# ==================== LEAGUE PAYMENT MODELS ====================

class LeagueFee(BaseModel):
    id: str
    league_id: str
    season_id: str
    
    # Fee Details
    fee_type: str  # registration, season_fee, tournament_entry, umpire_fee
    name: str
    description: Optional[str] = None
    amount: float
    currency: str
    
    # Discounts
    early_bird_discount: Optional[float] = None
    early_bird_deadline: Optional[date] = None
    bulk_discount: Optional[float] = None  # for team registration
    
    # Payment Options
    allow_installments: bool = False
    installment_plan: Optional[List[Dict]] = None  # [{"amount": 100, "due_date": "2024-03-01"}]
    
    # Status
    is_active: bool = True
    
    created_at: datetime

class LeaguePayment(BaseModel):
    id: str
    league_id: str
    fee_id: str
    season_id: str
    
    # Payer
    payer_id: str
    payer_name: str
    payer_type: str  # player, team_captain, league_admin
    team_id: Optional[str] = None
    
    # Payment Details
    amount: float
    currency: str
    payment_method: PaymentMethod
    payment_date: datetime
    
    # Status
    status: PaymentStatus
    
    # Transaction
    transaction_id: Optional[str] = None
    payment_gateway: Optional[str] = None  # stripe, razorpay, paypal
    receipt_url: Optional[str] = None
    
    # Metadata
    notes: Optional[str] = None
    processed_by: Optional[str] = None
    created_at: datetime

class LeagueFinancialDashboard(BaseModel):
    league_id: str
    season_id: str
    
    # Revenue
    total_revenue: float
    revenue_by_type: Dict[str, float]
    
    # Collections
    total_collected: float
    total_pending: float
    collection_rate: float  # percentage
    
    # Teams
    teams_paid: int
    teams_pending: int
    
    # Players
    players_paid: int
    players_pending: int
    
    # Currency
    currency: str
    
    # Period
    season_start: date
    season_end: date
    generated_at: datetime

# ==================== SCHEDULE & RESULTS MODELS ====================

class Fixture(BaseModel):
    id: str
    league_id: str
    season_id: str
    division_id: str
    
    # Match Details
    match_number: int
    round: Optional[str] = None  # "Round 1", "Quarter Final", "Semi Final"
    
    # Teams
    team_a_id: str
    team_a_name: str
    team_b_id: str
    team_b_name: str
    
    # Venue & Time
    ground_id: str
    ground_name: str
    match_date: date
    match_time: str
    
    # Format
    format: MatchFormat
    overs: int
    
    # Status
    status: str  # scheduled, live, completed, cancelled
    
    # Result
    winner_id: Optional[str] = None
    result_summary: Optional[str] = None
    
    # Officials
    umpire_ids: Optional[List[str]] = None
    scorer_ids: Optional[List[str]] = None
    
    created_at: datetime
    updated_at: datetime

class MatchResult(BaseModel):
    id: str
    fixture_id: str
    league_id: str
    season_id: str
    
    # Teams
    team_a_id: str
    team_b_id: str
    
    # Scores
    team_a_score: str  # e.g., "185/7"
    team_b_score: str
    team_a_overs: float
    team_b_overs: float
    
    # Result
    winner_id: str
    result_type: str  # runs, wickets, tie, no_result
    result_margin: Optional[str] = None  # "by 50 runs", "by 6 wickets"
    result_summary: str
    
    # Awards
    man_of_match: Optional[str] = None  # player_id
    mom_performance: Optional[str] = None
    
    # Media
    scorecard_url: Optional[str] = None
    highlights_video_url: Optional[str] = None
    match_card_url: Optional[str] = None
    
    # Stats
    total_runs: int
    total_wickets: int
    highest_scorer: Optional[Dict] = None  # {"player_id": "", "runs": 85}
    best_bowler: Optional[Dict] = None
    
    submitted_by: str
    submitted_at: datetime

class PointsTable(BaseModel):
    league_id: str
    season_id: str
    division_id: str
    
    # Standings
    standings: List[Dict]  # [{"team_id": "", "team_name": "", "played": 10, "won": 7, ...}]
    
    # Calculation Rules
    points_for_win: int = 2
    points_for_tie: int = 1
    points_for_loss: int = 0
    
    last_updated: datetime

class PlayerStats(BaseModel):
    player_id: str
    league_id: str
    season_id: str
    team_id: str
    
    # Batting
    matches_played: int
    innings: int
    runs: int
    balls_faced: int
    highest_score: int
    average: float
    strike_rate: float
    fifties: int
    hundreds: int
    
    # Bowling
    overs_bowled: float
    wickets: int
    runs_conceded: int
    economy: float
    best_bowling: str
    
    # Fielding
    catches: int
    run_outs: int
    stumpings: int
    
    # Awards
    mom_awards: int
    
    # Power Index
    power_index: Optional[float] = None
    
    last_updated: datetime

# ==================== AWARDS & RECOGNITION ====================

class Award(BaseModel):
    id: str
    league_id: str
    season_id: str
    
    # Award Details
    award_type: str  # mom, mos, best_batsman, best_bowler, mvp, rising_star
    award_name: str
    description: Optional[str] = None
    
    # Winner
    winner_id: str
    winner_name: str
    team_id: str
    
    # Performance
    performance_stats: Optional[Dict] = None
    
    # Media
    award_image_url: Optional[str] = None
    
    # Timing
    award_date: date
    match_id: Optional[str] = None  # for match-specific awards
    
    created_at: datetime

class ChampionHistory(BaseModel):
    id: str
    league_id: str
    season_id: str
    division_id: str
    
    # Champion
    champion_team_id: str
    champion_team_name: str
    
    # Runner Up
    runner_up_team_id: Optional[str] = None
    runner_up_team_name: Optional[str] = None
    
    # Stats
    matches_played: int
    matches_won: int
    
    # Awards
    mvp_player_id: Optional[str] = None
    best_batsman_id: Optional[str] = None
    best_bowler_id: Optional[str] = None
    
    # Media
    trophy_photo_url: Optional[str] = None
    celebration_video_url: Optional[str] = None
    
    crowned_at: datetime

# ==================== SPONSORSHIP MODELS ====================

class Sponsor(BaseModel):
    id: str
    league_id: str
    
    # Sponsor Details
    sponsor_name: str
    brand_logo_url: str
    tier: SponsorTier
    
    # Contact
    website: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Contract
    contract_start: date
    contract_end: date
    sponsorship_amount: Optional[float] = None
    currency: Optional[str] = None
    
    # Display
    banner_url: Optional[str] = None
    display_on_home: bool = True
    display_on_fixtures: bool = True
    display_on_media: bool = True
    
    # Links
    promotion_url: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    
    # Status
    is_active: bool = True
    
    created_at: datetime
    updated_at: datetime

class SponsorshipProposal(BaseModel):
    id: str
    league_id: str
    
    # Proposal Details
    brand_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    
    # Offering
    proposed_tier: SponsorTier
    proposed_amount: float
    currency: str
    duration_months: int
    
    # Message
    message: str
    
    # Status
    status: str  # pending, under_review, accepted, rejected
    
    # Response
    league_response: Optional[str] = None
    responded_by: Optional[str] = None
    responded_at: Optional[datetime] = None
    
    submitted_at: datetime

# ==================== LEAGUE MEDIA ====================

class LeagueMedia(BaseModel):
    id: str
    league_id: str
    season_id: Optional[str] = None
    match_id: Optional[str] = None
    
    # Media Details
    media_type: str  # photo, video, reel, highlight
    title: str
    description: Optional[str] = None
    
    # Files
    media_url: str
    thumbnail_url: Optional[str] = None
    
    # Tags
    tags: Optional[List[str]] = None
    featured_players: Optional[List[str]] = None
    
    # Engagement
    views: int = 0
    likes: int = 0
    
    # Status
    is_featured: bool = False
    
    uploaded_by: str
    uploaded_at: datetime

# ==================== PERMISSIONS ====================

class LeaguePermission(BaseModel):
    user_id: str
    league_id: str
    role: str  # admin, moderator, team_manager, player
    
    # Permissions
    can_manage_teams: bool = False
    can_manage_schedule: bool = False
    can_manage_finance: bool = False
    can_manage_sponsors: bool = False
    can_post_updates: bool = False
    can_edit_results: bool = False
    
    granted_by: str
    granted_at: datetime
