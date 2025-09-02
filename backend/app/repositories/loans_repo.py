from typing import List, Optional
from app.db.memory import db, next_id

def create_loan(data: dict) -> dict:
    data["id"] = next_id("loans")
    db["loans"].append(data)
    return data

def get_loan(loan_id: int) -> Optional[dict]:
    return next((l for l in db["loans"] if l["id"] == loan_id), None)

def list_by_user(user_id: int) -> List[dict]:
    return [l for l in db["loans"] if l["user_id"] == user_id]
