#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Success Card Delivery Platform - Database Backup & Encryption Script
# ==============================================================================
# Backs up the PostgreSQL database and optionally encrypts it with AES-256-CBC.
#
# Environment variables:
#   DATABASE_URL: Full Postgres connection string (default: postgresql://postgres:postgres@localhost:5432/fair)
#   BACKUP_DIR: Directory to store backups (default: ./backups)
#   BACKUP_ENCRYPTION_KEY: Password/Passphrase to encrypt the backup. If set, backup is encrypted.
#   RETENTION_DAYS: Number of days to keep older backup files (default: 14)
# ==============================================================================

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/popote_cards}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-"${SCRIPT_DIR}/../backups"}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RAW_FILE="${BACKUP_DIR}/backup_popote_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${RAW_FILE}.enc"

mkdir -p "${BACKUP_DIR}"

echo "[Backup] Starting PostgreSQL backup for database..."

# Dump and compress database
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "${DATABASE_URL}" | gzip -9 > "${RAW_FILE}"
else
  echo "[Backup] pg_dump not found in PATH. Skipping direct dump."
  exit 1
fi

echo "[Backup] Database dumped successfully to: ${RAW_FILE}"

# Optional Encryption with OpenSSL AES-256-CBC
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "[Backup] Encrypting backup with AES-256-CBC..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in "${RAW_FILE}" \
    -out "${ENCRYPTED_FILE}" \
    -pass "pass:${BACKUP_ENCRYPTION_KEY}"
  
  # Remove plaintext compressed file after encryption
  rm -f "${RAW_FILE}"
  echo "[Backup] Encrypted backup created: ${ENCRYPTED_FILE}"
else
  echo "[Backup] Notice: BACKUP_ENCRYPTION_KEY not set. Storing compressed plaintext backup."
fi

# Rotate backups older than RETENTION_DAYS
echo "[Backup] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "backup_fair_*.sql*" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

echo "[Backup] Done."
