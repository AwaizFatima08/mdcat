#!/usr/bin/env bash
#
# backup_mdcat.sh — three-layer backup for MDCAT Prep (copied from Safar's)
#
#   Layer 1: local copy    -> /mnt/storage/project_backups/mdcat_backup/
#   Layer 2: Google Drive  -> https://drive.google.com/drive/folders/1OsJpV9mQ_5pw0OxfwpWzIsjLh6Kw0oEN
#   Layer 3: GitHub        -> https://github.com/AwaizFatima08/mdcat (PUBLIC)
#
# Run:  bash /mnt/storage/projects/mdcat/scripts/backup_mdcat.sh
#
# The rclone remote "gdrive" and the GitHub SSH key are already set up on
# this NAS (shared with Safar). A layer that can't run logs a SKIPPED/ERROR
# line instead of failing silently.
#
# Git layer: commits everything not ignored. The repo is public, so before
# committing it lists any NEW untracked files in the log — and refuses to
# commit if one looks like a secret (keystore, key, credentials, .env).

set -uo pipefail

PROJECT_DIR="/mnt/storage/projects/mdcat"
LOCAL_BACKUP_ROOT="/mnt/storage/project_backups/mdcat_backup"
GDRIVE_REMOTE="gdrive"
GDRIVE_FOLDER_ID="1OsJpV9mQ_5pw0OxfwpWzIsjLh6Kw0oEN"
GIT_REMOTE_URL="git@github.com:AwaizFatima08/mdcat.git"
KEEP_LOCAL_BACKUPS=10
EXCLUDES="$PROJECT_DIR/scripts/backup_exclude.txt"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
LOG_FILE="$PROJECT_DIR/scripts/backup.log"
log(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== Starting MDCAT backup: $TIMESTAMP ==="
[ -d "$PROJECT_DIR" ] || { log "FATAL: $PROJECT_DIR not found"; exit 1; }

# ---- Layer 1: local ----
log "Layer 1: local backup"
mkdir -p "$LOCAL_BACKUP_ROOT"
DEST="$LOCAL_BACKUP_ROOT/mdcat_$TIMESTAMP"
if rsync -a --exclude 'scripts/backup.log' --exclude-from="$EXCLUDES" "$PROJECT_DIR/" "$DEST/"; then
  log "  OK — copied to $DEST"
else
  log "  ERROR — local rsync backup failed"
fi
ls -1dt "$LOCAL_BACKUP_ROOT"/mdcat_*/ 2>/dev/null | tail -n +$((KEEP_LOCAL_BACKUPS + 1)) | while read -r old; do
  log "  pruning old local backup: $old"
  rm -rf "${old:?}"
done

# ---- Layer 2: Google Drive ----
log "Layer 2: Google Drive backup"
if ! command -v rclone >/dev/null 2>&1; then
  log "  SKIPPED — rclone not installed"
elif ! rclone listremotes 2>/dev/null | grep -q "^${GDRIVE_REMOTE}:"; then
  log "  SKIPPED — rclone remote '$GDRIVE_REMOTE' not configured"
elif rclone copy "$PROJECT_DIR" "${GDRIVE_REMOTE}:" \
    --drive-root-folder-id "$GDRIVE_FOLDER_ID" \
    --exclude "scripts/backup.log" --exclude-from "$EXCLUDES" \
    --update --checksum --log-file="$LOG_FILE" --log-level NOTICE; then
  log "  OK — synced to Google Drive folder $GDRIVE_FOLDER_ID"
else
  log "  ERROR — rclone copy to Google Drive failed (see log)"
fi

# ---- Layer 3: GitHub ----
log "Layer 3: Git backup"
cd "$PROJECT_DIR" || exit 1
git remote set-url origin "$GIT_REMOTE_URL" 2>/dev/null || git remote add origin "$GIT_REMOTE_URL"

NEW_FILES="$(git ls-files --others --exclude-standard)"
if [ -n "$NEW_FILES" ]; then
  log "  new files to be committed:"
  echo "$NEW_FILES" | sed 's/^/    /' | tee -a "$LOG_FILE"
fi
if echo "$NEW_FILES" | grep -Eiq '(\.keystore|\.jks|\.pem|\.p12|\.env|credential|secret|api[_-]?key)'; then
  log "  STOPPED — a new file looks like a secret and the repo is public. Move it to .secrets/ (gitignored) and run again."
  log "=== Backup finished with git layer stopped: $TIMESTAMP ==="
  exit 2
fi

git add -A
if git diff --cached --quiet; then
  log "  no changes to commit"
else
  git commit -q -m "Backup: $TIMESTAMP"
  log "  committed changes"
fi
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
if git push -u origin "$BRANCH" >>"$LOG_FILE" 2>&1; then
  log "  OK — pushed to $GIT_REMOTE_URL ($BRANCH)"
else
  log "  ERROR — git push failed (see log)"
fi

log "=== Backup finished: $TIMESTAMP ==="
echo "Full log: $LOG_FILE"
