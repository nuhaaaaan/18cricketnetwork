"""Demo catalog, venues, and community data for a usable first launch."""

from datetime import datetime, timedelta
from typing import Any

import bcrypt
from bson import ObjectId

VENDOR_PHONE = "9876543210"
PLAYER_PHONE = "9876543211"
DEMO_PASSWORD = "test123"

PRODUCT_IMAGES = {
    "bat": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    "ball": "https://images.unsplash.com/photo-1593766788274-1fe0012c58c2?w=800",
    "pads": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800",
    "gloves": "https://images.unsplash.com/photo-1593341646782-e0b495cff271?w=800",
    "shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "ground": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800",
    "academy": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
}


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _user(phone: str, name: str, user_type: str, email: str) -> dict[str, Any]:
    return {
        "_id": ObjectId(),
        "phone": phone,
        "name": name,
        "email": email,
        "user_type": user_type,
        "password": _hash_password(DEMO_PASSWORD),
        "profile_image": None,
        "wishlist": [],
        "cart": [],
        "created_at": datetime.utcnow(),
    }


async def seed_if_empty(db) -> dict[str, int]:
    existing_products = await db.products.count_documents({})
    existing_users = await db.users.count_documents({})
    if existing_products and existing_users:
        return {"seeded": 0}

    vendor = _user(VENDOR_PHONE, "King Sports", "vendor", "vendor@18cricket.network")
    player = _user(PLAYER_PHONE, "Arjun Reddy", "player", "player@18cricket.network")
    academy_owner = _user("9876543212", "NCA Coaches", "academy", "academy@18cricket.network")
    organizer = _user(
        "9876543213",
        "Metro League",
        "tournament_organizer",
        "events@18cricket.network",
    )

    if not await db.users.find_one({"phone": VENDOR_PHONE}):
        await db.users.insert_one(vendor)
    else:
        vendor = await db.users.find_one({"phone": VENDOR_PHONE})

    if not await db.users.find_one({"phone": PLAYER_PHONE}):
        await db.users.insert_one(player)
    else:
        player = await db.users.find_one({"phone": PLAYER_PHONE})

    if not await db.users.find_one({"phone": "9876543212"}):
        await db.users.insert_one(academy_owner)
    if not await db.users.find_one({"phone": "9876543213"}):
        await db.users.insert_one(organizer)

    vendor_id = str(vendor["_id"])
    player_id = str(player["_id"])

    products = [
        {
            "id": "prod-english-willow-bat",
            "vendor_id": vendor_id,
            "vendor_name": "King Sports",
            "vendor_type": "general",
            "name": "English Willow Pro Bat",
            "description": "Grade 1 English willow bat with a large sweet spot, ideal for leather-ball T20 cricket.",
            "category": "bat",
            "sub_category": "english-willow",
            "price": 8499,
            "original_price": 9999,
            "stock": 18,
            "images": [PRODUCT_IMAGES["bat"]],
            "brand": "GM",
            "is_featured": True,
            "is_new_arrival": True,
            "is_best_seller": True,
            "is_used": False,
            "specifications": {"weight": "1180g", "size": "SH"},
            "created_at": datetime.utcnow(),
            "rating": 4.8,
            "reviews_count": 126,
            "commission_rate": 0.15,
        },
        {
            "id": "prod-leather-ball",
            "vendor_id": vendor_id,
            "vendor_name": "King Sports",
            "name": "Match Leather Ball (Red)",
            "description": "Alum-tanned four-piece leather ball used in club and academy matches.",
            "category": "ball",
            "price": 699,
            "original_price": 899,
            "stock": 80,
            "images": [PRODUCT_IMAGES["ball"]],
            "brand": "SG",
            "is_featured": True,
            "is_used": False,
            "created_at": datetime.utcnow(),
            "rating": 4.6,
            "reviews_count": 84,
            "commission_rate": 0.15,
        },
        {
            "id": "prod-batting-pads",
            "vendor_id": vendor_id,
            "vendor_name": "King Sports",
            "name": "Lightweight Batting Pads",
            "description": "High-density foam pads with reinforced knee rolls and a contoured fit.",
            "category": "pads",
            "price": 2499,
            "original_price": 2999,
            "stock": 24,
            "images": [PRODUCT_IMAGES["pads"]],
            "brand": "SS",
            "is_featured": True,
            "is_used": False,
            "created_at": datetime.utcnow(),
            "rating": 4.5,
            "reviews_count": 41,
            "commission_rate": 0.15,
        },
        {
            "id": "prod-keeping-gloves",
            "vendor_id": vendor_id,
            "vendor_name": "King Sports",
            "name": "Pro Wicket-Keeping Gloves",
            "description": "Pre-curved gloves with shock-absorbing palms for sharp chances behind the stumps.",
            "category": "gloves",
            "price": 3299,
            "stock": 15,
            "images": [PRODUCT_IMAGES["gloves"]],
            "brand": "Kookaburra",
            "is_featured": False,
            "is_used": False,
            "created_at": datetime.utcnow(),
            "rating": 4.4,
            "reviews_count": 19,
            "commission_rate": 0.15,
        },
        {
            "id": "prod-spike-shoes",
            "vendor_id": vendor_id,
            "vendor_name": "King Sports",
            "name": "Metal Spike Cricket Shoes",
            "description": "Breathable uppers with six-spike outsole for grip on turf pitches.",
            "category": "shoes",
            "price": 4599,
            "original_price": 5299,
            "stock": 12,
            "images": [PRODUCT_IMAGES["shoes"]],
            "brand": "New Balance",
            "is_featured": True,
            "is_used": False,
            "created_at": datetime.utcnow(),
            "rating": 4.7,
            "reviews_count": 33,
            "commission_rate": 0.15,
        },
        {
            "id": "prod-used-kashmir-bat",
            "vendor_id": vendor_id,
            "vendor_name": "King Sports",
            "name": "Used Kashmir Willow Bat",
            "description": "Lightly used academy bat. Perfect for nets and tape-ball games.",
            "category": "bat",
            "price": 1499,
            "original_price": 2499,
            "stock": 6,
            "images": [PRODUCT_IMAGES["bat"]],
            "brand": "SS",
            "is_featured": False,
            "is_used": True,
            "created_at": datetime.utcnow(),
            "rating": 4.1,
            "reviews_count": 9,
            "commission_rate": 0.15,
        },
    ]

    academies = [
        {
            "id": "acad-nca-bengaluru",
            "owner_id": "seed-academy",
            "name": "Nuhans Cricket Academy",
            "description": "High-performance batting, bowling, and fitness program with video analysis.",
            "location": "Koramangala, Bengaluru",
            "city": "Bengaluru",
            "fees": "₹6,500 / month",
            "schedule": "Mon-Sat, 6:00-8:30 AM & 4:30-7:30 PM",
            "images": [PRODUCT_IMAGES["academy"]],
            "contact_phone": "9876543212",
            "contact_email": "academy@18cricket.network",
            "facilities": ["Turf nets", "Bowling machine", "Gym", "Physio"],
            "coaches": ["Rahul Dravid Pathway Coach", "Anil Kumble Spin Lab"],
            "created_at": datetime.utcnow(),
            "rating": 4.9,
            "lead_count": 12,
        },
        {
            "id": "acad-gully-mumbai",
            "owner_id": "seed-academy",
            "name": "Marine Drive Cricket Hub",
            "description": "Weekend-only academy focused on school and college players.",
            "location": "Marine Drive, Mumbai",
            "city": "Mumbai",
            "fees": "₹4,000 / month",
            "schedule": "Sat-Sun, 7:00-11:00 AM",
            "images": [PRODUCT_IMAGES["ground"]],
            "contact_phone": "9876543212",
            "facilities": ["Mat nets", "Video analysis"],
            "coaches": ["Former Ranji opener"],
            "created_at": datetime.utcnow(),
            "rating": 4.4,
            "lead_count": 5,
        },
    ]

    now = datetime.utcnow()
    tournaments = [
        {
            "id": "tour-bpl-live",
            "organizer_id": "seed-organizer",
            "name": "Bengaluru Premier League",
            "description": "City-wide T20 league with live scoring and MVP awards.",
            "location": "KSCA Stadium",
            "city": "Bengaluru",
            "start_date": now - timedelta(days=2),
            "end_date": now + timedelta(days=12),
            "tournament_type": "T20",
            "registration_fee": 8000,
            "prize_money": "₹2,50,000",
            "max_teams": 12,
            "teams_registered": 8,
            "images": [PRODUCT_IMAGES["ground"]],
            "status": "ongoing",
            "created_at": now,
        },
        {
            "id": "tour-monsoon-cup",
            "organizer_id": "seed-organizer",
            "name": "Monsoon Night Cup",
            "description": "Floodlit 8-a-side box cricket. Register your squad before the cutoff.",
            "location": "HSR Layout Box Arena",
            "city": "Bengaluru",
            "start_date": now + timedelta(days=10),
            "end_date": now + timedelta(days=12),
            "tournament_type": "Box Cricket",
            "registration_fee": 3500,
            "prize_money": "₹75,000",
            "max_teams": 16,
            "teams_registered": 7,
            "images": [PRODUCT_IMAGES["ground"]],
            "status": "upcoming",
            "created_at": now,
        },
        {
            "id": "tour-winter-odi",
            "organizer_id": "seed-organizer",
            "name": "Winter Corporate ODI",
            "description": "Completed 30-over corporate championship.",
            "location": "Chinnaswamy Nets",
            "city": "Bengaluru",
            "start_date": now - timedelta(days=40),
            "end_date": now - timedelta(days=32),
            "tournament_type": "ODI",
            "registration_fee": 5000,
            "prize_money": "₹1,00,000",
            "max_teams": 8,
            "teams_registered": 8,
            "images": [PRODUCT_IMAGES["ground"]],
            "status": "completed",
            "created_at": now - timedelta(days=50),
        },
    ]

    grounds = [
        {
            "id": "ground-ksa-turf",
            "owner_id": vendor_id,
            "owner_name": "King Sports",
            "owner_phone": VENDOR_PHONE,
            "name": "KSA Turf Arena",
            "description": "Full-size turf wicket with floodlights and pavilion.",
            "location": "Hennur Road, Bengaluru",
            "city": "Bengaluru",
            "latitude": 13.0358,
            "longitude": 77.6431,
            "ground_type": "turf",
            "facilities": ["Floodlights", "Pavilion", "Parking", "Nets"],
            "pricing": {"hourly": 1800, "match": 8500, "session": 1200},
            "images": [PRODUCT_IMAGES["ground"]],
            "time_slots": [
                {"day": "Saturday", "slots": ["6-8AM", "8-10AM", "4-6PM", "6-8PM"]},
                {"day": "Sunday", "slots": ["6-8AM", "8-10AM", "3-5PM"]},
            ],
            "contact_phone": VENDOR_PHONE,
            "whatsapp": VENDOR_PHONE,
            "created_at": datetime.utcnow(),
            "rating": 4.7,
            "reviews_count": 58,
            "is_verified": True,
            "commission_rate": 0.15,
        },
        {
            "id": "ground-mat-indiranagar",
            "owner_id": vendor_id,
            "owner_name": "King Sports",
            "owner_phone": VENDOR_PHONE,
            "name": "Indiranagar Mat Ground",
            "description": "Community mat wicket for evening pickup games.",
            "location": "Indiranagar, Bengaluru",
            "city": "Bengaluru",
            "latitude": 12.9784,
            "longitude": 77.6408,
            "ground_type": "mat",
            "facilities": ["Nets", "Parking"],
            "pricing": {"hourly": 900, "match": 4000, "session": 700},
            "images": [PRODUCT_IMAGES["ground"]],
            "time_slots": [{"day": "Weekdays", "slots": ["6-8AM", "6-8PM"]}],
            "contact_phone": VENDOR_PHONE,
            "created_at": datetime.utcnow(),
            "rating": 4.3,
            "reviews_count": 21,
            "is_verified": True,
            "commission_rate": 0.15,
        },
        {
            "id": "ground-concrete-hyderabad",
            "owner_id": vendor_id,
            "owner_name": "King Sports",
            "owner_phone": VENDOR_PHONE,
            "name": "Charminar Concrete Pitch",
            "description": "Hard concrete wicket popular with tape-ball teams.",
            "location": "Old City, Hyderabad",
            "city": "Hyderabad",
            "latitude": 17.3616,
            "longitude": 78.4747,
            "ground_type": "concrete",
            "facilities": ["Floodlights"],
            "pricing": {"hourly": 500, "match": 2000},
            "images": [PRODUCT_IMAGES["ground"]],
            "contact_phone": VENDOR_PHONE,
            "created_at": datetime.utcnow(),
            "rating": 4.0,
            "reviews_count": 11,
            "is_verified": False,
            "commission_rate": 0.15,
        },
    ]

    posts = [
        {
            "id": "post-cover-drive",
            "user_id": player_id,
            "user_name": "Arjun Reddy",
            "content": "Cover drive finally clicking after 200 throwdowns. On to the league this weekend.",
            "images": [PRODUCT_IMAGES["bat"]],
            "post_type": "post",
            "likes": 128,
            "comments": 1,
            "shares": 6,
            "created_at": datetime.utcnow() - timedelta(hours=5),
            "is_archived": False,
        },
        {
            "id": "post-night-match",
            "user_id": player_id,
            "user_name": "Arjun Reddy",
            "content": "Floodlights, packed pavilion, last-over finish. This is why we play.",
            "images": [PRODUCT_IMAGES["ground"]],
            "post_type": "post",
            "likes": 246,
            "comments": 0,
            "shares": 18,
            "created_at": datetime.utcnow() - timedelta(days=1),
            "is_archived": False,
        },
        {
            "id": "reel-yorkers",
            "user_id": player_id,
            "user_name": "Arjun Reddy",
            "content": "Death-over yorker drill. Save this for nets.",
            "images": [PRODUCT_IMAGES["ball"]],
            "post_type": "reel",
            "likes": 512,
            "comments": 0,
            "shares": 40,
            "video_url": None,
            "created_at": datetime.utcnow() - timedelta(hours=12),
            "is_archived": False,
        },
    ]

    comments = [
        {
            "id": "comment-1",
            "post_id": "post-cover-drive",
            "user_id": vendor_id,
            "user_name": "King Sports",
            "content": "That bat looks ready. Come grab a new grip before Saturday.",
            "likes": 4,
            "created_at": datetime.utcnow() - timedelta(hours=3),
        }
    ]

    stories = [
        {
            "id": "story-1",
            "user_id": player_id,
            "user_name": "Arjun Reddy",
            "image": PRODUCT_IMAGES["ground"],
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=20),
            "is_highlight": False,
        }
    ]

    matches = [
        {
            "id": "match-bpl-3",
            "tournament_id": "tour-bpl-live",
            "team1_id": "team-mumbai",
            "team1_name": "Mumbai Strikers",
            "team2_id": "team-chennai",
            "team2_name": "Chennai Kings",
            "match_date": datetime.utcnow(),
            "venue": "KSCA Stadium",
            "status": "live",
            "team1_score": "148/6 (18.2)",
            "team2_score": "Yet to bat",
            "created_at": datetime.utcnow(),
        }
    ]

    if not existing_products:
        await db.products.insert_many(products)
        await db.academies.insert_many(academies)
        await db.tournaments.insert_many(tournaments)
        await db.grounds.insert_many(grounds)
        await db.posts.insert_many(posts)
        await db.comments.insert_many(comments)
        await db.stories.insert_many(stories)
        await db.matches.insert_many(matches)

    return {
        "seeded": 1,
        "products": len(products),
        "academies": len(academies),
        "tournaments": len(tournaments),
        "grounds": len(grounds),
        "posts": len(posts),
    }
