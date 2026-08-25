"""
18 Cricket Network — Coaching Marketplace.

A production-oriented coaching marketplace layered cleanly on top of the existing
FastAPI + MongoDB (motor) architecture. It is exposed as an APIRouter that is
mounted by ``server.py`` next to the legacy routes, so nothing existing is removed.

Design principles enforced here:
  * REAL data only. Discovery returns APPROVED coaches from ``coach_profiles``;
    there is no seeding of fake coaches, certifications, reviews or sessions.
  * Strict role-based approval. A user only becomes a COACH once an admin
    approves the application. Only APPROVED coaches are ever public.
  * Configurable commercials. The platform fee lives in a config document and is
    NOT hard-coded. Default fee type is ``none`` until commercial terms are set.
  * Secure documents. Certificate files never live inside MongoDB — only metadata
    plus a storage key does. Files are served through authenticated / signed
    access, validated by MIME + magic bytes + size.
  * Auditability. Every administrative and lifecycle mutation is written to an
    append-only audit log, and notification events are queued.

The public factory is :func:`create_coaching_router` plus
:func:`ensure_coaching_indexes`.
"""

from __future__ import annotations

import os
import uuid
import mimetypes
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import jwt
from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, EmailStr, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).resolve().parent
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Private, non-public storage location for uploaded credential documents.
# Kept OUTSIDE any web-served / public path and ignored by git.
UPLOAD_DIR = Path(os.environ.get("COACH_UPLOAD_DIR", str(ROOT_DIR / "private_uploads")))

# Optional S3 backend. When these are configured the storage layer transparently
# switches to signed S3 uploads/downloads; otherwise private local disk is used.
S3_BUCKET = os.environ.get("COACH_S3_BUCKET", "").strip()
S3_REGION = os.environ.get("AWS_REGION", os.environ.get("COACH_S3_REGION", "")).strip()

MAX_FILE_BYTES = int(os.environ.get("COACH_MAX_FILE_BYTES", str(10 * 1024 * 1024)))  # 10 MB

# extension/mime -> canonical mime. Extension alone is never trusted; the magic
# bytes below are also checked.
ALLOWED_MIME = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
}

MAGIC_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
}

# ---------------------------------------------------------------------------
# Taxonomy / enumerations (kept as plain data so the frontend can render them)
# ---------------------------------------------------------------------------

COACH_STATUSES = [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "NEEDS_INFORMATION",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
]

CERT_STATUSES = [
    "PENDING",
    "UNDER_REVIEW",
    "VERIFIED",
    "REJECTED",
    "EXPIRED",
    "NEEDS_INFORMATION",
]

SESSION_STATUSES = [
    "REQUESTED",
    "PENDING_PAYMENT",
    "CONFIRMED",
    "DECLINED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
    "REFUNDED",
]

SAFETY_STATUSES = ["NOT_REQUESTED", "PENDING", "VERIFIED", "FAILED", "EXPIRED"]

EXPERIENCE_VERIFICATION = ["SELF_REPORTED", "ORGANIZATION_VERIFIED", "PLATFORM_VERIFIED"]

SESSION_FORMATS = [
    "ONE_ON_ONE",
    "GROUP",
    "VIRTUAL_ONE_ON_ONE",
    "VIRTUAL_GROUP",
    "IN_PERSON_ONE_ON_ONE",
    "IN_PERSON_GROUP",
    "MINDSET_ONE_ON_ONE",
    "MINDSET_GROUP",
]

DURATIONS = [30, 45, 60, 90, 120]

# Suggested currencies — not a hard restriction; currency is configurable per price.
CURRENCIES = ["USD", "GBP", "EUR", "AUD", "INR", "AED", "CAD", "NZD", "ZAR"]

AGE_GROUPS = ["Kids", "Youth", "High School", "College", "Adult", "Semi-professional", "Professional"]
PLAYER_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"]
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

SERVICE_TAXONOMY = [
    {
        "category": "TECHNIQUE",
        "label": "Technique",
        "subcategories": ["Batting", "Fast Bowling", "Spin Bowling", "Fielding", "Wicketkeeping"],
    },
    {
        "category": "PERFORMANCE",
        "label": "Performance",
        "subcategories": ["Strength & Conditioning", "Fitness", "Performance Analysis"],
    },
    {
        "category": "TACTICAL",
        "label": "Tactical",
        "subcategories": ["Match Strategy", "Captaincy", "Game Awareness"],
    },
    {
        "category": "MINDSET",
        "label": "Mindset",
        "subcategories": [
            "Mental Performance",
            "Confidence",
            "Pressure Management",
            "Focus",
            "Match Preparation",
        ],
    },
    {
        "category": "OTHER",
        "label": "Other",
        "subcategories": ["Custom (subject to approval)"],
    },
]
VALID_CATEGORIES = {t["category"] for t in SERVICE_TAXONOMY}

DEFAULT_FEE_CONFIG = {
    "id": "default",
    "coachPlatformFeeType": "none",  # percentage | flat | none — intentionally not hard-coded
    "coachPlatformFeeValue": 0.0,
    "coachPlatformFeeCurrency": "USD",
    "coachPlatformFeeEffectiveDate": None,
    "paymentProcessorFeeType": "none",
    "paymentProcessorFeeValue": 0.0,
    "taxType": "none",
    "taxValue": 0.0,
    "note": "Platform fee is not finalised. Coaches will be informed before paid bookings activate.",
    "updatedAt": None,
    "updatedBy": None,
}


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------


class CoachProfileUpdate(BaseModel):
    """Partial update used for autosave / multi-step onboarding. All optional."""

    onboardingStep: Optional[int] = None
    legalFullName: Optional[str] = None
    displayName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    profilePhoto: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    headline: Optional[str] = None
    bio: Optional[str] = None
    coachingPhilosophy: Optional[str] = None
    yearsCoaching: Optional[int] = None
    yearsPlaying: Optional[int] = None
    primaryRole: Optional[str] = None
    languages: Optional[List[str]] = None
    ageGroups: Optional[List[str]] = None
    playerLevels: Optional[List[str]] = None
    specializations: Optional[List[str]] = None

    virtualAvailable: Optional[bool] = None
    inPersonAvailable: Optional[bool] = None
    travelRadiusKm: Optional[float] = None
    canTravelToPlayer: Optional[bool] = None
    playerTravelsToCoach: Optional[bool] = None
    customLocationAllowed: Optional[bool] = None
    preferredFacilities: Optional[List[str]] = None

    # Virtual meeting configuration (private; never exposed publicly)
    meetingProvider: Optional[str] = None
    meetingUrl: Optional[str] = None
    meetingId: Optional[str] = None
    meetingPassword: Optional[str] = None
    virtualInstructions: Optional[str] = None

    # Policies & agreements
    cancellationPolicy: Optional[str] = None
    agreedTerms: Optional[bool] = None
    agreedCoachAgreement: Optional[bool] = None
    agreedSafeguarding: Optional[bool] = None
    agreedFeeDisclosure: Optional[bool] = None
    confirmedAccurate: Optional[bool] = None
    understoodNoGuarantee: Optional[bool] = None


class CoachServiceInput(BaseModel):
    category: str
    subcategory: Optional[str] = None
    title: str
    description: Optional[str] = ""
    virtualAvailable: bool = False
    inPersonAvailable: bool = False
    active: bool = True


class CoachPricingInput(BaseModel):
    serviceId: Optional[str] = None
    sessionType: str
    durationMinutes: int = 60
    currency: str = "USD"
    price: float = 0.0
    pricePerPerson: Optional[float] = None
    minimumParticipants: int = 1
    maximumParticipants: int = 1
    locationType: str = "virtual"  # virtual | in_person | hybrid
    active: bool = True


class CoachExperienceInput(BaseModel):
    currentOrganization: Optional[str] = None
    previousOrganizations: List[str] = []
    teamsCoached: List[str] = []
    academies: List[str] = []
    clubs: List[str] = []
    years: Optional[int] = None
    position: Optional[str] = None
    playingHistory: Optional[str] = None
    leagueExperience: Optional[str] = None
    tournamentExperience: Optional[str] = None
    professionalExperience: Optional[str] = None
    notableAchievements: Optional[str] = None
    references: List[Dict[str, Any]] = []
    verificationLevel: str = "SELF_REPORTED"


class AvailabilitySlot(BaseModel):
    dayOfWeek: str
    startTime: str  # "09:00"
    endTime: str  # "13:00"
    locationType: str = "virtual"
    active: bool = True


class AvailabilityInput(BaseModel):
    timezone: str = "UTC"
    slots: List[AvailabilitySlot] = []
    bookingLeadTimeHours: int = 24
    maxBookingWindowDays: int = 60
    minCancellationNoticeHours: int = 24


class BlockedDateInput(BaseModel):
    date: str
    reason: Optional[str] = None


class BookingInput(BaseModel):
    coachId: str
    serviceId: Optional[str] = None
    pricingId: Optional[str] = None
    sessionType: str
    deliveryMode: str = "virtual"  # virtual | in_person
    scheduledStart: datetime
    durationMinutes: int = 60
    participants: int = 1
    location: Optional[str] = None
    notes: Optional[str] = None


class FeeConfigInput(BaseModel):
    coachPlatformFeeType: str = "none"
    coachPlatformFeeValue: float = 0.0
    coachPlatformFeeCurrency: str = "USD"
    coachPlatformFeeEffectiveDate: Optional[str] = None
    paymentProcessorFeeType: str = "none"
    paymentProcessorFeeValue: float = 0.0
    taxType: str = "none"
    taxValue: float = 0.0
    note: Optional[str] = None


class AdminActionInput(BaseModel):
    reason: Optional[str] = None
    note: Optional[str] = None


class ReviewInput(BaseModel):
    sessionId: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    text: str = ""


# ---------------------------------------------------------------------------
# Storage layer (secure credential documents)
# ---------------------------------------------------------------------------


class StorageError(Exception):
    pass


def _sniff_type(content: bytes, declared_mime: str) -> str:
    """Return canonical short type (pdf/jpg/png) using magic bytes; raise on mismatch."""
    canonical = ALLOWED_MIME.get(declared_mime)
    for short, sigs in MAGIC_SIGNATURES.items():
        if any(content.startswith(sig) for sig in sigs):
            if canonical and canonical != short:
                # Declared MIME disagrees with real content — reject.
                raise StorageError("File content does not match its declared type.")
            return short
    raise StorageError("Unsupported or corrupt file. Allowed types: PDF, JPG, PNG.")


def _s3_client():
    import boto3  # local import so the dependency is optional

    return boto3.client("s3", region_name=S3_REGION or None)


def store_document(content: bytes, short_type: str, coach_id: str) -> Dict[str, Any]:
    """Persist bytes to private storage. Returns provider + storageKey metadata only."""
    key = f"coach-certifications/{coach_id}/{uuid.uuid4().hex}.{short_type}"
    if S3_BUCKET:
        client = _s3_client()
        content_type = next((m for m, s in ALLOWED_MIME.items() if s == short_type), "application/octet-stream")
        client.put_object(Bucket=S3_BUCKET, Key=key, Body=content, ContentType=content_type, ACL="private")
        return {"storageProvider": "s3", "storageKey": key}
    # Local private disk fallback.
    dest = UPLOAD_DIR / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    return {"storageProvider": "local", "storageKey": key}


def open_document(provider: str, storage_key: str):
    """Return (iterator/file, media_type) for streaming a stored document."""
    media_type = mimetypes.guess_type(storage_key)[0] or "application/octet-stream"
    if provider == "s3":
        client = _s3_client()
        obj = client.get_object(Bucket=S3_BUCKET, Key=storage_key)
        return obj["Body"], media_type
    path = UPLOAD_DIR / storage_key
    if not path.exists():
        raise StorageError("Stored document not found.")
    return path, media_type


def make_file_token(cert_id: str, user_id: str) -> str:
    payload = {
        "purpose": "coach_cert_file",
        "cert_id": cert_id,
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=15),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_file_token(token: str, cert_id: str) -> bool:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return False
    return payload.get("purpose") == "coach_cert_file" and payload.get("cert_id") == cert_id


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def _clean(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc


def _now() -> datetime:
    return datetime.utcnow()


def is_admin(user: Dict[str, Any]) -> bool:
    roles = user.get("roles") or []
    return user.get("user_type") == "admin" or "admin" in roles or "platform_admin" in roles


PUBLIC_PROFILE_FIELDS = [
    "id",
    "displayName",
    "headline",
    "bio",
    "coachingPhilosophy",
    "profilePhoto",
    "city",
    "state",
    "country",
    "latitude",
    "longitude",
    "travelRadiusKm",
    "virtualAvailable",
    "inPersonAvailable",
    "yearsCoaching",
    "yearsPlaying",
    "primaryRole",
    "languages",
    "ageGroups",
    "playerLevels",
    "specializations",
    "averageRating",
    "reviewCount",
    "badges",
    "publishedAt",
]


def public_profile_view(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Strip every private / sensitive field before exposing a coach publicly."""
    view = {k: profile.get(k) for k in PUBLIC_PROFILE_FIELDS}
    view["badges"] = compute_badges(profile)
    return view


def compute_badges(profile: Dict[str, Any]) -> List[str]:
    """Only emit a badge when its verification is genuinely complete. Never faked."""
    badges: List[str] = []
    if profile.get("status") == "APPROVED":
        badges.append("18 Cricket Verified Coach")
    if profile.get("identityVerificationStatus") == "VERIFIED":
        badges.append("Identity Verified")
    if profile.get("backgroundCheckStatus") == "VERIFIED":
        badges.append("Background Check Verified")
    if profile.get("safeguardingStatus") == "VERIFIED":
        badges.append("Safeguarding Verified")
    if profile.get("hasVerifiedCertification"):
        badges.append("Certification Verified")
    return badges


NOTIFICATION_EVENTS = {
    "APPLICATION_SUBMITTED",
    "APPLICATION_UNDER_REVIEW",
    "MORE_INFORMATION_REQUESTED",
    "CERTIFICATION_VERIFIED",
    "CERTIFICATION_REJECTED",
    "COACH_APPROVED",
    "COACH_REJECTED",
    "COACH_SUSPENDED",
    "COACH_RESTORED",
    "BOOKING_REQUESTED",
    "BOOKING_CONFIRMED",
    "BOOKING_CANCELLED",
    "SESSION_REMINDER",
    "SESSION_COMPLETED",
    "REVIEW_REQUEST",
}


# ---------------------------------------------------------------------------
# Router factory
# ---------------------------------------------------------------------------


def create_coaching_router(db, get_current_user):
    """Build the coaching-marketplace router bound to the shared db + auth dep."""

    router = APIRouter(prefix="/api", tags=["coaching-marketplace"])

    # -- internal helpers that need db -------------------------------------

    async def audit(actor_id, action, entity_type, entity_id, old=None, new=None, metadata=None):
        await db.coach_audit_log.insert_one(
            {
                "id": str(uuid.uuid4()),
                "actorId": actor_id,
                "action": action,
                "entityType": entity_type,
                "entityId": entity_id,
                "oldValue": old,
                "newValue": new,
                "metadata": metadata or {},
                "timestamp": _now(),
            }
        )

    async def notify(user_id, event, data=None):
        if event not in NOTIFICATION_EVENTS:
            return
        await db.coach_notifications.insert_one(
            {
                "id": str(uuid.uuid4()),
                "userId": user_id,
                "event": event,
                "data": data or {},
                "read": False,
                "createdAt": _now(),
            }
        )

    async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
        if not is_admin(current_user):
            raise HTTPException(status_code=403, detail="Administrator access required.")
        return current_user

    async def get_my_profile_or_404(user_id: str) -> Dict[str, Any]:
        profile = await db.coach_profiles.find_one({"userId": user_id})
        if not profile:
            raise HTTPException(status_code=404, detail="No coach profile. Start an application first.")
        return profile

    async def refresh_cert_flag(coach_id: str):
        verified = await db.coach_certifications.count_documents(
            {"coachId": coach_id, "status": "VERIFIED"}
        )
        await db.coach_profiles.update_one(
            {"id": coach_id}, {"$set": {"hasVerifiedCertification": verified > 0}}
        )

    async def assign_role(user_id: str, role: str, is_coach: Optional[bool] = None):
        update: Dict[str, Any] = {"$addToSet": {"roles": role}}
        if is_coach is not None:
            update.setdefault("$set", {})["is_coach"] = is_coach
        try:
            await db.users.update_one({"_id": ObjectId(user_id)}, update)
        except Exception:
            # user_id may not be a valid ObjectId in some legacy rows; ignore safely
            pass

    # -- taxonomy / config -------------------------------------------------

    @router.get("/coaching/taxonomy")
    async def taxonomy():
        return {
            "serviceTaxonomy": SERVICE_TAXONOMY,
            "sessionFormats": SESSION_FORMATS,
            "durations": DURATIONS,
            "currencies": CURRENCIES,
            "ageGroups": AGE_GROUPS,
            "playerLevels": PLAYER_LEVELS,
            "daysOfWeek": DAYS_OF_WEEK,
            "coachStatuses": COACH_STATUSES,
            "certStatuses": CERT_STATUSES,
            "sessionStatuses": SESSION_STATUSES,
        }

    async def get_fee_config() -> Dict[str, Any]:
        cfg = await db.coach_platform_fee_config.find_one({"id": "default"})
        if not cfg:
            cfg = dict(DEFAULT_FEE_CONFIG)
            await db.coach_platform_fee_config.insert_one(dict(cfg))
        return _clean(cfg)

    @router.get("/coaching/platform-fee")
    async def platform_fee():
        """Publicly-disclosable commercial terms (no secrets)."""
        return await get_fee_config()

    @router.put("/admin/coaching/platform-fee")
    async def set_platform_fee(data: FeeConfigInput, admin: dict = Depends(require_admin)):
        if data.coachPlatformFeeType not in ("percentage", "flat", "none"):
            raise HTTPException(status_code=400, detail="Invalid fee type.")
        old = await get_fee_config()
        payload = data.dict()
        payload["id"] = "default"
        payload["updatedAt"] = _now()
        payload["updatedBy"] = admin["_id"]
        await db.coach_platform_fee_config.update_one(
            {"id": "default"}, {"$set": payload}, upsert=True
        )
        await audit(admin["_id"], "platform_fee_changed", "fee_config", "default", old, payload)
        return _clean(await db.coach_platform_fee_config.find_one({"id": "default"}))

    def compute_payout(price: float, cfg: Dict[str, Any]) -> Dict[str, Any]:
        """Transparent breakdown. No settlement is performed here."""
        platform_fee_amt = 0.0
        if cfg.get("coachPlatformFeeType") == "percentage":
            platform_fee_amt = round(price * cfg.get("coachPlatformFeeValue", 0) / 100.0, 2)
        elif cfg.get("coachPlatformFeeType") == "flat":
            platform_fee_amt = round(cfg.get("coachPlatformFeeValue", 0), 2)
        processor_fee = 0.0
        if cfg.get("paymentProcessorFeeType") == "percentage":
            processor_fee = round(price * cfg.get("paymentProcessorFeeValue", 0) / 100.0, 2)
        elif cfg.get("paymentProcessorFeeType") == "flat":
            processor_fee = round(cfg.get("paymentProcessorFeeValue", 0), 2)
        tax = 0.0
        if cfg.get("taxType") == "percentage":
            tax = round(price * cfg.get("taxValue", 0) / 100.0, 2)
        elif cfg.get("taxType") == "flat":
            tax = round(cfg.get("taxValue", 0), 2)
        payout = round(price - platform_fee_amt - processor_fee, 2)
        return {
            "sessionPrice": round(price, 2),
            "platformFee": platform_fee_amt,
            "processorFee": processor_fee,
            "tax": tax,
            "coachPayout": payout,
        }

    # -- onboarding / my profile ------------------------------------------

    @router.get("/coach-profiles/me")
    async def get_my_profile(current_user: dict = Depends(get_current_user)):
        profile = await db.coach_profiles.find_one({"userId": current_user["_id"]})
        return _clean(profile)

    @router.put("/coach-profiles/me")
    async def upsert_my_profile(
        data: CoachProfileUpdate, current_user: dict = Depends(get_current_user)
    ):
        """Create-or-update the coach's DRAFT application (autosave friendly)."""
        user_id = current_user["_id"]
        existing = await db.coach_profiles.find_one({"userId": user_id})
        updates = {k: v for k, v in data.dict().items() if v is not None}

        if existing:
            if existing.get("status") in ("APPROVED",):
                # Editing a published profile keeps it published; other statuses stay.
                pass
            updates["updatedAt"] = _now()
            await db.coach_profiles.update_one({"id": existing["id"]}, {"$set": updates})
            await audit(user_id, "profile_edited", "coach_profile", existing["id"], None, updates)
            return _clean(await db.coach_profiles.find_one({"id": existing["id"]}))

        profile = {
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "status": "DRAFT",
            "onboardingStep": data.onboardingStep or 1,
            # sensible prefill from the authenticated account
            "legalFullName": data.legalFullName or current_user.get("name"),
            "displayName": data.displayName or current_user.get("name"),
            "email": data.email or current_user.get("email"),
            "phone": data.phone or current_user.get("phone"),
            "languages": [],
            "ageGroups": [],
            "playerLevels": [],
            "specializations": [],
            "virtualAvailable": False,
            "inPersonAvailable": False,
            "identityVerificationStatus": "NOT_REQUESTED",
            "backgroundCheckStatus": "NOT_REQUESTED",
            "safeguardingStatus": "NOT_REQUESTED",
            "childCoachingEligible": False,
            "hasVerifiedCertification": False,
            "averageRating": 0.0,
            "reviewCount": 0,
            "profileViews": 0,
            "createdAt": _now(),
            "updatedAt": _now(),
            "publishedAt": None,
            "submittedAt": None,
        }
        profile.update(updates)
        await db.coach_profiles.insert_one(dict(profile))
        await assign_role(user_id, "coach_applicant")
        await audit(user_id, "coach_application_started", "coach_profile", profile["id"])
        return _clean(await db.coach_profiles.find_one({"id": profile["id"]}))

    async def validate_for_submission(profile: Dict[str, Any]) -> List[str]:
        errors: List[str] = []
        if not (profile.get("displayName") or "").strip():
            errors.append("A display name is required.")
        if not (profile.get("legalFullName") or "").strip():
            errors.append("Your legal full name is required.")
        if not (profile.get("email") or "").strip():
            errors.append("A valid email is required.")
        if not (profile.get("city") or "").strip() or not (profile.get("country") or "").strip():
            errors.append("City and country are required.")
        if not profile.get("specializations"):
            errors.append("Select at least one coaching specialization.")
        services = await db.coach_services.count_documents({"coachId": profile["id"], "active": True})
        if services < 1:
            errors.append("Add at least one coaching service.")
        pricing = await db.coach_pricing.count_documents({"coachId": profile["id"], "active": True})
        if pricing < 1:
            errors.append("Add at least one price before publishing.")
        slots = await db.coach_availability.count_documents({"coachId": profile["id"], "active": True})
        if slots < 1:
            errors.append("Add at least one availability slot.")
        certs = await db.coach_certifications.count_documents({"coachId": profile["id"]})
        if certs < 1 and (profile.get("yearsCoaching") or 0) < 3:
            errors.append("Upload at least one qualification or provide sufficient coaching experience.")
        if not profile.get("agreedTerms"):
            errors.append("You must accept the platform Terms.")
        if not profile.get("agreedCoachAgreement"):
            errors.append("You must accept the Coach Agreement.")
        if not profile.get("agreedFeeDisclosure"):
            errors.append("You must acknowledge the platform fee disclosure.")
        if not profile.get("confirmedAccurate"):
            errors.append("You must confirm your information is accurate.")
        return errors

    @router.post("/coach-applications/submit")
    async def submit_application(current_user: dict = Depends(get_current_user)):
        user_id = current_user["_id"]
        profile = await get_my_profile_or_404(user_id)
        if profile.get("status") == "APPROVED":
            raise HTTPException(status_code=400, detail="You are already an approved coach.")
        errors = await validate_for_submission(profile)
        if errors:
            raise HTTPException(status_code=422, detail={"message": "Application incomplete", "errors": errors})
        await db.coach_profiles.update_one(
            {"id": profile["id"]},
            {"$set": {"status": "SUBMITTED", "submittedAt": _now(), "updatedAt": _now()}},
        )
        await db.coach_applications.insert_one(
            {
                "id": str(uuid.uuid4()),
                "coachId": profile["id"],
                "userId": user_id,
                "status": "SUBMITTED",
                "submittedAt": _now(),
            }
        )
        await assign_role(user_id, "coach_applicant")
        await audit(user_id, "coach_application_submitted", "coach_profile", profile["id"])
        await notify(user_id, "APPLICATION_SUBMITTED", {"coachId": profile["id"]})
        return _clean(await db.coach_profiles.find_one({"id": profile["id"]}))

    # -- services ----------------------------------------------------------

    @router.get("/coach-profiles/me/services")
    async def my_services(current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        rows = await db.coach_services.find({"coachId": profile["id"]}).to_list(200)
        return [_clean(r) for r in rows]

    @router.post("/coach-profiles/me/services")
    async def add_service(data: CoachServiceInput, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        if data.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid service category.")
        svc = data.dict()
        svc.update(
            {
                "id": str(uuid.uuid4()),
                "coachId": profile["id"],
                "createdAt": _now(),
                "updatedAt": _now(),
            }
        )
        await db.coach_services.insert_one(dict(svc))
        await audit(current_user["_id"], "service_added", "coach_service", svc["id"], None, svc)
        return _clean(await db.coach_services.find_one({"id": svc["id"]}))

    @router.put("/coach-services/{service_id}")
    async def update_service(
        service_id: str, data: CoachServiceInput, current_user: dict = Depends(get_current_user)
    ):
        profile = await get_my_profile_or_404(current_user["_id"])
        svc = await db.coach_services.find_one({"id": service_id, "coachId": profile["id"]})
        if not svc:
            raise HTTPException(status_code=404, detail="Service not found.")
        updates = data.dict()
        updates["updatedAt"] = _now()
        await db.coach_services.update_one({"id": service_id}, {"$set": updates})
        return _clean(await db.coach_services.find_one({"id": service_id}))

    @router.delete("/coach-services/{service_id}")
    async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        res = await db.coach_services.delete_one({"id": service_id, "coachId": profile["id"]})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Service not found.")
        return {"deleted": service_id}

    # -- pricing -----------------------------------------------------------

    @router.get("/coach-profiles/me/pricing")
    async def my_pricing(current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        rows = await db.coach_pricing.find({"coachId": profile["id"]}).to_list(200)
        return [_clean(r) for r in rows]

    @router.post("/coach-profiles/me/pricing")
    async def add_pricing(data: CoachPricingInput, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        if data.sessionType not in SESSION_FORMATS:
            raise HTTPException(status_code=400, detail="Invalid session format.")
        if data.durationMinutes not in DURATIONS:
            raise HTTPException(status_code=400, detail=f"Duration must be one of {DURATIONS}.")
        if data.price < 0 or (data.pricePerPerson or 0) < 0:
            raise HTTPException(status_code=400, detail="Price cannot be negative.")
        row = data.dict()
        row.update(
            {
                "id": str(uuid.uuid4()),
                "coachId": profile["id"],
                "currency": (data.currency or "USD").upper(),
                "createdAt": _now(),
                "updatedAt": _now(),
            }
        )
        await db.coach_pricing.insert_one(dict(row))
        await audit(current_user["_id"], "pricing_changed", "coach_pricing", row["id"], None, row)
        return _clean(await db.coach_pricing.find_one({"id": row["id"]}))

    @router.delete("/coach-pricing/{pricing_id}")
    async def delete_pricing(pricing_id: str, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        res = await db.coach_pricing.delete_one({"id": pricing_id, "coachId": profile["id"]})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Pricing not found.")
        await audit(current_user["_id"], "pricing_changed", "coach_pricing", pricing_id, {"deleted": True}, None)
        return {"deleted": pricing_id}

    # -- experience --------------------------------------------------------

    @router.get("/coach-profiles/me/experience")
    async def get_experience(current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        return _clean(await db.coach_experience.find_one({"coachId": profile["id"]}))

    @router.put("/coach-profiles/me/experience")
    async def put_experience(data: CoachExperienceInput, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        payload = data.dict()
        payload["verificationLevel"] = "SELF_REPORTED"  # never self-verify
        payload["coachId"] = profile["id"]
        payload["updatedAt"] = _now()
        existing = await db.coach_experience.find_one({"coachId": profile["id"]})
        if existing:
            await db.coach_experience.update_one({"coachId": profile["id"]}, {"$set": payload})
        else:
            payload["id"] = str(uuid.uuid4())
            payload["createdAt"] = _now()
            await db.coach_experience.insert_one(dict(payload))
        return _clean(await db.coach_experience.find_one({"coachId": profile["id"]}))

    # -- availability ------------------------------------------------------

    @router.get("/coach-profiles/me/availability")
    async def get_availability(current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        slots = await db.coach_availability.find({"coachId": profile["id"]}).to_list(200)
        blocked = await db.coach_blocked_dates.find({"coachId": profile["id"]}).to_list(200)
        return {
            "timezone": profile.get("availabilityTimezone", "UTC"),
            "bookingLeadTimeHours": profile.get("bookingLeadTimeHours", 24),
            "maxBookingWindowDays": profile.get("maxBookingWindowDays", 60),
            "minCancellationNoticeHours": profile.get("minCancellationNoticeHours", 24),
            "slots": [_clean(s) for s in slots],
            "blockedDates": [_clean(b) for b in blocked],
        }

    @router.put("/coach-profiles/me/availability")
    async def put_availability(data: AvailabilityInput, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        for slot in data.slots:
            if slot.dayOfWeek not in DAYS_OF_WEEK:
                raise HTTPException(status_code=400, detail=f"Invalid day: {slot.dayOfWeek}")
        await db.coach_availability.delete_many({"coachId": profile["id"]})
        docs = []
        for slot in data.slots:
            docs.append(
                {
                    "id": str(uuid.uuid4()),
                    "coachId": profile["id"],
                    "dayOfWeek": slot.dayOfWeek,
                    "startTime": slot.startTime,
                    "endTime": slot.endTime,
                    "timezone": data.timezone,
                    "locationType": slot.locationType,
                    "active": slot.active,
                }
            )
        if docs:
            await db.coach_availability.insert_many(docs)
        await db.coach_profiles.update_one(
            {"id": profile["id"]},
            {
                "$set": {
                    "availabilityTimezone": data.timezone,
                    "bookingLeadTimeHours": data.bookingLeadTimeHours,
                    "maxBookingWindowDays": data.maxBookingWindowDays,
                    "minCancellationNoticeHours": data.minCancellationNoticeHours,
                    "updatedAt": _now(),
                }
            },
        )
        return await get_availability(current_user)

    @router.post("/coach-profiles/me/blocked-dates")
    async def add_blocked_date(data: BlockedDateInput, current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        doc = {
            "id": str(uuid.uuid4()),
            "coachId": profile["id"],
            "date": data.date,
            "reason": data.reason,
            "createdAt": _now(),
        }
        await db.coach_blocked_dates.insert_one(dict(doc))
        return _clean(await db.coach_blocked_dates.find_one({"id": doc["id"]}))

    # -- certifications ----------------------------------------------------

    @router.get("/coach-profiles/me/certifications")
    async def my_certifications(current_user: dict = Depends(get_current_user)):
        profile = await get_my_profile_or_404(current_user["_id"])
        rows = await db.coach_certifications.find({"coachId": profile["id"]}).to_list(200)
        # Never return storage internals to the client beyond what it needs.
        out = []
        for r in rows:
            r = _clean(r)
            r.pop("storageKey", None)
            r.pop("storageProvider", None)
            out.append(r)
        return out

    @router.post("/coach-profiles/me/certifications")
    async def upload_certification(
        file: UploadFile = File(...),
        name: str = Form(...),
        issuer: str = Form(...),
        credentialType: str = Form(""),
        credentialNumber: str = Form(""),
        issueDate: str = Form(""),
        expiryDate: str = Form(""),
        credentialUrl: str = Form(""),
        current_user: dict = Depends(get_current_user),
    ):
        profile = await get_my_profile_or_404(current_user["_id"])
        declared = file.content_type or ""
        if declared not in ALLOWED_MIME:
            raise HTTPException(status_code=400, detail="Only PDF, JPG and PNG files are allowed.")
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file.")
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_BYTES // (1024*1024)}MB limit.")
        try:
            short_type = _sniff_type(content, declared)
            stored = store_document(content, short_type, profile["id"])
        except StorageError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        cert = {
            "id": str(uuid.uuid4()),
            "coachId": profile["id"],
            "name": name,
            "issuer": issuer,
            "credentialType": credentialType or None,
            "credentialNumber": credentialNumber or None,
            "issueDate": issueDate or None,
            "expiryDate": expiryDate or None,
            "credentialUrl": credentialUrl or None,
            "originalFilename": file.filename,
            "mimeType": declared,
            "fileSize": len(content),
            "storageProvider": stored["storageProvider"],
            "storageKey": stored["storageKey"],
            "status": "PENDING",
            "verificationNotes": None,
            "verifiedBy": None,
            "verifiedAt": None,
            "rejectionReason": None,
            "uploadedAt": _now(),
            "updatedAt": _now(),
        }
        await db.coach_certifications.insert_one(dict(cert))
        await audit(current_user["_id"], "certificate_uploaded", "coach_certification", cert["id"])
        result = _clean(cert)
        result.pop("storageKey", None)
        result.pop("storageProvider", None)
        return result

    async def _authorized_for_cert(cert, current_user=None, token=None) -> bool:
        if current_user is not None:
            if is_admin(current_user):
                return True
            owner = await db.coach_profiles.find_one({"id": cert["coachId"]})
            return owner and owner.get("userId") == current_user["_id"]
        if token is not None:
            return verify_file_token(token, cert["id"])
        return False

    @router.get("/coach-certifications/{cert_id}/signed-url")
    async def cert_signed_url(cert_id: str, current_user: dict = Depends(get_current_user)):
        cert = await db.coach_certifications.find_one({"id": cert_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certification not found.")
        if not await _authorized_for_cert(cert, current_user=current_user):
            raise HTTPException(status_code=403, detail="Not authorized to view this document.")
        token = make_file_token(cert_id, current_user["_id"])
        return {"url": f"/api/coach-certifications/{cert_id}/file?token={token}", "expiresInSeconds": 900}

    @router.get("/coach-certifications/{cert_id}/file")
    async def cert_file(cert_id: str, token: Optional[str] = Query(None), authorization: Optional[str] = None):
        cert = await db.coach_certifications.find_one({"id": cert_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certification not found.")
        # Authorize by short-lived signed token (from signed-url) only. The header
        # path is intentionally not accepted here to keep file access explicit.
        if not token or not verify_file_token(token, cert_id):
            raise HTTPException(status_code=403, detail="A valid signed token is required.")
        try:
            handle, media_type = open_document(cert["storageProvider"], cert["storageKey"])
        except StorageError as exc:
            raise HTTPException(status_code=404, detail=str(exc))
        if isinstance(handle, Path):
            return FileResponse(str(handle), media_type=media_type)
        return StreamingResponse(handle, media_type=media_type)

    # -- discovery (APPROVED coaches only; real data) ----------------------

    @router.get("/coaching/coaches")
    async def discover(
        country: Optional[str] = None,
        state: Optional[str] = None,
        city: Optional[str] = None,
        specialization: Optional[str] = None,
        sessionFormat: Optional[str] = None,
        virtual: Optional[bool] = None,
        inPerson: Optional[bool] = None,
        minExperience: Optional[int] = None,
        maxPrice: Optional[float] = None,
        verifiedOnly: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 50,
        skip: int = 0,
    ):
        query: Dict[str, Any] = {"status": "APPROVED"}
        if country:
            query["country"] = {"$regex": f"^{country}$", "$options": "i"}
        if state:
            query["state"] = {"$regex": f"^{state}$", "$options": "i"}
        if city:
            query["city"] = {"$regex": f"^{city}$", "$options": "i"}
        if specialization:
            query["specializations"] = {"$regex": specialization, "$options": "i"}
        if virtual is True:
            query["virtualAvailable"] = True
        if inPerson is True:
            query["inPersonAvailable"] = True
        if minExperience:
            query["yearsCoaching"] = {"$gte": minExperience}
        if verifiedOnly:
            query["hasVerifiedCertification"] = True
        if search:
            query["$or"] = [
                {"displayName": {"$regex": search, "$options": "i"}},
                {"headline": {"$regex": search, "$options": "i"}},
                {"specializations": {"$regex": search, "$options": "i"}},
            ]

        rows = (
            await db.coach_profiles.find(query)
            .sort("publishedAt", -1)
            .skip(max(0, skip))
            .limit(min(100, limit))
            .to_list(min(100, limit))
        )
        results = []
        for profile in rows:
            view = public_profile_view(profile)
            # Attach the cheapest active price (optionally format-filtered) for cards.
            price_query: Dict[str, Any] = {"coachId": profile["id"], "active": True}
            if sessionFormat:
                price_query["sessionType"] = sessionFormat
            prices = await db.coach_pricing.find(price_query).sort("price", 1).to_list(50)
            if sessionFormat and not prices:
                continue  # coach does not offer the requested format
            if maxPrice is not None and prices and prices[0]["price"] > maxPrice:
                continue
            view["fromPrice"] = _clean(prices[0]) if prices else None
            results.append(view)
        return {"count": len(results), "results": results}

    @router.get("/coaching/coaches/facets")
    async def discover_facets():
        countries = await db.coach_profiles.distinct("country", {"status": "APPROVED"})
        cities = await db.coach_profiles.distinct("city", {"status": "APPROVED"})
        specializations = await db.coach_profiles.distinct("specializations", {"status": "APPROVED"})
        return {
            "countries": sorted([c for c in countries if c]),
            "cities": sorted([c for c in cities if c]),
            "specializations": sorted([s for s in specializations if s]),
        }

    @router.get("/coaching/coaches/{coach_id}")
    async def public_coach(coach_id: str):
        profile = await db.coach_profiles.find_one({"id": coach_id, "status": "APPROVED"})
        if not profile:
            raise HTTPException(status_code=404, detail="Coach not found.")
        await db.coach_profiles.update_one({"id": coach_id}, {"$inc": {"profileViews": 1}})
        services = await db.coach_services.find({"coachId": coach_id, "active": True}).to_list(200)
        pricing = await db.coach_pricing.find({"coachId": coach_id, "active": True}).to_list(200)
        # Only expose that a qualification is verified — never the document itself.
        verified_certs = await db.coach_certifications.find(
            {"coachId": coach_id, "status": "VERIFIED"}
        ).to_list(200)
        qualifications = [
            {"name": c.get("name"), "issuer": c.get("issuer"), "status": "VERIFIED"}
            for c in verified_certs
        ]
        reviews = await db.coach_reviews.find(
            {"coachId": coach_id, "hidden": {"$ne": True}}
        ).sort("createdAt", -1).to_list(50)
        view = public_profile_view(profile)
        view["services"] = [_clean(s) for s in services]
        view["pricing"] = [_clean(p) for p in pricing]
        view["qualifications"] = qualifications
        view["reviews"] = [_clean(r) for r in reviews]
        return view

    @router.get("/coaching/coaches/{coach_id}/availability")
    async def public_availability(coach_id: str):
        profile = await db.coach_profiles.find_one({"id": coach_id, "status": "APPROVED"})
        if not profile:
            raise HTTPException(status_code=404, detail="Coach not found.")
        slots = await db.coach_availability.find(
            {"coachId": coach_id, "active": True}
        ).to_list(200)
        return {
            "timezone": profile.get("availabilityTimezone", "UTC"),
            "slots": [_clean(s) for s in slots],
        }

    # -- bookings ----------------------------------------------------------

    @router.post("/coaching/bookings")
    async def create_booking(data: BookingInput, current_user: dict = Depends(get_current_user)):
        profile = await db.coach_profiles.find_one({"id": data.coachId, "status": "APPROVED"})
        if not profile:
            raise HTTPException(status_code=404, detail="Coach not available for booking.")
        if data.sessionType not in SESSION_FORMATS:
            raise HTTPException(status_code=400, detail="Invalid session format.")
        pricing = None
        if data.pricingId:
            pricing = await db.coach_pricing.find_one({"id": data.pricingId, "coachId": data.coachId})
        price = float(pricing["price"]) if pricing else 0.0
        cfg = await get_fee_config()
        breakdown = compute_payout(price, cfg)
        booking = {
            "id": str(uuid.uuid4()),
            "coachId": data.coachId,
            "coachName": profile.get("displayName"),
            "playerId": current_user["_id"],
            "playerName": current_user.get("name"),
            "serviceId": data.serviceId,
            "pricingId": data.pricingId,
            "sessionType": data.sessionType,
            "deliveryMode": data.deliveryMode,
            "scheduledStart": data.scheduledStart,
            "scheduledEnd": data.scheduledStart + timedelta(minutes=data.durationMinutes),
            "durationMinutes": data.durationMinutes,
            "timezone": profile.get("availabilityTimezone", "UTC"),
            "participants": data.participants,
            "location": data.location,
            "notes": data.notes,
            "status": "REQUESTED",
            "currency": pricing["currency"] if pricing else cfg.get("coachPlatformFeeCurrency", "USD"),
            "price": price,
            "platformFee": breakdown["platformFee"],
            "processorFee": breakdown["processorFee"],
            "coachPayout": breakdown["coachPayout"],
            "createdAt": _now(),
            "updatedAt": _now(),
        }
        await db.coach_sessions.insert_one(dict(booking))
        await audit(current_user["_id"], "session_requested", "coach_session", booking["id"])
        await notify(profile["userId"], "BOOKING_REQUESTED", {"bookingId": booking["id"]})
        await notify(current_user["_id"], "BOOKING_REQUESTED", {"bookingId": booking["id"]})
        return _clean(booking)

    @router.get("/coaching/bookings/me")
    async def my_bookings(role: str = "player", current_user: dict = Depends(get_current_user)):
        if role == "coach":
            profile = await db.coach_profiles.find_one({"userId": current_user["_id"]})
            query = {"coachId": profile["id"]} if profile else {"coachId": "__none__"}
        else:
            query = {"playerId": current_user["_id"]}
        rows = await db.coach_sessions.find(query).sort("scheduledStart", 1).to_list(200)
        return [_clean(r) for r in rows]

    @router.post("/coaching/bookings/{booking_id}/cancel")
    async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        booking = await db.coach_sessions.find_one({"id": booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        profile = await db.coach_profiles.find_one({"id": booking["coachId"]})
        is_owner = booking["playerId"] == current_user["_id"] or (
            profile and profile.get("userId") == current_user["_id"]
        )
        if not is_owner and not is_admin(current_user):
            raise HTTPException(status_code=403, detail="Not authorized to cancel this booking.")
        await db.coach_sessions.update_one(
            {"id": booking_id}, {"$set": {"status": "CANCELLED", "updatedAt": _now()}}
        )
        await audit(current_user["_id"], "session_cancelled", "coach_session", booking_id)
        await notify(booking["playerId"], "BOOKING_CANCELLED", {"bookingId": booking_id})
        return {"status": "CANCELLED", "id": booking_id}

    # -- coach dashboard overview -----------------------------------------

    @router.get("/coach-profiles/me/overview")
    async def coach_overview(current_user: dict = Depends(get_current_user)):
        profile = await db.coach_profiles.find_one({"userId": current_user["_id"]})
        if not profile:
            raise HTTPException(status_code=404, detail="No coach profile.")
        cid = profile["id"]
        upcoming = await db.coach_sessions.count_documents(
            {"coachId": cid, "status": {"$in": ["REQUESTED", "CONFIRMED", "PENDING_PAYMENT"]}}
        )
        completed = await db.coach_sessions.count_documents({"coachId": cid, "status": "COMPLETED"})
        pending = await db.coach_sessions.count_documents({"coachId": cid, "status": "REQUESTED"})
        return {
            "status": profile.get("status"),
            "upcomingSessions": upcoming,
            "completedSessions": completed,
            "pendingRequests": pending,
            "profileViews": profile.get("profileViews", 0),
            "rating": profile.get("averageRating", 0.0),
            "reviewCount": profile.get("reviewCount", 0),
        }

    # -- reviews (real only, tied to completed sessions) -------------------

    @router.post("/coaching/reviews")
    async def create_review(data: ReviewInput, current_user: dict = Depends(get_current_user)):
        booking = await db.coach_sessions.find_one({"id": data.sessionId})
        if not booking:
            raise HTTPException(status_code=404, detail="Session not found.")
        if booking["playerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="You can only review your own sessions.")
        if booking["status"] != "COMPLETED":
            raise HTTPException(status_code=400, detail="Only completed sessions can be reviewed.")
        if await db.coach_reviews.find_one({"sessionId": data.sessionId}):
            raise HTTPException(status_code=400, detail="This session has already been reviewed.")
        review = {
            "id": str(uuid.uuid4()),
            "coachId": booking["coachId"],
            "sessionId": data.sessionId,
            "playerId": current_user["_id"],
            "playerName": current_user.get("name"),
            "rating": data.rating,
            "title": data.title,
            "text": data.text,
            "hidden": False,
            "createdAt": _now(),
        }
        await db.coach_reviews.insert_one(dict(review))
        # Recompute aggregate rating from real reviews only.
        agg = await db.coach_reviews.find({"coachId": booking["coachId"], "hidden": {"$ne": True}}).to_list(1000)
        avg = round(sum(r["rating"] for r in agg) / len(agg), 2) if agg else 0.0
        await db.coach_profiles.update_one(
            {"id": booking["coachId"]},
            {"$set": {"averageRating": avg, "reviewCount": len(agg)}},
        )
        return _clean(review)

    # -- admin review dashboard -------------------------------------------

    @router.get("/admin/coaches")
    async def admin_list_coaches(status: Optional[str] = None, admin: dict = Depends(require_admin)):
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status
        rows = await db.coach_profiles.find(query).sort("submittedAt", -1).to_list(500)
        return [_clean(r) for r in rows]

    @router.get("/admin/coaches/{coach_id}")
    async def admin_coach_detail(coach_id: str, admin: dict = Depends(require_admin)):
        profile = await db.coach_profiles.find_one({"id": coach_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Coach not found.")
        services = await db.coach_services.find({"coachId": coach_id}).to_list(200)
        pricing = await db.coach_pricing.find({"coachId": coach_id}).to_list(200)
        certs = await db.coach_certifications.find({"coachId": coach_id}).to_list(200)
        experience = await db.coach_experience.find_one({"coachId": coach_id})
        availability = await db.coach_availability.find({"coachId": coach_id}).to_list(200)
        notes = await db.coach_admin_notes.find({"coachId": coach_id}).sort("createdAt", -1).to_list(200)
        cert_out = []
        for c in certs:
            c = _clean(c)
            c.pop("storageKey", None)  # do not leak raw storage location
            cert_out.append(c)
        return {
            "profile": _clean(profile),
            "services": [_clean(s) for s in services],
            "pricing": [_clean(p) for p in pricing],
            "certifications": cert_out,
            "experience": _clean(experience),
            "availability": [_clean(a) for a in availability],
            "notes": [_clean(n) for n in notes],
        }

    async def _set_status(coach_id, new_status, actor, extra=None, event=None):
        profile = await db.coach_profiles.find_one({"id": coach_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Coach not found.")
        updates = {"status": new_status, "updatedAt": _now()}
        if extra:
            updates.update(extra)
        await db.coach_profiles.update_one({"id": coach_id}, {"$set": updates})
        await db.coach_applications.update_one(
            {"coachId": coach_id}, {"$set": {"status": new_status, "updatedAt": _now()}}
        )
        await audit(actor["_id"], f"coach_{new_status.lower()}", "coach_profile", coach_id, {"status": profile.get("status")}, updates)
        if event:
            await notify(profile["userId"], event, {"coachId": coach_id})
        return await db.coach_profiles.find_one({"id": coach_id})

    @router.post("/admin/coaches/{coach_id}/approve")
    async def admin_approve(coach_id: str, data: AdminActionInput = AdminActionInput(), admin: dict = Depends(require_admin)):
        profile = await db.coach_profiles.find_one({"id": coach_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Coach not found.")
        updated = await _set_status(
            coach_id, "APPROVED", admin, {"publishedAt": _now()}, event="COACH_APPROVED"
        )
        await assign_role(profile["userId"], "coach", is_coach=True)
        return _clean(updated)

    @router.post("/admin/coaches/{coach_id}/reject")
    async def admin_reject(coach_id: str, data: AdminActionInput, admin: dict = Depends(require_admin)):
        updated = await _set_status(
            coach_id, "REJECTED", admin, {"rejectionReason": data.reason}, event="COACH_REJECTED"
        )
        return _clean(updated)

    @router.post("/admin/coaches/{coach_id}/request-info")
    async def admin_request_info(coach_id: str, data: AdminActionInput, admin: dict = Depends(require_admin)):
        updated = await _set_status(
            coach_id, "NEEDS_INFORMATION", admin, {"infoRequested": data.reason},
            event="MORE_INFORMATION_REQUESTED",
        )
        return _clean(updated)

    @router.post("/admin/coaches/{coach_id}/review")
    async def admin_mark_under_review(coach_id: str, admin: dict = Depends(require_admin)):
        updated = await _set_status(coach_id, "UNDER_REVIEW", admin, event="APPLICATION_UNDER_REVIEW")
        return _clean(updated)

    @router.post("/admin/coaches/{coach_id}/suspend")
    async def admin_suspend(coach_id: str, data: AdminActionInput, admin: dict = Depends(require_admin)):
        updated = await _set_status(
            coach_id, "SUSPENDED", admin, {"suspensionReason": data.reason}, event="COACH_SUSPENDED"
        )
        profile = await db.coach_profiles.find_one({"id": coach_id})
        if profile:
            await assign_role(profile["userId"], "coach_applicant", is_coach=False)
        return _clean(updated)

    @router.post("/admin/coaches/{coach_id}/restore")
    async def admin_restore(coach_id: str, admin: dict = Depends(require_admin)):
        updated = await _set_status(
            coach_id, "APPROVED", admin, {"publishedAt": _now(), "suspensionReason": None},
            event="COACH_RESTORED",
        )
        profile = await db.coach_profiles.find_one({"id": coach_id})
        if profile:
            await assign_role(profile["userId"], "coach", is_coach=True)
        return _clean(updated)

    @router.post("/admin/coaches/{coach_id}/notes")
    async def admin_add_note(coach_id: str, data: AdminActionInput, admin: dict = Depends(require_admin)):
        note = {
            "id": str(uuid.uuid4()),
            "coachId": coach_id,
            "authorId": admin["_id"],
            "authorName": admin.get("name"),
            "note": data.note or "",
            "createdAt": _now(),
        }
        await db.coach_admin_notes.insert_one(dict(note))
        await audit(admin["_id"], "admin_note_added", "coach_profile", coach_id)
        return _clean(note)

    @router.post("/admin/certifications/{cert_id}/verify")
    async def admin_verify_cert(cert_id: str, admin: dict = Depends(require_admin)):
        cert = await db.coach_certifications.find_one({"id": cert_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certification not found.")
        await db.coach_certifications.update_one(
            {"id": cert_id},
            {"$set": {"status": "VERIFIED", "verifiedBy": admin["_id"], "verifiedAt": _now(), "updatedAt": _now()}},
        )
        await refresh_cert_flag(cert["coachId"])
        await audit(admin["_id"], "certificate_verified", "coach_certification", cert_id)
        profile = await db.coach_profiles.find_one({"id": cert["coachId"]})
        if profile:
            await notify(profile["userId"], "CERTIFICATION_VERIFIED", {"certId": cert_id})
        return _clean(await db.coach_certifications.find_one({"id": cert_id}))

    @router.post("/admin/certifications/{cert_id}/reject")
    async def admin_reject_cert(cert_id: str, data: AdminActionInput, admin: dict = Depends(require_admin)):
        cert = await db.coach_certifications.find_one({"id": cert_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certification not found.")
        await db.coach_certifications.update_one(
            {"id": cert_id},
            {"$set": {"status": "REJECTED", "rejectionReason": data.reason, "verifiedBy": admin["_id"], "verifiedAt": _now(), "updatedAt": _now()}},
        )
        await refresh_cert_flag(cert["coachId"])
        await audit(admin["_id"], "certificate_rejected", "coach_certification", cert_id)
        profile = await db.coach_profiles.find_one({"id": cert["coachId"]})
        if profile:
            await notify(profile["userId"], "CERTIFICATION_REJECTED", {"certId": cert_id})
        return _clean(await db.coach_certifications.find_one({"id": cert_id}))

    @router.get("/admin/certifications/{cert_id}/signed-url")
    async def admin_cert_signed_url(cert_id: str, admin: dict = Depends(require_admin)):
        cert = await db.coach_certifications.find_one({"id": cert_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certification not found.")
        token = make_file_token(cert_id, admin["_id"])
        return {"url": f"/api/coach-certifications/{cert_id}/file?token={token}", "expiresInSeconds": 900}

    # -- notifications (read own) -----------------------------------------

    @router.get("/coaching/notifications/me")
    async def my_notifications(current_user: dict = Depends(get_current_user)):
        rows = await db.coach_notifications.find({"userId": current_user["_id"]}).sort("createdAt", -1).to_list(100)
        return [_clean(r) for r in rows]

    return router


# ---------------------------------------------------------------------------
# Index management
# ---------------------------------------------------------------------------


async def ensure_coaching_indexes(db):
    """Create indexes for the coaching collections. Safe to call repeatedly."""
    await db.coach_profiles.create_index("userId", unique=True)
    await db.coach_profiles.create_index("status")
    await db.coach_profiles.create_index([("country", 1), ("state", 1), ("city", 1)])
    await db.coach_profiles.create_index("specializations")
    await db.coach_profiles.create_index("virtualAvailable")
    await db.coach_services.create_index("coachId")
    await db.coach_services.create_index([("category", 1), ("active", 1)])
    await db.coach_pricing.create_index("coachId")
    await db.coach_pricing.create_index([("coachId", 1), ("active", 1)])
    await db.coach_certifications.create_index("coachId")
    await db.coach_certifications.create_index("status")
    await db.coach_availability.create_index([("coachId", 1), ("dayOfWeek", 1)])
    await db.coach_blocked_dates.create_index("coachId")
    await db.coach_sessions.create_index([("coachId", 1), ("scheduledStart", 1)])
    await db.coach_sessions.create_index([("playerId", 1), ("scheduledStart", 1)])
    await db.coach_sessions.create_index("status")
    await db.coach_reviews.create_index("coachId")
    await db.coach_reviews.create_index("sessionId", unique=True)
    await db.coach_audit_log.create_index([("entityType", 1), ("entityId", 1)])
    await db.coach_notifications.create_index([("userId", 1), ("createdAt", -1)])
