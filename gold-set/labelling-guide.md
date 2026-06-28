# Gold-Set Labelling — plain-English guide

## What this is (in one sentence)

You read a real tender yourself and write down the **true list of requirements** — so we have a
human-verified "answer key" to score the tool against.

## Why we do it

The tool extracts requirements automatically. But how do we know it's any good? We compare its output
to a list a **human** made by hand. That comparison gives us the headline number for the demo:

> "We caught 98% of the requirements, and flagged the 2% we weren't sure about."

No human answer key → no way to prove the tool works. This is that answer key. It's also genuinely
useful: reading one real tender end-to-end makes you sharper about the whole product.

> 📄 **The tender PDFs are in the repo** at `data/tenders/` — just `git pull` and they're there
> (e.g. `data/tenders/spso-cleaning.pdf`, `data/tenders/museum-cleaning-itt.pdf`). No download needed.

## The job

Read one tender. Every time you find something the bidder **must** or **should** do (to be allowed to
bid, to comply, or to score points), write it down as **one line** in the template. That's it.

Each person labels a **different** tender (see your handoff). The example below uses SPSO, but use
whichever tender you were assigned — the steps are identical.

## Step by step

1. Open the tender PDF (`data/tenders/spso-cleaning.pdf`).
2. Open the template (`gold-set/spso-cleaning.labels.csv`) in Excel, Google Sheets, or a text editor.
3. Read through the tender top to bottom.
4. Each time you hit a requirement, add a row with these columns:

| Column | What to put | Example |
|--------|-------------|---------|
| `id` | g1, g2, g3… (just a counter) | `g1` |
| `text` | the requirement in your own short words | `Prices must be held firm for 45 days` |
| `type` | `mandatory` or `optional` | `mandatory` |
| `is_gating` | `yes` if missing it = bid thrown out; else `no` | `no` |
| `source_page` | the page number you found it on | `4` |
| `source_clause` | the section/heading if there is one, else blank | `Section 3` |
| `notes` | anything tricky/uncertain (optional) | `ambiguous wording` |

5. Save. Done.

## What counts as a requirement?

Anything the bidder is **told to do or meet**. Look for these signal words:
- **Mandatory:** "must", "shall", "is required to", "mandatory", "a condition of".
- **Optional:** "should", "may", "desirable", "preferred", "ideally".
- **Gating (`is_gating = yes`):** "pass/fail", "will be rejected/excluded", "failure to … will result
  in disqualification", minimum thresholds (minimum turnover, a certificate you must hold at submission).

Include requirements hiding in **tables** (e.g. a pricing or eligibility table) and **forms you must
return** — those are easy to miss and they count.

## Tips (so you don't overthink it)

- **Recall first.** If you're unsure whether something's a requirement, **include it** — it's better to
  over-capture than to miss one. (Missing a real requirement is the worst case.)
- **One obligation per row.** If a sentence has two demands, make two rows.
- **Don't read the tool's output first.** The point is YOUR independent read — that's what makes it a
  fair answer key. (Compare afterward if you like.)
- It doesn't have to be perfect. A careful first pass is exactly what we want.

## What happens to it

The generalist's eval harness loads your CSV + the tool's output for the same tender, and computes:
**recall** (did the tool catch all your requirements), **precision** (were the tool's finds real), and
**mandatory/gating accuracy**. That produces the demo number. Everyone labels one tender → four answer keys.

## Where to save

Put your finished file in this folder: `gold-set/<tender-name>.labels.csv`. These DO get committed
(they're small text answer keys, not the PDFs). One file per tender.
