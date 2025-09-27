from typing import Generator, Optional
 codex/create-backend-for-civil-oversight-platform

from typing import Generator
CODEXX

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
 codex/create-backend-for-civil-oversight-platform
from redis import Redis

 CODEXX
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import ALGORITHM
from app.db.session import get_db
from app.models.user import User, UserRole, VolunteerStatus

codex/create-backend-for-civil-oversight-platform
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/verify-2fa")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
CODEXX


def get_db_session() -> Generator:
    yield from get_db()


codex/create-backend-for-civil-oversight-platform
def get_redis() -> Generator[Redis, None, None]:
    settings = get_settings()
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        yield client
    finally:
        client.close()



CODEXX
def get_current_user(db: Session = Depends(get_db_session), token: str = Depends(oauth2_scheme)) -> User:
    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).get(int(user_id))
    if user is None:
        raise credentials_exception
    if user.role == UserRole.volunteer and user.volunteer_status != VolunteerStatus.approved:
codex/create-backend-for-civil-oversight-platform
        raise HTTPException(status_code=403, detail="Волонтер ожидает подтверждения")

        raise HTTPException(status_code=403, detail="Volunteer pending approval")
CODEXX
    return user


def require_role(role: UserRole):
    def _wrapper(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.can_access_role(role):
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user

    return _wrapper


def get_optional_user(db: Session = Depends(get_db_session), token: str = Depends(oauth2_scheme)) -> Optional[User]:
    try:
        return get_current_user(db=db, token=token)
    except HTTPException:
        return None
