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
    name: str
    description: str
    location: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ground_type: str  # turf, mat, concrete
    facilities: List[str] = []  # nets, pavilion, lighting, parking
    pricing: Dict[str, float] = {}  # {"hourly": 1000, "match": 5000}
    images: List[str] = []
    availability: List[str] = []  # time slots
    contact_phone: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0

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
    availability: List[str] = []
    contact_phone: str

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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PostCreate(BaseModel):
    content: str
    images: List[str] = []
    post_type: str = "post"

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
    
    await db.products.insert_one(product_dict)
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
    ground_dict['created_at'] = datetime.utcnow()
    ground_dict['rating'] = 0.0
    
    await db.grounds.insert_one(ground_dict)
    return ground_dict

@api_router.get("/grounds")
async def get_grounds(city: Optional[str] = None, ground_type: Optional[str] = None, limit: int = 50):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if ground_type:
        query['ground_type'] = ground_type
    
    grounds = await db.grounds.find(query).limit(limit).to_list(limit)
    for ground in grounds:
        ground['_id'] = str(ground['_id'])
    return grounds

@api_router.get("/grounds/{ground_id}")
async def get_ground(ground_id: str):
    ground = await db.grounds.find_one({"id": ground_id})
    if not ground:
        raise HTTPException(status_code=404, detail="Ground not found")
    ground['_id'] = str(ground['_id'])
    return ground

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