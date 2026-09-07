"use client";

import { useState } from "react";
import type { Music } from "../types";
import { GENRE_LABELS } from "./music-filters";

interface MusicListProps {
  musics: Music[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onSelect: (music: Music, initialTab?: "lyrics" | "chords") => void;
  onEdit: (music: Music) => void;
  onDelete: (id: string) => void;
  onOpenCreate: () => void;
  onAddToConcert: (ids: string[]) => void;
}

export function MusicList({
  musics,
  selectedIds,
  onToggleSelect,
  onClearSelection,
  onSelect,
  onEdit,
  onDelete,
  onOpenCreate,
  onAddToConcert,
}: MusicListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const hasSomeSelected = selectedIds.size > 0;

  if (musics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 mb-4">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-zinc-200">
          Nenhuma música encontrada
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Cadastre novas músicas ou ajuste os filtros para visualizar seu acervo.
        </p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
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
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Adicionar Primeira Música
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Batch Action Bar (Visible only when items are selected) */}
      {hasSomeSelected && (
        <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-emerald-500/40 px-4 py-2.5 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
              {selectedIds.size}
            </span>
            <span className="text-zinc-200 font-medium">
              {selectedIds.size === 1
                ? "1 música selecionada"
                : `${selectedIds.size} músicas selecionadas`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAddToConcert(Array.from(selectedIds))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Adicionar à Apresentação
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-xl px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Music Cards */}
      <div className="flex flex-col gap-2.5">
        {musics.map((music) => {
          const isConfirmingDelete = deleteConfirmId === music.id;
          const isSelected = selectedIds.has(music.id);
          const displayKey = music.preferredKey || music.originalKey;
          const hasLyrics = Boolean(music.lyrics && music.lyrics.trim());
          const hasChords = Boolean(music.chords && music.chords.trim());

          return (
            <div
              key={music.id}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 sm:p-4 text-zinc-100 transition-all shadow-sm ${
                isSelected
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : "bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              {/* Checkbox + Clickable Card Body */}
              <div className="flex flex-1 items-start sm:items-center gap-3">
                {/* Individual Selection Checkbox */}
                <div className="pt-1 sm:pt-0 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(music.id)}
                    className="h-4 w-4 rounded accent-emerald-500 border-zinc-700 bg-zinc-800 text-emerald-500 cursor-pointer"
                    aria-label={`Selecionar ${music.title}`}
                  />
                </div>

                {/* Clickable Title & Details */}
                <button
                  type="button"
                  onClick={() => onSelect(music, hasLyrics ? "lyrics" : hasChords ? "chords" : "lyrics")}
                  className="flex flex-1 flex-col text-left focus:outline-none min-w-0"
                >
                  {/* Title + Tone Tag directly next to Title */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                      {music.title}
                    </span>

                    {/* Musical Key beside Title */}
                    {displayKey ? (
                      <span
                        className="inline-flex items-center rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300 shrink-0"
                        title={`Tonalidade: ${displayKey}`}
                      >
                        {displayKey}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-md bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 text-[10px] text-zinc-500 shrink-0"
                        title="Tom não informado"
                      >
                        Sem tom
                      </span>
                    )}

                    {/* Mastery Status Bullet */}
                    {music.skillLevel ? (
                      <span
                        title="Música dominada"
                        className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                      />
                    ) : (
                      <span
                        title="Música em estudo"
                        className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0"
                      />
                    )}
                  </div>

                  {/* Artist + Genre */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span className="truncate font-medium">{music.artist}</span>
                    {music.genre && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          {GENRE_LABELS[music.genre]}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Truncated Observation / Note */}
                  {music.note && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5 bg-zinc-800/40 rounded-lg px-2 py-1 max-w-full sm:max-w-md">
                      <span className="text-zinc-500 shrink-0">💬</span>
                      <span className="truncate text-zinc-300 text-[11px]">
                        {music.note}
                      </span>
                    </div>
                  )}
                </button>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0 flex-wrap">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-xl border border-red-800">
                    <span className="text-[11px] text-red-200 px-1.5">
                      Confirmar exclusão?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(music.id);
                        setDeleteConfirmId(null);
                      }}
                      className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-500"
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="rounded-lg bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Dedicated "Letra" Button */}
                    {hasLyrics ? (
                      <button
                        type="button"
                        onClick={() => onSelect(music, "lyrics")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-zinc-950 border border-emerald-500/35 px-2.5 py-1.5 text-xs font-bold text-emerald-400 transition-all active:scale-95 cursor-pointer"
                        title="Ver letra da música"
                      >
                        Letra
                      </button>
                    ) : (
                      <span className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 px-2 py-1.5 text-[11px] font-medium text-zinc-600 select-none hidden xs:inline">
                        Sem letra
                      </span>
                    )}

                    {/* Dedicated "Cifra" Button */}
                    {hasChords ? (
                      <button
                        type="button"
                        onClick={() => onSelect(music, "chords")}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-zinc-950 border border-amber-500/35 px-2.5 py-1.5 text-xs font-bold text-amber-400 transition-all active:scale-95 cursor-pointer"
                        title="Ver cifra da música"
                      >
                        <span>🎸</span>
                        <span>Cifra</span>
                      </button>
                    ) : (
                      <span className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 px-2 py-1.5 text-[11px] font-medium text-zinc-600 select-none hidden xs:inline">
                        Sem cifra
                      </span>
                    )}

                    {/* Add to Concert button on card */}
                    <button
                      type="button"
                      onClick={() => onAddToConcert([music.id])}
                      className="inline-flex items-center gap-1 rounded-xl bg-zinc-800/70 hover:bg-emerald-500/20 hover:text-emerald-300 border border-zinc-700/50 hover:border-emerald-500/30 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors cursor-pointer"
                      title="Adicionar esta música a uma apresentação"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="hidden md:inline">Apresentação</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(music)}
                      className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Editar música"
                      aria-label="Editar"
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
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(music.id)}
                      className="rounded-xl p-2 text-zinc-400 hover:bg-red-950/50 hover:text-red-400 transition-colors cursor-pointer"
                      title="Excluir música"
                      aria-label="Excluir"
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
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
