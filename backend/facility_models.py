"""
Facility Booking System Models
Complete booking, coordination, and payment system
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, time
from enum import Enum

class SportType(str, Enum):
    CRICKET = "cricket"
    FOOTBALL = "football"
    BASKETBALL = "basketball"
    TENNIS = "tennis"
    BADMINTON = "badminton"
    VOLLEYBALL = "volleyball"

class CourtType(str, Enum):
    TURF = "turf"
    MAT = "mat"
    CONCRETE = "concrete"
    GRASS = "grass"
    INDOOR = "indoor"
    CAGE = "cage"

class SlotStatus(str, Enum):
    AVAILABLE = "available"
    SOFT_HOLD = "soft_hold"
    RESERVED = "reserved"
    PAID = "paid"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class BookingStatus(str, Enum):
    PENDING_PAYMENT = "pending_payment"
    SOFT_HOLD = "soft_hold"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    COMPLETED = "completed"

class SessionType(str, Enum):
    PRACTICE = "practice"
    MATCH = "match"
    TRAINING = "training"
    TOURNAMENT = "tournament"

class ParticipantStatus(str, Enum):
    INVITED = "invited"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    TENTATIVE = "tentative"
    CONFIRMED = "confirmed"

class ParticipantRole(str, Enum):
    ORGANIZER = "organizer"
    PLAYER = "player"
    KEEPER = "keeper"
    BOWLER = "bowler"
    BATSMAN = "batsman"
    ALL_ROUNDER = "all_rounder"

class PricingRule(BaseModel):
    """Pricing configuration for slots"""
    slot_type: str  # "weekday_morning", "weekend_evening", etc.
    price_per_hour: float
    price_per_session: Optional[float] = None
    min_booking_hours: float = 1.0
    max_booking_hours: float = 4.0

class Court(BaseModel):
    """Individual court/ground within a facility"""
    id: str
    name: str
    court_type: CourtType
    description: Optional[str] = None
    size: Optional[str] = None  # "22 yards", "full size", etc.
    capacity: int = 22
    features: List[str] = []  # ["lights", "nets", "scoreboard"]
    images: List[str] = []
    is_active: bool = True

class Facility(BaseModel):
    """Sports facility/ground"""
    id: str
    owner_id: str
    owner_name: str
    
    # Basic info
    name: str
    description: str
    address: str
    city: str
    state: str
    country: str
    zip_code: Optional[str] = None
    
    # Location
    latitude: float
    longitude: float
    timezone: str = "UTC"
    
    # Facility details
    sports_supported: List[SportType]
    courts: List[Court] = []
    images: List[str] = []
    
    # Pricing
    default_pricing: Dict[str, float] = {}  # {"hourly": 1000, "session": 5000}
    pricing_rules: List[PricingRule] = []
    
    # Booking rules
    deposit_percentage: int = Field(default=20, ge=0, le=50)
    free_reservation_min_hours: int = 1
    free_reservation_max_hours: int = 3
    advance_booking_days: int = 30
    cancellation_hours: int = 24
    
    # Features
    amenities: List[str] = []  # ["parking", "changing_rooms", "cafe"]
    equipment_available: List[str] = []  # ["balls", "bats", "stumps"]
    
    # Contact
    contact_phone: str
    contact_email: Optional[str] = None
    website: Optional[str] = None
    
    # Status
    is_verified: bool = False
    is_active: bool = True
    rating: float = 0.0
    reviews_count: int = 0
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class TimeSlot(BaseModel):
    """Bookable time slot"""
    id: str
    facility_id: str
    court_id: str
    
    # Timing
    date: str  # YYYY-MM-DD
    start_time: time
    end_time: time
    duration_hours: float
    
    # Pricing
    price: float
    deposit_required: float
    deposit_percentage: int
    
    # Status
    status: SlotStatus = SlotStatus.AVAILABLE
    max_participants: int = 22
    current_participants: int = 0
    
    # Booking reference
    booking_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Soft hold tracking
    held_by: Optional[str] = None
    held_at: Optional[datetime] = None
    hold_expires_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class Booking(BaseModel):
    """Facility booking"""
    id: str
    
    # References
    facility_id: str
    facility_name: str
    court_id: str
    court_name: str
    slot_id: str
    session_id: Optional[str] = None
    
    # Organizer
    organizer_id: str
    organizer_name: str
    organizer_phone: str
    organizer_email: Optional[str] = None
    
    # Timing
    booking_date: str  # YYYY-MM-DD
    start_time: time
    end_time: time
    duration_hours: float
    
    # Pricing
    total_price: float
    deposit_amount: float
    deposit_percentage: int
    remaining_amount: float
    tax_amount: float = 0.0
    final_amount: float
    
    # Payment
    payment_status: str = "pending"  # pending, partial, completed, refunded
    payment_method: Optional[str] = None
    payment_id: Optional[str] = None
    transaction_ids: List[str] = []
    
    # Status
    status: BookingStatus = BookingStatus.PENDING_PAYMENT
    
    # Special requests
    special_requests: Optional[str] = None
    notes: Optional[str] = None
    
    # Free reservation window
    is_soft_hold: bool = False
    soft_hold_expires_at: Optional[datetime] = None
    
    # Cancellation
    is_cancelled: bool = False
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    refund_amount: float = 0.0
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class Session(BaseModel):
    """Practice/Match session with group coordination"""
    id: str
    
    # Session details
    session_type: SessionType
    title: str
    description: Optional[str] = None
    
    # References
    facility_id: str
    facility_name: str
    court_id: str
    booking_id: Optional[str] = None
    
    # Organizer
    organizer_id: str
    organizer_name: str
    
    # Timing
    session_date: str  # YYYY-MM-DD
    start_time: time
    end_time: time
    
    # Participants
    min_players: int
    max_players: int
    current_players: int = 1  # Organizer counts
    participants: List[str] = []  # List of user_ids
    
    # Coordination
    chat_thread_id: Optional[str] = None
    
    # Status
    is_confirmed: bool = False
    is_cancelled: bool = False
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class SessionParticipant(BaseModel):
    """Participant in a session"""
    id: str
    session_id: str
    user_id: str
    user_name: str
    user_phone: Optional[str] = None
    
    # Role
    role: ParticipantRole
    
    # Status
    status: ParticipantStatus
    
    # Invitation
    invited_at: datetime
    responded_at: Optional[datetime] = None
    
    # Payment contribution (for split payment)
    contribution_amount: float = 0.0
    payment_status: str = "pending"  # pending, paid, refunded
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class FacilityConversation(BaseModel):
    """Communication between organizer and facility owner"""
    id: str
    facility_id: str
    booking_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Participants
    organizer_id: str
    owner_id: str
    participants: List[str] = []  # All user_ids in conversation
    
    # Status
    is_active: bool = True
    last_message_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ConversationMessage(BaseModel):
    """Message in facility conversation"""
    id: str
    conversation_id: str
    
    # Sender
    sender_id: str
    sender_name: str
    sender_type: str  # "organizer" or "owner"
    
    # Content
    message: str
    attachments: List[str] = []
    
    # Status
    is_read: bool = False
    read_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
