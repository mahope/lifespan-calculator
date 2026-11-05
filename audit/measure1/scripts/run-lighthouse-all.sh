#!/bin/bash
# The full Lighthouse plan: 14 runs total, serial. Home 3x mobile + 3x desktop, 4 landing pages 1x each form factor.
cd "$(dirname "$0")"
source ~/dev/env.sh >/dev/null 2>&1
export OUTD=$PWD/out/lighthouse
mkdir -p "$OUTD"
echo "slug,form,run,perf,a11y,bp,seo,lcp_ms,cls,tbt_ms,fcp_ms,si_ms,tti_ms,transfer_bytes,js_bytes,requests,benchmarkIndex,loadavg" > "$OUTD/summary.csv.header"
for ff in mobile desktop; do
  for n in 1 2 3; do
    CAP=3 ./lh-run.sh home / $ff $n </dev/null
  done
done
for ff in mobile desktop; do
  CAP=1 ./lh-run.sh hvor-lang-tid /hvor-lang-tid-har-jeg-tilbage $ff 1 </dev/null
  CAP=1 ./lh-run.sh dodsalder /dodsalder-calculator $ff 1 </dev/null
  CAP=1 ./lh-run.sh livsstil /livsstil-og-levetid $ff 1 </dev/null
  CAP=1 ./lh-run.sh danmark /levetid-beregner-danmark $ff 1 </dev/null
done
echo ALLDONE >> "$OUTD/runs.log"
