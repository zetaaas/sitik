from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole, VolunteerStatus


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str]
 codex/create-backend-for-civil-oversight-platform
    phone_number: Optional[str]

 CODEXX


class UserCreate(UserBase):
    password: str
codex/create-backend-for-civil-oversight-platform
    password_confirm: str
    phone_number: str

CODEXX
    iin: Optional[str]


class UserUpdateRole(BaseModel):
    role: UserRole
    volunteer_status: VolunteerStatus


class UserResponse(UserBase):
    id: int
    role: UserRole
    volunteer_status: VolunteerStatus
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
