from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_role
from app.models.moderation import ModerationItem, ModerationStatus, ModerationTarget
from app.models.project import Project, ProjectFile, ProjectStage, ProjectStatus, StageStatus
from app.models.user import UserRole
from app.schemas.moderation import ModerationAction, ModerationItemResponse
from app.services.audit import create_audit_log

router = APIRouter(
    prefix="/moderation",
    tags=["moderation"],
    dependencies=[Depends(require_role(UserRole.moderator))],
)


@router.get("", response_model=list[ModerationItemResponse])
def list_items(db: Session = Depends(get_db_session)):
    return db.query(ModerationItem).filter(ModerationItem.status == ModerationStatus.pending).all()


@router.post("/{item_id}", response_model=ModerationItemResponse)
def moderate_item(item_id: int, action: ModerationAction, db: Session = Depends(get_db_session)):
    item = db.query(ModerationItem).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Moderation item not found")
    if action.status not in {ModerationStatus.approved, ModerationStatus.rejected, ModerationStatus.returned}:
        raise HTTPException(status_code=400, detail="Invalid status")
    item.status = action.status
    item.reason = action.reason
    if item.target_type == ModerationTarget.project:
        project = db.query(Project).get(item.target_id)
        if project:
            if action.status == ModerationStatus.approved:
                project.status = ProjectStatus.approved
            elif action.status == ModerationStatus.rejected:
                project.status = ProjectStatus.rejected
            else:
                project.status = ProjectStatus.pending
            db.add(project)
    elif item.target_type == ModerationTarget.project_stage:
        stage = db.query(ProjectStage).get(item.target_id)
        if stage:
            if action.status == ModerationStatus.approved:
                stage.status = StageStatus.published
                stage.is_draft = False
            elif action.status == ModerationStatus.rejected:
                stage.status = StageStatus.rejected
            else:
                stage.status = StageStatus.pending
            db.add(stage)
    elif item.target_type == ModerationTarget.project_file:
        file = db.query(ProjectFile).get(item.target_id)
        if file and action.status == ModerationStatus.rejected:
            file.quarantine = True
            db.add(file)
    db.add(item)
    db.commit()
    db.refresh(item)
    create_audit_log(db, None, "moderation", f"{item.target_type}:{item.target_id}", action.json())
    return item
