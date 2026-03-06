#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
APPID="${APPID:-opena305a89b2d79}"
SECRET="${SECRET:-63899898099e42c3b5bfef8d9325e008}"
GROUP_ID="${GROUP_ID:-999999999}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed."
  exit 1
fi

TMP_BODY_FILE="$(mktemp)"
trap 'rm -f "$TMP_BODY_FILE"' EXIT

AUTHORIZATION=""

print_result() {
  local name="$1"
  local expected="$2"
  local status="$3"

  echo "[$name] expected=$expected actual=$status"
  if [[ -s "$TMP_BODY_FILE" ]]; then
    jq '{success, message, error, data}' "$TMP_BODY_FILE" 2>/dev/null || cat "$TMP_BODY_FILE"
  else
    echo "(empty body)"
  fi
  echo
}

run_case() {
  local name="$1"
  local expected="$2"
  shift 2

  local status
  status=$(curl -sS -o "$TMP_BODY_FILE" -w "%{http_code}" "$@")
  print_result "$name" "$expected" "$status"
}

echo "== Negative E2E (Proxy + Uplink failures) =="
echo "BASE_URL=$BASE_URL"
echo

run_case \
  "Missing login credentials" \
  "400" \
  -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{}'

if [[ -n "$APPID" && -n "$SECRET" ]]; then
  echo "Using provided APPID/SECRET to acquire a valid token for token-related negative tests..."

  LOGIN_STATUS=$(curl -sS -o "$TMP_BODY_FILE" -w "%{http_code}" \
    -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"appid\":\"$APPID\",\"secret\":\"$SECRET\"}")

  AUTHORIZATION=$(jq -r '.data.authorization // empty' "$TMP_BODY_FILE")

  echo "[Acquire valid login] status=$LOGIN_STATUS hasAuthorization=$([[ -n "$AUTHORIZATION" ]] && echo true || echo false)"
  if [[ -s "$TMP_BODY_FILE" ]]; then
    jq '{success, message, error}' "$TMP_BODY_FILE" 2>/dev/null || cat "$TMP_BODY_FILE"
  fi
  echo
else
  echo "APPID/SECRET not provided; token-dependent cases will be skipped."
  echo "Tip: APPID=... SECRET=... bash scripts/e2e-negative.sh"
  echo
fi

run_case \
  "Wrong secret (uplink login reject)" \
  "401" \
  -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"appid\":\"${APPID:-invalid-appid}\",\"secret\":\"wrong-secret\"}"

run_case \
  "Malformed bearer header" \
  "401" \
  -X GET "$BASE_URL/network_group" \
  -H "Authorization: Bearer"

run_case \
  "Missing bearer header" \
  "401" \
  -X GET "$BASE_URL/network_group"

run_case \
  "Voucher status missing groupId" \
  "400" \
  -X GET "$BASE_URL/vouchers/status" \
  -H "Authorization: Bearer appid::token"

if [[ -n "$AUTHORIZATION" ]]; then
  TAMPERED_AUTH="${AUTHORIZATION}tampered"

  run_case \
    "Tampered composite token" \
    "401" \
    -X GET "$BASE_URL/network_group" \
    -H "Authorization: $TAMPERED_AUTH"

  run_case \
    "Non-existent groupId to uplink voucher status" \
    "409 (USERGROUP_NOT_SYNCED) or 200" \
    -X GET "$BASE_URL/vouchers/status?groupId=$GROUP_ID" \
    -H "Authorization: $AUTHORIZATION"
fi

echo "== Typical uplink-side errors you may see =="
echo "- Login failed (invalid appid/secret): usually message='Login failed', status=401"
echo "- Upstream unsynced group (voucherData.code=1014): status=409, code=USERGROUP_NOT_SYNCED"
echo "- Other upstream rejects params/group: often status=502 with error.details from uplink"
echo "- Upstream timeout/network issue: status=500/502 with message from axios/upstream"
echo "- Session/token mismatch after login: status=401 (invalid or expired composite token)"
