"""Resume storage model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class ResumeStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(512), nullable=False)            # stored filename (uuid-based)
    original_filename = Column(String(512), nullable=False)   # original user filename
    file_path = Column(Text, nullable=False)                   # local path or S3 key
    file_size = Column(Integer, nullable=False)                # bytes
    content_type = Column(String(100), nullable=False, default="application/pdf")
    status = Column(Enum(ResumeStatus), default=ResumeStatus.PENDING, nullable=False)
    parsed_data = Column(JSONB, nullable=True)                 # JSONResume parsed output
    error_message = Column(Text, nullable=True)
    task_id = Column(String(255), nullable=True)              # Celery task ID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="resumes")
    evaluations = relationship("Evaluation", back_populates="resume", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="resume", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Resume id={self.id} file={self.original_filename} status={self.status}>"
