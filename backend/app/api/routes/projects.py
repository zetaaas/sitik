from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from geoalchemy2 import WKTElement
from sqlalchemy import func
from sqlalchemy.orm import Session

 codex/create-backend-for-civil-oversight-platform
from app.api.deps import get_db_session, require_role

 CODEXX
from app.models.moderation import ModerationItem, ModerationTarget
from app.models.project import Project, ProjectFile, ProjectStage, ProjectStatus, StageStatus
from app.models.user import User, UserRole
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectStageCreate,
    ProjectStageResponse,
    ProjectFileResponse,
)
from app.services.audit import create_audit_log
from app.services.storage import StorageService
from app.tasks import generate_thumbnail_task, scan_file_task

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    bounds: Optional[str] = Query(None, description="minx,miny,maxx,maxy"),
    db: Session = Depends(get_db_session),
):
    query = db.query(Project).filter(Project.status == ProjectStatus.approved)
    if bounds:
        try:
            minx, miny, maxx, maxy = map(float, bounds.split(","))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bounds")
        envelope = func.ST_MakeEnvelope(minx, miny, maxx, maxy, 4326)
        query = query.filter(func.ST_Within(Project.geo_point, envelope))
    return query.all()

codex/create-backend-for-civil-oversight-platform
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db_session)):
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != ProjectStatus.approved:
        raise HTTPException(status_code=403, detail="Project not approved")
    return project


CODEXX
@router.post("", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.volunteer)),
):
    coordinates = project_in.geo_point.coordinates
    point = WKTElement(f"POINT({coordinates[0]} {coordinates[1]})", srid=4326)
    project = Project(
        title=project_in.title,
        description=project_in.description,
        geo_point=point,
        owner_id=current_user.id,
        status=ProjectStatus.pending,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    moderation = ModerationItem(target_type=ModerationTarget.project, target_id=project.id)
    db.add(moderation)
    db.commit()
    create_audit_log(db, current_user.id, "create", f"project:{project.id}", None)
    return project


@router.post("/{project_id}/stages", response_model=ProjectStageResponse)
def create_stage(
    project_id: int,
    stage_in: ProjectStageCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.volunteer)),
):
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and not current_user.can_access_role(UserRole.moderator):
        raise HTTPException(status_code=403, detail="Forbidden")
    stage = ProjectStage(
        project_id=project_id,
        title=stage_in.title,
        description=stage_in.description,
        is_draft=stage_in.is_draft,
        status=StageStatus.pending,
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    moderation = ModerationItem(target_type=ModerationTarget.project_stage, target_id=stage.id)
    db.add(moderation)
    db.commit()
    create_audit_log(db, current_user.id, "create_stage", f"project_stage:{stage.id}", None)
    return stage


 codex/create-backend-for-civil-oversight-platform
@router.get("/{project_id}/stages", response_model=List[ProjectStageResponse])
def list_project_stages(
    project_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.volunteer)),
):
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    query = db.query(ProjectStage).filter(ProjectStage.project_id == project_id)
    if not current_user.can_access_role(UserRole.moderator) and project.owner_id != current_user.id:
        query = query.filter(ProjectStage.status == StageStatus.published)
    return query.order_by(ProjectStage.created_at.desc()).all()


CODEXX
@router.post("/{project_id}/files", response_model=ProjectFileResponse)
def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.volunteer)),
):
    if file.content_type not in ["application/pdf", "image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    storage = StorageService()
    key = f"projects/{project_id}/{file.filename}"
    storage.upload(key, file.file.read(), file.content_type)
    project_file = ProjectFile(
        project_id=project_id,
        filename=file.filename,
        content_type=file.content_type,
        minio_key=key,
    )
    db.add(project_file)
    db.commit()
    db.refresh(project_file)
    moderation = ModerationItem(target_type=ModerationTarget.project_file, target_id=project_file.id)
    db.add(moderation)
    db.commit()
    scan_file_task.delay(project_file.id)
    if file.content_type in ["image/png", "image/jpeg"]:
        generate_thumbnail_task.delay(project_file.id)
    create_audit_log(db, current_user.id, "upload_file", f"project_file:{project_file.id}", None)
    return project_file
 codex/create-backend-for-civil-oversight-platform


@router.get("/{project_id}/files", response_model=List[ProjectFileResponse])
def list_project_files(
    project_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.volunteer)),
):
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    query = db.query(ProjectFile).filter(ProjectFile.project_id == project_id)
    if not current_user.can_access_role(UserRole.moderator) and project.owner_id != current_user.id:
        query = query.filter(ProjectFile.quarantine.is_(False))
    return query.order_by(ProjectFile.created_at.desc()).all()
 CODEXX
