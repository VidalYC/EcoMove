from app.db.memory import db, next_id

def create_payment(loan_id: int, amount: float, method: str = "EFECTIVO") -> dict:
    pay = {"id": next_id("payments"), "loan_id": loan_id, "amount": amount, "method": method}
    db["payments"].append(pay)
    return pay
