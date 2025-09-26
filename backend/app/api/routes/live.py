from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_role
from app.models.live import LiveQuestion, LiveSession, LiveTask
from app.models.moderation import ModerationItem, ModerationTarget
from app.models.user import User, UserRole
from app.schemas.live import (
    LiveQuestionCreate,
    LiveQuestionResponse,
    LiveSessionCreate,
    LiveSessionResponse,
    LiveTaskCreate,
    LiveTaskResponse,
)
from app.services.audit import create_audit_log

router = APIRouter(prefix="/live", tags=["live"])


@router.post("/sessions", response_model=LiveSessionResponse)
def create_session(
    session_in: LiveSessionCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.moderator)),
):
    session = LiveSession(
        title=session_in.title,
        description=session_in.description,
        scheduled_for=session_in.scheduled_for,
        conference_id=session_in.conference_id,
        created_by_id=current_user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    create_audit_log(db, current_user.id, "create", f"live_session:{session.id}", None)
    return session


@router.get("/sessions", response_model=list[LiveSessionResponse])
def list_sessions(db: Session = Depends(get_db_session)):
    return db.query(LiveSession).all()


@router.post("/questions", response_model=LiveQuestionResponse)
def ask_question(
    question_in: LiveQuestionCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.volunteer)),
):
    session = db.query(LiveSession).get(question_in.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    question = LiveQuestion(
        session_id=question_in.session_id,
        author_id=current_user.id,
        text=question_in.text,
        is_approved=False,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    moderation = ModerationItem(target_type=ModerationTarget.live_question, target_id=question.id)
    db.add(moderation)
    db.commit()
    create_audit_log(db, current_user.id, "ask_question", f"live_question:{question.id}", None)
    return question


@router.post("/questions/{question_id}/approve", response_model=LiveQuestionResponse)
def approve_question(
    question_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.moderator)),
):
    question = db.query(LiveQuestion).get(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.is_approved = True
    db.add(question)
    db.commit()
    db.refresh(question)
    create_audit_log(db, current_user.id, "approve_question", f"live_question:{question.id}", None)
    return question


@router.post("/tasks", response_model=LiveTaskResponse)
def create_task(
    task_in: LiveTaskCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.moderator)),
):
    session = db.query(LiveSession).get(task_in.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    task = LiveTask(
        session_id=task_in.session_id,
        title=task_in.title,
        description=task_in.description,
        assignee_id=task_in.assignee_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    create_audit_log(db, current_user.id, "create_task", f"live_task:{task.id}", None)
    return task
