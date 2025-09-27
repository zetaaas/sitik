 codex/create-backend-for-civil-oversight-platform
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginChallenge(BaseModel):
    challenge_id: str
    expires_in: int
    masked_phone: str


class Verify2FARequest(BaseModel):
    challenge_id: str
    code: str

from pydantic import BaseModel
 CODEXX


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
