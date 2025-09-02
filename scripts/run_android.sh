#!/usr/bin/env bash
set -euo pipefail

# Config
# Allow override via env var: AVD_NAME="<Your_AVD_Name>"
AVD_NAME="${AVD_NAME:-Pixel_API_30}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Resolve Android SDK path
if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
  SDK_ROOT="$ANDROID_SDK_ROOT"
elif [[ -n "${ANDROID_HOME:-}" ]]; then
  SDK_ROOT="$ANDROID_HOME"
elif [[ -d "$HOME/Library/Android/sdk" ]]; then
  SDK_ROOT="$HOME/Library/Android/sdk"
else
  echo "[ERR] ANDROID_SDK_ROOT not set and default SDK path not found."
  echo "      Please install Android SDK or set ANDROID_SDK_ROOT."
  exit 1
fi

EMULATOR_BIN="$SDK_ROOT/emulator/emulator"
ADB_BIN="$SDK_ROOT/platform-tools/adb"

if [[ ! -x "$ADB_BIN" ]]; then
  echo "[ERR] adb not found at $ADB_BIN"
  exit 1
fi

if [[ ! -x "$EMULATOR_BIN" ]]; then
  echo "[ERR] emulator binary not found at $EMULATOR_BIN"
  exit 1
fi

# Validate AVD availability
AVAILABLE_AVDS=$("$EMULATOR_BIN" -list-avds | tr -d '\r')
if [[ -z "$AVAILABLE_AVDS" ]]; then
  echo "[ERR] No AVDs found on this machine. Please create an AVD in Android Studio (AVD Manager)."
  exit 1
fi

if ! echo "$AVAILABLE_AVDS" | grep -qx "$AVD_NAME"; then
  echo "[ERR] AVD '$AVD_NAME' not found. Available AVDs:"
  echo "$AVAILABLE_AVDS"
  echo "      You can override the AVD name via env: AVD_NAME='<one-from-the-list>'"
  exit 1
fi

# Start ADB server
"$ADB_BIN" start-server >/dev/null 2>&1 || true

# Check if the requested AVD is already running
AVD_RUNNING=$(pgrep -fl "emulator.*-avd[[:space:]]*$AVD_NAME" || true)

if [[ -z "$AVD_RUNNING" ]]; then
  echo "[INFO] Starting emulator: $AVD_NAME"
  mkdir -p "$PROJECT_DIR/logs"
  EMULATOR_LOG="$PROJECT_DIR/logs/emulator.log"
  # Launch emulator and capture logs for debugging
  nohup "$EMULATOR_BIN" -avd "$AVD_NAME" -netdelay none -netspeed full -no-snapshot-save >"$EMULATOR_LOG" 2>&1 &
  echo "[INFO] Emulator logs: $EMULATOR_LOG"
else
  echo "[INFO] Emulator already running: $AVD_NAME"
fi

# Wait for any device to be in 'device' state
printf "[INFO] Waiting for device to be ready"
for i in {1..180}; do
  DEVICES=$("$ADB_BIN" devices | awk 'NR>1 && $2=="device" {print $1}')
  if [[ -n "$DEVICES" ]]; then
    echo -e "\n[INFO] Device(s) ready: $DEVICES"
    break
  fi
  printf "."
  sleep 1
  if [[ $i -eq 180 ]]; then
    echo -e "\n[ERR] Timeout waiting for emulator device"
    [[ -f "$EMULATOR_LOG" ]] && tail -n 50 "$EMULATOR_LOG" || true
    exit 1
  fi
done

# Wait for Android system to finish booting
printf "[INFO] Waiting for Android boot completion"
"$ADB_BIN" wait-for-device || true
for i in {1..180}; do
  BOOTED=$("$ADB_BIN" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  if [[ "$BOOTED" == "1" ]]; then
    echo -e "\n[INFO] Android boot completed"
    break
  fi
  printf "."
  sleep 1
  if [[ $i -eq 180 ]]; then
    echo -e "\n[ERR] Timeout waiting for sys.boot_completed"
    [[ -f "$EMULATOR_LOG" ]] && tail -n 50 "$EMULATOR_LOG" || true
    exit 1
  fi
done

# Build & run app on Android
cd "$PROJECT_DIR"

# Load env if exists
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "[INFO] Running: npm run android"
npm run android
