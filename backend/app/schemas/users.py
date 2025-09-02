from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: EmailStr
    document: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str = "USER"  # o "ADMIN"
