import io
import os
from typing import Optional

from celery import shared_task
from PIL import Image

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.project import ProjectFile
from app.services.storage import StorageService


@shared_task
def scan_file_task(file_id: int) -> None:
    settings = get_settings()
    db = SessionLocal()
    storage = StorageService()

    try:
        project_file: Optional[ProjectFile] = db.query(ProjectFile).get(file_id)
        if not project_file:
            return
        if settings.clamav_enabled:
            # Here we would integrate with ClamAV. For now we just stub.
            infected = False
        else:
            infected = False
        if infected:
            project_file.quarantine = True
        db.add(project_file)
        db.commit()
    finally:
        db.close()


@shared_task
def generate_thumbnail_task(file_id: int) -> None:
    settings = get_settings()
    db = SessionLocal()
    storage = StorageService()

    try:
        project_file: Optional[ProjectFile] = db.query(ProjectFile).get(file_id)
        if not project_file or project_file.quarantine:
            return
        data = storage.download(project_file.minio_key)
        if project_file.content_type not in ["image/png", "image/jpeg"]:
            return
        image = Image.open(io.BytesIO(data))
        for size in settings.thumbnail_sizes:
            thumb = image.copy()
            thumb.thumbnail((size, size))
            output = io.BytesIO()
            thumb.save(output, format="PNG")
            key = f"thumbnails/{size}/{project_file.minio_key}"
            storage.upload(key, output.getvalue(), "image/png")
            project_file.thumbnail_key = key
        db.add(project_file)
        db.commit()
    finally:
        db.close()
