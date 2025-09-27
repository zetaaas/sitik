from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class UserRole(str, Enum):
    guest = "guest"
    volunteer = "volunteer"
    moderator = "moderator"
    admin = "admin"


class VolunteerStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    banned = "banned"


class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.volunteer, nullable=False)
    volunteer_status = Column(SQLEnum(VolunteerStatus), default=VolunteerStatus.pending, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    iin_hash = Column(String, nullable=True)
    iin_encrypted = Column(String, nullable=True)

    projects = relationship("Project", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")

    def can_access_role(self, role: "UserRole") -> bool:
        hierarchy = {
            UserRole.guest: 0,
            UserRole.volunteer: 1,
            UserRole.moderator: 2,
            UserRole.admin: 3,
        }
        return hierarchy[self.role] >= hierarchy[role]
