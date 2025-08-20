#!/usr/bin/env bash
set -euo pipefail
# Usage:
#   GITHUB_TOKEN=... ./scripts/create_github_release.sh v0.8.7 "DomGo v0.8.7" ./domgo.apk
# or
#   ./scripts/create_github_release.sh v0.8.7 "DomGo v0.8.7" ./domgo.apk <TOKEN>

TAG=${1:?"tag required e.g. v0.8.7"}
TITLE=${2:?"title required e.g. DomGo v0.8.7"}
ASSET_PATH=${3:?"path to apk e.g. ./domgo.apk"}
TOKEN=${4:-${GITHUB_TOKEN:-}}
OWNER=angstremoff
REPO=domgomobile

if [ -z "$TOKEN" ]; then
  echo "[ERROR] Provide GITHUB_TOKEN env or as arg4" >&2
  exit 1
fi

NOTES=$(cat <<'EOF'
RU: 0.8.7 — стабильная пагинация (троттлинг onEndReached, защита от параллельных запросов, восстановление скролла), миграция на expo-image, подробные комментарии в коде.
EN: 0.8.7 — stable pagination (throttled onEndReached, guarded requests, scroll restore), migration to expo-image, detailed code comments.
EOF
)

API="https://api.github.com/repos/$OWNER/$REPO/releases"
CREATE_PAYLOAD=$(jq -n --arg tag "$TAG" --arg title "$TITLE" --arg body "$NOTES" '{tag_name:$tag, target_commitish:"main", name:$title, body:$body, draft:false, prerelease:false}')

RESP=$(curl -sS -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $TOKEN" -X POST "$API" -d "$CREATE_PAYLOAD")
UPLOAD_URL=$(echo "$RESP" | jq -r '.upload_url' | sed 's/{.*}//')
RELEASE_URL=$(echo "$RESP" | jq -r '.html_url')

if [ -z "$UPLOAD_URL" ] || [ "$UPLOAD_URL" = "null" ]; then
  echo "$RESP" | jq -r '.message // "Unknown error"' >&2
  exit 2
fi

ASSET_NAME=$(basename "$ASSET_PATH")
UPLOAD_URL_WITH_NAME="$UPLOAD_URL?name=$ASSET_NAME"

curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/vnd.android.package-archive" --data-binary @"$ASSET_PATH" "$UPLOAD_URL_WITH_NAME" >/dev/null

echo "[OK] Release created: $RELEASE_URL"
echo "[OK] Asset uploaded: $ASSET_NAME"
