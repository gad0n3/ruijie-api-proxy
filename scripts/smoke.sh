#!/usr/bin/env bash
set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-your_token_here}"

echo "Health:"
curl -s "$BASE_URL/health" | cat

echo "\nDocs:"
echo "$BASE_URL/docs"

echo "\nGet projects (requires token):"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/core/projects" | cat
