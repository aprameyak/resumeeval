# ResumeScore

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white&style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)
![Redis](https://img.shields.io/badge/Redis-FF4438?logo=redis&logoColor=white&style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=for-the-badge)

## About

**ResumeScore** is a production-quality SaaS application that evaluates resumes using an AI scoring engine powered by Google Gemini. Built with **Next.js 15** on the frontend and **FastAPI** on the backend, it wraps the upstream AI evaluation pipeline in a full-featured platform with dashboards, history, PDF reports, and job-match analysis.

## Features

- Resume upload via drag-and-drop supporting PDF and DOCX formats
- AI evaluation scoring across Open Source (35pts), Self Projects (30pts), Production (25pts), and Technical Skills (10pts) categories
- Dashboard with score overview, radar chart, and category breakdown
- Full evaluation history with expandable details and downloadable PDF reports
- Side-by-side evaluation comparison with score deltas
- Job match mode — evaluate a resume against a specific job description
- Background evaluation processing via Celery workers
- JWT-based authentication with refresh tokens and password reset

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, React, Tailwind CSS, Recharts, Zustand
- **Backend**: Python, FastAPI, Celery, Alembic
- **Database**: PostgreSQL 16, Redis 7
- **AI**: Google Gemini API
- **Infrastructure**: Docker Compose, Turborepo
