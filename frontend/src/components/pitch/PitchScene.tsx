"use client";

import { useEffect, useState } from "react";
import { PineBranch } from "@/components/landing/art/PineBranch";
import { FernFrond } from "@/components/landing/art/FernFrond";
import { Seal } from "@/components/landing/art/Seal";

// The deck's forest floor: one scene stack at stage level, reusing the landing
// page's woodland plates (public/landing/forest) so /pitch and / are one
// artifact. Five zones cover the walk — night (dense wood, no path), pine
// (marked trail under the canopy), moss (the forest floor as a reading
// surface), paper (the civic record), clearing (arrival, warm light). All five
// stay mounted and crossfade in CSS, so slide changes never flash a bare
// stage. A single dusk sheet above the art carries the deck's lighting arc:
// `light` runs 0 (lost in the dark) to 1 (the clearing), and the sheet's
// opacity is just (1 - light) scaled — the story gets brighter as the walk
// approaches the ask.

export type PitchZone = "night" | "pine" | "moss" | "paper" | "clearing";

export const ZONES: readonly PitchZone[] = [
  "night",
  "pine",
  "moss",
  "paper",
  "clearing",
];

// True when paper-coloured type should sit on the scene.
export function zoneIsDark(zone: PitchZone) {
  return zone === "night" || zone === "pine" || zone === "clearing";
}

const SCENE_IMAGES = [
  "/landing/forest/hero-woodland-v2.webp",
  "/landing/forest/proof-pine-depth-v2.webp",
  "/landing/forest/card-gallery-backdrop-v2.webp",
  "/landing/forest/closing-clearing-v2.webp",
  "/landing/forest/fern-edge-overlay.webp",
  "/landing/forest/leaf-shadow-overlay.png",
];

// The dusk sheet never goes fully opaque — even the darkest slide keeps the
// wood legible behind the copy.
const DUSK_CEILING = 0.42;

export function PitchScene({
  zone,
  light,
  step,
}: {
  zone: PitchZone;
  light: number;
  // Any change here (the active slide index) makes the ground take a step:
  // the active plate eases from a slightly deeper zoom back to rest, so
  // advancing reads as walking forward even when the zone doesn't change.
  step: number;
}) {
  const [stepping, setStepping] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStepping(true));
    const timeout = window.setTimeout(() => setStepping(false), 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [step]);

  // Decode every plate up front so the first advance into each zone
  // crossfades instead of popping.
  useEffect(() => {
    const images = SCENE_IMAGES.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
    return () => images.forEach((img) => (img.src = ""));
  }, []);

  return (
    <div className="pitch-scene-stack" aria-hidden="true">
      {ZONES.map((name) => (
        <div
          key={name}
          className={`pitch-scene pitch-scene--${name} ${
            name === zone ? "is-active" : ""
          } ${name === zone && stepping ? "is-stepping" : ""}`}
        >
          <span className="pitch-scene__art" />
          <span className="pitch-scene__shade" />
          <span className="pitch-scene__grid" />
          <span className="pitch-scene__floor" />
          {/* engraved botanicals from the landing's art kit, one per ground */}
          {name === "night" && (
            <PineBranch className="pitch-scene__branch" />
          )}
          {(name === "moss" || name === "paper") && (
            <FernFrond className="pitch-scene__frond" />
          )}
          {name === "clearing" && (
            <Seal id={`pitch-seal-${name}`} className="pitch-scene__seal" />
          )}
        </div>
      ))}
      <span
        className="pitch-scene-dusk"
        style={{ opacity: Math.max(0, 1 - light) * DUSK_CEILING }}
      />
    </div>
  );
}
