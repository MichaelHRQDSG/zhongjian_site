#!/usr/bin/env bash
# 前台启动某一环境（不改现网 systemd，除非另行获准切换）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="${1:-}"
case "${ENV_NAME}" in
  local|dev|test|prod) ;;
  *) echo "用法: $0 <local|dev|test|prod>" >&2; exit 1 ;;
esac
# shellcheck disable=SC1091
source "${ROOT}/scripts/corp-load-env.sh" "${ENV_NAME}"
cd "${ROOT}"
HOST_BIND="${HOSTNAME:-127.0.0.1}"
PORT_BIND="${PORT:?PORT 未在 .env.${ENV_NAME} 中设置}"
DIST_DIR="${NEXT_DIST_DIR:-.next-${CORP_ENV}}"
if [[ ! -d "${ROOT}/${DIST_DIR}" ]]; then
  echo "缺少构建产物 ${DIST_DIR}，请先: ./scripts/corp-build.sh ${ENV_NAME}" >&2
  exit 1
fi
NODE_BIN="${NODE_BIN:-/data/mini_program/runtime/node/bin/node}"
[[ -x "${NODE_BIN}" ]] || NODE_BIN="$(command -v node)"
exec "${NODE_BIN}" "${ROOT}/node_modules/next/dist/bin/next" start -H "${HOST_BIND}" -p "${PORT_BIND}"
