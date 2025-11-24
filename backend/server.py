from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Query, Depends, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import razorpay
import jwt
import bcrypt
from bson import ObjectId
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="18 Cricket Ecosystem API")
api_router = APIRouter(prefix="/api")

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Razorpay client (will be initialized when keys are provided)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None

# ==================== MODELS ====================

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserBase(BaseModel):
    phone: str
    email: Optional[EmailStr] = None
    name: str
    user_type: str  # player, vendor, academy, tournament_organizer, admin
    profile_image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserRegister(BaseModel):
    phone: str
    name: str
    email: Optional[EmailStr] = None
    user_type: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Product Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    vendor_name: str
    name: str
    description: str
    category: str  # bat, ball, pads, gloves, shoes, accessories
    price: float
    original_price: Optional[float] = None
    stock: int
    images: List[str] = []  # base64 images
    brand: Optional[str] = None
    is_used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    reviews_count: int = 0

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    original_price: Optional[float] = None
    stock: int
    images: List[str] = []
    brand: Optional[str] = None
    is_used: bool = False

# Academy Models
class Academy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    description: str
    location: str
    city: str
    fees: str
    schedule: str
    images: List[str] = []
    contact_phone: str
    contact_email: Optional[str] = None
    facilities: List[str] = []
    coaches: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    lead_count: int = 0

class AcademyCreate(BaseModel):
    name: str
    description: str
    location: str
    city: str
    fees: str
    schedule: str
    images: List[str] = []
    contact_phone: str
    contact_email: Optional[str] = None
    facilities: List[str] = []
    coaches: List[str] = []

class AcademyLead(BaseModel):
    academy_id: str
    user_id: str
    user_name: str
    user_phone: str
    user_email: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, contacted, enrolled

# Tournament Models
class Tournament(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organizer_id: str
    name: str
    description: str
    location: str
    city: str
    start_date: datetime
    end_date: datetime
    tournament_type: str  # T20, ODI, Test, Box Cricket
    registration_fee: float
    prize_money: Optional[str] = None
    max_teams: int
    teams_registered: int = 0
    images: List[str] = []
    status: str = "upcoming"  # upcoming, ongoing, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TournamentCreate(BaseModel):
    name: str
    description: str
    location: str
    city: str
    start_date: str
    end_date: str
    tournament_type: str
    registration_fee: float
    prize_money: Optional[str] = None
    max_teams: int
    images: List[str] = []

class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    team1_id: str
    team1_name: str
    team2_id: str
    team2_name: str
    match_date: datetime
    venue: str
    status: str = "scheduled"  # scheduled, live, completed
    team1_score: Optional[str] = None
    team2_score: Optional[str] = None
    winner_id: Optional[str] = None
    mvp_player: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Ground Booking Models
class Ground(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    owner_name: str
    owner_phone: str
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ground_type: str  # turf, mat, concrete
    facilities: List[str] = []  # nets, pavilion, lighting, parking
    pricing: Dict[str, float] = {}  # {"hourly": 1000, "match": 5000, "session": 800}
    images: List[str] = []
    time_slots: List[Dict[str, Any]] = []  # [{"day": "Monday", "slots": ["6-8AM", "8-10AM"]}]
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    reviews_count: int = 0
    is_verified: bool = False
    commission_rate: float = 0.15  # 15% platform commission

class GroundCreate(BaseModel):
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ground_type: str
    facilities: List[str] = []
    pricing: Dict[str, float]
    images: List[str] = []
    time_slots: List[Dict[str, Any]] = []
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None

# Training Facilities
class TrainingFacility(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    owner_name: str
    facility_type: str  # practice_nets, indoor_facility, academy, gym
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    facilities: List[str] = []  # bowling_machine, nets, gym, coaching
    pricing: Dict[str, float] = {}
    images: List[str] = []
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    is_verified: bool = False
    commission_rate: float = 0.12  # 12% platform commission

class TrainingFacilityCreate(BaseModel):
    facility_type: str
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    facilities: List[str] = []
    pricing: Dict[str, float]
    images: List[str] = []
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None

# Personal Trainers
class PersonalTrainer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    bio: str
    specialization: List[str] = []  # batting, bowling, fielding, fitness
    experience_years: int
    certifications: List[str] = []
    pricing: Dict[str, float] = {}  # {"per_hour": 1500, "per_session": 2000, "monthly": 15000}
    images: List[str] = []
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None
    availability: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    reviews_count: int = 0
    is_verified: bool = False
    commission_rate: float = 0.10  # 10% platform commission

class PersonalTrainerCreate(BaseModel):
    name: str
    bio: str
    specialization: List[str]
    experience_years: int
    certifications: List[str] = []
    pricing: Dict[str, float]
    images: List[str] = []
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None
    availability: List[str] = []

# Cricket Gyms
class CricketGym(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    owner_name: str
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    facilities: List[str] = []  # strength_training, cardio, yoga, physiotherapy
    pricing: Dict[str, float] = {}  # {"monthly": 3000, "quarterly": 8000, "yearly": 25000}
    images: List[str] = []
    trainers: List[str] = []
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None
    opening_hours: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    is_verified: bool = False
    commission_rate: float = 0.12  # 12% platform commission

class CricketGymCreate(BaseModel):
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    facilities: List[str]
    pricing: Dict[str, float]
    images: List[str] = []
    trainers: List[str] = []
    contact_phone: str
    contact_email: Optional[str] = None
    whatsapp: Optional[str] = None
    opening_hours: str

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ground_id: str
    user_id: str
    user_name: str
    user_phone: str
    booking_date: str
    time_slot: str
    booking_type: str  # hourly, match, nets
    total_amount: float
    payment_status: str = "pending"  # pending, paid, failed
    booking_status: str = "confirmed"  # confirmed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Social Models
class Post(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_image: Optional[str] = None
    content: str
    images: List[str] = []
    post_type: str = "post"  # post, reel, highlight
    likes: int = 0
    comments: int = 0
    shares: int = 0
    video_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_archived: bool = False

class PostCreate(BaseModel):
    content: str
    images: List[str] = []
    post_type: str = "post"
    video_url: Optional[str] = None

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    user_name: str
    user_image: Optional[str] = None
    content: str
    likes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentCreate(BaseModel):
    content: str

class DirectMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: str
    receiver_id: str
    content: str
    images: List[str] = []
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Squad(BaseModel):
    user_id: str
    squad_member_id: str
    squad_member_name: str
    squad_member_image: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class GroupChat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    creator_id: str
    members: List[str] = []  # user_ids
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    sender_id: str
    sender_name: str
    content: str
    images: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Story(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_image: Optional[str] = None
    image: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=24))
    is_highlight: bool = False
    highlight_name: Optional[str] = None

class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    captain_id: str
    captain_name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    members: List[str] = []  # user_ids
    city: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    matches_played: int = 0
    matches_won: int = 0

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    city: str

# Live Streaming Models
class LiveStream(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    broadcaster_id: str
    broadcaster_name: str
    broadcaster_type: str  # official, local, verified
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    stream_url: str
    is_live: bool = True
    viewers: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    region: str = "India"  # India, US, Australia, Canada, UK, etc.
    match_info: Optional[Dict[str, Any]] = None

class LiveStreamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    stream_url: str
    broadcaster_type: str = "local"
    region: str = "India"
    match_info: Optional[Dict[str, Any]] = None

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    vendor_id: str
    vendor_name: str
    quantity: int
    price: float
    image: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_phone: str
    user_email: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    platform_commission: float
    shipping_address: str
    city: str
    pincode: str
    payment_status: str = "pending"  # pending, paid, failed
    order_status: str = "placed"  # placed, confirmed, shipped, delivered, cancelled
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: str
    city: str
    pincode: str

# ==================== AUTH UTILITIES ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")
    token = authorization.split(' ')[1]
    payload = verify_token(token)
    user = await db.users.find_one({"phone": payload.get("phone")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user['_id'] = str(user['_id'])
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"phone": user_data.phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Hash password
    hashed_pwd = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict['password'] = hashed_pwd
    user_dict['created_at'] = datetime.utcnow()
    user_dict['wishlist'] = []
    user_dict['cart'] = []
    
    result = await db.users.insert_one(user_dict)
    user_dict['_id'] = str(result.inserted_id)
    
    # Create token
    token = create_access_token({"phone": user_data.phone, "user_type": user_data.user_type})
    
    # Remove password from response
    user_dict.pop('password')
    
    return TokenResponse(
        access_token=token,
        user=user_dict
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"phone": credentials.phone})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    
    token = create_access_token({"phone": user['phone'], "user_type": user['user_type']})
    
    user['_id'] = str(user['_id'])
    user.pop('password')
    
    return TokenResponse(
        access_token=token,
        user=user
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== PRODUCT ROUTES ====================

@api_router.post("/products")
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] not in ['vendor', 'admin']:
        raise HTTPException(status_code=403, detail="Only vendors can create products")
    
    product_dict = product.dict()
    product_dict['id'] = str(uuid.uuid4())
    product_dict['vendor_id'] = str(current_user['_id'])
    product_dict['vendor_name'] = current_user['name']
    product_dict['created_at'] = datetime.utcnow()
    product_dict['rating'] = 0.0
    product_dict['reviews_count'] = 0
    
    result = await db.products.insert_one(product_dict)
    product_dict['_id'] = str(result.inserted_id)
    return product_dict

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    is_used: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    query = {}
    if category:
        query['category'] = category
    if is_used is not None:
        query['is_used'] = is_used
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'brand': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(query).limit(limit).to_list(limit)
    for product in products:
        product['_id'] = str(product['_id'])
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product['_id'] = str(product['_id'])
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_update: ProductCreate, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['vendor_id'] != str(current_user['_id']) and current_user['user_type'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = product_update.dict(exclude_unset=True)
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    return {"message": "Product updated successfully"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['vendor_id'] != str(current_user['_id']) and current_user['user_type'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted successfully"}

# ==================== ACADEMY ROUTES ====================

@api_router.post("/academies")
async def create_academy(academy: AcademyCreate, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] not in ['academy', 'admin']:
        raise HTTPException(status_code=403, detail="Only academy owners can create academies")
    
    academy_dict = academy.dict()
    academy_dict['id'] = str(uuid.uuid4())
    academy_dict['owner_id'] = str(current_user['_id'])
    academy_dict['created_at'] = datetime.utcnow()
    academy_dict['rating'] = 0.0
    academy_dict['lead_count'] = 0
    
    await db.academies.insert_one(academy_dict)
    return academy_dict

@api_router.get("/academies")
async def get_academies(city: Optional[str] = None, limit: int = 50):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    
    academies = await db.academies.find(query).limit(limit).to_list(limit)
    for academy in academies:
        academy['_id'] = str(academy['_id'])
    return academies

@api_router.get("/academies/{academy_id}")
async def get_academy(academy_id: str):
    academy = await db.academies.find_one({"id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    academy['_id'] = str(academy['_id'])
    return academy

@api_router.post("/academies/{academy_id}/leads")
async def create_academy_lead(academy_id: str, message: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    academy = await db.academies.find_one({"id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    
    lead = AcademyLead(
        academy_id=academy_id,
        user_id=str(current_user['_id']),
        user_name=current_user['name'],
        user_phone=current_user['phone'],
        user_email=current_user.get('email'),
        message=message
    )
    
    await db.academy_leads.insert_one(lead.dict())
    await db.academies.update_one({"id": academy_id}, {"$inc": {"lead_count": 1}})
    
    return {"message": "Lead submitted successfully", "lead": lead.dict()}

# ==================== TOURNAMENT ROUTES ====================

@api_router.post("/tournaments")
async def create_tournament(tournament: TournamentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] not in ['tournament_organizer', 'admin']:
        raise HTTPException(status_code=403, detail="Only tournament organizers can create tournaments")
    
    tournament_dict = tournament.dict()
    tournament_dict['id'] = str(uuid.uuid4())
    tournament_dict['organizer_id'] = str(current_user['_id'])
    tournament_dict['start_date'] = datetime.fromisoformat(tournament.start_date)
    tournament_dict['end_date'] = datetime.fromisoformat(tournament.end_date)
    tournament_dict['teams_registered'] = 0
    tournament_dict['status'] = 'upcoming'
    tournament_dict['created_at'] = datetime.utcnow()
    
    await db.tournaments.insert_one(tournament_dict)
    return tournament_dict

@api_router.get("/tournaments")
async def get_tournaments(city: Optional[str] = None, status: Optional[str] = None, limit: int = 50):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if status:
        query['status'] = status
    
    tournaments = await db.tournaments.find(query).sort('start_date', -1).limit(limit).to_list(limit)
    for tournament in tournaments:
        tournament['_id'] = str(tournament['_id'])
        tournament['start_date'] = tournament['start_date'].isoformat()
        tournament['end_date'] = tournament['end_date'].isoformat()
    return tournaments

@api_router.get("/tournaments/{tournament_id}")
async def get_tournament(tournament_id: str):
    tournament = await db.tournaments.find_one({"id": tournament_id})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    tournament['_id'] = str(tournament['_id'])
    tournament['start_date'] = tournament['start_date'].isoformat()
    tournament['end_date'] = tournament['end_date'].isoformat()
    return tournament

@api_router.get("/tournaments/{tournament_id}/matches")
async def get_tournament_matches(tournament_id: str):
    matches = await db.matches.find({"tournament_id": tournament_id}).to_list(100)
    for match in matches:
        match['_id'] = str(match['_id'])
        match['match_date'] = match['match_date'].isoformat()
    return matches

# ==================== GROUND ROUTES ====================

@api_router.post("/grounds")
async def create_ground(ground: GroundCreate, current_user: dict = Depends(get_current_user)):
    ground_dict = ground.dict()
    ground_dict['id'] = str(uuid.uuid4())
    ground_dict['owner_id'] = str(current_user['_id'])
    ground_dict['owner_name'] = current_user['name']
    ground_dict['owner_phone'] = current_user['phone']
    ground_dict['created_at'] = datetime.utcnow()
    ground_dict['rating'] = 0.0
    ground_dict['reviews_count'] = 0
    ground_dict['is_verified'] = False
    ground_dict['commission_rate'] = 0.15
    
    await db.grounds.insert_one(ground_dict)
    return ground_dict

@api_router.get("/grounds")
async def get_grounds(
    city: Optional[str] = None, 
    ground_type: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 10,
    limit: int = 50
):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if ground_type:
        query['ground_type'] = ground_type
    
    # Nearby search using coordinates
    if latitude is not None and longitude is not None:
        query['latitude'] = {'$exists': True}
        query['longitude'] = {'$exists': True}
        # Simple distance calculation (for production, use MongoDB geospatial queries)
        grounds = await db.grounds.find(query).to_list(200)
        
        # Calculate distance and filter
        nearby_grounds = []
        for ground in grounds:
            if ground.get('latitude') and ground.get('longitude'):
                # Haversine formula approximation
                lat_diff = abs(ground['latitude'] - latitude)
                lon_diff = abs(ground['longitude'] - longitude)
                distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111  # rough km
                if distance <= radius_km:
                    ground['distance_km'] = round(distance, 2)
                    ground['_id'] = str(ground['_id'])
                    nearby_grounds.append(ground)
        
        nearby_grounds.sort(key=lambda x: x.get('distance_km', 999))
        return nearby_grounds[:limit]
    
    grounds = await db.grounds.find(query).limit(limit).to_list(limit)
    for ground in grounds:
        ground['_id'] = str(ground['_id'])
    return grounds

@api_router.get("/grounds/nearby")
async def get_nearby_grounds(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
    ground_type: Optional[str] = None
):
    return await get_grounds(latitude=latitude, longitude=longitude, radius_km=radius_km, ground_type=ground_type)

@api_router.get("/grounds/{ground_id}")
async def get_ground(ground_id: str):
    ground = await db.grounds.find_one({"id": ground_id})
    if not ground:
        raise HTTPException(status_code=404, detail="Ground not found")
    ground['_id'] = str(ground['_id'])
    return ground

@api_router.put("/grounds/{ground_id}")
async def update_ground(ground_id: str, ground_update: GroundCreate, current_user: dict = Depends(get_current_user)):
    ground = await db.grounds.find_one({"id": ground_id})
    if not ground or ground['owner_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = ground_update.dict(exclude_unset=True)
    await db.grounds.update_one({"id": ground_id}, {"$set": update_data})
    return {"message": "Ground updated"}

# ==================== TRAINING FACILITIES ====================

@api_router.post("/training-facilities")
async def create_training_facility(facility: TrainingFacilityCreate, current_user: dict = Depends(get_current_user)):
    facility_dict = facility.dict()
    facility_dict['id'] = str(uuid.uuid4())
    facility_dict['owner_id'] = str(current_user['_id'])
    facility_dict['owner_name'] = current_user['name']
    facility_dict['created_at'] = datetime.utcnow()
    facility_dict['rating'] = 0.0
    facility_dict['is_verified'] = False
    facility_dict['commission_rate'] = 0.12
    
    await db.training_facilities.insert_one(facility_dict)
    return facility_dict

@api_router.get("/training-facilities")
async def get_training_facilities(
    city: Optional[str] = None,
    facility_type: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 10,
    limit: int = 50
):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if facility_type:
        query['facility_type'] = facility_type
    
    if latitude is not None and longitude is not None:
        facilities = await db.training_facilities.find(query).to_list(200)
        nearby_facilities = []
        for facility in facilities:
            if facility.get('latitude') and facility.get('longitude'):
                lat_diff = abs(facility['latitude'] - latitude)
                lon_diff = abs(facility['longitude'] - longitude)
                distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
                if distance <= radius_km:
                    facility['distance_km'] = round(distance, 2)
                    facility['_id'] = str(facility['_id'])
                    nearby_facilities.append(facility)
        nearby_facilities.sort(key=lambda x: x.get('distance_km', 999))
        return nearby_facilities[:limit]
    
    facilities = await db.training_facilities.find(query).limit(limit).to_list(limit)
    for facility in facilities:
        facility['_id'] = str(facility['_id'])
    return facilities

@api_router.get("/training-facilities/{facility_id}")
async def get_training_facility(facility_id: str):
    facility = await db.training_facilities.find_one({"id": facility_id})
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    facility['_id'] = str(facility['_id'])
    return facility

# ==================== PERSONAL TRAINERS ====================

@api_router.post("/personal-trainers")
async def create_personal_trainer(trainer: PersonalTrainerCreate, current_user: dict = Depends(get_current_user)):
    trainer_dict = trainer.dict()
    trainer_dict['id'] = str(uuid.uuid4())
    trainer_dict['user_id'] = str(current_user['_id'])
    trainer_dict['created_at'] = datetime.utcnow()
    trainer_dict['rating'] = 0.0
    trainer_dict['reviews_count'] = 0
    trainer_dict['is_verified'] = False
    trainer_dict['commission_rate'] = 0.10
    
    await db.personal_trainers.insert_one(trainer_dict)
    return trainer_dict

@api_router.get("/personal-trainers")
async def get_personal_trainers(
    city: Optional[str] = None,
    specialization: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 10,
    limit: int = 50
):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if specialization:
        query['specialization'] = specialization
    
    if latitude is not None and longitude is not None:
        trainers = await db.personal_trainers.find(query).to_list(200)
        nearby_trainers = []
        for trainer in trainers:
            if trainer.get('latitude') and trainer.get('longitude'):
                lat_diff = abs(trainer['latitude'] - latitude)
                lon_diff = abs(trainer['longitude'] - longitude)
                distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
                if distance <= radius_km:
                    trainer['distance_km'] = round(distance, 2)
                    trainer['_id'] = str(trainer['_id'])
                    nearby_trainers.append(trainer)
        nearby_trainers.sort(key=lambda x: x.get('distance_km', 999))
        return nearby_trainers[:limit]
    
    trainers = await db.personal_trainers.find(query).limit(limit).to_list(limit)
    for trainer in trainers:
        trainer['_id'] = str(trainer['_id'])
    return trainers

@api_router.get("/personal-trainers/{trainer_id}")
async def get_personal_trainer(trainer_id: str):
    trainer = await db.personal_trainers.find_one({"id": trainer_id})
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    trainer['_id'] = str(trainer['_id'])
    return trainer

# ==================== CRICKET GYMS ====================

@api_router.post("/cricket-gyms")
async def create_cricket_gym(gym: CricketGymCreate, current_user: dict = Depends(get_current_user)):
    gym_dict = gym.dict()
    gym_dict['id'] = str(uuid.uuid4())
    gym_dict['owner_id'] = str(current_user['_id'])
    gym_dict['owner_name'] = current_user['name']
    gym_dict['created_at'] = datetime.utcnow()
    gym_dict['rating'] = 0.0
    gym_dict['is_verified'] = False
    gym_dict['commission_rate'] = 0.12
    
    await db.cricket_gyms.insert_one(gym_dict)
    return gym_dict

@api_router.get("/cricket-gyms")
async def get_cricket_gyms(
    city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 10,
    limit: int = 50
):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    
    if latitude is not None and longitude is not None:
        gyms = await db.cricket_gyms.find(query).to_list(200)
        nearby_gyms = []
        for gym in gyms:
            if gym.get('latitude') and gym.get('longitude'):
                lat_diff = abs(gym['latitude'] - latitude)
                lon_diff = abs(gym['longitude'] - longitude)
                distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
                if distance <= radius_km:
                    gym['distance_km'] = round(distance, 2)
                    gym['_id'] = str(gym['_id'])
                    nearby_gyms.append(gym)
        nearby_gyms.sort(key=lambda x: x.get('distance_km', 999))
        return nearby_gyms[:limit]
    
    gyms = await db.cricket_gyms.find(query).limit(limit).to_list(limit)
    for gym in gyms:
        gym['_id'] = str(gym['_id'])
    return gyms

@api_router.get("/cricket-gyms/{gym_id}")
async def get_cricket_gym(gym_id: str):
    gym = await db.cricket_gyms.find_one({"id": gym_id})
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    gym['_id'] = str(gym['_id'])
    return gym

@api_router.post("/bookings")
async def create_booking(booking_data: dict, current_user: dict = Depends(get_current_user)):
    ground = await db.grounds.find_one({"id": booking_data['ground_id']})
    if not ground:
        raise HTTPException(status_code=404, detail="Ground not found")
    
    booking = Booking(
        ground_id=booking_data['ground_id'],
        user_id=str(current_user['_id']),
        user_name=current_user['name'],
        user_phone=current_user['phone'],
        booking_date=booking_data['booking_date'],
        time_slot=booking_data['time_slot'],
        booking_type=booking_data['booking_type'],
        total_amount=booking_data['total_amount']
    )
    
    await db.bookings.insert_one(booking.dict())
    return booking.dict()

@api_router.get("/bookings")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": str(current_user['_id'])}).to_list(100)
    for booking in bookings:
        booking['_id'] = str(booking['_id'])
    return bookings

# ==================== SOCIAL ROUTES ====================

@api_router.post("/posts")
async def create_post(post: PostCreate, current_user: dict = Depends(get_current_user)):
    post_dict = post.dict()
    post_dict['id'] = str(uuid.uuid4())
    post_dict['user_id'] = str(current_user['_id'])
    post_dict['user_name'] = current_user['name']
    post_dict['user_image'] = current_user.get('profile_image')
    post_dict['likes'] = 0
    post_dict['comments'] = 0
    post_dict['created_at'] = datetime.utcnow()
    
    await db.posts.insert_one(post_dict)
    return post_dict

@api_router.get("/posts")
async def get_posts(limit: int = 50, skip: int = 0):
    posts = await db.posts.find().sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    for post in posts:
        post['_id'] = str(post['_id'])
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.posts.update_one({"id": post_id}, {"$inc": {"likes": 1}})
    return {"message": "Post liked"}

@api_router.post("/posts/{post_id}/share")
async def share_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.posts.update_one({"id": post_id}, {"$inc": {"shares": 1}})
    return {"message": "Post shared", "share_link": f"/posts/{post_id}"}

@api_router.post("/posts/{post_id}/archive")
async def archive_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post or post['user_id'] != str(current_user['_id']):
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.posts.update_one({"id": post_id}, {"$set": {"is_archived": True}})
    return {"message": "Post archived"}

# ==================== COMMENTS ====================

@api_router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_dict = comment.dict()
    comment_dict['id'] = str(uuid.uuid4())
    comment_dict['post_id'] = post_id
    comment_dict['user_id'] = str(current_user['_id'])
    comment_dict['user_name'] = current_user['name']
    comment_dict['user_image'] = current_user.get('profile_image')
    comment_dict['likes'] = 0
    comment_dict['created_at'] = datetime.utcnow()
    
    await db.comments.insert_one(comment_dict)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comments": 1}})
    
    return comment_dict

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, limit: int = 50):
    comments = await db.comments.find({"post_id": post_id}).sort('created_at', -1).limit(limit).to_list(limit)
    for comment in comments:
        comment['_id'] = str(comment['_id'])
    return comments

# ==================== REELS ====================

@api_router.get("/reels")
async def get_reels(limit: int = 50, skip: int = 0):
    reels = await db.posts.find({"post_type": "reel", "is_archived": False}).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    for reel in reels:
        reel['_id'] = str(reel['_id'])
    return reels

# ==================== STORIES ====================

@api_router.post("/stories")
async def create_story(story_data: dict, current_user: dict = Depends(get_current_user)):
    story = Story(
        user_id=str(current_user['_id']),
        user_name=current_user['name'],
        user_image=current_user.get('profile_image'),
        image=story_data['image'],
        is_highlight=story_data.get('is_highlight', False),
        highlight_name=story_data.get('highlight_name')
    )
    
    await db.stories.insert_one(story.dict())
    return story.dict()

@api_router.get("/stories")
async def get_stories():
    # Get stories that haven't expired
    current_time = datetime.utcnow()
    stories = await db.stories.find({"expires_at": {"$gt": current_time}, "is_highlight": False}).to_list(100)
    for story in stories:
        story['_id'] = str(story['_id'])
    return stories

@api_router.get("/stories/highlights/{user_id}")
async def get_highlights(user_id: str):
    highlights = await db.stories.find({"user_id": user_id, "is_highlight": True}).to_list(100)
    for highlight in highlights:
        highlight['_id'] = str(highlight['_id'])
    return highlights

# ==================== SQUAD (FRIENDS) ====================

@api_router.post("/squad/add/{user_id}")
async def add_to_squad(user_id: str, current_user: dict = Depends(get_current_user)):
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    squad = Squad(
        user_id=str(current_user['_id']),
        squad_member_id=user_id,
        squad_member_name=target_user['name'],
        squad_member_image=target_user.get('profile_image')
    )
    
    await db.squad.insert_one(squad.dict())
    return {"message": f"Added {target_user['name']} to squad"}

@api_router.delete("/squad/remove/{user_id}")
async def remove_from_squad(user_id: str, current_user: dict = Depends(get_current_user)):
    await db.squad.delete_one({"user_id": str(current_user['_id']), "squad_member_id": user_id})
    return {"message": "Removed from squad"}

@api_router.get("/squad")
async def get_squad(current_user: dict = Depends(get_current_user)):
    squad_members = await db.squad.find({"user_id": str(current_user['_id'])}).to_list(1000)
    for member in squad_members:
        member['_id'] = str(member['_id'])
    return squad_members

# ==================== DIRECT MESSAGES ====================

@api_router.post("/messages/send")
async def send_message(message_data: dict, current_user: dict = Depends(get_current_user)):
    message = DirectMessage(
        sender_id=str(current_user['_id']),
        sender_name=current_user['name'],
        receiver_id=message_data['receiver_id'],
        content=message_data['content'],
        images=message_data.get('images', [])
    )
    
    await db.direct_messages.insert_one(message.dict())
    return message.dict()

@api_router.get("/messages/{user_id}")
async def get_messages(user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.direct_messages.find({
        "$or": [
            {"sender_id": str(current_user['_id']), "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": str(current_user['_id'])}
        ]
    }).sort('created_at', 1).to_list(1000)
    
    for message in messages:
        message['_id'] = str(message['_id'])
    
    # Mark messages as read
    await db.direct_messages.update_many(
        {"sender_id": user_id, "receiver_id": str(current_user['_id']), "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return messages

@api_router.get("/messages")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    # Get unique conversations
    conversations = await db.direct_messages.aggregate([
        {
            "$match": {
                "$or": [
                    {"sender_id": str(current_user['_id'])},
                    {"receiver_id": str(current_user['_id'])}
                ]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", str(current_user['_id'])]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$$ROOT"}
            }
        }
    ]).to_list(100)
    
    return conversations

# ==================== GROUP CHATS ====================

@api_router.post("/groups/create")
async def create_group(group_data: dict, current_user: dict = Depends(get_current_user)):
    if len(group_data.get('members', [])) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 members allowed")
    
    group = GroupChat(
        name=group_data['name'],
        creator_id=str(current_user['_id']),
        members=[str(current_user['_id'])] + group_data.get('members', []),
        image=group_data.get('image')
    )
    
    await db.group_chats.insert_one(group.dict())
    return group.dict()

@api_router.post("/groups/{group_id}/add-members")
async def add_group_members(group_id: str, member_ids: List[str], current_user: dict = Depends(get_current_user)):
    group = await db.group_chats.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    current_members = group['members']
    if len(current_members) + len(member_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 members allowed")
    
    await db.group_chats.update_one(
        {"id": group_id},
        {"$addToSet": {"members": {"$each": member_ids}}}
    )
    
    return {"message": "Members added to group"}

@api_router.post("/groups/{group_id}/messages")
async def send_group_message(group_id: str, message_data: dict, current_user: dict = Depends(get_current_user)):
    group = await db.group_chats.find_one({"id": group_id})
    if not group or str(current_user['_id']) not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    message = GroupMessage(
        group_id=group_id,
        sender_id=str(current_user['_id']),
        sender_name=current_user['name'],
        content=message_data['content'],
        images=message_data.get('images', [])
    )
    
    await db.group_messages.insert_one(message.dict())
    return message.dict()

@api_router.get("/groups/{group_id}/messages")
async def get_group_messages(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.group_chats.find_one({"id": group_id})
    if not group or str(current_user['_id']) not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    messages = await db.group_messages.find({"group_id": group_id}).sort('created_at', 1).to_list(1000)
    for message in messages:
        message['_id'] = str(message['_id'])
    return messages

@api_router.get("/groups")
async def get_groups(current_user: dict = Depends(get_current_user)):
    groups = await db.group_chats.find({"members": str(current_user['_id'])}).to_list(100)
    for group in groups:
        group['_id'] = str(group['_id'])
    return groups

# ==================== PROFILE PHOTO ====================

@api_router.post("/profile/photo")
async def update_profile_photo(photo_data: dict, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$set": {"profile_image": photo_data['image']}}
    )
    return {"message": "Profile photo updated"}

@api_router.delete("/profile/photo")
async def delete_profile_photo(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$set": {"profile_image": None}}
    )
    return {"message": "Profile photo deleted"}

# ==================== LIVE STREAMING ====================

@api_router.post("/livestreams")
async def create_livestream(stream: LiveStreamCreate, current_user: dict = Depends(get_current_user)):
    stream_dict = stream.dict()
    stream_dict['id'] = str(uuid.uuid4())
    stream_dict['broadcaster_id'] = str(current_user['_id'])
    stream_dict['broadcaster_name'] = current_user['name']
    stream_dict['is_live'] = True
    stream_dict['viewers'] = 0
    stream_dict['started_at'] = datetime.utcnow()
    
    await db.livestreams.insert_one(stream_dict)
    return stream_dict

@api_router.get("/livestreams")
async def get_livestreams(region: Optional[str] = None, is_live: bool = True):
    query = {"is_live": is_live}
    if region:
        query['region'] = region
    
    streams = await db.livestreams.find(query).sort('started_at', -1).to_list(50)
    for stream in streams:
        stream['_id'] = str(stream['_id'])
    return streams

@api_router.get("/livestreams/{stream_id}")
async def get_livestream(stream_id: str):
    stream = await db.livestreams.find_one({"id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    stream['_id'] = str(stream['_id'])
    return stream

@api_router.post("/livestreams/{stream_id}/join")
async def join_livestream(stream_id: str, current_user: dict = Depends(get_current_user)):
    await db.livestreams.update_one({"id": stream_id}, {"$inc": {"viewers": 1}})
    return {"message": "Joined stream"}

@api_router.post("/livestreams/{stream_id}/leave")
async def leave_livestream(stream_id: str, current_user: dict = Depends(get_current_user)):
    await db.livestreams.update_one({"id": stream_id}, {"$inc": {"viewers": -1}})
    return {"message": "Left stream"}

@api_router.post("/livestreams/{stream_id}/end")
async def end_livestream(stream_id: str, current_user: dict = Depends(get_current_user)):
    stream = await db.livestreams.find_one({"id": stream_id})
    if not stream or stream['broadcaster_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.livestreams.update_one({"id": stream_id}, {"$set": {"is_live": False}})
    return {"message": "Stream ended"}

# ==================== ADVANCED SEARCH ====================

@api_router.get("/search")
async def search(
    query: str,
    type: Optional[str] = None,  # users, products, academies, tournaments, grounds
    region: Optional[str] = None,
    limit: int = 50
):
    results = {
        "users": [],
        "products": [],
        "academies": [],
        "tournaments": [],
        "grounds": [],
        "livestreams": []
    }
    
    search_regex = {"$regex": query, "$options": "i"}
    
    if not type or type == "users":
        users = await db.users.find({
            "$or": [
                {"name": search_regex},
                {"phone": search_regex}
            ]
        }).limit(limit).to_list(limit)
        for user in users:
            user['_id'] = str(user['_id'])
            user.pop('password', None)
        results['users'] = users
    
    if not type or type == "products":
        products = await db.products.find({
            "$or": [
                {"name": search_regex},
                {"description": search_regex},
                {"brand": search_regex}
            ]
        }).limit(limit).to_list(limit)
        for product in products:
            product['_id'] = str(product['_id'])
        results['products'] = products
    
    if not type or type == "academies":
        academies = await db.academies.find({
            "$or": [
                {"name": search_regex},
                {"city": search_regex},
                {"description": search_regex}
            ]
        }).limit(limit).to_list(limit)
        for academy in academies:
            academy['_id'] = str(academy['_id'])
        results['academies'] = academies
    
    if not type or type == "tournaments":
        tournaments = await db.tournaments.find({
            "$or": [
                {"name": search_regex},
                {"city": search_regex},
                {"description": search_regex}
            ]
        }).limit(limit).to_list(limit)
        for tournament in tournaments:
            tournament['_id'] = str(tournament['_id'])
        results['tournaments'] = tournaments
    
    if not type or type == "grounds":
        grounds = await db.grounds.find({
            "$or": [
                {"name": search_regex},
                {"city": search_regex},
                {"description": search_regex}
            ]
        }).limit(limit).to_list(limit)
        for ground in grounds:
            ground['_id'] = str(ground['_id'])
        results['grounds'] = grounds
    
    if not type or type == "livestreams":
        livestreams = await db.livestreams.find({
            "$and": [
                {"is_live": True},
                {"$or": [
                    {"title": search_regex},
                    {"broadcaster_name": search_regex}
                ]}
            ]
        }).limit(limit).to_list(limit)
        for stream in livestreams:
            stream['_id'] = str(stream['_id'])
        results['livestreams'] = livestreams
    
    return results

# ==================== VERIFICATION ====================

@api_router.post("/users/{user_id}/verify")
async def verify_user(user_id: str, verification_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can verify users")
    
    verification_type = verification_data.get('type', 'verified')  # verified, official
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "is_verified": True,
            "verification_type": verification_type,
            "verified_at": datetime.utcnow()
        }}
    )
    
    return {"message": f"User verified as {verification_type}"}

@api_router.get("/users/verified")
async def get_verified_users(type: Optional[str] = None):
    query = {"is_verified": True}
    if type:
        query['verification_type'] = type
    
    users = await db.users.find(query).to_list(100)
    for user in users:
        user['_id'] = str(user['_id'])
        user.pop('password', None)
    return users

# ==================== REGIONS ====================

@api_router.get("/regions")
async def get_regions():
    return {
        "regions": [
            {"code": "IN", "name": "India", "flag": "🇮🇳"},
            {"code": "US", "name": "United States", "flag": "🇺🇸"},
            {"code": "AU", "name": "Australia", "flag": "🇦🇺"},
            {"code": "UK", "name": "United Kingdom", "flag": "🇬🇧"},
            {"code": "CA", "name": "Canada", "flag": "🇨🇦"},
            {"code": "NZ", "name": "New Zealand", "flag": "🇳🇿"},
            {"code": "SA", "name": "South Africa", "flag": "🇿🇦"},
            {"code": "PK", "name": "Pakistan", "flag": "🇵🇰"},
            {"code": "BD", "name": "Bangladesh", "flag": "🇧🇩"},
            {"code": "SL", "name": "Sri Lanka", "flag": "🇱🇰"},
            {"code": "WI", "name": "West Indies", "flag": "🏴"},
            {"code": "AF", "name": "Afghanistan", "flag": "🇦🇫"},
        ]
    }

@api_router.post("/teams")
async def create_team(team: TeamCreate, current_user: dict = Depends(get_current_user)):
    team_dict = team.dict()
    team_dict['id'] = str(uuid.uuid4())
    team_dict['captain_id'] = str(current_user['_id'])
    team_dict['captain_name'] = current_user['name']
    team_dict['members'] = [str(current_user['_id'])]
    team_dict['created_at'] = datetime.utcnow()
    team_dict['matches_played'] = 0
    team_dict['matches_won'] = 0
    
    await db.teams.insert_one(team_dict)
    return team_dict

@api_router.get("/teams")
async def get_teams(city: Optional[str] = None, limit: int = 50):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    
    teams = await db.teams.find(query).limit(limit).to_list(limit)
    for team in teams:
        team['_id'] = str(team['_id'])
    return teams

@api_router.get("/teams/{team_id}")
async def get_team(team_id: str):
    team = await db.teams.find_one({"id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team['_id'] = str(team['_id'])
    return team

# ==================== ORDER ROUTES ====================

@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    # Calculate total and commission
    total = sum(item.price * item.quantity for item in order_data.items)
    commission = total * 0.15  # 15% platform commission
    
    order = Order(
        user_id=str(current_user['_id']),
        user_name=current_user['name'],
        user_phone=current_user['phone'],
        user_email=current_user.get('email'),
        items=[item.dict() for item in order_data.items],
        total_amount=total,
        platform_commission=commission,
        shipping_address=order_data.shipping_address,
        city=order_data.city,
        pincode=order_data.pincode
    )
    
    # Create Razorpay order if configured
    if razorpay_client:
        try:
            razorpay_order = razorpay_client.order.create({
                "amount": int(total * 100),  # Amount in paise
                "currency": "INR",
                "payment_capture": 1
            })
            order.razorpay_order_id = razorpay_order['id']
        except Exception as e:
            logging.error(f"Razorpay error: {e}")
    
    order_dict = order.dict()
    await db.orders.insert_one(order_dict)
    
    return order_dict

@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] == 'vendor':
        # Get orders containing vendor's products
        orders = await db.orders.find(
            {"items.vendor_id": str(current_user['_id'])}
        ).sort('created_at', -1).to_list(100)
    elif current_user['user_type'] == 'admin':
        orders = await db.orders.find().sort('created_at', -1).to_list(100)
    else:
        orders = await db.orders.find(
            {"user_id": str(current_user['_id'])}
        ).sort('created_at', -1).to_list(100)
    
    for order in orders:
        order['_id'] = str(order['_id'])
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['user_id'] != str(current_user['_id']) and current_user['user_type'] not in ['admin', 'vendor']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    order['_id'] = str(order['_id'])
    return order

@api_router.post("/orders/{order_id}/payment-success")
async def payment_success(order_id: str, payment_data: dict, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "payment_status": "paid",
                "order_status": "confirmed",
                "razorpay_payment_id": payment_data.get('razorpay_payment_id'),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Payment successful", "order_id": order_id}

# ==================== WISHLIST & CART ====================

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$addToSet": {"wishlist": product_id}}
    )
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$pull": {"wishlist": product_id}}
    )
    return {"message": "Removed from wishlist"}

@api_router.get("/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user['_id'])})
    wishlist_ids = user.get('wishlist', [])
    products = await db.products.find({"id": {"$in": wishlist_ids}}).to_list(100)
    for product in products:
        product['_id'] = str(product['_id'])
    return products

# ==================== STATS & DASHBOARD ====================

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] == 'vendor':
        products_count = await db.products.count_documents({"vendor_id": str(current_user['_id'])})
        orders_count = await db.orders.count_documents({"items.vendor_id": str(current_user['_id'])})
        return {
            "products": products_count,
            "orders": orders_count
        }
    elif current_user['user_type'] == 'admin':
        users = await db.users.count_documents({})
        products = await db.products.count_documents({})
        orders = await db.orders.count_documents({})
        academies = await db.academies.count_documents({})
        tournaments = await db.tournaments.count_documents({})
        return {
            "users": users,
            "products": products,
            "orders": orders,
            "academies": academies,
            "tournaments": tournaments
        }
    else:
        orders = await db.orders.count_documents({"user_id": str(current_user['_id'])})
        bookings = await db.bookings.count_documents({"user_id": str(current_user['_id'])})
        return {
            "orders": orders,
            "bookings": bookings
        }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()