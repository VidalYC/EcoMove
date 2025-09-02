from typing import List, Optional
from app.db.memory import db, next_id

def create_transport(data: dict) -> dict:
    data["id"] = next_id("transports")
    db["transports"].append(data)
    return data

def list_by_station(station_id: int) -> List[dict]:
    return [t for t in db["transports"] if t["station_id"] == station_id]

def get_transport(transport_id: int) -> Optional[dict]:
    return next((t for t in db["transports"] if t["id"] == transport_id), None)

def update_transport(transport_id: int, **fields) -> Optional[dict]:
    t = get_transport(transport_id)
    if not t: return None
    t.update(fields)
    return t
