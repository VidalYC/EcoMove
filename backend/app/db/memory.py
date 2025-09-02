from typing import Dict, List

# In-memory stores (puedes reemplazar por SQLAlchemy luego)
db = {
    "users": [],         # dicts
    "stations": [],      # dicts
    "transports": [],    # dicts
    "loans": [],         # dicts
    "payments": [],      # dicts
}

# Simple autoincrement
counters = {k: 1 for k in db.keys()}

def next_id(table: str) -> int:
    counters[table] += 1
    return counters[table] - 1
