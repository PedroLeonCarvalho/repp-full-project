"use client";

import { useEffect, useState } from "react";
import type { ConcertWithSetlist, SetlistItem } from "../types";
import { getConcertByIdAction } from "../actions/concert-actions";
import { LyricsViewer } from "./lyrics-viewer";

interface ConcertLiveSetlistProps {
  concertId: string;
  onClose: () => void;
}

export function ConcertLiveSetlist({
  concertId,
  onClose,
}: ConcertLiveSetlistProps) {
  const [concert, setConcert] = useState<ConcertWithSetlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLyricsIndex, setActiveLyricsIndex] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge" | "xxlarge">("large");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live real-time clock ticking every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch concert data
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const res = await getConcertByIdAction(concertId);
      if (!isCancelled && res.success && res.data) {
        setConcert(res.data);
      }
      if (!isCancelled) {
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [concertId]);

  // Request Fullscreen & Screen WakeLock (prevent sleep on stage)
  useEffect(() => {
    let wakeLockSentinel: { release: () => Promise<void> } | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockSentinel = await (
            navigator as unknown as {
              wakeLock: {
                request: (
                  type: string
                ) => Promise<{ release: () => Promise<void> }>;
              };
            }
          ).wakeLock.request("screen");
        }
      } catch {
        // WakeLock optional / permission restriction
      }
    };

    void requestWakeLock();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (wakeLockSentinel) {
        void wakeLockSentinel.release();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Keyboard navigation when in lyrics presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLyricsIndex !== null && concert?.setlist) {
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          if (activeLyricsIndex < concert.setlist.length - 1) {
            setActiveLyricsIndex((prev) => (prev !== null ? prev + 1 : null));
          }
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          if (activeLyricsIndex > 0) {
            setActiveLyricsIndex((prev) => (prev !== null ? prev - 1 : null));
          }
        } else if (e.key === "Escape") {
          setActiveLyricsIndex(null);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLyricsIndex, concert?.setlist, onClose]);

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
        }
        setIsFullscreen(false);
      }
    } catch {
      // Ignore
    }
  };

  if (isLoading || !concert) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center text-zinc-400 text-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Carregando setlist da apresentação...
        </div>
      </div>
    );
  }

  const setlist = concert.setlist || [];
  const currentMusicItem: SetlistItem | undefined =
    activeLyricsIndex !== null ? setlist[activeLyricsIndex] : undefined;
  const currentMusic = currentMusicItem?.music;

  // -------------------------------------------------------------
  // VIEW 1: LYRICS PRESENTATION MODE (When "Ver Letra" is active)
  // -------------------------------------------------------------
  if (activeLyricsIndex !== null && currentMusic) {
    const keyDisplay = currentMusic.preferredKey || currentMusic.originalKey;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden select-none animate-in fade-in duration-150">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-3 sm:px-6 py-2.5 shrink-0 backdrop-blur-md gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveLyricsIndex(null)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer shrink-0"
              title="Voltar para a lista do setlist"
            >
              <span>⬅</span>
              <span className="hidden sm:inline">Setlist</span>
            </button>

            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 font-extrabold text-zinc-950 text-sm shrink-0 shadow-md shadow-emerald-500/20">
              #{activeLyricsIndex + 1}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-black text-zinc-50 truncate tracking-tight">
                  {currentMusic.title}
                </h1>
                {keyDisplay && (
                  <span className="rounded-lg bg-emerald-950 border border-emerald-500/80 px-2 py-0.5 font-mono font-bold text-xs text-emerald-400">
                    Tom: {keyDisplay}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-400 truncate block">
                {currentMusic.artist} •{" "}
                <span className="text-zinc-500">{concert.title}</span>
              </span>
            </div>
          </div>

          {/* Center/Right: Schedule & Live Clock */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real-time Clock */}
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-zinc-800/90 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400 tracking-wider">
                {currentTime}
              </span>
            </div>

            {/* Font Size Adjusters */}
            <div className="hidden sm:flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-0.5">
              <button
                type="button"
                onClick={() => setFontSize("normal")}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                  fontSize === "normal"
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                  fontSize === "large"
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize("xlarge")}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                  fontSize === "xlarge"
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                A++
              </button>
              <button
                type="button"
                onClick={() => setFontSize("xxlarge")}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                  fontSize === "xxlarge"
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                MAX
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer hidden xs:inline"
              title="Alternar tela cheia"
            >
              {isFullscreen ? "⛶ ON" : "⛶"}
            </button>

            {/* Close lyrics button */}
            <button
              type="button"
              onClick={() => setActiveLyricsIndex(null)}
              className="rounded-xl bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Main Lyrics Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-12 py-6 max-w-4xl mx-auto w-full">
          {/* Note Banner */}
          {currentMusic.note && (
            <div className="mb-6 rounded-2xl bg-amber-950/40 border border-amber-800/80 p-3.5 text-xs sm:text-sm text-amber-200 shadow-sm">
              <span className="font-extrabold uppercase tracking-wider text-[10px] sm:text-xs block mb-0.5 text-amber-400">
                💬 Observação:
              </span>
              {currentMusic.note}
            </div>
          )}

          <LyricsViewer lyrics={currentMusic.lyrics || ""} fontSize={fontSize} />
        </main>

        {/* Bottom Navigation */}
        <footer className="border-t border-zinc-800 bg-zinc-900/95 px-4 sm:px-8 py-3 shrink-0 flex items-center justify-between backdrop-blur-md">
          <button
            type="button"
            disabled={activeLyricsIndex === 0}
            onClick={() => setActiveLyricsIndex((prev) => (prev !== null ? prev - 1 : null))}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-700 transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>◀</span>
            <span className="hidden xs:inline">Anterior</span>
          </button>

          <div className="text-center">
            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
              Música {activeLyricsIndex + 1} de {setlist.length}
            </span>
          </div>

          <button
            type="button"
            disabled={activeLyricsIndex === setlist.length - 1}
            onClick={() => setActiveLyricsIndex((prev) => (prev !== null ? prev + 1 : null))}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-black text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="hidden xs:inline">Próxima</span>
            <span>▶</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: LIVE SETLIST SONG LISTING (Main stage overview)
  // -------------------------------------------------------------
  const scheduleFormatted =
    concert.startTime || concert.finishTime
      ? `${concert.startTime || "--:--"} às ${concert.finishTime || "--:--"}`
      : "Horário não definido";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header: Show Title, Schedule, Real-Time Clock & Controls */}
      <header className="border-b border-zinc-800/90 bg-zinc-900/95 px-4 sm:px-8 py-3.5 shrink-0 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              {concert.projectName}
            </span>
            {concert.location && (
              <span className="text-zinc-500 text-xs truncate max-w-[220px]">
                • 📍 {concert.location}
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-zinc-50 tracking-tight truncate">
            {concert.title}
          </h1>
        </div>

        {/* Schedule, Live Clock and Action buttons */}
        <div className="flex items-center gap-2.5 sm:gap-4 ml-auto flex-wrap">
          {/* Show Schedule: Start & Finish Time */}
          <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
            <span className="text-emerald-400">⏰</span>
            <span className="font-medium text-zinc-400 hidden sm:inline">Show:</span>
            <span className="font-semibold text-zinc-200 font-mono">
              {scheduleFormatted}
            </span>
            {concert.durationInHours && (
              <span className="text-[11px] text-zinc-500 hidden md:inline">
                ({concert.durationInHours}h)
              </span>
            )}
          </div>

          {/* Real-time Clock */}
          <div className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-emerald-500/30 px-3.5 py-1.5 shadow-sm shadow-emerald-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-400 tracking-wider">
              {currentTime}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer hidden xs:inline-flex items-center gap-1.5 ${
              isFullscreen
                ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                : "bg-zinc-800/80 border-zinc-700/70 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
            title="Alternar modo tela cheia"
          >
            <span>⛶</span>
            <span>{isFullscreen ? "Tela Cheia: ON" : "Tela Cheia"}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 border border-zinc-700/80 px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            ✕ Fechar
          </button>
        </div>
      </header>

      {/* Main Setlist List Container */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-8 py-5 max-w-4xl mx-auto w-full">
        {/* Setlist Summary Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-zinc-200">
              Músicas da Apresentação ({setlist.length})
            </span>
            <span className="text-zinc-500 text-xs hidden sm:inline">
              • Toque em &quot;Ver Letra&quot; para abrir a letra no palco
            </span>
          </div>

          {setlist.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveLyricsIndex(0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
            >
              <span>▶ Iniciar do Começo (#1)</span>
            </button>
          )}
        </div>

        {/* Setlist Cards */}
        {setlist.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center my-8">
            <div className="text-3xl mb-3 text-zinc-600">🎵</div>
            <h3 className="text-base font-semibold text-zinc-300">
              O setlist deste show está vazio
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Adicione músicas a este show através do botão &quot;Ver Dados&quot; na lista de apresentações para visualizá-las aqui durante a apresentação.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {setlist.map((item, index) => {
              const music = item.music;
              if (!music) return null;
              const keyDisplay = music.preferredKey || music.originalKey;
              const noteText = music.note || item.note;
              const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700/80 transition-all gap-3 group"
                >
                  {/* Left: Position Number and Details */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 font-extrabold text-xs sm:text-sm shrink-0 border border-zinc-700/50 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors">
                      #{index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-sm sm:text-base text-zinc-100 truncate tracking-tight">
                          {music.title}
                        </h2>

                        {keyDisplay && (
                          <span className="rounded-lg bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400 shrink-0">
                            Tom: {keyDisplay}
                          </span>
                        )}

                        {noteText && (
                          <span className="rounded-lg bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 text-[11px] text-amber-300 truncate max-w-[180px] sm:max-w-[300px]">
                            💬 {noteText}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {music.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right: "Ver Letra" Action */}
                  <div className="shrink-0">
                    {hasLyrics ? (
                      <button
                        type="button"
                        onClick={() => setActiveLyricsIndex(index)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <span>📜</span>
                        <span>Ver Letra</span>
                      </button>
                    ) : (
                      <span className="rounded-xl bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-[11px] font-medium text-zinc-500">
                        Sem letra
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Info Bar */}
      <footer className="border-t border-zinc-800/80 bg-zinc-900/90 px-4 sm:px-8 py-2.5 text-xs text-zinc-500 shrink-0 flex items-center justify-between">
        <span>
          Apresentação: <strong className="text-zinc-300">{concert.title}</strong>
        </span>
        <span className="font-mono text-emerald-500/80">
          ● Ao Vivo no Palco
        </span>
      </footer>
    </div>
  );
}
