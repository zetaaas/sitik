from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from redis import Redis

from app.api.deps import get_current_user, get_db_session, get_redis
from app.core.config import get_settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import User, UserRole, VolunteerStatus
from app.schemas.auth import LoginChallenge, LoginRequest, Token, Verify2FARequest
from app.schemas.user import UserCreate, UserResponse
from app.services.audit import create_audit_log
from app.services.sms import send_sms
from app.services.twofa import TwoFactorService
from app.utils.iin import encrypt_iin, hash_iin

settings = get_settings()


def mask_phone(phone_number: str) -> str:
    if not phone_number:
        return ""
    total_digits = sum(1 for char in phone_number if char.isdigit())
    digits_to_mask = max(total_digits - 2, 0)
    masked = []
    masked_count = 0
    for char in phone_number:
        if char.isdigit() and masked_count < digits_to_mask:
            masked.append("*")
            masked_count += 1
        else:
            masked.append(char)
    return "".join(masked)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db_session)) -> User:
    if user_in.password != user_in.password_confirm:
        raise HTTPException(status_code=400, detail="Пароли не совпадают")

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    phone_exists = (
        db.query(User).filter(User.phone_number == user_in.phone_number).first() if user_in.phone_number else None
    )
    if phone_exists:
        raise HTTPException(status_code=400, detail="Номер телефона уже используется")

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
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


@router.post("/login", response_model=LoginChallenge)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db_session),
    redis: Redis = Depends(get_redis),
) -> LoginChallenge:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный пароль")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    if user.role == UserRole.volunteer and user.volunteer_status != VolunteerStatus.approved:
        raise HTTPException(status_code=403, detail="Волонтер ожидает подтверждения")

    if not user.phone_number:
        raise HTTPException(status_code=400, detail="Для аккаунта не задан номер телефона")

    twofa_service = TwoFactorService(redis, settings.twofa_code_ttl_seconds)
    challenge_id, code = twofa_service.create_challenge(user.id)

    send_sms(user.phone_number, f"Ваш код подтверждения: {code}")
    create_audit_log(db, user.id, "login_challenge", "user", None)

    return LoginChallenge(
        challenge_id=challenge_id,
        expires_in=settings.twofa_code_ttl_seconds,
        masked_phone=mask_phone(user.phone_number),
    )


@router.post("/verify-2fa", response_model=Token)
def verify_twofa(
    payload: Verify2FARequest,
    db: Session = Depends(get_db_session),
    redis: Redis = Depends(get_redis),
) -> Token:
    twofa_service = TwoFactorService(redis, settings.twofa_code_ttl_seconds)
    status_code, user_id = twofa_service.validate_code(payload.challenge_id, payload.code)
    if status_code == "expired":
        raise HTTPException(status_code=400, detail="Код подтверждения истёк")
    if status_code == "invalid":
        raise HTTPException(status_code=400, detail="Неверный код подтверждения")

    if user_id is None:
        raise HTTPException(status_code=400, detail="Пользователь не найден")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    if user.role == UserRole.volunteer and user.volunteer_status != VolunteerStatus.approved:
        raise HTTPException(status_code=403, detail="Волонтер ожидает подтверждения")

    access_token = create_access_token(subject=str(user.id))
    create_audit_log(db, user.id, "login", "user", None)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
