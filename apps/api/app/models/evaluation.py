"""Evaluation and job match models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class EvaluationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Evaluation(Base):
    """
    Stores the full output from the interviewstreet/hiring-agent evaluation engine.
    Mirrors the engine's EvaluationData schema exactly.
    """
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    candidate_name = Column(String(255), nullable=True)
    status = Column(Enum(EvaluationStatus), default=EvaluationStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    task_id = Column(String(255), nullable=True)

    # Category scores — exactly as produced by hiring-agent
    open_source_score = Column(Float, nullable=True)
    open_source_max = Column(Float, default=35, nullable=True)
    open_source_evidence = Column(Text, nullable=True)

    self_projects_score = Column(Float, nullable=True)
    self_projects_max = Column(Float, default=30, nullable=True)
    self_projects_evidence = Column(Text, nullable=True)

    production_score = Column(Float, nullable=True)
    production_max = Column(Float, default=25, nullable=True)
    production_evidence = Column(Text, nullable=True)

    technical_skills_score = Column(Float, nullable=True)
    technical_skills_max = Column(Float, default=10, nullable=True)
    technical_skills_evidence = Column(Text, nullable=True)

    # Bonus / deductions — exactly as produced by hiring-agent
    bonus_points_total = Column(Float, default=0, nullable=True)
    bonus_points_breakdown = Column(Text, nullable=True)
    deductions_total = Column(Float, default=0, nullable=True)
    deductions_reasons = Column(Text, nullable=True)

    # Computed total
    total_score = Column(Float, nullable=True)

    # Qualitative outputs
    key_strengths = Column(JSONB, default=list, nullable=True)          # list[str]
    areas_for_improvement = Column(JSONB, default=list, nullable=True)  # list[str]

    # Full raw JSON from engine (for forward compatibility)
    raw_result = Column(JSONB, nullable=True)

    # GitHub enrichment data
    github_data = Column(JSONB, nullable=True)

    # Job description (if evaluated with JD)
    job_description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    resume = relationship("Resume", back_populates="evaluations")
    user = relationship("User", back_populates="evaluations")

    def __repr__(self) -> str:
        return f"<Evaluation id={self.id} score={self.total_score} status={self.status}>"


class JobMatch(Base):
    """Stores resume-to-job-description match analysis."""
    __tablename__ = "job_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="SET NULL"), nullable=True)

    job_title = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=False)

    # Match results
    match_percentage = Column(Float, nullable=True)
    missing_skills = Column(JSONB, default=list, nullable=True)
    missing_experience = Column(JSONB, default=list, nullable=True)
    keyword_coverage = Column(Float, nullable=True)
    recommendations = Column(JSONB, default=list, nullable=True)

    raw_result = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    resume = relationship("Resume", back_populates="job_matches")

    def __repr__(self) -> str:
        return f"<JobMatch id={self.id} match={self.match_percentage}%>"
