"""
Extended Feature Models
CV builder, job board, trainers directory, etc.
"""

from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

class ExperienceLevel(str, Enum):
    SCHOOL = "school"
    CLUB = "club"
    STATE = "state"
    DOMESTIC = "domestic"
    INTERNATIONAL = "international"

class PlayerCV(BaseModel):
    """Player portfolio/CV"""
    id: str
    player_id: str
    
    # Personal info
    full_name: str
    date_of_birth: date
    nationality: str
    current_location: str
    
    # Cricket profile
    playing_role: str
    batting_style: str
    bowling_style: Optional[str] = None
    experience_level: ExperienceLevel
    
    # Career highlights
    career_summary: str
    achievements: List[str] = []
    
    # Statistics
    stats_summary: Dict[str, Any] = {}
    
    # Media
    profile_photo: Optional[str] = None
    highlight_videos: List[str] = []
    
    # Teams & leagues
    teams_played_for: List[Dict[str, str]] = []  # [{"name": "", "year": "", "role": ""}]
    
    # Certifications
    certifications: List[str] = []
    
    # Preferences
    preferred_formats: List[str] = []
    preferred_regions: List[str] = []
    available_for_trials: bool = True
    
    # Metadata
    shareable_link: str
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class JobCategory(str, Enum):
    UMPIRE = "umpire"
    SCORER = "scorer"
    COACH = "coach"
    MANAGER = "manager"
    CONTENT_CREATOR = "content_creator"
    YOUTH_PROGRAM = "youth_program"
    OTHER = "other"

class JobPosting(BaseModel):
    id: str
    posted_by_id: str  # user_id or league_id
    posted_by_name: str
    posted_by_type: str  # "league", "academy", "company"
    
    title: str
    category: JobCategory
    description: str
    requirements: List[str] = []
    
    location: str
    is_remote: bool = False
    
    compensation: Optional[str] = None
    employment_type: str  # "full-time", "part-time", "contract", "volunteer"
    
    application_deadline: Optional[datetime] = None
    
    contact_email: Optional[EmailStr] = None
    application_link: Optional[str] = None
    
    # Stats
    views_count: int = 0
    applications_count: int = 0
    
    status: str = "active"  # "active", "filled", "closed"
    
    created_at: datetime
    updated_at: datetime

class JobApplication(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    applicant_name: str
    
    cover_letter: str
    resume_url: Optional[str] = None
    cv_id: Optional[str] = None  # Link to PlayerCV
    
    status: str = "pending"  # "pending", "reviewed", "shortlisted", "rejected", "hired"
    
    applied_at: datetime
    updated_at: datetime

class TrainerProfile(BaseModel):
    """Coach/Trainer directory"""
    id: str
    user_id: str
    
    name: str
    specialization: List[str] = []  # ["batting", "bowling", "fitness", "fielding"]
    experience_years: int
    
    bio: str
    certifications: List[str] = []
    
    # Availability
    location: str
    available_for_travel: bool = False
    session_types: List[str] = []  # ["1-on-1", "group", "academy"]
    
    # Pricing
    pricing: Dict[str, float] = {}  # {"per_hour": 100, "per_session": 150}
    
    # Social proof
    rating: float = 0.0
    reviews_count: int = 0
    students_trained: int = 0
    
    # Media
    profile_photo: Optional[str] = None
    video_intro: Optional[str] = None
    
    # Contact
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    whatsapp: Optional[str] = None
    
    # Verification
    is_verified: bool = False
    
    created_at: datetime
    updated_at: datetime

class TrainerBooking(BaseModel):
    id: str
    trainer_id: str
    student_id: str
    
    session_type: str
    session_date: datetime
    duration_minutes: int
    
    location: str
    notes: Optional[str] = None
    
    amount: float
    payment_status: str = "pending"  # "pending", "paid", "refunded"
    
    status: str = "pending"  # "pending", "confirmed", "completed", "cancelled"
    
    created_at: datetime
    updated_at: datetime

class Event(BaseModel):
    """Tournament/Event discovery"""
    id: str
    organizer_id: str
    organizer_name: str
    
    name: str
    description: str
    event_type: str  # "tournament", "clinic", "trial", "camp"
    format: str  # "T20", "ODI", "Test", "Box Cricket"
    
    start_date: datetime
    end_date: datetime
    
    location: str
    venue_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Registration
    registration_open: bool = True
    registration_deadline: Optional[datetime] = None
    registration_fee: Optional[float] = None
    max_teams: Optional[int] = None
    teams_registered: int = 0
    
    # Prizes
    prize_money: Optional[str] = None
    
    # Media
    poster_image: Optional[str] = None
    
    # Contact
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    
    # Stats
    views_count: int = 0
    
    status: str = "upcoming"  # "upcoming", "ongoing", "completed", "cancelled"
    
    created_at: datetime
    updated_at: datetime
