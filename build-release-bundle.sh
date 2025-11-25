#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
OUTPUT_AAB="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
DESKTOP_AAB="$HOME/Desktop/DomGoMobile-$(node -p "require('./package.json').version")-release.aab"

echo "▶️  Сборка Android App Bundle (release)…"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
export NODE_ENV="production"

cd "$ANDROID_DIR"
./gradlew bundleRelease

if [[ -f "$OUTPUT_AAB" ]]; then
  cp "$OUTPUT_AAB" "$DESKTOP_AAB"
  echo "✅ AAB сохранён: $DESKTOP_AAB"
else
  echo "❌ Не удалось найти $OUTPUT_AAB" >&2
  exit 1
fi
