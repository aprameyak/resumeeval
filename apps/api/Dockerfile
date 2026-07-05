FROM python:3.11-slim AS base

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libffi-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clone the hiring-agent evaluation engine into the image at build time.
# This means no volume mount is needed on any hosting platform.
ARG HIRING_AGENT_REPO=https://github.com/interviewstreet/hiring-agent.git
RUN git clone --depth=1 ${HIRING_AGENT_REPO} /app/hiring-agent && \
    pip install --no-cache-dir -r /app/hiring-agent/requirements.txt

# Copy API source
COPY . .

# Create upload dirs
RUN mkdir -p /app/uploads /app/uploads/reports

ENV HIRING_AGENT_PATH=/app/hiring-agent
ENV LOCAL_UPLOAD_PATH=/app/uploads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
