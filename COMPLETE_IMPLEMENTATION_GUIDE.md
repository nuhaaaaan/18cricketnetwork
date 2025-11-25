# 18 Cricket Network - Complete Implementation Guide
## Social Media + BrewingCricket Features

---

## 🎯 IMPLEMENTATION OVERVIEW

This document provides the complete architecture and implementation plan for transforming 18 Cricket Network into a comprehensive cricket social platform.

### Current Status
- ✅ **Phase 1**: Navigation & Maps (COMPLETED)
- ✅ **Phase 2**: Backend Models (COMPLETED)
- 🔨 **Phase 3**: API Endpoints (IN PROGRESS)
- 📋 **Phase 4**: Frontend Components (PENDING)
- 📋 **Phase 5**: Media Storage & Processing (PENDING)
- 📋 **Phase 6**: Search & Discovery (PENDING)

---

## 📦 PART A: SOCIAL MEDIA SYSTEM

### Backend Models Created ✅
Location: `/app/backend/social_models.py`

**Models Implemented:**
1. `SocialPost` - Main post entity
   - Supports: Photo, Video, Reel, Story
   - Privacy levels
   - Editor metadata
   - Interaction counts
   - Auto-expiry for stories

2. `Comment` - Comment system with threading
3. `Interaction` - Likes, saves, shares
4. `Follow` - Follow relationships
5. `StoryView` - Story view tracking
6. `Notification` - Push & in-app notifications
7. `UserProfile` - Extended social profile

### API Endpoints Required

#### Posts API (`/api/v1/social/posts`)
```python
POST   /posts                    # Create post
GET    /posts                    # Get feed (with filters)
GET    /posts/{post_id}          # Get single post
PATCH  /posts/{post_id}          # Edit post
DELETE /posts/{post_id}          # Delete post
POST   /posts/{post_id}/like     # Like post
POST   /posts/{post_id}/save     # Save post
POST   /posts/{post_id}/share    # Share post
GET    /posts/{post_id}/likes    # Get likes list
```

#### Feed API (`/api/v1/social/feed`)
```python
GET /feed/following     # Posts from following
GET /feed/global        # Global cricket feed
GET /feed/nearby        # Location-based feed
GET /feed/trending      # Trending posts
```

#### Reels API (`/api/v1/social/reels`)
```python
GET  /reels             # Swipeable reels feed
POST /reels             # Upload reel
GET  /reels/{reel_id}   # Get reel
```

#### Stories API (`/api/v1/social/stories`)
```python
POST /stories                    # Upload story
GET  /stories                    # Get active stories
GET  /stories/{story_id}         # Get story
POST /stories/{story_id}/view    # Record view
GET  /stories/{story_id}/viewers # Get viewers list
POST /stories/highlights         # Save to highlights
```

#### Comments API (`/api/v1/social/comments`)
```python
POST   /posts/{post_id}/comments              # Add comment
GET    /posts/{post_id}/comments              # Get comments
POST   /comments/{comment_id}/reply           # Reply to comment
POST   /comments/{comment_id}/like            # Like comment
DELETE /comments/{comment_id}                 # Delete comment
```

#### Social Graph API (`/api/v1/social/relationships`)
```python
POST   /follow/{user_id}           # Follow user
DELETE /unfollow/{user_id}         # Unfollow user
GET    /followers/{user_id}        # Get followers
GET    /following/{user_id}        # Get following
POST   /block/{user_id}            # Block user
GET    /suggested-users            # Suggested users to follow
```

#### Notifications API (`/api/v1/social/notifications`)
```python
GET    /notifications              # Get user notifications
PATCH  /notifications/{id}/read   # Mark as read
DELETE /notifications/{id}         # Delete notification
```

### Media Storage Architecture

**Provider Options:**
- AWS S3
- Supabase Storage
- Cloudinary
- Azure Blob Storage

**Configuration (`.env`):**
```bash
MEDIA_STORAGE_PROVIDER=s3  # or supabase, cloudinary
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_REGION=

# Or for Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=
```

**Media Processing Pipeline:**
1. Upload original file
2. Generate thumbnails (images: 150x150, 400x400, 1080x1080)
3. Transcode videos (H.264, multiple resolutions: 360p, 720p, 1080p)
4. Extract video thumbnail
5. Store metadata in MongoDB
6. Return CDN URLs

**Video Processing with FFmpeg:**
```python
# backend/media_processor.py
import subprocess

def transcode_video(input_path, output_path, resolution="720p"):
    cmd = [
        "ffmpeg",
        "-i", input_path,
        "-vcodec", "h264",
        "-acodec", "aac",
        "-vf", f"scale=-2:{resolution[:-1]}",
        "-preset", "fast",
        "-crf", "23",
        output_path
    ]
    subprocess.run(cmd)

def generate_thumbnail(video_path, output_path, timestamp="00:00:01"):
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-ss", timestamp,
        "-vframes", "1",
        "-vf", "scale=400:-1",
        output_path
    ]
    subprocess.run(cmd)
```

### Post Editor Features

**Frontend Libraries Needed:**
```bash
# Expo/React Native
expo install expo-image-picker expo-av
yarn add react-native-image-crop-picker
yarn add @react-native-community/slider
yarn add react-native-video
yarn add react-native-video-trimmer

# For GIFs
yarn add @giphy/react-native-sdk

# For filters
yarn add react-native-image-filter-kit

# For drawing
yarn add @shopify/react-native-skia
```

**Editor Components:**
- `ImageEditor.tsx` - Crop, rotate, adjust
- `VideoEditor.tsx` - Trim, filters
- `TextOverlayTool.tsx` - Add text
- `StickerPicker.tsx` - Sticker selection
- `GiphyPicker.tsx` - GIF search & selection
- `MusicPicker.tsx` - Background music
- `FilterSelector.tsx` - Visual filters
- `DrawingCanvas.tsx` - Freehand drawing

**GIPHY Integration:**
```typescript
// utils/giphyService.ts
import { GiphySDK } from '@giphy/react-native-sdk';

const giphy = new GiphySDK(process.env.EXPO_PUBLIC_GIPHY_API_KEY);

export const searchGifs = async (query: string, limit = 20) => {
  return await giphy.search(query, { limit, rating: 'pg' });
};
```

### Search System

**MongoDB Atlas Search Setup:**
```javascript
// Create search index in MongoDB Atlas
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "caption": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "hashtags": {
        "type": "string"
      },
      "user_name": {
        "type": "autocomplete"
      }
    }
  }
}
```

**Search API:**
```python
# /api/v1/search
GET /search?q={query}&type={type}&limit={limit}

# Types: users, posts, reels, hashtags, grounds, teams, products
```

---

## 📦 PART B: RANKINGS SYSTEM

### Backend Models Created ✅
Location: `/app/backend/rankings_models.py`

**Models:**
- `PlayerStats` - Aggregated statistics
- `PlayerRanking` - Ranking entry
- `RankingConfig` - Ranking calculation rules

### API Endpoints Required

```python
# Rankings API (/api/v1/rankings)
GET /rankings/batters?scope=global&region=USA
GET /rankings/bowlers?scope=regional&region=India
GET /rankings/all-rounders
GET /rankings/emerging?max_age=21
GET /rankings/power-hitters

# Player stats submission
POST /players/{player_id}/stats        # Submit match stats
GET  /players/{player_id}/stats        # Get player stats

# Ranking calculation
POST /rankings/calculate               # Trigger ranking calculation (admin)
```

### Ranking Calculation Algorithm

```python
def calculate_ranking_points(player_stats, config):
    points = 0
    
    # Recent form (last 10 matches)
    recent_avg = calculate_recent_average(player_stats, matches=10)
    points += recent_avg * config.weight_recent_form
    
    # Overall career stats
    career_avg = player_stats.batting_average
    points += career_avg * config.weight_overall_stats
    
    # Match impact (centuries, wickets, etc.)
    impact_score = calculate_impact_score(player_stats)
    points += impact_score * config.weight_match_impact
    
    # Opposition quality (if available)
    opp_score = calculate_opposition_quality(player_stats)
    points += opp_score * config.weight_opposition_quality
    
    return points
```

### Verification Badges

**Badge Types:**
1. ✓ **Verified Player** - Identity + cricket experience verified
2. 🏏 **League Verified** - Verified by league admin
3. 🌟 **International Player** - Manual admin approval
4. 📱 **Influencer** - High social engagement (10k+ followers, 5% engagement rate)

**Badge Assignment Logic:**
```python
def assign_verification_badge(user_id):
    user = await db.users.find_one({"id": user_id})
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    # Influencer badge
    if profile.followers_count >= 10000:
        engagement_rate = calculate_engagement_rate(user_id)
        if engagement_rate >= 5.0:
            return "influencer"
    
    # International player (manual approval)
    if user.is_international_player_approved:
        return "international"
    
    # League verified
    if user.league_verified_by:
        return "league"
    
    # Basic verified
    if user.identity_verified and user.cricket_experience_verified:
        return "player"
    
    return None
```

---

## 📦 PART C: EXTENDED FEATURES

### Backend Models Created ✅
Location: `/app/backend/extended_features_models.py`

**Models:**
- `PlayerCV` - Portfolio/Resume
- `JobPosting` - Job board
- `JobApplication` - Job applications
- `TrainerProfile` - Coaches directory
- `TrainerBooking` - Session bookings
- `Event` - Tournaments/clinics

### Player CV/Portfolio System

**API Endpoints:**
```python
# CV API (/api/v1/cv)
POST   /cv                    # Create CV
GET    /cv/me                 # Get my CV
PATCH  /cv/{cv_id}           # Update CV
GET    /cv/{cv_id}/pdf       # Generate PDF
GET    /cv/share/{cv_id}     # Get shareable link
```

**PDF Generation:**
```python
# backend/cv_generator.py
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def generate_cv_pdf(player_cv: PlayerCV, output_path: str):
    c = canvas.Canvas(output_path, pagesize=letter)
    
    # Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(100, 750, player_cv.full_name)
    
    # Contact info
    c.setFont("Helvetica", 12)
    c.drawString(100, 730, f"Location: {player_cv.current_location}")
    
    # Cricket profile
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 700, "Cricket Profile")
    c.setFont("Helvetica", 12)
    c.drawString(100, 680, f"Role: {player_cv.playing_role}")
    c.drawString(100, 665, f"Batting: {player_cv.batting_style}")
    
    # Stats
    y = 630
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, y, "Career Statistics")
    y -= 20
    c.setFont("Helvetica", 11)
    for key, value in player_cv.stats_summary.items():
        c.drawString(100, y, f"{key}: {value}")
        y -= 15
    
    # Achievements
    # ... add more sections
    
    c.save()
    return output_path
```

### Job Board System

**API Endpoints:**
```python
# Jobs API (/api/v1/jobs)
POST   /jobs                         # Post job (league/company)
GET    /jobs                         # Browse jobs
GET    /jobs/{job_id}               # Get job details
PATCH  /jobs/{job_id}               # Update job
DELETE /jobs/{job_id}               # Delete job

# Applications
POST   /jobs/{job_id}/apply         # Apply for job
GET    /jobs/{job_id}/applications  # Get applications (poster only)
PATCH  /applications/{app_id}/status # Update application status
```

### Trainers & Coaches Directory

**API Endpoints:**
```python
# Trainers API (/api/v1/trainers)
POST   /trainers                    # Create trainer profile
GET    /trainers                    # Browse trainers
GET    /trainers/{trainer_id}      # Get trainer profile
PATCH  /trainers/{trainer_id}      # Update profile
POST   /trainers/{trainer_id}/book # Book session
GET    /trainers/{trainer_id}/availability
POST   /trainers/{trainer_id}/review # Add review
```

### Events & Tournaments Discovery

**API Endpoints:**
```python
# Events API (/api/v1/events)
POST   /events                   # Create event
GET    /events                   # Browse events
GET    /events/nearby           # Events near user
GET    /events/{event_id}       # Get event details
POST   /events/{event_id}/register # Register for event
GET    /events/{event_id}/participants
```

---

## 🎨 FRONTEND IMPLEMENTATION

### Required Screens

#### Social Hub
```
frontend/app/(tabs)/social.tsx          - Main social feed
frontend/app/social/create-post.tsx     - Create post with editor
frontend/app/social/reels.tsx           - Reels swipe feed
frontend/app/social/stories.tsx         - Stories viewer
frontend/app/social/post/[id].tsx       - Post details
frontend/app/social/profile/[id].tsx    - User profile
```

#### Rankings
```
frontend/app/(tabs)/rankings.tsx        - Rankings home
frontend/app/rankings/batters.tsx       - Batters rankings
frontend/app/rankings/bowlers.tsx       - Bowlers rankings
frontend/app/rankings/[category].tsx    - Dynamic category
```

#### Extended Features
```
frontend/app/cv/builder.tsx             - CV builder
frontend/app/cv/preview/[id].tsx        - CV preview
frontend/app/jobs/browse.tsx            - Job listings
frontend/app/jobs/[id].tsx              - Job details
frontend/app/trainers/browse.tsx        - Trainers directory
frontend/app/trainers/[id].tsx          - Trainer profile
frontend/app/events/browse.tsx          - Events discovery
frontend/app/events/[id].tsx            - Event details
```

### Key Frontend Components

#### Post Card
```typescript
// components/Social/PostCard.tsx
interface PostCardProps {
  post: SocialPost;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  return (
    <View style={styles.container}>
      {/* User header */}
      <PostHeader user={post.user} timestamp={post.created_at} />
      
      {/* Media */}
      {post.post_type === 'photo' && <ImageCarousel images={post.media} />}
      {post.post_type === 'video' && <VideoPlayer video={post.media[0]} />}
      
      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>
      
      {/* Actions */}
      <PostActions 
        likes={post.likes_count}
        comments={post.comments_count}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    </View>
  );
}
```

#### Reels Player
```typescript
// components/Social/ReelsPlayer.tsx
export function ReelsPlayer({ reels }: { reels: SocialPost[] }) {
  return (
    <FlatList
      data={reels}
      renderItem={({ item }) => (
        <ReelItem reel={item} />
      )}
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      pagingEnabled
    />
  );
}
```

### Dependencies to Install

```bash
cd frontend

# Image/video handling
yarn add expo-image-picker expo-av expo-media-library
yarn add react-native-image-crop-picker

# Video player
yarn add react-native-video

# GIF support
yarn add @giphy/react-native-sdk

# Image filters
yarn add react-native-image-filter-kit

# Drawing
yarn add @shopify/react-native-skia

# PDF viewing
yarn add react-native-pdf

# WebView for articles/scoreboards
yarn add react-native-webview

# Animations
yarn add react-native-reanimated
```

---

## 🔐 SECURITY & PRIVACY

### Content Moderation
- Implement report system
- Admin review queue
- Automated content filtering (profanity, inappropriate content)
- NSFW detection for images

### Privacy Controls
```python
# User privacy settings
{
  "is_private": false,
  "allow_messages_from": "everyone",  # everyone, followers, none
  "allow_story_views_from": "everyone",
  "allow_tags_from": "everyone",
  "show_activity_status": true,
  "show_last_seen": true
}
```

### Data Retention
- Stories: Auto-delete after 24 hours
- Posts: Keep indefinitely (unless user deletes)
- Comments: Soft delete (mark as deleted but keep in DB)
- Media: Compress and archive old content

---

## 📊 ANALYTICS & INSIGHTS

### User Analytics Dashboard
```python
# /api/v1/analytics/me
{
  "posts_insights": {
    "total_posts": 150,
    "avg_likes_per_post": 45,
    "avg_comments_per_post": 12,
    "reach": 5000,  # unique viewers
    "engagement_rate": 8.5
  },
  "followers_insights": {
    "followers_gained_this_week": 25,
    "top_regions": ["USA", "India", "Australia"]
  },
  "best_performing_posts": [...]
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend
- [ ] Install all dependencies
- [ ] Configure media storage provider
- [ ] Set up FFmpeg for video processing
- [ ] Configure MongoDB indexes
- [ ] Set up CDN for media delivery
- [ ] Implement rate limiting
- [ ] Set up monitoring (Sentry, DataDog)

### Frontend
- [ ] Install all packages
- [ ] Configure environment variables
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test Expo web build
- [ ] Optimize images and assets
- [ ] Set up push notifications

### Database Indexes
```javascript
// MongoDB indexes for performance
db.social_posts.createIndex({ "user_id": 1, "created_at": -1 });
db.social_posts.createIndex({ "hashtags": 1 });
db.social_posts.createIndex({ "post_type": 1, "created_at": -1 });
db.social_posts.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });
db.comments.createIndex({ "post_id": 1, "created_at": -1 });
db.follows.createIndex({ "follower_id": 1 });
db.follows.createIndex({ "following_id": 1 });
db.notifications.createIndex({ "user_id": 1, "is_read": 1, "created_at": -1 });
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Caching Strategy
- Redis for feed caching
- CDN for media files
- In-memory cache for rankings
- Service worker for web build

### Lazy Loading
- Infinite scroll for feeds
- Lazy load images
- Video thumbnail preview before full load

### Database Optimization
- Pagination (cursor-based)
- Denormalize user info in posts
- Aggregate counts in background jobs

---

## 📝 MIGRATION SCRIPTS

```python
# migrations/001_create_social_collections.py
async def migrate():
    # Create collections
    await db.create_collection("social_posts")
    await db.create_collection("comments")
    await db.create_collection("interactions")
    await db.create_collection("follows")
    await db.create_collection("notifications")
    
    # Create indexes
    await db.social_posts.create_index([("user_id", 1), ("created_at", -1)])
    # ... more indexes
```

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Core Social (Week 1-2)
- Basic post creation (photo/video)
- Feed display
- Like/comment functionality
- Follow system

### Phase 2: Advanced Social (Week 3-4)
- Reels
- Stories with 24h expiry
- Post editor (text, stickers)
- Search

### Phase 3: Rankings & CV (Week 5-6)
- Rankings calculation
- Player CV builder
- Verification badges

### Phase 4: Extended Features (Week 7-8)
- Job board
- Trainers directory
- Events discovery
- Advanced search

### Phase 5: Polish & Optimization (Week 9-10)
- Performance optimization
- Testing
- Bug fixes
- Documentation

---

## 📞 SUPPORT & RESOURCES

### External Services Needed
- **Media Storage**: AWS S3, Supabase, or Cloudinary
- **CDN**: CloudFlare or AWS CloudFront
- **Video Transcoding**: AWS Elastic Transcoder or Cloudinary
- **Push Notifications**: Firebase Cloud Messaging
- **Analytics**: Mixpanel or Amplitude
- **Error Tracking**: Sentry
- **GIPHY API**: For GIF search
- **YouTube API**: For music/copyright-free tracks

### Estimated Costs (Monthly)
- Media Storage (1TB): $23
- CDN (1TB bandwidth): $85
- Video Transcoding: $50-200 (variable)
- Push Notifications: Free (Firebase)
- MongoDB Atlas: $57 (M10 cluster)
- **Total**: ~$215-385/month

---

## ✅ TESTING STRATEGY

### Unit Tests
- Test all API endpoints
- Test ranking calculations
- Test media processing

### Integration Tests
- Test post creation flow
- Test feed generation
- Test search functionality

### E2E Tests
- Test complete user journey
- Test social interactions
- Test mobile & web builds

---

**Status**: Architecture complete. Ready for implementation. Estimated 10 weeks for full deployment with 2-3 developers.
