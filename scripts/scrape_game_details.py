"""Scrape player count and playing time from BGG game pages.

Usage: python scripts/scrape_game_details.py

Reads data/bgg_collection.json and enriches it with min_players, max_players,
and playing_time by visiting each game's BGG page.

Requires: pip install playwright && playwright install chromium
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

COLLECTION_PATH = Path("data/bgg_collection.json")
BATCH_SIZE = 5  # games per batch before saving


def extract_game_info(page_text: str) -> dict:
    """Extract player count and playing time from a BGG game page's text."""
    player_match = re.search(r"(\d+)[–\-](\d+)\s*Players", page_text) or re.search(
        r"(\d+)\s*Players", page_text
    )
    time_match = re.search(r"(\d+)[–\-](\d+)\s*Min", page_text) or re.search(
        r"(\d+)\s*Min", page_text
    )

    min_players = 0
    max_players = 0
    playing_time = 0

    if player_match:
        min_players = int(player_match.group(1))
        max_players = (
            int(player_match.group(2)) if player_match.lastindex >= 2 else min_players
        )

    if time_match:
        t1 = int(time_match.group(1))
        t2 = int(time_match.group(2)) if time_match.lastindex >= 2 else t1
        playing_time = round((t1 + t2) / 2)

    return {
        "min_players": min_players,
        "max_players": max_players,
        "playing_time": playing_time,
    }


def main() -> None:
    from playwright.sync_api import sync_playwright

    with open(COLLECTION_PATH, encoding="utf-8") as f:
        games = json.load(f)

    # Only scrape games that don't have data yet
    to_scrape = [
        g
        for g in games
        if g.get("min_players", 0) == 0 and g.get("playing_time", 0) == 0
    ]
    print(f"Need to scrape {len(to_scrape)} of {len(games)} games")

    if not to_scrape:
        print("All games already have data!")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers(
            {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }
        )

        scraped = 0
        for i, game in enumerate(to_scrape):
            bgg_id = game["bgg_id"]
            url = f"https://boardgamegeek.com/boardgame/{bgg_id}"

            try:
                page.goto(url, timeout=15000, wait_until="domcontentloaded")
                page.wait_for_timeout(2000)  # Wait for dynamic content

                text = page.inner_text("body")
                info = extract_game_info(text)

                game["min_players"] = info["min_players"]
                game["max_players"] = info["max_players"]
                game["playing_time"] = info["playing_time"]
                scraped += 1

                status = f"[{i+1}/{len(to_scrape)}] {game['name']}: {info['min_players']}-{info['max_players']} players, {info['playing_time']} min"
                print(status)

            except Exception as e:
                print(f"[{i+1}/{len(to_scrape)}] {game['name']}: ERROR - {e}")

            # Save every BATCH_SIZE games
            if (i + 1) % BATCH_SIZE == 0:
                with open(COLLECTION_PATH, "w", encoding="utf-8") as f:
                    json.dump(games, f, ensure_ascii=False, indent=2)
                print(f"  Saved progress ({scraped} scraped so far)")

            # Be polite to BGG
            time.sleep(1)

        # Final save
        with open(COLLECTION_PATH, "w", encoding="utf-8") as f:
            json.dump(games, f, ensure_ascii=False, indent=2)

        browser.close()

    print(f"\nDone! Scraped {scraped} games.")


if __name__ == "__main__":
    main()
