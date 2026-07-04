"""Storage service — local filesystem or S3."""
import os
import uuid
import logging
from pathlib import Path
from typing import BinaryIO

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        if self.backend == "s3":
            import boto3
            self._s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
                endpoint_url=settings.S3_ENDPOINT_URL or None,
            )
            self._bucket = settings.S3_BUCKET_NAME
        else:
            os.makedirs(settings.LOCAL_UPLOAD_PATH, exist_ok=True)

    def save(self, file_obj: BinaryIO, filename: str, content_type: str) -> str:
        """Save file and return storage key/path."""
        unique_name = f"{uuid.uuid4()}_{filename}"
        if self.backend == "s3":
            key = f"resumes/{unique_name}"
            self._s3.upload_fileobj(
                file_obj,
                self._bucket,
                key,
                ExtraArgs={"ContentType": content_type},
            )
            logger.info(f"Uploaded to S3: {key}")
            return key
        else:
            path = Path(settings.LOCAL_UPLOAD_PATH) / unique_name
            with open(path, "wb") as f:
                f.write(file_obj.read())
            logger.info(f"Saved locally: {path}")
            return str(path)

    def get_local_path(self, storage_key: str) -> str:
        """Return absolute local path to file (downloads from S3 if needed)."""
        if self.backend == "s3":
            local_path = f"/tmp/{uuid.uuid4()}_{Path(storage_key).name}"
            self._s3.download_file(self._bucket, storage_key, local_path)
            return local_path
        return storage_key

    def delete(self, storage_key: str) -> None:
        if self.backend == "s3":
            self._s3.delete_object(Bucket=self._bucket, Key=storage_key)
        else:
            try:
                os.remove(storage_key)
            except FileNotFoundError:
                pass

    def get_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Return a URL to access the file."""
        if self.backend == "s3":
            return self._s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": storage_key},
                ExpiresIn=expires_in,
            )
        return f"/uploads/{Path(storage_key).name}"


storage_service = StorageService()
