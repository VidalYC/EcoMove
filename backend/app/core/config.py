from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "EcoMove API"
    VERSION: str = "0.1.0"

settings = Settings()
