"""
Ingestion Scheduler
Runs all data ingestion jobs on a schedule.
"""

import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
import ingest_fec
import ingest_congress
import summarize_policy

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

scheduler = BlockingScheduler(timezone="America/Chicago")

# FEC + Congress data — nightly at 2 AM
@scheduler.scheduled_job(CronTrigger(hour=2, minute=0))
def nightly_finance_votes():
    log.info("Running nightly FEC ingestion...")
    ingest_fec.run()
    log.info("Running nightly Congress ingestion...")
    ingest_congress.run()

# Policy scraping — weekly on Sunday at 3 AM
@scheduler.scheduled_job(CronTrigger(day_of_week="sun", hour=3, minute=0))
def weekly_policy():
    log.info("Running weekly policy summarization...")
    summarize_policy.run()

if __name__ == "__main__":
    log.info("Scheduler started. Running initial ingestion...")
    ingest_fec.run()
    ingest_congress.run()
    summarize_policy.run()
    log.info("Initial ingestion complete. Starting scheduler...")
    scheduler.start()