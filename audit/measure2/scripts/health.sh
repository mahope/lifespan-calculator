#!/usr/bin/env bash
# Set AUDIT_DIR to a working directory containing repo/ (clone at 0a4c35c) and work/health/ ; Node >= 20 required
# Part D: health of lifespan-calculator @ 0a4c35c. Runs on agent-worker. No secrets printed.
set -u
cd $AUDIT_DIR/repo || exit 1
W=$AUDIT_DIR/work/health
rm -rf "$W"; mkdir -p "$W"
: > "$W/summary.txt"

run() {
  local name=$1; shift
  local s e rc
  s=$(date +%s%3N)
  "$@" > "$W/$name.out" 2> "$W/$name.err"
  rc=$?
  e=$(date +%s%3N)
  printf '%s\trc=%s\tdur_ms=%s\tcmd=%s\n' "$name" "$rc" "$((e - s))" "$*" >> "$W/summary.txt"
}

{
  echo "date: $(date -u +%FT%TZ)"
  echo "node: $(node -v)  npm: $(npm -v)"
  echo "HEAD: $(git rev-parse HEAD)"
  echo "engines.node (package.json): $(node -p 'require("./package.json").engines.node')"
} > "$W/env.txt"

run npm_ci npm ci
run npm_audit_all npm audit
run npm_audit_all_json npm audit --json
run npm_audit_prod npm audit --omit=dev
run npm_audit_prod_json npm audit --omit=dev --json
run npm_outdated npm outdated
run npm_outdated_json npm outdated --json
run lint npm run lint
run test npm test
run build npm run build
run npm_ls_depth0 npm ls --depth=0
run npm_ls_prod_all npm ls --omit=dev --all
echo DONE >> "$W/summary.txt"
