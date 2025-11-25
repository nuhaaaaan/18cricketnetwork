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

def require_role(required_roles: List[UserRole]):
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
    # Check if user already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "password": hash_password(request.password),
        "name": request.name,
        "phone": request.phone,
        "role": request.role.value,
        "created_at": datetime.utcnow(),
        "is_verified": False,
        "profile_image": None,
        "location": None,
        "wishlist": [],
        "cart": []
    }
    
    # Insert into database
    result = await db.users.insert_one(user_doc)
    
    # Prepare user data for response (without password)
    user_data = {
        "id": user_doc["id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "role": user_doc["role"]
    }
    
    # Create JWT token
    token = create_access_token({"email": request.email, "role": request.role.value})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@api_v1.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(request: LoginRequest):
    """Login with email and password"""
    # Find user by email
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Prepare user data for response
    user_data = {
        "id": user.get("id", str(user["_id"])),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }
    
    # Create JWT token
    token = create_access_token({"email": user["email"], "role": user["role"]})
    
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
    return {"success": True, "data": current_user}

@api_v1.patch("/users/me", tags=["Users"])
async def update_my_profile(
    updates: Dict,
    current_user: Dict = Depends(get_current_user)
):
    """Update current user profile"""
    # Remove fields that shouldn't be updated this way
    updates.pop('password', None)
    updates.pop('email', None)
    updates.pop('role', None)
    updates['updated_at'] = datetime.utcnow()
    
    # Update database
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": updates}
    )
    
    return {"success": True, "message": "Profile updated", "data": updates}

@api_v1.get("/users/{user_id}", tags=["Users"])
async def get_user_profile(user_id: str):
    """Get user profile by ID (public info)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return only public info
    public_user = {
        "id": user.get("id", str(user["_id"])),
        "name": user["name"],
        "role": user["role"],
        "profile_image": user.get("profile_image"),
        "is_verified": user.get("is_verified", False)
    }
    
    return {"success": True, "data": public_user}

@api_v1.patch("/users/{user_id}/role", tags=["Users"])
async def change_user_role(
    user_id: str,
    new_role: UserRole,
    current_user: Dict = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    """Change user role (admin only)"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role.value, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
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
    verification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "verification_type": verification_type,
        "documents": documents or [],
        "status": "pending",
        "submitted_at": datetime.utcnow(),
        "submitted_by": current_user["id"]
    }
    
    await db.verifications.insert_one(verification_doc)
    
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
    # Check if request already exists
    existing = await db.squad_requests.find_one({
        "from_user_id": current_user["id"],
        "to_user_id": request.to_user_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Request already sent")
    
    # Create squad request
    squad_request = {
        "id": str(uuid.uuid4()),
        "from_user_id": current_user["id"],
        "from_user_name": current_user["name"],
        "to_user_id": request.to_user_id,
        "message": request.message,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.squad_requests.insert_one(squad_request)
    
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
    # Find the request
    request_doc = await db.squad_requests.find_one({"id": request_id})
    if not request_doc or request_doc["to_user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update request status
    await db.squad_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
    )
    
    # Create mutual squad connections
    squad_connection_1 = {
        "user_id": current_user["id"],
        "squad_member_id": request_doc["from_user_id"],
        "added_at": datetime.utcnow()
    }
    squad_connection_2 = {
        "user_id": request_doc["from_user_id"],
        "squad_member_id": current_user["id"],
        "added_at": datetime.utcnow()
    }
    
    await db.squad.insert_many([squad_connection_1, squad_connection_2])
    
    return {"success": True, "message": "Squad request accepted"}

@api_v1.get("/squad/list", tags=["Squad"])
async def get_my_squad(current_user: Dict = Depends(get_current_user)):
    """Get my squad list"""
    # Get squad members
    squad_docs = await db.squad.find({"user_id": current_user["id"]}).to_list(1000)
    squad_ids = [doc["squad_member_id"] for doc in squad_docs]
    
    # Get user details for squad members
    squad_members = []
    for user_id in squad_ids:
        user = await db.users.find_one({"id": user_id})
        if user:
            squad_members.append({
                "id": user.get("id", str(user["_id"])),
                "name": user["name"],
                "profile_image": user.get("profile_image"),
                "role": user["role"]
            })
    
    # Get pending requests
    pending_sent = await db.squad_requests.find({
        "from_user_id": current_user["id"],
        "status": "pending"
    }).to_list(100)
    
    pending_received = await db.squad_requests.find({
        "to_user_id": current_user["id"],
        "status": "pending"
    }).to_list(100)
    
    return {
        "success": True,
        "data": {
            "squad": squad_members,
            "pending_sent": pending_sent,
            "pending_received": pending_received
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
    # Create thread document
    thread_doc = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "participants": [current_user["id"]] + request.participants,
        "is_group": request.is_group,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow(),
        "last_message_at": None
    }
    
    await db.chat_threads.insert_one(thread_doc)
    
    return {
        "success": True,
        "message": "Chat thread created",
        "data": {"thread_id": thread_doc["id"], "participants": thread_doc["participants"]}
    }

@api_v1.get("/chat/threads", tags=["Chat"])
async def get_chat_threads(current_user: Dict = Depends(get_current_user)):
    """Get all chat threads for current user"""
    threads = await db.chat_threads.find({
        "participants": current_user["id"]
    }).sort("last_message_at", -1).to_list(100)
    
    for thread in threads:
        thread['_id'] = str(thread['_id'])
    
    return {"success": True, "data": {"threads": threads}}

@api_v1.get("/chat/threads/{thread_id}/messages", tags=["Chat"])
async def get_thread_messages(
    thread_id: str,
    page: int = 1,
    page_size: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get messages from a thread"""
    # Verify user is participant
    thread = await db.chat_threads.find_one({"id": thread_id})
    if not thread or current_user["id"] not in thread["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Fetch messages
    skip = (page - 1) * page_size
    messages = await db.chat_messages.find({
        "thread_id": thread_id
    }).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    
    total = await db.chat_messages.count_documents({"thread_id": thread_id})
    
    for message in messages:
        message['_id'] = str(message['_id'])
    
    return {
        "success": True,
        "data": {
            "messages": messages,
            "page": page,
            "page_size": page_size,
            "total": total
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
    # Verify participant
    thread = await db.chat_threads.find_one({"id": thread_id})
    if not thread or current_user["id"] not in thread["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create message
    message_doc = {
        "id": str(uuid.uuid4()),
        "thread_id": thread_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "content": request.content,
        "message_type": request.message_type,
        "metadata": request.metadata,
        "created_at": datetime.utcnow(),
        "is_read": False
    }
    
    await db.chat_messages.insert_one(message_doc)
    
    # Update thread last message time
    await db.chat_threads.update_one(
        {"id": thread_id},
        {"$set": {"last_message_at": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Message sent",
        "data": {
            "message_id": message_doc["id"],
            "thread_id": thread_id,
            "sender_id": current_user["id"],
            "content": request.content,
            "timestamp": message_doc["created_at"].isoformat()
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
    meeting_doc = {
        "id": str(uuid.uuid4()),
        "thread_id": thread_id,
        "title": request.title,
        "description": request.description,
        "start_time": request.start_time,
        "end_time": request.end_time,
        "participants": request.participants,
        "location": request.location,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow(),
        "status": "scheduled"
    }
    
    await db.meetings.insert_one(meeting_doc)
    
    return {
        "success": True,
        "message": "Meeting scheduled",
        "data": {
            "meeting_id": meeting_doc["id"],
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
    query = {"participants": current_user["id"]}
    
    if upcoming:
        query["start_time"] = {"$gte": datetime.utcnow()}
        sort_order = 1  # Ascending
    else:
        query["start_time"] = {"$lt": datetime.utcnow()}
        sort_order = -1  # Descending
    
    meetings = await db.meetings.find(query).sort("start_time", sort_order).to_list(100)
    
    for meeting in meetings:
        meeting['_id'] = str(meeting['_id'])
        meeting['start_time'] = meeting['start_time'].isoformat()
        meeting['end_time'] = meeting['end_time'].isoformat()
    
    return {"success": True, "data": {"meetings": meetings}}

# Include main router
app.include_router(api_v1)

# Include additional routers
try:
    from api_routers import marketplace_router, teams_router, leagues_router, services_router, ai_router
    app.include_router(marketplace_router)
    app.include_router(teams_router)
    app.include_router(leagues_router)
    app.include_router(services_router)
    app.include_router(ai_router)
except ImportError as e:
    print(f"Warning: Could not import additional routers: {e}")

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
