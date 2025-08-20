#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/push_release.sh "<GITHUB_PAT>" "v0.8.7" "main"
# or set env GITHUB_TOKEN and run:
#   GITHUB_TOKEN=... ./scripts/push_release.sh "" "v0.8.7" "main"

TOKEN=${1:-""}
TAG=${2:-"v0.8.7"}
BRANCH=${3:-"main"}

if [ -z "${TOKEN}" ] && [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[ERROR] Provide GitHub token as arg1 or env GITHUB_TOKEN" >&2
  exit 1
fi
TOKEN=${TOKEN:-${GITHUB_TOKEN}}

# Ensure we're at repo root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Basic git identity (no-op if already set)
if ! git config user.name >/dev/null; then git config user.name "angstremoff"; fi
if ! git config user.email >/dev/null; then git config user.email "you@example.com"; fi

# Commit changes if any
if [ -n "$(git status -s)" ]; then
  git add -A
  git commit -m "chore: 0.8.7 — стабильная пагинация, expo-image, комментарии"
else
  echo "[Info] No changes to commit"
fi

# Create tag if not exists
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  git tag -a "$TAG" -m "Версия 0.8.7: стабильная пагинация, expo-image, комментарии"
else
  echo "[Info] Tag $TAG already exists"
fi

# Temporarily set remote with token (do not log token)
ORIGIN_URL="$(git remote get-url origin)"
TOKEN_URL="https://${TOKEN}@github.com/angstremoff/domgomobile.git"

git remote set-url origin "$TOKEN_URL"
trap 'git remote set-url origin "$ORIGIN_URL"' EXIT

# Push branch and tag
git push origin "$BRANCH"
# If tag push fails due to already exists, ignore error
(git push origin "$TAG") || true

echo "\n[OK] Pushed $BRANCH and $TAG to origin"
