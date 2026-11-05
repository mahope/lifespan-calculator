"""Gompertz slope / mortality-doubling time from DST HISB8 2024:2025 l_x (q_x = 1 - l_{x+1}/l_x), ages 40-90."""
import csv, math, json
l = {}
for row in csv.reader(open("hisb8_data.csv", encoding="utf-8-sig"), delimiter=";"):
    if row[0].lstrip("\ufeff") == "ALDER": continue
    a, k, t, tid, v = row
    if t == "1" and tid == "2024:2025": l[("male" if k == "M" else "female", int(a))] = float(v)
out = {}
for sex in ["male", "female"]:
    for lo, hi in [(40, 90), (30, 60), (60, 90)]:
        xs = list(range(lo, hi)); ys = [math.log(1 - l[(sex, x + 1)] / l[(sex, x)]) for x in xs]
        n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
        b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
        out[f"{sex} {lo}-{hi}"] = {"slope_per_year": round(b, 4), "doubling_years": round(math.log(2) / b, 1)}
json.dump(out, open("gompertz_slope_output.json", "w"), indent=1)
print(json.dumps(out, indent=1))
