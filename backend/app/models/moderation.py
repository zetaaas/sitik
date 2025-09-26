from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ModerationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class ModerationTarget(str, Enum):
    project = "project"
    project_stage = "project_stage"
    project_file = "project_file"
    comment = "comment"
    live_question = "live_question"


class ModerationItem(Base):
    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(SQLEnum(ModerationTarget), nullable=False)
    target_id = Column(Integer, nullable=False)
    status = Column(SQLEnum(ModerationStatus), default=ModerationStatus.pending, nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewer_id = Column(Integer, ForeignKey("user.id"), nullable=True)

    reviewer = relationship("User")
