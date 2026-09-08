"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { ConcertWithSetlist } from "../types";
import {
  addMusicsToSetlistAction,
  getConcertByIdAction,
  removeSetlistItemAction,
  reorderSetlistAction,
} from "../actions/concert-actions";
import { getCustomerStageNameAction } from "@/features/contractor/actions/contractor-actions";
import { AddToSetlistModal } from "./add-to-setlist-modal";
import { ConcertPresentationMode } from "./concert-presentation-mode";
import { ConcertMusiciansSection } from "@/features/musician/components/concert-musicians-section";
import { ContractModal } from "@/features/contract/components/contract-modal";
import { ShareSetlistModal } from "./share-setlist-modal";
import { formatConcertDate } from "@/lib/date-utils";
import type { Music } from "@/features/music/types";
import { MusicForm } from "@/features/music/components/music-form";
import { updateMusicAction } from "@/features/music/actions/music-actions";

interface ConcertDetailProps {
  concertId: string;
  onClose: () => void;
  onEdit: (concert: ConcertWithSetlist) => void;
  onDelete: (id: string) => void;
  onOpenLiveSetlist?: () => void;
}

export function ConcertDetail({
  concertId,
  onClose,
  onEdit,
  onDelete,
  onOpenLiveSetlist,
}: ConcertDetailProps) {
  const [concert, setConcert] = useState<ConcertWithSetlist | null>(null);
  const [artistStageName, setArtistStageName] = useState<string>("Artista");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingMusic, setEditingMusic] = useState<Music | null>(null);
  const [presentationState, setPresentationState] = useState<{
    index: number;
    mode: "lyrics" | "chords";
  } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const refreshConcert = useCallback(async () => {
    const res = await getConcertByIdAction(concertId);
    if (res.success && res.data) {
      setConcert(res.data);
    }
  }, [concertId]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      const [res, stageName] = await Promise.all([
        getConcertByIdAction(concertId),
        getCustomerStageNameAction(),
      ]);

      if (!isCancelled) {
        if (res.success && res.data) {
          setConcert(res.data);
        }
        if (stageName) {
          setArtistStageName(stageName);
        }
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [concertId]);


  const handleAddMusics = async (musicIds: string[]) => {
    await addMusicsToSetlistAction(concertId, musicIds);
    startTransition(() => {
      void refreshConcert();
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeSetlistItemAction(concertId, itemId);
    startTransition(() => {
      void refreshConcert();
    });
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!concert) return;
    const items = [...concert.setlist];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    // Optimistic state
    setConcert({ ...concert, setlist: items });

    // Server reorder
    const orderedIds = items.map((it) => it.id);
    await reorderSetlistAction(concertId, orderedIds);
  };

  // Drag and Drop handlers
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

  if (isLoading || !concert) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center text-zinc-400 text-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Carregando apresentação e setlist...
        </div>
      </div>
    );
  }

  // Live Presentation Mode Full Screen
  if (presentationState !== null) {
    return (
      <ConcertPresentationMode
        setlist={concert.setlist}
        initialIndex={presentationState.index}
        initialMode={presentationState.mode}
        concertTitle={concert.title}
        onClose={() => setPresentationState(null)}
      />
    );
  }

  const existingMusicIds = new Set(concert.setlist.map((s) => s.musicId));

  const formattedDate = formatConcertDate(concert.presentationDate);  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Unified scroll container: Header info + Setlist + Musicians + Footer scroll together */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top Bar: Badges & Header Actions */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg">
                {concert.projectName || "Projeto"}
              </span>
              {concert.contractorName && (
                <span className="rounded-lg bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 text-[10px] text-zinc-300 inline-flex items-center gap-1 max-w-[180px] truncate">
                  <span>🏢</span>
                  <span className="truncate">{concert.contractorName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                title="Compartilhar setlist com os músicos da banda"
              >
                <span>🔗</span>
                <span className="hidden xs:inline">Compartilhar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(true)}
                className="rounded-xl bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                title="Gerar ou visualizar contrato em PDF"
              >
                <span>📄</span>
                <span className="hidden xs:inline">Contrato</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(concert)}
                className="rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Editar Show
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Fechar modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Presentation Info (Line 1: Title, Line 2: Hours/Date/Fee, Line 3: Google Maps link) */}
          <div className="space-y-1.5 pb-3 border-b border-zinc-800/80">
            {/* Line 1: Title in a single line */}
            <h2
              className="text-lg sm:text-xl font-bold text-zinc-50 truncate tracking-tight"
              title={concert.title}
            >
              {concert.title}
            </h2>

            {/* Line 2: Presentation Hour, Date, agreedFee */}
            <div className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-zinc-200">
                <span>📅</span> {formattedDate}
              </span>
              {(concert.startTime || concert.finishTime) && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-zinc-200">
                    <span>⏰</span> {concert.startTime || "--:--"}{concert.finishTime ? ` às ${concert.finishTime}` : ""}
                  </span>
                </>
              )}
              {concert.durationInHours && (
                <span className="text-zinc-400 text-[11px]">
                  ({concert.durationInHours}h)
                </span>
              )}
              {concert.agreedFee !== null && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    💰 R$ {Number(concert.agreedFee).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Line 3: Address as a clickable link to Google Maps */}
            <div className="pt-0.5">
              {concert.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(concert.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline max-w-full group py-0.5 transition-colors"
                  title="Abrir endereço no Google Maps (nova aba)"
                >
                  <span className="shrink-0">📍</span>
                  <span className="truncate">{concert.location}</span>
                  <span className="text-[10px] text-emerald-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    ↗
                  </span>
                </a>
              ) : (
                <span className="text-xs text-zinc-500 italic inline-flex items-center gap-1">
                  <span>📍</span>
                  <span>Local não informado</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-300">
                Setlist ({concert.setlist.length}{" "}
                {concert.setlist.length === 1 ? "música" : "músicas"})
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                • Arraste ⠿ para reordenar
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <span>+ Adicionar Músicas</span>
              </button>

              {concert.setlist.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenLiveSetlist) {
                      onOpenLiveSetlist();
                    } else {
                      setPresentationState({ index: 0, mode: "lyrics" });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                >
                  <span>▶ Tela de Palco</span>
                </button>
              )}
            </div>
          </div>

          {/* Setlist Items List with Drag & Drop */}
          <div className="divide-y divide-zinc-800/60">
            {concert.setlist.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <p className="text-sm font-semibold">O setlist deste show está vazio.</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Clique em &quot;+ Adicionar Músicas&quot; para escolher as músicas do seu acervo que serão tocadas nesta apresentação.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-semibold hover:bg-emerald-500/30 transition-colors cursor-pointer"
                >
                  + Adicionar Músicas
                </button>
              </div>
            ) : (
              concert.setlist.map((item, index) => {
                const music = item.music;
                if (!music) return null;
                const keyDisplay = music.preferredKey || music.originalKey;
                const noteText = music.note || item.note;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all group gap-2 sm:gap-3 ${
                      isDragging
                        ? "opacity-30 border-2 border-dashed border-emerald-500 bg-zinc-950/60"
                        : isDragOver
                        ? "border-2 border-emerald-500/80 bg-emerald-950/20 scale-[1.01]"
                        : "hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 px-1 py-1 select-none text-base shrink-0"
                        title="Arraste para alterar a ordem"
                      >
                        ⠿
                      </div>

                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-[11px] font-bold text-zinc-400 shrink-0">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                            {music.title}
                          </span>
                          {/* Study Status Bullet */}
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
                          {keyDisplay && (
                            <span className="rounded bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                              {keyDisplay}
                            </span>
                          )}
                          {noteText && (
                            <span
                              className="rounded bg-zinc-800/90 border border-zinc-700/60 px-2 py-0.5 text-[11px] text-zinc-300 truncate max-w-[150px] sm:max-w-[240px] inline-flex items-center gap-1"
                              title={noteText}
                            >
                              <span>💬</span>
                              <span className="truncate">{noteText}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 truncate block">
                          {music.artist}
                        </span>
                      </div>
                    </div>

                    {/* Actions per track */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Reorder Buttons (alternative to drag) */}
                      <div className="flex items-center bg-zinc-800/80 rounded-lg p-0.5 border border-zinc-700/60">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, "up")}
                          className="px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition-colors cursor-pointer"
                          title="Subir posição"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={index === concert.setlist.length - 1}
                          onClick={() => handleMove(index, "down")}
                          className="px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition-colors cursor-pointer"
                          title="Descer posição"
                        >
                          ▼
                        </button>
                      </div>

                      {/* View lyrics button */}
                      <button
                        type="button"
                        onClick={() => setPresentationState({ index, mode: "lyrics" })}
                        className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-emerald-400 hover:bg-zinc-700 transition-colors cursor-pointer"
                        title="Ver letra"
                      >
                        Letra
                      </button>

                      {/* View chords button */}
                      <button
                        type="button"
                        onClick={() => setPresentationState({ index, mode: "chords" })}
                        className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-amber-400 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                        title="Ver cifra"
                      >
                        <span>🎸</span>
                        <span>Cifra</span>
                      </button>

                      {/* Edit music button */}
                      <button
                        type="button"
                        onClick={() => setEditingMusic(music)}
                        className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                        title="Editar dados da música (letra, cifra, tom, observação)"
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Remover do setlist"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Accompanying Musicians Section */}
          <div className="pt-2 border-t border-zinc-800/80">
            <ConcertMusiciansSection
              concertId={concert.id}
              concertTitle={concert.title}
              concertDate={formattedDate}
              artistStageName={artistStageName}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Tem certeza de que deseja excluir o show "${concert.title}"?`)) {
                  onDelete(concert.id);
                  onClose();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              🗑️ Excluir Apresentação
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Fechar
            </button>
        </div>
      </div>
    </div>

      {/* Add Musics to Setlist Modal */}
      <AddToSetlistModal
        isOpen={isAddModalOpen}
        existingMusicIds={existingMusicIds}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMusics}
      />

      {/* Contract Modal */}
      <ContractModal
        isOpen={isContractModalOpen}
        concertId={concert.id}
        concertTitle={concert.title}
        defaultContractorId={concert.contractorId}
        defaultFee={concert.agreedFee}
        onClose={() => {
          setIsContractModalOpen(false);
          void refreshConcert();
        }}
      />

      {/* Share Setlist Modal */}
      {isShareModalOpen && (
        <ShareSetlistModal
          concert={concert}
          onClose={() => setIsShareModalOpen(false)}
          onUpdated={() => {
            void refreshConcert();
          }}
        />
      )}

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
            void refreshConcert();
          }
          return res;
        }}
      />
    </div>
  );
}
