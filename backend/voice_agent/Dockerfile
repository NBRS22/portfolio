# syntax=docker/dockerfile:1

# --- Build stage: resolve and install dependencies with uv ---------------------------------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Dependencies first, so this layer is cached until pyproject.toml or uv.lock changes.
# No RUN --mount: Cloud Build's docker builder does not always run with BuildKit.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project --no-cache

COPY README.md ./
COPY src ./src
RUN uv sync --frozen --no-dev --no-editable --no-cache

# --- Runtime stage: only the virtual environment, run as a non-root user ------------------
FROM python:3.12-slim-bookworm

RUN groupadd --system app && useradd --system --gid app --no-create-home app

COPY --from=builder --chown=app:app /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8080

WORKDIR /app
USER app
EXPOSE 8080

# Settings (PORT, HOST, AGENT, limits) are read from the environment by voice_backend.
CMD ["python", "-m", "voice_backend"]
