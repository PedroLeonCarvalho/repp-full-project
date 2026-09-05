"use client";

import { useEffect, useState } from "react";
import type { ConcertWithSetlist, SetlistItem } from "../types";
import {
  getConcertByIdAction,
  reorderSetlistAction,
} from "../actions/concert-actions";
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
  const fontSize = "large" as const;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Desktop Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !concert) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...concert.setlist];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, draggedItem);

    // Optimistic update
    setConcert({ ...concert, setlist: items });
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist new order
    const orderedIds = items.map((it) => it.id);
    await reorderSetlistAction(concertId, orderedIds);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Mobile / Touch Drag and Drop (Hold and Slide)
  const handleTouchStart = (index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );
    const row = targetElement?.closest(
      "[data-setlist-index]"
    ) as HTMLElement | null;
    if (row && row.dataset.setlistIndex !== undefined) {
      const targetIndex = parseInt(row.dataset.setlistIndex, 10);
      if (!isNaN(targetIndex) && targetIndex !== dragOverIndex) {
        setDragOverIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex &&
      concert
    ) {
      const items = [...concert.setlist];
      const [draggedItem] = items.splice(draggedIndex, 1);
      items.splice(dragOverIndex, 0, draggedItem);

      setConcert({ ...concert, setlist: items });
      setDraggedIndex(null);
      setDragOverIndex(null);

      const orderedIds = items.map((it) => it.id);
      await reorderSetlistAction(concertId, orderedIds);
    } else {
      setDraggedIndex(null);
      setDragOverIndex(null);
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
        {/* Floating Controls at Top Right */}
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
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
            <span>{isFullscreen ? "Tela Cheia: ON" : "Tela Cheia"}</span>
          </button>

          {/* Close Button */}
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
          {/* In-flow Song Information Header (scrolls with content) */}
          <div className="mb-4 pb-3 border-b border-zinc-800/70 flex items-center justify-between gap-3 pr-44 sm:pr-52">
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
                    {keyDisplay}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-400 truncate block mt-0.5">
                {currentMusic.artist} • <span className="text-zinc-500">{concert.title}</span>
              </span>
            </div>
          </div>

          {/* Note Banner */}
          {currentMusic.note && (
            <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-800/80 p-2.5 sm:p-3 text-xs sm:text-sm text-amber-200 shadow-sm">
              <span className="font-extrabold uppercase tracking-wider text-[10px] sm:text-xs block mb-0.5 text-amber-400">
                💬 Observação:
              </span>
              {currentMusic.note}
            </div>
          )}

          <LyricsViewer lyrics={currentMusic.lyrics || ""} fontSize={fontSize} />
        </main>

        {/* Floating PROXIMA Button at the Bottom (No bar background) */}
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
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-zinc-200">
              Músicas ({setlist.length})
            </span>
            <span className="text-zinc-500 text-xs hidden sm:inline">
              • Segure ⠿ para reordenar
            </span>
          </div>
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
          <div className="flex flex-col gap-1.5">
            {setlist.map((item, index) => {
              const music = item.music;
              if (!music) return null;
              const keyDisplay = music.preferredKey || music.originalKey;
              const noteText = music.note || item.note;
              const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={item.id}
                  data-setlist-index={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-xl border transition-all gap-2 group select-none ${
                    isDragging
                      ? "opacity-30 border-2 border-dashed border-emerald-500 bg-zinc-950/60"
                      : isDragOver
                      ? "border-2 border-emerald-500/80 bg-emerald-950/30 scale-[1.01]"
                      : "border-zinc-800/80 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700/80"
                  }`}
                >
                  {/* Left: Drag Handle, Number and Music Title (bigger letters, single line, truncate if too long) */}
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    {/* Drag Handle (Hold and Slide) */}
                    <div
                      onTouchStart={() => handleTouchStart(index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-200 select-none text-base sm:text-lg px-0.5 py-0.5 shrink-0 touch-none"
                      title="Segure e deslize para reordenar"
                    >
                      ⠿
                    </div>

                    {/* Order number */}
                    <span className="font-extrabold text-xs sm:text-sm text-zinc-400 shrink-0 w-6 text-center">
                      #{index + 1}
                    </span>

                    {/* Music Title (bigger letters, emphasis, single row, hide excess with truncate) */}
                    <span
                      onClick={() => hasLyrics && setActiveLyricsIndex(index)}
                      className={`font-bold text-base sm:text-lg text-zinc-100 truncate tracking-tight cursor-pointer hover:text-emerald-400 transition-colors ${
                        !hasLyrics ? "cursor-default hover:text-zinc-100" : ""
                      }`}
                      title={music.title}
                    >
                      {music.title}
                    </span>
                  </div>

                  {/* Right: Tune (Tom), Notes & Compact "Letra" Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Note / Observação badge (if present) */}
                    {noteText && (
                      <span
                        className="rounded-md bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 text-[11px] text-amber-300 truncate max-w-[90px] sm:max-w-[150px] hidden xs:inline"
                        title={noteText}
                      >
                        💬 {noteText}
                      </span>
                    )}

                    {/* Tune / Key - Emphasized */}
                    {keyDisplay && (
                      <span className="rounded-lg bg-emerald-950 border border-emerald-500/70 px-2 py-0.5 text-xs sm:text-sm font-mono font-extrabold text-emerald-300 shrink-0">
                        {keyDisplay}
                      </span>
                    )}

                    {/* Compact "Letra" Button */}
                    {hasLyrics ? (
                      <button
                        type="button"
                        onClick={() => setActiveLyricsIndex(index)}
                        className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0"
                        title="Ver letra"
                      >
                        Letra
                      </button>
                    ) : (
                      <span className="rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1 text-[10px] font-medium text-zinc-500 shrink-0">
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
