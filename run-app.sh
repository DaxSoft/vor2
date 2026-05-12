#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Starting R2 Explorer..."
pnpm tauri:dev
