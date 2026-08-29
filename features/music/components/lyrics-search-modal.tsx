"use client";

import { useState } from "react";
import type { LyricsSearchResult } from "../types";

interface LyricsSearchModalProps {
  isOpen: boolean;
  results: LyricsSearchResult[];
  onClose: () => void;
  onSelect: (result: LyricsSearchResult) => void;
}

export function LyricsSearchModal({
  isOpen,
  results,
  onClose,
  onSelect,
}: LyricsSearchModalProps) {
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    results[0]?.id || null
  );

  if (!isOpen) return null;

  const currentPreview =
    results.find((r) => r.id === selectedPreviewId) || results[0];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 text-zinc-100 shadow-2xl flex flex-col max-h-[85vh] my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-50 flex items-center gap-2">
              <span>🔍</span>
              <span>Músicas Encontradas ({results.length})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Selecione a versão para importar título, artista e letra para o formulário.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Results List and Preview */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {results.map((item) => {
            const isSelected = item.id === (currentPreview?.id || "");

            return (
              <div
                key={item.id}
                onClick={() => setSelectedPreviewId(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? "bg-emerald-950/30 border-emerald-500/80 shadow-sm"
                    : "bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-zinc-100 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-300 truncate">
                      {item.artist}
                      {item.album && (
                        <span className="text-zinc-500 font-normal">
                          {" "}
                          • {item.album}
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item);
                    }}
                    className="shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Usar Esta Música
                  </button>
                </div>

                {/* Lyrics Preview Accordion/Snippet */}
                {isSelected && (
                  <div className="mt-1 pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                      Pré-visualização:
                    </span>
                    <pre className="font-mono text-[11px] text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-xl bg-zinc-950/70 p-2.5 border border-zinc-800/60">
                      {item.plainLyrics}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-zinc-800 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
