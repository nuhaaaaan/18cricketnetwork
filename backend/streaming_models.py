"""
Live Streaming, AI DRS, and Highlights System Models
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class StreamStatus(str, Enum):
    IDLE = "idle"
    STARTING = "starting"
    LIVE = "live"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"

class StreamQuality(str, Enum):
    LOW = "480p"
    MEDIUM = "720p"
    HIGH = "1080p"
    ULTRA = "4K"

class CameraAngle(str, Enum):
    MAIN = "main"
    SQUARE_LEG = "square_leg"
    THIRD_MAN = "third_man"
    STUMP_CAM = "stump_cam"
    DRONE = "drone"
    BOUNDARY = "boundary"
    PAVILION = "pavilion"

class HighlightType(str, Enum):
    FOUR = "four"
    SIX = "six"
    WICKET = "wicket"
    FIFTY = "fifty"
    CENTURY = "century"
    MAIDEN = "maiden_over"
    BIG_OVER = "big_over"
    CLOSE_FINISH = "close_finish"
    HAT_TRICK = "hat_trick"
    RUN_OUT = "run_out"
    CATCH = "catch"
    SUPER_OVER = "super_over"

class DRSDecision(str, Enum):
    PENDING = "pending"
    OUT = "out"
    NOT_OUT = "not_out"
    UMPIRES_CALL = "umpires_call"

class StreamSource(BaseModel):
    """Video stream source configuration"""
    id: str
    camera_angle: CameraAngle
    input_url: str  # RTMP/SRT URL
    device_type: str  # "mobile", "camera", "drone"
    device_id: Optional[str] = None
    is_active: bool = True
    quality: StreamQuality = StreamQuality.HIGH

class MatchStream(BaseModel):
    """Live stream for a match"""
    id: str
    match_id: str
    match_title: str
    
    # Stream configuration
    sources: List[StreamSource] = []
    primary_source_id: str
    
    # Streaming URLs
    rtmp_ingest_url: str
    rtmp_key: str
    hls_playlist_url: Optional[str] = None
    dash_manifest_url: Optional[str] = None
    
    # Qualities available
    available_qualities: List[StreamQuality] = []
    
    # Status
    status: StreamStatus = StreamStatus.IDLE
    viewer_count: int = 0
    peak_viewers: int = 0
    
    # Storage
    recording_enabled: bool = True
    recording_urls: Dict[str, str] = {}  # {"1080p": "s3://...", "720p": "s3://..."}
    
    # Analytics
    total_watch_time_minutes: int = 0
    bitrate_kbps: int = 0
    latency_ms: int = 0
    
    # Metadata
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class StreamOverlay(BaseModel):
    """Real-time score overlay data"""
    match_id: str
    
    # Current score
    batting_team: str
    bowling_team: str
    score: str  # "165/4"
    overs: str  # "15.2"
    
    # Current batsmen
    striker: Dict[str, Any]  # {"name": "", "runs": 45, "balls": 32, "sr": 140.6}
    non_striker: Dict[str, Any]
    
    # Current bowler
    bowler: Dict[str, Any]  # {"name": "", "overs": "3.2", "wickets": 2, "runs": 28}
    
    # Match context
    run_rate: float
    required_run_rate: Optional[float] = None
    target: Optional[int] = None
    balls_remaining: Optional[int] = None
    
    # Last ball
    last_ball_runs: int = 0
    last_ball_extras: Optional[str] = None
    
    # Timestamp for sync
    timestamp: datetime

class BallTracking(BaseModel):
    """Ball-by-ball video tracking"""
    id: str
    match_id: str
    stream_id: str
    
    # Ball identification
    over: int
    ball: int
    
    # Video timestamps per camera
    camera_clips: Dict[str, Dict] = {}  # {"main": {"start": 123.45, "end": 130.2, "url": "..."}}
    
    # Ball outcome
    runs_scored: int
    extras: Optional[str] = None
    is_wicket: bool = False
    wicket_type: Optional[str] = None
    
    # AI analysis (when available)
    ball_speed_kmph: Optional[float] = None
    ball_trajectory: Optional[List[Dict]] = None  # 3D coordinates
    impact_point: Optional[Dict] = None
    pitched_location: Optional[Dict] = None
    
    # DRS data
    drs_requested: bool = False
    drs_decision: Optional[DRSDecision] = None
    
    # Metadata
    created_at: datetime

class DRSReview(BaseModel):
    """DRS review request"""
    id: str
    match_id: str
    ball_tracking_id: str
    
    # Request details
    requested_by: str  # "batting_team" or "bowling_team"
    umpire_decision: str  # "out" or "not_out"
    
    # Video clips
    clips: List[Dict] = []  # Camera angles with timestamps
    
    # Analysis
    ball_tracking_data: Optional[Dict] = None
    ultra_edge_data: Optional[Dict] = None
    impact_analysis: Optional[Dict] = None
    
    # Decision
    final_decision: Optional[DRSDecision] = None
    decision_reason: Optional[str] = None
    
    # Status
    is_completed: bool = False
    
    # Metadata
    requested_at: datetime
    completed_at: Optional[datetime] = None

class HighlightClip(BaseModel):
    """Individual highlight clip"""
    id: str
    match_id: str
    stream_id: str
    
    # Clip details
    highlight_type: HighlightType
    title: str
    description: Optional[str] = None
    
    # Video
    video_url: str
    thumbnail_url: str
    duration_seconds: float
    
    # Ball reference
    over: Optional[int] = None
    ball: Optional[int] = None
    
    # Context
    batsman: Optional[str] = None
    bowler: Optional[str] = None
    runs_scored: Optional[int] = None
    
    # AI analysis
    excitement_score: float = 0.0  # 0-100
    
    # Stats
    views: int = 0
    likes: int = 0
    shares: int = 0
    
    # Metadata
    created_at: datetime

class HighlightPlaylist(BaseModel):
    """Collection of highlights"""
    id: str
    match_id: str
    
    # Playlist details
    playlist_type: str  # "short", "extended", "custom"
    title: str
    description: Optional[str] = None
    
    # Clips
    clip_ids: List[str] = []
    total_duration_seconds: float = 0.0
    
    # Video
    compiled_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    
    # Stats
    views: int = 0
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class AIAnalytics(BaseModel):
    """AI-generated match analytics"""
    id: str
    match_id: str
    
    # 3D Visualizations data
    wagon_wheel_data: Dict[str, Any] = {}  # 3D coordinates and runs
    pitch_map_data: Dict[str, Any] = {}  # Ball landing positions
    manhattan_chart_data: List[Dict] = []  # Over-by-over runs
    
    # Ball trajectory data (for visualization)
    ball_trajectories: List[Dict] = []
    
    # Speed analytics
    bowling_speeds: Dict[str, List[float]] = {}  # {"bowler_name": [speeds]}
    fastest_ball: Optional[Dict] = None
    slowest_ball: Optional[Dict] = None
    
    # Pattern detection
    key_partnerships: List[Dict] = []
    momentum_shifts: List[Dict] = []
    pressure_moments: List[Dict] = []
    
    # Predictions
    win_probability: Optional[Dict] = None  # Real-time prediction
    
    # Metadata
    generated_at: datetime
    updated_at: datetime

class UserLibrary(BaseModel):
    """User's personal vault of saved matches/highlights"""
    id: str
    user_id: str
    
    # Saved items
    saved_matches: List[str] = []  # match_ids
    saved_highlights: List[str] = []  # highlight_clip_ids
    bookmarked_moments: List[Dict] = []  # {"match_id": "", "timestamp": 0}
    
    # Premium features
    is_premium: bool = False
    storage_limit_gb: float = 5.0
    storage_used_gb: float = 0.0
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class StreamHealth(BaseModel):
    """Real-time stream health metrics"""
    stream_id: str
    timestamp: datetime
    
    # Performance metrics
    bitrate_kbps: int
    framerate: float
    dropped_frames: int
    buffer_health: float  # 0-100%
    
    # Network
    latency_ms: int
    jitter_ms: int
    packet_loss_percent: float
    
    # Viewers
    current_viewers: int
    viewer_locations: Dict[str, int] = {}  # {"country": count}
    
    # Errors
    error_count: int = 0
    last_error: Optional[str] = None
