from datetime import datetime

from pydantic import BaseModel


class KPIResponse(BaseModel):
    projects: int
    project_stages: int
    live_sessions: int


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity: str
    payload: str | None
    created_at: datetime

    class Config:
        orm_mode = True
