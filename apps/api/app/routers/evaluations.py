"""Evaluations router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationStatus, JobMatch
from app.models.resume import Resume
from app.schemas.evaluation import (
    EvaluationOut, EvaluationListOut, JobMatchRequest, JobMatchOut,
    CompareRequest, CompareOut, CategoryDiff
)
from app.services.evaluation_service import (
    get_evaluation, get_resume_evaluations, compare_evaluations,
    create_evaluation_record
)
from app.services.resume_service import get_resume
from app.routers.auth import get_current_user_dep

router = APIRouter()


@router.get("", response_model=EvaluationListOut)
def list_evaluations(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    evals = (
        db.query(Evaluation)
        .filter(Evaluation.user_id == current_user.id)
        .order_by(Evaluation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(Evaluation).filter(Evaluation.user_id == current_user.id).count()
    return EvaluationListOut(
        evaluations=[EvaluationOut.from_orm_with_scores(e) for e in evals],
        total=total,
    )


@router.get("/{evaluation_id}", response_model=EvaluationOut)
def get_single_evaluation(
    evaluation_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    evaluation = get_evaluation(db, evaluation_id, current_user.id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return EvaluationOut.from_orm_with_scores(evaluation)


@router.post("/trigger/{resume_id}", response_model=EvaluationOut, status_code=status.HTTP_202_ACCEPTED)
def trigger_evaluation(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Manually trigger a new evaluation for an existing resume."""
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    evaluation = create_evaluation_record(db, resume_id, current_user.id)

    from app.workers.tasks import evaluate_resume_task
    task = evaluate_resume_task.apply_async(
        args=[str(evaluation.id), str(resume_id), str(current_user.id)],
    )
    evaluation.task_id = task.id
    db.commit()

    return EvaluationOut.from_orm_with_scores(evaluation)


@router.post("/compare", response_model=CompareOut)
def compare_two_evaluations(
    body: CompareRequest,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    eval_a = get_evaluation(db, body.evaluation_id_a, current_user.id)
    eval_b = get_evaluation(db, body.evaluation_id_b, current_user.id)
    if not eval_a:
        raise HTTPException(status_code=404, detail="Evaluation A not found")
    if not eval_b:
        raise HTTPException(status_code=404, detail="Evaluation B not found")

    if eval_a.status != EvaluationStatus.COMPLETED or eval_b.status != EvaluationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Both evaluations must be completed")

    diff = compare_evaluations(eval_a, eval_b)

    return CompareOut(
        evaluation_a=EvaluationOut.from_orm_with_scores(eval_a),
        evaluation_b=EvaluationOut.from_orm_with_scores(eval_b),
        total_score_diff=diff["total_score_diff"],
        category_diffs=[CategoryDiff(**d) for d in diff["category_diffs"]],
        new_strengths=diff["new_strengths"],
        regressions=diff["regressions"],
    )


@router.post("/job-match", response_model=JobMatchOut, status_code=status.HTTP_202_ACCEPTED)
def run_job_match(
    body: JobMatchRequest,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Evaluate a resume against a job description."""
    resume = get_resume(db, body.resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Create evaluation with job description context
    evaluation = create_evaluation_record(
        db, body.resume_id, current_user.id, job_description=body.job_description
    )

    # Create job match record
    job_match = JobMatch(
        resume_id=body.resume_id,
        user_id=current_user.id,
        evaluation_id=evaluation.id,
        job_title=body.job_title,
        company=body.company,
        job_description=body.job_description,
    )
    db.add(job_match)
    db.commit()

    # Queue evaluation task
    from app.workers.tasks import evaluate_resume_task
    task = evaluate_resume_task.apply_async(
        args=[str(evaluation.id), str(body.resume_id), str(current_user.id), body.job_description],
    )
    evaluation.task_id = task.id
    db.commit()

    db.refresh(job_match)
    return JobMatchOut(
        id=job_match.id,
        resume_id=job_match.resume_id,
        job_title=job_match.job_title,
        company=job_match.company,
        job_description=job_match.job_description,
        created_at=job_match.created_at,
        evaluation=EvaluationOut.from_orm_with_scores(evaluation),
    )
