#!/bin/bash
# Guarded Lighthouse run. One invocation == one run, counted BEFORE chrome launches. Never retries.
# usage: lh-run.sh <slug> <urlpath> <mobile|desktop> <runno>
# env: BASE (default live site), OUTD (output dir), CAP (max runs per slug+formfactor, default 3)
set -u
SLUG=$1; P=$2; FF=$3; N=$4
BASE=${BASE:-https://levetidsberegner.dk}
OUTD=${OUTD:-$HOME/dev/audit-levetid/measure1/out/lighthouse}
CAP=${CAP:-3}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUTD/raw"
LOG="$OUTD/runs.log"
touch "$LOG"
used=$(grep -c "\] $SLUG $FF " "$LOG" || true)
if [ "$used" -ge "$CAP" ]; then
  echo "REFUSED: $SLUG $FF already has $used runs (cap $CAP)" >&2
  exit 3
fi
URL="$BASE$P"
echo "[$(date -u +%FT%TZ)] $SLUG $FF run$N $URL loadavg=$(cut -d' ' -f1-3 /proc/loadavg)" >> "$LOG"
PRESET=""
[ "$FF" = "desktop" ] && PRESET="--preset=desktop"
OUTF="$OUTD/raw/$SLUG-$FF-$N.json"
CHROME_PATH=/usr/bin/google-chrome "$HERE/node_modules/.bin/lighthouse" "$URL" \
  --output=json --output-path="$OUTF" \
  --chrome-flags="--headless=new --no-sandbox" \
  --blocked-url-patterns='*partner-ads.com*' \
  $PRESET --quiet
rc=$?
echo "   -> exit=$rc loadavg_after=$(cut -d' ' -f1-3 /proc/loadavg)" >> "$LOG"
if [ $rc -eq 0 ] && [ -s "$OUTF" ]; then
  node "$HERE/trim-lhr.js" "$OUTF" "$OUTD/$SLUG-$FF-$N.json" "$(cut -d' ' -f1-3 /proc/loadavg)" >> "$OUTD/summary.csv.rows"
fi
exit $rc
