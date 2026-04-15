"""
AI Policy Summarization
Scrapes candidate campaign websites and uses GPT-4o to extract structured policy positions.
"""

import httpx
import os
import json
import logging
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential
from db import engine
from sqlalchemy import text
from datetime import datetime

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

POLICY_TOPICS = [
    "economy", "healthcare", "immigration", "environment",
    "education", "gun_policy", "foreign_policy", "social_security",
    "housing", "criminal_justice"
]

SYSTEM_PROMPT = """You are a nonpartisan political analyst. Extract policy positions from the provided text.
Return ONLY valid JSON with these exact keys: economy, healthcare, immigration, environment, education, 
gun_policy, foreign_policy, social_security, housing, criminal_justice.
Each value must be either:
- A 1-2 sentence neutral summary of the candidate's stated position
- null if no clear position is found in the text
Do not editorialize. Do not add opinions. Summarize only what is explicitly stated."""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=2, max=8))
def scrape_policy_page(url: str) -> str:
    """Scrape a campaign website and extract policy-related text."""
    headers = {"User-Agent": "VoteLens/1.0 Research Bot (contact@votelens.com)"}
    
    with httpx.Client(timeout=15, follow_redirects=True, headers=headers) as http:
        # Try common policy page paths
        policy_paths = ["", "/issues", "/policy", "/platform", "/priorities", "/about"]
        all_text = ""
        
        for path in policy_paths[:3]:  # Limit to 3 pages
            try:
                r = http.get(url.rstrip("/") + path)
                if r.status_code == 200:
                    soup = BeautifulSoup(r.text, "lxml")
                    # Remove scripts, styles, nav
                    for tag in soup(["script", "style", "nav", "footer", "header"]):
                        tag.decompose()
                    text = soup.get_text(separator=" ", strip=True)
                    # Limit text size
                    all_text += text[:3000] + " "
            except Exception:
                continue
        
        return all_text[:8000]  # Max 8K chars to GPT


def summarize_with_ai(text: str, candidate_name: str) -> dict:
    """Send scraped text to GPT-4o and get structured policy positions."""
    if len(text.strip()) < 100:
        return {}
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Candidate: {candidate_name}\n\nWebsite text:\n{text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        log.warning(f"GPT summarization failed for {candidate_name}: {e}")
        return {}


def run():
    log.info("Starting policy summarization...")
    processed = 0

    with engine.connect() as conn:
        # Get candidates with websites but no policy positions yet
        rows = conn.execute(
            text("""
            SELECT c.id, c.full_name, c.campaign_website
            FROM candidates c
            LEFT JOIN policy_positions p ON p.candidate_id = c.id
            WHERE c.campaign_website IS NOT NULL
            AND c.campaign_website != 
            AND p.id IS NULL
            LIMIT 50
            """)
        ).fetchall()

        log.info(f"Found {len(rows)} candidates to process")

        for row in rows:
            candidate_id, name, website = str(row[0]), row[1], row[2]
            log.info(f"Processing: {name} ({website})")

            try:
                page_text = scrape_policy_page(website)
                positions = summarize_with_ai(page_text, name)

                for topic, summary in positions.items():
                    if summary:
                        conn.execute(
                            text("""
                            INSERT INTO policy_positions (
                                id, candidate_id, topic, position_summary,
                                source_url, confidence_score, last_scraped
                            ) VALUES (
                                gen_random_uuid(), :cid, :topic, :summary,
                                :source, 0.75, :scraped
                            ) ON CONFLICT (candidate_id, topic) DO UPDATE SET
                                position_summary = EXCLUDED.position_summary,
                                last_scraped = EXCLUDED.last_scraped
                            """),
                            {
                                "cid": candidate_id,
                                "topic": topic,
                                "summary": summary,
                                "source": website,
                                "scraped": datetime.now(),
                            }
                        )
                conn.execute(text("COMMIT"))
                conn.execute(text("BEGIN"))
                processed += 1

            except Exception as e:
                log.error(f"Failed for {name}: {e}")
                continue

        conn.execute(text("COMMIT"))

    log.info(f"Policy summarization complete. {processed} candidates processed.")


if __name__ == "__main__":
    run()