import type { Actor } from "@/types/requirement";

// Collaboration attribution helpers, shared by every "who did what" surface so an actor always
// renders the same initials + colour. An actor is stamped server-side on each decision; absent
// on legacy/mock/frozen-demo decisions, which render as "you".

export interface Collaborator {
  key: string; // stable identity (email)
  name: string; // display name
  initials: string;
  color: string; // avatar background — muted, on-brand, readable on warm paper
}

// Assigned stably per person by hashing their email.
// Forest leads; the whole family stays earthy/warm so no avatar reads as a risk
// signal. Oxblood is reserved exclusively for deal-breaker alarm states and is
// intentionally absent here. Greyscale-safe: sorted by simple luminance (L =
// 0.299R + 0.587G + 0.114B) — deep-pine ≈49, warm-bark ≈76, forest ≈94,
// terracotta ≈106, sage ≈109, amber ≈114 — adjacent pair separation ≥18 at
// the dark end; the terracotta/sage/amber top cluster differs by hue as well as
// the moderate L gap so actors remain distinguishable.
const PALETTE = [
  "#3f6f57", // forest — leads the earthy rotation (L ≈ 94)
  "#1c3d2c", // deep pine — dark green anchor, pulls the range wide (L ≈ 49)
  "#6b4425", // warm bark — brown mid-tone between pine and forest (L ≈ 76)
  "#a06b1a", // amber-ink (L ≈ 114)
  "#557a6b", // sage (L ≈ 109)
  "#9a5a3c", // terracotta (L ≈ 106)
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function displayName(actor: Actor): string {
  if (actor.name && actor.name.trim()) return actor.name.trim();
  const local = (actor.email || "").split("@")[0] || "someone";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || local
  );
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || "?").toUpperCase();
}

export function collaboratorFor(actor: Actor): Collaborator {
  const name = displayName(actor);
  return {
    key: actor.email || actor.id,
    name,
    initials: initialsFrom(name),
    color: PALETTE[hash(actor.email || actor.id) % PALETTE.length],
  };
}

// "you" when the actor is the current signed-in user, or when the actor is unknown (legacy/mock/
// frozen demo) — so existing single-user surfaces read exactly as before. Otherwise the person's name.
export function actorLabel(
  actor: Actor | null | undefined,
  currentUserId?: string | null
): string {
  if (!actor) return "you";
  if (currentUserId && actor.id === currentUserId) return "you";
  return displayName(actor);
}
