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
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge" | "xxlarge">("large");
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          setIsFullscreen(true);
        }
      } catch {
        // User gesture or permission restriction, ignore
      }
    };

    void enterFullscreen();

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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (document.documentElement as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
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

  if (!currentItem || !music) {
    return null;
  }

  const keyDisplay = music.preferredKey || music.originalKey;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-zinc-50 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 px-4 sm:px-8 py-3 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 font-extrabold text-zinc-950 text-base shrink-0 shadow-lg shadow-emerald-500/20">
            #{currentIndex + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-50 truncate tracking-tight">
                {music.title}
              </h1>
              {keyDisplay && (
                <span className="rounded-xl bg-emerald-950 border border-emerald-500/80 px-2.5 py-0.5 font-mono font-black text-sm text-emerald-400 shadow-sm shadow-emerald-950">
                  Tom: {keyDisplay}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-zinc-400 truncate block mt-0.5">
              {music.artist} • <span className="text-zinc-500 font-medium">{concertTitle}</span>
            </span>
          </div>
        </div>

        {/* Top Controls: Font Size, Fullscreen & Exit */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Font Size Selector */}
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setFontSize("normal")}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                fontSize === "normal"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tamanho normal"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize("large")}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                fontSize === "large"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tamanho grande"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize("xlarge")}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                fontSize === "xlarge"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tamanho extra grande"
            >
              A++
            </button>
            <button
              type="button"
              onClick={() => setFontSize("xxlarge")}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer hidden sm:inline ${
                fontSize === "xxlarge"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tamanho gigante (palco distante)"
            >
              MAX
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${
              isFullscreen
                ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            }`}
            title="Alternar modo tela cheia (Fullscreen)"
          >
            {isFullscreen ? "⛶ Tela Cheia: ON" : "⛶ Tela Cheia"}
          </button>

          {/* Exit Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Sair do modo apresentação (Esc)"
          >
            ✕ Sair
          </button>
        </div>
      </header>

      {/* Main Lyrics Reading Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-12 py-8 max-w-4xl mx-auto w-full">
        {/* Performance Note Banner */}
        {music.note && (
          <div className="mb-8 rounded-2xl bg-amber-950/40 border border-amber-800/90 p-4 text-sm sm:text-base text-amber-200 shadow-md">
            <span className="font-extrabold uppercase tracking-wider text-xs block mb-1 text-amber-400">
              💬 Observação da Música:
            </span>
            {music.note}
          </div>
        )}

        {/* Formatted Lyrics View with Paragraphs and Chorus Highlighting */}
        <LyricsViewer lyrics={music.lyrics || ""} fontSize={fontSize} />
      </main>

      {/* Floating Bottom Navigation Bar */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/95 px-4 sm:px-8 py-3 shrink-0 flex items-center justify-between backdrop-blur-md">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 px-5 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <span>◀</span>
          <span>Anterior</span>
        </button>

        <div className="text-center">
          <span className="text-xs sm:text-sm font-bold text-zinc-300">
            Música {currentIndex + 1} de {setlist.length}
          </span>
        </div>

        <button
          type="button"
          disabled={currentIndex === setlist.length - 1}
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs sm:text-sm font-black text-zinc-950 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <span>Próxima</span>
          <span>▶</span>
        </button>
      </footer>
    </div>
  );
}
