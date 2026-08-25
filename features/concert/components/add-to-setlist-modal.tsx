"use client";

import { useEffect, useState } from "react";
import type { Music } from "@/features/music/types";
import { listMusicsAction } from "@/features/music/actions/music-actions";

interface AddToSetlistModalProps {
  isOpen: boolean;
  existingMusicIds: Set<string>;
  onClose: () => void;
  onAdd: (musicIds: string[]) => Promise<void>;
}

export function AddToSetlistModal({
  isOpen,
  existingMusicIds,
  onClose,
  onAdd,
}: AddToSetlistModalProps) {
  const [musics, setMusics] = useState<Music[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMusics = musics.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.artist.toLowerCase().includes(q) ||
      (m.preferredKey && m.preferredKey.toLowerCase().includes(q))
    );
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 text-zinc-100 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-50">
              Adicionar Músicas ao Setlist
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Selecione as músicas do seu acervo para incluir no repertório deste show.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, artista ou tom..."
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 pr-1 my-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Carregando acervo de músicas...
            </div>
          ) : filteredMusics.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Nenhuma música encontrada no acervo.
            </div>
          ) : (
            filteredMusics.map((music) => {
              const isInSetlist = existingMusicIds.has(music.id);
              const isSelected = selectedIds.has(music.id);

              return (
                <div
                  key={music.id}
                  onClick={() => !isInSetlist && handleToggle(music.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                    isInSetlist
                      ? "opacity-50 cursor-not-allowed bg-zinc-950/20"
                      : isSelected
                      ? "bg-emerald-950/40 border border-emerald-800/60 cursor-pointer"
                      : "hover:bg-zinc-800/50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      disabled={isInSetlist}
                      checked={isSelected || isInSetlist}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 disabled:opacity-40"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                          {music.title}
                        </span>
                        {(music.preferredKey || music.originalKey) && (
                          <span className="rounded bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                            Tom: {music.preferredKey || music.originalKey}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {music.artist}
                      </span>
                    </div>
                  </div>

                  {isInSetlist && (
                    <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded bg-zinc-800">
                      Já no Setlist
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800 mt-2">
          <span className="text-xs text-zinc-400">
            {selectedIds.size} {selectedIds.size === 1 ? "selecionada" : "selecionadas"}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 || isSubmitting}
              onClick={handleConfirm}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adicionando..." : `Adicionar (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
