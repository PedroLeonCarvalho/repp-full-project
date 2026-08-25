"use client";

import React from "react";

interface LyricsViewerProps {
  lyrics: string;
  fontSize?: "normal" | "large" | "xlarge" | "xxlarge";
}

const FONT_SIZE_CLASSES = {
  normal: "text-base sm:text-lg leading-relaxed",
  large: "text-xl sm:text-2xl leading-relaxed",
  xlarge: "text-2xl sm:text-3xl leading-relaxed font-semibold",
  xxlarge: "text-3xl sm:text-4xl leading-loose font-bold",
};

// Regex to detect section headers like [Refrão], [Verso 1], (Refrão), [Intro], [Solo], [Ponte], [Final], etc.
const SECTION_HEADER_REGEX = /^(\[|\()(Refr[aã]o|Chorus|Verso|Verse|Intro|Ponte|Bridge|Solo|Pr[eé]-Refr[aã]o|Pre-Chorus|Final|Outro)[^\]\)]*(\]|\)):?$/i;

const CHORUS_KEYWORD_REGEX = /(refr[aã]o|chorus)/i;

export function LyricsViewer({
  lyrics,
  fontSize = "large",
}: LyricsViewerProps) {
  if (!lyrics || !lyrics.trim()) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <p className="text-lg font-semibold">Nenhuma letra cadastrada.</p>
      </div>
    );
  }

  // Normalize line breaks and split into stanzas/paragraphs by 2 or more newlines
  const normalized = lyrics.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawStanzas = normalized.split(/\n{2,}/);

  const fontClass = FONT_SIZE_CLASSES[fontSize] || FONT_SIZE_CLASSES.large;

  return (
    <div className={`space-y-8 sm:space-y-10 font-sans tracking-wide text-zinc-100 ${fontClass}`}>
      {rawStanzas.map((stanza, stanzaIndex) => {
        const lines = stanza.split("\n");
        const firstLine = lines[0]?.trim() || "";
        const isHeader = SECTION_HEADER_REGEX.test(firstLine);
        const isChorus = CHORUS_KEYWORD_REGEX.test(stanza);

        return (
          <div
            key={stanzaIndex}
            className={`p-3 sm:p-4 rounded-2xl transition-all ${
              isChorus
                ? "border-l-4 border-emerald-400 bg-emerald-950/20 pl-4 sm:pl-6 shadow-sm shadow-emerald-950/30"
                : "border-l-4 border-transparent pl-4 sm:pl-6 hover:bg-zinc-900/40"
            }`}
          >
            {/* If the stanza starts with a tag like [Refrão], display it as a tag badge */}
            {isHeader && (
              <div className="mb-3">
                <span
                  className={`inline-block rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold uppercase tracking-wider ${
                    isChorus
                      ? "bg-emerald-500 text-zinc-950 shadow-sm"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {firstLine.replace(/[\[\]\(\)]/g, "")}
                </span>
              </div>
            )}

            {/* Stanza Lines */}
            <div className="space-y-1.5 sm:space-y-2">
              {(isHeader ? lines.slice(1) : lines).map((line, lineIndex) => {
                if (!line.trim()) {
                  return <div key={lineIndex} className="h-4" />;
                }

                // Check if this single line is a chord or section marker inside the stanza
                const isSingleHeader = SECTION_HEADER_REGEX.test(line.trim());
                if (isSingleHeader) {
                  return (
                    <div key={lineIndex} className="pt-2 pb-1">
                      <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                        {line.trim()}
                      </span>
                    </div>
                  );
                }

                return (
                  <p
                    key={lineIndex}
                    className="whitespace-pre-wrap break-words leading-relaxed select-text"
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
