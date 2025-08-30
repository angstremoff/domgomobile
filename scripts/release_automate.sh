#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   NOTES="RU: ...\nEN: ..." GITHUB_TOKEN=... ./scripts/release_automate.sh 0.8.8
# or
#   ./scripts/release_automate.sh 0.8.8 <GITHUB_TOKEN>

VERSION=${1:?'version required, e.g. 0.8.8'}
TOKEN=${2:-${GITHUB_TOKEN:-}}
OWNER=angstremoff
REPO=domgomobile
TAG="v${VERSION}"
TITLE="DomGo v${VERSION}"
APK_PATH="releases/domgo.apk"
API="https://api.github.com/repos/$OWNER/$REPO"

if [ -z "$TOKEN" ]; then
  echo "[ERROR] Provide GITHUB_TOKEN env or as arg2" >&2
  exit 1
fi

# 1) Build and prepare APK (also bumps version and pushes tag/branch)
./release-build.sh "$VERSION"

if [ ! -f "$APK_PATH" ]; then
  echo "[ERROR] APK not found at $APK_PATH" >&2
  exit 2
fi

# 2) Try to create release (will fail if tag already has a release)
NOTES_DEFAULT=$'RU: Обновление DomGo.\nEN: DomGo update.'
NOTES_BODY=${NOTES:-$NOTES_DEFAULT}

CREATE_PAYLOAD=$(jq -n --arg tag "$TAG" --arg title "$TITLE" --arg body "$NOTES_BODY" '{tag_name:$tag, target_commitish:"main", name:$title, body:$body, draft:false, prerelease:false}')
CREATE_RESP=$(curl -sS -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $TOKEN" -X POST "$API/releases" -d "$CREATE_PAYLOAD" || true)
UPLOAD_URL=$(echo "$CREATE_RESP" | jq -r '.upload_url // empty' | sed 's/{.*}//')
RELEASE_URL=$(echo "$CREATE_RESP" | jq -r '.html_url // empty')

# 3) If creation failed, fetch existing release by tag
if [ -z "$UPLOAD_URL" ]; then
  GET_RESP=$(curl -sS -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $TOKEN" "$API/releases/tags/$TAG")
  UPLOAD_URL=$(echo "$GET_RESP" | jq -r '.upload_url // empty' | sed 's/{.*}//')
  RELEASE_URL=$(echo "$GET_RESP" | jq -r '.html_url // empty')
  if [ -z "$UPLOAD_URL" ]; then
    echo "$CREATE_RESP" | jq -r '.message // .errors // "Unknown error creating release"' >&2
    exit 3
  fi
fi

# 4) Delete existing asset with same name (domgo.apk) if present
REL=$(curl -sS -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $TOKEN" "$API/releases/tags/$TAG")
EXIST_ID=$(echo "$REL" | jq -r '.assets[]? | select(.name=="domgo.apk") | .id')
if [ -n "${EXIST_ID:-}" ] && [ "$EXIST_ID" != "null" ]; then
  curl -sS -H "Authorization: Bearer $TOKEN" -X DELETE "$API/releases/assets/$EXIST_ID" >/dev/null || true
fi

# 5) Upload stable-named asset
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/vnd.android.package-archive" \
  --data-binary @"$APK_PATH" "$UPLOAD_URL?name=domgo.apk" >/dev/null

echo "[OK] Release: $RELEASE_URL"
echo "[OK] Asset uploaded: domgo.apk"
