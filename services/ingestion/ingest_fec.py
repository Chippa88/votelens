"""
FEC Campaign Finance Ingestion
Pulls candidate profiles and financial data from OpenFEC API.
Run nightly to keep data fresh.
"""

import httpx
import os
import logging
from datetime import datetime
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential
from db import engine
from sqlalchemy import text

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

FEC_BASE = "https://api.open.fec.gov/v1"
API_KEY = os.getenv("FEC_API_KEY")
ELECTION_CYCLE = 2026


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def fec_get(path: str, params: dict) -> dict:
    params["api_key"] = API_KEY
    with httpx.Client(timeout=30) as client:
        r = client.get(f"{FEC_BASE}{path}", params=params)
        r.raise_for_status()
        return r.json()


def upsert_candidate(conn, c: dict):
    conn.execute(
        text("""
        INSERT INTO candidates (
            id, fec_candidate_id, full_name, party, office, state, district,
            incumbent, campaign_website, election_cycle, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), :fec_id, :name, :party, :office, :state, :district,
            :incumbent, :website, :cycle, NOW(), NOW()
        )
        ON CONFLICT (fec_candidate_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            party = EXCLUDED.party,
            office = EXCLUDED.office,
            state = EXCLUDED.state,
            district = EXCLUDED.district,
            incumbent = EXCLUDED.incumbent,
            campaign_website = EXCLUDED.campaign_website,
            updated_at = NOW()
        """),
        {
            "fec_id": c.get("candidate_id"),
            "name": c.get("name"),
            "party": c.get("party_full"),
            "office": c.get("office"),
            "state": c.get("state"),
            "district": c.get("district"),
            "incumbent": c.get("incumbent_challenge") == "I",
            "website": c.get("candidate_url") or c.get("campaign_url"),
            "cycle": ELECTION_CYCLE,
        }
    )


def ingest_finance_totals(conn, fec_candidate_id: str, candidate_db_id: str):
    try:
        data = fec_get(f"/candidate/{fec_candidate_id}/totals/", {"cycle": ELECTION_CYCLE})
        results = data.get("results", [])
        if not results:
            return
        t = results[0]
        conn.execute(
            text("""
            INSERT INTO finance_totals (
                id, candidate_id, cycle, total_receipts, total_disbursements,
                cash_on_hand, individual_itemized, individual_unitemized,
                pac_contributions, candidate_contributions, last_updated
            ) VALUES (
                gen_random_uuid(), :cid, :cycle, :receipts, :disbursements,
                :cash, :itemized, :unitemized, :pac, :self, NOW()
            )
            ON CONFLICT (candidate_id, cycle) DO UPDATE SET
                total_receipts = EXCLUDED.total_receipts,
                total_disbursements = EXCLUDED.total_disbursements,
                cash_on_hand = EXCLUDED.cash_on_hand,
                last_updated = NOW()
            """),
            {
                "cid": candidate_db_id,
                "cycle": ELECTION_CYCLE,
                "receipts": t.get("receipts"),
                "disbursements": t.get("disbursements"),
                "cash": t.get("last_cash_on_hand_end_period"),
                "itemized": t.get("individual_itemized_contributions"),
                "unitemized": t.get("individual_unitemized_contributions"),
                "pac": t.get("other_political_committee_contributions"),
                "self": t.get("candidate_contribution"),
            }
        )
    except Exception as e:
        log.warning(f"Finance totals failed for {fec_candidate_id}: {e}")


def ingest_top_donors(conn, fec_candidate_id: str, candidate_db_id: str):
    try:
        data = fec_get("/schedules/schedule_a/", {
            "candidate_id": fec_candidate_id,
            "two_year_transaction_period": ELECTION_CYCLE,
            "per_page": 20,
            "sort": "-contribution_receipt_amount",
        })
        for d in data.get("results", []):
            conn.execute(
                text("""
                INSERT INTO donations (
                    id, candidate_id, contributor_name, contributor_employer,
                    contributor_occupation, amount, contribution_date, cycle
                ) VALUES (
                    gen_random_uuid(), :cid, :name, :employer, :occupation,
                    :amount, :date, :cycle
                ) ON CONFLICT DO NOTHING
                """),
                {
                    "cid": candidate_db_id,
                    "name": d.get("contributor_name"),
                    "employer": d.get("contributor_employer"),
                    "occupation": d.get("contributor_occupation"),
                    "amount": d.get("contribution_receipt_amount"),
                    "date": d.get("contribution_receipt_date"),
                    "cycle": ELECTION_CYCLE,
                }
            )
    except Exception as e:
        log.warning(f"Donors failed for {fec_candidate_id}: {e}")


def run():
    log.info("Starting FEC ingestion...")
    page = 1
    ingested = 0

    with engine.connect() as conn:
        conn.execute(text("BEGIN"))
        while True:
            log.info(f"Fetching FEC candidates page {page}...")
            data = fec_get("/candidates/", {
                "election_year": ELECTION_CYCLE,
                "per_page": 100,
                "page": page,
                "office": ["H", "S"],
                "candidate_status": "C",
            })
            results = data.get("results", [])
            if not results:
                break

            for c in results:
                upsert_candidate(conn, c)

                # Get the DB id we just created/updated
                row = conn.execute(
                    text("SELECT id FROM candidates WHERE fec_candidate_id = :fid"),
                    {"fid": c.get("candidate_id")}
                ).fetchone()
                if row:
                    ingest_finance_totals(conn, c["candidate_id"], str(row[0]))
                    ingest_top_donors(conn, c["candidate_id"], str(row[0]))
                    ingested += 1

            pagination = data.get("pagination", {})
            if page >= pagination.get("pages", 1):
                break
            page += 1

        conn.execute(text("COMMIT"))

    log.info(f"FEC ingestion complete. {ingested} candidates processed.")


if __name__ == "__main__":
    run()