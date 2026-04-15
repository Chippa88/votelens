"""
Congress.gov API Ingestion
Pulls member voting records and bill sponsorship data.
Matches to existing FEC candidate records via crosswalk.
"""

import httpx
import os
import logging
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential
from db import engine
from sqlalchemy import text

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

CONGRESS_BASE = "https://api.congress.gov/v3"
API_KEY = os.getenv("CONGRESS_API_KEY")
CURRENT_CONGRESS = 119  # 119th Congress = 2025-2027


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def congress_get(path: str, params: dict = {}) -> dict:
    params["api_key"] = API_KEY
    params["format"] = "json"
    with httpx.Client(timeout=30) as client:
        r = client.get(f"{CONGRESS_BASE}{path}", params=params)
        r.raise_for_status()
        return r.json()


def find_candidate_by_name_state(conn, name: str, state: str):
    """Fuzzy match Congress member to existing FEC candidate."""
    # Try exact name match first
    parts = name.split(", ")
    if len(parts) == 2:
        last, first = parts[0], parts[1].split(" ")[0]
        search_name = f"{first} {last}"
    else:
        search_name = name

    row = conn.execute(
        text("""
        SELECT id FROM candidates
        WHERE state = :state
        AND LOWER(full_name) LIKE LOWER(:name_pattern)
        LIMIT 1
        """),
        {"state": state, "name_pattern": f"%{search_name.split()[0]}%"}
    ).fetchone()
    return str(row[0]) if row else None


def ingest_member_votes(conn, bioguide_id: str, candidate_id: str):
    try:
        data = congress_get(f"/member/{bioguide_id}/sponsored-legislation", {"limit": 50})
        bills = data.get("sponsoredLegislation", [])
        for bill in bills:
            conn.execute(
                text("""
                INSERT INTO votes (
                    id, candidate_id, bill_id, bill_title, vote_date,
                    congress_number, chamber, vote_position
                ) VALUES (
                    gen_random_uuid(), :cid, :bill_id, :title, :date, :congress, :chamber, :position
                ) ON CONFLICT DO NOTHING
                """),
                {
                    "cid": candidate_id,
                    "bill_id": bill.get("number"),
                    "title": bill.get("title", "")[:500],
                    "date": bill.get("introducedDate"),
                    "congress": bill.get("congress"),
                    "chamber": bill.get("type", "").replace("HR", "House").replace("S", "Senate"),
                    "position": "Sponsored",
                }
            )
    except Exception as e:
        log.warning(f"Votes failed for {bioguide_id}: {e}")


def ingest_member_stats(conn, bioguide_id: str, candidate_id: str):
    """Pull stats from ProPublica Congress API (more detailed than Congress.gov for stats)."""
    try:
        pp_key = os.getenv("PROPUBLICA_API_KEY")
        if not pp_key:
            return
        with httpx.Client(timeout=30, headers={"X-API-Key": pp_key}) as client:
            r = client.get(f"https://api.propublica.org/congress/v1/members/{bioguide_id}.json")
            if r.status_code != 200:
                return
            data = r.json()
            member = data.get("results", [{}])[0]
            roles = member.get("roles", [{}])
            latest = roles[0] if roles else {}

            conn.execute(
                text("""
                INSERT INTO member_stats (
                    id, candidate_id, congress_number, party_loyalty_pct,
                    bipartisan_pct, missed_votes_pct, bills_sponsored, bills_cosponsored
                ) VALUES (
                    gen_random_uuid(), :cid, :congress, :loyalty, :bipartisan, :missed, :sponsored, :cosponsored
                ) ON CONFLICT (candidate_id, congress_number) DO UPDATE SET
                    party_loyalty_pct = EXCLUDED.party_loyalty_pct,
                    bipartisan_pct = EXCLUDED.bipartisan_pct,
                    missed_votes_pct = EXCLUDED.missed_votes_pct,
                    bills_sponsored = EXCLUDED.bills_sponsored,
                    bills_cosponsored = EXCLUDED.bills_cosponsored
                """),
                {
                    "cid": candidate_id,
                    "congress": CURRENT_CONGRESS,
                    "loyalty": latest.get("votes_with_party_pct"),
                    "bipartisan": latest.get("votes_against_party_pct"),
                    "missed": latest.get("missed_votes_pct"),
                    "sponsored": member.get("total_sponsored"),
                    "cosponsored": member.get("total_cosponsored"),
                }
            )
    except Exception as e:
        log.warning(f"Stats failed for {bioguide_id}: {e}")


def run():
    log.info("Starting Congress.gov ingestion...")
    offset = 0
    limit = 250
    processed = 0

    with engine.connect() as conn:
        conn.execute(text("BEGIN"))
        while True:
            log.info(f"Fetching members offset {offset}...")
            data = congress_get(f"/member", {"limit": limit, "offset": offset, "currentMember": "true"})
            members = data.get("members", [])
            if not members:
                break

            for m in members:
                bioguide_id = m.get("bioguideId")
                state = m.get("state")
                name = m.get("name", "")

                # Try to match to existing FEC candidate
                candidate_id = find_candidate_by_name_state(conn, name, state)

                if candidate_id:
                    # Update bioguide ID on existing record
                    conn.execute(
                        text("UPDATE candidates SET bioguide_id = :bid WHERE id = :id"),
                        {"bid": bioguide_id, "id": candidate_id}
                    )
                    ingest_member_votes(conn, bioguide_id, candidate_id)
                    ingest_member_stats(conn, bioguide_id, candidate_id)
                    processed += 1

            if len(members) < limit:
                break
            offset += limit

        conn.execute(text("COMMIT"))

    log.info(f"Congress ingestion complete. {processed} members matched and processed.")


if __name__ == "__main__":
    run()