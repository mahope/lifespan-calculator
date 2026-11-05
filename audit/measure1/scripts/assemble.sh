#!/bin/bash
# Tidy out/ so only shippable artefacts remain (raw captures move to raw-keep/, which is NOT copied to the PC).
set -e
cd "$(dirname "$0")"
mkdir -p raw-keep out/scripts
[ -d out/screenshots-raw ] && mv out/screenshots-raw raw-keep/screenshots-raw
[ -d out/lighthouse/raw ] && mv out/lighthouse/raw raw-keep/lighthouse-raw
rm -f out/lighthouse/summary.csv.rows out/lighthouse/summary.csv.header
# four URLs render the identical React 404 page: keep 404-* and two privatlivspolitik.html shots as evidence
(cd out/screenshots
  md5sum 404-*.jpg privatlivspolitik-*.jpg cookiepolitik-*.jpg > ../screenshots-md5.txt
  for w in 320 768; do rm -f privatlivspolitik-$w-light.jpg privatlivspolitik-html-$w-light.jpg cookiepolitik-html-$w-light.jpg; done
  for w in 390 1440; do rm -f privatlivspolitik-$w-light.jpg cookiepolitik-html-$w-light.jpg; done)
# fix header row of the security table (9 security columns incl. COEP)
node -e '
const fs=require("fs");let s=fs.readFileSync("out/headers-table.md","utf8");
s=s.replace("| URL | HSTS | CSP | XCTO | XFO | Referrer-Policy | Permissions-Policy | COOP | CORP |\n|---|---|---|---|---|---|---|---|---|","| URL | HSTS | CSP | X-Content-Type-Options | X-Frame-Options | Referrer-Policy | Permissions-Policy | COOP | CORP | COEP |\n|---|---|---|---|---|---|---|---|---|---|");
fs.writeFileSync("out/headers-table.md",s);'
cp -f common.js lh-run.sh trim-lhr.js run-lighthouse-all.sh run-pw-all.sh vitals.js axe.js shots.js headers.js network.js compress.js extra.js extra2.js contrast.js summarize.js extract-lhr.js assemble.sh out/scripts/ 2>/dev/null || true
echo "--- out tree"
du -sh out; du -sh out/* | sort -h | tail -20
echo "--- shipped images >150000 bytes:"
find out -name '*.jpg' -size +150000c | head
echo "--- total image bytes:"
find out -name '*.jpg' -printf '%s\n' | awk '{s+=$1} END {print s}'
