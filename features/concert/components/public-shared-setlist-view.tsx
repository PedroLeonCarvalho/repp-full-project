"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicSharedConcert, PublicSharedSetlistItem } from "@/features/concert/types";
import { LyricsViewer } from "@/features/concert/components/lyrics-viewer";
import { ChordsViewer } from "@/features/music/components/chords-viewer";
import { formatConcertDate } from "@/lib/date-utils";

interface PublicSharedSetlistViewProps {
  concert: PublicSharedConcert;
}

export function PublicSharedSetlistView({
  concert,
}: PublicSharedSetlistViewProps) {
  const [activePresentation, setActivePresentation] = useState<{
    index: number;
    mode: "lyrics" | "chords";
  } | null>(null);
  const [chordsMode, setChordsMode] = useState<"render" | "raw">("render");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (
          (
            document.documentElement as unknown as {
              webkitRequestFullscreen?: () => Promise<void>;
            }
          ).webkitRequestFullscreen
        ) {
          await (
            document.documentElement as unknown as {
              webkitRequestFullscreen: () => Promise<void>;
            }
          ).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (
          (
            document as unknown as {
              webkitExitFullscreen?: () => Promise<void>;
            }
          ).webkitExitFullscreen
        ) {
          await (
            document as unknown as {
              webkitExitFullscreen: () => Promise<void>;
            }
          ).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Ignore
    }
  };

  const formattedDate = formatConcertDate(concert.presentationDate, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scheduleFormatted =
    concert.startTime || concert.finishTime
      ? `${concert.startTime || "--:--"} às ${concert.finishTime || "--:--"}`
      : null;

  const setlist = concert.setlist || [];
  const currentItem: PublicSharedSetlistItem | undefined =
    activePresentation !== null ? setlist[activePresentation.index] : undefined;
  const currentMusic = currentItem?.music;

  // ---------------------------------------------------------------------------
  // VIEW 1: IMMERSIVE STAGE VIEW (Lyrics & Chords Screen)
  // ---------------------------------------------------------------------------
  if (activePresentation !== null && currentMusic) {
    const keyDisplay = currentMusic.preferredKey || currentMusic.originalKey;
    const hasLyrics = Boolean(currentMusic.lyrics && currentMusic.lyrics.trim());
    const hasChords = Boolean(currentMusic.chords && currentMusic.chords.trim());
    const mode = activePresentation.mode;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden select-none animate-in fade-in duration-150">
        {/* Floating Controls at Top Right */}
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2 flex-wrap justify-end">
          {/* Switcher Letra / Cifra */}
          <div className="flex items-center rounded-full bg-zinc-900/90 border border-zinc-700/70 p-0.5 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => setActivePresentation({ ...activePresentation, mode: "lyrics" })}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                mode === "lyrics"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Letra
            </button>
            <button
              type="button"
              onClick={() => setActivePresentation({ ...activePresentation, mode: "chords" })}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === "chords"
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>🎸</span>
              <span>Cifra</span>
            </button>
          </div>

          {/* Chords Render Toggle */}
          {mode === "chords" && hasChords && (
            <div className="hidden sm:flex items-center rounded-full bg-zinc-900/90 border border-zinc-700/70 p-0.5 backdrop-blur-md shadow-lg">
              <button
                type="button"
                onClick={() => setChordsMode("render")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
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
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  chordsMode === "raw"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Texto
              </button>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              isFullscreen
                ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-300 hover:bg-emerald-900/80"
                : "bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-700/60 text-zinc-200 hover:text-white"
            }`}
            title={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
          >
            <span>⛶</span>
            <span className="hidden xs:inline">{isFullscreen ? "Tela Cheia: ON" : "Tela Cheia"}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => setActivePresentation(null)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 px-3.5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Fechar e voltar ao setlist"
          >
            <span>✕</span>
            <span>Fechar</span>
          </button>
        </div>

        {/* Main Area (Full Height) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-12 pt-4 pb-24 max-w-4xl mx-auto w-full">
          {/* In-flow Song Information Header */}
          <div className="mb-4 pb-3 border-b border-zinc-800/70 flex items-center justify-between gap-3 pr-44 sm:pr-64">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 font-black text-zinc-950 text-xs shrink-0">
                  #{activePresentation.index + 1}
                </span>
                <h1 className="text-base sm:text-lg font-black text-zinc-100 truncate tracking-tight">
                  {currentMusic.title}
                </h1>
                {keyDisplay && (
                  <span className="rounded-md bg-emerald-950 border border-emerald-500/70 px-2 py-0.5 font-mono font-bold text-xs text-emerald-400">
                    {keyDisplay}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-400 truncate block mt-0.5">
                {currentMusic.artist} • <span className="text-zinc-500">{concert.title}</span>
              </span>
            </div>
          </div>

          {/* Item Note / Music Observation Banner */}
          {(currentItem?.note || currentMusic.note) && (
            <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-800/80 p-2.5 sm:p-3 text-xs sm:text-sm text-amber-200 shadow-sm">
              <span className="font-extrabold uppercase tracking-wider text-[10px] sm:text-xs block mb-0.5 text-amber-400">
                💬 Observação:
              </span>
              {currentItem?.note && currentMusic.note
                ? `${currentItem.note} (${currentMusic.note})`
                : currentItem?.note || currentMusic.note}
            </div>
          )}

          {/* Render Lyrics or Chords based on selected mode */}
          {mode === "lyrics" ? (
            hasLyrics ? (
              <LyricsViewer lyrics={currentMusic.lyrics || ""} fontSize="large" />
            ) : (
              <div className="py-20 text-center text-zinc-500">
                <p className="text-base font-semibold text-zinc-400">Nenhuma letra cadastrada para esta música.</p>
                {hasChords && (
                  <button
                    type="button"
                    onClick={() => setActivePresentation({ ...activePresentation, mode: "chords" })}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3.5 py-1.5 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                  >
                    <span>🎸 Ver Cifra Disponível</span>
                  </button>
                )}
              </div>
            )
          ) : (
            hasChords ? (
              <ChordsViewer
                chords={currentMusic.chords || ""}
                originalKey={currentMusic.originalKey}
                preferredKey={currentMusic.preferredKey}
                fontSize="large"
                mode={chordsMode}
              />
            ) : (
              <div className="py-20 text-center text-zinc-500">
                <p className="text-base font-semibold text-zinc-400">Nenhuma cifra cadastrada para esta música.</p>
                {hasLyrics && (
                  <button
                    type="button"
                    onClick={() => setActivePresentation({ ...activePresentation, mode: "lyrics" })}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    <span>📝 Ver Letra Disponível</span>
                  </button>
                )}
              </div>
            )
          )}
        </main>

        {/* Floating PROXIMA Button at the Bottom */}
        {activePresentation.index < setlist.length - 1 && (
          <button
            type="button"
            onClick={() =>
              setActivePresentation((prev) =>
                prev ? { ...prev, index: prev.index + 1 } : null
              )
            }
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
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-zinc-700/60 bg-zinc-900 shrink-0">
              <Image
                src="/logo.svg"
                alt="REPP Logo"
                width={32}
                height={32}
                className="object-cover h-full w-full"
                priority
              />
            </div>
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
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-3.5 py-1.5 text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Importar repertório para meu REPP</span>
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
                const hasLyrics = Boolean(item.music.lyrics && item.music.lyrics.trim());
                const hasChords = Boolean(item.music.chords && item.music.chords.trim());

                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
                  >
                    <div
                      onClick={() => {
                        if (hasLyrics) {
                          setActivePresentation({ index, mode: "lyrics" });
                        } else if (hasChords) {
                          setActivePresentation({ index, mode: "chords" });
                        }
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-800 font-mono font-bold text-xs text-zinc-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                            {item.music.title}
                          </span>
                          {/* Study Status Bullet */}
                          {item.music.studying ? (
                            <span
                              title="Música em estudo"
                              className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0"
                            />
                          ) : (
                            <span
                              title="Música pronta no repertório"
                              className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                            />
                          )}
                          {key && (
                            <span className="rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono font-bold text-xs text-emerald-400 shrink-0">
                              {key}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 block truncate">
                          {item.music.artist}
                        </span>
                        {(item.note || item.music.note) && (
                          <span
                            className="text-[11px] text-amber-400/90 block mt-0.5 truncate"
                            title={item.note && item.music.note ? `${item.note} (${item.music.note})` : item.note || item.music.note || undefined}
                          >
                            💬 {item.note && item.music.note ? `${item.note} (${item.music.note})` : item.note || item.music.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      {/* Letra button */}
                      {hasLyrics ? (
                        <button
                          type="button"
                          onClick={() => setActivePresentation({ index, mode: "lyrics" })}
                          className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0"
                          title="Ver letra"
                        >
                          Letra
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-2 py-1 text-[10px] font-medium text-zinc-600 shrink-0 hidden sm:inline">
                          Sem letra
                        </span>
                      )}

                      {/* Cifra button */}
                      {hasChords ? (
                        <button
                          type="button"
                          onClick={() => setActivePresentation({ index, mode: "chords" })}
                          className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                          title="Ver cifra"
                        >
                          <span>🎸</span>
                          <span>Cifra</span>
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-2 py-1 text-[10px] font-medium text-zinc-600 shrink-0 hidden sm:inline">
                          Sem cifra
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Stage Mode Trigger Button */}
      {setlist.length > 0 && activePresentation === null && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            type="button"
            onClick={() => setActivePresentation({ index: 0, mode: "lyrics" })}
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
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-zinc-700/60 bg-zinc-900 shrink-0">
                  <Image
                    src="/logo.svg"
                    alt="REPP Logo"
                    width={36}
                    height={36}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-50">
                      Conheça o REPP
                    </h3>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Em desenvolvimento
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Gestão centralizada de repertórios, letras e apresentações
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

            {/* Scrollable Content */}
            <div className="space-y-4 overflow-y-auto pr-1 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p className="text-xs text-zinc-300">
                O <strong>REPP</strong> foi criado para simplificar a vida do músico no palco e nos ensaios. Esta versão já permite uma gestão completa das suas apresentações e repertório:
              </p>

              {/* Current Features Card */}
              <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/90 p-4 space-y-2">
                <p className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> Disponível nesta versão:
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Músicas com Letra Automática:</strong> Cadastro de músicas com busca automática de letras.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Contratantes e Músicos:</strong> Cadastro de contratantes e gestão da equipe de músicos parceiros.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Apresentações & Setlists:</strong> Criação de shows, setlists com arrastar-e-soltar e modo palco imersivo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Contratos Padronizados:</strong> Geração de contrato simples e padronizado em PDF pronto para envio.</span>
                  </li>
                </ul>
              </div>

              {/* Roadmap / Coming Soon Card */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-950/20 to-zinc-950 border border-emerald-500/20 p-4 space-y-2">
                <p className="font-bold text-zinc-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>🚀</span> Em desenvolvimento (em breve):
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✦</span>
                    <span><strong>Partituras e Cifras:</strong> Inclusão de partituras e cifras na música, além de integração com o <em>iReal Pro</em>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✦</span>
                    <span><strong>Colaboração em Tempo Real:</strong> Compartilhamento em tempo real para montar o repertório junto com toda a banda.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✦</span>
                    <span><strong>Rede de Músicos:</strong> Uma comunidade de músicos conectados através de repertórios e afinidades musicais em comum.</span>
                  </li>
                </ul>
              </div>
              {/* Private Beta Notice */}
              <div className="rounded-2xl bg-amber-950/30 border border-amber-800/60 p-3.5 text-xs text-amber-200/90 space-y-1">
                <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <span>🔒</span> Acesso Antecipado Fechado
                </p>
                <p className="leading-relaxed">
                  O REPP ainda está em desenvolvimento restrito e <strong>não está aberto para cadastros públicos no momento</strong>. A funcionalidade de importar este repertório diretamente para sua conta estará disponível no lançamento oficial.
                </p>
              </div>
            </div>

            {/* Actions (Registration disabled for now) */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-800 shrink-0">
              {/* Disabled Register Button */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 text-zinc-500 font-bold px-4 py-3 text-xs sm:text-sm cursor-not-allowed select-none"
                title="Cadastros públicos temporariamente indisponíveis"
              >
                <span>🔒</span>
                <span>Cadastrar-se (Em breve)</span>
              </button>

              <div className="flex items-center justify-between px-1">
                <Link
                  href="/login"
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Já é um testador convidado? <strong className="text-zinc-200 underline">Fazer Login</strong>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
