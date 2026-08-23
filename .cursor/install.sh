#!/usr/bin/env bash
#
# Idempotent environment bootstrap for the 18cricket platform.
#
# Prepares:
#   - MongoDB server (system package) if not already present
#   - Python backend virtualenv + dependencies (backend/.venv)
#   - Expo/React Native frontend dependencies (frontend/node_modules)
#   - MongoDB data / log directories owned by the current user
#
# Safe to run repeatedly: every step checks for existing state first.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONGO_DATA_DIR="/var/lib/mongodb"
MONGO_LOG_DIR="/var/log/mongodb"

log() { echo "[install] $*"; }

# ---------------------------------------------------------------------------
# 1. MongoDB server (only when missing; captured in the environment snapshot)
# ---------------------------------------------------------------------------
if ! command -v mongod >/dev/null 2>&1; then
  log "Installing MongoDB server..."
  if command -v sudo >/dev/null 2>&1; then
    . /etc/os-release
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
      | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${VERSION_CODENAME}/mongodb-org/8.0 multiverse" \
      | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list >/dev/null
    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mongodb-org
  else
    log "WARNING: mongod missing and sudo unavailable; skipping MongoDB install."
  fi
else
  log "MongoDB already installed ($(mongod --version | head -1))."
fi

# ---------------------------------------------------------------------------
# 2. System build tooling for the Python venv (only when missing)
# ---------------------------------------------------------------------------
if ! dpkg -s python3-venv >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1; then
    log "Installing python3-venv / build tooling..."
    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-venv python3-dev build-essential
  fi
fi

# ---------------------------------------------------------------------------
# 3. MongoDB data + log directories
# ---------------------------------------------------------------------------
if command -v sudo >/dev/null 2>&1; then
  sudo mkdir -p "$MONGO_DATA_DIR" "$MONGO_LOG_DIR"
  sudo chown -R "$(id -u):$(id -g)" "$MONGO_DATA_DIR" "$MONGO_LOG_DIR"
else
  mkdir -p "$MONGO_DATA_DIR" "$MONGO_LOG_DIR" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# 4. Backend: Python virtualenv + dependencies
# ---------------------------------------------------------------------------
log "Setting up backend virtualenv..."
cd "$REPO_ROOT/backend"
if [ ! -x ".venv/bin/python" ]; then
  python3 -m venv .venv
fi
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

# ---------------------------------------------------------------------------
# 5. Frontend: Expo / React Native dependencies
# ---------------------------------------------------------------------------
log "Installing frontend dependencies..."
cd "$REPO_ROOT/frontend"
yarn install --frozen-lockfile

log "Install complete."
