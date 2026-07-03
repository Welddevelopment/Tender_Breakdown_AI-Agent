# Pitch Improvements

> Source notes: post-stagecraft feedback after `420bdfe`, when the two-beat stop-sign, clearing arrival, and presenter keys were already live.  
> Purpose: turn the loose pitch-deck ideas into a triaged backlog the team can use before demo day and afterward.

## Fast Read

If time is tight, take this cut first:

1. **Survive a refresh** - persist the current slide and beat in `sessionStorage` and mirror it in the URL hash.
2. **Keep the Ask slide simple** - QR was removed on 2026-07-03; leave the visible `bidframe.org` and `/demo` links as the CTA.
3. **Retune autoplay and add an elapsed timer** - the shorter copy needs shorter holds, and the speaker needs a quiet clock.
4. **Auto-hide the cursor in fullscreen** - small stage detail, big perceived polish.
5. **Animate the GBP 341bn proof figure and draw the trail** - make the room look exactly where the story wants them to look.
6. **Add a product proof click** - tap a deal-breaker row on the Product slide and reveal the source excerpt.
7. **Create an eval field-note appendix** - give Q&A a clean proof slide for the validated deal-breaker numbers.

Next work should be **polish and confidence only**: visual QA, rehearsal timing, proof wording, and recovery paths. Avoid new stage mechanics before demo day.

## Priority Triage

| Priority | Idea | Why it matters | Effort | Risk | Best owner |
| --- | --- | --- | --- | --- | --- |
| P0 | Refresh survival | Accidental refresh should resume at the same slide and beat. | Low | Low | Frontend |
| P0 | Ask CTA simplification | QR removed; keep typed URLs legible and uncluttered. | Low | Low | Frontend/J |
| P0 | Autoplay retune + elapsed timer | Keeps the pitch inside 3 minutes and helps handoffs. | Low | Low | Frontend/J |
| P0 | Cursor auto-hide | Removes a common projector distraction. | Low | Low | Frontend |
| P0 | Stop-sign rehearsal note | The pause is now speaker-controlled, so it needs muscle memory. | None | Low | All speakers |
| P1 | Product source peek | Proves "every line is checkable" in one click. | Medium | Low | Frontend |
| P1 | GBP 341bn count-up | Makes the stakes figure land as an event. | Low | Low | Frontend |
| P1 | Draw-on trail journey | Turns the forest-route metaphor into motion. | Medium | Low | Frontend |
| P1 | Eval field-note appendix | Gives defensibility in Q&A without crowding the main deck. | Low | Low | J/Generalist |
| P1 | Cinematography pass | Makes the whole deck feel authored, not assembled. | Medium | Low | Frontend |
| P2 | Demo portal inside deck | Biggest stage impact: the pitch becomes the product tour. | Medium | Medium | Frontend |
| P2 | Presenter console | Improves four-person handoffs and timing discipline. | Medium | Low | Frontend |
| P2 | Scrollytelling twin | Turns the deck into a self-narrating follow-up artifact. | High | Medium | Frontend/J |
| P3 | Live ingest finale | Highest credibility, highest stage risk. Only worth doing with a rehearsed fallback. | High | High | All |
| P3 | Funnel instrumentation | Useful after demo day for investor/follow-up tracking. | Medium | Medium | Frontend/J |
| P3 | Slides as data | Worth it when the deck becomes a repeatable sales asset. | Medium | Medium | Frontend/J |

## Stage Safety

These are not decorative. They reduce the chance of a stage stumble.

### 1. Survive a Refresh

Persist:

- Main slide index.
- Sub-beat state, especially the stop-sign resolved/unresolved beat.
- Whether shortcut/help/Q&A overlays are open.

Implementation shape:

- Write state to `sessionStorage` on navigation.
- Mirror the main slide in the hash, for example `/pitch#4`.
- On load, prefer a valid hash, then `sessionStorage`, then slide 1.
- Printed export should still force the final/resolved state where needed.

Acceptance check:

- Refresh on every slide.
- Refresh between the two stop-sign beats.
- Open a deep link directly to each main slide.
- Go backward from a later slide and confirm the stop-sign lands in the correct resolved state.

### 2. Retune Autoplay and Add a Quiet Timer

The copy has been tightened, so the old timings can feel slow.

- Run one spoken rehearsal and retime slides 4 to 6.
- Add a small elapsed-time chip near the controls, hidden in export.
- Show only elapsed time, not a stressful countdown, unless rehearsal proves countdown helps.
- Let manual navigation remain the source of truth. Autoplay should assist, not fight the presenter.

### 3. Auto-Hide Cursor in Fullscreen

- Hide the cursor after about 2 seconds of inactivity.
- Restore it immediately on mouse movement.
- Scope it to the pitch surface, not the whole app.
- Disable the behavior in non-fullscreen editing/dev contexts if it becomes annoying.

### 4. Stage Device Checklist

Add this to the pre-show routine:

- Disable notifications and focus apps.
- Open `/pitch`, `/demo`, and the PDF export in separate ready tabs.
- Test `1` to `7`, `Q`, `?`, and `Esc`.
- Test reduced-motion mode once.
- Test the projector aspect ratio and browser zoom.
- Keep a PDF export ready as the no-browser fallback.

## Audience-Facing Wins

These are the visible improvements most likely to change the room's reaction.

### 1. Ask CTA Simplification

The Ask slide should stay calm and easy to read.

- Do not re-add a QR code before demo day.
- Keep `bidframe.org` and `bidframe.org/demo` visible as the action.
- Make sure the URLs are legible from the back of the room.
- Leave enough pause on the Ask slide for people to photograph or type the URL.

### 2. Product Source Peek

On the Product slide:

- Let the speaker click/tap a deal-breaker row.
- Slide up the exact source excerpt and page/clause reference.
- Keep it read-only and deterministic, using cached data.
- Use the same "exact vs approximate" honesty language as the source-verification work.

Why this matters: one click proves "every line checkable" better than another explanatory slide.

### 3. Animate the GBP 341bn Figure

- Count the figure up when the slide lands.
- Use tabular figures, hairline rules, and a source marker.
- Keep the final state static for print export.
- Respect reduced motion by rendering the final number immediately.

### 4. Draw-On Journey

On the trail-map slide:

- Draw the dashed route as the slide arrives.
- Light the four steps in sequence.
- Mark the danger point with the oxblood blaze on stop 3.
- Let the walked portion carry a faint warm glow so the deck feels navigated, not clicked through.

### 5. Eval Numbers Field Note

The proof-ledger caveat now has strong validated claims behind it. Give those claims a dedicated Q&A slide.

Suggested field-note contents:

- Deal-breaker catch: 12/12 across the validated SPSO and museum gold tenders.
- Held-out proof: Bradwell deal-breaker check.
- Phrasing bank proof: 101/101 standard deal-breaker variants.
- Honest caveat: broader ordinary-requirement recall and precision still need a larger benchmark.

Make this an appendix slide, not a main-flow slide. It is best used when judges ask "how do you know it works?"

### 6. Source Marker on GBP 341bn

- Add a tiny mono source marker beside the figure.
- Echo it into an appendix sources slide.
- Keep it legible but quiet. The point is rigor, not footnote theater.

### 7. Real Team Photos

The current illustrated avatars are one of the remaining placeholder-feeling parts.

- Use real photos if the team can provide good ones quickly.
- If not, use names and roles only with nonliteral field-guide accents.
- Avoid a half-real, half-illustrated team slide.

### 8. Fresh OG Image

The `/pitch` link preview should look like the pitch.

- Capture the night-forest slide 1 as the social image.
- Ensure it uses the current brand mark decision.
- Check it against both dark-mode and light-mode link previews.

## Major Improvement Ideas

These change what the deck is, not just how polished it feels.

### 1. Walk Into the Product

Merge the deck and cached product demo into one stage object.

Flow:

1. Demo slide lands on the product frame.
2. One keypress expands into a full-screen read-only workspace.
3. Speaker opens a deal-breaker row.
4. Speaker opens source proof and optionally an answer receipt.
5. One keypress walks back to the deck for Tech and Ask.

Why it is strong:

- No alt-tab.
- No context break.
- No live API risk if it uses the pre-baked SPSO fixture.
- The pitch stops describing the product and becomes a guided product tour.

Risk controls:

- Keep it read-only.
- Use the frozen prebake.
- Hard-code the demo path to three or four reliable interactions.
- Add an escape key that returns to the exact slide state.

### 2. Scrollytelling Twin

The keyboard deck is stage-native. The follow-up link needs to explain itself without a narrator.

Build a scroll mode:

- Same seven chapters.
- Trail draws down the page.
- Stop-sign pins and resolves as the reader passes it.
- Product proof opens inline.
- Clearing/Ask arrives at the bottom.

Why it is strong:

- Better for investors who receive the link later.
- Better on mobile.
- Pairs naturally with outreach emails and post-demo follow-up.

### 3. Live Ingest Finale

The bold version: ask a judge for a public tender PDF and process it live.

Only do this if the failure path is rehearsed as carefully as the success path.

Required reliability theater:

- A processing view that looks intentional for 60 to 90 seconds.
- A hard timeout.
- Clear copy if the live run falls back to the cached tender.
- A preloaded cached result that takes over without apology.
- Backend health and key checks before the pitch.

Recommendation: do not make this the main demo path for hackathon judging. Treat it as a bonus if rehearsal time remains.

### 4. Presenter Console

A second window synchronized by `BroadcastChannel` could show:

- Current slide.
- Next slide.
- Speaker notes.
- Current beat state, especially the stop-sign.
- Per-speaker elapsed time.
- Warnings when the team is running over.

This is less flashy than a visual pass, but it may improve delivery more than another animation.

### 5. Narrated Autopilot

Record the 3-minute narration and sync slide beats to the audio.

Use cases:

- Booth loop.
- Follow-up link.
- "Send me the video" requests without making a separate video.

Constraints:

- Manual controls must still override it.
- Captions or transcript should be available.
- Reduced-motion users should still get the static story.

### 6. Deck as Funnel Instrument

Post-demo-day, make the pitch measurable:

- Personalized links, for example `/pitch?to=firm-name`.
- Lightweight analytics for opens, slide dwell, Ask reach, and CTA clicks.
- Exportable leave-behind PDF.
- Follow-up sequence keyed to which proof sections a viewer opened.

Do this after the demo, not before, unless outreach becomes the main event.

### 7. Slides as Data

Pull slide content out of the long TSX file into typed data or MDX.

Why:

- Teammates can edit copy without React.
- Narrative changes become easy to diff.
- Variants become possible: investor deck, council-buyer deck, SME-bidder deck.
- Timings and speaker notes can be versioned beside copy.

This is a repeatable-sales-deck investment, not an urgent hackathon task.

## Appearance-Only Improvements

These focus purely on look and feel.

### 1. Unify the Photography

The dark forest slides are the visual spine. Make them feel like one authored world.

- **Shared grade:** a green-gold wash with slightly lifted blacks.
- **Film grain:** subtle noise on dark scenes to avoid smooth stock-photo flatness.
- **Vignette:** darken corners so the eye moves to the headline.
- **Focal blur:** soften busy plate detail behind copy.
- **One light source:** let the same upper-center clearing light subtly influence earlier slides.

Acceptance check: slide thumbnails should look like one sequence, not three unrelated images.

### 2. Make Paper Slides Feel Like Field Notes

The moss/paper zones should match the dark scenes' craft level.

- Add letterpress texture to paper fields.
- Use a faint pressed-leaf watermark where it will not hurt readability.
- Add hairline-rule structure around content blocks.
- Use quiet paper shadows and pressed surfaces, not generic cards.

### 3. Treat the Product Sheet as an Exhibit

The product UI should feel like evidence, not a screenshot rectangle.

- Add a rough-cut or deckled edge to the sheet.
- Add a soft fold-crease shadow.
- Add a small specimen label, for example `EXHIBIT / SPSO RUN / 187 ROWS`.
- Keep the product itself crisp and readable. The exhibit treatment should frame it, not obscure it.

### 4. Typographic Finery

Small type choices can make the deck feel expensive.

- Use one italic serif accent per headline where it sharpens the line.
- Reuse the drawn oxblood underline for the decisive phrases only.
- Upgrade kickers into small-caps plus a short rule, like a map legend.
- Give large numbers hairline rules, tabular figures, and a source marker.

### 5. Trail and Chrome Details

- Replace the plain trail-band gradient with a dark fern/grass silhouette edge.
- Give the walked path a faint warm afterglow.
- Put the oxblood blaze directly on trail stop 3.
- Add a subtle exposure dip during night-to-moss transitions so the crossfade feels photographic.

### 6. Appendix Wear

Appendix sheets can carry more field-note personality because they are not the main pitch path.

- Taped corner.
- Pencil margin line.
- Pressed leaf peeking from an edge.
- Slight paper offset for sources and benchmark notes.

Use sparingly. The appendix should feel handled, not messy.

### 7. Story Glyph Paper Fill

The tender-page emblem can feel more object-like:

- Add a paper-toned fill.
- Add a 1px shadow.
- Keep the line art sharp.

### 8. Brand Consistency Sweep

Before generating final screenshots and OG images:

- Confirm the active wordmark/mascot decision.
- Make the favicon, OG image, pitch seal, and final slide consistent.
- Avoid a mixed owl/clause-frame state unless it is intentional and documented.

## Extra Tips Worth Considering

### Rehearsal Capture

Record one full run with the laptop audio and projected screen.

Watch for:

- Dead air on the stop-sign pause.
- Slides that land before the line is spoken.
- Any animation that steals attention from the speaker.
- Whether the Ask slide remains visible long enough for the URL to be photographed or typed.

### "Stuck Key" Recovery

Make the controls forgiving:

- `Esc` closes every overlay.
- `Home` returns to slide 1.
- `End` jumps to Ask.
- A visible but quiet reset control appears in the shortcut card.

### Offline Leave-Behind

Export a PDF after every pitch change and keep it in the stage folder.

The PDF should:

- Show final/resolved states.
- Include the source appendix and visible URLs.
- Avoid animation-dependent proof.
- Preserve screenshots sharply.

### Demo Claim Ledger

Keep a short internal note beside the deck with each claim and its source:

- Where the number came from.
- Which commit or fixture backs it.
- Who can defend it in Q&A.

This prevents accidental overclaiming when adrenaline hits.

## Suggested Implementation Sequence

### Before Demo Day

1. Refresh/hash persistence.
2. Ask CTA simplification.
3. Timer and autoplay retune.
4. Cursor auto-hide.
5. Stop-sign rehearsal plus PDF fallback.
6. Animated GBP 341bn and trail draw-on if time allows.
7. Eval field-note appendix.

### If One Larger Build Fits

Build the **walk into the product** demo portal with cached data. Keep it deterministic and short.

### After Demo Day

1. Scrollytelling twin.
2. Funnel instrumentation.
3. Narrated autopilot.
4. Slides-as-data refactor.
5. Live ingest finale, only after the fallback has been rehearsed.

## Owner Notes

- **Frontend:** owns the deck mechanics, product portal, visual pass, presenter console, and scrollytelling mode.
- **J:** owns the Ask copy, source markers, proof wording, audience variants, and final narrative call.
- **Generalist:** supplies validated numbers and Q&A defensibility for the eval appendix.
- **Backend:** supports live-ingest experiments and any backend health/preload checks if the team chooses that path.

## Definition of Done for Pitch Changes

For any implemented item:

- It works with keyboard navigation.
- It respects reduced motion.
- It prints or exports to a sensible static state.
- It survives refresh if it changes navigation state.
- It has been checked once in a real browser at projector-like dimensions.
- It does not add a new live dependency to the stage path unless the fallback is rehearsed.
