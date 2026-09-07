"use client";

import { useEffect, useState } from "react";
import type { SetlistItem } from "../types";
import { LyricsViewer } from "./lyrics-viewer";
import { ChordsViewer } from "@/features/music/components/chords-viewer";

interface ConcertPresentationModeProps {
  setlist: SetlistItem[];
  initialIndex?: number;
  initialMode?: "lyrics" | "chords";
  concertTitle: string;
  onClose: () => void;
  onComplete?: (itemId: string) => void;
}

type LyricsFontSize = "small" | "normal" | "large" | "xlarge" | "xxlarge";
const FONT_SIZES: LyricsFontSize[] = ["small", "normal", "large", "xlarge", "xxlarge"];
const FONT_SIZE_LABELS: Record<LyricsFontSize, string> = {
  small: "P",
  normal: "M",
  large: "G",
  xlarge: "XG",
  xxlarge: "2XG",
};

export function ConcertPresentationMode({
  setlist,
  initialIndex = 0,
  initialMode = "lyrics",
  concertTitle,
  onClose,
  onComplete,
}: ConcertPresentationModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<"lyrics" | "chords">(initialMode);
  const [chordsMode, setChordsMode] = useState<"render" | "raw">("render");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState<LyricsFontSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("repp_lyrics_font_size");
      if (
        saved &&
        ["small", "normal", "large", "xlarge", "xxlarge"].includes(saved)
      ) {
        return saved as LyricsFontSize;
      }
    }
    return "large";
  });

  const handleFontSizeChange = (newSize: LyricsFontSize) => {
    setLyricsFontSize(newSize);
    if (typeof window !== "undefined") {
      localStorage.setItem("repp_lyrics_font_size", newSize);
    }
  };

  const currentSizeIndex = FONT_SIZES.indexOf(lyricsFontSize);
  const decreaseFontSize = () => {
    if (currentSizeIndex > 0) {
      handleFontSizeChange(FONT_SIZES[currentSizeIndex - 1]);
    }
  };
  const increaseFontSize = () => {
    if (currentSizeIndex < FONT_SIZES.length - 1) {
      handleFontSizeChange(FONT_SIZES[currentSizeIndex + 1]);
    }
  };

  const currentItem = setlist[currentIndex];
  const music = currentItem?.music;

  // Request Fullscreen & Keep Screen Awake (WakeLock)
  useEffect(() => {
    const enterFullscreen = async () => {
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

    // Keep Screen Awake on mobile
    let wakeLockSentinel: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockSentinel = await (
            navigator as unknown as {
              wakeLock: {
                request: (type: string) => Promise<{ release: () => Promise<void> }>;
              };
            }
          ).wakeLock.request("screen");
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
  const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());
  const hasChords = Boolean(music.chords && music.chords.trim());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-zinc-50 overflow-hidden select-none">
      {/* Floating Controls at Top Right */}
      <div className="fixed top-3 right-3 z-30 flex items-center gap-2 flex-wrap justify-end">
        {/* View Mode Switcher: Letra / Cifra */}
        <div className="flex items-center rounded-full bg-zinc-900/90 border border-zinc-700/70 p-0.5 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => setViewMode("lyrics")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "lyrics"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Letra
          </button>
          <button
            type="button"
            onClick={() => setViewMode("chords")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === "chords"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>🎸</span>
            <span>Cifra</span>
          </button>
        </div>

        {/* Chords Render Mode Toggle (Only visible in chords mode) */}
        {viewMode === "chords" && hasChords && (
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

        {/* Font Size Adjuster for Lyrics (A- / A+) */}
        {viewMode === "lyrics" && hasLyrics && (
          <div className="flex items-center rounded-full bg-zinc-900/90 border border-zinc-700/70 p-0.5 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={decreaseFontSize}
              disabled={currentSizeIndex === 0}
              className="rounded-full px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Diminuir tamanho da fonte da letra (A-)"
            >
              A-
            </button>
            <span
              className="text-[11px] font-mono font-extrabold text-emerald-400 px-1 min-w-[24px] text-center select-none"
              title={`Tamanho atual: ${FONT_SIZE_LABELS[lyricsFontSize]}`}
            >
              {FONT_SIZE_LABELS[lyricsFontSize]}
            </span>
            <button
              type="button"
              onClick={increaseFontSize}
              disabled={currentSizeIndex === FONT_SIZES.length - 1}
              className="rounded-full px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Aumentar tamanho da fonte da letra (A+)"
            >
              A+
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
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 px-3.5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
          title="Fechar e voltar (Esc)"
        >
          <span>✕</span>
          <span>Fechar</span>
        </button>
      </div>

      {/* Main Content Area (Full Height) */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-12 pt-4 pb-24 max-w-4xl mx-auto w-full">
        {/* In-flow Song Information Header (scrolls with content) */}
        <div className="mb-4 pb-3 border-b border-zinc-800/70 flex items-center justify-between gap-3 pr-44 sm:pr-64">
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

        {/* Mode Content: Lyrics or Chords */}
        {viewMode === "lyrics" ? (
          hasLyrics ? (
            <LyricsViewer lyrics={music.lyrics || ""} fontSize={lyricsFontSize} />
          ) : (
            <div className="py-20 text-center text-zinc-500">
              <p className="text-base font-semibold text-zinc-400">Nenhuma letra cadastrada para esta música.</p>
              {hasChords && (
                <button
                  type="button"
                  onClick={() => setViewMode("chords")}
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
              chords={music.chords || ""}
              originalKey={music.originalKey}
              preferredKey={music.preferredKey}
              fontSize="large"
              mode={chordsMode}
            />
          ) : (
            <div className="py-20 text-center text-zinc-500">
              <p className="text-base font-semibold text-zinc-400">Nenhuma cifra cadastrada para esta música.</p>
              {hasLyrics && (
                <button
                  type="button"
                  onClick={() => setViewMode("lyrics")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                >
                  <span>📝 Ver Letra Disponível</span>
                </button>
              )}
            </div>
          )
        )}
      </main>

      {/* Floating CONCLUIR Button at Bottom */}
      <button
        type="button"
        onClick={() => {
          if (onComplete) {
            onComplete(currentItem.id);
          }
          onClose();
        }}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3 text-xs sm:text-sm font-black shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
        title="Concluir música e voltar ao setlist"
      >
        <span>CONCLUIR</span>
        <span>✓</span>
      </button>
    </div>
  );
}



