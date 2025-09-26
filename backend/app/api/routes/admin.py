from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_role
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdateRole
from app.services.audit import create_audit_log

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role(UserRole.admin))])


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db_session)):
    return db.query(User).all()


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user_role(user_id: int, update: UserUpdateRole, db: Session = Depends(get_db_session)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = update.role
    user.volunteer_status = update.volunteer_status
    db.add(user)
    db.commit()
    db.refresh(user)
    create_audit_log(db, user_id, "update_role", "user", update.json())
    return user
