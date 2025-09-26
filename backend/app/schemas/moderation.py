from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.moderation import ModerationStatus, ModerationTarget


class ModerationItemResponse(BaseModel):
    id: int
    target_type: ModerationTarget
    target_id: int
    status: ModerationStatus
    reason: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


class ModerationAction(BaseModel):
    status: ModerationStatus
    reason: Optional[str]
