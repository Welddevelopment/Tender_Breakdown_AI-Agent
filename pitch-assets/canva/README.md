# Bidframe Canva Pitch Asset Pack

This folder collects the assets to build the Demo Day investor deck in Canva.
The deck direction is a balanced forest journey: credible civic-record product,
woodland atmosphere, and oxblood only for deal-breaker danger.

## Recommended Deliverables

1. Editable Canva presentation link.
2. PDF export backup.
3. PowerPoint export backup.
4. Optional 20-40 second demo clip or screen recording for Q&A/fallback.

## Brand Assets

Use these from `brand/`:

- `bidframe-logo-horizontal.svg` - current live-site lockup.
- `bidframe-logo-horizontal-reversed.svg` - current lockup for pine/dark backgrounds.
- `bidframe-logo-stacked.svg` - compact title/closing slide use.
- `bidframe-mark.svg` - current square mark.
- `bidframe-favicon.svg` and `bidframe-favicon-ink.svg` - tiny footer/QR use.
- `bidframe-og.png` - existing 1200x630 social/card graphic.
- `bidframe-owl-mark.svg` - recovered mascot mark from git history.
- `bidframe-owl-logo-horizontal.svg` - recovered owl lockup from git history.

Brand decision for this deck:

- The square clause-frame mark is the official logo.
- The owl is the mascot, used as a small personality detail, trail guide, or team-slide accent.
- Do not use the owl lockup as the primary wordmark unless the site brand changes too.

## Forest Assets

Use these from `forest/`:

- `hero-woodland-v2.webp` - opening forest background.
- `hero-foreground.webp` - lower foreground layer for trail depth.
- `leaf-shadow-overlay.png` - subtle leaf-shadow overlay.
- `fern-edge-overlay.png` - edge texture for transitions.
- `card-gallery-backdrop-v2.webp` - product-shot background.
- `proof-pine-depth-v2.webp` - dark proof/stat band.
- `closing-clearing-v2.webp` - final ask/closing background.

Use forest as atmosphere, not decoration. Keep product screenshots on warm paper
surfaces so the deck still feels like an official bid record.

## Demo Source

Use the existing product demo PDF:

- `frontend/public/demo/spso-cleaning.pdf` - the public-sector tender behind the pre-baked demo.

The live demo URL is `https://www.bidframe.org/demo`. Treat it as a cached real
pipeline run, not a fake mock. If claiming a live upload, verify the live-key
path on the day.

## Captured Screenshots

Captured at 16:9 desktop from `https://www.bidframe.org`:

1. `landing-hero.png` - `https://www.bidframe.org/`, first fold with headline and product sheet.
2. `demo-matrix-dealbreaker.png` - `/demo`, worked example sheet with `GatingHero` and matrix rows.
3. `demo-source-proof.png` - `/demo`, click "See a deal-breaker in the document"; show requirement beside PDF.
4. `answers-receipts-bottom.png` - `/answers`, drafted answer backed by evidence citation.
5. `answers-receipts-card.png` - `/answers`, gap-question card showing "asks instead of guessing".
6. `graph-marks.png` - `/graph`, split marks/map view.
7. `upload.png` - `/upload`, idle upload surface; use sparingly unless a processing-state capture is added.

Main deck should rely on the first three product screenshots; appendix can hold
the rest.

## Slide Asset Map

| Slide | Asset Direction |
|---|---|
| 1. Trailhead hook | `hero-woodland-v2.webp`, current logo, oxblood trail marker, headline. |
| 2. Tender 101 | Warm paper flow diagram; no screenshot needed. |
| 3. Marked path | `demo-matrix-dealbreaker.png`; oxblood callout around the deal-breaker. |
| 4. Trust layer | Four clearings/path graphic: deal-breakers, source links, evidence receipts, human approval. |
| 5. Source proof | `demo-source-proof.png`; proof ledger with scoped metrics. |
| 6. Evidence trail | `answers-receipts-bottom.png`; evidence citation. Use `answers-receipts-card.png` for the gap-question honesty beat. |
| 7. Market + ask | `proof-pine-depth-v2.webp` or `closing-clearing-v2.webp`; URL and investor/advice ask for scaling post-Demo Day. |

Appendix:

- Under the hood pipeline.
- Product surface gallery.
- Proof ledger and eval caveats.
- Market sources.
- Traction/outreach.
- Demo reliability.
- Competitive wedge.

## Copy/Data To Verify Before Export

- Market figures should use primary sources, not Wikipedia.
- Product metrics should be scoped to "worked example", "hero tender", or "measured set".
- Use: `gating recall 1.0`, `0 dangerous misses`, `0 bluffs`, and verified citation count only after confirming the latest source of truth.
- Do not claim broad "98% accuracy".
- Do not show raw confidence scores; use labels/beads.
- Say "drafts from your documents" and "asks instead of guessing"; avoid "writes your bid".
- Use "free pilots", "outreach", or "pilot pipeline" unless customer proof is confirmed.

## Team Slide

Names and roles only for now:

- Jawad Jalal - frontend.
- Bobby Choi - generalist.
- Pranav Bonagiri - backend.
- Joel Jeon - GTM, outreach, planning.

Suggested wording: "Built by a four-person team across product, backend,
generalist systems, GTM, and outreach. Everyone crossed roles to ship the demo."

Use nonliteral people illustrations from `team/` for personality:

- `jawad-jalal-frontend.svg`
- `bobby-choi-generalist.svg`
- `pranav-bonagiri-backend.svg`
- `joel-jeon-gtm.svg`

These are intentionally illustrative, not portraits. Keep names and roles as
editable Canva text rather than baked into the SVGs.

## Final CTA

Use the post-Demo Day scaling ask:

> We are looking for investors, operators, and procurement experts who can help
> us turn the demo into the default first-read layer for SME public-sector bids.

Short button/closing text options:

- Help us scale the first-read layer for public tenders.
- Bring advice, intros, or capital to help us keep building.
- Talk to us after the demo if you know bid teams, procurement, or public-sector software.
