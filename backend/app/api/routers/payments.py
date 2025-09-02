from fastapi import APIRouter
# Pagos se generan al cerrar préstamo; endpoint opcional para listar
from app.db.memory import db

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("")
def list_payments():
    return db["payments"]
