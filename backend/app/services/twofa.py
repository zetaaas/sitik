import hashlib
import json
import secrets
from typing import Optional, Tuple

from redis import Redis


class TwoFactorService:
    """Encapsulates 2FA challenge creation and validation using Redis."""

    KEY_PREFIX = "2fa:challenge:"

    def __init__(self, redis: Redis, ttl_seconds: int = 300) -> None:
        self.redis = redis
        self.ttl_seconds = ttl_seconds

    def _key(self, challenge_id: str) -> str:
        return f"{self.KEY_PREFIX}{challenge_id}"

    @staticmethod
    def _hash_code(code: str) -> str:
        return hashlib.sha256(code.encode("utf-8")).hexdigest()

    def create_challenge(self, user_id: int) -> Tuple[str, str]:
        code = f"{secrets.randbelow(10**6):06d}"
        challenge_id = secrets.token_urlsafe(16)
        payload = {"user_id": user_id, "code_hash": self._hash_code(code)}
        self.redis.setex(self._key(challenge_id), self.ttl_seconds, json.dumps(payload))
        return challenge_id, code

    def validate_code(self, challenge_id: str, code: str) -> Tuple[str, Optional[int]]:
        raw = self.redis.get(self._key(challenge_id))
        if raw is None:
            return "expired", None
        data = json.loads(raw)
        expected_hash = data.get("code_hash")
        if expected_hash != self._hash_code(code):
            return "invalid", None
        self.redis.delete(self._key(challenge_id))
        return "valid", int(data["user_id"])
