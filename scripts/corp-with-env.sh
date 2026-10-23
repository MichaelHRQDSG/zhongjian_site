#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="${1:-}"
shift || true
if [[ -z "${ENV_NAME}" || $# -lt 1 ]]; then
  echo "用法: $0 <local|dev|test|prod> <command> [args...]" >&2
  exit 1
fi
# shellcheck disable=SC1091
source "${ROOT}/scripts/corp-load-env.sh" "${ENV_NAME}"
cd "${ROOT}"
exec "$@"
