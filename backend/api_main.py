"""
18 Cricket Network - Complete REST API
FastAPI implementation with versioning, authentication, and OpenAPI docs
"""

from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from pathlib import Path
import bcrypt
import jwt
import os
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ==================== CONFIGURATION ====================

SECRET_KEY = os.getenv("JWT_SECRET", "cricket-network-secret-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ==================== APP INITIALIZATION ====================

app = FastAPI(
    title="18 Cricket Network API",
    description="Complete REST API for global cricket ecosystem platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# ==================== ENUMS ====================

class UserRole(str, Enum):
    PLAYER = "player"
    CAPTAIN = "captain"
    TEAM_ADMIN = "team_admin"
    LEAGUE_ADMIN = "league_admin"
    UMPIRE = "umpire"
    SELLER = "seller"
    REPAIR_SPECIALIST = "repair_specialist"
    ACADEMY_COACH = "academy_coach"
    GROUND_OWNER = "ground_owner"
    SUPER_ADMIN = "super_admin"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"

class RepairStatus(str, Enum):
    REQUESTED = "requested"
    RECEIVED = "received"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MatchStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# ==================== BASE MODELS ====================

class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict] = None

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

# ==================== AUTHENTICATION HELPERS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract and validate JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    # Fetch user from database
    user = await db.users.find_one({"email": payload.get("email")})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    user['_id'] = str(user['_id'])
    user.pop('password', None)  # Remove password from response
    return user

async def require_role(required_roles: List[UserRole]):
    """Dependency to check user role"""
    async def role_checker(current_user: Dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in [r.value for r in required_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_roles}"
            )
        return current_user
    return role_checker

# ==================== HEALTH CHECK ====================

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "18 Cricket Network API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# ==================== API v1 PREFIX ====================

from fastapi import APIRouter

api_v1 = APIRouter(prefix="/api/v1", tags=["API v1"])

# ==================== 1. AUTH & USERS ====================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.PLAYER

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict

@api_v1.post("/auth/register", response_model=TokenResponse, tags=["Auth"])
async def register(request: RegisterRequest):
    """Register new user with role"""
    # TODO: Hash password, save to database
    user_data = {
        "id": "user_123",
        "email": request.email,
        "name": request.name,
        "role": request.role.value
    }
    token = create_access_token(user_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@api_v1.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(request: LoginRequest):
    """Login with email and password"""
    # TODO: Verify credentials against database
    user_data = {
        "id": "user_123",
        "email": request.email,
        "role": "player"
    }
    token = create_access_token(user_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@api_v1.post("/auth/logout", tags=["Auth"])
async def logout(current_user: Dict = Depends(get_current_user)):
    """Logout current user"""
    # TODO: Blacklist token if using token blacklist
    return {"success": True, "message": "Logged out successfully"}

@api_v1.post("/auth/refresh", response_model=TokenResponse, tags=["Auth"])
async def refresh_token(current_user: Dict = Depends(get_current_user)):
    """Refresh access token"""
    new_token = create_access_token(current_user)
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user": current_user
    }

@api_v1.get("/users/me", tags=["Users"])
async def get_my_profile(current_user: Dict = Depends(get_current_user)):
    """Get current user profile"""
    # TODO: Fetch from database
    return {"success": True, "data": current_user}

@api_v1.patch("/users/me", tags=["Users"])
async def update_my_profile(
    updates: Dict,
    current_user: Dict = Depends(get_current_user)
):
    """Update current user profile"""
    # TODO: Update database
    return {"success": True, "message": "Profile updated", "data": updates}

@api_v1.get("/users/{user_id}", tags=["Users"])
async def get_user_profile(user_id: str):
    """Get user profile by ID (public info)"""
    # TODO: Fetch from database
    return {"success": True, "data": {"id": user_id, "name": "Player Name"}}

@api_v1.patch("/users/{user_id}/role", tags=["Users"])
async def change_user_role(
    user_id: str,
    new_role: UserRole,
    current_user: Dict = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    """Change user role (admin only)"""
    # TODO: Update database
    return {
        "success": True,
        "message": f"User role changed to {new_role.value}",
        "data": {"user_id": user_id, "new_role": new_role.value}
    }

@api_v1.post("/users/{user_id}/verify", tags=["Users"])
async def verify_user(
    user_id: str,
    verification_type: str,
    documents: Optional[List[str]] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Submit verification documents (KYC/seller/league)"""
    # TODO: Save verification request to database
    return {
        "success": True,
        "message": "Verification submitted",
        "data": {"user_id": user_id, "type": verification_type, "status": "pending"}
    }

# ==================== 2. SQUAD, CHAT & CALL ====================

class SquadRequest(BaseModel):
    to_user_id: str
    message: Optional[str] = None

@api_v1.post("/squad/requests", tags=["Squad"])
async def send_squad_request(
    request: SquadRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Send squad (friend) request"""
    # TODO: Save to database, send notification
    return {
        "success": True,
        "message": "Squad request sent",
        "data": {"from": current_user["id"], "to": request.to_user_id}
    }

@api_v1.post("/squad/requests/{request_id}/accept", tags=["Squad"])
async def accept_squad_request(
    request_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Accept squad request"""
    # TODO: Update database, create mutual connection
    return {"success": True, "message": "Squad request accepted"}

@api_v1.get("/squad/list", tags=["Squad"])
async def get_my_squad(current_user: Dict = Depends(get_current_user)):
    """Get my squad list"""
    # TODO: Fetch from database
    return {
        "success": True,
        "data": {
            "squad": [],
            "pending_sent": [],
            "pending_received": []
        }
    }

class CreateThreadRequest(BaseModel):
    name: Optional[str] = None
    participants: List[str]
    is_group: bool = False

@api_v1.post("/chat/threads", tags=["Chat"])
async def create_chat_thread(
    request: CreateThreadRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create chat thread (1:1 or group)"""
    # TODO: Verify all participants are in squad, save to database
    return {
        "success": True,
        "message": "Chat thread created",
        "data": {"thread_id": "thread_123", "participants": request.participants}
    }

@api_v1.get("/chat/threads", tags=["Chat"])
async def get_chat_threads(current_user: Dict = Depends(get_current_user)):
    """Get all chat threads for current user"""
    # TODO: Fetch from database
    return {"success": True, "data": {"threads": []}}

@api_v1.get("/chat/threads/{thread_id}/messages", tags=["Chat"])
async def get_thread_messages(
    thread_id: str,
    page: int = 1,
    page_size: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get messages from a thread"""
    # TODO: Verify user is participant, fetch messages
    return {
        "success": True,
        "data": {
            "messages": [],
            "page": page,
            "page_size": page_size,
            "total": 0
        }
    }

class SendMessageRequest(BaseModel):
    content: str
    message_type: str = "text"  # text, image, video, file
    metadata: Optional[Dict] = None

@api_v1.post("/chat/threads/{thread_id}/messages", tags=["Chat"])
async def send_message(
    thread_id: str,
    request: SendMessageRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Send message to thread"""
    # TODO: Verify participant, save message, send real-time via WebSocket
    return {
        "success": True,
        "message": "Message sent",
        "data": {
            "message_id": "msg_123",
            "thread_id": thread_id,
            "sender_id": current_user["id"],
            "content": request.content,
            "timestamp": datetime.utcnow().isoformat()
        }
    }

class CreateMeetingRequest(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    participants: List[str]
    location: Optional[str] = None

@api_v1.post("/chat/threads/{thread_id}/meetings", tags=["Chat"])
async def create_meeting(
    thread_id: str,
    request: CreateMeetingRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Schedule meeting/practice session"""
    # TODO: Save meeting, send invites
    return {
        "success": True,
        "message": "Meeting scheduled",
        "data": {
            "meeting_id": "meeting_123",
            "title": request.title,
            "start_time": request.start_time.isoformat()
        }
    }

@api_v1.get("/meetings/my", tags=["Chat"])
async def get_my_meetings(
    upcoming: bool = True,
    current_user: Dict = Depends(get_current_user)
):
    """Get my meetings/events"""
    # TODO: Fetch from database
    return {"success": True, "data": {"meetings": []}}

# Include router
app.include_router(api_v1)

# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"}
    )
