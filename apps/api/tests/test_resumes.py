"""Resume upload tests."""
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.database import Base, get_db
from app.config import settings

TEST_DB_URL = "sqlite:///./test_resumes.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db(tmp_path, monkeypatch):
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(settings, "LOCAL_UPLOAD_PATH", str(tmp_path))
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


client = TestClient(app)


def _register_and_token():
    reg = client.post("/auth/register", json={"email": "r@example.com", "password": "password123"})
    return reg.json()["access_token"]


def test_upload_invalid_type():
    token = _register_and_token()
    resp = client.post(
        "/resumes/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


def test_upload_too_large():
    token = _register_and_token()
    big = b"x" * (11 * 1024 * 1024)
    resp = client.post(
        "/resumes/upload",
        files={"file": ("big.pdf", big, "application/pdf")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


def test_list_resumes_empty():
    token = _register_and_token()
    resp = client.get("/resumes", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
