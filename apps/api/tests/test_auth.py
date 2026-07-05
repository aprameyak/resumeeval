"""Auth endpoint tests."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


client = TestClient(app)


def test_register():
    resp = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "test@example.com"
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email():
    client.post("/auth/register", json={"email": "dup@example.com", "password": "password123"})
    resp = client.post("/auth/register", json={"email": "dup@example.com", "password": "password123"})
    assert resp.status_code == 400


def test_login():
    client.post("/auth/register", json={"email": "login@example.com", "password": "password123"})
    resp = client.post("/auth/login", json={"email": "login@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password():
    client.post("/auth/register", json={"email": "wp@example.com", "password": "password123"})
    resp = client.post("/auth/login", json={"email": "wp@example.com", "password": "wrongpassword"})
    assert resp.status_code == 401


def test_me():
    reg = client.post("/auth/register", json={"email": "me@example.com", "password": "password123"})
    token = reg.json()["access_token"]
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


def test_me_unauthenticated():
    resp = client.get("/auth/me")
    assert resp.status_code == 403


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
