import boto3
from botocore.client import Config

from app.core.config import get_settings


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self.client = boto3.client(
            "s3",
            endpoint_url=f"{'https' if self.settings.minio_secure else 'http'}://{self.settings.minio_endpoint}",
            aws_access_key_id=self.settings.minio_access_key,
            aws_secret_access_key=self.settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        buckets = self.client.list_buckets().get("Buckets", [])
        if not any(b["Name"] == self.settings.minio_bucket for b in buckets):
            self.client.create_bucket(Bucket=self.settings.minio_bucket)

    def upload(self, key: str, data: bytes, content_type: str) -> str:
        self.client.put_object(Bucket=self.settings.minio_bucket, Key=key, Body=data, ContentType=content_type)
        return key

    def download(self, key: str) -> bytes:
        obj = self.client.get_object(Bucket=self.settings.minio_bucket, Key=key)
        return obj["Body"].read()

    def presign(self, key: str, expires: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.settings.minio_bucket, "Key": key},
            ExpiresIn=expires,
        )

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.settings.minio_bucket, Key=key)


def get_storage_service() -> StorageService:
    return StorageService()
