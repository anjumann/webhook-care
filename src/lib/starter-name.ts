// Friendly, memorable endpoint names for first-run onboarding (spec 02 §6 /
// open-Q2 lean: a curated word-pair reads better than an 8-char slug). Output is
// URL-safe and satisfies the endpoint-name rule (`^[a-zA-Z0-9_-]*$`): lowercase
// words joined by a dash, e.g. "swift-otter". Pure + unit-tested (RNG injected).

const ADJECTIVES = [
  "swift", "calm", "bright", "brave", "clever", "cosmic", "mellow", "nimble",
  "quiet", "rapid", "silver", "sunny", "teal", "vivid", "witty", "zesty",
] as const;

const ANIMALS = [
  "otter", "falcon", "lynx", "heron", "tapir", "koala", "gecko", "marlin",
  "raven", "bison", "panda", "ibis", "moth", "wren", "orca", "yak",
] as const;

/** Pick an element by a [0,1) random value, clamped to a valid index. */
function pick<T>(list: readonly T[], r: number): T {
  const i = Math.min(list.length - 1, Math.max(0, Math.floor(r * list.length)));
  return list[i]!;
}

/**
 * A random `adjective-animal` starter name. `rand` defaults to `Math.random` and
 * is injectable so tests are deterministic.
 */
export function generateStarterName(rand: () => number = Math.random): string {
  return `${pick(ADJECTIVES, rand())}-${pick(ANIMALS, rand())}`;
}
