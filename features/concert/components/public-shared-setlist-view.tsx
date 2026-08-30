"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicSharedConcert, PublicSharedSetlistItem } from "@/features/concert/types";
import { LyricsViewer } from "@/features/concert/components/lyrics-viewer";

interface PublicSharedSetlistViewProps {
  concert: PublicSharedConcert;
}

export function PublicSharedSetlistView({
  concert,
}: PublicSharedSetlistViewProps) {
  const [activeLyricsIndex, setActiveLyricsIndex] = useState<number | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const formattedDate = new Date(concert.presentationDate).toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }
  );

  const scheduleFormatted =
    concert.startTime || concert.finishTime
      ? `${concert.startTime || "--:--"} às ${concert.finishTime || "--:--"}`
      : null;

  const setlist = concert.setlist || [];
  const currentItem: PublicSharedSetlistItem | undefined =
    activeLyricsIndex !== null ? setlist[activeLyricsIndex] : undefined;
  const currentMusic = currentItem?.music;

  // ---------------------------------------------------------------------------
  // VIEW 1: IMMERSIVE LYRICS VIEW (Optimized for stage performance)
  // ---------------------------------------------------------------------------
  if (activeLyricsIndex !== null && currentMusic) {
    const keyDisplay = currentMusic.preferredKey || currentMusic.originalKey;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden select-none animate-in fade-in duration-150">
        {/* Floating Close Button at Top Right */}
        <div className="fixed top-3 right-3 z-30">
          <button
            type="button"
            onClick={() => setActiveLyricsIndex(null)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 px-3.5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Fechar letra e voltar ao setlist"
          >
            <span>✕</span>
            <span>Fechar</span>
          </button>
        </div>

        {/* Main Lyrics Area (Full Height, No Top or Bottom Bar) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-12 pt-4 pb-24 max-w-4xl mx-auto w-full">
          {/* In-flow Song Information Header */}
          <div className="mb-4 pb-3 border-b border-zinc-800/70 flex items-center justify-between gap-3 pr-24">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 font-black text-zinc-950 text-xs shrink-0">
                  #{activeLyricsIndex + 1}
                </span>
                <h1 className="text-base sm:text-lg font-black text-zinc-100 truncate tracking-tight">
                  {currentMusic.title}
                </h1>
                {keyDisplay && (
                  <span className="rounded-md bg-emerald-950 border border-emerald-500/70 px-2 py-0.5 font-mono font-bold text-xs text-emerald-400">
                    Tom: {keyDisplay}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-400 truncate block mt-0.5">
                {currentMusic.artist} • <span className="text-zinc-500">{concert.title}</span>
              </span>
            </div>
          </div>

          {/* Item Note Banner */}
          {currentItem?.note && (
            <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-800/80 p-2.5 sm:p-3 text-xs sm:text-sm text-amber-200 shadow-sm">
              <span className="font-extrabold uppercase tracking-wider text-[10px] sm:text-xs block mb-0.5 text-amber-400">
                💬 Observação:
              </span>
              {currentItem.note}
            </div>
          )}

          <LyricsViewer lyrics={currentMusic.lyrics || ""} fontSize="large" />
        </main>

        {/* Floating PROXIMA Button at the Bottom */}
        {activeLyricsIndex < setlist.length - 1 && (
          <button
            type="button"
            onClick={() => setActiveLyricsIndex((prev) => (prev !== null ? prev + 1 : null))}
            className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3 text-xs sm:text-sm font-black shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            title="Próxima música do setlist"
          >
            <span>PRÓXIMA</span>
            <span>▶</span>
          </button>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: PUBLIC OVERVIEW (Concert Details, Google Maps & Setlist)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Banner: REPP Branding & CTA */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
              R
            </span>
            <div>
              <span className="text-xs font-bold text-zinc-200 block leading-tight">
                REPP
              </span>
              <span className="text-[10px] text-zinc-400 block">
                Repertório & Palco
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-3.5 py-1.5 text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            Salvar no meu REPP
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Presentation Header Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7 space-y-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                {concert.projectName}
              </span>
              <span className="text-xs text-zinc-500">
                • {setlist.length} {setlist.length === 1 ? "música" : "músicas"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-50 tracking-tight">
              {concert.title}
            </h1>
          </div>

          {/* Details Row: Date, Schedule, Duration */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
              <span>📅</span>
              <span className="capitalize">{formattedDate}</span>
            </span>

            {scheduleFormatted && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-zinc-200">
                  <span>⏰</span>
                  <span>{scheduleFormatted}</span>
                </span>
              </>
            )}

            {concert.durationInHours && (
              <span className="text-zinc-400 text-xs">
                ({concert.durationInHours}h)
              </span>
            )}
          </div>

          {/* Address Line with direct Google Maps link */}
          <div className="pt-2 border-t border-zinc-800/80">
            {concert.location ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(concert.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 hover:underline max-w-full group py-0.5 transition-colors"
                title="Abrir endereço no Google Maps (nova aba)"
              >
                <span className="shrink-0">📍</span>
                <span className="font-medium truncate">{concert.location}</span>
                <span className="text-xs text-emerald-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  ↗
                </span>
              </a>
            ) : (
              <span className="text-xs text-zinc-500 italic inline-flex items-center gap-1">
                <span>📍</span>
                <span>Local não informado</span>
              </span>
            )}
          </div>

          {/* Notes */}
          {concert.note && (
            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-3.5 text-xs text-zinc-300">
              <span className="font-bold text-zinc-400 block mb-1">
                Observações do show:
              </span>
              {concert.note}
            </div>
          )}
        </div>

        {/* Setlist Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>🎵</span>
              <span>Repertório da Apresentação</span>
            </h2>
            <span className="text-xs text-zinc-400">
              Toque em uma música para ver a letra
            </span>
          </div>

          {setlist.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center text-zinc-500">
              <p className="text-sm">Nenhuma música adicionada a este setlist ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {setlist.map((item, index) => {
                const key = item.music.preferredKey || item.music.originalKey;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveLyricsIndex(index)}
                    className="group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-800 font-mono font-bold text-xs text-zinc-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                            {item.music.title}
                          </span>
                          {key && (
                            <span className="rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono font-bold text-xs text-emerald-400 shrink-0">
                              {key}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 block truncate">
                          {item.music.artist}
                        </span>
                        {item.note && (
                          <span className="text-[11px] text-amber-400/90 block mt-0.5 truncate">
                            💬 {item.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-zinc-400 group-hover:text-emerald-400 transition-colors hidden xs:inline">
                        Ver Letra
                      </span>
                      <span className="text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Stage Mode Trigger Button */}
      {setlist.length > 0 && activeLyricsIndex === null && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            type="button"
            onClick={() => setActiveLyricsIndex(0)}
            className="flex items-center gap-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-3 text-xs sm:text-sm font-black shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all cursor-pointer"
            title="Iniciar visualizador de palco a partir da 1ª música"
          >
            <span>▶</span>
            <span>MODO PALCO</span>
          </button>
        </div>
      )}

      {/* Conversion / Register Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-base">
                  R
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-50">
                    Crie sua conta no REPP
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Gerencie repertórios, letras e shows
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p>
                Com o <strong>REPP</strong>, você organiza o repertório da sua banda, cria setlists instantâneos e usa o leitor de letras sem distrações direto no palco.
              </p>
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-1.5 text-xs text-zinc-400">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span>✨</span> O que você ganha:
                </p>
                <p>• Acesso a todas as músicas e letras deste show</p>
                <p>• Ajuste de tom para o seu instrumento</p>
                <p>• Seus próprios projetos e apresentações</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/register"
                className="w-full flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-4 py-3 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                Criar Conta Grátis
              </Link>
              <Link
                href="/login"
                className="w-full flex items-center justify-center rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-4 py-2.5 text-xs transition-colors"
              >
                Já tenho conta (Fazer Login)
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
