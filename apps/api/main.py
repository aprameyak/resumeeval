"""
ResumeScore API — FastAPI application entry point.
Wraps the interviewstreet/hiring-agent evaluation engine with a REST API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os

from app.config import settings
from app.database import engine, Base
from app.routers import auth, resumes, evaluations, reports, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ResumeScore API")
    logger.info(f"Hiring agent path: {settings.HIRING_AGENT_PATH}")
    if not os.path.exists(settings.HIRING_AGENT_PATH):
        logger.warning(
            f"⚠️  Hiring agent not found at {settings.HIRING_AGENT_PATH}. "
            "Run: git clone https://github.com/interviewstreet/hiring-agent ./hiring-agent"
        )
    # Create upload directory
    os.makedirs(settings.LOCAL_UPLOAD_PATH, exist_ok=True)
    yield
    # Shutdown
    logger.info("Shutting down ResumeScore API")


app = FastAPI(
    title="ResumeScore API",
    description="Resume evaluation engine powered by interviewstreet/hiring-agent",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
app.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
