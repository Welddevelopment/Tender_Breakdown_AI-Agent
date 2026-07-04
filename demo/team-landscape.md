# Team Landscape — synthesis (what it means for Bidframe)

> Synthesized from [`research/team-landscape-worker.md`](research/team-landscape-worker.md) (primary
> evidence: the pitch-session sheet CSV + 19 of 21 pitch decks read in full text; access failures
> logged there). Read the worker file for the full 28-row table.

## The headline facts

1. **Nobody else is doing tenders, bids, or procurement documents.** Across every retrieved deck and
   repo, zero teams touch our domain. "Tendere AI" is a name collision — verified via its README to be
   consultant staffing, not tendering.
2. **Conduct is the most crowded track (~10–12 entries) — but the crowd attacks legacy *code*.**
   KEEL, LegacyLift, Legacy Safety Net, Pactline all do code/system migration. Bidframe is the only
   retrieved entry where the legacy artifact is a **regulated document workflow** and the expert is a
   bid manager, not a developer.
3. **The track's demo grammar is commoditized.** Nearly every Conduct rival says some version of
   "AI does the work, human approves, everything is auditable" (KEEL's behaviour diffs, LegacyLift's
   review queue, Conducting KYC's evidence-verified claims, 3D RAMS' review gate, PlanningOS's
   evidence links). **Saying "human in control" will not differentiate us in this room.** Proving it
   with a *measured, held-out* eval will — no other deck retrieved shows a hand-labelled gold set, a
   held-out test, or an adversarial suite.
4. **We pitch LAST — 03:55–04:00, the final slot of the day** (after KEEL 02:55, Conducting KYC 03:30).
   Judges will have heard ~10 "human-gated AI" pitches by then. Implications: open with the concrete
   catch, not category framing; the last word before deliberation is ours — the closer matters more
   than usual; assume attention is tired — the oxblood wall and the PDF proof click are what survive.

## Threat board (same track or same grammar)

| Rival | Why they're a threat | Where we beat them (grounded) |
|---|---|---|
| **KEEL** | Sharpest conceptual framing in the field ("approve behaviour, not code"); same judges, an hour before us | Concept demo on a simulated rules engine; no live doc pipeline, no measured accuracy, no real artifact a buyer signs. We show a real 34pp public tender + held-out 10/10. |
| **LegacyLift** | Appears genuinely deployed (`app.legacylift.dev`), COBOL→Python review queue — the "they actually built it" halo | Code-only; no source-page traceability. Our excerpt-level grounding (exact sentence, exact page, in the actual PDF) is a physically different proof. |
| **Conducting KYC** | Closest to our trust grammar: "the model can't assert what it can't source", human decides; regulated domain; pitches 25 min before us | Different domain (KYC onboarding). No compliance-matrix artifact, no answer drafting, and — per its deck — no held-out accuracy measurement. We should expect judges to mentally compare us; the held-out number is the separator. |
| **PlanningOS** | Nearest public-sector document-AI comp (UK planning, multi-doc, evidence-linked) | Planning applications, not bids; recommendation output, not a decision-capture workflow; no gating/deal-breaker concept — our wedge (the miss that voids the bid) is sharper and scarier. |
| **3D RAMS / Pactline / Legacy Safety Net** | Same track, compliance/evidence-pack vocabulary | Niche artifacts (RAMS packs, ERP change packs, code specs); none extract obligations from an adversarial document with measured recall. |

Unassessed (decks unreachable — don't be surprised on the day): StorkAI (dashboard migration),
Max Lucas's Conduct entry (×2 slots, image-only PDF), AlphaChange Workbench, ~8 no-link rows.

## The whitespace, stated once

**Bidframe owns: legacy DOCUMENT workflow + regulated public money + a measured catch guarantee.**
Every element is uncontested in this field: no procurement rival, no document-extraction rival in
Conduct, and no rival anywhere showing held-out eval numbers. The unique sentence no other team in
the room can say: *"The tender on this screen was our held-out test — the pipeline had never seen it,
and it caught all ten hand-labelled deal-breakers."*

## Positioning implications (feeds demo-strategy.md)

1. **Demote "human in control" from headline to proof-point** — it's table stakes in this room by
   3:55pm. Keep saying it (it's scored), but as a shown fact (approve/edit/flag on screen), not as
   the differentiator.
2. **Promote the measurement apparatus to the differentiator** — gold sets, held-out tenders,
   adversarial suite, deterministic floor. Nobody else has it; judges fatigued by identical trust
   claims will grab onto the one team that measured theirs.
3. **Keep the domain wedge concrete and fast**: "£300bn+ of public money, and SMEs lose bids to one
   missed line on page 31" beats any category abstraction, especially in the last slot.
4. **Expect a mental KEEL/KYC comparison** — pre-empt with the physical proof click (the exact
   sentence highlighted in the actual PDF): it's the one demo moment none of the code-side rivals can
   physically replicate on a document.
5. **Last-slot tactics**: open on the catch inside 15 seconds; keep total ≤ 3:00; the verbatim closer
   is the last thing judges hear before deliberating — rehearse it hardest.
