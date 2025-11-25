"""
Match Aggregator Service
Fetches cricket matches from multiple public sources
"""

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import logging
import aiohttp
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

# Match Model
class Match(BaseModel):
    id: str
    source: str
    source_match_id: str
    title: str
    teams: Dict[str, str]  # {"team1": "India", "team2": "Australia"}
    format: str  # Test, ODI, T20I, T20, List A
    competition: str  # World Cup, IPL, BBL, etc.
    level: str  # International, Franchise, Domestic, Associate, Local
    start_time_utc: datetime
    end_time_utc: Optional[datetime] = None
    venue_name: str
    venue_city: Optional[str] = None
    venue_country: str
    venue_latitude: Optional[float] = None
    venue_longitude: Optional[float] = None
    status: str  # upcoming, live, completed, abandoned
    score_summary: Optional[str] = None
    info_link: str
    stream_link: Optional[str] = None
    last_updated: datetime

# Base Provider Interface
class MatchProvider:
    """Base class for match data providers"""
    
    def __init__(self, name: str):
        self.name = name
    
    async def fetch_matches(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch matches from provider. Must be implemented by subclasses."""
        raise NotImplementedError
    
    def normalize_match(self, raw_data: Dict) -> Match:
        """Normalize raw data into Match model. Must be implemented by subclasses."""
        raise NotImplementedError

# Example Provider: CricketData.org (public API - example)
class CricketDataOrgProvider(MatchProvider):
    """
    Example provider using public cricket data
    Replace with actual public API endpoints
    """
    
    def __init__(self):
        super().__init__("cricketdata.org")
        self.base_url = "https://api.cricketdata.org/v1"  # Example URL
    
    async def fetch_matches(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch matches from CricketData.org"""
        try:
            async with aiohttp.ClientSession() as session:
                # Example API call structure
                params = {
                    "from": start_date.strftime("%Y-%m-%d"),
                    "to": end_date.strftime("%Y-%m-%d")
                }
                
                # For demonstration, return empty list
                # In production, make actual API call
                # async with session.get(f"{self.base_url}/matches", params=params) as resp:
                #     if resp.status == 200:
                #         data = await resp.json()
                #         return data.get('matches', [])
                
                return []
        except Exception as e:
            logger.error(f"Error fetching from {self.name}: {e}")
            return []
    
    def normalize_match(self, raw_data: Dict) -> Match:
        """Normalize CricketData.org format to Match model"""
        return Match(
            id=f"{self.name}_{raw_data['id']}",
            source=self.name,
            source_match_id=str(raw_data['id']),
            title=raw_data.get('title', ''),
            teams={
                "team1": raw_data.get('team1', ''),
                "team2": raw_data.get('team2', '')
            },
            format=raw_data.get('format', 'T20'),
            competition=raw_data.get('series', 'Unknown'),
            level=self._determine_level(raw_data),
            start_time_utc=datetime.fromisoformat(raw_data.get('start_time')),
            venue_name=raw_data.get('venue', 'TBD'),
            venue_country=raw_data.get('country', 'Unknown'),
            status=raw_data.get('status', 'upcoming'),
            info_link=raw_data.get('link', ''),
            last_updated=datetime.utcnow()
        )
    
    def _determine_level(self, raw_data: Dict) -> str:
        """Determine match level from data"""
        format_type = raw_data.get('format', '').upper()
        if format_type in ['TEST', 'ODI', 'T20I']:
            return 'International'
        series = raw_data.get('series', '').lower()
        if any(x in series for x in ['ipl', 'bbl', 'psl', 'cpl']):
            return 'Franchise'
        return 'Domestic'

# Sample Data Provider (for demonstration)
class SampleMatchProvider(MatchProvider):
    """Sample provider with demo data"""
    
    def __init__(self):
        super().__init__("sample_provider")
    
    async def fetch_matches(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Return sample matches for demonstration"""
        return [
            {
                "id": "match_001",
                "title": "India vs Australia - 1st Test",
                "team1": "India",
                "team2": "Australia",
                "format": "Test",
                "series": "Border-Gavaskar Trophy",
                "start_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "venue": "Melbourne Cricket Ground",
                "city": "Melbourne",
                "country": "Australia",
                "latitude": -37.8200,
                "longitude": 144.9834,
                "status": "upcoming",
                "link": "https://www.espncricinfo.com"
            },
            {
                "id": "match_002",
                "title": "England vs New Zealand - T20I",
                "team1": "England",
                "team2": "New Zealand",
                "format": "T20I",
                "series": "T20I Series",
                "start_time": (datetime.utcnow() + timedelta(hours=6)).isoformat(),
                "venue": "Lord's Cricket Ground",
                "city": "London",
                "country": "England",
                "latitude": 51.5294,
                "longitude": -0.1726,
                "status": "live",
                "score_summary": "England 165/4 (15.2 overs)",
                "link": "https://www.espncricinfo.com"
            }
        ]
    
    def normalize_match(self, raw_data: Dict) -> Match:
        return Match(
            id=f"{self.name}_{raw_data['id']}",
            source=self.name,
            source_match_id=str(raw_data['id']),
            title=raw_data['title'],
            teams={
                "team1": raw_data['team1'],
                "team2": raw_data['team2']
            },
            format=raw_data['format'],
            competition=raw_data['series'],
            level='International' if raw_data['format'] in ['Test', 'ODI', 'T20I'] else 'Domestic',
            start_time_utc=datetime.fromisoformat(raw_data['start_time']),
            venue_name=raw_data['venue'],
            venue_city=raw_data.get('city'),
            venue_country=raw_data['country'],
            venue_latitude=raw_data.get('latitude'),
            venue_longitude=raw_data.get('longitude'),
            status=raw_data['status'],
            score_summary=raw_data.get('score_summary'),
            info_link=raw_data['link'],
            last_updated=datetime.utcnow()
        )

# Provider Registry
PROVIDERS: List[MatchProvider] = [
    SampleMatchProvider(),
    # Add more providers here:
    # CricketDataOrgProvider(),
    # ESPNCricinfoProvider(),
    # etc.
]

async def aggregate_matches():
    """Main aggregation function"""
    logger.info("Starting match aggregation...")
    
    # Define time window (today + next 7 days)
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=7)
    
    all_matches = []
    
    # Fetch from all providers
    for provider in PROVIDERS:
        try:
            logger.info(f"Fetching matches from {provider.name}...")
            raw_matches = await provider.fetch_matches(start_date, end_date)
            
            for raw_match in raw_matches:
                try:
                    normalized_match = provider.normalize_match(raw_match)
                    all_matches.append(normalized_match)
                except Exception as e:
                    logger.error(f"Error normalizing match from {provider.name}: {e}")
        
        except Exception as e:
            logger.error(f"Error with provider {provider.name}: {e}")
    
    # Upsert matches to database
    logger.info(f"Upserting {len(all_matches)} matches to database...")
    
    for match in all_matches:
        try:
            await db.matches.update_one(
                {"source": match.source, "source_match_id": match.source_match_id},
                {"$set": match.dict()},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error upserting match {match.id}: {e}")
    
    logger.info(f"Match aggregation completed. Processed {len(all_matches)} matches.")
    
    return len(all_matches)
