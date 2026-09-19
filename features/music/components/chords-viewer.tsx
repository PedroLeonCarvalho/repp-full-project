"use client";

import React, { useState } from "react";
import { transposeChordPro } from "@/lib/chordpro/transposer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChordToken {
  chord: string;
  lyric: string;
}

type ParsedLineType = "chordpro" | "header" | "tab" | "comment" | "lyric" | "empty";

interface ParsedLine {
  type: ParsedLineType;
  raw: string;
  tokens?: ChordToken[]; // only for "chordpro" lines
}

// ---------------------------------------------------------------------------
// ChordPro inline parser
// ---------------------------------------------------------------------------

/**
 * Parses a single ChordPro inline line into an array of {chord, lyric} tokens.
 *
 * "[Dm7]Come up to [Bb9]meet you"
 * → [{ chord: "Dm7", lyric: "Come up to " }, { chord: "Bb9", lyric: "meet you" }]
 *
 * A leading lyric segment with no chord is modelled as { chord: "", lyric: "…" }.
 */
function parseChordProLine(line: string): ChordToken[] {
  const tokens: ChordToken[] = [];
  const re = /\[([^\]]+)\]([^[]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Check for lyric content before the first chord
  const firstBracket = line.indexOf("[");
  if (firstBracket > 0) {
    tokens.push({ chord: "", lyric: line.slice(0, firstBracket) });
    lastIndex = firstBracket;
  }

  // Iterate through all [chord]lyric pairs in the line
  while ((match = re.exec(line)) !== null) {
    tokens.push({ chord: match[1], lyric: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Any trailing text after the last bracket pair
  if (lastIndex < line.length && tokens.length > 0) {
    const trailing = line.slice(lastIndex);
    if (trailing) {
      tokens[tokens.length - 1].lyric += trailing;
    }
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Line classifier
// ---------------------------------------------------------------------------

const SECTION_HEADER_RE =
  /^\s*(\[|\()[\w\s\u00C0-\u017E]*(\]|\))\s*:?\s*$/i;
const TAB_LINE_RE = /^[EADGBe]\|[-\d~hp/\\|brs<>() ]+$/;
const CHORDPRO_LINE_RE = /\[[A-G][^\]]*\]/;

function classifyLine(line: string): ParsedLine {
  if (!line.trim()) return { type: "empty", raw: line };
  if (line.startsWith("#")) return { type: "comment", raw: line };
  if (SECTION_HEADER_RE.test(line)) return { type: "header", raw: line };
  if (TAB_LINE_RE.test(line.trim())) return { type: "tab", raw: line };
  if (CHORDPRO_LINE_RE.test(line)) {
    return { type: "chordpro", raw: line, tokens: parseChordProLine(line) };
  }
  return { type: "lyric", raw: line };
}

// ---------------------------------------------------------------------------
// Font-size classes (matches LyricsViewer scale)
// ---------------------------------------------------------------------------

const FONT_SIZE_CLASSES = {
  normal: { lyric: "text-xs sm:text-sm leading-tight", chord: "text-xs sm:text-sm font-bold tracking-tight" },
  large: { lyric: "text-sm sm:text-base leading-tight", chord: "text-base sm:text-lg font-bold tracking-tight" },
  xlarge: { lyric: "text-base sm:text-lg leading-tight", chord: "text-lg sm:text-xl font-bold tracking-tight" },
  xxlarge: { lyric: "text-lg sm:text-xl leading-tight", chord: "text-xl sm:text-2xl font-bold tracking-tight" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChordsViewerProps {
  chords: string;
  fontSize?: "normal" | "large" | "xlarge" | "xxlarge";
  /** "render" shows formatted chords+lyrics; "raw" shows plain monospace text */
  mode?: "render" | "raw";
  showTransposer?: boolean;
  onSaveChords?: (newChords: string) => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChordsViewer({
  chords,
  fontSize = "normal",
  mode = "render",
  showTransposer = true,
  onSaveChords,
}: ChordsViewerProps) {
  const [semitoneOffset, setSemitoneOffset] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!chords || !chords.trim()) {
    return (
      <div className="py-10 text-center text-zinc-500">
        <p className="text-sm font-semibold">Nenhuma cifra cadastrada.</p>
      </div>
    );
  }

  // Transpose the ChordPro content in real-time based on semitone shift
  const effectiveChords =
    semitoneOffset !== 0
      ? transposeChordPro(chords, semitoneOffset)
      : chords;

  const handleShift = (delta: number) => {
    setSemitoneOffset((prev) => prev + delta);
    setSaveSuccess(false);
  };

  const handleReset = () => {
    setSemitoneOffset(0);
    setSaveSuccess(false);
  };

  const handleSaveChords = async () => {
    if (semitoneOffset === 0 || !onSaveChords) return;
    try {
      setIsSaving(true);
      await onSaveChords(effectiveChords);
      setSemitoneOffset(0);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Ignore error
    } finally {
      setIsSaving(false);
    }
  };

  const offsetLabel =
    semitoneOffset > 0
      ? `+${semitoneOffset}`
      : semitoneOffset < 0
      ? `${semitoneOffset}`
      : "0";

  return (
    <div className="space-y-4">
      {/* Transposition Control Toolbar */}
      {showTransposer && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 p-2.5 sm:p-3 text-xs">
          {/* Left: Stepper buttons without tone in the middle */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Tom:
            </span>

            {/* Decrement Half-Step */}
            <button
              type="button"
              onClick={() => handleShift(-1)}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              title="Abaixar meio-tom (-1 semitom)"
            >
              <span>-1/2</span>
            </button>

            {/* Increment Half-Step */}
            <button
              type="button"
              onClick={() => handleShift(1)}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              title="Aumentar meio-tom (+1 semitom)"
            >
              <span>+1/2</span>
            </button>

            {/* Reset Button (shows current offset when shifted) */}
            {semitoneOffset !== 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Voltar ao tom original do texto"
              >
                Resetar ({offsetLabel})
              </button>
            )}
          </div>

          {/* Right: Save Transposed Chords Button */}
          {onSaveChords && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving || semitoneOffset === 0}
                onClick={handleSaveChords}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  saveSuccess
                    ? "bg-emerald-500 text-zinc-950 font-black"
                    : semitoneOffset !== 0
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/60 opacity-60 cursor-not-allowed"
                }`}
                title={
                  semitoneOffset !== 0
                    ? "Salvar a cifra com o texto alterado para esta tonalidade"
                    : "Altere o tom para salvar a nova cifra"
                }
              >
                {saveSuccess ? (
                  <>
                    <span>✓</span>
                    <span>Cifra Salva!</span>
                  </>
                ) : isSaving ? (
                  <span>Salvando cifra...</span>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Salvar Cifra</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Raw Mode Pre */}
      {mode === "raw" ? (
        <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto p-2">
          {effectiveChords}
        </pre>
      ) : (
        /* Rendered ChordPro Mode */
        <RenderedChordsContent chords={effectiveChords} fontSize={fontSize} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rendered ChordPro Sub-component
// ---------------------------------------------------------------------------

function RenderedChordsContent({
  chords,
  fontSize = "normal",
}: {
  chords: string;
  fontSize?: "normal" | "large" | "xlarge" | "xxlarge";
}) {
  const scale = FONT_SIZE_CLASSES[fontSize] ?? FONT_SIZE_CLASSES.normal;

  // Normalize line-endings and parse lines
  const normalized = chords.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parsedLines = normalized.split("\n").map(classifyLine);

  // Group consecutive lines into visual stanzas (split on empty lines)
  const stanzas: ParsedLine[][] = [];
  let currentStanza: ParsedLine[] = [];

  for (const pLine of parsedLines) {
    if (pLine.type === "empty") {
      if (currentStanza.length > 0) {
        stanzas.push(currentStanza);
        currentStanza = [];
      }
    } else {
      currentStanza.push(pLine);
    }
  }
  if (currentStanza.length > 0) stanzas.push(currentStanza);

  return (
    <div className="space-y-3 text-zinc-100">
      {stanzas.map((stanza, stanzaIdx) => {
        const firstLine = stanza[0];
        const isHeader = firstLine?.type === "header";
        const headerText = isHeader
          ? firstLine.raw.replace(/[[\]()]/g, "").trim()
          : null;
        const isChorus = /refr[aã]o|chorus/i.test(stanza.map((l) => l.raw).join(" "));

        return (
          <div
            key={stanzaIdx}
            className={`rounded-lg p-2 transition-all ${
              isChorus
                ? "border-l-4 border-emerald-400 bg-emerald-950/20 pl-3"
                : "border-l-4 border-transparent pl-3"
            }`}
          >
            {/* Section header badge */}
            {headerText && (
              <div className="mb-1">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isChorus
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {headerText}
                </span>
              </div>
            )}

            {/* Stanza lines */}
            <div className="space-y-0.5">
              {(isHeader ? stanza.slice(1) : stanza).map((pLine, lineIdx) => {
                switch (pLine.type) {
                  case "comment":
                    return (
                      <p
                        key={lineIdx}
                        className="text-[11px] text-zinc-500 italic font-mono leading-tight"
                      >
                        {pLine.raw.replace(/^#\s*/, "")}
                      </p>
                    );

                  case "tab":
                    return (
                      <pre
                        key={lineIdx}
                        className="font-mono text-[11px] text-amber-400 overflow-x-auto leading-none py-0.5"
                      >
                        {pLine.raw}
                      </pre>
                    );

                  case "header":
                    // Section header inside a stanza
                    return (
                      <div key={lineIdx} className="pt-0.5">
                        <span className="inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                          {pLine.raw.replace(/[[\]()]/g, "").trim()}
                        </span>
                      </div>
                    );

                  case "chordpro": {
                    const tokens = pLine.tokens ?? [];
                    return (
                      <div
                        key={lineIdx}
                        className="flex flex-wrap items-end gap-x-0 gap-y-0.5 py-0.5"
                      >
                        {tokens.map((token, tokenIdx) => (
                          <span
                            key={tokenIdx}
                            className="inline-flex flex-col items-start leading-none"
                          >
                            {/* Chord label */}
                            <span
                              className={`font-bold text-amber-400 leading-none ${scale.chord} whitespace-pre`}
                            >
                              {token.chord || "\u00A0" /* nbsp placeholder */}
                            </span>
                            {/* Lyric segment */}
                            <span className={`text-zinc-100 whitespace-pre leading-tight mt-0.5 ${scale.lyric}`}>
                              {token.lyric || "\u00A0"}
                            </span>
                          </span>
                        ))}
                      </div>
                    );
                  }

                  case "lyric":
                  default:
                    return (
                      <p
                        key={lineIdx}
                        className={`whitespace-pre-wrap break-words leading-tight ${scale.lyric}`}
                      >
                        {pLine.raw}
                      </p>
                    );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

