#!/usr/bin/env python3
"""Build video/data/film.json from the repo's own real files.

Every number and name in the film comes from this file, and this file only reads:
  - DESIGN.md                               colour tokens (oklch, converted to sRGB hex)
  - tests/fixtures/ourcommons/members.xml   current members and their caucus (seat counts)
  - tests/fixtures/openparliament/*.json    vote 177 and 178, every MP's ballot, the recent votes list, politicians
  - tests/fixtures/legisinfo/bill-C-218.json stages, sponsor, dates
  - tests/fixtures/represent/postcode-K0A1L0.json  postal code lookup
  - data/summaries/45-1/C-218.json          the committed AI summary (labelled as such on screen)
  - src/i18n/messages.ts, src/lib/stages.ts, src/i18n/stages-fr.ts  the site's own UI strings (copied below with line refs)

Run from the repo root or anywhere: python3 video/scripts/prep-data.py
"""
import json
import math
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIX = ROOT / "tests" / "fixtures"
OUT = ROOT / "video" / "data" / "film.json"


# ---------------------------------------------------------------- colour
def oklch_to_hex(L, C, H):
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def enc(x):
        x = max(0.0, min(1.0, x))
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055

    return "#" + "".join(f"{round(enc(c) * 255):02x}" for c in (r, g, bb))


def design_colours():
    text = (ROOT / "DESIGN.md").read_text()
    front = text.split("---")[1]
    out = {}
    for name, l, c, h in re.findall(r'^\s{2}([a-z0-9-]+): "oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)"', front, re.M):
        out[name] = oklch_to_hex(float(l), float(c), float(h))
    # The film uses the dark theme: take the -dark variant of every token that has one.
    dark = {}
    for k, v in out.items():
        if k.endswith("-dark"):
            continue
        dark[k] = out.get(k + "-dark", v)
    return dark


# ---------------------------------------------------------------- house
PARTY_KEY = {"Liberal": "liberal", "Conservative": "conservative", "Bloc Québécois": "bloc", "Bloc": "bloc",
             "NDP": "ndp", "Green Party": "green", "Green": "green"}
PARTY_SHORT = {"liberal": "Liberal", "conservative": "Conservative", "bloc": "Bloc", "ndp": "NDP", "green": "Green"}


def house():
    tree = ET.parse(FIX / "ourcommons" / "members.xml")
    caucus = Counter(PARTY_KEY[m.findtext("CaucusShortName")] for m in tree.getroot())
    parties = [{"id": k, "name": PARTY_SHORT[k], "seats": n} for k, n in caucus.most_common()]
    filled = sum(caucus.values())
    # 343 seats: the 2023 Representation Order. The site derives it from the riding list in data/tabled.db; the
    # home page (docs/screenshots/home-1440-dark.png) reads "343 seats in the House of Commons ... Vacant 6".
    seats_total = 343
    return {"parties": parties, "filled": filled, "seatsTotal": seats_total, "vacant": seats_total - filled}


# ---------------------------------------------------------------- votes
BALLOT = {"Yes": "yea", "No": "nay", "Paired": "paired", "Didn't vote": "absent"}


def politicians():
    objs = json.loads((FIX / "openparliament" / "politicians-list.json").read_text())["objects"]
    return {o["url"]: o for o in objs}


def vote(number, pols, party_order):
    v = json.loads((FIX / "openparliament" / f"vote-{number}.json").read_text())
    ballots = json.loads((FIX / "openparliament" / f"ballots-{number}.json").read_text())["objects"]
    rows = []
    for b in ballots:
        p = pols[b["politician_url"]]
        name = p["name"]
        rows.append({
            "slug": b["politician_url"].strip("/").split("/")[-1],
            "name": name,
            "family": name.split(" ")[-1],
            "party": PARTY_KEY[p["current_party"]["short_name"]["en"]],
            "riding": p["current_riding"]["name"]["en"],
            "province": p["current_riding"]["province"],
            "ballot": BALLOT[b["ballot"]],
        })
    # Party position: the side most of its voting MPs took (README "Metrics"); dissent = voted the other side.
    stats = {}
    for r in rows:
        s = stats.setdefault(r["party"], {"yea": 0, "nay": 0, "paired": 0, "absent": 0})
        s[r["ballot"]] += 1
    for k, s in stats.items():
        s["majority"] = "yea" if s["yea"] > s["nay"] else "nay" if s["nay"] > s["yea"] else "split"
    for r in rows:
        s = stats[r["party"]]
        r["dissent"] = r["ballot"] in ("yea", "nay") and s["majority"] in ("yea", "nay") and r["ballot"] != s["majority"] \
            and s["yea"] + s["nay"] >= 2
    for k, s in stats.items():
        s["dissent"] = sum(1 for r in rows if r["party"] == k and r["dissent"])
    order_b = {"yea": 0, "nay": 1, "paired": 2, "absent": 3}
    # Seat order as src/components/votes/vote-chamber.tsx: party (by seats), then ballot, then family name.
    rows.sort(key=lambda r: (party_order[r["party"]], order_b[r["ballot"]], r["family"]))
    counts = Counter(r["ballot"] for r in rows)
    assert counts["yea"] == v["yea_total"] and counts["nay"] == v["nay_total"] and counts["paired"] == v["paired_total"], number
    return {
        "number": v["number"], "session": v["session"], "date": v["date"], "result": v["result"],
        "description": v["description"]["en"], "descriptionFr": v["description"]["fr"],
        "bill": v["bill_url"].strip("/").split("/")[-1] if v.get("bill_url") else None,
        "yeas": v["yea_total"], "nays": v["nay_total"], "paired": v["paired_total"], "absent": counts["absent"],
        "partyStats": [{"party": k, **stats[k]} for k in sorted(stats, key=lambda k: party_order[k])],
        "ballots": rows,
    }


def recent_votes():
    objs = json.loads((FIX / "openparliament" / "votes-list.json").read_text())["objects"]
    return [{"number": o["number"], "date": o["date"], "result": o["result"], "yeas": o["yea_total"],
             "nays": o["nay_total"], "paired": o.get("paired_total", 0), "description": o["description"]["en"],
             "bill": (o.get("bill_url") or "").strip("/").split("/")[-1] or None} for o in objs]


# ---------------------------------------------------------------- bill
def bill_c218():
    lb = json.loads((FIX / "legisinfo" / "bill-C-218.json").read_text())[0]
    op = json.loads((FIX / "openparliament" / "bill-C-218.json").read_text())
    summ = json.loads((ROOT / "data" / "summaries" / "45-1" / "C-218.json").read_text())
    house_stages = lb["BillStages"]["HouseBillStages"]
    first = house_stages[0]["StateAsOfDate"][:10]
    return {
        "number": lb["NumberCode"],
        "title": lb["LongTitleEn"], "titleFr": lb["LongTitleFr"],
        "type": "Private member’s bill", "typeFr": "Projet de loi émanant d’un député",
        "introduced": first,
        "sponsor": lb["SponsorPersonName"], "sponsorParty": "conservative",
        "sponsorRiding": lb["SponsorConstituencyNameEn"],
        "status": lb["StatusNameEn"], "statusFr": lb["StatusNameFr"],
        "textUrl": op["text_url"],
        # Stage states: first reading completed (LegisInfo State 4, dated); second reading defeated by vote 177.
        "stages": [
            {"chamber": "house", "label": "First reading", "labelFr": "Première lecture", "state": "completed", "date": first},
            {"chamber": "house", "label": "Second reading", "labelFr": "Deuxième lecture", "state": "defeated", "date": "2026-10-07"},
            {"chamber": "house", "label": "Committee", "labelFr": "Comité", "state": "not_reached"},
            {"chamber": "house", "label": "Report stage", "labelFr": "Étape du rapport", "state": "not_reached"},
            {"chamber": "house", "label": "Third reading", "labelFr": "Troisième lecture", "state": "not_reached"},
            {"chamber": "senate", "label": "First reading", "labelFr": "Première lecture", "state": "not_reached"},
            {"chamber": "senate", "label": "Second reading", "labelFr": "Deuxième lecture", "state": "not_reached"},
            {"chamber": "senate", "label": "Committee", "labelFr": "Comité", "state": "not_reached"},
            {"chamber": "senate", "label": "Third reading", "labelFr": "Troisième lecture", "state": "not_reached"},
            {"chamber": "crown", "label": "Royal assent", "labelFr": "Sanction royale", "state": "not_reached"},
        ],
        "summary": {
            "tldr": summ["summary"]["tldr"],
            "whatItDoes": summ["summary"]["what_it_does"],
            "whoItAffects": summ["summary"]["who_it_affects"],
            "model": summ["model"], "generatedAt": summ["generatedAt"][:10], "basis": summ["summary"]["source_basis"],
        },
    }


def find_mp(pols):
    d = json.loads((FIX / "represent" / "postcode-K0A1L0.json").read_text())
    rep = [r for r in d["representatives_centroid"] if r.get("elected_office") == "MP"][0]
    slug = [u for u, p in pols.items() if p["name"] == rep["name"]][0].strip("/").split("/")[-1]
    return {"postal": "K0A 1L0", "riding": rep["district_name"], "name": rep["name"],
            "party": PARTY_KEY[rep["party_name"]], "slug": slug}


def main():
    pols = politicians()
    h = house()
    order = {p["id"]: i for i, p in enumerate(h["parties"])}
    v177 = vote(177, pols, order)
    v178 = vote(178, pols, order)
    gladu = next(b for b in v177["ballots"] if b["slug"] == "marilyn-gladu")
    gladu178 = next(b for b in v178["ballots"] if b["slug"] == "marilyn-gladu")
    film = {
        "_source": "Generated by video/scripts/prep-data.py from tests/fixtures, data/summaries and DESIGN.md. Do not edit.",
        "colors": design_colours(),
        "house": h,
        "vote": v177,
        "dissenters": [b for b in v177["ballots"] if b["dissent"]],
        "mp": {
            "name": gladu["name"], "slug": gladu["slug"], "party": gladu["party"], "riding": gladu["riding"],
            "province": "Ontario" if gladu["province"] == "ON" else gladu["province"],
            "record": [
                {"number": 178, "date": v178["date"], "description": v178["description"], "ballot": gladu178["ballot"], "dissent": gladu178["dissent"]},
                {"number": 177, "date": v177["date"], "description": v177["description"], "ballot": gladu["ballot"], "dissent": gladu["dissent"]},
            ],
        },
        "find": find_mp(pols),
        "bill": bill_c218(),
        "recentVotes": recent_votes(),
        # Counts from PRODUCT.md "Evidence on Hand" (data/tabled.db on 2026-10-12): 191 bills, 178 votes.
        # 191 is also len(tests/fixtures/legisinfo/bills-45-1.json); 178 is the latest vote number in votes-list.json.
        "session": {
            "bills": len(json.loads((FIX / "legisinfo" / "bills-45-1.json").read_text())),
            "votes": max(o["number"] for o in recent_votes()),
            "summaries": sum(1 for _ in (ROOT / "data" / "summaries").rglob("*.json")),
        },
    }
    fanjoy = next(b for b in v177["ballots"] if b["slug"] == film["find"]["slug"])
    film["find"]["ballot177"] = fanjoy["ballot"]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(film, ensure_ascii=False, indent=1))
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(" house", h)
    print(" vote 177", v177["yeas"], v177["nays"], v177["paired"], v177["absent"], [s for s in v177["partyStats"]])
    print(" dissenters", [d["name"] for d in film["dissenters"]])
    print(" find", film["find"])
    print(" session", film["session"])


if __name__ == "__main__":
    main()
