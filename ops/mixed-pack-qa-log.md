# Mixed-pack sprint — Release & QA log (J)

Living doc for the release owner. Brief: [`mixed-pack-04-release-qa.md`](mixed-pack-04-release-qa.md).
Product wording: **"Upload the tender pack."** Never "Office / Microsoft integration."

## Status: backend (01) + frontend (03) landed, gate GREEN ✅ — awaiting generalist (02)
End-to-end works at ingest+net: backend `ingest_document` reads DOCX/XLSX/CSV, the deterministic net
catches every planted gate, engine suite 230 pass. Frontend gates the PDF highlight to PDF sources.

**One-command gate:** `python -m engine.scripts.mixed_pack_smoke` — Phase A (format-neutral net over all
4 fixtures) is green now; Phase B (backend reads the pack) auto-activates when lane 01 exposes a non-PDF
ingest entrypoint. Re-run it as each lane lands; it prints the manual checklist items too.

## Fixture inventory — `fixtures/mixed-pack/` (committed, synthetic)
| File | Format | Planted deal-breakers | Purpose |
|---|---|---|---|
| `sample-return-forms.docx` | Word | 4 (deadline, EL ins £5m P/F, PL ins £10m P/F, Form of Tender return) | DOCX ingest |
| `sample-pricing-schedule.xlsx` | Excel (`Pricing` sheet) | 2 (completed/returned-or-rejected, deadline/excluded) | XLSX ingest |
| `sample-compliance.csv` | CSV | 1 (anti-collusion cert or exclusion) | CSV ingest |
| *(use any `data/tenders/*.pdf`)* | PDF | — | the PDF part of the pack |

**7 planted gates** total; expected extractions per file in [`fixtures/mixed-pack/README.md`](../fixtures/mixed-pack/README.md).
Verified: all three re-open cleanly and the deterministic net (`engine.gating_scan`) flags the planted lines.

## Command / result log
| When | Command | Result |
|---|---|---|
| Hour 0 (baseline) | `python -m pytest engine/tests` | **223 passed, 1 skipped** ✅ |
| Hour 0 (baseline) | `cd frontend && npm run build` | ✅ compiled, 18/18 routes, TS clean |
| Hour 0 (baseline) | `cd frontend && npm run lint` | 0 errors, 2 pre-existing warnings (unused `Link` in MatrixView) |
| Frontend lane 03 landed (`ec5545f`) | `npm run build` + smoke | ✅ FE build green; `source-doc.ts` gates the PDF highlight to `kind==="pdf"` (no fake highlight on Office rows) |
| **Backend lane 01 landed (`b74ff42`)** | `python -m engine.scripts.mixed_pack_smoke` | ✅ **Phase B GREEN** — backend `ingest_document` reads DOCX/XLSX/CSV; net catches **28 / 10 / 4** gates |
| Backend lane 01 landed (`b74ff42`) | `python -m pytest engine/tests` | ✅ **230 pass / 2 skip** (+7 backend tests: `test_ingest_office`, `test_upload_mixed_pack`) |
| — | *(generalist lane 02 pending)* | |

## Release gate — ship only if ALL true (from brief 04)
- [ ] PDF-only path remains green (baseline: engine 223 pass, FE build green — **compare against this**).
- [ ] Mixed pack upload does not crash.
- [ ] Every requirement has `source_filename`.
- [ ] Non-PDF requirements show a source excerpt and locator.
- [ ] No fake PDF highlight appears for non-PDF files.
- [ ] Unsupported files fail clearly.

## Cut lines (decide before the clock runs out)
- **First cut:** drop ZIP, drop `.xls`.
- **Second cut:** keep `.docx` / `.xlsx` / `.csv`; Office source rows show excerpt only (no highlight).
- **Final cut:** keep PDF live; ship "Word/Excel coming" copy only if backend isn't ready — **never claim support the product can't deliver.**

## Demo truth (safe wording once it ships)
> Bidframe now reads tender **packs**, not just PDFs — the main ITT, Word response templates, and spreadsheet
> schedules into one source-backed compliance matrix.

Avoid: "we integrate with Microsoft Office" · "we perfectly preserve every cell, comment and formula."

**For the 3:55 demo (frozen PDF) Q&A — "can it read Word/Excel?":** *"The stage demo is the frozen PDF run. Reading
the full pack — PDF plus Word return forms and Excel pricing schedules — into the same matrix is what we're
shipping today; the deal-breaker net is already format-neutral."* (Only claim shipped once the release gate is green.)
