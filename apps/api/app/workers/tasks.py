"""Celery background tasks for resume evaluation."""
import asyncio
import logging
import uuid
from celery import Celery

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "resumescore",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.tasks.evaluate_resume_task": {"queue": "evaluations"},
        "app.workers.tasks.generate_report_task": {"queue": "reports"},
    },
)


@celery_app.task(bind=True, name="app.workers.tasks.evaluate_resume_task", max_retries=2)
def evaluate_resume_task(self, evaluation_id: str, resume_id: str, user_id: str, job_description: str | None = None):
    """
    Background task: run hiring-agent evaluation and store results.
    Retries up to 2 times on transient failures.
    """
    from app.database import SessionLocal
    from app.models.evaluation import Evaluation, EvaluationStatus
    from app.models.resume import Resume, ResumeStatus
    from app.services.hiring_agent_adapter import HiringAgentAdapter
    from app.services.evaluation_service import store_evaluation_result
    from app.services.storage_service import storage_service

    db = SessionLocal()
    try:
        evaluation = db.query(Evaluation).filter(Evaluation.id == uuid.UUID(evaluation_id)).first()
        resume = db.query(Resume).filter(Resume.id == uuid.UUID(resume_id)).first()

        if not evaluation or not resume:
            logger.error(f"Evaluation or resume not found: eval={evaluation_id} resume={resume_id}")
            return

        evaluation.status = EvaluationStatus.PROCESSING
        resume.status = ResumeStatus.PROCESSING
        db.commit()

        # Get local file path (downloads from S3 if needed)
        local_path = storage_service.get_local_path(resume.file_path)

        # Run hiring-agent evaluation (blocking, in this worker process)
        adapter = HiringAgentAdapter(settings.HIRING_AGENT_PATH)
        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                adapter.evaluate_resume(local_path, job_description=job_description)
            )
        finally:
            loop.close()

        # Store parsed resume data
        if result.get("parsed_resume"):
            resume.parsed_data = result["parsed_resume"]
            resume.status = ResumeStatus.COMPLETED

        store_evaluation_result(db, evaluation, result)
        db.commit()
        logger.info(f"Evaluation {evaluation_id} completed successfully")

    except Exception as exc:
        logger.error(f"Evaluation {evaluation_id} failed: {exc}", exc_info=True)
        try:
            if evaluation:
                evaluation.status = EvaluationStatus.FAILED
                evaluation.error_message = str(exc)[:2000]
            if resume:
                resume.status = ResumeStatus.FAILED
                resume.error_message = str(exc)[:2000]
            db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery_app.task(bind=True, name="app.workers.tasks.generate_report_task")
def generate_report_task(self, evaluation_id: str, user_id: str) -> str:
    """Generate a PDF report for an evaluation."""
    from app.database import SessionLocal
    from app.models.evaluation import Evaluation
    from app.services.report_service import generate_pdf_report

    db = SessionLocal()
    try:
        evaluation = db.query(Evaluation).filter(
            Evaluation.id == uuid.UUID(evaluation_id)
        ).first()
        if not evaluation:
            raise ValueError(f"Evaluation {evaluation_id} not found")

        pdf_path = generate_pdf_report(evaluation)
        logger.info(f"Report generated: {pdf_path}")
        return pdf_path
    finally:
        db.close()
