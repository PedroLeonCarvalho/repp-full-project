"use client";

import { useEffect, useState } from "react";
import type { SetlistItem } from "../types";
import { LyricsViewer } from "./lyrics-viewer";

interface ConcertPresentationModeProps {
  setlist: SetlistItem[];
  initialIndex?: number;
  concertTitle: string;
  onClose: () => void;
}

export function ConcertPresentationMode({
  setlist,
  initialIndex = 0,
  concertTitle,
  onClose,
}: ConcertPresentationModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fontSize = "large" as const;

  const currentItem = setlist[currentIndex];
  const music = currentItem?.music;

  // Request Fullscreen & Keep Screen Awake (WakeLock)
  useEffect(() => {
    // 1. Auto request Fullscreen on mobile/desktop
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
            await (document.documentElement as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
          }
        }
      } catch {
        // User gesture or permission restriction, ignore
      }
    };

    void enterFullscreen();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    // 2. Keep Screen Awake on mobile
    let wakeLockSentinel: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockSentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request("screen");
        }
      } catch {
        // WakeLock optional
      }
    };

    void requestWakeLock();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      if (wakeLockSentinel) {
        void wakeLockSentinel.release();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        void document.exitFullscreen().catch(() => {});
      }
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

  // Keyboard navigation: Left/Right arrows, Escape to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        if (currentIndex < setlist.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, setlist.length, onClose]);

  if (!currentItem || !music) {
    return null;
  }

  const keyDisplay = music.preferredKey || music.originalKey;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-zinc-50 overflow-hidden select-none">
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
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 px-3.5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
          title="Fechar letra e voltar ao setlist (Esc)"
        >
          <span>✕</span>
          <span>Fechar</span>
        </button>
      </div>

      {/* Main Lyrics Reading Area (Full Height) */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-12 pt-4 pb-24 max-w-4xl mx-auto w-full">
        {/* In-flow Song Information Header (scrolls with content) */}
        <div className="mb-4 pb-3 border-b border-zinc-800/70 flex items-center justify-between gap-3 pr-44 sm:pr-52">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 font-black text-zinc-950 text-xs shrink-0">
                #{currentIndex + 1}
              </span>
              <h1 className="text-base sm:text-lg font-black text-zinc-100 truncate tracking-tight">
                {music.title}
              </h1>
              {keyDisplay && (
                <span className="rounded-md bg-emerald-950 border border-emerald-500/70 px-2 py-0.5 font-mono font-bold text-xs text-emerald-400">
                  {keyDisplay}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs text-zinc-400 truncate block mt-0.5">
              {music.artist} • <span className="text-zinc-500">{concertTitle}</span>
            </span>
          </div>
        </div>

        {/* Performance Note Banner */}
        {music.note && (
          <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-800/90 p-2.5 sm:p-3 text-xs sm:text-sm text-amber-200 shadow-md">
            <span className="font-extrabold uppercase tracking-wider text-[10px] sm:text-xs block mb-0.5 text-amber-400">
              💬 Observação:
            </span>
            {music.note}
          </div>
        )}

        {/* Formatted Lyrics View with Paragraphs and Chorus Highlighting */}
        <LyricsViewer lyrics={music.lyrics || ""} fontSize={fontSize} />
      </main>

      {/* Floating PROXIMA Button at Bottom (No bar container) */}
      {currentIndex < setlist.length - 1 && (
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => prev + 1)}
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
