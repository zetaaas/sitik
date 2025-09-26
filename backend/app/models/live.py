from sqlalchemy import Boolean
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class LiveSession(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    scheduled_for = Column(DateTime, nullable=False)
    conference_id = Column(String, nullable=False)
    created_by_id = Column(Integer, ForeignKey("user.id"), nullable=False)

    created_by = relationship("User")
    questions = relationship("LiveQuestion", back_populates="session", cascade="all, delete-orphan")
    tasks = relationship("LiveTask", back_populates="session", cascade="all, delete-orphan")


class LiveQuestion(Base):
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("livesession.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    text = Column(Text, nullable=False)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("LiveSession", back_populates="questions")
    author = relationship("User")


class LiveTask(Base):
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("livesession.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assignee_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("LiveSession", back_populates="tasks")
    assignee = relationship("User")
