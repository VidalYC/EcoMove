from typing import List, Optional
from ..db.memory import db, next_id

def create_user(data: dict) -> dict:
    data["id"] = next_id("users")
    db["users"].append(data)
    return data

def get_user(user_id: int) -> Optional[dict]:
    return next((u for u in db["users"] if u["id"] == user_id), None)

def list_users() -> List[dict]:
    return db["users"]
