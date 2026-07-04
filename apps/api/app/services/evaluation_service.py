"""Service for creating and managing evaluations."""
import logging
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.evaluation import Evaluation, EvaluationStatus, JobMatch
from app.models.resume import Resume, ResumeStatus
from app.services.storage_service import storage_service
from app.services.hiring_agent_adapter import HiringAgentAdapter
from app.config import settings

logger = logging.getLogger(__name__)

_adapter: Optional[HiringAgentAdapter] = None


def get_adapter() -> HiringAgentAdapter:
    global _adapter
    if _adapter is None:
        _adapter = HiringAgentAdapter(settings.HIRING_AGENT_PATH)
    return _adapter


def create_evaluation_record(db: Session, resume_id: uuid.UUID, user_id: uuid.UUID, job_description: Optional[str] = None) -> Evaluation:
    evaluation = Evaluation(
        resume_id=resume_id,
        user_id=user_id,
        status=EvaluationStatus.PENDING,
        job_description=job_description,
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation


def store_evaluation_result(db: Session, evaluation: Evaluation, result: dict) -> Evaluation:
    """Parse hiring-agent output and persist to database."""
    try:
        eval_data = result.get("evaluation", {})
        github_data = result.get("github_data", {})
        parsed = result.get("parsed_resume", {})

        # Extract candidate name
        basics = parsed.get("basics", {})
        candidate_name = basics.get("name") or eval_data.get("candidate_name")

        scores = eval_data.get("scores", {})
        os_score = scores.get("open_source", {})
        sp_score = scores.get("self_projects", {})
        prod_score = scores.get("production", {})
        ts_score = scores.get("technical_skills", {})

        bonus = eval_data.get("bonus_points", {})
        deductions = eval_data.get("deductions", {})

        open_s = float(os_score.get("score", 0))
        open_m = float(os_score.get("max", 35))
        self_s = float(sp_score.get("score", 0))
        self_m = float(sp_score.get("max", 30))
        prod_s = float(prod_score.get("score", 0))
        prod_m = float(prod_score.get("max", 25))
        tech_s = float(ts_score.get("score", 0))
        tech_m = float(ts_score.get("max", 10))
        bonus_t = float(bonus.get("total", 0))
        deduc_t = float(deductions.get("total", 0))

        total = open_s + self_s + prod_s + tech_s + bonus_t - deduc_t

        evaluation.candidate_name = candidate_name
        evaluation.open_source_score = open_s
        evaluation.open_source_max = open_m
        evaluation.open_source_evidence = os_score.get("evidence")
        evaluation.self_projects_score = self_s
        evaluation.self_projects_max = self_m
        evaluation.self_projects_evidence = sp_score.get("evidence")
        evaluation.production_score = prod_s
        evaluation.production_max = prod_m
        evaluation.production_evidence = prod_score.get("evidence")
        evaluation.technical_skills_score = tech_s
        evaluation.technical_skills_max = tech_m
        evaluation.technical_skills_evidence = ts_score.get("evidence")
        evaluation.bonus_points_total = bonus_t
        evaluation.bonus_points_breakdown = bonus.get("breakdown")
        evaluation.deductions_total = deduc_t
        evaluation.deductions_reasons = deductions.get("reasons")
        evaluation.total_score = total
        evaluation.key_strengths = eval_data.get("key_strengths", [])
        evaluation.areas_for_improvement = eval_data.get("areas_for_improvement", [])
        evaluation.github_data = github_data
        evaluation.raw_result = result
        evaluation.status = EvaluationStatus.COMPLETED

        db.commit()
        db.refresh(evaluation)
        return evaluation

    except Exception as e:
        logger.error(f"Failed to store evaluation result: {e}", exc_info=True)
        evaluation.status = EvaluationStatus.FAILED
        evaluation.error_message = str(e)
        db.commit()
        raise


def get_evaluation(db: Session, evaluation_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Evaluation]:
    return (
        db.query(Evaluation)
        .filter(Evaluation.id == evaluation_id, Evaluation.user_id == user_id)
        .first()
    )


def get_resume_evaluations(db: Session, resume_id: uuid.UUID, user_id: uuid.UUID) -> list[Evaluation]:
    return (
        db.query(Evaluation)
        .filter(Evaluation.resume_id == resume_id, Evaluation.user_id == user_id)
        .order_by(Evaluation.created_at.desc())
        .all()
    )


def compare_evaluations(eval_a: Evaluation, eval_b: Evaluation) -> dict:
    """Compute diff between two evaluations."""
    categories = [
        ("open_source", "Open Source", 35),
        ("self_projects", "Self Projects", 30),
        ("production", "Production", 25),
        ("technical_skills", "Technical Skills", 10),
    ]
    diffs = []
    for key, label, max_val in categories:
        score_a = getattr(eval_a, f"{key}_score") or 0
        score_b = getattr(eval_b, f"{key}_score") or 0
        diffs.append({
            "category": label,
            "score_a": score_a,
            "score_b": score_b,
            "diff": score_b - score_a,
            "max": max_val,
        })

    strengths_a = set(eval_a.key_strengths or [])
    strengths_b = set(eval_b.key_strengths or [])
    new_strengths = list(strengths_b - strengths_a)
    regressions = list(strengths_a - strengths_b)

    return {
        "total_score_diff": (eval_b.total_score or 0) - (eval_a.total_score or 0),
        "category_diffs": diffs,
        "new_strengths": new_strengths,
        "regressions": regressions,
    }
