# Bidframe - Brand Assets

The Bidframe mark: an **owl** held in a paper disc — it reads in the dark and
catches what you'd miss. The face uses a sharper brow, clear ear tufts, and a
small forest chest so the mark reads as an owl at nav and favicon sizes.

Direction: paper disc, ink keyline, ink owl, forest chest and beak. Status
colours stay out of the brand mark.

---

## Files

### Primary (vector — use these wherever possible)
| File | Use |
|------|-----|
| `bidframe-logo-horizontal.svg` | Default lockup — mark + wordmark. Headers, nav, docs. |
| `bidframe-logo-stacked.svg` | Vertical lockup — square-ish spaces, splash, print. |
| `bidframe-logo-horizontal-reversed.svg` | Lockup for dark backgrounds (paper wordmark). |
| `bidframe-mark.svg` | The mark alone — avatars, app icon, social. |
| `bidframe-favicon.svg` | Mark tuned for tiny sizes (thicker, no inner keyline). |
| `bidframe-favicon-ink.svg` | Ink-disc favicon — more legible on light browser tabs. |

In the app, the lockup is rendered inline by `src/components/BrandLogo.tsx`
(so it inherits the page's Fraunces and needs no request); the browser tab icon
is wired through Next's file convention at `src/app/icon.svg`. These SVGs are the
portable brand kit for decks, email signatures, partner docs, and social.

### Raster (PNG)
Not included here yet — export from the SVGs if a raster is needed (the favicon
and in-app logo both use SVG, which every current browser supports). Suggested
set if you do: `bidframe-mark-512/192.png`, `bidframe-apple-touch-180.png`,
`bidframe-favicon-32/16.png`.

---

## Colour

| Token | Hex | Role |
|-------|-----|------|
| Ink | `#211d17` | Owl, keyline, wordmark |
| Paper | `#f6f2e9` | Disc, knockouts |
| Forest | `#2c5640` | Chest and beak |

Wordmark: **Fraunces**, weight 600, tracking ≈ -0.02em.

---

## Usage rules

- **Clear space:** keep padding ≥ the owl's eye diameter on all sides.
- **Minimum size:** mark 24px (digital) / 10mm (print); horizontal lockup 120px wide.
- **Don't:** recolour the owl, restyle the wordmark font, add effects/shadows,
  or stretch. On busy photos, place the mark on a solid paper or ink disc.
