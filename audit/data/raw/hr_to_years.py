"""Convert a constant all-cause hazard ratio (applied from the current age onward, proportional hazards) into years of
remaining life using the DST HISB8 2024:2025 survivors column l_x. Shows that a fixed 'years' coefficient is age-dependent.
Output: hr_to_years_output.json. Tail beyond 99 approximated as e_99/HR (negligible weight).
"""
import csv, json, math

l = {}
e = {}
for row in csv.reader(open("hisb8_data.csv", encoding="utf-8-sig"), delimiter=";"):
    if row[0].lstrip("﻿") == "ALDER":
        continue
    a, k, t, tid, v = row
    if tid != "2024:2025":
        continue
    sex = "male" if k == "M" else "female"
    (l if t == "1" else e)[(sex, int(a))] = float(v)

def le(sex, age, hr):
    S = 1.0
    tot = 0.0
    for a in range(age, 99):
        q = 1 - l[(sex, a + 1)] / l[(sex, a)]
        H = -math.log(1 - q) * hr
        Sn = S * math.exp(-H)
        tot += (S + Sn) / 2
        S = Sn
    tot += S * e[(sex, 99)] / hr
    return tot

out = {}
for sex in ["male", "female"]:
    for age in [30, 50, 70, 85]:
        base = le(sex, age, 1.0)
        row = {"e_x_table": e[(sex, age)], "e_x_recomputed": round(base, 2)}
        for hr in [0.5, 0.75, 1.5, 2.0, 3.0]:
            row[f"HR{hr}"] = round(le(sex, age, hr) - base, 2)
        out[f"{sex}/{age}"] = row
json.dump(out, open("hr_to_years_output.json", "w"), indent=1)
for k, v in out.items():
    print(k, v)
