"""Fetch life expectancy at birth (male/female) per country from World Bank, Eurostat (demo_mlexpec) and WHO GHO,
and compare with src/utils/lifeExpectancyData.js. Re-runnable annually. Usage: python -X utf8 intl_fetch.py <lifeExpectancyData.js>
Outputs: intl_compare.csv, intl_worldbank.json, intl_eurostat.json, intl_who.json
"""
import sys, re, json, csv, urllib.request, datetime

def get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "levetid-audit/1.0", "Accept": "application/json"})
    return urllib.request.urlopen(req, timeout=timeout).read()

now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ")
src = open(sys.argv[1], encoding="utf8").read()
site = {}
for m in re.finditer(r"'([^']+)':\s*\{\s*male:\s*([\d.]+),\s*female:\s*([\d.]+),\s*country:\s*'([^']+)'", src):
    site[m.group(1)] = (float(m.group(2)), float(m.group(3)), m.group(4))

iso3 = {"Denmark": "DNK", "Sweden": "SWE", "Norway": "NOR", "Germany": "DEU", "United Kingdom": "GBR",
        "United States": "USA", "France": "FRA", "Netherlands": "NLD", "Finland": "FIN", "Iceland": "ISL",
        "Switzerland": "CHE", "Japan": "JPN", "World": "WLD"}
iso2 = {"Denmark": "DK", "Sweden": "SE", "Norway": "NO", "Germany": "DE", "France": "FR", "Netherlands": "NL",
        "Finland": "FI", "Iceland": "IS", "Switzerland": "CH"}

# ---- World Bank
wb = {}
for ind, key in [("SP.DYN.LE00.MA.IN", "male"), ("SP.DYN.LE00.FE.IN", "female")]:
    codes = ";".join(iso3.values())
    url = f"https://api.worldbank.org/v2/country/{codes}/indicator/{ind}?format=json&per_page=500&mrnev=1"
    js = json.loads(get(url))
    for r in js[1]:
        wb.setdefault(r["countryiso3code"], {})[key] = (r["value"], r["date"])
json.dump({"retrieved": now, "data": wb}, open("intl_worldbank.json", "w"), indent=1)

# ---- Eurostat demo_mlexpec (age Y_LT1 = at birth)
es = {}
geos = "&".join(f"geo={g}" for g in iso2.values())
url = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?format=JSON&lang=EN"
       f"&age=Y_LT1&sex=M&sex=F&{geos}&sinceTimePeriod=2019")
try:
    js = json.loads(get(url))
    ids, sizes = js["id"], js["size"]
    idx = {d: js["dimension"][d]["category"]["index"] for d in ids}
    inv = {d: {v: k for k, v in idx[d].items()} for d in ids}
    for key, val in js["value"].items():
        k = int(key)
        coords = {}
        for d, s in reversed(list(zip(ids, sizes))):
            coords[d] = inv[d][k % s]
            k //= s
        es.setdefault(coords["geo"], {}).setdefault(coords["time"], {})[coords["sex"]] = val
    json.dump({"retrieved": now, "url": url, "data": es}, open("intl_eurostat.json", "w"), indent=1)
except Exception as e:
    es = {"ERROR": str(e)}
    print("Eurostat failed:", e)

# ---- WHO GHO WHOSIS_000001 (LE at birth), SEX dimension
who = {}
try:
    codes = ",".join(f"'{c}'" for c in iso3.values() if c != "WLD")
    url = ("https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDimType eq 'COUNTRY' and "
           f"({' or '.join(chr(83)+'patialDim eq '+chr(39)+c+chr(39) for c in iso3.values() if c != 'WLD')}) and TimeDim ge 2019")
    url = url.replace(" ", "%20")
    js = json.loads(get(url))
    for r in js["value"]:
        who.setdefault(r["SpatialDim"], {}).setdefault(r["TimeDim"], {})[r["Dim1"]] = r["NumericValue"]
    json.dump({"retrieved": now, "url": url, "data": who}, open("intl_who.json", "w"), indent=1)
except Exception as e:
    who = {"ERROR": str(e)}
    print("WHO failed:", e)

# ---- comparison table
rows = []
for name, (m, f, dk) in site.items():
    i3 = iso3.get(name)
    row = {"country": name, "site_male": m, "site_female": f}
    w = wb.get(i3, {})
    row["wb_male"], row["wb_year"] = w.get("male", (None, None))
    row["wb_female"] = w.get("female", (None, None))[0]
    e = es.get(iso2.get(name), {}) if isinstance(es, dict) and "ERROR" not in es else {}
    if e:
        ty = sorted(e)[-1]
        row["eurostat_year"] = ty
        row["eurostat_male"] = e[ty].get("M")
        row["eurostat_female"] = e[ty].get("F")
    g = who.get(i3, {}) if isinstance(who, dict) and "ERROR" not in who else {}
    if g:
        ty = sorted(g)[-1]
        row["who_year"] = ty
        row["who_male"] = g[ty].get("SEX_MLE")
        row["who_female"] = g[ty].get("SEX_FMLE")
    rows.append(row)
keys = ["country", "site_male", "site_female", "wb_year", "wb_male", "wb_female", "eurostat_year", "eurostat_male",
        "eurostat_female", "who_year", "who_male", "who_female"]
with open("intl_compare.csv", "w", newline="", encoding="utf8") as fh:
    w = csv.DictWriter(fh, fieldnames=keys)
    w.writeheader()
    for r in rows:
        w.writerow({k: r.get(k) for k in keys})
print(open("intl_compare.csv", encoding="utf8").read())
