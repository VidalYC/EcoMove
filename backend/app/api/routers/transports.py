from fastapi import APIRouter
from app.schemas.transports import TransportCreate, Transport
from app.repositories import transports_repo

router = APIRouter(prefix="/transports", tags=["transports"])

@router.post("", response_model=Transport)
def create_transport(payload: TransportCreate):
    return transports_repo.create_transport(payload.model_dump())
