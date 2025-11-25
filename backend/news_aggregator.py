"""
News Aggregator Service
Fetches cricket news from public RSS feeds and APIs
"""

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import logging
import aiohttp
import feedparser
import hashlib
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# News Model
class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    source: str
    url: str
    tags: List[str]
    is_record_breaking: bool
    region: str  # global, India, Australia, USA, etc.
    published_at: datetime
    score: float  # ranking score
    image_url: Optional[str] = None
    created_at: datetime

# Base News Provider
class NewsProvider:
    """Base class for news providers"""
    
    def __init__(self, name: str, feed_url: str):
        self.name = name
        self.feed_url = feed_url
    
    async def fetch_news(self) -> List[Dict[str, Any]]:
        """Fetch news from RSS feed"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.feed_url, timeout=30) as response:
                    if response.status == 200:
                        content = await response.text()
                        feed = feedparser.parse(content)
                        return self._parse_feed(feed)
            return []
        except Exception as e:
            logger.error(f"Error fetching news from {self.name}: {e}")
            return []
    
    def _parse_feed(self, feed) -> List[Dict[str, Any]]:
        """Parse RSS feed into news items"""
        items = []
        
        for entry in feed.entries[:20]:  # Limit to 20 most recent
            try:
                item = {
                    "title": entry.get('title', ''),
                    "summary": entry.get('summary', entry.get('description', ''))[:500],
                    "url": entry.get('link', ''),
                    "published": self._parse_date(entry.get('published', '')),
                    "source": self.name
                }
                items.append(item)
            except Exception as e:
                logger.error(f"Error parsing feed entry: {e}")
        
        return items
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse various date formats"""
        try:
            from dateutil import parser
            return parser.parse(date_str)
        except:
            return datetime.utcnow()
    
    def normalize_news(self, raw_data: Dict) -> NewsItem:
        """Normalize raw news data"""
        # Generate unique ID from URL
        news_id = hashlib.md5(raw_data['url'].encode()).hexdigest()
        
        # Extract tags and classification
        title_lower = raw_data['title'].lower()
        summary_lower = raw_data.get('summary', '').lower()
        combined = f"{title_lower} {summary_lower}"
        
        tags = self._extract_tags(combined)
        is_record = self._is_record_breaking(combined)
        region = self._determine_region(combined)
        score = self._calculate_score(raw_data, is_record, tags)
        
        return NewsItem(
            id=news_id,
            title=raw_data['title'],
            summary=raw_data['summary'],
            source=raw_data['source'],
            url=raw_data['url'],
            tags=tags,
            is_record_breaking=is_record,
            region=region,
            published_at=raw_data['published'],
            score=score,
            created_at=datetime.utcnow()
        )
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract relevant tags from text"""
        tags = []
        
        # Format tags
        if 'test' in text:
            tags.append('test')
        if 'odi' in text:
            tags.append('odi')
        if 't20' in text:
            tags.append('t20')
        
        # Competition tags
        competitions = ['ipl', 'world cup', 'bbl', 'psl', 'cpl', 'hundred']
        for comp in competitions:
            if comp in text:
                tags.append(comp.replace(' ', '_'))
        
        # Event tags
        if any(word in text for word in ['century', 'hundred', 'wickets', 'record']):
            tags.append('milestone')
        if any(word in text for word in ['injury', 'injured']):
            tags.append('injury')
        if any(word in text for word in ['transfer', 'signed', 'deal']):
            tags.append('transfer')
        
        return tags
    
    def _is_record_breaking(self, text: str) -> bool:
        """Detect if news is about a record"""
        record_keywords = [
            'record', 'fastest', 'highest', 'lowest', 'most',
            'first ever', 'historic', 'milestone', 'breakthrough'
        ]
        return any(keyword in text for keyword in record_keywords)
    
    def _determine_region(self, text: str) -> str:
        """Determine geographic region"""
        regions = {
            'India': ['india', 'indian', 'ipl', 'mumbai', 'delhi', 'chennai'],
            'Australia': ['australia', 'australian', 'bbl', 'sydney', 'melbourne'],
            'England': ['england', 'english', 'county', 'lords', 'the hundred'],
            'USA': ['usa', 'america', 'major league cricket'],
            'Pakistan': ['pakistan', 'pakistani', 'psl'],
            'West Indies': ['west indies', 'caribbean', 'cpl']
        }
        
        for region, keywords in regions.items():
            if any(keyword in text for keyword in keywords):
                return region
        
        return 'global'
    
    def _calculate_score(self, raw_data: Dict, is_record: bool, tags: List[str]) -> float:
        """Calculate ranking score for news item"""
        score = 50.0  # Base score
        
        # Boost for record-breaking news
        if is_record:
            score += 30.0
        
        # Boost for high-profile competitions
        high_profile_tags = ['world_cup', 'ipl', 'test']
        for tag in tags:
            if tag in high_profile_tags:
                score += 15.0
        
        # Recency boost
        age_hours = (datetime.utcnow() - raw_data['published']).total_seconds() / 3600
        if age_hours < 6:
            score += 20.0
        elif age_hours < 24:
            score += 10.0
        
        return min(score, 100.0)

# Provider Registry
NEWS_PROVIDERS = [
    NewsProvider("ESPNCricinfo", "https://www.espncricinfo.com/rss/content/story/feeds/0.xml"),
    NewsProvider("CricBuzz", "https://www.cricbuzz.com/rss-feed/cricket-news.xml"),
    # Add more RSS feeds here
]

async def aggregate_news():
    """Main news aggregation function"""
    logger.info("Starting news aggregation...")
    
    all_news = []
    
    # Fetch from all providers
    for provider in NEWS_PROVIDERS:
        try:
            logger.info(f"Fetching news from {provider.name}...")
            raw_news_items = await provider.fetch_news()
            
            for raw_item in raw_news_items:
                try:
                    normalized_item = provider.normalize_news(raw_item)
                    all_news.append(normalized_item)
                except Exception as e:
                    logger.error(f"Error normalizing news from {provider.name}: {e}")
        
        except Exception as e:
            logger.error(f"Error with provider {provider.name}: {e}")
    
    # Deduplicate by URL
    seen_urls = set()
    unique_news = []
    for item in all_news:
        if item.url not in seen_urls:
            seen_urls.add(item.url)
            unique_news.append(item)
    
    # Upsert to database
    logger.info(f"Upserting {len(unique_news)} news items to database...")
    
    for news_item in unique_news:
        try:
            await db.news.update_one(
                {"id": news_item.id},
                {"$set": news_item.dict()},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error upserting news {news_item.id}: {e}")
    
    # Clean up old news (older than 7 days)
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    await db.news.delete_many({"published_at": {"$lt": cutoff_date}})
    
    logger.info(f"News aggregation completed. Processed {len(unique_news)} items.")
    
    return len(unique_news)
