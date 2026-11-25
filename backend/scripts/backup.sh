#!/bin/bash
# Sauvegarde quotidienne : base MySQL + images téléversées + certificats, conservées 14 jours.
# À planifier (crontab -e) : 30 3 * * * /var/www/fidelyz/backend/scripts/backup.sh >> /var/www/fidelyz/backend/logs/backup.log 2>&1
# Copiez aussi régulièrement BACKUP_DIR hors du serveur (ex. rclone vers un stockage objet) : une sauvegarde
# sur la même machine ne protège pas d'une panne du serveur.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fidelyz}"
STAMP=$(date +%Y-%m-%d_%H%M)
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
MYSQL_PWD="$DB_PASSWORD" mysqldump --single-transaction --routines -h "${DB_HOST:-localhost}" -P "${DB_PORT:-3306}" -u "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$STAMP.sql.gz"
tar -czf "$BACKUP_DIR/fichiers_$STAMP.tar.gz" uploads certs .env
find "$BACKUP_DIR" -type f -mtime +14 -delete
echo "$(date -Iseconds) sauvegarde OK : $BACKUP_DIR/*_$STAMP.*"
