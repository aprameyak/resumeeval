"""Health check endpoint."""
import os
from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    agent_available = os.path.exists(settings.HIRING_AGENT_PATH)
    return {
        "status": "ok",
        "hiring_agent_available": agent_available,
        "hiring_agent_path": settings.HIRING_AGENT_PATH,
        "storage_backend": settings.STORAGE_BACKEND,
        "model": settings.DEFAULT_MODEL,
    }
