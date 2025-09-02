from pydantic import BaseModel
from typing import Optional

class LoanCreate(BaseModel):
    user_id: int
    transport_id: int
    origin_station_id: int
    destination_station_id: int
    duration_minutes: int

class Loan(BaseModel):
    id: int
    user_id: int
    transport_id: int
    origin_station_id: int
    destination_station_id: int
    duration_minutes: int
    cost: float
    status: str  # ABIERTO | CERRADO
