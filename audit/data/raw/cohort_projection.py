"""Period vs projected (cohort) remaining life expectancy from DST FRDK426
(Befolkningsfremskrivning 2026, mortality assumptions q_x per year and e_x period per year).
Cohort e_a for a person aged a in 2026 = trapezoid sum of survivorship along the diagonal
q(a+k, 2026+k). Beyond 2069 (last projected year) mortality is held at the 2069 level (conservative:
no further improvement). Output: cohort_projection_output.json
"""
import csv, json

q = {}   # (sex, year, age) -> q (probability)
ex = {}  # (sex, year, age) -> period e_x from DST
for kon, alder, tavle, tid, val in csv.reader(__import__("gzip").open("FRDK426_data.csv.gz", "rt", encoding="utf-8-sig"), delimiter=";"):
    if kon == "KØN":
        continue
    sex = "male" if kon.startswith("1") else "female"
    age = int(alder.split()[0])
    year = int(tid.split()[0])
    v = float(val)
    if tavle.startswith("2"):
        q[(sex, year, age)] = v / 100000.0
    else:
        ex[(sex, year, age)] = v

MAXAGE = 109
YEARS = sorted({y for (_, y, _) in q})
LAST = YEARS[-1]


def qq(sex, year, age):
    y = min(year, LAST)
    if age > MAXAGE:
        return 1.0
    return q[(sex, y, age)]


def cohort_e(sex, age0, year0, hold=True):
    S = 1.0
    e = 0.0
    k = 0
    while True:
        a = age0 + k
        if a > MAXAGE + 1:
            break
        qk = qq(sex, year0 + k, a) if a <= MAXAGE else 1.0
        S_next = S * (1 - qk)
        e += (S + S_next) / 2.0
        S = S_next
        k += 1
        if S < 1e-9:
            break
    return e


def period_e_from_q(sex, year, age0):
    S = 1.0
    e = 0.0
    a = age0
    while a <= MAXAGE + 1:
        qk = q[(sex, year, a)] if a <= MAXAGE else 1.0
        S_next = S * (1 - qk)
        e += (S + S_next) / 2.0
        S = S_next
        a += 1
    return e


hisb8 = {  # DST HISB8 2024:2025 e_x (from raw/hisb8_data.csv)
}
for kon, alder, tavle, tid, val in csv.reader(open("hisb8_data.csv", encoding="utf-8-sig"), delimiter=";"):
    if kon == "KØN" or kon == "ALDER" or alder == "ALDER":
        continue
for row in csv.reader(open("hisb8_data.csv", encoding="utf-8-sig"), delimiter=";"):
    if row[0] == "ALDER" or row[0].lstrip("﻿") == "ALDER":
        continue
    a, k, t, tid, v = row
    if t == "3" and tid == "2024:2025":
        hisb8[("male" if k == "M" else "female", int(a))] = float(v)

out = {"note": "cohort = diagonal of DST FRDK426 q_x(age+k, 2026+k); mortality held at 2069 beyond 2069",
       "formula_check_period_e_from_q_vs_DST_e_2026": {}, "rows": []}
for sex in ["male", "female"]:
    for a in [0, 20, 40, 60, 80]:
        out["formula_check_period_e_from_q_vs_DST_e_2026"][f"{sex}/{a}"] = {
            "from_q": round(period_e_from_q(sex, 2026, a), 3), "dst_e": ex[(sex, 2026, a)]}
for sex in ["male", "female"]:
    for a in [20, 40, 60, 80]:
        period_site = hisb8[(sex, a)]
        proj_period_2026 = ex[(sex, 2026, a)]
        coh = cohort_e(sex, a, 2026)
        out["rows"].append({
            "sex": sex, "age": a,
            "site_period_ex_HISB8_2024_25": period_site,
            "dst_projection_period_ex_2026": proj_period_2026,
            "dst_projection_period_ex_2040": ex[(sex, 2040, a)] if (sex, 2040, a) in ex else None,
            "dst_projection_period_ex_2069": ex[(sex, 2069, a)],
            "cohort_ex_computed_from_q_path": round(coh, 2),
            "cohort_minus_site_period": round(coh - period_site, 2),
        })
json.dump(out, open("cohort_projection_output.json", "w", encoding="utf8"), indent=1)
print(json.dumps(out, indent=1))
