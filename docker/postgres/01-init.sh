#!/bin/bash
set -e

echo "[Docker Postgres Init] Initializing database '${POSTGRES_DB}'..."

# Apply all migrations in order
for migration in /server-db/migrations/*.sql; do
  echo "[Docker Postgres Init] Applying migration: $(basename "$migration")..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration"
done

# Apply seed SQL if exists
if [ -f /server-db/seed.sql ]; then
  echo "[Docker Postgres Init] Applying base seed data..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /server-db/seed.sql
fi

echo "[Docker Postgres Init] Database initialized successfully!"
