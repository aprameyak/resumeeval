"""Resume Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import uuid


class ResumeOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    original_filename: str
    file_size: int
    content_type: str
    status: str
    parsed_data: Optional[Any] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResumeListOut(BaseModel):
    resumes: list[ResumeOut]
    total: int
