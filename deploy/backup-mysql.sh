#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
set -a
. ./.env.production
set +a
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%d-%H%M%S)
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T mysql sh -c 'exec mysqldump --single-transaction --routines --triggers --events -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' | gzip > "$BACKUP_DIR/moviescope-$STAMP.sql.gz"
find "$BACKUP_DIR" -type f -name 'moviescope-*.sql.gz' -mtime +14 -delete
echo "$BACKUP_DIR/moviescope-$STAMP.sql.gz"
