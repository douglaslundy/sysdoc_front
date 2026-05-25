#!/usr/bin/env bash
# Smoke test for sysvendas_front Next.js app.
# Run from workspace root.
# Usage: bash .claude/skills/run-sysvendas-front/smoke.sh [port]
set -e

PORT=${1:-3000}
BASE="http://localhost:$PORT"

ok()  { echo "  OK  $1"; }
fail(){ echo "FAIL  $1"; exit 1; }

check_page() {
  local label=$1 url=$2 expected_code=${3:-200}
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" -eq "$expected_code" ]; then ok "$label ($code)"; else fail "$label (got $code, expected $expected_code)"; fi
}

check_html() {
  local label=$1 url=$2 pattern=$3
  local body
  body=$(curl -s "$url")
  if echo "$body" | grep -q "$pattern"; then ok "$label"; else fail "$label (pattern '$pattern' not found)"; fi
}

echo "=== sysvendas_front smoke test — $BASE ==="

# 1. Root redirects to /dashboard (302/307)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
[ "$code" -eq 307 ] || [ "$code" -eq 302 ] && ok "/ redirects ($code)" || fail "/ redirect (got $code)"

# 2. Login page renders
check_page "GET /login" "$BASE/login" 200

# 3. Login page has CPF field
check_html "Login has CPF input" "$BASE/login" 'name="cpf"'

# 4. Login page has Next.js data
check_html "Next.js __NEXT_DATA__ present" "$BASE/login" '__NEXT_DATA__'

# 5. Title is correct
check_html "Page title is SysDoc" "$BASE/login" 'SysDoc'

# 6. Static assets load
check_page "Next.js webpack chunk" "$BASE/_next/static/chunks/webpack.js" 200

# 7. /esqueci-senha page exists
check_page "GET /esqueci-senha" "$BASE/esqueci-senha" 200

echo ""
echo "All checks passed."
