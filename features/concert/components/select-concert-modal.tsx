"use client";

import { useEffect, useState } from "react";
import type { ConcertWithSetlist } from "../types";
import {
  addMusicsToSetlistAction,
  listAllConcertsAction,
} from "../actions/concert-actions";
import { formatConcertDate } from "@/lib/date-utils";

interface SelectConcertModalProps {
  isOpen: boolean;
  musicIds: string[];
  musicTitlesPreview?: string;
  onClose: () => void;
  onOpenCreateConcert: () => void;
  onSuccess: (concertTitle: string, addedCount: number) => void;
}

export function SelectConcertModal(props: SelectConcertModalProps) {
  if (!props.isOpen) return null;
  return <SelectConcertModalContent {...props} />;
}

function SelectConcertModalContent({
  musicIds,
  musicTitlesPreview,
  onClose,
  onOpenCreateConcert,
  onSuccess,
}: SelectConcertModalProps) {
  const [concerts, setConcerts] = useState<ConcertWithSetlist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submittingConcertId, setSubmittingConcertId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const res = await listAllConcertsAction();
      if (!isCancelled && res.success && res.data) {
        setConcerts(res.data);
      }
      if (!isCancelled) {
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredConcerts = concerts.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    const dateStr = formatConcertDate(c.presentationDate).toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.projectName && c.projectName.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      dateStr.includes(q)
    );
  });

  const handleSelectConcert = async (concert: ConcertWithSetlist) => {
    setSubmittingConcertId(concert.id);
    setErrorMessage(null);
    try {
      const res = await addMusicsToSetlistAction(concert.id, musicIds);
      if (res.success) {
        onSuccess(concert.title, res.data.addedCount);
        onClose();
      } else {
        setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage("Erro ao adicionar música(s) à apresentação.");
    } finally {
      setSubmittingConcertId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-7 text-zinc-100 shadow-2xl flex flex-col h-[85vh] max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-50 tracking-tight">
              Adicionar à Apresentação
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Escolha um show cadastrado para incluir {musicIds.length}{" "}
              {musicIds.length === 1 ? "música" : "músicas"}
              {musicTitlesPreview ? ` ("${musicTitlesPreview}")` : ""}.
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

        {/* Toolbar: Search + Create New Concert Button */}
        <div className="py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do show, projeto, local..."
              className="w-full rounded-xl bg-zinc-800/80 pl-9 pr-8 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
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
            onClick={() => {
              onClose();
              onOpenCreateConcert();
            }}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md active:scale-95"
            title="Criar nova apresentação e adicionar as músicas nela"
          >
            <span>➕</span>
            <span>Criar Apresentação</span>
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-2 p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Concerts List */}
        <div className="flex-1 overflow-y-auto pr-1 my-1 space-y-2.5">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-zinc-500">
              Carregando apresentações...
            </div>
          ) : filteredConcerts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-3">
              <p className="text-sm font-semibold text-zinc-400">
                {concerts.length === 0
                  ? "Você ainda não possui apresentações cadastradas."
                  : "Nenhuma apresentação encontrada para a busca."}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateConcert();
                }}
                className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>Criar Primeira Apresentação</span>
              </button>
            </div>
          ) : (
            filteredConcerts.map((concert) => {
              const isSubmitting = submittingConcertId === concert.id;
              const dateStr = formatConcertDate(concert.presentationDate);

              return (
                <div
                  key={concert.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700/80 transition-all gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                        {concert.projectName || "Projeto"}
                      </span>
                      <span className="text-xs font-bold text-zinc-100 truncate">
                        {concert.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-300">
                        <span>📅</span> {dateStr}
                      </span>
                      {(concert.startTime || concert.finishTime) && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                          <span>⏰</span> {concert.startTime || "--:--"}
                        </span>
                      )}
                      {concert.location && (
                        <span className="truncate max-w-[200px] text-zinc-400" title={concert.location}>
                          📍 {concert.location}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-500 font-mono">
                        🎵 {concert.setlistCount ?? 0} {concert.setlistCount === 1 ? "música" : "músicas"} no setlist
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectConcert(concert)}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3.5 py-2 text-xs transition-all cursor-pointer shrink-0 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isSubmitting ? (
                      "Adicionando..."
                    ) : (
                      <>
                        <span>+</span>
                        <span>Adicionar aqui</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-zinc-800 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
