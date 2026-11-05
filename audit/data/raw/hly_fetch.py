"""Eurostat hlth_hlye (Healthy life years, by sex) for DK + Nordics + EU27 avg. Writes hly_eurostat.json + prints table."""
import json, urllib.request, datetime

URL = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hlth_hlye?format=JSON&lang=EN"
       "&geo=DK&geo=SE&geo=NO&geo=FI&geo=IS&geo=DE&geo=EU27_2020&sinceTimePeriod=2019")
raw = urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "levetid-audit/1.0"}), timeout=60).read()
js = json.loads(raw)
ids, sizes = js["id"], js["size"]
cat = {d: js["dimension"][d]["category"] for d in ids}
labels = {d: cat[d].get("label", {}) for d in ids}
inv = {d: {v: k for k, v in cat[d]["index"].items()} for d in ids}
rows = []
for key, val in js["value"].items():
    k = int(key)
    co = {}
    for d, s in reversed(list(zip(ids, sizes))):
        co[d] = inv[d][k % s]
        k //= s
    rows.append((co, val))
out = {"retrieved": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "url": URL,
       "updated": js.get("updated"), "dims": {d: labels[d] for d in ids if d in ("hlth_hle", "unit", "sex")}, "rows": []}
for co, v in rows:
    out["rows"].append({**co, "value": v})
json.dump(out, open("hly_eurostat.json", "w"), indent=1)
print("updated", js.get("updated"))
print({d: labels[d] for d in ids if d in ("hlth_hle",)})
latest = {}
for co, v in rows:
    key = (co["geo"], co["hlth_hle"], co["unit"], co["sex"])
    if key not in latest or co["time"] > latest[key][0]:
        latest[key] = (co["time"], v)
for key in sorted(latest):
    if key[0] in ("DK", "EU27_2020", "SE", "NO"):
        print(key, latest[key])
