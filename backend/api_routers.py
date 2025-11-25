"""
Additional API routers for 18 Cricket Network
Marketplace, Teams, Leagues, Services, Payments, AI Features
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ==================== MARKETPLACE MODELS ====================

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str  # Equipment, Nutrition, Training, Health
    sub_category: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    stock: int
    images: List[str] = []
    brand: Optional[str] = None
    is_used: bool = False
    specifications: Dict[str, Any] = {}

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None

# ==================== MARKETPLACE ROUTER ====================

marketplace_router = APIRouter(prefix="/api/v1/marketplace", tags=["Marketplace"])

@marketplace_router.post("/products")
async def create_product(product: ProductCreate, current_user: Dict = Depends(lambda: {"id": "test_user"})):
    """Create a new product (sellers only)"""
    product_doc = product.dict()
    product_doc['id'] = str(uuid.uuid4())
    product_doc['vendor_id'] = current_user["id"]
    product_doc['vendor_name'] = current_user.get("name", "Vendor")
    product_doc['created_at'] = datetime.utcnow()
    product_doc['rating'] = 0.0
    product_doc['reviews_count'] = 0
    product_doc['is_featured'] = False
    
    await db.products.insert_one(product_doc)
    return {"success": True, "message": "Product created", "data": product_doc}

@marketplace_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    is_used: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all products with filters"""
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
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    for product in products:
        product['_id'] = str(product['_id'])
    
    return {"success": True, "data": products}

@marketplace_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get product by ID"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product['_id'] = str(product['_id'])
    return {"success": True, "data": product}

@marketplace_router.patch("/products/{product_id}")
async def update_product(
    product_id: str,
    updates: ProductUpdate,
    current_user: Dict = Depends(lambda: {"id": "test_user"})
):
    """Update product (vendor only)"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['vendor_id'] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = updates.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    return {"success": True, "message": "Product updated"}

@marketplace_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: Dict = Depends(lambda: {"id": "test_user"})):
    """Delete product (vendor only)"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['vendor_id'] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    return {"success": True, "message": "Product deleted"}

# ==================== TEAMS MODELS ====================

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    city: str

# ==================== TEAMS ROUTER ====================

teams_router = APIRouter(prefix="/api/v1/teams", tags=["Teams"])

@teams_router.post("")
async def create_team(team: TeamCreate, current_user: Dict = Depends(lambda: {"id": "test_user", "name": "Captain"})):
    """Create a new team"""
    team_doc = team.dict()
    team_doc['id'] = str(uuid.uuid4())
    team_doc['captain_id'] = current_user["id"]
    team_doc['captain_name'] = current_user["name"]
    team_doc['members'] = [current_user["id"]]
    team_doc['created_at'] = datetime.utcnow()
    team_doc['matches_played'] = 0
    team_doc['matches_won'] = 0
    
    await db.teams.insert_one(team_doc)
    return {"success": True, "message": "Team created", "data": team_doc}

@teams_router.get("")
async def get_teams(city: Optional[str] = None, limit: int = 50):
    """Get all teams"""
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    
    teams = await db.teams.find(query).limit(limit).to_list(limit)
    for team in teams:
        team['_id'] = str(team['_id'])
    
    return {"success": True, "data": teams}

@teams_router.get("/{team_id}")
async def get_team(team_id: str):
    """Get team by ID"""
    team = await db.teams.find_one({"id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team['_id'] = str(team['_id'])
    return {"success": True, "data": team}

@teams_router.post("/{team_id}/members")
async def add_team_member(
    team_id: str,
    member_id: str,
    current_user: Dict = Depends(lambda: {"id": "test_user"})
):
    """Add member to team (captain only)"""
    team = await db.teams.find_one({"id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team['captain_id'] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only captain can add members")
    
    await db.teams.update_one(
        {"id": team_id},
        {"$addToSet": {"members": member_id}}
    )
    
    return {"success": True, "message": "Member added"}

# ==================== LEAGUES MODELS ====================

class LeagueCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    city: str
    registration_fee: float = 0.0
    max_teams: int = 16

# ==================== LEAGUES ROUTER ====================

leagues_router = APIRouter(prefix="/api/v1/leagues", tags=["Leagues"])

@leagues_router.post("")
async def create_league(league: LeagueCreate, current_user: Dict = Depends(lambda: {"id": "test_user", "name": "Organizer"})):
    """Create a new league"""
    league_doc = league.dict()
    league_doc['id'] = str(uuid.uuid4())
    league_doc['organizer_id'] = current_user["id"]
    league_doc['organizer_name'] = current_user["name"]
    league_doc['teams'] = []
    league_doc['status'] = 'upcoming'
    league_doc['created_at'] = datetime.utcnow()
    
    await db.leagues.insert_one(league_doc)
    return {"success": True, "message": "League created", "data": league_doc}

@leagues_router.get("")
async def get_leagues(city: Optional[str] = None, status: Optional[str] = None, limit: int = 50):
    """Get all leagues"""
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if status:
        query['status'] = status
    
    leagues = await db.leagues.find(query).limit(limit).to_list(limit)
    for league in leagues:
        league['_id'] = str(league['_id'])
    
    return {"success": True, "data": leagues}

@leagues_router.get("/{league_id}")
async def get_league(league_id: str):
    """Get league by ID"""
    league = await db.leagues.find_one({"id": league_id})
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    league['_id'] = str(league['_id'])
    return {"success": True, "data": league}

@leagues_router.post("/{league_id}/register")
async def register_team_to_league(
    league_id: str,
    team_id: str,
    current_user: Dict = Depends(lambda: {"id": "test_user"})
):
    """Register team to league"""
    league = await db.leagues.find_one({"id": league_id})
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    if len(league.get('teams', [])) >= league['max_teams']:
        raise HTTPException(status_code=400, detail="League is full")
    
    # Verify team ownership
    team = await db.teams.find_one({"id": team_id})
    if not team or team['captain_id'] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.leagues.update_one(
        {"id": league_id},
        {"$addToSet": {"teams": team_id}}
    )
    
    return {"success": True, "message": "Team registered to league"}

# ==================== SERVICES (GROUNDS) MODELS ====================

class GroundCreate(BaseModel):
    name: str
    description: str
    location: str
    city: str
    ground_type: str  # turf, mat, concrete
    facilities: List[str] = []
    pricing: Dict[str, float]
    images: List[str] = []
    contact_phone: str

# ==================== SERVICES ROUTER ====================

services_router = APIRouter(prefix="/api/v1/services", tags=["Services"])

@services_router.post("/grounds")
async def create_ground(ground: GroundCreate, current_user: Dict = Depends(lambda: {"id": "test_user", "name": "Owner"})):
    """Create a new ground"""
    ground_doc = ground.dict()
    ground_doc['id'] = str(uuid.uuid4())
    ground_doc['owner_id'] = current_user["id"]
    ground_doc['owner_name'] = current_user["name"]
    ground_doc['created_at'] = datetime.utcnow()
    ground_doc['rating'] = 0.0
    ground_doc['is_verified'] = False
    
    await db.grounds.insert_one(ground_doc)
    return {"success": True, "message": "Ground created", "data": ground_doc}

@services_router.get("/grounds")
async def get_grounds(city: Optional[str] = None, ground_type: Optional[str] = None, limit: int = 50):
    """Get all grounds"""
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if ground_type:
        query['ground_type'] = ground_type
    
    grounds = await db.grounds.find(query).limit(limit).to_list(limit)
    for ground in grounds:
        ground['_id'] = str(ground['_id'])
    
    return {"success": True, "data": grounds}

@services_router.get("/grounds/{ground_id}")
async def get_ground(ground_id: str):
    """Get ground by ID"""
    ground = await db.grounds.find_one({"id": ground_id})
    if not ground:
        raise HTTPException(status_code=404, detail="Ground not found")
    ground['_id'] = str(ground['_id'])
    return {"success": True, "data": ground}

# ==================== AI FEATURES ROUTER ====================

ai_router = APIRouter(prefix="/api/v1/ai", tags=["AI Features"])

@ai_router.post("/chatbot")
async def chatbot_query(message: str, user_id: Optional[str] = None):
    """AI Chatbot endpoint"""
    # This will be enhanced with actual AI integration
    return {
        "success": True,
        "data": {
            "message": f"AI Response to: {message}",
            "suggestions": ["Check out new cricket gear", "Find grounds near you", "Join a league"]
        }
    }

@ai_router.post("/highlights/generate")
async def generate_highlights(video_url: str, current_user: Dict = Depends(lambda: {"id": "test_user"})):
    """Generate AI highlights from video"""
    # Placeholder for AI highlights generation
    highlight_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "video_url": video_url,
        "status": "processing",
        "created_at": datetime.utcnow()
    }
    
    await db.highlights.insert_one(highlight_doc)
    return {"success": True, "message": "Highlights generation started", "data": highlight_doc}

@ai_router.get("/highlights/{highlight_id}")
async def get_highlight(highlight_id: str):
    """Get highlight by ID"""
    highlight = await db.highlights.find_one({"id": highlight_id})
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    highlight['_id'] = str(highlight['_id'])
    return {"success": True, "data": highlight}
