#!/bin/bash
set -e

# Run database migrations
alembic upgrade head

# Start the uvicorn server
exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}

