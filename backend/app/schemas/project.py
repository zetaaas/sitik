from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.project import ProjectStatus, StageStatus


class GeometryPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]


class ProjectBase(BaseModel):
    title: str
    description: Optional[str]
    geo_point: GeometryPoint


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    status: ProjectStatus
    owner_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class ProjectStageBase(BaseModel):
    title: str
    description: Optional[str]
    is_draft: bool = True


class ProjectStageCreate(ProjectStageBase):
    pass


class ProjectStageResponse(ProjectStageBase):
    id: int
    project_id: int
    status: StageStatus
    created_at: datetime

    class Config:
        orm_mode = True


class ProjectFileResponse(BaseModel):
    id: int
    filename: str
    content_type: str
    minio_key: str
    quarantine: bool
    thumbnail_key: Optional[str]

    class Config:
        orm_mode = True
