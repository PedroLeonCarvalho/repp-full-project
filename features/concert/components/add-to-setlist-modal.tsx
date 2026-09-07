"use client";

import { useEffect, useState } from "react";
import type { Music, MusicGenre } from "@/features/music/types";
import { listMusicsAction } from "@/features/music/actions/music-actions";
import { MUSIC_GENRES } from "@/db/schema/enums";
import { GENRE_LABELS } from "@/features/music/components/music-filters";

interface AddToSetlistModalProps {
  isOpen: boolean;
  existingMusicIds: Set<string>;
  initialSearch?: string;
  onClose: () => void;
  onAdd: (musicIds: string[]) => Promise<void>;
}

export function AddToSetlistModal(props: AddToSetlistModalProps) {
  if (!props.isOpen) return null;
  return <AddToSetlistModalContent {...props} />;
}

function AddToSetlistModalContent({
  existingMusicIds,
  initialSearch = "",
  onClose,
  onAdd,
}: AddToSetlistModalProps) {
  const [musics, setMusics] = useState<Music[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre | "">("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setIsLoading(true);
      const res = await listMusicsAction();
      if (!isCancelled && res.success) {
        setMusics(res.data);
      }
      setIsLoading(false);
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredMusics = musics.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.artist.toLowerCase().includes(q) ||
      (m.preferredKey && m.preferredKey.toLowerCase().includes(q)) ||
      (m.originalKey && m.originalKey.toLowerCase().includes(q));

    const musicGenres =
      m.genres && m.genres.length > 0
        ? m.genres
        : m.genre
        ? [m.genre]
        : [];

    const matchesGenre =
      !selectedGenre || musicGenres.includes(selectedGenre as MusicGenre);

    return matchesSearch && matchesGenre;
  });

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const selectable = filteredMusics.filter((m) => !existingMusicIds.has(m.id));
    const allSelected = selectable.every((m) => selectedIds.has(m.id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectable.forEach((m) => next.delete(m.id));
      } else {
        selectable.forEach((m) => next.add(m.id));
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      await onAdd(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectableVisible = filteredMusics.filter((m) => !existingMusicIds.has(m.id));
  const isAllVisibleSelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((m) => selectedIds.has(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 text-zinc-100 shadow-2xl flex flex-col h-[92vh] max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-50 tracking-tight">
              Adicionar Músicas ao Setlist
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Selecione as músicas do seu acervo para incluir no repertório deste show.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Search & Genre Filters Bar */}
        <div className="py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, artista ou tom..."
              className="w-full rounded-xl bg-zinc-800/80 pl-9 pr-8 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 p-0.5 rounded text-xs cursor-pointer"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Genre Filter Select */}
          <div className="sm:w-60 shrink-0">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value as MusicGenre | "")}
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="">Todos os gêneros</option>
              {MUSIC_GENRES.map((g) => (
                <option key={g} value={g}>
                  {GENRE_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status & Quick Selection Toolbar */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-xs text-zinc-400">
          <span>
            Exibindo <strong className="text-zinc-200">{filteredMusics.length}</strong> de{" "}
            <strong className="text-zinc-200">{musics.length}</strong> músicas
            {selectedGenre && (
              <span className="ml-2 text-emerald-400 font-semibold">
                • Gênero: {GENRE_LABELS[selectedGenre as MusicGenre]}
              </span>
            )}
          </span>

          {selectableVisible.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              {isAllVisibleSelected ? "Desmarcar visíveis" : "Selecionar todas visíveis"}
            </button>
          )}
        </div>

        {/* Songs Grid Container (Expanded height) */}
        <div className="flex-1 overflow-y-auto pr-1 my-2">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-zinc-500">
              Carregando acervo de músicas...
            </div>
          ) : filteredMusics.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">
              Nenhuma música encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredMusics.map((music) => {
                const isInSetlist = existingMusicIds.has(music.id);
                const isSelected = selectedIds.has(music.id);
                const keyDisplay = music.preferredKey || music.originalKey;

                const musicGenres =
                  music.genres && music.genres.length > 0
                    ? music.genres
                    : music.genre
                    ? [music.genre]
                    : [];

                return (
                  <div
                    key={music.id}
                    onClick={() => !isInSetlist && handleToggle(music.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isInSetlist
                        ? "opacity-40 cursor-not-allowed bg-zinc-950/30 border-zinc-800/40"
                        : isSelected
                        ? "bg-emerald-950/40 border-emerald-500/80 shadow-md cursor-pointer"
                        : "bg-zinc-800/40 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700/80 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        disabled={isInSetlist}
                        checked={isSelected || isInSetlist}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 disabled:opacity-40 shrink-0 cursor-pointer"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                            {music.title}
                          </span>
                          {keyDisplay && (
                            <span className="rounded bg-emerald-950 border border-emerald-500/70 px-1.5 py-0.5 text-[10px] font-mono font-extrabold text-emerald-400 shrink-0">
                              {keyDisplay}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[11px] text-zinc-400 truncate">
                            {music.artist}
                          </span>

                          {musicGenres.map((g) => (
                            <span
                              key={g}
                              className="rounded-full bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 text-[10px] text-zinc-300 font-medium shrink-0"
                            >
                              {GENRE_LABELS[g] || g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isInSetlist && (
                      <span className="text-[10px] text-zinc-500 font-bold px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 ml-2">
                        Já no Setlist
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 shrink-0">
          <span className="text-xs font-semibold text-zinc-300">
            {selectedIds.size} {selectedIds.size === 1 ? "música selecionada" : "músicas selecionadas"}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 || isSubmitting}
              onClick={handleConfirm}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Adicionando..." : `Adicionar (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
