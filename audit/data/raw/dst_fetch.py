"""Fetch DST StatBank tableinfo + data. Usage: python -X utf8 dst_fetch.py TABLEID [var=val1,val2 ...]
Writes <TABLE>_info.json and <TABLE>_data.csv in cwd. Variables not given are fetched with '*'
except the time variable, where 'latest N' can be given as Tid=-N (last N periods)."""
import sys, json, urllib.request

tid = sys.argv[1]
over = {}
for a in sys.argv[2:]:
    k, v = a.split("=", 1)
    over[k] = v.split(",")

def get(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json; charset=utf-8"})
    return urllib.request.urlopen(req, timeout=60).read()

info = json.loads(get(f"https://api.statbank.dk/v1/tableinfo/{tid}?lang=en&format=JSON"))
json.dump(info, open(f"{tid}_info.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(tid, info["text"], "| updated", info["updated"], "| contact", info.get("contacts"))
variables = []
for v in info["variables"]:
    code = v["id"]
    if code in over:
        vals = over[code]
        if len(vals) == 1 and vals[0].startswith("-") and vals[0][1:].isdigit():
            n = int(vals[0][1:])
            vals = [x["id"] for x in v["values"]][-n:]
        variables.append({"code": code, "values": vals})
    else:
        variables.append({"code": code, "values": ["*"]})
    print(" var", code, v["text"], len(v["values"]), [x["id"] + "=" + x["text"] for x in v["values"][:4]])
req = {"table": tid, "format": "CSV", "lang": "en", "valuePresentation": "CodeAndValue", "variables": variables}
raw = get("https://api.statbank.dk/v1/data", json.dumps(req).encode("utf8"))
open(f"{tid}_data.csv", "wb").write(raw)
print("rows", raw.count(b"\n"))
