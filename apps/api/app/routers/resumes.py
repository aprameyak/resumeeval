"""Resume upload and management router."""
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeOut, ResumeListOut
from app.schemas.evaluation import EvaluationOut
from app.services.resume_service import create_resume, get_resume, list_resumes, delete_resume
from app.services.evaluation_service import create_evaluation_record, get_resume_evaluations
from app.routers.auth import get_current_user_dep

router = APIRouter()


@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Upload a PDF or DOCX resume. Triggers evaluation automatically."""
    contents = await file.read()
    size = len(contents)
    file_obj = io.BytesIO(contents)

    try:
        resume = create_resume(
            db=db,
            user_id=current_user.id,
            file_obj=file_obj,
            filename=file.filename or "resume.pdf",
            content_type=file.content_type or "application/pdf",
            size=size,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Queue evaluation
    evaluation = create_evaluation_record(db, resume.id, current_user.id)
    from app.workers.tasks import evaluate_resume_task
    task = evaluate_resume_task.apply_async(
        args=[str(evaluation.id), str(resume.id), str(current_user.id)],
        countdown=0,
    )
    resume.task_id = task.id
    evaluation.task_id = task.id
    db.commit()

    return ResumeOut.model_validate(resume)


@router.get("", response_model=ResumeListOut)
def list_user_resumes(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    resumes, total = list_resumes(db, current_user.id, skip=skip, limit=limit)
    return ResumeListOut(resumes=[ResumeOut.model_validate(r) for r in resumes], total=total)


@router.get("/{resume_id}", response_model=ResumeOut)
def get_single_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeOut.model_validate(resume)


@router.get("/{resume_id}/evaluations", response_model=list[EvaluationOut])
def get_resume_evaluation_history(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    evals = get_resume_evaluations(db, resume_id, current_user.id)
    return [EvaluationOut.from_orm_with_scores(e) for e in evals]


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    deleted = delete_resume(db, resume_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume not found")
