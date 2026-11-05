"""Verify citations used in the lifestyle-model audit via the Europe PMC REST API (mirrors PubMed; returns PMID, DOI,
journal, year, abstract). NCBI E-utilities returned HTTP 500 on 2026-11-05, hence Europe PMC.
Writes pubmed_verified.json (hits + abstracts) and prints a compact listing.
Usage: python -X utf8 pubmed_lookup.py
"""
import json, time, urllib.request, urllib.parse, datetime

BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=3&query="

def get(url):
    last = None
    for attempt in range(3):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "levetid-audit/1.0"}), timeout=60).read())
        except Exception as e:
            last = e
            time.sleep(2)
    return {"error": str(last), "resultList": {"result": []}}

# key -> (title words, year, journal fragment)
Q = {
 "jha2013": ('"21st-century hazards of smoking and benefits of cessation in the United States"', "2013"),
 "pirie2013": ('"The 21st century hazards of smoking and benefits of stopping" AND "one million women"', "2013"),
 "doll2004": ('"Mortality in relation to smoking: 50 years\' observations on male British doctors"', "2004"),
 "moore2012": ('"Leisure time physical activity of moderate to vigorous intensity and mortality"', "2012"),
 "arem2015": ('"Leisure time physical activity and mortality: a detailed pooled analysis of the dose-response relationship"', "2015"),
 "gbmc2016": ('"Body-mass index and all-cause mortality: individual-participant-data meta-analysis of 239 prospective studies"', "2016"),
 "psc2009": ('"Body-mass index and cause-specific mortality in 900 000 adults"', "2009"),
 "wood2018": ('"Risk thresholds for alcohol consumption: combined analysis of individual-participant data for 599 912 current drinkers"', "2018"),
 "fadnes2022": ('"Estimating impact of food choices on life expectancy: A modeling study"', "2022"),
 "holtlunstad2010": ('"Social relationships and mortality risk: a meta-analytic review"', "2010"),
 "chetty2016": ('"The Association Between Income and Life Expectancy in the United States, 2001-2014"', "2016"),
 "li2018": ('"Impact of Healthy Lifestyle Factors on Life Expectancies in the US Population"', "2018"),
 "cappuccio2010": ('"Sleep duration and all-cause mortality: a systematic review and meta-analysis of prospective studies"', "2010"),
 "yin2017": ('"Relationship of Sleep Duration With All-Cause Mortality and Cardiovascular Events" AND "Dose-Response"', "2017"),
 "planaripoll2019": ('"A comprehensive analysis of mortality-related health metrics associated with mental disorders"', "2019"),
 "walker2015": ('"Mortality in mental disorders and global disease burden implications"', "2015"),
 "kivimaki2012": ('"Job strain as a risk factor for coronary heart disease: a collaborative meta-analysis of individual participant data"', "2012"),
 "celismorales2017": ('"Association between active commuting and incident cardiovascular disease, cancer, and mortality"', "2017"),
 "ekelund2016": ('"Does physical activity attenuate, or even eliminate, the detrimental association of sitting time with mortality"', "2016"),
 "inouechoi2017": ('"Association of Long-term, Low-Intensity Smoking With All-Cause and Cause-Specific Mortality"', "2017"),
 "apte2015": ('"Ambient PM2.5 Reduces Global and Regional Life Expectancy"', "2015"),
}

res = {"retrieved": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "hits": {}}
for k, (q, yr) in Q.items():
    js = get(BASE + urllib.parse.quote(f"TITLE:{q} AND PUB_YEAR:{yr}"))
    hs = []
    for r in js.get("resultList", {}).get("result", [])[:2]:
        hs.append({"pmid": r.get("pmid"), "doi": r.get("doi"), "title": r.get("title"), "journal": r.get("journalTitle"),
                   "year": r.get("pubYear"), "authors": r.get("authorString", "")[:90], "abstract": r.get("abstractText", "")})
    res["hits"][k] = hs
    time.sleep(0.3)
json.dump(res, open("pubmed_verified.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
for k, hs in res["hits"].items():
    print("==", k)
    for h in hs[:1]:
        print("  PMID", h["pmid"], "| doi", h["doi"], "|", h["journal"], h["year"], "|", h["authors"], "|", (h["title"] or "")[:100])
    if not hs:
        print("  NO HIT")
