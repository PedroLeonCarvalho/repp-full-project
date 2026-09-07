"use client";

import React, { useState } from "react";
import {
  transposeChordPro,
  transposeKey,
  ALL_MAJOR_KEYS,
  ALL_MINOR_KEYS,
  getSemitoneDistance,
} from "@/lib/chordpro/transposer";

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
  originalKey?: string | null;
  preferredKey?: string | null;
  fontSize?: "normal" | "large" | "xlarge" | "xxlarge";
  /** "render" shows formatted chords+lyrics; "raw" shows plain monospace text */
  mode?: "render" | "raw";
  showTransposer?: boolean;
  onSavePreferredKey?: (newKey: string) => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChordsViewer({
  chords,
  originalKey,
  preferredKey,
  fontSize = "normal",
  mode = "render",
  showTransposer = true,
  onSavePreferredKey,
}: ChordsViewerProps) {
  // Compute initial offset between originalKey and preferredKey if both present
  const baseKey = originalKey || preferredKey || "";
  const initialOffset =
    originalKey && preferredKey && originalKey !== preferredKey
      ? getSemitoneDistance(originalKey, preferredKey)
      : 0;

  const [semitoneOffset, setSemitoneOffset] = useState<number>(initialOffset);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!chords || !chords.trim()) {
    return (
      <div className="py-10 text-center text-zinc-500">
        <p className="text-sm font-semibold">Nenhuma cifra cadastrada.</p>
      </div>
    );
  }

  // Calculate the currently transposed key
  const currentKey = baseKey ? transposeKey(baseKey, semitoneOffset) : null;

  // Transpose the ChordPro content in real-time
  const effectiveChords =
    semitoneOffset !== 0
      ? transposeChordPro(chords, semitoneOffset, currentKey || undefined)
      : chords;

  const handleShift = (delta: number) => {
    setSemitoneOffset((prev) => prev + delta);
    setSaveSuccess(false);
  };

  const handleSelectKey = (targetKey: string) => {
    if (!baseKey) return;
    const dist = getSemitoneDistance(baseKey, targetKey);
    setSemitoneOffset(dist);
    setSaveSuccess(false);
  };

  const handleReset = () => {
    setSemitoneOffset(0);
    setSaveSuccess(false);
  };

  const handleSaveKey = async () => {
    if (!currentKey || !onSavePreferredKey) return;
    try {
      setIsSavingKey(true);
      await onSavePreferredKey(currentKey);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Ignore
    } finally {
      setIsSavingKey(false);
    }
  };

  const isMinor = baseKey.endsWith("m") && !baseKey.endsWith("maj");
  const availableKeys = isMinor ? ALL_MINOR_KEYS : ALL_MAJOR_KEYS;

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
          {/* Left: Semitone Stepper [-] [Tom] [+] */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Tom:
            </span>

            {/* Decrement Half-Step */}
            <button
              type="button"
              onClick={() => handleShift(-1)}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              title="Abaixar meio-tom (-1 semitom)"
            >
              <span>-1/2</span>
            </button>

            {/* Current Key Display Badge */}
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-emerald-500/40 px-3 py-1 font-mono">
              <span className="font-black text-sm text-emerald-400">
                {currentKey || (semitoneOffset !== 0 ? `Tom (${offsetLabel})` : "Tom Padrão")}
              </span>
              {semitoneOffset !== 0 && (
                <span className="text-[10px] text-zinc-400 font-sans">
                  ({offsetLabel})
                </span>
              )}
            </div>

            {/* Increment Half-Step */}
            <button
              type="button"
              onClick={() => handleShift(1)}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              title="Aumentar meio-tom (+1 semitom)"
            >
              <span>+1/2</span>
            </button>

            {/* Reset Button */}
            {semitoneOffset !== 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-zinc-800/80 hover:bg-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Voltar ao tom original"
              >
                Resetar
              </button>
            )}
          </div>

          {/* Right: Key Dropdown Selector & Optional Save Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {baseKey && (
              <select
                value={currentKey || baseKey}
                onChange={(e) => handleSelectKey(e.target.value)}
                className="rounded-lg bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-xs font-bold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                title="Mudar diretamente para outra tonalidade"
              >
                {availableKeys.map((k) => (
                  <option key={k} value={k}>
                    {k} {k === baseKey ? "(Original)" : ""}
                  </option>
                ))}
              </select>
            )}

            {onSavePreferredKey && currentKey && (
              <button
                type="button"
                disabled={isSavingKey}
                onClick={handleSaveKey}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  saveSuccess
                    ? "bg-emerald-500 text-zinc-950 font-black"
                    : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                }`}
                title="Salvar esta tonalidade como tom preferido para futuros shows"
              >
                {saveSuccess ? "✓ Salvo!" : isSavingKey ? "Salvando..." : "Salvar Tom"}
              </button>
            )}
          </div>
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

