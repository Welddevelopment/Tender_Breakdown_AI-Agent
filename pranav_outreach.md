# 📤 Pranav — SEND THE OUTREACH (start here)

Joel was up past 3am and is asleep. **Everything is ready — your job this morning is to send the 39
personalised outreach emails.** This file is self-contained; you should not need Joel to start.

> This is the canonical instruction file. A few helper files (a priority ranking and a best-contact
> review) are being generated overnight and will appear on `main` by morning — see **§6**.

---

## 1. What's ready
**39 personalised, web-verified cold emails**, one per PERFECT-fit lead, in **`crm/perfect_drafts/`**
(`MT-01-*.md` … `MT-115-*.md`). Each file contains:
- a heading `## MT-XX · Firm Name · recipient@email` ← the **send-to address**
- `**Subject:**` … ← the subject line
- the **email body** — everything from `Hi …` down to and including the `Joel · Bidframe` sign-off
- a `_Why this fit:_` note and a `## Verification` block ← **INTERNAL — do NOT send these**

Each lead is a genuinely tiny firm (family/owner-run) that bids for public-sector work **and has a
named public-sector client we verified** — that combination is why these 39 are the highest reply odds.

## 2. How to send each one
1. Send an email **to** the address in the file's heading, with that **Subject**, and the **body**
   (from `Hi …` through `Joel · Bidframe`). **Do not paste** the `## MT-XX` heading, the `_Why this
   fit:_` line, or the `## Verification` block.
2. **From:** the Bidframe / Joel outreach address. The emails are signed "Joel · Bidframe" and the
   booking link is Joel's, so they must come from **Joel's account or a `bidframe.org` address**.
   **⚠️ If you don't have access to that sending account:** do everything else (QA, ordering, queue
   them / build a mail-merge draft) and **message Joel to fire them** — do NOT stall the whole run.
3. Space them across the morning (not one burst — spacing looks less like a blast).

## 3. 10-second QA before each send
- Both links present + correct: booking **https://cal.com/joel-jeon-o29lfr/bidframe** · site
  **https://www.bidframe.org** (LIVE custom domain — verified serving the landing page).
- **⚠️ MT-57 (Hall Aspects Roofing) — CHECK OR SKIP:** send-to `info@hallaspects.com` could NOT be
  verified on their site (only a phone / quote form). Confirm it's valid before sending, or skip it.
- These 4 already had unverifiable claims softened and are **fine as-is**: MT-40 (ATCL), MT-08 (DACCS),
  MT-75 (AJM), MT-115 (InspireGreen). No action needed.
- Every other lead: verified clean (email, named public-sector client, contact name all confirmed).

## 4. Order — send best-first
1. **All 39 PERFECT fits first** (highest reply odds). Use the **priority ranking** in
   `outreach-priority-ranking.md` (see §6) to send the 🔥 "fire first" tier at the start of the morning.
2. If you have time after, the broader emailable CRM (`crm/leads.csv`, `status = Not contacted /
   verified / High`) — reuse the template in `outreach-demo-day.md`, personalised per row.

## 5. Log it + the ONE thing that matters most
- **Log sends:** mark each lead's `status` → contacted in `crm/leads.csv` as you go so nobody
  double-sends. (Codex owns `crm/leads.csv` + `crm/drafts/` — coordinate before writing there.)
- **🔴 WHEN A TENDER COMES BACK — flag it to J immediately (comms board).** The emails ask each
  prospect to *send their tender ahead of the call*. The moment one lands, we hand-prep that tender
  through Bidframe so the call is a polished walkthrough of their **real document** — that's the whole
  strategy. Don't sit on it.

## 6. Overnight helper files
- **`outreach-priority-ranking.md`** — ✅ **DONE, on `main` now.** The 39 sorted into 🔥 fire-first (13,
  in send order) / high / standard tiers, with a "why" per tier and a ⭐ 6-lead shortlist worth an extra
  hand-tailored touch. **Send in this order** — start with the Fire-first 13, top to bottom.
- **`crm/best-contact-review.md`** — ⏳ *may be late* (the research agent hit an overnight usage cap; being
  finished after the reset). When present, it says whether a better *publicly-listed* direct email exists
  per lead — if so, use that address instead of the draft heading. **Don't wait for it:** if it's not
  there, send to the address already in each draft heading. It's a refinement, not a blocker.
- **`outreach-new-leads-overnight.md`** — ⏳ *may be late* (same cap). Extra leads beyond the 39, a warm
  backlog for **after** the 39 are out. Not needed to start.

> **Bottom line: you can send all 39 right now with just the drafts + the ranking. The other two files
> only refine/extend — never block on them.**

## 7. Tone note
Deliberately understated — a founder being helpful, with a light "worth booking today" nudge (Joel
tuned this carefully; **don't crank the urgency**, it reads as desperate). The custom domain
`https://www.bidframe.org` is live and needs no login/backend; the owl logo is restored on `main`.

---
**TL;DR:** send the 39 in `crm/perfect_drafts/` (subject + body only) from Joel's/bidframe.org address,
best-first per `outreach-priority-ranking.md`, QA the two links + MT-57, log sends, and **ping J the
instant a tender comes back.**
