import sys
import os
import logging
import asyncio
from pathlib import Path
from typing import Optional
from functools import partial

logger = logging.getLogger(__name__)


class HiringAgentNotAvailable(Exception):
    """Raised when the hiring-agent repository is not accessible."""
    pass


class HiringAgentAdapter:
    """Thin adapter around the interviewstreet/hiring-agent evaluation engine."""

    def __init__(self, agent_path: str):
        self.agent_path = Path(agent_path).resolve()
        self._available = False
        self._try_setup()

    def _try_setup(self) -> None:
        if not self.agent_path.exists():
            logger.warning(
                f"hiring-agent not found at {self.agent_path}. "
                "Clone https://github.com/interviewstreet/hiring-agent and set HIRING_AGENT_PATH."
            )
            return
        agent_str = str(self.agent_path)
        if agent_str not in sys.path:
            sys.path.insert(0, agent_str)
        if not os.environ.get("HIRING_AGENT_PATH"):
            os.environ["HIRING_AGENT_PATH"] = agent_str
        self._available = True
        logger.info(f"hiring-agent available at {self.agent_path}")

    def is_available(self) -> bool:
        return self._available

    def _require_available(self) -> None:
        if not self._available:
            raise HiringAgentNotAvailable(
                f"hiring-agent not found at {self.agent_path}. "
                "Run: git clone https://github.com/interviewstreet/hiring-agent ./hiring-agent"
            )

    def _run_evaluation_sync(self, pdf_path: str, job_description: Optional[str] = None) -> dict:
        self._require_available()

        try:
            from pdf import PDFHandler  # type: ignore[import]
            from github import fetch_and_display_github_info  # type: ignore[import]
            import evaluator as agent_evaluator  # type: ignore[import]
            from transform import (  # type: ignore[import]
                convert_json_resume_to_text,
                convert_github_data_to_text,
            )
        except ImportError as exc:
            raise HiringAgentNotAvailable(
                f"Could not import hiring-agent modules: {exc}. "
                "Ensure hiring-agent deps are installed: pip install -r hiring-agent/requirements.txt"
            ) from exc

        logger.info(f"[hiring-agent] Parsing PDF: {pdf_path}")

        handler = PDFHandler(pdf_path)
        json_resume = handler.extract_resume()
        if json_resume is None:
            raise ValueError("hiring-agent PDFHandler failed to extract resume data")

        github_data = None
        if json_resume.basics and json_resume.basics.profiles:
            for profile in json_resume.basics.profiles:
                network = getattr(profile, "network", "") or ""
                if "github" in network.lower():
                    username = getattr(profile, "username", None)
                    if username:
                        logger.info(f"[hiring-agent] Fetching GitHub data for: {username}")
                        try:
                            github_data = fetch_and_display_github_info(username)
                        except Exception as gh_exc:
                            logger.warning(f"[hiring-agent] GitHub fetch failed: {gh_exc}")

        resume_text = convert_json_resume_to_text(json_resume)
        github_text = ""
        if github_data:
            try:
                github_text = convert_github_data_to_text(github_data)
            except Exception:
                github_text = str(github_data)

        logger.info("[hiring-agent] Running AI evaluation")
        evaluation = agent_evaluator.evaluate_resume(
            resume_text=resume_text,
            github_text=github_text,
            **({"job_description": job_description} if job_description else {}),
        )

        parsed_dict = {}
        if hasattr(json_resume, "model_dump"):
            parsed_dict = json_resume.model_dump()
        elif hasattr(json_resume, "dict"):
            parsed_dict = json_resume.dict()

        github_dict = {}
        if github_data is not None:
            if hasattr(github_data, "model_dump"):
                github_dict = github_data.model_dump()
            elif hasattr(github_data, "dict"):
                github_dict = github_data.dict()
            elif isinstance(github_data, dict):
                github_dict = github_data

        eval_dict = {}
        if evaluation is not None:
            if hasattr(evaluation, "model_dump"):
                eval_dict = evaluation.model_dump()
            elif hasattr(evaluation, "dict"):
                eval_dict = evaluation.dict()
            elif isinstance(evaluation, dict):
                eval_dict = evaluation

        return {
            "parsed_resume": parsed_dict,
            "github_data": github_dict,
            "evaluation": eval_dict,
        }

    async def evaluate_resume(self, pdf_path: str, job_description: Optional[str] = None) -> dict:
        """Runs the hiring-agent pipeline in a thread pool to avoid blocking the event loop."""
        loop = asyncio.get_event_loop()
        fn = partial(self._run_evaluation_sync, pdf_path, job_description)
        return await loop.run_in_executor(None, fn)

    async def evaluate_job_match(self, pdf_path: str, job_description: str) -> dict:
        """Evaluate resume against a job description."""
        return await self.evaluate_resume(pdf_path, job_description=job_description)
