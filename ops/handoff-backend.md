# Backend Handoff — everything in one place

Hi 👋 — while your laptop was down, the backend got scaffolded for you (with your OK) and there are two
things you can do **right now without AI or coding**. Everything you need is on this page.

---

# Task 1 (no AI/code): hand-label a tender ⭐ do this first

## Your tender

**MAC (Metropolitan Arts Centre) — Cleaning Services ITT**
**It's in the repo:** `data/tenders/museum-cleaning-itt.pdf` — just `git pull` (no download needed).
(41 pages. Real cleaning ITT with published award criteria — Quality 40% / Commercial 60% — and clear
pass/fail gates.)

## Why you're doing this (the purpose)

The tool extracts tender requirements automatically. To **prove** it's good, we need a list a *human*
made by hand, then we compare the two. That gives the headline number for the demo:

> "Bidframe caught 98% of the requirements, and flagged the 2% it wasn't sure about."

No human answer key → no way to measure accuracy → no demo number. **Your hand-labelled list IS that
answer key.** Everyone on the team labels one tender; you've got the museum one. (J is doing SPSO.)

## What to do (≈1 hour)

1. **Download the PDF** (link above).
2. **Open the template** `gold-set/museum-cleaning.labels.csv` in Excel / Google Sheets / a text editor.
   (`git pull` first to get it.)
3. **Read the tender top to bottom.** Every time it tells the bidder to **do** or **meet** something,
   add one row.
4. **Fill these columns per requirement:**

   | Column | What to put | Example |
   |--------|-------------|---------|
   | `id` | g1, g2, g3… (a counter) | `g1` |
   | `text` | the requirement in your own short words | `Provide a named account manager` |
   | `type` | `mandatory` or `optional` | `mandatory` |
   | `is_gating` | `yes` if missing it = bid thrown out; else `no` | `no` |
   | `source_page` | page you found it on | `21` |
   | `source_clause` | section/heading if any, else blank | `Section 2.22` |
   | `notes` | anything tricky (optional) | |

5. **Save** it as `gold-set/museum-cleaning.labels.csv`, commit + push. (These CSVs DO get committed —
   they're small text answer keys, not the PDF.)

## How to spot a requirement

- **Mandatory:** "must", "shall", "is required to", "mandatory", "a condition of".
- **Optional:** "should", "may", "desirable", "preferred", "ideally".
- **Gating (`is_gating = yes`):** "pass/fail", "will be rejected/excluded", "failure to … will result in
  disqualification", minimum thresholds (min turnover, a certificate you must hold at submission).
- Check **tables** (pricing/eligibility rows) and **forms you must return** — easy to miss, they count.

## Three tips so you don't overthink it

- **When unsure, include it.** Over-capturing is fine; *missing* a real requirement is the bad outcome.
- **One demand = one row.** A sentence with two asks → two rows.
- **Don't read the tool's output first** — your independent read is what makes it a fair test.

It doesn't have to be perfect. A careful first pass is exactly what we want.

---

# Task 2 (when you can code again): take over the backend

The full pipeline was built + tested for you to **own** — review it, then carry it forward.

- **What's there** (`backend/app/`): `ingest.py` (PDF→text+pages; PyMuPDF + pdfplumber for tables) →
  `chunk.py` (overlapping, page-aware) → `extract.py` (**pluggable**: heuristic now, **OpenAI** when
  `OPENAI_API_KEY` is set) → `graph.py` (criteria_ref + depends_on) → `store.py` (SQLite) → all 3
  endpoints wired in `main.py`.
- **Tested:** end-to-end on 13 real tenders. A background stress-test loop is running and logging any
  breakage to `data/stress-log.md`.
- **Run it:** `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
  → API docs at `localhost:8000/docs`.
- **Your TODOs** are listed at the bottom of `backend/README.md` — the big ones: confirm the OpenAI path
  once we have the key, and add OCR for image-only pages (the Shropshire tender has 20 scanned pages we
  can't read yet).

---

**Questions?** Drop them on `comms/board-backend.md` and tag `@j`. Thanks! 🙏
