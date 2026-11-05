"""Verify src/utils/lifeTableDK.js against DST StatBank HISB8 (fetched to hisb8_data.csv).
Usage: python -X utf8 verify_hisb8.py <lifeTableDK.js> <hisb8_data.csv>
"""
import re, sys, csv, json

js_path, csv_path = sys.argv[1], sys.argv[2]
src = open(js_path, encoding="utf8").read()

def grab(group, sex):
    m = re.search(group + r":\s*\{(.*?)\n  \},", src, re.S)
    block = m.group(1)
    m2 = re.search(sex + r":\s*\[(.*?)\]", block, re.S)
    return [float(x) for x in m2.group(1).replace("\n", " ").split(",") if x.strip()]

code = {
    ("remaining", "male"): grab("remaining", "male"),
    ("remaining", "female"): grab("remaining", "female"),
    ("survivors", "male"): grab("survivors", "male"),
    ("survivors", "female"): grab("survivors", "female"),
}
for k, v in code.items():
    print("code array", k, "len", len(v))

# DST data
dst = {}
with open(csv_path, encoding="utf-8-sig") as f:
    r = csv.reader(f, delimiter=";")
    next(r)
    for alder, kon, tavle, tid, val in r:
        dst[(int(alder), kon, tavle, tid)] = float(val)

def series(sex, tavle, tid):
    s = "M" if sex == "male" else "K"
    return [dst[(a, s, tavle, tid)] for a in range(100)]

tavle_of = {"remaining": "3", "survivors": "1"}
report = {}
for period in ["2024:2025", "2023:2024", "2022:2023"]:
    tot = exact = 0
    maxdev = 0.0
    worst = None
    per = {}
    for (grp, sex), arr in code.items():
        ref = series(sex, tavle_of[grp], period)
        n = len(ref)
        ex = 0
        md = 0.0
        diffs = []
        for i in range(min(n, len(arr))):
            d = abs(arr[i] - ref[i])
            tol = 1e-9
            if d <= tol:
                ex += 1
            else:
                diffs.append((i, arr[i], ref[i]))
            if d > md:
                md = d
        per[f"{grp}/{sex}"] = {"n": n, "exact": ex, "maxdev": md, "mismatch_examples": diffs[:5]}
        tot += n
        exact += ex
        if md > maxdev:
            maxdev = md
    report[period] = {"total": tot, "exact": exact, "maxabsdev": maxdev, "per": per}

# index/offset test: for each array try shifts -2..+2 against 2024:2025
shift = {}
for (grp, sex), arr in code.items():
    ref = series(sex, tavle_of[grp], "2024:2025")
    best = None
    for sh in range(-3, 4):
        m = 0
        for i in range(100):
            j = i + sh
            if 0 <= j < 100 and abs(arr[i] - ref[j]) <= 1e-9:
                m += 1
        if best is None or m > best[1]:
            best = (sh, m)
    shift[f"{grp}/{sex}"] = best
report["best_shift_vs_2024:2025"] = shift

# monotonic / sanity checks on DST latest
san = {}
for sex in ["male", "female"]:
    l = series(sex, "1", "2024:2025")
    e = series(sex, "3", "2024:2025")
    san[sex] = {
        "l_monotone_nonincreasing": all(l[i] >= l[i + 1] for i in range(99)),
        "e_x_0": e[0], "e_x_20": e[20], "e_x_40": e[40], "e_x_60": e[60], "e_x_80": e[80], "e_x_99": e[99],
        "l_99": l[99],
    }
report["sanity_dst_2024:2025"] = san

print(json.dumps(report, indent=1, ensure_ascii=False))
json.dump(report, open("verify_hisb8_output.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
