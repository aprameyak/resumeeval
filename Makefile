.PHONY: setup dev migrate seed test docker-up docker-down docker-logs clean install-agent

# ─── Setup ────────────────────────────────────────────────────────────────────
setup: install-agent
	@echo "→ Copying .env.example to .env"
	@cp -n .env.example .env || true
	@echo "→ Installing API dependencies"
	cd apps/api && pip install -r requirements.txt
	@echo "→ Installing web dependencies"
	cd apps/web && npm install
	@echo "→ Running migrations"
	$(MAKE) migrate
	@echo "✓ Setup complete! Edit .env with your keys then run: make dev"

install-agent:
	@echo "→ Cloning interviewstreet/hiring-agent evaluation engine"
	@if [ ! -d "./hiring-agent/.git" ]; then \
		git clone https://github.com/interviewstreet/hiring-agent ./hiring-agent; \
	else \
		echo "  hiring-agent already present, pulling latest"; \
		cd ./hiring-agent && git pull; \
	fi
	@echo "→ Installing hiring-agent dependencies into API env"
	cd hiring-agent && pip install -r requirements.txt

# ─── Development ──────────────────────────────────────────────────────────────
dev:
	docker compose -f docker-compose.dev.yml up

dev-api:
	cd apps/api && uvicorn main:app --reload --port 8000

dev-web:
	cd apps/web && npm run dev

dev-worker:
	cd apps/api && celery -A app.workers.tasks worker --loglevel=info

# ─── Database ─────────────────────────────────────────────────────────────────
migrate:
	cd apps/api && alembic upgrade head

migrate-create:
	cd apps/api && alembic revision --autogenerate -m "$(msg)"

migrate-down:
	cd apps/api && alembic downgrade -1

seed:
	cd apps/api && python scripts/seed.py

# ─── Testing ──────────────────────────────────────────────────────────────────
test:
	cd apps/api && pytest tests/ -v
	cd apps/web && npm test

test-api:
	cd apps/api && pytest tests/ -v --tb=short

test-web:
	cd apps/web && npm test

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-build:
	docker compose build

# ─── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Cleaned build artifacts"
