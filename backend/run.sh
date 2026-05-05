#!/usr/bin/env bash
# Start the Stockify backend on http://localhost:8000
cd "$(dirname "$0")"
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
