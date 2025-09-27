from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class LiveSessionBase(BaseModel):
    title: str
    description: Optional[str]
    scheduled_for: datetime
    conference_id: str


class LiveSessionCreate(LiveSessionBase):
    pass


class LiveSessionResponse(LiveSessionBase):
    id: int
    created_by_id: int

    class Config:
        orm_mode = True


class LiveQuestionCreate(BaseModel):
    session_id: int
    text: str


class LiveQuestionResponse(BaseModel):
    id: int
    session_id: int
    author_id: int
    text: str
    is_approved: bool
    created_at: datetime

    class Config:
        orm_mode = True


class LiveTaskCreate(BaseModel):
    session_id: int
    title: str
    description: Optional[str]
    assignee_id: Optional[int]


class LiveTaskResponse(BaseModel):
    id: int
    session_id: int
    title: str
    description: Optional[str]
    assignee_id: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True
 codex/create-backend-for-civil-oversight-platform


class LiveQuestionModeration(BaseModel):
    reason: Optional[str]
 CODEXX
