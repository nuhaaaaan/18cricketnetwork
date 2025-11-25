"""
Scheduler Service for 18 Cricket Network
Runs jobs 3x per day for matches and news aggregation
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = AsyncIOScheduler()

# Import job functions
from match_aggregator import aggregate_matches
from news_aggregator import aggregate_news

async def run_matches_job():
    """Run matches aggregation job"""
    try:
        logger.info(f"[{datetime.now()}] Starting matches aggregation...")
        await aggregate_matches()
        logger.info(f"[{datetime.now()}] Matches aggregation completed")
    except Exception as e:
        logger.error(f"Error in matches aggregation: {e}")

async def run_news_job():
    """Run news aggregation job"""
    try:
        logger.info(f"[{datetime.now()}] Starting news aggregation...")
        await aggregate_news()
        logger.info(f"[{datetime.now()}] News aggregation completed")
    except Exception as e:
        logger.error(f"Error in news aggregation: {e}")

def start_scheduler():
    """Initialize and start the scheduler"""
    
    # Run 3 times per day: 6 AM, 2 PM, 10 PM (UTC)
    # Matches job
    scheduler.add_job(
        run_matches_job,
        CronTrigger(hour='6,14,22', minute=0),
        id='matches_aggregator',
        name='Aggregate Cricket Matches',
        replace_existing=True
    )
    
    # News job
    scheduler.add_job(
        run_news_job,
        CronTrigger(hour='6,14,22', minute=15),  # 15 min after matches
        id='news_aggregator',
        name='Aggregate Cricket News',
        replace_existing=True
    )
    
    # Start scheduler
    scheduler.start()
    logger.info("Scheduler started. Jobs will run 3x daily at 06:00, 14:00, and 22:00 UTC")
    
    # Run immediately on startup (optional)
    # asyncio.create_task(run_matches_job())
    # asyncio.create_task(run_news_job())

def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

# Manual trigger endpoints (for testing)
async def trigger_matches_now():
    """Manually trigger matches aggregation"""
    await run_matches_job()

async def trigger_news_now():
    """Manually trigger news aggregation"""
    await run_news_job()
