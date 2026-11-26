"use client";

import { useState } from "react";
import type { Music } from "../types";
import { GENRE_LABELS } from "./music-filters";
import { CifraClubSearchButton } from "./cifraclub-search-button";
import { SpotifySearchButton } from "./spotify-search-button";

interface MusicListProps {
  musics: Music[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onSelect: (music: Music) => void;
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
                  onClick={() => onSelect(music)}
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

                    {/* Study Status Bullet: Yellow for true (in study), Green for false (ready) */}
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

                  {/* Artist + Genre */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span className="truncate font-medium">{music.artist}</span>
                    {music.genres && music.genres.length > 0 ? (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          {music.genres
                            .map((g) => GENRE_LABELS[g] || g)
                            .join(", ")}
                        </span>
                      </>
                    ) : music.genre ? (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          {GENRE_LABELS[music.genre]}
                        </span>
                      </>
                    ) : null}
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

                    {/* More actions menu ("...") */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === music.id ? null : music.id);
                        }}
                        className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
                        title="Mais ações"
                        aria-label="Mais ações"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === music.id}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>

                      {openMenuId === music.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40 bg-black/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />
                          <div
                            role="menu"
                            className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-2xl bg-zinc-800 border border-zinc-700 shadow-2xl p-1.5 flex flex-col gap-0.5"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              disabled={!hasLyrics}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                onSelect(music);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-zinc-700/70 rounded-xl transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span className="text-sm">🎤</span>
                              <span>{hasLyrics ? "Letra" : "Sem letra"}</span>
                            </button>
                            <div className="px-1 py-0.5">
                              <CifraClubSearchButton
                                title={music.title}
                                artist={music.artist}
                                className="w-full justify-center"
                              />
                            </div>
                            <div className="px-1 py-0.5">
                              <SpotifySearchButton
                                title={music.title}
                                artist={music.artist}
                                className="w-full justify-center"
                              />
                            </div>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                onEdit(music);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700/70 rounded-xl transition-colors text-left cursor-pointer"
                            >
                              <span className="text-sm">✏️</span>
                              <span>Editar</span>
                            </button>
                            <div className="h-px bg-zinc-700/60 my-0.5" />
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setDeleteConfirmId(music.id);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 rounded-xl transition-colors text-left cursor-pointer"
                            >
                              <span className="text-sm">🗑️</span>
                              <span>Excluir</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
