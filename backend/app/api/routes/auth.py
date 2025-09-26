from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import User, UserRole, VolunteerStatus
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserResponse
from app.services.audit import create_audit_log
from app.utils.iin import encrypt_iin, hash_iin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db_session)) -> User:
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.volunteer,
        volunteer_status=VolunteerStatus.pending,
    )
    if user_in.iin:
        user.iin_hash = hash_iin(user_in.iin)
        encrypted = encrypt_iin(user_in.iin)
        if encrypted:
            user.iin_encrypted = encrypted
    db.add(user)
    db.commit()
    db.refresh(user)
    create_audit_log(db, user.id, "register", "user", None)
    return user


@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db_session)) -> Token:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if user.role == UserRole.volunteer and user.volunteer_status != VolunteerStatus.approved:
        raise HTTPException(status_code=403, detail="Volunteer pending approval")
    access_token = create_access_token(subject=str(user.id))
    create_audit_log(db, user.id, "login", "user", None)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
