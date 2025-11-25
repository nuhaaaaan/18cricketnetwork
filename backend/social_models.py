"""
Social Media Models for 18 Cricket Network
Handles posts, stories, reels, interactions
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PostType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"
    REEL = "reel"
    STORY = "story"

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    GIF = "gif"

class PrivacyLevel(str, Enum):
    PUBLIC = "public"
    FOLLOWERS = "followers"
    FRIENDS = "friends"
    PRIVATE = "private"

class MediaItem(BaseModel):
    url: str
    type: MediaType
    thumbnail_url: Optional[str] = None
    duration: Optional[int] = None  # seconds for video
    width: Optional[int] = None
    height: Optional[int] = None
    size: Optional[int] = None  # bytes

class TextOverlay(BaseModel):
    text: str
    x: float
    y: float
    color: str
    font_size: int
    font_family: str = "Arial"

class Sticker(BaseModel):
    sticker_id: str
    x: float
    y: float
    scale: float = 1.0

class PostEdits(BaseModel):
    """Editor metadata"""
    text_overlays: List[TextOverlay] = []
    stickers: List[Sticker] = []
    filter: Optional[str] = None
    music_track: Optional[str] = None
    brightness: float = 0
    contrast: float = 0
    saturation: float = 0

class SocialPost(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    post_type: PostType
    caption: str
    media: List[MediaItem]
    hashtags: List[str] = []
    mentions: List[str] = []  # user_ids
    location: Optional[Dict[str, Any]] = None  # {"name": "", "lat": 0, "lng": 0}
    privacy: PrivacyLevel = PrivacyLevel.PUBLIC
    edits: Optional[PostEdits] = None
    
    # Interaction counts
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    saves_count: int = 0
    
    # Story specific
    expires_at: Optional[datetime] = None  # For stories
    is_highlight: bool = False
    highlight_name: Optional[str] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    reported_count: int = 0

class Comment(BaseModel):
    id: str
    post_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    parent_comment_id: Optional[str] = None  # For threading
    mentions: List[str] = []
    likes_count: int = 0
    created_at: datetime
    is_deleted: bool = False

class Interaction(BaseModel):
    """Like, save, etc."""
    id: str
    user_id: str
    target_id: str  # post_id or comment_id
    target_type: str  # "post" or "comment"
    interaction_type: str  # "like", "save", "share"
    created_at: datetime

class Follow(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: datetime

class StoryView(BaseModel):
    id: str
    story_id: str
    viewer_id: str
    viewer_name: str
    viewer_avatar: Optional[str] = None
    viewed_at: datetime

class Notification(BaseModel):
    id: str
    user_id: str  # recipient
    type: str  # "like", "comment", "follow", "mention", "tag", "story_view"
    actor_id: str  # who triggered it
    actor_name: str
    actor_avatar: Optional[str] = None
    target_id: Optional[str] = None  # post_id, comment_id, etc.
    message: str
    is_read: bool = False
    created_at: datetime

class UserProfile(BaseModel):
    """Extended user profile for social features"""
    user_id: str
    bio: Optional[str] = None
    location: Optional[str] = None
    cricket_role: Optional[str] = None
    website: Optional[str] = None
    
    # Social counts
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    
    # Privacy settings
    is_private: bool = False
    allow_messages_from: str = "everyone"  # "everyone", "followers", "none"
    allow_story_views_from: str = "everyone"
    
    # Verification
    is_verified: bool = False
    verification_badge: Optional[str] = None  # "player", "league", "international", "influencer"
    
    updated_at: datetime
