/**
 * ChordPro converter — pure, zero-I/O utility.
 *
 * Converts the tabular chord+lyric format used by Cifra Club into ChordPro
 * inline format, e.g.:
 *
 *   Dm7             Bb9
 *       Come up to meet you
 *
 * becomes:
 *
 *   [Dm7]    Come up to [Bb9]meet you
 *
 * Structural annotations ([Intro], [Refrão] …) and tablature lines (E|---)
 * are preserved as-is.
 */

// ---------------------------------------------------------------------------
// Chord recognition
// ---------------------------------------------------------------------------

/**
 * Matches a single chord token.
 * Covers: C, Cm, C7, Cmaj7, C#m7, Gb/B, Dsus2, Dadd9, etc.
 */
const CHORD_TOKEN_RE =
  /^[A-G][b#]?(m(?:aj)?|min|dim|aug|sus|add)?[0-9]*(\/[A-G][b#]?)?$/;

function isChordToken(token: string): boolean {
  return CHORD_TOKEN_RE.test(token);
}

/**
 * Returns true when the given line looks like a chord line.
 * Heuristic: at least 60 % of non-empty tokens are valid chord names AND
 * the line contains at least one chord token.
 */
function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const chordCount = tokens.filter(isChordToken).length;
  return chordCount >= 1 && chordCount / tokens.length >= 0.6;
}

// ---------------------------------------------------------------------------
// Structural / special-line detection
// ---------------------------------------------------------------------------

/** Section headers like [Intro], [Refrão], [Verso 1], [Solo] … */
const SECTION_HEADER_RE =
  /^\s*(\[|\()[\w\s\u00C0-\u017E]*(\]|\))\s*:?\s*$/i;

/** Tablature lines: E|---, B|--- … */
const TAB_LINE_RE = /^[EADGBe]\|[-\d~hp/\\|brs<>() ]+$/;

/** Tuning annotation at the top: "Afinação: E A D G C F" */
const TUNING_LINE_RE = /^afinac[aã]o\s*:/i;

// ---------------------------------------------------------------------------
// Chord-to-ChordPro inline fusion
// ---------------------------------------------------------------------------

/**
 * Fuses a chord line and the immediately following lyric line into a single
 * ChordPro inline string.
 *
 * Each chord is placed at the character position it occupied in the chord
 * line, embedded in [brackets] just before the corresponding syllable.
 *
 * Example:
 *   chordLine  = "Dm7             Bb9"
 *   lyricLine  = "    Come up to meet you"
 *   result     = "[Dm7]    Come up to [Bb9]meet you"
 */
function fuseChordAndLyric(chordLine: string, lyricLine: string): string {
  // Build a list of (position, chord) pairs from the chord line
  const pairs: Array<{ pos: number; chord: string }> = [];
  const chordTokenRe = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = chordTokenRe.exec(chordLine)) !== null) {
    const token = match[0];
    if (isChordToken(token)) {
      pairs.push({ pos: match.index, chord: token });
    }
  }

  if (pairs.length === 0) {
    // Nothing to embed — just return the lyric line as-is
    return lyricLine;
  }

  // Build result by walking through pairs and inserting [chord] tags
  let result = "";
  let lyricCursor = 0;

  for (let i = 0; i < pairs.length; i++) {
    const { pos, chord } = pairs[i];
    const nextPos = i + 1 < pairs.length ? pairs[i + 1].pos : lyricLine.length;

    // Characters from the lyric line between the last insertion point and pos
    const lyricSegmentBefore = lyricLine.slice(lyricCursor, pos);
    result += lyricSegmentBefore;

    // Insert the chord tag
    result += `[${chord}]`;

    // Advance lyric cursor to pos (we'll grab the lyric under this chord next)
    lyricCursor = pos;

    // Lyric characters covered by this chord up to the next chord position
    const lyricUnderChord = lyricLine.slice(lyricCursor, nextPos);
    result += lyricUnderChord;
    lyricCursor = nextPos;
  }

  // Any remaining lyric after the last chord
  if (lyricCursor < lyricLine.length) {
    result += lyricLine.slice(lyricCursor);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts an array of lines (as returned by the REPP CifraClub API's `cifra`
 * field) into a ChordPro string.
 *
 * Rules applied in order:
 * 1. Tuning lines → preserved as `# <line>` comments
 * 2. Section headers ([Intro], [Refrão] …) → preserved as-is
 * 3. Tablature lines (E|---) → preserved as-is
 * 4. Chord line immediately followed by a lyric line → fused into ChordPro inline
 * 5. Standalone chord lines (no following lyric) → wrapped: `[C][G]`
 * 6. Plain lyric / empty lines → preserved as-is
 */
export function convertCifraToChordPro(cifraLines: string[]): string {
  const output: string[] = [];
  let i = 0;

  while (i < cifraLines.length) {
    const line = cifraLines[i];

    // 1. Tuning annotation
    if (TUNING_LINE_RE.test(line.trim())) {
      output.push(`# ${line.trim()}`);
      i++;
      continue;
    }

    // 2. Section header
    if (SECTION_HEADER_RE.test(line)) {
      output.push(line.trimEnd());
      i++;
      continue;
    }

    // 3. Tablature line
    if (TAB_LINE_RE.test(line.trim())) {
      output.push(line.trimEnd());
      i++;
      continue;
    }

    // 4 & 5. Chord line
    if (isChordLine(line)) {
      const nextLine = cifraLines[i + 1];
      const nextIsLyric =
        nextLine !== undefined &&
        !isChordLine(nextLine) &&
        !SECTION_HEADER_RE.test(nextLine) &&
        !TAB_LINE_RE.test(nextLine.trim());

      if (nextIsLyric) {
        // 4. Fuse chord + lyric
        output.push(fuseChordAndLyric(line, nextLine));
        i += 2;
      } else {
        // 5. Standalone chord line — wrap each chord token in brackets
        const inlined = line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => (isChordToken(t) ? `[${t}]` : t))
          .join(" ");
        output.push(inlined);
        i++;
      }
      continue;
    }

    // 6. Plain lyric or empty line
    output.push(line.trimEnd());
    i++;
  }

  return output.join("\n");
}
