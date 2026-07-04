"""Resume upload and management service."""
import uuid
import logging
from pathlib import Path
from typing import Optional, BinaryIO
from sqlalchemy.orm import Session

from app.models.resume import Resume, ResumeStatus
from app.services.storage_service import storage_service
from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


def validate_resume_file(filename: str, content_type: str, size: int) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '{ext}' not allowed. Use PDF or DOCX.")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Content type '{content_type}' not allowed.")
    if size > settings.max_upload_bytes:
        raise ValueError(f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB.")


def create_resume(
    db: Session,
    user_id: uuid.UUID,
    file_obj: BinaryIO,
    filename: str,
    content_type: str,
    size: int,
) -> Resume:
    validate_resume_file(filename, content_type, size)
    file_obj.seek(0)
    storage_key = storage_service.save(file_obj, filename, content_type)

    resume = Resume(
        user_id=user_id,
        filename=Path(storage_key).name,
        original_filename=filename,
        file_path=storage_key,
        file_size=size,
        content_type=content_type,
        status=ResumeStatus.PENDING,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    logger.info(f"Created resume {resume.id} for user {user_id}")
    return resume


def get_resume(db: Session, resume_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Resume]:
    return (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == user_id)
        .first()
    )


def list_resumes(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> tuple[list[Resume], int]:
    q = db.query(Resume).filter(Resume.user_id == user_id)
    total = q.count()
    resumes = q.order_by(Resume.created_at.desc()).offset(skip).limit(limit).all()
    return resumes, total


def delete_resume(db: Session, resume_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    resume = get_resume(db, resume_id, user_id)
    if not resume:
        return False
    try:
        storage_service.delete(resume.file_path)
    except Exception as e:
        logger.warning(f"Could not delete file {resume.file_path}: {e}")
    db.delete(resume)
    db.commit()
    return True
