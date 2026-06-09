/**
 * Data-viz tone helpers — the `c1..c4` accent ramp used by KPI icon tiles and
 * service logos. Class strings are literal so Tailwind's scanner picks them up.
 */
export type ConsoleTone = "c1" | "c2" | "c3" | "c4";

export const TONES: ConsoleTone[] = ["c1", "c2", "c3", "c4"];

export const TONE_TILE: Record<ConsoleTone, string> = {
  c1: "bg-c1/15 text-c1",
  c2: "bg-c2/15 text-c2",
  c3: "bg-c3/15 text-c3",
  c4: "bg-c4/15 text-c4",
};

/** Deterministically map a string (e.g. endpoint name) to a tone. */
export function toneFromString(s: string): ConsoleTone {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
