from pydantic import BaseModel

class Payment(BaseModel):
    id: int
    loan_id: int
    amount: float
    method: str  # EFECTIVO | (futuro: TARJETA, BILLETERA)
