"""Evaluation Pydantic schemas — mirrors hiring-agent output exactly."""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import uuid


class CategoryScoreOut(BaseModel):
    score: float
    max: float
    evidence: Optional[str] = None


class ScoresOut(BaseModel):
    open_source: CategoryScoreOut
    self_projects: CategoryScoreOut
    production: CategoryScoreOut
    technical_skills: CategoryScoreOut


class BonusPointsOut(BaseModel):
    total: float
    breakdown: Optional[str] = None


class DeductionsOut(BaseModel):
    total: float
    reasons: Optional[str] = None


class EvaluationOut(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    candidate_name: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    scores: Optional[ScoresOut] = None
    bonus_points: Optional[BonusPointsOut] = None
    deductions: Optional[DeductionsOut] = None
    total_score: Optional[float] = None
    key_strengths: Optional[list[str]] = None
    areas_for_improvement: Optional[list[str]] = None
    github_data: Optional[Any] = None
    job_description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_scores(cls, eval_obj: Any) -> "EvaluationOut":
        scores = None
        if eval_obj.status == "completed" and eval_obj.open_source_score is not None:
            scores = ScoresOut(
                open_source=CategoryScoreOut(
                    score=eval_obj.open_source_score,
                    max=eval_obj.open_source_max or 35,
                    evidence=eval_obj.open_source_evidence,
                ),
                self_projects=CategoryScoreOut(
                    score=eval_obj.self_projects_score,
                    max=eval_obj.self_projects_max or 30,
                    evidence=eval_obj.self_projects_evidence,
                ),
                production=CategoryScoreOut(
                    score=eval_obj.production_score,
                    max=eval_obj.production_max or 25,
                    evidence=eval_obj.production_evidence,
                ),
                technical_skills=CategoryScoreOut(
                    score=eval_obj.technical_skills_score,
                    max=eval_obj.technical_skills_max or 10,
                    evidence=eval_obj.technical_skills_evidence,
                ),
            )

        bonus = None
        if eval_obj.bonus_points_total is not None:
            bonus = BonusPointsOut(
                total=eval_obj.bonus_points_total,
                breakdown=eval_obj.bonus_points_breakdown,
            )

        deductions = None
        if eval_obj.deductions_total is not None:
            deductions = DeductionsOut(
                total=eval_obj.deductions_total,
                reasons=eval_obj.deductions_reasons,
            )

        return cls(
            id=eval_obj.id,
            resume_id=eval_obj.resume_id,
            candidate_name=eval_obj.candidate_name,
            status=eval_obj.status,
            error_message=eval_obj.error_message,
            scores=scores,
            bonus_points=bonus,
            deductions=deductions,
            total_score=eval_obj.total_score,
            key_strengths=eval_obj.key_strengths or [],
            areas_for_improvement=eval_obj.areas_for_improvement or [],
            github_data=eval_obj.github_data,
            job_description=eval_obj.job_description,
            created_at=eval_obj.created_at,
        )


class EvaluationListOut(BaseModel):
    evaluations: list[EvaluationOut]
    total: int


class JobMatchRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str
    job_title: Optional[str] = None
    company: Optional[str] = None


class JobMatchOut(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_description: str
    match_percentage: Optional[float] = None
    missing_skills: Optional[list[str]] = None
    missing_experience: Optional[list[str]] = None
    keyword_coverage: Optional[float] = None
    recommendations: Optional[list[str]] = None
    evaluation: Optional[EvaluationOut] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompareRequest(BaseModel):
    evaluation_id_a: uuid.UUID
    evaluation_id_b: uuid.UUID


class CategoryDiff(BaseModel):
    category: str
    score_a: float
    score_b: float
    diff: float
    max: float


class CompareOut(BaseModel):
    evaluation_a: EvaluationOut
    evaluation_b: EvaluationOut
    total_score_diff: float
    category_diffs: list[CategoryDiff]
    new_strengths: list[str]
    regressions: list[str]
