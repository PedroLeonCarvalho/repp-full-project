import {
  transposeSingleChord,
  transposeChordPro,
  transposeKey,
  getSemitoneDistance
} from "../lib/chordpro/transposer.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Testing transposer...");

// 1. Basic chords
assert(transposeSingleChord("C", 2) === "D", "C +2 = D");
assert(transposeSingleChord("Dm7", 2) === "Em7", "Dm7 +2 = Em7");
assert(transposeSingleChord("G7", -2) === "F7", "G7 -2 = F7");

// 2. Inverted bass
assert(transposeSingleChord("C/E", 2) === "D/F#", "C/E +2 = D/F#");
assert(transposeSingleChord("Dm7/G", 2) === "Em7/A", "Dm7/G +2 = Em7/A");
assert(transposeSingleChord("F#m7(b5)/C#", 1) === "Gm7(b5)/D", "F#m7(b5)/C# +1 = Gm7(b5)/D");

// 3. Flat preferences
assert(transposeSingleChord("C", 1, true) === "Db", "C +1 flat = Db");
assert(transposeSingleChord("F", -1, true) === "E", "F -1 = E");
assert(transposeSingleChord("Bb7M", 2, true) === "C7M", "Bb7M +2 = C7M");

// 4. Complex MPB chords
assert(transposeSingleChord("A7(9)(#11)", 2) === "B7(9)(#11)", "A7(9)(#11) +2 = B7(9)(#11)");
assert(transposeSingleChord("D4/7", 2) === "E4/7", "D4/7 +2 = E4/7");

// 5. ChordPro full string transposition with structural tags preserved
const input = `[Intro]
[Dm7]          [Bb9]
Come up to meet you
[Refrão]
[F]Tell you I'm [C/E]sorry`;

const transposed = transposeChordPro(input, 2);
console.log("Transposed ChordPro:\n" + transposed);

assert(transposed.includes("[Intro]"), "Preserves [Intro]");
assert(transposed.includes("[Refrão]"), "Preserves [Refrão]");
assert(transposed.includes("[Em7]"), "Transposes Dm7 to Em7");
assert(transposed.includes("[C9]"), "Transposes Bb9 to C9");
assert(transposed.includes("[G]"), "Transposes F to G");
assert(transposed.includes("[D/F#]"), "Transposes C/E to D/F#");

// 6. Keys and semitone distance
assert(getSemitoneDistance("C", "D") === 2, "C to D is +2");
assert(getSemitoneDistance("G", "F") === -2, "G to F is -2");
assert(transposeKey("Dm", 2) === "Em", "Dm +2 = Em");

console.log("✅ All transposer tests passed successfully!");
