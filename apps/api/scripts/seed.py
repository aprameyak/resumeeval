#!/usr/bin/env python3
"""Seed script — creates a demo user for local development."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "demo@resumescore.app").first()
        if existing:
            print("Demo user already exists:", existing.email)
            return

        user = User(
            email="demo@resumescore.app",
            hashed_password=hash_password("demo12345"),
            full_name="Demo User",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        print("Created demo user:")
        print("  Email:    demo@resumescore.app")
        print("  Password: demo12345")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
