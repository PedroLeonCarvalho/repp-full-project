"use client";

import { useEffect, useState } from "react";
import type { ConcertWithSetlist, SetlistItem } from "../types";
import {
  addMusicsToSetlistAction,
  getConcertByIdAction,
  reorderSetlistAction,
} from "../actions/concert-actions";
import { AddToSetlistModal } from "./add-to-setlist-modal";
import { ConcertPresentationMode } from "./concert-presentation-mode";
import type { Music } from "@/features/music/types";
import { MusicForm } from "@/features/music/components/music-form";
import {
  listMusicsAction,
  updateMusicAction,
} from "@/features/music/actions/music-actions";

interface ConcertLiveSetlistProps {
  concertId: string;
  onClose: () => void;
}

export function ConcertLiveSetlist({
  concertId,
  onClose,
}: ConcertLiveSetlistProps) {
  const [concert, setConcert] = useState<ConcertWithSetlist | null>(null);
  const [allMusics, setAllMusics] = useState<Music[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePresentation, setActivePresentation] = useState<{
    index?: number;
    customMusic?: Music;
    mode: "lyrics" | "chords";
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [editingMusic, setEditingMusic] = useState<Music | null>(null);
  const [addingMusicId, setAddingMusicId] = useState<string | null>(null);

  const toggleCompleteItem = (itemId: string) => {
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

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

  // Fetch concert data and customer's full repertoire in parallel
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const [concertRes, musicsRes] = await Promise.all([
        getConcertByIdAction(concertId),
        listMusicsAction(),
      ]);

      if (!isCancelled) {
        if (concertRes.success && concertRes.data) {
          setConcert(concertRes.data);
        }
        if (musicsRes.success && musicsRes.data) {
          setAllMusics(musicsRes.data);
        }
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

  // Keyboard navigation when in presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePresentation !== null && concert?.setlist) {
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          if (
            activePresentation.index !== undefined &&
            activePresentation.index < concert.setlist.length - 1
          ) {
            setActivePresentation((prev) =>
              prev ? { ...prev, index: (prev.index ?? 0) + 1 } : null
            );
          }
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          if (
            activePresentation.index !== undefined &&
            activePresentation.index > 0
          ) {
            setActivePresentation((prev) =>
              prev ? { ...prev, index: (prev.index ?? 0) - 1 } : null
            );
          }
        } else if (e.key === "Escape") {
          setActivePresentation(null);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePresentation, concert?.setlist, onClose]);

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

  const handleAddMusics = async (musicIds: string[]) => {
    const res = await addMusicsToSetlistAction(concertId, musicIds);
    if (res.success) {
      const refreshed = await getConcertByIdAction(concertId);
      if (refreshed.success && refreshed.data) {
        setConcert(refreshed.data);
      }
    }
  };

  const handleQuickAddMusic = async (musicId: string) => {
    setAddingMusicId(musicId);
    try {
      const res = await addMusicsToSetlistAction(concertId, [musicId]);
      if (res.success) {
        const refreshed = await getConcertByIdAction(concertId);
        if (refreshed.success && refreshed.data) {
          setConcert(refreshed.data);
        }
      }
    } finally {
      setAddingMusicId(null);
    }
  };

  if (isLoading || !concert) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center text-zinc-400 text-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Carregando repertório e setlist da apresentação...
        </div>
      </div>
    );
  }

  const setlist = concert.setlist || [];
  const existingMusicIds = new Set(setlist.map((it) => it.musicId));

  // -------------------------------------------------------------
  // VIEW 1: STAGE PRESENTATION MODE (Lyrics & Chords Screen)
  // -------------------------------------------------------------
  if (activePresentation !== null) {
    let presentationSetlist: SetlistItem[] = setlist;
    let presentationIndex = 0;

    if (activePresentation.customMusic) {
      const customMusic = activePresentation.customMusic;
      const foundIdx = setlist.findIndex((it) => it.musicId === customMusic.id);
      if (foundIdx !== -1) {
        presentationIndex = foundIdx;
      } else {
        const tempItem: SetlistItem = {
          id: `temp-${customMusic.id}`,
          concertId,
          musicId: customMusic.id,
          position: setlist.length + 1,
          note: null,
          createdAt: new Date(),
          music: customMusic,
        };
        presentationSetlist = [...setlist, tempItem];
        presentationIndex = presentationSetlist.length - 1;
      }
    } else if (activePresentation.index !== undefined) {
      presentationIndex = activePresentation.index;
    }

    const currentMusicItem = presentationSetlist[presentationIndex];
    if (currentMusicItem?.music) {
      return (
        <ConcertPresentationMode
          setlist={presentationSetlist}
          initialIndex={presentationIndex}
          initialMode={activePresentation.mode}
          concertTitle={concert.title}
          existingMusicIds={existingMusicIds}
          onAddToSetlist={async (musicId) => {
            await handleQuickAddMusic(musicId);
          }}
          onClose={() => setActivePresentation(null)}
          onComplete={(itemId) => {
            setCompletedItemIds((prev) => new Set(prev).add(itemId));
          }}
        />
      );
    }
  }

  // -------------------------------------------------------------
  // VIEW 2: SEARCH ACROSS FULL REPERTOIRE OR VIEW LIVE SETLIST
  // -------------------------------------------------------------
  const isSearching = searchTerm.trim().length > 0;
  const q = searchTerm.toLowerCase().trim();

  // Search across the customer's full repertoire (allMusics)
  const searchResults = isSearching
    ? allMusics.filter((m) => {
        const titleMatch = m.title.toLowerCase().includes(q);
        const artistMatch = m.artist.toLowerCase().includes(q);
        const keyMatch =
          (m.preferredKey && m.preferredKey.toLowerCase().includes(q)) ||
          (m.originalKey && m.originalKey.toLowerCase().includes(q));
        const lyricsMatch = m.lyrics && m.lyrics.toLowerCase().includes(q);
        const chordsMatch = m.chords && m.chords.toLowerCase().includes(q);
        const noteMatch = m.note && m.note.toLowerCase().includes(q);

        const setlistItem = setlist.find((it) => it.musicId === m.id);
        const setlistNoteMatch =
          setlistItem?.note && setlistItem.note.toLowerCase().includes(q);

        return (
          titleMatch ||
          artistMatch ||
          keyMatch ||
          lyricsMatch ||
          chordsMatch ||
          noteMatch ||
          setlistNoteMatch
        );
      })
    : [];

  const inSetlistCount = searchResults.filter((m) =>
    existingMusicIds.has(m.id)
  ).length;
  const inGeneralRepertoireCount = searchResults.length - inSetlistCount;

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

      {/* Main Setlist & Full Repertoire Search Container */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-8 py-5 max-w-4xl mx-auto w-full">
        {/* Search Bar & Full Repertoire Modal Button */}
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no repertório geral (título, artista, tom, letra)..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-9 pr-8 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 p-0.5 rounded text-xs cursor-pointer"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-3.5 py-2 text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Abrir acervo completo com filtros de gênero e seleção em lote"
          >
            <span>➕</span>
            <span>Buscar no Repertório</span>
          </button>
        </div>

        {/* Section Header: Either Repertoire Search Results or Setlist Summary */}
        {isSearching ? (
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-zinc-200">
                Músicas no Repertório Geral ({searchResults.length})
              </span>
              <span className="text-emerald-400 text-xs font-semibold">
                • {inSetlistCount} no setlist
              </span>
              {inGeneralRepertoireCount > 0 && (
                <span className="text-zinc-400 text-xs font-medium">
                  • {inGeneralRepertoireCount} no acervo geral
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Voltar ao setlist ordenado
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-zinc-200">
                Setlist do Show ({setlist.length})
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">
                • Segure ⠿ para reordenar
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              Acervo geral: {allMusics.length} músicas
            </span>
          </div>
        )}

        {/* CONTENT VIEW A: FULL REPERTOIRE SEARCH RESULTS */}
        {isSearching ? (
          searchResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 sm:p-12 text-center my-6">
              <div className="text-3xl mb-3 text-zinc-600">🔍</div>
              <h3 className="text-base font-semibold text-zinc-300">
                Nenhuma música encontrada no seu repertório
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Não encontramos &quot;{searchTerm}&quot; no seu acervo geral (título, artista, tom ou letra).
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <span>➕</span>
                  <span>Abrir Acervo Completo com Filtros</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((music) => {
                const setlistItem = setlist.find((it) => it.musicId === music.id);
                const isInSetlist = Boolean(setlistItem);
                const setlistIndex = isInSetlist ? setlist.indexOf(setlistItem!) : -1;
                const isCompleted = setlistItem
                  ? completedItemIds.has(setlistItem.id)
                  : false;
                const keyDisplay = music.preferredKey || music.originalKey;
                const noteText =
                  setlistItem?.note && music.note
                    ? `${setlistItem.note} (${music.note})`
                    : setlistItem?.note || music.note;
                const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());
                const hasChords = Boolean(music.chords && music.chords.trim());
                const isAddingThis = addingMusicId === music.id;

                return (
                  <div
                    key={music.id}
                    className={`flex items-center justify-between py-2.5 px-3 sm:px-4 rounded-2xl border transition-all gap-2 group select-none ${
                      isCompleted
                        ? "border-zinc-900 bg-zinc-950/60 opacity-40 hover:opacity-75 hover:border-zinc-800"
                        : isInSetlist
                        ? "border-emerald-900/60 bg-zinc-900/90 hover:bg-zinc-900 hover:border-emerald-700/80"
                        : "border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700/80"
                    }`}
                  >
                    {/* Left: Position Badge, Title & Artist */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {isInSetlist ? (
                        <span
                          className={`font-black text-xs sm:text-sm shrink-0 px-2 py-0.5 rounded-lg border ${
                            isCompleted
                              ? "bg-zinc-800 border-zinc-700 text-zinc-500"
                              : "bg-emerald-950 border-emerald-500/60 text-emerald-400"
                          }`}
                          title={`Música #${setlistIndex + 1} no setlist deste show`}
                        >
                          #{setlistIndex + 1}
                        </span>
                      ) : (
                        <span
                          className="font-bold text-[10px] sm:text-xs shrink-0 px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700/70 text-zinc-400"
                          title="Música do acervo geral (fora do setlist deste show)"
                        >
                          Acervo
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              if (isInSetlist && isCompleted) {
                                toggleCompleteItem(setlistItem!.id);
                              } else {
                                if (hasLyrics) {
                                  setActivePresentation({
                                    index: isInSetlist ? setlistIndex : undefined,
                                    customMusic: isInSetlist ? undefined : music,
                                    mode: "lyrics",
                                  });
                                } else if (hasChords) {
                                  setActivePresentation({
                                    index: isInSetlist ? setlistIndex : undefined,
                                    customMusic: isInSetlist ? undefined : music,
                                    mode: "chords",
                                  });
                                }
                              }
                            }}
                            className={`font-bold text-sm sm:text-base truncate tracking-tight transition-all cursor-pointer ${
                              isCompleted
                                ? "line-through text-zinc-500 hover:text-zinc-300"
                                : hasLyrics || hasChords
                                ? "text-zinc-100 hover:text-emerald-400"
                                : "text-zinc-200"
                            }`}
                            title={
                              isCompleted
                                ? `Concluída. Clique para desmarcar: ${music.title}`
                                : `Abrir no palco: ${music.title}`
                            }
                          >
                            {music.title}
                          </span>

                          {music.studying ? (
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
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
                          <span className="truncate">{music.artist}</span>
                          {isInSetlist ? (
                            <span className="text-emerald-400/90 font-medium shrink-0">
                              • No Setlist
                            </span>
                          ) : (
                            <span className="text-zinc-500 shrink-0">
                              • Do Repertório Geral
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Notes, Key & Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      {noteText && (
                        <span
                          className="rounded-md bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 text-[11px] text-amber-300 truncate max-w-[100px] sm:max-w-[160px] hidden sm:inline"
                          title={noteText}
                        >
                          💬 {noteText}
                        </span>
                      )}

                      {keyDisplay && (
                        <span className="rounded-lg bg-emerald-950 border border-emerald-500/70 px-2 py-0.5 text-xs sm:text-sm font-mono font-extrabold text-emerald-300 shrink-0">
                          {keyDisplay}
                        </span>
                      )}

                      {/* 1-Click "+ Setlist" Button if not yet in setlist */}
                      {!isInSetlist && (
                        <button
                          type="button"
                          disabled={isAddingThis}
                          onClick={() => handleQuickAddMusic(music.id)}
                          className="rounded-lg bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-500 hover:text-zinc-950 px-2 sm:px-2.5 py-1 text-xs font-bold text-emerald-300 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 disabled:opacity-50"
                          title="Adicionar esta música ao setlist deste show"
                        >
                          {isAddingThis ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                          ) : (
                            <span>+</span>
                          )}
                          <span className="hidden sm:inline">Setlist</span>
                        </button>
                      )}

                      {/* Letra Button */}
                      {hasLyrics ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActivePresentation({
                              index: isInSetlist ? setlistIndex : undefined,
                              customMusic: isInSetlist ? undefined : music,
                              mode: "lyrics",
                            })
                          }
                          className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0"
                          title="Ver letra no palco"
                        >
                          Letra
                        </button>
                      ) : null}

                      {/* Cifra Button */}
                      {hasChords ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActivePresentation({
                              index: isInSetlist ? setlistIndex : undefined,
                              customMusic: isInSetlist ? undefined : music,
                              mode: "chords",
                            })
                          }
                          className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                          title="Ver cifra no palco"
                        >
                          <span>🎸</span>
                          <span className="hidden xs:inline">Cifra</span>
                        </button>
                      ) : null}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingMusic(music)}
                        className="rounded-lg bg-zinc-800/80 border border-zinc-700/60 px-2 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                        title="Editar dados da música"
                      >
                        <span>✏️</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* CONTENT VIEW B: LIVE ORDERED SETLIST */
          setlist.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center my-8">
              <div className="text-3xl mb-3 text-zinc-600">🎵</div>
              <h3 className="text-base font-semibold text-zinc-300">
                O setlist deste show está vazio
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Adicione músicas diretamente do seu acervo musical para visualizá-las durante o show.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <span>➕</span>
                  <span>Buscar e Adicionar Músicas</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {setlist.map((item, index) => {
                const music = item.music;
                if (!music) return null;
                const isCompleted = completedItemIds.has(item.id);
                const keyDisplay = music.preferredKey || music.originalKey;
                const noteText =
                  item.note && music.note
                    ? `${item.note} (${music.note})`
                    : item.note || music.note;
                const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());
                const hasChords = Boolean(music.chords && music.chords.trim());
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={item.id}
                    data-setlist-index={index}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-xl border transition-all gap-2 group select-none ${
                      isDragging
                        ? "opacity-30 border-2 border-dashed border-emerald-500 bg-zinc-950/60"
                        : isDragOver
                        ? "border-2 border-emerald-500/80 bg-emerald-950/30 scale-[1.01]"
                        : isCompleted
                        ? "border-zinc-900 bg-zinc-950/60 opacity-40 hover:opacity-75 hover:border-zinc-800"
                        : "border-zinc-800/80 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700/80"
                    }`}
                  >
                    {/* Left: Drag Handle, Number and Music Title */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      {/* Drag Handle (Hold and Slide) */}
                      <div
                        onTouchStart={() => handleTouchStart(index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`cursor-grab active:cursor-grabbing select-none text-base sm:text-lg px-0.5 py-0.5 shrink-0 touch-none ${
                          isCompleted
                            ? "text-zinc-700"
                            : "text-zinc-500 hover:text-zinc-200"
                        }`}
                        title="Segure e deslize para reordenar"
                      >
                        ⠿
                      </div>

                      {/* Order number */}
                      <span
                        className={`font-extrabold text-xs sm:text-sm shrink-0 w-6 text-center ${
                          isCompleted ? "text-zinc-600" : "text-zinc-400"
                        }`}
                      >
                        #{index + 1}
                      </span>

                      {/* Music Title */}
                      <span
                        onClick={() => {
                          if (isCompleted) {
                            toggleCompleteItem(item.id);
                          } else {
                            if (hasLyrics) {
                              setActivePresentation({
                                index,
                                mode: "lyrics",
                              });
                            } else if (hasChords) {
                              setActivePresentation({
                                index,
                                mode: "chords",
                              });
                            }
                          }
                        }}
                        className={`font-bold text-base sm:text-lg truncate tracking-tight transition-all ${
                          isCompleted
                            ? "line-through text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            : hasLyrics || hasChords
                            ? "text-zinc-100 cursor-pointer hover:text-emerald-400"
                            : "text-zinc-100 cursor-default"
                        }`}
                        title={
                          isCompleted
                            ? `Música concluída. Clique para desmarcar: ${music.title}`
                            : music.title
                        }
                      >
                        {music.title}
                      </span>

                      {/* Study Status Bullet */}
                      {music.studying ? (
                        <span
                          title="Música em estudo"
                          className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"
                        />
                      ) : (
                        <span
                          title="Música pronta no repertório"
                          className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"
                        />
                      )}
                    </div>

                    {/* Right: Tune (Tom), Notes & Dedicated "Letra", "Cifra" and "Editar" Buttons */}
                    <div
                      className={`flex items-center gap-1.5 sm:gap-2 shrink-0 transition-opacity ${
                        isCompleted ? "opacity-60" : "opacity-100"
                      }`}
                    >
                      {/* Note badge */}
                      {noteText && (
                        <span
                          className="rounded-md bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 text-[11px] text-amber-300 truncate max-w-[120px] sm:max-w-[200px]"
                          title={noteText}
                        >
                          💬 {noteText}
                        </span>
                      )}

                      {/* Key Display */}
                      {keyDisplay && (
                        <span className="rounded-lg bg-emerald-950 border border-emerald-500/70 px-2 py-0.5 text-xs sm:text-sm font-mono font-extrabold text-emerald-300 shrink-0">
                          {keyDisplay}
                        </span>
                      )}

                      {/* Letra Button */}
                      {hasLyrics ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActivePresentation({ index, mode: "lyrics" })
                          }
                          className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0"
                          title="Ver letra desta música no palco"
                        >
                          Letra
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-2 py-1 text-[10px] font-medium text-zinc-600 shrink-0 hidden sm:inline">
                          Sem letra
                        </span>
                      )}

                      {/* Cifra Button */}
                      {hasChords ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActivePresentation({ index, mode: "chords" })
                          }
                          className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                          title="Ver cifra desta música no palco"
                        >
                          <span>🎸</span>
                          <span>Cifra</span>
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-2 py-1 text-[10px] font-medium text-zinc-600 shrink-0 hidden sm:inline">
                          Sem cifra
                        </span>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingMusic(music)}
                        className="rounded-lg bg-zinc-800/80 border border-zinc-700/60 px-2 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                        title="Editar dados da música (letra, cifra, tom, observação)"
                      >
                        <span>✏️</span>
                        <span className="hidden xs:inline">Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
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

      {/* Add To Setlist Modal (Customer Repertoire) */}
      <AddToSetlistModal
        isOpen={isAddModalOpen}
        existingMusicIds={existingMusicIds}
        initialSearch={searchTerm}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMusics}
      />

      {/* Edit Music Modal */}
      <MusicForm
        isOpen={Boolean(editingMusic)}
        initialData={editingMusic}
        onClose={() => setEditingMusic(null)}
        onSubmit={async (data) => {
          if (!editingMusic) return { success: false, error: "Música não encontrada." };
          const res = await updateMusicAction(editingMusic.id, data);
          if (res.success) {
            setEditingMusic(null);
            const [updatedConcert, updatedMusics] = await Promise.all([
              getConcertByIdAction(concertId),
              listMusicsAction(),
            ]);
            if (updatedConcert.success && updatedConcert.data) {
              setConcert(updatedConcert.data);
            }
            if (updatedMusics.success && updatedMusics.data) {
              setAllMusics(updatedMusics.data);
            }
          }
          return res;
        }}
      />
    </div>
  );
}
