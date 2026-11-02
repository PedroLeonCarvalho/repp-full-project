"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { CreateMusicInput, Music, MusicFilter, UpdateMusicInput } from "../types";
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
import { SelectConcertModal } from "@/features/concert/components/select-concert-modal";
import { ConcertForm } from "@/features/concert/components/concert-form";
import { createConcertAction, addMusicsToSetlistAction } from "@/features/concert/actions/concert-actions";
import type { CreateConcertInput } from "@/features/concert/types";

export function MusicView() {
  const [musics, setMusics] = useState<Music[]>([]);
  const [filters, setFilters] = useState<MusicFilter>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMusic, setEditingMusic] = useState<Music | null>(null);
  const [selectedMusicState, setSelectedMusicState] = useState<{
    music: Music;
    initialTab?: "lyrics" | "chords";
  } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const refreshMusics = useCallback(async () => {
    const res = await listMusicsAction(filters);
    if (res.success) {
      setMusics(res.data);
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  }, [filters]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const res = await listMusicsAction(filters);
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
  }, [filters]);

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

  const [addingToConcertMusicIds, setAddingToConcertMusicIds] = useState<string[] | null>(null);
  const [isCreateConcertOpen, setIsCreateConcertOpen] = useState(false);
  const [pendingAddMusicIds, setPendingAddMusicIds] = useState<string[]>([]);

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleAddToConcert = (ids: string[]) => {
    setAddingToConcertMusicIds(ids);
  };

  const handleCreateConcertSubmit = async (
    data: CreateConcertInput
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await createConcertAction(data);
    if (res.success && res.data) {
      const concert = res.data;
      if (pendingAddMusicIds.length > 0) {
        await addMusicsToSetlistAction(concert.id, pendingAddMusicIds);
        setFeedbackMessage({
          type: "success",
          text: `Apresentação "${concert.title}" criada e ${pendingAddMusicIds.length} música(s) adicionada(s) ao setlist!`,
        });
        setSelectedIds(new Set());
        setPendingAddMusicIds([]);
      } else {
        setFeedbackMessage({
          type: "success",
          text: `Apresentação "${concert.title}" criada com sucesso!`,
        });
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
      setIsCreateConcertOpen(false);
      return { success: true };
    }
    return { success: false, error: res.success ? undefined : res.error };
  };

  const handleCreateOrUpdate = async (
    data: CreateMusicInput | Omit<UpdateMusicInput, "id">
  ): Promise<{ success: boolean; error?: string }> => {
    let res;
    if (editingMusic) {
      res = await updateMusicAction(editingMusic.id, data as Omit<UpdateMusicInput, "id">);
    } else {
      res = await createMusicAction(data as CreateMusicInput);
    }

    if (res.success) {
      startTransition(() => {
        void refreshMusics();
      });
      if (selectedMusicState && editingMusic && selectedMusicState.music.id === editingMusic.id) {
        setSelectedMusicState({ ...selectedMusicState, music: res.data });
      }
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteMusicAction(id);
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
      if (selectedMusicState?.music.id === id) {
        setSelectedMusicState(null);
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
          onSelect={(music, initialTab) => setSelectedMusicState({ music, initialTab })}
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
      {selectedMusicState && (
        <MusicDetail
          music={selectedMusicState.music}
          initialTab={selectedMusicState.initialTab}
          onClose={() => setSelectedMusicState(null)}
          onEdit={(m) => {
            setSelectedMusicState(null);
            openEditModal(m);
          }}
          onDelete={(id) => {
            handleDelete(id);
          }}
        />
      )}

      {/* Select Concert Modal */}
      {addingToConcertMusicIds && (
        <SelectConcertModal
          isOpen={Boolean(addingToConcertMusicIds)}
          musicIds={addingToConcertMusicIds}
          musicTitlesPreview={
            addingToConcertMusicIds.length === 1
              ? musics.find((m) => m.id === addingToConcertMusicIds[0])?.title
              : undefined
          }
          onClose={() => setAddingToConcertMusicIds(null)}
          onOpenCreateConcert={() => {
            setPendingAddMusicIds(addingToConcertMusicIds);
            setAddingToConcertMusicIds(null);
            setIsCreateConcertOpen(true);
          }}
          onSuccess={(concertTitle, addedCount) => {
            setSelectedIds(new Set());
            setFeedbackMessage({
              type: "success",
              text: `${addedCount} música(s) adicionada(s) à apresentação "${concertTitle}" com sucesso!`,
            });
            setTimeout(() => setFeedbackMessage(null), 4500);
          }}
        />
      )}

      {/* Create Concert Form Modal */}
      {isCreateConcertOpen && (
        <ConcertForm
          isOpen={isCreateConcertOpen}
          initialData={null}
          onClose={() => {
            setIsCreateConcertOpen(false);
            setPendingAddMusicIds([]);
          }}
          onSubmit={handleCreateConcertSubmit}
        />
      )}

      {/* Floating Feedback Toast */}
      {feedbackMessage && (
        <div
          role="status"
          className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 rounded-2xl p-3.5 text-xs sm:text-sm font-semibold border shadow-2xl backdrop-blur-md max-w-md ml-auto animate-in fade-in slide-in-from-bottom-4 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/95 border-emerald-700/80 text-emerald-200 shadow-emerald-950/50"
              : feedbackMessage.type === "info"
              ? "bg-sky-950/95 border-sky-700/80 text-sky-200 shadow-sky-950/50"
              : "bg-red-950/95 border-red-700/80 text-red-200 shadow-red-950/50"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {feedbackMessage.type === "success" && (
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="truncate">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 p-1 transition-colors shrink-0"
            aria-label="Fechar notificação"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
