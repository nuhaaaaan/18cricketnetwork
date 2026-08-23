#!/usr/bin/env python3
"""
Seed / initialize the 18cricket MongoDB database.

Populates the core collections the app browses (products, academies,
tournaments, grounds, training facilities, personal trainers, cricket gyms,
teams) plus two demo accounts, and creates useful indexes.

The script is IDEMPOTENT: every document has a stable id and is upserted, so
running it multiple times refreshes the seed data without creating duplicates.
It does not delete any user-generated data.

Usage:
    # Uses the same env vars as the backend (falls back to a local MongoDB):
    MONGO_URL="mongodb://localhost:27017" DB_NAME="18cricketnetwork" \
        python seed_database.py

    # Optional: wipe the seeded collections before reseeding
    python seed_database.py --reset
"""
import argparse
import os
import sys
from datetime import datetime, timedelta

import bcrypt
from pymongo import ASCENDING, DESCENDING, MongoClient, TEXT
from pymongo.errors import PyMongoError

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "18cricketnetwork")

NOW = datetime.utcnow()

# Stable ids for the demo accounts so seeded content can reference them.
VENDOR_ID = "000000000000000000000001"
PLAYER_ID = "000000000000000000000002"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
def demo_users():
    return [
        {
            "phone": "9999900001",
            "name": "18cricket Store",
            "email": "store@18cricket.com",
            "user_type": "vendor",
            "password": hash_password("seed12345"),
            "created_at": NOW,
            "wishlist": [],
            "cart": [],
            "_id_str": VENDOR_ID,
        },
        {
            "phone": "9999900002",
            "name": "Virat Player",
            "email": "player@18cricket.com",
            "user_type": "player",
            "password": hash_password("seed12345"),
            "created_at": NOW,
            "wishlist": [],
            "cart": [],
            "_id_str": PLAYER_ID,
        },
    ]


def products():
    v = {"vendor_id": VENDOR_ID, "vendor_name": "18cricket Store", "vendor_type": "general"}
    base = {
        "images": [],
        "is_used": False,
        "specifications": {},
        "certifications": [],
        "created_at": NOW,
        "reviews_count": 0,
        "commission_rate": 0.15,
    }
    items = [
        {"id": "prod-bat-001", "name": "MRF Genius Grand Edition Bat", "category": "bat",
         "description": "Grade 1 English willow bat with a powerful sweet spot.",
         "price": 24999, "original_price": 29999, "stock": 15, "brand": "MRF",
         "is_featured": True, "is_best_seller": True, "rating": 4.8},
        {"id": "prod-bat-002", "name": "SS Ton Player Edition Bat", "category": "bat",
         "description": "Kashmir willow bat ideal for intermediate players.",
         "price": 8999, "original_price": 10999, "stock": 25, "brand": "SS",
         "is_new_arrival": True, "rating": 4.4},
        {"id": "prod-ball-001", "name": "SG Test Leather Ball (Red)", "category": "ball",
         "description": "Hand-stitched alum-tanned leather ball for red-ball cricket.",
         "price": 1499, "stock": 100, "brand": "SG", "is_best_seller": True, "rating": 4.6},
        {"id": "prod-ball-002", "name": "Kookaburra White Match Ball", "category": "ball",
         "description": "Premium white ball for limited-overs matches.",
         "price": 1899, "stock": 80, "brand": "Kookaburra", "rating": 4.5},
        {"id": "prod-pads-001", "name": "SG Batting Pads (Pro)", "category": "pads",
         "description": "Lightweight batting pads with high-density foam protection.",
         "price": 3499, "original_price": 3999, "stock": 40, "brand": "SG",
         "is_featured": True, "rating": 4.3},
        {"id": "prod-gloves-001", "name": "GM Batting Gloves 606", "category": "gloves",
         "description": "Sausage-finger batting gloves with sweat-absorbent lining.",
         "price": 2299, "stock": 60, "brand": "Gunn & Moore", "rating": 4.2},
        {"id": "prod-shoes-001", "name": "Adidas Cricket Spikes", "category": "shoes",
         "description": "Full spike cricket shoes for maximum grip and stability.",
         "price": 5999, "original_price": 7499, "stock": 35, "brand": "Adidas",
         "is_new_arrival": True, "rating": 4.7},
        {"id": "prod-acc-001", "name": "Cricket Kit Bag (Wheelie)", "category": "accessories",
         "description": "Spacious wheelie kit bag with dedicated bat and shoe compartments.",
         "price": 3299, "stock": 50, "brand": "SG", "rating": 4.1},
        {"id": "prod-acc-002", "name": "Abdominal Guard + Thigh Guard Set", "category": "accessories",
         "description": "Protective gear set for batting and wicket-keeping.",
         "price": 999, "stock": 120, "brand": "Shrey", "rating": 4.0},
        {"id": "prod-nut-001", "name": "Whey Protein 1kg (Chocolate)", "category": "nutrition",
         "description": "Athlete-grade whey protein for muscle recovery.",
         "price": 2799, "original_price": 3499, "stock": 70, "brand": "MuscleBlaze",
         "vendor_type": "nutrition", "is_best_seller": True, "rating": 4.5,
         "ingredients": ["Whey protein concentrate", "Cocoa", "Digestive enzymes"],
         "usage_instructions": "Mix 1 scoop with 200ml water or milk post-workout."},
    ]
    out = []
    for it in items:
        doc = {**base, **v}
        doc.update(it)
        doc.setdefault("original_price", None)
        doc.setdefault("sub_category", None)
        doc.setdefault("brand", None)
        doc.setdefault("is_featured", False)
        doc.setdefault("is_new_arrival", False)
        doc.setdefault("is_best_seller", False)
        doc.setdefault("rating", 0.0)
        doc.setdefault("ingredients", None)
        doc.setdefault("usage_instructions", None)
        out.append(doc)
    return out


def academies():
    common = {"owner_id": VENDOR_ID, "images": [], "created_at": NOW, "lead_count": 0}
    return [
        {**common, "id": "acad-001", "name": "National Cricket Academy",
         "description": "Elite coaching with former first-class players.",
         "location": "Chinnaswamy Stadium Rd", "city": "Bengaluru",
         "fees": "Rs 8,000/month", "schedule": "Mon-Sat, 6-9 AM",
         "contact_phone": "9800000001", "contact_email": "nca@18cricket.com",
         "facilities": ["Turf nets", "Bowling machine", "Gym"],
         "coaches": ["Rahul Dravid", "Venkatesh Prasad"], "rating": 4.9},
        {**common, "id": "acad-002", "name": "Mumbai Cricket Club Academy",
         "description": "Grooming young talent since 1975.",
         "location": "Bandra East", "city": "Mumbai",
         "fees": "Rs 6,500/month", "schedule": "Tue-Sun, 5-8 AM",
         "contact_phone": "9800000002",
         "facilities": ["Matting nets", "Video analysis"],
         "coaches": ["Praveen Amre"], "rating": 4.6},
        {**common, "id": "acad-003", "name": "Delhi Ranji Academy",
         "description": "Professional coaching for all age groups.",
         "location": "Feroz Shah Kotla", "city": "Delhi",
         "fees": "Rs 5,000/month", "schedule": "Mon-Fri, 4-7 PM",
         "contact_phone": "9800000003",
         "facilities": ["Indoor nets", "Fitness center"],
         "coaches": ["Sanjay Bhardwaj"], "rating": 4.4},
    ]


def tournaments():
    common = {"organizer_id": VENDOR_ID, "images": [], "created_at": NOW, "teams_registered": 6}
    return [
        {**common, "id": "tour-001", "name": "Bengaluru Premier League",
         "description": "The city's biggest T20 knockout tournament.",
         "location": "Chinnaswamy Stadium", "city": "Bengaluru",
         "start_date": NOW + timedelta(days=14), "end_date": NOW + timedelta(days=21),
         "tournament_type": "T20", "registration_fee": 15000,
         "prize_money": "Rs 5,00,000", "max_teams": 16, "status": "upcoming"},
        {**common, "id": "tour-002", "name": "Mumbai Corporate Cup",
         "description": "Box cricket league for corporate teams.",
         "location": "MCA Ground", "city": "Mumbai",
         "start_date": NOW - timedelta(days=2), "end_date": NOW + timedelta(days=5),
         "tournament_type": "Box Cricket", "registration_fee": 8000,
         "prize_money": "Rs 1,50,000", "max_teams": 12, "status": "ongoing",
         "teams_registered": 12},
        {**common, "id": "tour-003", "name": "Delhi Winter Championship",
         "description": "50-over championship for local clubs.",
         "location": "Feroz Shah Kotla", "city": "Delhi",
         "start_date": NOW - timedelta(days=40), "end_date": NOW - timedelta(days=30),
         "tournament_type": "ODI", "registration_fee": 12000,
         "prize_money": "Rs 3,00,000", "max_teams": 10, "status": "completed",
         "teams_registered": 10},
    ]


def grounds():
    common = {"owner_id": VENDOR_ID, "owner_name": "18cricket Store", "owner_phone": "9700000000",
              "images": [], "created_at": NOW, "reviews_count": 0, "is_verified": True,
              "commission_rate": 0.15, "time_slots": [
                  {"day": "Weekdays", "slots": ["6-8 AM", "8-10 AM", "4-6 PM", "6-8 PM"]},
                  {"day": "Weekends", "slots": ["6-8 AM", "8-10 AM", "10-12 PM", "4-6 PM"]}]}
    return [
        {**common, "id": "grnd-001", "name": "Green Park Turf Arena",
         "description": "Premium turf ground with floodlights and pavilion.",
         "location": "Whitefield", "city": "Bengaluru",
         "latitude": 12.9698, "longitude": 77.7500, "ground_type": "turf",
         "facilities": ["Nets", "Pavilion", "Lighting", "Parking"],
         "pricing": {"hourly": 1200, "match": 6000, "session": 900},
         "contact_phone": "9700000001", "whatsapp": "9700000001", "rating": 4.7},
        {**common, "id": "grnd-002", "name": "Marine Drive Matting Ground",
         "description": "Well-maintained matting pitch near the coast.",
         "location": "Marine Lines", "city": "Mumbai",
         "latitude": 18.9430, "longitude": 72.8230, "ground_type": "mat",
         "facilities": ["Nets", "Parking"],
         "pricing": {"hourly": 900, "match": 4500, "session": 700},
         "contact_phone": "9700000002", "rating": 4.3},
        {**common, "id": "grnd-003", "name": "Yamuna Sports Concrete Pitch",
         "description": "Budget-friendly concrete pitch for practice.",
         "location": "Akshardham", "city": "Delhi",
         "latitude": 28.6127, "longitude": 77.2773, "ground_type": "concrete",
         "facilities": ["Nets", "Lighting"],
         "pricing": {"hourly": 600, "match": 3000, "session": 500},
         "contact_phone": "9700000003", "rating": 4.0},
    ]


def training_facilities():
    common = {"owner_id": VENDOR_ID, "owner_name": "18cricket Store", "images": [],
              "created_at": NOW, "is_verified": True, "commission_rate": 0.12}
    return [
        {**common, "id": "tf-001", "facility_type": "indoor_facility",
         "name": "ProBat Indoor Nets", "description": "Climate-controlled indoor nets with bowling machines.",
         "location": "Koramangala", "city": "Bengaluru", "latitude": 12.9352, "longitude": 77.6245,
         "facilities": ["Bowling machine", "Nets", "Coaching"],
         "pricing": {"per_hour": 800, "monthly": 6000},
         "contact_phone": "9600000001", "rating": 4.6},
        {**common, "id": "tf-002", "facility_type": "practice_nets",
         "name": "Seaside Practice Nets", "description": "Outdoor practice nets available all week.",
         "location": "Juhu", "city": "Mumbai", "latitude": 19.1075, "longitude": 72.8263,
         "facilities": ["Nets", "Gym"],
         "pricing": {"per_hour": 600, "monthly": 4500},
         "contact_phone": "9600000002", "rating": 4.2},
    ]


def personal_trainers():
    common = {"user_id": VENDOR_ID, "images": [], "created_at": NOW,
              "reviews_count": 0, "is_verified": True, "commission_rate": 0.10}
    return [
        {**common, "id": "pt-001", "name": "Coach Anil Kumar",
         "bio": "Former Ranji player specializing in spin bowling.",
         "specialization": ["bowling", "fielding"], "experience_years": 12,
         "certifications": ["Level 2 BCCI"], "pricing": {"per_hour": 1500, "per_session": 2000, "monthly": 15000},
         "location": "Jayanagar", "city": "Bengaluru", "latitude": 12.9250, "longitude": 77.5938,
         "contact_phone": "9500000001", "availability": ["Mon", "Wed", "Fri"], "rating": 4.8},
        {**common, "id": "pt-002", "name": "Coach Priya Sharma",
         "bio": "Batting coach and strength & conditioning specialist.",
         "specialization": ["batting", "fitness"], "experience_years": 8,
         "certifications": ["Level 1 BCCI", "ACE CPT"], "pricing": {"per_hour": 1800, "monthly": 18000},
         "location": "Andheri", "city": "Mumbai", "latitude": 19.1197, "longitude": 72.8468,
         "contact_phone": "9500000002", "availability": ["Tue", "Thu", "Sat"], "rating": 4.7},
    ]


def cricket_gyms():
    common = {"owner_id": VENDOR_ID, "owner_name": "18cricket Store", "images": [],
              "trainers": [], "created_at": NOW, "is_verified": True, "commission_rate": 0.12}
    return [
        {**common, "id": "gym-001", "name": "PowerPlay Cricket Gym",
         "description": "Cricket-specific strength and conditioning gym.",
         "location": "Indiranagar", "city": "Bengaluru", "latitude": 12.9719, "longitude": 77.6412,
         "facilities": ["strength_training", "cardio", "physiotherapy"],
         "pricing": {"monthly": 3000, "quarterly": 8000, "yearly": 25000},
         "contact_phone": "9400000001", "opening_hours": "5 AM - 10 PM", "rating": 4.5},
        {**common, "id": "gym-002", "name": "Allrounder Fitness Studio",
         "description": "Functional fitness for cricketers of all levels.",
         "location": "Powai", "city": "Mumbai", "latitude": 19.1176, "longitude": 72.9060,
         "facilities": ["strength_training", "yoga", "cardio"],
         "pricing": {"monthly": 2800, "quarterly": 7500, "yearly": 22000},
         "contact_phone": "9400000002", "opening_hours": "6 AM - 11 PM", "rating": 4.3},
    ]


def teams():
    common = {"captain_id": PLAYER_ID, "captain_name": "Virat Player", "logo": None,
              "members": [PLAYER_ID], "created_at": NOW}
    return [
        {**common, "id": "team-001", "name": "Bengaluru Strikers",
         "description": "Weekend league team based in Bengaluru.", "city": "Bengaluru",
         "matches_played": 18, "matches_won": 12},
        {**common, "id": "team-002", "name": "Mumbai Mavericks",
         "description": "Corporate box-cricket champions.", "city": "Mumbai",
         "matches_played": 22, "matches_won": 15},
    ]


def coaches():
    common = {"image": None, "reviews_count": 0, "sessions_count": 0,
              "is_listed": True, "created_at": NOW}
    return [
        {**common, "id": "coach-tech-001", "user_id": "seed-coach-1",
         "name": "Coach Ravi Kumar", "category": "technique",
         "bio": "Ex-Ranji batter specialising in batting technique and footwork.",
         "specializations": ["batting", "footwork", "power hitting"], "experience_years": 12,
         "city": "Bengaluru", "hourly_rate": 1500, "group_rate": 600,
         "languages": ["English", "Hindi", "Kannada"], "contact_phone": "9700010001", "rating": 4.8},
        {**common, "id": "coach-tech-002", "user_id": "seed-coach-2",
         "name": "Coach Meera Nair", "category": "technique",
         "bio": "Fast-bowling coach focused on action, seam position and accuracy.",
         "specializations": ["bowling", "seam", "swing"], "experience_years": 9,
         "city": "Chennai", "hourly_rate": 1400, "group_rate": 550,
         "languages": ["English", "Tamil"], "contact_phone": "9700010002", "rating": 4.6},
        {**common, "id": "coach-mind-001", "user_id": "seed-coach-3",
         "name": "Coach Arjun Rao", "category": "mindset",
         "bio": "Sports psychologist helping cricketers build focus and confidence.",
         "specializations": ["focus", "confidence", "visualisation"], "experience_years": 8,
         "city": "Mumbai", "hourly_rate": 1800, "group_rate": 700,
         "languages": ["English", "Hindi", "Marathi"], "contact_phone": "9700010003", "rating": 4.9},
        {**common, "id": "coach-mind-002", "user_id": "seed-coach-4",
         "name": "Coach Sanjay Iyer", "category": "mindset",
         "bio": "Mental conditioning coach specialising in match temperament and pressure handling.",
         "specializations": ["temperament", "pressure handling", "routines"], "experience_years": 11,
         "city": "Delhi", "hourly_rate": 1700, "group_rate": 650,
         "languages": ["English", "Hindi"], "contact_phone": "9700010004", "rating": 4.7},
    ]


def coaching_sessions():
    # One open group session per track so the "Open group sessions" list isn't empty.
    creator = {"user_id": PLAYER_ID, "name": "Virat Player",
               "phone": "9999900002", "joined_at": NOW}
    return [
        {"id": "sess-tech-001", "coach_id": "coach-tech-001", "coach_name": "Coach Ravi Kumar",
         "category": "technique", "created_by": PLAYER_ID, "session_type": "group",
         "title": "Group Technique Coaching with Coach Ravi Kumar",
         "scheduled_at": NOW + timedelta(days=5), "duration_minutes": 90, "mode": "in_person",
         "location": "Bengaluru", "max_participants": 6, "participants": [creator],
         "price_per_person": 600, "status": "open", "notes": None, "created_at": NOW},
        {"id": "sess-mind-001", "coach_id": "coach-mind-001", "coach_name": "Coach Arjun Rao",
         "category": "mindset", "created_by": PLAYER_ID, "session_type": "group",
         "title": "Group Mindset Coaching with Coach Arjun Rao",
         "scheduled_at": NOW + timedelta(days=6), "duration_minutes": 60, "mode": "online",
         "location": None, "max_participants": 8, "participants": [creator],
         "price_per_person": 700, "status": "open", "notes": None, "created_at": NOW},
    ]


# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------
SEEDED_COLLECTIONS = [
    "products", "academies", "tournaments", "grounds",
    "training_facilities", "personal_trainers", "cricket_gyms", "teams",
    "coaches", "coaching_sessions",
]


def upsert_by_id(collection, docs):
    for doc in docs:
        collection.replace_one({"id": doc["id"]}, doc, upsert=True)
    return len(docs)


def upsert_users(collection, users):
    from bson import ObjectId
    count = 0
    for u in users:
        oid = ObjectId(u.pop("_id_str"))
        doc = {**u, "_id": oid}
        collection.replace_one({"_id": oid}, doc, upsert=True)
        count += 1
    return count


def create_indexes(db):
    db.users.create_index([("phone", ASCENDING)], unique=True)
    db.products.create_index([("id", ASCENDING)], unique=True)
    db.products.create_index([("category", ASCENDING)])
    db.products.create_index([("name", TEXT), ("description", TEXT), ("brand", TEXT)])
    db.academies.create_index([("id", ASCENDING)], unique=True)
    db.academies.create_index([("city", ASCENDING)])
    db.tournaments.create_index([("id", ASCENDING)], unique=True)
    db.tournaments.create_index([("status", ASCENDING), ("start_date", DESCENDING)])
    db.grounds.create_index([("id", ASCENDING)], unique=True)
    db.grounds.create_index([("city", ASCENDING)])
    db.training_facilities.create_index([("id", ASCENDING)], unique=True)
    db.personal_trainers.create_index([("id", ASCENDING)], unique=True)
    db.cricket_gyms.create_index([("id", ASCENDING)], unique=True)
    db.teams.create_index([("id", ASCENDING)], unique=True)
    db.coaches.create_index([("id", ASCENDING)], unique=True)
    db.coaches.create_index([("category", ASCENDING), ("is_listed", ASCENDING)])
    db.coaches.create_index([("user_id", ASCENDING)])
    db.coaching_sessions.create_index([("id", ASCENDING)], unique=True)
    db.coaching_sessions.create_index([("category", ASCENDING), ("status", ASCENDING)])
    db.coaching_sessions.create_index([("session_type", ASCENDING), ("status", ASCENDING)])


def main():
    parser = argparse.ArgumentParser(description="Seed the 18cricket MongoDB database.")
    parser.add_argument("--reset", action="store_true",
                        help="Drop seeded collections before reseeding.")
    args = parser.parse_args()

    print(f"[seed] Connecting to {MONGO_URL} (db={DB_NAME})...")
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=8000)
    try:
        client.admin.command("ping")
    except PyMongoError as exc:
        print(f"[seed] ERROR: could not connect to MongoDB: {exc}", file=sys.stderr)
        sys.exit(1)

    db = client[DB_NAME]

    if args.reset:
        for name in SEEDED_COLLECTIONS:
            db[name].drop()
        print(f"[seed] Dropped collections: {', '.join(SEEDED_COLLECTIONS)}")

    print("[seed] Creating indexes...")
    create_indexes(db)

    results = {
        "users": upsert_users(db.users, demo_users()),
        "products": upsert_by_id(db.products, products()),
        "academies": upsert_by_id(db.academies, academies()),
        "tournaments": upsert_by_id(db.tournaments, tournaments()),
        "grounds": upsert_by_id(db.grounds, grounds()),
        "training_facilities": upsert_by_id(db.training_facilities, training_facilities()),
        "personal_trainers": upsert_by_id(db.personal_trainers, personal_trainers()),
        "cricket_gyms": upsert_by_id(db.cricket_gyms, cricket_gyms()),
        "teams": upsert_by_id(db.teams, teams()),
        "coaches": upsert_by_id(db.coaches, coaches()),
        "coaching_sessions": upsert_by_id(db.coaching_sessions, coaching_sessions()),
    }

    print("[seed] Upserted documents:")
    for name, count in results.items():
        print(f"    {name:20s} {count}")

    print("\n[seed] Demo accounts (password: seed12345):")
    print("    vendor  phone=9999900001")
    print("    player  phone=9999900002")
    print("[seed] Done.")
    client.close()


if __name__ == "__main__":
    main()
