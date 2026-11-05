#!/bin/bash
# Serial driver for all Playwright/curl measurements (no Lighthouse; that is already done and capped).
cd "$(dirname "$0")"
source ~/dev/env.sh >/dev/null 2>&1
mkdir -p out logs
for s in headers network shots axe vitals; do
  echo "[$(date -u +%T)] START $s loadavg=$(cut -d' ' -f1-3 /proc/loadavg)" >> logs/driver.log
  node $s.js > logs/$s.log 2>&1
  echo "[$(date -u +%T)] END $s rc=$?" >> logs/driver.log
done
node compress.js > logs/compress.log 2>&1
echo "[$(date -u +%T)] ALLDONE" >> logs/driver.log
