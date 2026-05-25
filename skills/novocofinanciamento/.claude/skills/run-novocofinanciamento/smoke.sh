#!/usr/bin/env bash
# Smoke test for the novocofinanciamento knowledge skill.
# Run from the skill root: bash .claude/skills/run-novocofinanciamento/smoke.sh
# Exits 0 if all checks pass, 1 if any fail.

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
SKILL_MD="$SKILL_DIR/SKILL.md"
REF_DIR="$SKILL_DIR/references"

PASS=0
FAIL=0

ok()   { echo "  [OK]  $*"; PASS=$((PASS+1)); }
fail() { echo "  [FAIL] $*"; FAIL=$((FAIL+1)); }

echo ""
echo "=== novocofinanciamento skill smoke test ==="
echo "Root: $SKILL_DIR"
echo ""

# ── 1. Core files exist ───────────────────────────────────────────────────────
echo "── 1. Core files"

[ -f "$SKILL_MD" ]          && ok  "SKILL.md present"  || fail "SKILL.md missing"
[ -d "$REF_DIR" ]           && ok  "references/ dir present" || fail "references/ dir missing"

# ── 2. Required reference files ───────────────────────────────────────────────
echo ""
echo "── 2. Reference files"

REQUIRED=(
  "componentes_valores.md"
  "indicadores_grupo_c.md"
  "indicadores_grupo_b_a.md"
  "faq_operacional.md"
  "fontes_pesquisa.md"
)

for f in "${REQUIRED[@]}"; do
  [ -f "$REF_DIR/$f" ] \
    && ok  "$f present ($(wc -l < "$REF_DIR/$f") lines)" \
    || fail "$f MISSING"
done

# ── 3. Cross-reference check: files cited in SKILL.md ─────────────────────────
echo ""
echo "── 3. Cross-references in SKILL.md"

# Extract all references/xxx.md paths from SKILL.md (POSIX grep, no -P)
while IFS= read -r ref; do
  path="$SKILL_DIR/$ref"
  [ -f "$path" ] \
    && ok  "$ref exists" \
    || fail "$ref cited in SKILL.md but FILE NOT FOUND"
done < <(grep -o 'references/[^` ]*\.md' "$SKILL_MD" | sort -u)

# ── 4. Key content checks ─────────────────────────────────────────────────────
echo ""
echo "── 4. Key content"

check_contains() {
  local file="$1" pattern="$2" label="$3"
  grep -qi "$pattern" "$file" \
    && ok  "$label" \
    || fail "$label — pattern '$pattern' not found in $file"
}

check_contains "$SKILL_MD"               "3.493"                 "Portaria 3.493 referenced"
check_contains "$SKILL_MD"               "6.907"                 "Portaria 6.907 referenced"
check_contains "$SKILL_MD"               "IED"                   "IED concept present"
check_contains "$REF_DIR/componentes_valores.md" "18.000"        "eSF Estrato 1 value present"
check_contains "$REF_DIR/componentes_valores.md" "5,95"          "Per capita value present"
check_contains "$REF_DIR/indicadores_grupo_c.md" "C1\|C2\|C3"   "Grupo C indicators present"
check_contains "$REF_DIR/indicadores_grupo_b_a.md" "B1\|B2\|B3" "Grupo B indicators present"
check_contains "$REF_DIR/indicadores_grupo_b_a.md" "A1\|A2"     "Grupo A indicators present"
check_contains "$REF_DIR/faq_operacional.md" "pergunta\|P:"      "FAQ entries present"

# ── 5. Frontmatter validation ─────────────────────────────────────────────────
echo ""
echo "── 5. Frontmatter"

head -1 "$SKILL_MD" | grep -q "^---" \
  && ok  "SKILL.md starts with frontmatter" \
  || fail "SKILL.md missing YAML frontmatter"

grep -q "^name:" "$SKILL_MD" \
  && ok  "name: field present" \
  || fail "name: field missing"

grep -q "^description:" "$SKILL_MD" \
  && ok  "description: field present" \
  || fail "description: field missing"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  echo "SKILL NEEDS REPAIR"
  exit 1
else
  echo "SKILL OK"
  exit 0
fi
