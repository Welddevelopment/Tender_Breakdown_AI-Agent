import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEADS_PATH = ROOT / "crm" / "leads.csv"
DRAFTS_DIR = ROOT / "crm" / "drafts"
PLAN_PATH = ROOT / "crm" / "outreach-send-plan-2026-07-01.csv"
SUMMARY_PATH = ROOT / "crm" / "outreach-send-plan-2026-07-01.md"

BOOKING_URL = "https://cal.com/joel-jeon-o29lfr/bidframe"
FREE_PILOT_TARGET_COUNT = 150


FRAMEWORK_TERMS = (
    "framework",
    "dps",
    "ccs",
    "nhs",
    "local authority",
    "council",
    "school",
    "schools",
    "academy",
    "trust",
    "public sector",
    "public-sector",
    "procurepublic",
    "fusion21",
    "pagabo",
    "neupc",
    "sbs",
    "everything ict",
    "dfE".lower(),
)

HIGH_PAIN_TERMS = (
    "bid",
    "tender",
    "procurement",
    "asbestos",
    "water hygiene",
    "legionella",
    "lift",
    "fire",
    "passive",
    "roof",
    "m&e",
    "hvac",
    "retrofit",
    "construction",
    "minor works",
    "occupational health",
    "alternative provision",
    "send",
    "ict",
    "apprenticeship",
    "training",
)


def id_num(lead_id: str) -> int:
    match = re.fullmatch(r"L-(\d{4})", lead_id or "")
    return int(match.group(1)) if match else -1


def has_email(row: dict) -> bool:
    return "@" in (row.get("email") or "") and row.get("email") != "not_found"


def clean(value: str) -> str:
    return " ".join((value or "").replace("\n", " ").split())


def first_name(row: dict) -> str:
    name = clean(row.get("contact_person", ""))
    if not name or name == "not_found" or "/" in name or "&" in name:
        return ""
    first = re.split(r"[\s,]+", name)[0]
    return first if first and first.lower() not in {"not", "none"} else ""


def score(row: dict) -> int:
    if not has_email(row):
        return -100
    status = (row.get("verification_status") or "").lower()
    if status.startswith("unverified"):
        return -60

    conversion = row.get("conversion_estimate", "")
    total = {"High": 100, "Medium": 58, "Low": 5}.get(conversion, 30)

    email_type = (row.get("email_type") or "").lower()
    total += {
        "named": 22,
        "person": 22,
        "team": 16,
        "gmail": 14,
        "domain": 10,
        "generic": 8,
        "other": 3,
    }.get(email_type, 0)

    if status.startswith("verified"):
        total += 18
    elif status.startswith("partial"):
        total -= 8

    if first_name(row):
        total += 8

    text = " ".join(
        clean(row.get(field, "")).lower()
        for field in ("sub_sector", "public_tender", "conversion_rationale", "size_signal", "notes")
    )
    if any(term in text for term in FRAMEWORK_TERMS):
        total += 14
    if any(term in text for term in HIGH_PAIN_TERMS):
        total += 10
    if "n/a" == clean(row.get("public_tender", "")).lower():
        total -= 10
    if any(term in text for term in ("800+", "national provider", "larger", "major national")):
        total -= 12
    return total


def free_rate(score_value: int, row: dict) -> float:
    if score_value >= 160:
        return 0.020
    if score_value >= 140:
        return 0.016
    if score_value >= 115:
        return 0.012
    if score_value >= 85:
        return 0.006
    return 0.0


def paid_rate(score_value: int, row: dict) -> float:
    if score_value >= 160:
        return 0.0040
    if score_value >= 130:
        return 0.0030
    if score_value >= 95:
        return 0.0020
    if score_value >= 65:
        return 0.0010
    return 0.0


def pilot_area(row: dict) -> str:
    sub = clean(row.get("sub_sector", "public-sector"))
    if sub:
        return f"a {sub} tender"
    return "a public-sector tender"


def evidence_area(row: dict) -> str:
    text = clean(row.get("sub_sector", "")).lower()
    if "asbestos" in text:
        return "licences, method statements, notifications, waste transfer, RAMS and reporting"
    if "water" in text or "legionella" in text:
        return "ACoP L8 evidence, monitoring schedules, competence, sample results and reporting"
    if "lift" in text:
        return "LOLER evidence, maintenance schedules, callout SLAs, RAMS and engineer competence"
    if "ict" in text or "network" in text or "broadband" in text:
        return "service levels, cyber/security, safeguarding, data protection, implementation and support"
    if "occupational health" in text:
        return "clinical governance, referrals, data protection, SLAs, reporting and mobilisation"
    if "training" in text or "apprentice" in text:
        return "curriculum, learner support, safeguarding, outcomes, quality assurance and reporting"
    if "roof" in text or "construction" in text or "minor works" in text or "retrofit" in text:
        return "programme, H&S, accreditations, insurances, site logistics, quality and social value"
    if "alternative" in text or "send" in text or "slt" in text or "therapy" in text:
        return "safeguarding, learner support, staff competence, outcomes, referrals and reporting"
    if "bid" in text or "procurement" in text or "consult" in text:
        return "mandatory criteria, evidence gaps, source clauses, answer drafts and client review points"
    return "mandatory criteria, evidence, delivery method, insurances, deadlines and reporting"


def hook(row: dict) -> str:
    public_tender = clean(row.get("public_tender", ""))
    rationale = clean(row.get("conversion_rationale", ""))
    size_signal = clean(row.get("size_signal", ""))
    if public_tender and public_tender.lower() != "n/a":
        return public_tender.rstrip(".")
    if rationale:
        return rationale.rstrip(".")
    return size_signal.rstrip(".")


def subject(row: dict, mode: str) -> str:
    sub = clean(row.get("sub_sector", "tenders")).split("/")[0].strip()
    if mode == "free_pilot":
        return f"Could I run one {sub} tender for {row['firm']}?"
    return f"Bidframe for {sub} tenders at {row['firm']}"


def draft(row: dict, mode: str, plan_row: dict) -> str:
    name = row["firm"]
    lead_id = row["id"]
    greeting = f"Hi {first_name(row)}," if first_name(row) else "Hi,"
    lead_hook = hook(row)
    sub = clean(row.get("sub_sector", "public-sector work"))
    pain = evidence_area(row)
    free_or_paid = "free pilot" if mode == "free_pilot" else "paid pilot"
    ask_block = (
        f"I am trying to get 2-3 real pilots before I charge for this properly, so I would like to run one {pilot_area(row)} for free. "
        "In return, I would ask for blunt feedback. If it genuinely saves time, I would also ask whether we could use a one-sentence testimonial."
        if mode == "free_pilot"
        else f"I am opening a small number of paid pilot slots for teams that regularly read {sub} tender packs. "
        "The paid pilot is deliberately narrow: one tender in, a requirement matrix and evidence-linked draft pack back out, then a short review call to decide whether it is worth keeping."
    )
    cta = (
        f"If that is useful, you can grab a slot here: {BOOKING_URL}. Or reply with the kind of tender you see most often and I will suggest whether Bidframe is a fit."
        if mode == "free_pilot"
        else f"If you have a tender coming up, you can book a short call here: {BOOKING_URL}. If not, reply with the tender type you usually handle and I will send the closest example."
    )
    dm_ask = (
        "I am offering a free pilot in return for blunt feedback; if it earns it, I would also ask for a one-sentence testimonial."
        if mode == "free_pilot"
        else "I am opening a few paid pilot slots for teams that want a faster first read without trusting a black-box bid writer."
    )
    return f"""# {name} ({lead_id})

> Email: {row['email']} | {row['conversion_estimate']} | status: {row['status']}
> Outreach mode: {mode} | estimated free-pilot acceptance: {plan_row['harsh_free_pilot_acceptance_pct']} | estimated paid-conversation rate: {plan_row['harsh_paid_conversation_pct']}
> Phone: {row['phone']} | Book a slot: {BOOKING_URL}
> Context: {sub}, {row['region']}. {lead_hook}

## LinkedIn cold DM

Hi - I came across {name} while looking at teams that deal with public-sector tender packs. What made this feel relevant was: {lead_hook}. Those tenders usually hide the awkward work in the details: {pain}.

Bidframe turns the tender into a source-linked requirements checklist, pulls pass-fail criteria to the top, and drafts answers only where there is evidence to cite. {dm_ask} Worth a quick look?

## Cold email

Subject: {subject(row, mode)}

{greeting}

I came across {name} while looking at teams that deal with public-sector tender packs. What made this feel relevant was: {lead_hook}.

I am building Bidframe for the first read of a tender. It turns the document into a source-linked requirements checklist, pulls the pass-fail criteria to the top, and drafts answer text only where there is evidence to cite. The useful part is not magic prose; it is making sure nothing mandatory gets missed before the team starts writing.

For {sub} work, I would expect the painful bits to be things like {pain}. Those are exactly the details Bidframe is meant to pull into one reviewable matrix.

{ask_block}

No confidential documents needed. A recent public tender, an old pack you are comfortable sharing, or even a link to the kind of opportunity you normally see is enough for a useful test.

{cta}

Best,
Joel
Bidframe
"""


def build_plan(rows: list[dict]) -> list[dict]:
    scored = []
    for row in rows:
        s = score(row)
        eligible = has_email(row) and not (row.get("verification_status") or "").lower().startswith("unverified")
        scored.append((s, row, eligible))

    free_candidates = [
        row["id"]
        for s, row, eligible in sorted(scored, key=lambda item: (-item[0], id_num(item[1]["id"])))
        if eligible and s >= 85
    ]
    free_ids = set(free_candidates[:FREE_PILOT_TARGET_COUNT])

    plan = []
    for s, row, eligible in sorted(scored, key=lambda item: (-item[0], id_num(item[1]["id"]))):
        if not has_email(row):
            mode = "no_email_do_not_send"
        elif (row.get("verification_status") or "").lower().startswith("unverified"):
            mode = "verify_before_sending"
        elif row["id"] in free_ids:
            mode = "free_pilot"
        else:
            mode = "paid_later"
        fp_rate = free_rate(s, row) if mode == "free_pilot" else 0.0
        p_rate = paid_rate(s, row) if mode == "paid_later" else 0.0
        plan.append(
            {
                "id": row["id"],
                "firm": row["firm"],
                "email": row["email"],
                "email_type": row["email_type"],
                "verification_status": row["verification_status"],
                "conversion_estimate": row["conversion_estimate"],
                "score": s,
                "outreach_mode": mode,
                "harsh_free_pilot_acceptance_pct": f"{fp_rate * 100:.2f}%",
                "harsh_paid_conversation_pct": f"{p_rate * 100:.2f}%",
                "subject": subject(row, "free_pilot" if mode == "free_pilot" else "paid"),
                "personalization_hook": hook(row),
                "source": row["source"],
            }
        )
    return plan


def main() -> None:
    with LEADS_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    row_by_id = {row["id"]: row for row in rows}
    plan = build_plan(rows)

    with PLAN_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(plan[0].keys()))
        writer.writeheader()
        writer.writerows(plan)

    for item in plan:
        row = row_by_id[item["id"]]
        if not has_email(row):
            continue
        mode = item["outreach_mode"]
        if mode not in {"free_pilot", "paid_later"}:
            continue
        path = DRAFTS_DIR / f"{row['id']}.md"
        path.write_text(draft(row, mode, item), encoding="utf-8", newline="\n")

    free_items = [item for item in plan if item["outreach_mode"] == "free_pilot"]
    paid_items = [item for item in plan if item["outreach_mode"] == "paid_later"]
    expected_free = sum(float(item["harsh_free_pilot_acceptance_pct"].rstrip("%")) / 100 for item in free_items)
    expected_paid = sum(float(item["harsh_paid_conversation_pct"].rstrip("%")) / 100 for item in paid_items)

    SUMMARY_PATH.write_text(
        "\n".join(
            [
                "# Outreach send plan - 2026-07-01",
                "",
                "Harsh lower-end model for cold email.",
                "",
                f"- Free-pilot ask count: {len(free_items)}",
                f"- Expected accepted free pilots: {expected_free:.2f}",
                f"- Paid-later ask count: {len(paid_items)}",
                f"- Expected paid buying conversations from paid-later cold send: {expected_paid:.2f}",
                f"- Verify-before-send rows: {sum(1 for item in plan if item['outreach_mode'] == 'verify_before_sending')}",
                f"- No-email / do-not-send rows: {sum(1 for item in plan if item['outreach_mode'] == 'no_email_do_not_send')}",
                "",
                "Recommendation: send the 150 free-pilot emails first. Do not send the paid-later batch until 2-3",
                "free pilots have either produced feedback/testimonial proof or shown the offer is wrong.",
                "",
                "Top 20 free-pilot rows:",
                "",
            ]
            + [
                f"- {item['id']} {item['firm']} - {item['harsh_free_pilot_acceptance_pct']} - {item['personalization_hook']}"
                for item in free_items[:20]
            ]
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )

    print(f"wrote {PLAN_PATH}")
    print(f"wrote {SUMMARY_PATH}")
    print(f"refreshed {len(free_items) + len(paid_items)} drafts")
    print(f"expected_free_pilots {expected_free:.2f}")


if __name__ == "__main__":
    main()
