"""
Bat Services Marketplace Models
Factories, Makers, Repair Shops - Complete Provider System
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, time
from enum import Enum

class ProviderType(str, Enum):
    FACTORY = "factory"
    BAT_MAKER = "bat_maker"
    REPAIR_SHOP = "repair_shop"
    REFURBISHER = "refurbisher"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class ServiceType(str, Enum):
    # Maintenance Services
    BAT_KNOCKING_HAND = "bat_knocking_hand"
    BAT_KNOCKING_MACHINE = "bat_knocking_machine"
    TOE_GUARD_FITTING = "toe_guard_fitting"
    HANDLE_REPLACEMENT = "handle_replacement"
    RE_HANDLE = "re_handle"
    
    # Repair Services
    PRESSING = "pressing"
    CRACK_REPAIR = "crack_repair"
    EDGE_REPAIR = "edge_repair"
    FACE_REPAIR = "face_repair"
    
    # Enhancement Services
    OIL_SEASONING = "oil_seasoning"
    ANTI_SCUFF_SHEET = "anti_scuff_sheet"
    STICKER_REPLACEMENT = "sticker_replacement"
    GRIP_REPLACEMENT = "grip_replacement"
    
    # Custom/New
    CUSTOM_BAT_ORDER = "custom_bat_order"
    REFURBISH_REBALANCE = "refurbish_rebalance"
    
    # Premium
    EXPRESS_SERVICE = "express_service"
    BAT_RESTORATION = "bat_restoration"

class DeliveryMode(str, Enum):
    WALK_IN = "walk_in"
    PICKUP_DROP = "pickup_drop"
    SHIPPING_ACCEPTED = "shipping_accepted"
    ALL_MODES = "all_modes"

class PricingModel(str, Enum):
    FIXED = "fixed"
    STARTS_FROM = "starts_from"
    PRICE_RANGE = "price_range"
    QUOTE_BASED = "quote_based"

class BookingStatus(str, Enum):
    CREATED = "created"
    AWAITING_SHIPMENT = "awaiting_shipment"
    IN_TRANSIT = "in_transit"
    RECEIVED = "received"
    IN_SERVICE = "in_service"
    COMPLETED = "completed"
    RETURN_SHIPPED = "return_shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class DisputeType(str, Enum):
    DAMAGED_BAT = "damaged_bat"
    WRONG_SERVICE = "wrong_service"
    QUALITY_ISSUE = "quality_issue"
    DELAY = "delay"
    PRICE_DISPUTE = "price_dispute"
    OTHER = "other"

class DisputeStatus(str, Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    CLOSED = "closed"

class OperatingHours(BaseModel):
    """Operating hours for a day"""
    day: str  # "monday", "tuesday", etc.
    is_open: bool = True
    open_time: Optional[time] = None
    close_time: Optional[time] = None
    is_24_hours: bool = False

class BatServiceProvider(BaseModel):
    """Bat factory, maker, or repair shop"""
    id: str
    user_id: str  # Link to user account
    
    # Business Info
    business_name: str
    provider_type: ProviderType
    owner_name: str
    
    # Location
    country: str
    state: Optional[str] = None
    city: str
    address: str
    zip_code: Optional[str] = None
    latitude: float
    longitude: float
    service_radius_km: int = 0  # 0 = no pickup/drop
    
    # Contact
    contact_email: EmailStr
    contact_phone: str
    whatsapp_number: Optional[str] = None
    website: Optional[str] = None
    
    # Business Details
    years_in_business: Optional[int] = None
    description: str
    specialization: List[str] = []  # ["english_willow", "kashmir_willow", "custom_profiles"]
    languages_supported: List[str] = ["English"]
    
    # Operating Schedule
    operating_hours: List[OperatingHours] = []
    holiday_calendar: List[str] = []  # ["2025-12-25", "2025-01-01"]
    
    # Media
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery_images: List[str] = []
    demo_videos: List[str] = []
    
    # Verification
    verification_status: VerificationStatus = VerificationStatus.PENDING
    verification_documents: List[str] = []  # URLs to uploaded docs
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Badges & Certifications
    badges: List[str] = []  # ["verified", "fast_turnaround", "premium_craftsman"]
    certifications: List[str] = []
    
    # Trust Metrics
    rating: float = 0.0
    reviews_count: int = 0
    completed_orders: int = 0
    response_time_hours: float = 24.0
    
    # Policies
    accepts_shipping: bool = False
    accepts_international: bool = False
    cancellation_policy: Optional[str] = None
    return_policy: Optional[str] = None
    warranty_offered: Optional[str] = None
    
    # Payment Settings
    default_deposit_percentage: int = Field(default=30, ge=0, le=50)
    payment_methods: List[str] = []  # ["cash", "card", "upi", "bank_transfer"]
    
    # Status
    is_active: bool = True
    is_accepting_orders: bool = True
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ServicePricing(BaseModel):
    """Pricing configuration for a service"""
    pricing_model: PricingModel
    base_price: float
    max_price: Optional[float] = None  # For price_range
    currency: str = "USD"
    
    # Variable pricing by bat type
    price_by_bat_type: Dict[str, float] = {}  # {"english_willow": 50, "kashmir_willow": 30}
    
    # Add-ons
    add_ons: List[Dict[str, Any]] = []  # [{"name": "toe_guard", "price": 10}]

class BatService(BaseModel):
    """Service offered by provider"""
    id: str
    provider_id: str
    provider_name: str
    
    # Service Details
    service_type: ServiceType
    title: str
    description: str
    
    # Pricing
    pricing: ServicePricing
    
    # Turnaround
    min_turnaround_days: int
    max_turnaround_days: int
    express_available: bool = False
    express_surcharge: Optional[float] = None
    
    # Delivery Options
    delivery_modes: List[DeliveryMode]
    
    # Portfolio
    before_after_images: List[Dict[str, str]] = []  # [{"before": "url", "after": "url"}]
    demo_videos: List[str] = []
    
    # Requirements
    requirements: List[str] = []  # ["Bring bat in person", "Include purchase invoice"]
    care_instructions: Optional[str] = None
    
    # Restrictions
    bat_types_accepted: List[str] = []  # ["english_willow", "kashmir_willow", "synthetic"]
    condition_restrictions: Optional[str] = None
    
    # Booking Settings
    deposit_percentage: int = Field(default=30, ge=0, le=50)
    advance_booking_required: bool = False
    slots_available_per_day: Optional[int] = None
    
    # Status
    is_active: bool = True
    is_featured: bool = False
    
    # Stats
    orders_completed: int = 0
    average_rating: float = 0.0
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ServiceBooking(BaseModel):
    """User booking for bat service"""
    id: str
    booking_number: str  # Auto-generated: BS-2025-001234
    
    # References
    provider_id: str
    provider_name: str
    service_id: str
    service_title: str
    user_id: str
    user_name: str
    user_phone: str
    user_email: EmailStr
    
    # Bat Details
    bat_brand: str
    bat_model: Optional[str] = None
    bat_type: str  # "english_willow", "kashmir_willow"
    bat_weight: Optional[str] = None
    purchase_date: Optional[str] = None
    current_condition: Optional[str] = None
    issue_description: str
    
    # Service Details
    selected_add_ons: List[str] = []
    special_instructions: Optional[str] = None
    
    # Pricing
    base_price: float
    add_ons_price: float = 0.0
    express_surcharge: float = 0.0
    subtotal: float
    tax_amount: float = 0.0
    total_amount: float
    
    # Deposit & Payment
    deposit_percentage: int
    deposit_amount: float
    remaining_amount: float
    deposit_paid: bool = False
    full_payment_paid: bool = False
    payment_ids: List[str] = []
    
    # Delivery
    delivery_mode: DeliveryMode
    
    # For Walk-in / Pickup
    drop_off_date: Optional[datetime] = None
    pickup_date: Optional[datetime] = None
    
    # For Shipping
    shipping_address: Optional[Dict[str, str]] = None
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    
    # Service Timeline
    estimated_completion_date: Optional[datetime] = None
    actual_completion_date: Optional[datetime] = None
    
    # Status
    status: BookingStatus = BookingStatus.CREATED
    status_history: List[Dict] = []  # [{timestamp, status, note}]
    
    # Communication
    conversation_id: Optional[str] = None
    
    # Cancellation
    is_cancelled: bool = False
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    refund_amount: float = 0.0
    
    # Completion
    completion_photos: List[str] = []
    work_notes: Optional[str] = None
    warranty_info: Optional[str] = None
    
    # Review
    reviewed: bool = False
    review_id: Optional[str] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ProviderReview(BaseModel):
    """Customer review for provider"""
    id: str
    
    # References
    provider_id: str
    booking_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    
    # Review
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    review_text: str
    
    # Aspects (optional breakdown)
    quality_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    turnaround_rating: Optional[int] = None
    value_rating: Optional[int] = None
    
    # Media
    images: List[str] = []
    
    # Provider Response
    provider_response: Optional[str] = None
    provider_responded_at: Optional[datetime] = None
    
    # Verification
    is_verified_purchase: bool = True
    
    # Stats
    helpful_count: int = 0
    
    # Status
    is_flagged: bool = False
    is_hidden: bool = False
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class Shipment(BaseModel):
    """Shipment tracking for bat services"""
    id: str
    booking_id: str
    
    # Direction
    shipment_type: str  # "to_provider" or "to_customer"
    
    # Addresses
    from_address: Dict[str, str]
    to_address: Dict[str, str]
    
    # Carrier
    carrier: Optional[str] = None  # "FedEx", "UPS", "DHL"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    
    # Package Details
    weight_kg: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None  # {length, width, height}
    declared_value: float
    insurance_amount: Optional[float] = None
    
    # Shipping Cost
    shipping_cost: float = 0.0
    paid_by: str = "customer"  # "customer" or "provider"
    
    # Timeline
    shipped_at: Optional[datetime] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    # Status Updates
    status_updates: List[Dict] = []  # [{timestamp, status, location, message}]
    current_status: str = "label_created"
    current_location: Optional[str] = None
    
    # Delivery
    delivered_to: Optional[str] = None
    signature_required: bool = False
    signature_image: Optional[str] = None
    
    # Issues
    has_issue: bool = False
    issue_description: Optional[str] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class Dispute(BaseModel):
    """Dispute/claim for service booking"""
    id: str
    dispute_number: str  # AUTO: DP-2025-001234
    
    # References
    booking_id: str
    provider_id: str
    user_id: str
    
    # Dispute Details
    dispute_type: DisputeType
    subject: str
    description: str
    
    # Evidence
    images: List[str] = []
    documents: List[str] = []
    
    # Timeline
    incident_date: Optional[datetime] = None
    
    # Resolution Request
    requested_resolution: str  # "refund", "redo_service", "compensation"
    requested_amount: Optional[float] = None
    
    # Provider Response
    provider_response: Optional[str] = None
    provider_evidence: List[str] = []
    provider_responded_at: Optional[datetime] = None
    
    # Admin Review
    assigned_to: Optional[str] = None  # Admin user_id
    admin_notes: Optional[str] = None
    
    # Status
    status: DisputeStatus = DisputeStatus.OPEN
    priority: str = "medium"  # low, medium, high, urgent
    
    # Resolution
    resolution: Optional[str] = None
    resolution_details: Optional[str] = None
    refund_amount: float = 0.0
    resolved_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ProviderBadge(BaseModel):
    """Badge/certification for providers"""
    id: str
    badge_type: str  # "verified", "fast_turnaround", "premium_craftsman"
    name: str
    description: str
    icon_url: str
    
    # Eligibility Criteria
    criteria: Dict[str, Any] = {}
    # e.g., {"min_rating": 4.5, "min_orders": 100, "response_time_hours": 24}
    
    # Display
    color: str = "#DC2626"
    display_order: int = 0

class ProviderAnalytics(BaseModel):
    """Analytics for provider dashboard"""
    provider_id: str
    period: str  # "daily", "weekly", "monthly"
    start_date: datetime
    end_date: datetime
    
    # Orders
    total_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0
    in_progress_bookings: int = 0
    
    # Revenue
    total_revenue: float = 0.0
    deposits_collected: float = 0.0
    remaining_payments: float = 0.0
    
    # Performance
    average_turnaround_days: float = 0.0
    on_time_completion_rate: float = 0.0
    
    # Customer Satisfaction
    average_rating: float = 0.0
    new_reviews: int = 0
    
    # Traffic
    profile_views: int = 0
    service_views: int = 0
    conversion_rate: float = 0.0
    
    # Generated
    generated_at: datetime

class SavedProvider(BaseModel):
    """User's saved/favorite providers"""
    id: str
    user_id: str
    provider_id: str
    provider_name: str
    notes: Optional[str] = None
    created_at: datetime

class ProviderSubscription(BaseModel):
    """Premium subscription for providers"""
    id: str
    provider_id: str
    
    # Plan
    plan_type: str  # "basic", "pro", "enterprise"
    plan_name: str
    
    # Features
    features: List[str] = []
    max_services: int = 10
    featured_placement: bool = False
    priority_support: bool = False
    
    # Billing
    price_per_month: float
    billing_cycle: str = "monthly"  # monthly, quarterly, annual
    
    # Status
    is_active: bool = True
    auto_renew: bool = True
    
    # Timeline
    started_at: datetime
    expires_at: datetime
    last_payment_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime
