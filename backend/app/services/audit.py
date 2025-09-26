from typing import Optional

from sqlalchemy.orm import Session

from app.models.analytics import AuditLog


def create_audit_log(db: Session, user_id: Optional[int], action: str, entity: str, payload: Optional[str] = None) -> AuditLog:
    log = AuditLog(user_id=user_id, action=action, entity=entity, payload=payload)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
