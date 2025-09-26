import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet

from app.core.config import get_settings


def hash_iin(iin: str) -> str:
    settings = get_settings()
    key = settings.iin_hmac_key.encode()
    return hashlib.sha256(key + iin.encode()).hexdigest()


def encrypt_iin(iin: str) -> Optional[str]:
    settings = get_settings()
    if not settings.audit_kms_key:
        return None
    f = Fernet(settings.audit_kms_key.encode())
    return f.encrypt(iin.encode()).decode()


def decrypt_iin(token: str) -> Optional[str]:
    settings = get_settings()
    if not settings.audit_kms_key:
        return None
    f = Fernet(settings.audit_kms_key.encode())
    return f.decrypt(token.encode()).decode()
