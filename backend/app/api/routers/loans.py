from fastapi import APIRouter, HTTPException
from app.schemas.loans import LoanCreate, Loan
from app.repositories import loans_repo
from app.services.loans_service import open_loan, close_loan

router = APIRouter(prefix="/loans", tags=["loans"])

@router.post("", response_model=Loan)
def create_loan(payload: LoanCreate):
    try:
        return open_loan(**payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{loan_id}/return")
def return_loan(loan_id: int, method: str = "EFECTIVO"):
    try:
        return close_loan(loan_id, method)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}", response_model=list[Loan])
def user_loans(user_id: int):
    return loans_repo.list_by_user(user_id)
