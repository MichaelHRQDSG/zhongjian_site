#!/usr/bin/env bash
# source scripts/corp-load-env.sh <local|dev|test|prod>
# 查找顺序：
#   1) 仓库根 .env.<name>（团队约定名）
#   2) config/corp-env/.env.<name>（服务器推荐：避免 Next 自动加载根目录 .env.local）

set -euo pipefail

_CORP_ENV_NAME="${1:-}"
case "${_CORP_ENV_NAME}" in
  local|dev|test|prod) ;;
  *)
    echo "用法: source scripts/corp-load-env.sh <local|dev|test|prod>" >&2
    return 1 2>/dev/null || exit 1
    ;;
esac

_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
_ENV_FILE=""
for _candidate in \
  "${_ROOT}/.env.${_CORP_ENV_NAME}" \
  "${_ROOT}/config/corp-env/.env.${_CORP_ENV_NAME}"
do
  if [[ -f "${_candidate}" ]]; then
    _ENV_FILE="${_candidate}"
    break
  fi
done

[[ -n "${_ENV_FILE}" ]] || {
  echo "缺少 .env.${_CORP_ENV_NAME}。请: cp .env.example .env.${_CORP_ENV_NAME} 或放到 config/corp-env/" >&2
  return 1 2>/dev/null || exit 1
}

set -a
# shellcheck disable=SC1090
source "${_ENV_FILE}"
set +a

export CORP_ENV="${CORP_ENV:-${_CORP_ENV_NAME}}"
export NEXT_PUBLIC_CORP_ENV="${NEXT_PUBLIC_CORP_ENV:-${CORP_ENV}}"
export NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-${CORP_ENV}}"

if [[ -n "${VITE_API_BASE_URL:-}" ]]; then
  export ASSESSMENT_API_BASE_URL="${ASSESSMENT_API_BASE_URL:-${VITE_API_BASE_URL}}"
  export MINI_API_BASE_URL="${MINI_API_BASE_URL:-${VITE_API_BASE_URL}}"
fi

echo "[corp-env] file=${_ENV_FILE} CORP_ENV=${CORP_ENV} PORT=${PORT:-?} DIST=${NEXT_DIST_DIR} API=${ASSESSMENT_API_BASE_URL:-${VITE_API_BASE_URL:-?}} ORIGIN=${CORP_PUBLIC_ORIGIN:-?}" >&2
