from pydantic import BaseModel
from enum import Enum

class TransportType(str, Enum):
    BICICLETA = "BICICLETA"
    PATINETA = "PATINETA"

class TransportBase(BaseModel):
    type: TransportType
    status: str = "DISPONIBLE"  # DISPONIBLE | EN_USO | MANTENIMIENTO
    station_id: int

class TransportCreate(TransportBase):
    pass

class Transport(TransportBase):
    id: int
