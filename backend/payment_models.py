# Multi-Gateway Payment System - Data Models
# Razorpay (India/UPI) + Stripe (USA/Global) + PayPal (Secondary Global)

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class PaymentGateway(str, Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    PAYPAL = "paypal"

class PaymentMethod(str, Enum):
    # Universal
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    
    # India (Razorpay)
    UPI = "upi"
    NETBANKING = "netbanking"
    WALLET = "wallet"
    
    # USA/Global (Stripe)
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    ACH = "ach"
    BANK_TRANSFER = "bank_transfer"
    
    # PayPal
    PAYPAL = "paypal"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class PaymentPurpose(str, Enum):
    MARKETPLACE_ORDER = "marketplace_order"
    GROUND_BOOKING = "ground_booking"
    PRACTICE_BOOKING = "practice_booking"
    TRAINER_BOOKING = "trainer_booking"
    GYM_MEMBERSHIP = "gym_membership"
    LEAGUE_REGISTRATION = "league_registration"
    TEAM_REGISTRATION = "team_registration"
    SEASON_FEE = "season_fee"
    UMPIRE_FEE = "umpire_fee"
    SUBSCRIPTION = "subscription"
    PREMIUM_FEATURE = "premium_feature"

class PayoutStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# ==================== PAYMENT MODELS ====================

class Payment(BaseModel):
    id: str
    order_id: str
    purpose: PaymentPurpose
    related_entity_id: str
    related_entity_type: str
    user_id: str
    user_email: str
    user_name: str
    gateway: PaymentGateway
    payment_method: PaymentMethod
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    amount_original: float
    currency_original: str
    amount_charged: float
    currency_charged: str
    exchange_rate: Optional[float] = None
    gateway_fee: float = 0.0
    platform_commission: float = 0.0
    platform_commission_percentage: float = 0.0
    vendor_amount: float = 0.0
    tax_amount: float = 0.0
    tax_percentage: float = 0.0
    status: PaymentStatus
    failure_reason: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor_type: Optional[str] = None
    description: str
    metadata: Optional[Dict[str, Any]] = None
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    webhook_received: bool = False
    webhook_data: Optional[Dict] = None
    is_refunded: bool = False
    refund_amount: float = 0.0
    refund_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
