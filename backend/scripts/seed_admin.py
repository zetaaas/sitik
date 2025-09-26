import os

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User, UserRole, VolunteerStatus


ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@cop.local")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")


def main():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if user:
            print("Admin already exists")
            return
        user = User(
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.admin,
            volunteer_status=VolunteerStatus.approved,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("Admin user created")
    finally:
        db.close()


if __name__ == "__main__":
    main()
