#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-}"
build_one() {
  local env_name="$1"
  echo "======== build ${env_name} ========"
  # Next 会自动读 .env.production；多环境构建时用临时隔离，避免串环境
  local bak=""
  if [[ -f "${ROOT}/.env.production" ]]; then
    bak="${ROOT}/.env.production.__bak_corp_build__"
    mv "${ROOT}/.env.production" "${bak}"
  fi
  # 确保根目录没有 .env.local（会污染任意 build）
  if [[ -f "${ROOT}/.env.local" ]]; then
    echo "拒绝构建：请将 .env.local 移到 config/corp-env/ 后再构建" >&2
    [[ -n "${bak}" ]] && mv "${bak}" "${ROOT}/.env.production"
    exit 1
  fi
  set +e
  "${ROOT}/scripts/corp-with-env.sh" "${env_name}" bash -c '
    export NEXT_DIST_DIR=".next-${CORP_ENV}"
    npm run build
  '
  local rc=$?
  set -e
  if [[ -n "${bak}" ]]; then
    mv "${bak}" "${ROOT}/.env.production"
  fi
  return "${rc}"
}
case "${TARGET}" in
  local|dev|test|prod) build_one "${TARGET}" ;;
  all)
    for e in local dev test prod; do build_one "${e}" || exit 1; done
    ;;
  *) echo "用法: $0 <local|dev|test|prod|all>" >&2; exit 1 ;;
esac
