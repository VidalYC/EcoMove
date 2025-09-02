from typing import List, Optional
from app.db.memory import db, next_id

def create_station(data: dict) -> dict:
    data["id"] = next_id("stations")
    db["stations"].append(data)
    return data

def list_stations() -> List[dict]:
    return db["stations"]

def get_station(station_id: int) -> Optional[dict]:
    return next((s for s in db["stations"] if s["id"] == station_id), None)
