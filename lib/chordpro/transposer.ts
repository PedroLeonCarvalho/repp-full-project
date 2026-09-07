/**
 * Pure TypeScript music theory and chord transposition utility for REPP.
 * Zero external dependencies.
 *
 * Supports:
 * - Simple & complex chords: C, Dm7, F#m7(b5), Bb7M, A7(9)(#11), Gdim, Caug, D4/7
 * - Inverted bass notes: C/E, D/F#, G/B, Am/G, F#m7/C#
 * - Enharmonic intelligence (detects whether to prefer flats or sharps based on target key)
 * - ChordPro inline text transposition preserving lyrics and structural tags ([Intro], [Refrão], etc.)
 */

// ---------------------------------------------------------------------------
// Chromatic Scales & Note Indexes
// ---------------------------------------------------------------------------

export const SHARP_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const FLAT_SCALE  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

export const ALL_MAJOR_KEYS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
export const ALL_MINOR_KEYS = ["Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm"] as const;

const NOTE_TO_INDEX: Record<string, number> = {
  C: 0, "B#": 0,
  "C#": 1, Db: 1,
  D: 2,
  "D#": 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, "E#": 5,
  "F#": 6, Gb: 6,
  G: 7,
  "G#": 8, Ab: 8,
  A: 9,
  "A#": 10, Bb: 10,
  B: 11, Cb: 11,
};

// Keys that traditionally prefer flats (b) in standard sheet music
const FLAT_PREFERRING_KEYS = new Set([
  "F", "Bb", "Eb", "Ab", "Db", "Gb",
  "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"
]);

// ---------------------------------------------------------------------------
// Structural tags regex (tags that should NOT be transposed as chords)
// ---------------------------------------------------------------------------
const STRUCTURAL_TAG_RE =
  /^(intro|refr[aã]o|chorus|verso|verse|ponte|bridge|solo|pr[eé]-refr[aã]o|pre-chorus|final|outro|interl[uú]dio|riff|coda|passagem|tab|primeira\s*parte|segunda\s*parte)/i;

export function isStructuralTag(tag: string): boolean {
  const clean = tag.replace(/[[\]():]/g, "").trim();
  return STRUCTURAL_TAG_RE.test(clean);
}

// Matches whether the slash is specifically an inverted bass note (e.g. /C#, /F, /Bb)
const SLASH_BASS_RE = /^(.*?)\/([A-G][#b]?)$/;

// ---------------------------------------------------------------------------
// Core Transposition Functions
// ---------------------------------------------------------------------------

/**
 * Determines whether a given key prefers flat or sharp accidentals.
 */
export function prefersFlats(keyName?: string): boolean {
  if (!keyName) return false;
  const cleanKey = keyName.trim();
  return FLAT_PREFERRING_KEYS.has(cleanKey) || cleanKey.includes("b");
}

/**
 * Transposes a single isolated note (e.g. "C", "F#", "Bb") by a number of semitones.
 */
export function transposeNote(note: string, semitones: number, useFlats = false): string {
  const root = note.trim();
  const index = NOTE_TO_INDEX[root];
  if (index === undefined) return note;

  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return useFlats ? FLAT_SCALE[newIndex] : SHARP_SCALE[newIndex];
}

/**
 * Transposes a single musical chord (e.g. "Dm7", "F#m7(b5)", "C/E", "Bb7M", "D4/7") by a number of semitones.
 */
export function transposeSingleChord(
  chord: string,
  semitones: number,
  useFlats = false
): string {
  const trimmed = chord.trim();
  if (semitones === 0 || !trimmed) return chord;

  let mainPart = trimmed;
  let bassPart: string | null = null;

  // Check if ending with a slash followed by a valid musical note (bass inversion)
  const slashMatch = SLASH_BASS_RE.exec(trimmed);
  if (slashMatch) {
    const [, beforeSlash, bassNote] = slashMatch;
    // Ensure the bass note is indeed a valid note in our lookup
    if (NOTE_TO_INDEX[bassNote] !== undefined) {
      mainPart = beforeSlash;
      bassPart = bassNote;
    }
  }

  // Extract root note from mainPart (starts with [A-G][#b]?)
  const rootMatch = /^([A-G][#b]?)(.*)$/.exec(mainPart);
  if (!rootMatch) return chord;

  const [, rootNote, extension] = rootMatch;
  if (NOTE_TO_INDEX[rootNote] === undefined) return chord;

  const transposedRoot = transposeNote(rootNote, semitones, useFlats);

  if (bassPart) {
    const transposedBass = transposeNote(bassPart, semitones, useFlats);
    return `${transposedRoot}${extension}/${transposedBass}`;
  }

  return `${transposedRoot}${extension}`;
}

/**
 * Transposes an entire ChordPro formatted string by a specified number of semitones.
 * Preserves lyrics, line breaks, indentation and structural tags (e.g. [Intro], [Refrão]).
 */
export function transposeChordPro(
  chordProText: string,
  semitones: number,
  targetKey?: string
): string {
  if (semitones === 0 || !chordProText) return chordProText;

  const useFlats = prefersFlats(targetKey);

  // Replace each [chord] with [transposed_chord]
  return chordProText.replace(/\[([^\]]+)\]/g, (match, insideBrackets: string) => {
    if (isStructuralTag(insideBrackets)) {
      return match;
    }
    const transposed = transposeSingleChord(insideBrackets, semitones, useFlats);
    return `[${transposed}]`;
  });
}

/**
 * Transposes a musical key name (e.g. "Dm" -> "Em", "G" -> "A") by a given number of semitones.
 */
export function transposeKey(key: string, semitones: number): string {
  if (semitones === 0 || !key.trim()) return key;

  const isMinor = key.endsWith("m") && !key.endsWith("maj");
  const baseNote = isMinor ? key.slice(0, -1) : key;
  const index = NOTE_TO_INDEX[baseNote];

  if (index === undefined) return key;

  const targetIndex = ((index + semitones) % 12 + 12) % 12;
  const potentialSharpKey = `${SHARP_SCALE[targetIndex]}${isMinor ? "m" : ""}`;
  const potentialFlatKey = `${FLAT_SCALE[targetIndex]}${isMinor ? "m" : ""}`;

  // Use the standard natural accidental for that resulting key
  const useFlats = prefersFlats(potentialFlatKey);
  return useFlats ? potentialFlatKey : potentialSharpKey;
}

/**
 * Calculates the shortest semitone distance to transpose from one key to another.
 * E.g. getSemitoneDistance("C", "D") => +2
 *      getSemitoneDistance("G", "F") => -2 (or +10)
 */
export function getSemitoneDistance(fromKey: string, toKey: string): number {
  const cleanFrom = fromKey.replace(/m$/i, "").trim();
  const cleanTo = toKey.replace(/m$/i, "").trim();

  const fromIndex = NOTE_TO_INDEX[cleanFrom];
  const toIndex = NOTE_TO_INDEX[cleanTo];

  if (fromIndex === undefined || toIndex === undefined) return 0;

  let diff = (toIndex - fromIndex) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -5) diff += 12;

  return diff;
}
