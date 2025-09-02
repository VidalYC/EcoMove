from fastapi import APIRouter
from app.schemas.users import UserCreate, User
from app.repositories import users_repo

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=User)
def create_user(payload: UserCreate):
    data = payload.model_dump()
    data["role"] = "USER"
    user = users_repo.create_user(data)
    return user

@router.get("", response_model=list[User])
def list_users():
    return users_repo.list_users()
