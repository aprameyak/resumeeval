"""Reports router — PDF report generation."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationStatus
from app.services.report_service import generate_pdf_report
from app.routers.auth import get_current_user_dep

router = APIRouter()


@router.get("/{evaluation_id}/download")
def download_report(
    evaluation_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Generate and download a PDF report for a completed evaluation."""
    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.id == evaluation_id,
            Evaluation.user_id == current_user.id,
            Evaluation.status == EvaluationStatus.COMPLETED,
        )
        .first()
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Completed evaluation not found")

    try:
        pdf_path = generate_pdf_report(evaluation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

    candidate = evaluation.candidate_name or "report"
    filename = f"resumescore_{candidate.replace(' ', '_')}_{evaluation_id}.pdf"

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
