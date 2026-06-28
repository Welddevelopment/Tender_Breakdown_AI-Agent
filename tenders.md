# Tender Sourcing Log

> Shared list of tenders we've sourced. **The PDFs themselves are NOT committed** (`.gitignore` blocks
> `*.pdf`; save them in `data/tenders/`, which is gitignored). This file just tracks *what* we have,
> its fit for Bidframe, and whether it parses. Sourcing how-to: [sourcing-playbook.md](sourcing-playbook.md).

**Parse check:** `python backend/scripts/parse_check.py data/tenders/<file>.pdf`
**Save location:** `data/tenders/` (gitignored — never commits)

| Tender | Buyer | Type / niche fit | Value | Source (direct download) | Parse | Notes |
|--------|-------|------------------|-------|--------------------------|-------|-------|
| Cleaning Services ITT | SPSO (Scottish Public Services Ombudsman) | Services · cleaning ✅ strong fit | — | [direct PDF](https://www.spso.org.uk/sites/spso/files/2013%20SPSO%20Invitation%20to%20Tender%20-%20Cleaning%20Services.pdf) | ✅ **13pp, clean text** | First confirmed tender. Has a cleaning spec (Appendix 1) — good for extraction. Closed/historic = fine for testing. |
| Communal Cleaning (NW/Cumbria) | Home Group | Services · cleaning ✅ strong fit | £500k | housingprocurement.com (ProContract — **needs buyer approval**, slow) | ⬜ pending | Live tender w/ award criteria Quality 60/Cost 40. Good for traction later; portal approval too slow for Day-1 testing. |

## Candidate direct-download sources (no registration) — grab more from here

- [Shropshire Council — Security & Cleaning (disclosed)](https://next.shropshire.gov.uk/media/eiwl0soe/rmcb053-the-provision-of-security-and-cleaning-disclosed.pdf)
- [Museum cleaning ITT v1.3](https://museuminsider.co.uk/wp-content/uploads/2016/02/Cleaning-ITT-Version-1.3-FINAL-1.pdf)
- [Bradwell Parish Council — full ITT pack (grounds maintenance)](https://www.bradwell-pc.gov.uk/_UserFiles/Files/ITT%20pack%20final%20july%202025-min.pdf)
- [GOV.UK Example/Test ITT](https://assets.publishing.service.gov.uk/media/5c0eec5740f0b60c1ec239a4/Test_ITT_Output.pdf) (simple — good first smoke test)
- **Trick:** Google `filetype:pdf "invitation to tender" <sector> council`, or use Contracts Finder direct attachments `contractsfinder.service.gov.uk/Notice/Attachment/<id>`.

## The demo set we're building toward

- **1 clean hero** (SPSO is a candidate — needs an obvious gating requirement; check the pack).
- **2–3 ugly** (tables/multi-column/scanned) to prove it survives the messy real world.
- **4 gold-set labels** (one per person, EOD Day 2).

### Changelog
- **2026-06-28** — SPSO cleaning ITT sourced + parse-confirmed (Day-1 hour-one check ✅). Home Group logged for traction (portal approval too slow for now).
