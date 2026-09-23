# ─────────────────────────────────────────────────────────────────────────────
# OPC Genie — Backend Dockerfile
# Python 3.12, FastAPI, Uvicorn
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim AS base

# System dependencies required for psycopg2-binary and bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer-cached until requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Run Alembic migrations then start Uvicorn.
# Using shell form so $PORT can be overridden by env.
# --timeout-keep-alive 120  keeps idle connections alive for 2 min so the
# browser's fetch doesn't see ECONNRESET while waiting for a slow Claude call.
# --timeout-graceful-shutdown 10  lets in-flight requests finish on SIGTERM.
CMD alembic upgrade head && \
    uvicorn app.main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --workers 2 \
        --timeout-keep-alive 120 \
        --timeout-graceful-shutdown 10
