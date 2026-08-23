#!/usr/bin/env bash
#
# Per-boot startup for the 18cricket platform.
#
# Starts MongoDB (the shared datastore both API terminals depend on) and waits
# until it accepts connections. Idempotent: if mongod is already listening it
# returns immediately. The FastAPI backend and Expo web server run as separate
# terminals defined in .cursor/environment.json.
set -euo pipefail

MONGO_DATA_DIR="/var/lib/mongodb"
MONGO_LOG_DIR="/var/log/mongodb"
MONGO_PORT=27017

log() { echo "[start] $*"; }

if ! command -v mongod >/dev/null 2>&1; then
  log "ERROR: mongod not found. Run .cursor/install.sh first."
  exit 1
fi

mkdir -p "$MONGO_DATA_DIR" "$MONGO_LOG_DIR" 2>/dev/null || true

# Already up? Nothing to do.
if curl -s -m 2 "http://127.0.0.1:${MONGO_PORT}" >/dev/null 2>&1 \
   || (command -v mongosh >/dev/null 2>&1 \
        && mongosh --quiet --host 127.0.0.1 --port "$MONGO_PORT" --eval 'db.runCommand({ping:1})' >/dev/null 2>&1); then
  log "MongoDB already running on port ${MONGO_PORT}."
  exit 0
fi

# Clean up a stale lock left by an unclean shutdown of a captured snapshot.
if [ -f "$MONGO_DATA_DIR/mongod.lock" ] && ! pgrep -x mongod >/dev/null 2>&1; then
  log "Removing stale mongod.lock..."
  rm -f "$MONGO_DATA_DIR/mongod.lock"
fi

log "Starting MongoDB..."
mongod --dbpath "$MONGO_DATA_DIR" \
       --bind_ip 127.0.0.1 \
       --port "$MONGO_PORT" \
       --logpath "$MONGO_LOG_DIR/mongod.log" \
       --fork

# Wait for readiness (up to ~30s).
for i in $(seq 1 30); do
  if mongosh --quiet --host 127.0.0.1 --port "$MONGO_PORT" --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; then
    log "MongoDB is ready."
    exit 0
  fi
  sleep 1
done

log "ERROR: MongoDB did not become ready in time."
tail -20 "$MONGO_LOG_DIR/mongod.log" || true
exit 1
