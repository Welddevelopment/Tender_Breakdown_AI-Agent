# Bidframe — `/demo` scrollytelling design pack

> **How to use this:** paste this whole file into a fresh Claude design/artifact session, then
> iterate on the *feel*. Everything below constrains the prototype so it is born in Bidframe's real
> design language and uses only techniques we can ship — so bringing it back into the codebase is a
> mechanical port, not a redesign. When it feels right, paste the finished artifact back into Claude
> Code and it gets wired to the real components.

---

## 0. What to build

A **scrollytelling rework of the product demo page**. Bidframe reads a UK public-sector tender PDF and
turns it into a reviewed compliance matrix: it extracts every requirement, surfaces the *deal-breakers*
(pass/fail gates) first, flags what it is unsure of, and drafts answers from the bidder's own documents
with a citation. The demo should tell that pipeline as a **single scroll**: a pinned "stage" that
transforms through the beats while short narrative steps scroll past.

Deliver **one self-contained React component** (default export) — see §8.

---

## 1. Non-negotiable brand rules (this is a restrained "civic record", not a flashy SaaS site)

- **Two palettes, kept strictly apart.** *Brand* colours (paper/ink/forest) build all furniture —
  backgrounds, text, buttons, headings. *Signal* colours (oxblood/amber/yellow/green) **only ever mark
  status** — never a coloured slab, never on a button/heading/nav. **Oxblood = deal-breaker / error only.**
- **Forest is the one earned accent.** One green. Don't introduce new hues.
- **No pure white or black.** Warm paper `#f6f2e9` and ink `#211d17` are the extremes.
- **Confidence is never a number.** It's a dimensional bead (fill level + hue) with a word beside it.
- **Calm motion only.** No fade-up-on-*everything*. Motion should carry meaning (a deal-breaker settling
  last, an answer arriving). Every animation must be `prefers-reduced-motion` safe and degrade to a
  composed, readable end state.
- **Depth means focus.** Only the thing that deserves attention lifts off the page (the deal-breaker card).
- Type: **Fraunces** for headings, **Chillax** for body, **IBM Plex Mono** for evidence / clause refs /
  labels (kickers in mono, uppercase, wide tracking).

---

## 2. Design tokens — drop this `<style>` in so the artifact matches exactly

```css
:root{
  /* Brand */
  --paper:#f6f2e9; --paper-raised:#fbf8f1; --paper-recessed:#efe7d6;
  --ink:#211d17; --ink-muted:#6b6358;
  --forest:#2c5640; --forest-hover:#21412f;
  --hairline:#e4ddce;
  /* Signal (status only) */
  --oxblood:#8a2d2a; --amber:#bc6b2e; --yellow:#d2a435; --green:#6f9a57;
  /* Depth */
  --depth-sheet:0 6px 19px rgba(33,29,23,.10);
  --depth-row:0 2px 7px rgba(33,29,23,.07);
  --depth-pressed:inset 0 1.5px 3px rgba(33,29,23,.066);
  --depth-control:0 1.6px 2px rgba(33,29,23,.13), inset 0 1px 0 rgba(255,255,255,.13);
}
body{ background:var(--paper); color:var(--ink); font-family:"Chillax",system-ui,sans-serif; }

/* Faint ledger grid under the paper (graph-paper nod) */
.paper-grid{
  background-image:
    linear-gradient(to right, rgba(33,29,23,.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(33,29,23,.035) 1px, transparent 1px);
  background-size:32px 32px;
}
/* Paper grain — raised surfaces only, never the page or a scanning row */
.surface-grain{ position:relative; isolation:isolate; }
.surface-grain::after{
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  opacity:.25; mix-blend-mode:multiply; background-size:150px 150px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
/* The confidence bead material */
.conf-dot{
  width:20px; height:20px; border-radius:9999px;
  box-shadow:
    0 0 0 1px rgba(33,29,23,.42),
    inset 0 2px 1.5px rgba(255,255,255,.55),
    inset 0 -2px 2.5px rgba(33,29,23,.22),
    0 2px 3px rgba(33,29,23,.3);
}
```

> Map these to Tailwind arbitrary values, e.g. `bg-[var(--paper)]`, `text-[var(--ink-muted)]`,
> `border-[var(--hairline)]`, `shadow-[var(--depth-sheet)]`. (In our repo these are real Tailwind tokens
> — `bg-paper`, `text-ink-muted`, etc. — so keeping the names aligned makes the port trivial.)

---

## 3. Fonts — put these `<link>`s in the artifact `<head>`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=chillax@400,500,600&display=swap" rel="stylesheet">
```

Font stacks: headings `"Fraunces", Georgia, serif` · body `"Chillax", system-ui, sans-serif` ·
mono/evidence `"IBM Plex Mono", ui-monospace, monospace`.

---

## 4. Component look references — match these (the prototype approximates; the real components already
exist in-repo, so exact class parity is a bonus, not a requirement)

**Kicker (mono label):**
```html
<p class="font-mono text-xs uppercase tracking-wide text-[var(--ink-muted)]">Worked example</p>
```

**Confidence bead** (fill LEVEL + hue carry the tier; word keeps it greyscale-safe). Tiers:
`oxblood #8a2d2a @30%` = "Can't answer this" · `amber #bc6b2e @52%` = "Low confidence" ·
`yellow #d2a435 @76%` = "Fairly sure" · `green #6f9a57 @100%` = "Confident".
```html
<span class="inline-flex items-center gap-2.5 text-sm text-[var(--ink-muted)]">
  <span class="conf-dot inline-block shrink-0"
        style="background:linear-gradient(to top,#d2a435 0%,#d2a435 76%,var(--paper-recessed) 76%,var(--paper-recessed) 100%)"></span>
  <span>Fairly sure</span>
</span>
```

**Deal-breaker card** (the hero moment — the one element that lifts; 2px oxblood reading edge + glossy
oxblood dots, on a grained raised sheet):
```html
<section class="surface-grain rounded-r-lg border-y border-r border-[var(--hairline)] border-l-2 border-l-[var(--oxblood)] bg-[var(--paper-raised)] p-5 shadow-[var(--depth-sheet)]">
  <p class="font-mono text-xs font-medium uppercase tracking-wide text-[var(--oxblood)]">Deal-breakers</p>
  <h2 class="mt-2 font-[Fraunces] text-lg font-semibold leading-snug text-[var(--ink)]">
    2 requirements that would disqualify the bid if missed
  </h2>
  <ul class="mt-4 flex flex-col gap-2.5">
    <li class="grid grid-cols-[auto_1fr] items-start gap-x-2.5 text-sm text-[var(--ink)]">
      <span class="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--oxblood)]
            shadow-[0_0_0_1px_rgba(33,29,23,.35),inset_0_1px_1px_rgba(255,255,255,.3),0_1px_2px_rgba(33,29,23,.3)]"></span>
      <span class="leading-snug">The supplier must hold current ISO 9001 certification valid for the full contract term.
        <span class="ml-2 font-mono text-xs text-[var(--ink-muted)]">p.14 · Section 4.2.1</span>
      </span>
    </li>
  </ul>
</section>
```

**Ordinary requirement row** (for the scanning matrix — a quiet row: bead, text, mono clause ref; NO
grain, NO lift — depth is reserved for the deal-breaker):
```html
<div class="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-[var(--hairline)] py-3">
  <span class="conf-dot mt-0.5" style="width:14px;height:14px;background:linear-gradient(to top,#6f9a57 0%,#6f9a57 100%,var(--paper-recessed) 100%)"></span>
  <p class="text-sm leading-snug text-[var(--ink)]">Provide at least three public-sector case studies from the last five years.
    <span class="ml-2 font-mono text-xs text-[var(--ink-muted)]">p.31 · Section 8.2</span></p>
  <span class="font-mono text-[11px] text-[var(--ink-muted)]">Confident</span>
</div>
```

**Answer, with a receipt** (autofill payoff — a forest-edged answer block that cites the source doc):
```html
<div class="surface-grain rounded-lg border border-[var(--hairline)] bg-[var(--paper-raised)] p-5 shadow-[var(--depth-row)]">
  <p class="font-mono text-xs uppercase tracking-wide text-[var(--ink-muted)]">Requirement</p>
  <p class="mt-1 leading-snug text-[var(--ink)]">The supplier must hold ISO 9001 certification.</p>
  <div class="mt-4 rounded-md border-l-2 border-[var(--forest)] bg-[var(--paper)] p-3">
    <p class="leading-relaxed text-[var(--ink)]">We hold ISO 9001:2015, certified by a UKAS-accredited body, valid for the full contract term.</p>
    <p class="mt-2 font-mono text-xs text-[var(--ink-muted)]">Backed by your Capability Statement, p.4.</p>
  </div>
</div>
```

**Approval stamp** (a clean forest mark set slightly off-axis, mono audit line beside it):
```html
<span class="inline-flex items-center gap-3">
  <span class="inline-flex items-center gap-1.5 rounded-md border-2 border-[var(--forest)] px-2.5 py-1 text-[var(--forest)] [transform:rotate(-3deg)]">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="font-mono text-[11px] font-medium uppercase tracking-wide">Approved</span>
  </span>
  <span class="font-mono text-xs text-[var(--ink-muted)]">Approved by you, 14:32.</span>
</span>
```

**Primary button** (forest): `bg-[var(--forest)] text-[var(--paper)] rounded-md px-5 py-2.5 text-sm font-semibold shadow-[var(--depth-control)] hover:bg-[var(--forest-hover)]`.
**Dark band** for closings: `bg-[var(--ink)]` with `text-[var(--paper)]`.

---

## 5. Sample data — the `Requirement` shape + real objects to script the stage with

```ts
type Requirement = {
  id: string; text: string; source_page: number; source_clause: string | null;
  type: "mandatory" | "optional"; is_gating: boolean; category: string;
  confidence: number;            // 0..1 — render as a bead, NEVER a number
  needs_review: boolean;
  answer?: { text: string; state: "auto"|"needs_input"|"human_edited"|"empty";
             evidence_refs: { doc_id: string; excerpt: string; page: number }[]; confidence: number } | null;
};

const SAMPLE: Requirement[] = [
  { id:"req-0001", text:"The supplier must hold current ISO 9001 certification valid for the full contract term.",
    source_page:14, source_clause:"Section 4.2.1", type:"mandatory", is_gating:true, category:"certification",
    confidence:0.96, needs_review:false,
    answer:{ text:"We hold ISO 9001:2015 (UKAS-accredited). We need to confirm validity covers the full contract term.",
      state:"needs_input", confidence:0.54,
      evidence_refs:[{ doc_id:"cap-002", excerpt:"Quality accreditations: ISO 9001:2015 certified (UKAS-accredited body).", page:1 }] } },
  { id:"req-0002", text:"Bidder must be Cyber Essentials Plus certified at the date of submission.",
    source_page:22, source_clause:"Section 6.1.3", type:"mandatory", is_gating:true, category:"certification",
    confidence:0.94, needs_review:false,
    answer:{ text:"We hold Cyber Essentials Plus, certified and valid at the date of submission.",
      state:"auto", confidence:0.86,
      evidence_refs:[{ doc_id:"cap-002", excerpt:"Cyber Essentials Plus: certified (annual reassessment current).", page:2 }] } },
  { id:"req-0003", text:"Minimum annual turnover of £2,000,000 in each of the last two financial years.",
    source_page:8, source_clause:"Section 3.4", type:"mandatory", is_gating:true, category:"financial",
    confidence:0.91, needs_review:true,
    answer:{ text:"We meet the minimum turnover threshold; exact figures to be confirmed by the bid team.",
      state:"needs_input", confidence:0.40, evidence_refs:[] } },
  { id:"req-0004", text:"Provide at least three relevant public-sector case studies from the last five years.",
    source_page:31, source_clause:"Section 8.2", type:"mandatory", is_gating:false, category:"experience",
    confidence:0.82, needs_review:false, answer:null },
  { id:"req-0005", text:"Response times: priority-one incidents acknowledged within 30 minutes.",
    source_page:44, source_clause:"Section 9.5", type:"mandatory", is_gating:false, category:"service-levels",
    confidence:0.71, needs_review:false, answer:null },
];
```

---

## 6. The scrollytelling spec — pattern + technique (both constrained so it ports 1:1)

**Pattern: sticky stage + stepping narrative.** A pinned **stage** (`position: sticky; top:0; height:100vh`)
holds one product visual that transforms through the beats. Beside/over it, a column of tall **step**
sections scroll past; as each enters, it becomes the active step and the stage renders that beat's state.

**Technique — use ONLY these (no scroll library):**
- Detect the active step with **`IntersectionObserver`** (one observer over the step sections; trigger
  when a step crosses roughly the viewport centre, e.g. `rootMargin: "-45% 0px -45% 0px"`). Set an
  `activeStep` index in state from the callback. **Do not** use scroll-event listeners, GSAP, ScrollTrigger,
  framer-motion, Lenis, or any dependency — the target codebase ships none of these and has strict
  React-compiler lint (no `setState` synchronously inside effects; do observer setup in a `useEffect`
  and update state from the observer callback, which is fine).
- Animate with **CSS transitions** on `opacity` / `transform` only (cheap, GPU-friendly). Keep it calm.
- **`prefers-reduced-motion` fallback (required):** when reduced motion is set, render the steps stacked
  in normal flow with the stage showing its **final** composed state (or a small static visual per step),
  no pinning, no transitions. It must read perfectly with zero motion.
- **Mobile (`< lg`) fallback (required):** the sticky split doesn't work on a phone. Collapse to a single
  linear column — each step followed by its own small inline visual (or the stage un-pinned above the
  steps). Design this, don't leave it to chance.

**Separate content from rendering:** put the script in a `STEPS` array and switch the stage on the index.

```ts
type Step = { id: string; kicker: string; heading: string; body: string; stage: StageKey };
```

---

## 7. The story beats (the script — 6 steps + a close)

Each beat = one narrative step (kicker + Fraunces heading + one/two sentences) and one stage state.

| # | Kicker | Heading | Body (approx) | Stage shows |
|---|--------|---------|---------------|-------------|
| 1 | The problem | A hundred pages, read by hand | A bid writer spends weeks reading a public tender. The line that voids the bid looks like every other line. | A dense, faint wall of tender paragraphs (unreadable body text) filling the stage. |
| 2 | Extraction | Bidframe reads the whole thing | Every requirement pulled out with its clause and page — nothing lost at a page break. | The wall resolves into a tidy list of ~5 quiet requirement rows (they settle in, staggered). |
| 3 | The catch | The deal-breaker, first | Public tenders have hard pass/fail gates. Bidframe lifts them to the top so you see the bid-killer before anything else. | The two `is_gating` items **rise out of the list** and compose into the oxblood deal-breaker card (the one lift). |
| 4 | Honesty | It tells you when it isn't sure | Where it's unsure it says so and flags it, instead of dressing a guess up as an answer. | Confidence beads appear on the rows; the low-confidence / `needs_review` one (req-0003) is clearly the amber/oxblood one. |
| 5 | Autofill | Answers, with receipts | It drafts each answer from your own documents and shows exactly which one it came from. | The "answer, with a receipt" card draws in (forest edge + citation line). |
| 6 | Control | You approve every line | You approve, edit, or flag each one. Nothing goes in the bid you didn't sign off. | The approval stamp settles onto the answer card. |
| — | Close | See it on a tender you already know | Book fifteen minutes and bring one. | Dark ink band, centred, one forest **Book a demo** button (+ a quiet link into the product). |

Keep copy in British English, provisional and honest (no hype, no em-dashes in UI copy, confidence never
as a number).

---

## 8. Output format + constraints (so the port is mechanical)

- **One self-contained React function component, default export.** Hooks only (`useState`, `useEffect`,
  `useRef`). No external packages.
- **Tailwind utility classes** for layout/spacing (assume Tailwind is available); the token CSS from §2
  and font `<link>`s from §3 injected via a `<style>`/`<link>` (or a top-level effect). Prefer the
  `var(--token)` names shown so they map straight onto our real Tailwind tokens.
- **`STEPS` array** drives everything; a `<Stage step={active} />` switches the visual.
- Include the **reduced-motion** and **mobile** fallbacks (§6).
- Don't rebuild the real product — approximate the visuals with the §4 references. In the codebase these
  become the actual `<GatingHero>`, `<ComplianceMatrix>`, `<ConfidenceIndicator>`, `<ApprovalStamp>`
  components, so keep the stage's structure component-shaped (one element per beat) and easy to swap.

**When it feels right:** paste the finished component back into Claude Code and say *"port this to
`/demo` (`DemoView`) using our real components + Tailwind tokens; keep the scroll mechanics, thresholds
and timing; IntersectionObserver only; keep the reduced-motion + mobile fallbacks."*
