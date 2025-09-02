from pydantic import BaseModel

class StationBase(BaseModel):
    name: str
    location: str

class StationCreate(StationBase):
    pass

class Station(StationBase):
    id: int
