"use client";

import { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";
import type { MusicFilter, MusicalKey, MusicGenre } from "../types";

interface MusicFiltersProps {
  filters: MusicFilter;
  onChange: (filters: MusicFilter) => void;
  onReset: () => void;
}

const GENRE_LABELS: Record<MusicGenre, string> = {
  ROCK: "Rock",
  MPB: "MPB",
  JAZZ: "Jazz",
  BOSSA_NOVA: "Bossa Nova",
  SAMBA: "Samba",
  BLUES: "Blues",
  POP_INTERNATIONAL: "Pop Internacional",
  POP_BRAZILIAN: "Pop Nacional",
  AXE: "Axé",
  SERTANEJO: "Sertanejo",
  FORRO: "Forró",
  OTHER: "Outro",
};

export function MusicFilters({
  filters,
  onChange,
  onReset,
}: MusicFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.genre ||
      filters.preferredKey ||
      filters.originalKey ||
      filters.skillLevel !== undefined
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900/90 p-4 border border-zinc-800 text-zinc-100 shadow-lg backdrop-blur-md">
      {/* Search Bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={filters.search || ""}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value || undefined })
          }
          placeholder="Buscar por título ou artista..."
          className="w-full rounded-xl bg-zinc-800/80 py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-400 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, search: undefined })}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
            aria-label="Limpar busca"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Genre Filter */}
        <select
          value={filters.genre || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              genre: (e.target.value as MusicGenre) || undefined,
            })
          }
          className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-xs sm:text-sm text-zinc-200 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Todos os gêneros</option>
          {MUSIC_GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {GENRE_LABELS[genre]}
            </option>
          ))}
        </select>

        {/* Preferred Key Filter */}
        <select
          value={filters.preferredKey || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              preferredKey: (e.target.value as MusicalKey) || undefined,
            })
          }
          className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-xs sm:text-sm text-zinc-200 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Tom preferido</option>
          {MUSICAL_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Original Key Filter */}
        <select
          value={filters.originalKey || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              originalKey: (e.target.value as MusicalKey) || undefined,
            })
          }
          className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-xs sm:text-sm text-zinc-200 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Tom original</option>
          {MUSICAL_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Skill Level Filter */}
        <select
          value={
            filters.skillLevel === undefined
              ? ""
              : filters.skillLevel
              ? "true"
              : "false"
          }
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              ...filters,
              skillLevel:
                val === "" ? undefined : val === "true" ? true : false,
            });
          }}
          className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-xs sm:text-sm text-zinc-200 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Todo o repertório</option>
          <option value="true">✓ Dominadas</option>
          <option value="false">⏳ Em estudo</option>
        </select>
      </div>

      {/* Clear Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-emerald-400 font-medium">Filtros ativos</span>
          <button
            type="button"
            onClick={onReset}
            className="text-zinc-400 hover:text-zinc-200 underline transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
export { GENRE_LABELS };
