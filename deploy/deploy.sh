#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -f .env.production ]; then
  echo "Missing .env.production. Copy .env.production.example and fill it first."
  exit 1
fi
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --remove-orphans
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl --fail --retry 12 --retry-all-errors --retry-delay 5 http://127.0.0.1:8080/api/v1/health
echo "MovieScope deployment is healthy."
