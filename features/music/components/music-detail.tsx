"use client";

import { useState } from "react";
import type { Music, MusicalKey } from "../types";
import { GENRE_LABELS } from "./music-filters";
import { LyricsViewer } from "@/features/concert/components/lyrics-viewer";
import { ChordsViewer } from "./chords-viewer";
import { ConcertPresentationMode } from "@/features/concert/components/concert-presentation-mode";
import { updateMusicAction } from "../actions/music-actions";

interface MusicDetailProps {
  music: Music;
  initialTab?: "lyrics" | "chords";
  onClose: () => void;
  onEdit: (music: Music) => void;
  onDelete: (id: string) => void;
}

export function MusicDetail({
  music,
  initialTab = "lyrics",
  onClose,
  onEdit,
  onDelete,
}: MusicDetailProps) {
  const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());
  const hasChords = Boolean(music.chords && music.chords.trim());

  const defaultTab = initialTab || (hasLyrics ? "lyrics" : hasChords ? "chords" : "lyrics");
  const [activeTab, setActiveTab] = useState<"lyrics" | "chords">(defaultTab);
  const [preferredKey, setPreferredKey] = useState<MusicalKey | null>(music.preferredKey ?? null);
  const [isStageMode, setIsStageMode] = useState(false);
  const [chordsMode, setChordsMode] = useState<"render" | "raw">("render");

  if (isStageMode) {
    return (
      <ConcertPresentationMode
        setlist={[
          {
            id: music.id,
            concertId: "standalone",
            musicId: music.id,
            position: 1,
            note: music.note,
            createdAt: new Date(),
            music: {
              ...music,
              preferredKey,
            },
          },
        ]}
        initialMode={activeTab}
        concertTitle="Repertório"
        onClose={() => setIsStageMode(false)}
      />
    );
  }

  const handleSavePreferredKey = async (newKey: string) => {
    const musicalKey = newKey as MusicalKey;
    const res = await updateMusicAction(music.id, { preferredKey: musicalKey });
    if (res.success) {
      setPreferredKey(musicalKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">
                {music.title}
              </h2>
              {preferredKey && (
                <span className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
                  {preferredKey}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-emerald-400 mt-0.5">
              {music.artist}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(hasLyrics || hasChords) && (
              <button
                type="button"
                onClick={() => setIsStageMode(true)}
                className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Abrir em tela cheia otimizada para leitura no palco"
              >
                <span>⛶</span>
                <span>Tela Cheia</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {music.originalKey && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300">
                Tom Original: {music.originalKey}
              </span>
            )}
            {music.genres && music.genres.length > 0 ? (
              music.genres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-lg bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300 font-medium"
                >
                  {GENRE_LABELS[g] || g}
                </span>
              ))
            ) : music.genre ? (
              <span className="inline-flex items-center rounded-lg bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300 font-medium">
                {GENRE_LABELS[music.genre]}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                music.skillLevel
                  ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                  : "bg-amber-950/60 border border-amber-800 text-amber-300"
              }`}
            >
              {music.skillLevel ? "✓ Dominada" : "⏳ Em estudo"}
            </span>

            {music.sheetMusicFile && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300">
                📄 Partitura: {music.sheetMusicFile}
              </span>
            )}
          </div>

          {/* Spotify Link */}
          {music.spotifyLink && (
            <div>
              <a
                href={music.spotifyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.307c-.216.353-.674.467-1.026.25-2.812-1.718-6.352-2.107-10.522-1.155-.403.092-.803-.16-.895-.562-.092-.403.16-.803.562-.895 4.567-1.042 8.487-.6 11.631 1.336.353.216.467.674.25 1.026zm1.468-3.264c-.272.443-.852.585-1.295.313-3.218-1.977-8.125-2.55-11.932-1.393-.497.151-1.028-.133-1.179-.63-.151-.497.133-1.028.63-1.179 4.354-1.321 9.775-.68 13.463 1.594.443.272.585.852.313 1.295zm.126-3.41c-3.859-2.292-10.228-2.503-13.908-1.385-.593.18-1.222-.16-1.402-.753-.18-.593.16-1.222.753-1.402 4.237-1.286 11.267-1.041 15.698 1.59.534.317.708 1.01.391 1.544-.317.534-1.01.708-1.532.406z" />
                </svg>
                Ouvir no Spotify
              </a>
            </div>
          )}

          {/* Tab Navigation: Letra / Cifra */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("lyrics")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "lyrics"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span>📝</span>
              <span>Letra</span>
              {hasLyrics && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    activeTab === "lyrics" ? "bg-zinc-950/30 text-zinc-950" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  ✓
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chords")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "chords"
                  ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span>🎸</span>
              <span>Cifra</span>
              {hasChords && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    activeTab === "chords" ? "bg-zinc-950/30 text-zinc-950" : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  ✓
                </span>
              )}
            </button>
          </div>

          {/* Observations / Notes */}
          {music.note && (
            <div className="rounded-xl bg-zinc-950/80 border border-emerald-500/30 p-3 text-xs text-zinc-200">
              <span className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                <span>💬</span> Observações:
              </span>
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-300 font-sans">
                {music.note}
              </p>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === "lyrics" ? (
            /* LYRICS VIEW */
            <div className="rounded-2xl bg-zinc-950 p-4 sm:p-5 border border-zinc-800/80 shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>📝</span> Letra da Música
                </span>
                {preferredKey && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Tom: {preferredKey}
                  </span>
                )}
              </div>

              {hasLyrics ? (
                <LyricsViewer lyrics={music.lyrics || ""} fontSize="normal" />
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-xs italic">Nenhuma letra cadastrada para esta música.</p>
                  {hasChords && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("chords")}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                    >
                      <span>🎸 Ver Cifra Disponível</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* CHORDS VIEW */
            <div className="rounded-2xl bg-zinc-950 p-4 sm:p-5 border border-zinc-800/80 shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3 flex-wrap gap-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <span>🎸</span> Cifra / Acordes
                </span>
                {hasChords && (
                  <div className="flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700 p-0.5">
                    <button
                      type="button"
                      onClick={() => setChordsMode("render")}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        chordsMode === "render"
                          ? "bg-zinc-700 text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Formatado
                    </button>
                    <button
                      type="button"
                      onClick={() => setChordsMode("raw")}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        chordsMode === "raw"
                          ? "bg-zinc-700 text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Texto Bruto
                    </button>
                  </div>
                )}
              </div>

              {hasChords ? (
                <ChordsViewer
                  chords={music.chords || ""}
                  originalKey={music.originalKey}
                  preferredKey={preferredKey}
                  fontSize="normal"
                  mode={chordsMode}
                  onSavePreferredKey={handleSavePreferredKey}
                />
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-xs italic">Nenhuma cifra cadastrada para esta música.</p>
                  {hasLyrics && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("lyrics")}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                    >
                      <span>📝 Ver Letra Disponível</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
          <button
            type="button"
            onClick={() => onDelete(music.id)}
            className="rounded-xl px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
          >
            Excluir
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => onEdit(music)}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

