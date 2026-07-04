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
const PALETTE = [
  "#3f6f57", // forest
  "#8a2d2a", // oxblood
  "#a06b1a", // amber-ink
  "#3d5a80", // slate
  "#6b4e71", // plum
  "#557a6b", // sage
  "#9a5a3c", // terracotta
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
