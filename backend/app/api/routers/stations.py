from fastapi import APIRouter
from app.schemas.stations import StationCreate, Station
from app.repositories import stations_repo, transports_repo

router = APIRouter(prefix="/stations", tags=["stations"])

@router.post("", response_model=Station)
def create_station(payload: StationCreate):
    return stations_repo.create_station(payload.model_dump())

@router.get("", response_model=list[Station])
def list_stations():
    return stations_repo.list_stations()

@router.get("/{station_id}/availability")
def availability(station_id: int):
    return {"station_id": station_id, "transports": transports_repo.list_by_station(station_id)}
