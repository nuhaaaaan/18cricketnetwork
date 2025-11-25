# 18 Cricket Network - REST API Documentation

## Overview
Complete REST API for the 18 Cricket Network platform with versioned endpoints (`/api/v1/`), JWT authentication, and MongoDB integration.

**Base URL:** `http://your-domain.com/api/v1`

**API Version:** 1.0.0

**Documentation:** Available at `/docs` (Swagger UI) and `/redoc` (ReDoc)

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Register
**POST** `/api/v1/auth/register`

Register a new user with a specific role.

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "player"
}
```

**Roles:** `player`, `captain`, `team_admin`, `league_admin`, `umpire`, `seller`, `repair_specialist`, `academy_coach`, `ground_owner`, `super_admin`

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "email": "player@example.com",
    "name": "John Doe",
    "role": "player"
  }
}
```

### Login
**POST** `/api/v1/auth/login`

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as register

### Logout
**POST** `/api/v1/auth/logout`

Requires authentication. Invalidates the current token.

### Refresh Token
**POST** `/api/v1/auth/refresh`

Requires authentication. Issues a new access token.

---

## User Management

### Get My Profile
**GET** `/api/v1/users/me`

Get the current user's profile information.

### Update My Profile
**PATCH** `/api/v1/users/me`

Update the current user's profile.

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+9876543210",
  "profile_image": "base64_image_string",
  "location": "New York, USA"
}
```

### Get User Profile
**GET** `/api/v1/users/{user_id}`

Get public profile information for any user.

### Change User Role (Admin Only)
**PATCH** `/api/v1/users/{user_id}/role`

Change a user's role. Requires `super_admin` role.

**Request Body:**
```json
{
  "new_role": "seller"
}
```

### Submit Verification
**POST** `/api/v1/users/{user_id}/verify`

Submit verification documents (KYC, seller verification, etc.)

**Request Body:**
```json
{
  "verification_type": "seller_kyc",
  "documents": ["doc_url_1", "doc_url_2"]
}
```

---

## Squad (Friends System)

### Send Squad Request
**POST** `/api/v1/squad/requests`

Send a friend request to another user.

**Request Body:**
```json
{
  "to_user_id": "user_456",
  "message": "Let's connect!"
}
```

### Accept Squad Request
**POST** `/api/v1/squad/requests/{request_id}/accept`

Accept a pending squad request.

### Get My Squad
**GET** `/api/v1/squad/list`

Get all squad members and pending requests.

**Response:**
```json
{
  "success": true,
  "data": {
    "squad": [
      {
        "id": "user_456",
        "name": "Jane Doe",
        "profile_image": "...",
        "role": "player"
      }
    ],
    "pending_sent": [],
    "pending_received": []
  }
}
```

---

## Chat & Messaging

### Create Chat Thread
**POST** `/api/v1/chat/threads`

Create a 1:1 or group chat thread.

**Request Body:**
```json
{
  "name": "Team Discussion",
  "participants": ["user_456", "user_789"],
  "is_group": true
}
```

### Get My Chat Threads
**GET** `/api/v1/chat/threads`

Get all chat threads for the current user.

### Get Thread Messages
**GET** `/api/v1/chat/threads/{thread_id}/messages?page=1&page_size=50`

Get messages from a specific thread with pagination.

### Send Message
**POST** `/api/v1/chat/threads/{thread_id}/messages`

Send a message to a thread.

**Request Body:**
```json
{
  "content": "Hello team!",
  "message_type": "text",
  "metadata": {}
}
```

**Message Types:** `text`, `image`, `video`, `file`

### Schedule Meeting
**POST** `/api/v1/chat/threads/{thread_id}/meetings`

Schedule a practice session or meeting.

**Request Body:**
```json
{
  "title": "Practice Session",
  "description": "Batting practice",
  "start_time": "2025-06-15T10:00:00Z",
  "end_time": "2025-06-15T12:00:00Z",
  "participants": ["user_456", "user_789"],
  "location": "City Cricket Ground"
}
```

### Get My Meetings
**GET** `/api/v1/meetings/my?upcoming=true`

Get upcoming or past meetings.

---

## Marketplace

### Create Product
**POST** `/api/v1/marketplace/products`

Create a new product listing (sellers only).

**Request Body:**
```json
{
  "name": "Professional Cricket Bat",
  "description": "Grade 1 English Willow",
  "category": "Equipment",
  "sub_category": "Bats",
  "price": 15000,
  "original_price": 20000,
  "stock": 10,
  "images": ["image_url_1", "image_url_2"],
  "brand": "MRF",
  "is_used": false,
  "specifications": {
    "weight": "1200g",
    "size": "Short Handle"
  }
}
```

### Get Products
**GET** `/api/v1/marketplace/products?category=Equipment&is_used=false&search=bat&limit=50`

Browse products with filters.

### Get Product
**GET** `/api/v1/marketplace/products/{product_id}`

Get detailed product information.

### Update Product
**PATCH** `/api/v1/marketplace/products/{product_id}`

Update product (vendor only).

### Delete Product
**DELETE** `/api/v1/marketplace/products/{product_id}`

Delete product (vendor only).

---

## Teams

### Create Team
**POST** `/api/v1/teams`

**Request Body:**
```json
{
  "name": "Mumbai Warriors",
  "description": "Competitive T20 team",
  "logo": "logo_url",
  "city": "Mumbai"
}
```

### Get Teams
**GET** `/api/v1/teams?city=Mumbai&limit=50`

Browse teams by city.

### Get Team
**GET** `/api/v1/teams/{team_id}`

Get team details.

### Add Team Member
**POST** `/api/v1/teams/{team_id}/members`

Add a member to the team (captain only).

---

## Leagues

### Create League
**POST** `/api/v1/leagues`

**Request Body:**
```json
{
  "name": "Summer T20 League 2025",
  "description": "City-wide T20 tournament",
  "start_date": "2025-07-01T00:00:00Z",
  "end_date": "2025-08-31T23:59:59Z",
  "city": "Mumbai",
  "registration_fee": 5000,
  "max_teams": 16
}
```

### Get Leagues
**GET** `/api/v1/leagues?city=Mumbai&status=upcoming&limit=50`

Browse leagues.

### Get League
**GET** `/api/v1/leagues/{league_id}`

Get league details.

### Register Team to League
**POST** `/api/v1/leagues/{league_id}/register`

Register your team to a league.

**Request Body:**
```json
{
  "team_id": "team_123"
}
```

---

## Services (Grounds, Coaches, etc.)

### Create Ground
**POST** `/api/v1/services/grounds`

**Request Body:**
```json
{
  "name": "City Cricket Ground",
  "description": "Professional turf wicket with floodlights",
  "location": "Downtown",
  "city": "Mumbai",
  "ground_type": "turf",
  "facilities": ["nets", "pavilion", "lighting", "parking"],
  "pricing": {
    "hourly": 1000,
    "match": 5000,
    "session": 800
  },
  "images": ["image_url_1"],
  "contact_phone": "+919876543210"
}
```

### Get Grounds
**GET** `/api/v1/services/grounds?city=Mumbai&ground_type=turf&limit=50`

Browse grounds with filters.

### Get Ground
**GET** `/api/v1/services/grounds/{ground_id}`

Get ground details.

---

## AI Features

### AI Chatbot
**POST** `/api/v1/ai/chatbot`

Get AI assistance for cricket-related queries.

**Request Body:**
```json
{
  "message": "Find me cricket grounds in Mumbai",
  "user_id": "user_123"
}
```

### Generate Highlights
**POST** `/api/v1/ai/highlights/generate`

Submit a video for AI highlights generation.

**Request Body:**
```json
{
  "video_url": "https://example.com/match_video.mp4"
}
```

### Get Highlight
**GET** `/api/v1/ai/highlights/{highlight_id}`

Get the status and result of highlights generation.

---

## Health Check

### Health
**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-11T00:00:00.000000"
}
```

### Root
**GET** `/`

Get API information.

**Response:**
```json
{
  "service": "18 Cricket Network API",
  "version": "1.0.0",
  "status": "operational",
  "docs": "/docs"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": {}
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Collections

The API uses the following MongoDB collections:

- `users` - User accounts and profiles
- `squad_requests` - Friend requests
- `squad` - Friend connections
- `chat_threads` - Chat threads (1:1 and group)
- `chat_messages` - Messages within threads
- `meetings` - Scheduled meetings and events
- `products` - Marketplace products
- `teams` - Cricket teams
- `leagues` - Cricket leagues
- `grounds` - Cricket grounds and facilities
- `highlights` - AI-generated highlights
- `verifications` - User verification requests

---

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in future versions for production deployment.

---

## Webhooks & WebSockets

- **Real-time chat:** WebSocket support planned for future versions
- **Payment webhooks:** Will be integrated with payment gateway webhooks

---

## Next Steps

1. Payment gateway integration (Razorpay, Stripe, PayPal)
2. Real-time chat via WebSockets
3. Push notifications
4. AI model integration for highlights and DRS
5. File upload endpoints for images and videos
6. Advanced search with elasticsearch
