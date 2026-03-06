#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
APPID="${APPID:-opena305a89b2d79}"
SECRET="${SECRET:-63899898099e42c3b5bfef8d9325e008}"
GROUP_ID="${GROUP_ID:-}"
LANG="${LANG:-en}"
RUN_TAG="${RUN_TAG:-$(date +%s)}"
PACKAGE_NAME="${PACKAGE_NAME:-2h-e2e-$RUN_TAG}"
PACKAGE_PRICE="${PACKAGE_PRICE:-1000}"
VOUCHER_COUNT="${VOUCHER_COUNT:-3}"
VOUCHER_STATUS="${VOUCHER_STATUS:-1}"
SKIP_VOUCHER_TESTS="${SKIP_VOUCHER_TESTS:-1}"

if [[ -z "$APPID" || -z "$SECRET" ]]; then
  echo "APPID and SECRET are required."
  echo "Example: APPID=opena305a89b2d79 SECRET=xxxxx bash scripts/e2e.sh"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed."
  exit 1
fi

echo "== 1) Login =="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"appid\":\"$APPID\",\"secret\":\"$SECRET\"}")

AUTHORIZATION=$(echo "$LOGIN_RESPONSE" | jq -r '.data.authorization // empty')

if [[ -z "$AUTHORIZATION" ]]; then
  echo "Login failed:"
  echo "$LOGIN_RESPONSE" | jq
  exit 1
fi

echo "Login success"

UPLINK_ACCESS_TOKEN=$(echo "$AUTHORIZATION" | sed -E 's/^Bearer [^:]+:://')
echo "Uplink access token: $UPLINK_ACCESS_TOKEN"

echo "== 2) Resolve network group =="
if [[ -z "$GROUP_ID" ]]; then
  GROUP_LIST_RESPONSE=$(curl -s "$BASE_URL/network_group" \
    -H "Authorization: $AUTHORIZATION")

  GROUP_IDS=$(echo "$GROUP_LIST_RESPONSE" | jq -r '.data[]?.groupId // empty')

  for candidate in $GROUP_IDS; do
    STATUS_RESPONSE=$(curl -s "$BASE_URL/vouchers/status?groupId=$candidate" \
      -H "Authorization: $AUTHORIZATION")

    if [[ "$(echo "$STATUS_RESPONSE" | jq -r '.success // false')" == "true" ]]; then
      GROUP_ID="$candidate"
      break
    fi
  done
fi

if [[ -z "$GROUP_ID" ]]; then
  echo "Unable to resolve synchronized GROUP_ID from /network_group."
  echo "Tip: set GROUP_ID env explicitly to a synchronized group."
  exit 1
fi

echo "Using GROUP_ID=$GROUP_ID"

echo "== 3) Create package(usergroup) =="
CREATE_BODY=$(jq -n \
  --arg name "$PACKAGE_NAME" \
  --arg price "$PACKAGE_PRICE" \
  --argjson groupId "$GROUP_ID" \
  '{
    noOfDevice: 1,
    timePeriod: 0,
    quota: 0,
    uploadRateLimit: 10240,
    downloadRateLimit: 10240,
    durationCtrlType: 0,
    timePeriodTotal: 0,
    timePeriodDaily: 60,
    timePeriodDailyCustom: 60,
    limitedTimes: 0,
    userGroupName: $name,
    price: $price,
    bindMac: 1,
    kickOffType: 1,
    packageType: "COMMON",
    groupId: $groupId,
    name: $name,
    isBindSsid: 0
  }')

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/packages/create" \
  -H "Authorization: $AUTHORIZATION" \
  -H "Content-Type: application/json" \
  -d "$CREATE_BODY")

PACKAGE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')
if [[ -z "$PACKAGE_ID" ]]; then
  echo "Create package failed:"
  echo "$CREATE_RESPONSE" | jq
  exit 1
fi

echo "Created package id=$PACKAGE_ID"

echo "== 4) List packages and capture authProfileId =="
LIST_RESPONSE=$(curl -s "$BASE_URL/packages?groupId=$GROUP_ID" \
  -H "Authorization: $AUTHORIZATION")

PACKAGE_ROW=$(echo "$LIST_RESPONSE" | jq -c --argjson pid "$PACKAGE_ID" '.data[]? | select(.id == $pid)')
AUTH_PROFILE_ID=$(echo "$PACKAGE_ROW" | jq -r '.authProfileId // empty')

if [[ -z "$AUTH_PROFILE_ID" ]]; then
  echo "Could not find authProfileId from package list for id=$PACKAGE_ID"
  echo "$LIST_RESPONSE" | jq
  exit 1
fi

echo "Resolved authProfileId=$AUTH_PROFILE_ID"

echo "== 5) Update package =="
UPDATED_NAME="${UPDATED_NAME:-${PACKAGE_NAME}-upd-${PACKAGE_ID}}"
UPDATE_BODY=$(echo "$PACKAGE_ROW" | jq -c --arg name "$UPDATED_NAME" '
  .name = $name |
  .userGroupName = $name |
  .originGroupName = (.originGroupName // .name) |
  .uuid = (.uuid // .authProfileId)')

UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/packages/$GROUP_ID" \
  -H "Authorization: $AUTHORIZATION" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_BODY")

if [[ "$(echo "$UPDATE_RESPONSE" | jq -r '.data.code // empty')" != "0" ]]; then
  echo "Update package failed:"
  echo "$UPDATE_RESPONSE" | jq
  exit 1
fi

echo "Package updated"

echo "== 6) Create vouchers =="
if [[ "$SKIP_VOUCHER_TESTS" == "1" ]]; then
  echo "Skipping voucher tests (SKIP_VOUCHER_TESTS=1)"
else
  VOUCHER_CREATE_BODY=$(jq -n \
    --argjson groupId "$GROUP_ID" \
    --argjson userGroupId "$PACKAGE_ID" \
    --arg profile "$AUTH_PROFILE_ID" \
    --argjson count "$VOUCHER_COUNT" \
    '{groupId:$groupId,userGroupId:$userGroupId,profile:$profile,count:$count}')

  VOUCHER_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/vouchers/generate" \
    -H "Authorization: $AUTHORIZATION" \
    -H "Content-Type: application/json" \
    -d "$VOUCHER_CREATE_BODY")

  if [[ "$(echo "$VOUCHER_CREATE_RESPONSE" | jq -r '.success // false')" != "true" ]]; then
    echo "Create vouchers failed:"
    echo "$VOUCHER_CREATE_RESPONSE" | jq '{message, details}'
    echo "Tip: update vouchers generate upstream mapping, or run with SKIP_VOUCHER_TESTS=1"
    exit 1
  fi

  echo "$VOUCHER_CREATE_RESPONSE" | jq

  CREATED_DELETE_BODY=$(echo "$VOUCHER_CREATE_RESPONSE" | jq -c '.data.list // [] | map({uuid, voucherCode}) | map(select(.uuid != null and .voucherCode != null))')

  echo "== 7) Get voucher list (status filter) =="
  VOUCHER_LIST=$(curl -s "$BASE_URL/vouchers?groupId=$GROUP_ID&status=$VOUCHER_STATUS&start=0&pageSize=100" \
    -H "Authorization: $AUTHORIZATION")

  if [[ "$(echo "$VOUCHER_LIST" | jq -r '.data | type')" != "array" ]]; then
    echo "Get voucher list failed:"
    echo "$VOUCHER_LIST" | jq '{message, details}'
    exit 1
  fi

  echo "$VOUCHER_LIST" | jq

  echo "== 8) Delete created vouchers =="
  DELETE_BODY="$CREATED_DELETE_BODY"

  if [[ "$(echo "$DELETE_BODY" | jq -r 'length')" -eq 0 ]]; then
    DELETE_BODY=$(echo "$VOUCHER_LIST" | jq -c '.data | map({uuid, voucherCode}) | map(select(.uuid != null and .voucherCode != null)) | .[:100]')
  fi

  DELETE_COUNT=$(echo "$DELETE_BODY" | jq -r 'length')

  if [[ "$DELETE_COUNT" -gt 0 ]]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/vouchers/expired?groupId=$GROUP_ID" \
      -H "Authorization: $AUTHORIZATION" \
      -H "Content-Type: application/json" \
      -d "$DELETE_BODY")

    if [[ "$(echo "$DELETE_RESPONSE" | jq -r '.data.code // empty')" != "0" ]]; then
      echo "Delete expired vouchers failed:"
      echo "$DELETE_RESPONSE" | jq '{message, details, code, msg}'
      exit 1
    fi

    echo "$DELETE_RESPONSE" | jq
  else
    echo "No vouchers available for delete in current filtered list."
  fi
fi

echo "== 9) Delete package =="
DELETE_PACKAGE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/packages/$AUTH_PROFILE_ID?groupId=$GROUP_ID&packageId=$PACKAGE_ID&authProfileId=$AUTH_PROFILE_ID" \
  -H "Authorization: $AUTHORIZATION")

if [[ "$(echo "$DELETE_PACKAGE_RESPONSE" | jq -r '.data.code // empty')" != "0" ]]; then
  echo "Delete package failed:"
  echo "$DELETE_PACKAGE_RESPONSE" | jq
  exit 1
fi

echo "$DELETE_PACKAGE_RESPONSE" | jq
echo "E2E flow completed."
