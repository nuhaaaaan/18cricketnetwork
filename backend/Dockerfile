# Production image for the 18 Cricket Network API (FastAPI + MongoDB).
# Usable with Azure Web App for Containers, Azure Container Apps, or any
# container host. Runtime config comes from environment variables
# (MONGO_URL, DB_NAME, JWT_SECRET, optional EMERGENT_LLM_KEY/OPENAI_API_KEY,
# RAZORPAY_*). Never bake secrets into the image.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Build tools for any packages that need to compile; kept minimal.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Drop any local .env that might have been copied; config must come from env.
RUN rm -f .env

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

# Azure App Service / Container Apps inject $PORT; default to 8000 locally.
CMD ["sh", "-c", "gunicorn -k uvicorn.workers.UvicornWorker server:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 120"]
