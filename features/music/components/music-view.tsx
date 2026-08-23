"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { CreateMusicInput, Music, MusicFilter } from "../types";
import {
  createMusicAction,
  deleteMusicAction,
  listMusicsAction,
  updateMusicAction,
} from "../actions/music-actions";
import { MusicFilters } from "./music-filters";
import { MusicList } from "./music-list";
import { MusicForm } from "./music-form";
import { MusicDetail } from "./music-detail";

interface MusicViewProps {
  initialCustomerId?: string;
}

export function MusicView({ initialCustomerId = "demo-customer" }: MusicViewProps) {
  const [customerId] = useState<string>(initialCustomerId);
  const [musics, setMusics] = useState<Music[]>([]);
  const [filters, setFilters] = useState<MusicFilter>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMusic, setEditingMusic] = useState<Music | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const refreshMusics = useCallback(async () => {
    const res = await listMusicsAction(customerId, filters);
    if (res.success) {
      setMusics(res.data);
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  }, [customerId, filters]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const res = await listMusicsAction(customerId, filters);
      if (!isCancelled) {
        if (res.success) {
          setMusics(res.data);
        } else {
          setFeedbackMessage({ type: "error", text: res.error });
        }
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [filters, customerId]);

  const handleToggleSelect = (id: string) => {
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

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleAddToConcert = (ids: string[]) => {
    setFeedbackMessage({
      type: "info",
      text: `${ids.length} música(s) selecionada(s). A vinculação a apresentações estará disponível na tela de Apresentações/Concerts.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  const handleCreateOrUpdate = async (
    data: CreateMusicInput
  ): Promise<{ success: boolean; error?: string }> => {
    let res;
    if (editingMusic) {
      res = await updateMusicAction(editingMusic.id, data, customerId);
    } else {
      res = await createMusicAction(data, customerId);
    }

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: editingMusic
          ? "Música atualizada com sucesso!"
          : "Música cadastrada com sucesso!",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      startTransition(() => {
        void refreshMusics();
      });
      if (selectedMusic && editingMusic && selectedMusic.id === editingMusic.id) {
        setSelectedMusic(res.data);
      }
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteMusicAction(id, customerId);
    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: "Música removida do acervo.",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (selectedMusic?.id === id) {
        setSelectedMusic(null);
      }
      startTransition(() => {
        void refreshMusics();
      });
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  };

  const openCreateModal = () => {
    setEditingMusic(null);
    setIsFormOpen(true);
  };

  const openEditModal = (music: Music) => {
    setEditingMusic(music);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
            Acervo de Músicas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Organize seu repertório, tonalidades, letras e domínio musical.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 shrink-0"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden xs:inline">Nova Música</span>
          <span className="xs:hidden">Nova</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-medium border ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : feedbackMessage.type === "info"
              ? "bg-sky-950/80 border-sky-800 text-sky-200"
              : "bg-red-950/80 border-red-800 text-red-200"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <MusicFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Music Counter & Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          {musics.length}{" "}
          {musics.length === 1 ? "música cadastrada" : "músicas cadastradas"}
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Dominada
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Em estudo
          </span>
        </div>
      </div>

      {/* Music List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            Carregando repertório...
          </div>
        </div>
      ) : (
        <MusicList
          musics={musics}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onClearSelection={handleClearSelection}
          onSelect={setSelectedMusic}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onOpenCreate={openCreateModal}
          onAddToConcert={handleAddToConcert}
        />
      )}

      {/* Create / Edit Form Modal */}
      <MusicForm
        isOpen={isFormOpen}
        initialData={editingMusic}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMusic(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Music Detail Modal */}
      {selectedMusic && (
        <MusicDetail
          music={selectedMusic}
          onClose={() => setSelectedMusic(null)}
          onEdit={(m) => {
            setSelectedMusic(null);
            openEditModal(m);
          }}
          onDelete={(id) => {
            handleDelete(id);
          }}
        />
      )}
    </div>
  );
}
