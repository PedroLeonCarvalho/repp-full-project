"use client";

import { useEffect, useRef, useState } from "react";
import { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";
import type {
  CreateMusicInput,
  LyricsSearchResult,
  Music,
  MusicalKey,
  MusicGenre,
  UpdateMusicInput,
} from "../types";
import { GENRE_LABELS } from "./music-filters";
import { searchLyricsAction, searchChordsAction } from "../actions/music-actions";

interface MusicFormProps {
  initialData?: Music | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateMusicInput | Omit<UpdateMusicInput, "id">
  ) => Promise<{ success: boolean; error?: string }>;
}

export function MusicForm({
  initialData,
  isOpen,
  onClose,
  onSubmit,
}: MusicFormProps) {
  if (!isOpen) return null;

  return (
    <MusicFormModal
      key={initialData?.id ?? "new-music"}
      initialData={initialData}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

interface MusicFormModalProps {
  initialData?: Music | null;
  onClose: () => void;
  onSubmit: (
    data: CreateMusicInput | Omit<UpdateMusicInput, "id">
  ) => Promise<{ success: boolean; error?: string }>;
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function MusicFormModal({ initialData, onClose, onSubmit }: MusicFormModalProps) {
  const isEditing = Boolean(initialData);

  // View state: In create mode, start at 'search' unless user chose manual
  const [viewMode, setViewMode] = useState<"search" | "form">(
    isEditing ? "form" : "search"
  );
  const [isManual, setIsManual] = useState<boolean>(false);

  // Search view state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricsSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [previewSongId, setPreviewSongId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSearchQueryRef = useRef<string>("");

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Form fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [artist, setArtist] = useState(initialData?.artist || "");
  const [lyrics, setLyrics] = useState(initialData?.lyrics || "");
  const [chords, setChords] = useState(initialData?.chords || "");
  const [originalKey, setOriginalKey] = useState<MusicalKey | "">(
    initialData?.originalKey || ""
  );
  const [preferredKey, setPreferredKey] = useState<MusicalKey | "">(
    initialData?.preferredKey || ""
  );
  const [studying, setStudying] = useState<boolean>(
    initialData?.studying ?? false
  );
  const initialGenres: MusicGenre[] =
    initialData?.genres && initialData.genres.length > 0
      ? initialData.genres
      : initialData?.genre
      ? [initialData.genre]
      : [];
  const [genres, setGenres] = useState<MusicGenre[]>(initialGenres);
  const [note, setNote] = useState(initialData?.note || "");
  const [spotifyLink, setSpotifyLink] = useState(
    initialData?.spotifyLink || ""
  );
  const [sheetMusicFile, setSheetMusicFile] = useState(
    initialData?.sheetMusicFile || ""
  );

  // Decoupled chord search state (Alternative inputs)
  const [altArtist, setAltArtist] = useState("");
  const [altTitle, setAltTitle] = useState("");
  const [showAltChordSearch, setShowAltChordSearch] = useState(false);
  const [isSearchingChords, setIsSearchingChords] = useState(false);
  const [chordsFeedback, setChordsFeedback] = useState<{
    type: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Auto focus search input on mount when in search mode
  useEffect(() => {
    if (viewMode === "search") {
      searchInputRef.current?.focus();
    }
  }, [viewMode]);

  // Handle Genre additions/removals (Max 3)
  const handleAddGenre = (genreToAdd: MusicGenre) => {
    if (!genreToAdd) return;
    if (genres.length >= 3) return;
    if (genres.includes(genreToAdd)) return;
    setGenres((prev) => [...prev, genreToAdd]);
  };

  const handleRemoveGenre = (genreToRemove: MusicGenre) => {
    setGenres((prev) => prev.filter((g) => g !== genreToRemove));
  };

  // Perform Canonical Lyrics Search (Immediate or Debounced)
  const handlePerformLyricsSearch = async (queryText?: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    const q = (queryText ?? searchQuery).trim();
    if (!q) {
      latestSearchQueryRef.current = "";
      setSearchResults([]);
      setPreviewSongId(null);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    latestSearchQueryRef.current = q;
    setIsSearchingLyrics(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await searchLyricsAction({ title: q });

      // Discard stale response if user continued typing
      if (latestSearchQueryRef.current !== q) return;

      if (!res.success) {
        setSearchError(res.error || "Erro ao consultar a biblioteca de músicas.");
        setSearchResults([]);
        setPreviewSongId(null);
        return;
      }
      setSearchResults(res.data);
      if (res.data.length > 0) {
        setPreviewSongId((prev) => {
          if (prev && res.data.some((item) => item.id === prev)) return prev;
          return res.data[0].id;
        });
      } else {
        setPreviewSongId(null);
      }
    } catch {
      if (latestSearchQueryRef.current === q) {
        setSearchError("Falha de conexão com a biblioteca de músicas.");
        setSearchResults([]);
        setPreviewSongId(null);
      }
    } finally {
      if (latestSearchQueryRef.current === q) {
        setIsSearchingLyrics(false);
      }
    }
  };

  // Handle incremental / elastic typing in the search box
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length >= 3) {
      searchDebounceRef.current = setTimeout(() => {
        void handlePerformLyricsSearch(trimmed);
      }, 350);
    } else if (trimmed.length === 0) {
      latestSearchQueryRef.current = "";
      setSearchResults([]);
      setPreviewSongId(null);
      setHasSearched(false);
      setSearchError(null);
    }
  };

  // Trigger chord search for a specific title and artist
  const fetchChords = async (targetTitle: string, targetArtist: string) => {
    if (!targetTitle.trim() || !targetArtist.trim()) return;

    setIsSearchingChords(true);
    setChordsFeedback(null);

    try {
      const res = await searchChordsAction(targetTitle.trim(), targetArtist.trim());

      if (!res.success) {
        setChordsFeedback({
          type: "warning",
          text: "Cifra não encontrada para esta grafia de artista/título.",
        });
        setShowAltChordSearch(true);
        return;
      }

      const found = res.data;
      setChords(found.chordpro);

      if (found.key && !originalKey) {
        setOriginalKey(found.key as MusicalKey);
      }

      setChordsFeedback({
        type: "success",
        text: "✓ Cifra carregada com sucesso!",
      });
    } catch {
      setChordsFeedback({
        type: "error",
        text: "Falha de conexão com o servidor de cifras.",
      });
      setShowAltChordSearch(true);
    } finally {
      setIsSearchingChords(false);
    }
  };

  // When a user selects a candidate from the canonical search results
  const handleSelectCanonicalSong = (item: LyricsSearchResult) => {
    setTitle(item.title);
    setArtist(item.artist);
    setLyrics(item.plainLyrics);
    setIsManual(false);
    setViewMode("form");

    // Pre-populate alternative search inputs for user convenience
    setAltTitle(item.title);
    setAltArtist(item.artist);
    setShowAltChordSearch(false);

    // Auto-search chords in background
    void fetchChords(item.title, item.artist);
  };

  // Switch to manual registration
  const handleStartManualRegistration = () => {
    setIsManual(true);
    setTitle("");
    setArtist("");
    setLyrics("");
    setChords("");
    setAltTitle("");
    setAltArtist("");
    setShowAltChordSearch(false);
    setChordsFeedback(null);
    setViewMode("form");
  };

  // Switch back to search mode
  const handleBackToSearch = () => {
    setViewMode("search");
    setChordsFeedback(null);
  };

  // Handle Decoupled Chord Search (Manual or Alternative terms)
  const handleSearchAlternativeChords = async () => {
    const searchArtistName = altArtist.trim() || artist.trim();
    const searchSongTitle = altTitle.trim() || title.trim();

    if (!searchSongTitle) {
      setChordsFeedback({
        type: "error",
        text: "Informe o título para buscar a cifra.",
      });
      return;
    }
    if (!searchArtistName) {
      setChordsFeedback({
        type: "error",
        text: "Informe o artista para buscar a cifra.",
      });
      return;
    }

    await fetchChords(searchSongTitle, searchArtistName);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMessage(null);

    if (!title.trim()) {
      setFormErrorMessage("O título da música é obrigatório.");
      return;
    }
    if (!artist.trim()) {
      setFormErrorMessage("O nome do artista é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    try {
      let payload: CreateMusicInput | Omit<UpdateMusicInput, "id">;

      if (isEditing) {
        const editPayload: Omit<UpdateMusicInput, "id"> = {
          lyrics: lyrics.trim() || null,
          chords: chords.trim() || null,
          originalKey: originalKey ? (originalKey as MusicalKey) : null,
          preferredKey: preferredKey ? (preferredKey as MusicalKey) : null,
          studying,
          genres: genres.length > 0 ? genres : null,
          genre: genres.length > 0 ? genres[0] : null,
          note: note.trim() || null,
          spotifyLink: spotifyLink.trim() || null,
          sheetMusicFile: sheetMusicFile.trim() || null,
        };
        payload = editPayload;
      } else {
        const createPayload: CreateMusicInput = {
          title: title.trim(),
          artist: artist.trim(),
          isCustom: isManual,
          lyrics: lyrics.trim() || null,
          chords: chords.trim() || null,
          originalKey: originalKey ? (originalKey as MusicalKey) : null,
          preferredKey: preferredKey ? (preferredKey as MusicalKey) : null,
          studying,
          genres: genres.length > 0 ? genres : null,
          genre: genres.length > 0 ? genres[0] : null,
          note: note.trim() || null,
          spotifyLink: spotifyLink.trim() || null,
          sheetMusicFile: sheetMusicFile.trim() || null,
        };
        payload = createPayload;
      }

      const res = await onSubmit(payload);
      if (res.success) {
        onClose();
      } else {
        setFormErrorMessage(res.error || "Ocorreu um erro ao salvar a música.");
      }
    } catch {
      setFormErrorMessage("Erro de conexão ao salvar música.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 text-zinc-100 shadow-2xl my-8 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-zinc-50">
              {isEditing
                ? "Editar Música"
                : viewMode === "search"
                ? "Buscar Música no Acervo"
                : isManual
                ? "Cadastrar Música Manualmente"
                : "Nova Música"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ─── 1. STEP: CANONICAL SEARCH VIEW (Initial mode for new song) ─── */}
        {viewMode === "search" && !isEditing ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-400">
              Digite o título ou artista para localizar a música na biblioteca oficial com grafia e letras canônicas.
            </p>

            {/* Search Input Box */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handlePerformLyricsSearch();
                    }
                  }}
                  placeholder="Ex: Como Nossos Pais, Elis Regina..."
                  className="w-full rounded-xl bg-zinc-800/90 pl-9 pr-8 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                  🔍
                </span>
                {isSearchingLyrics && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handlePerformLyricsSearch()}
                disabled={!searchQuery.trim() || isSearchingLyrics}
                className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-4 py-2.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
              >
                {isSearchingLyrics ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="rounded-xl bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200">
                {searchError}
              </div>
            )}

            {/* Search Results List */}
            <div className="min-h-[140px] max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {isSearchingLyrics ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  <span className="text-xs">Consultando biblioteca de músicas...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const durationFormatted = formatDuration(item.duration);
                  const isPreviewOpen = item.id === previewSongId;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setPreviewSongId(isPreviewOpen ? null : item.id)}
                      className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isPreviewOpen
                          ? "bg-emerald-950/20 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30"
                          : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-500/80 hover:bg-zinc-800/70"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {item.artist}
                            {item.album && (
                              <span className="text-zinc-500"> • {item.album}</span>
                            )}
                            {durationFormatted && (
                              <span className="text-zinc-500"> • {durationFormatted}</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSongId(isPreviewOpen ? null : item.id);
                            }}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                            title={isPreviewOpen ? "Ocultar prévia" : "Ver prévia da letra"}
                          >
                            {isPreviewOpen ? "▲ Ocultar prévia" : "👁 Prévia"}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCanonicalSong(item);
                            }}
                            className="rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:bg-emerald-500 group-hover:text-zinc-950 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            Selecionar
                          </button>
                        </div>
                      </div>

                      {/* Briefing / Lyrics Preview (when expanded) */}
                      {isPreviewOpen ? (
                        <div
                          className="mt-1 pt-2.5 border-t border-zinc-700/60 flex flex-col gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                            <span className="flex items-center gap-1">
                              <span>📝</span>
                              <span>Briefing da Letra</span>
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Verifique os versos antes de confirmar
                            </span>
                          </div>

                          <pre className="font-mono text-xs text-zinc-200 whitespace-pre-wrap max-h-44 overflow-y-auto rounded-xl bg-zinc-950/90 p-3 border border-zinc-800/80 leading-relaxed select-text">
                            {item.plainLyrics}
                          </pre>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-zinc-500">
                              {item.album ? `Álbum: ${item.album}` : "Versão oficial"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectCanonicalSong(item)}
                              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                              <span>✓</span>
                              <span>Usar esta versão</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        item.plainLyrics && (
                          <p className="text-[11px] text-zinc-500 line-clamp-1 italic font-mono">
                            {item.plainLyrics.split("\n")[0]}...
                          </p>
                        )
                      )}
                    </div>
                  );
                })
              ) : hasSearched ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Nenhuma música encontrada para &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Digite acima para buscar na biblioteca ou opte pelo cadastro manual.
                </div>
              )}
            </div>

            {/* Manual Registration Link */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleStartManualRegistration}
                className="text-zinc-400 hover:text-emerald-400 transition-colors underline underline-offset-4 cursor-pointer"
              >
                Não encontrou a música? Cadastrar manualmente
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* ─── 2. STEP: FORM VIEW (Canonical Selected, Manual, or Edit Mode) ─── */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formErrorMessage && (
              <div className="rounded-xl bg-red-950/60 border border-red-800/80 p-3.5 text-xs text-red-200">
                {formErrorMessage}
              </div>
            )}

            {/* ─── Title & Artist Section ─── */}
            <div className="rounded-2xl bg-zinc-850/60 border border-zinc-800 p-3.5 space-y-3">
              {!isEditing && !isManual ? (
                /* Canonical locked card */
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Biblioteca Oficial
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 truncate">{title}</h3>
                    <p className="text-xs text-zinc-400 truncate">{artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToSearch}
                    className="shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    Trocar música
                  </button>
                </div>
              ) : isEditing ? (
                /* Edit mode (immutable title & artist) */
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">Música</span>
                    <span className="text-[10px] text-zinc-500">Metadados imutáveis</span>
                  </div>
                  <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 px-3 py-2 text-sm text-zinc-200">
                    <span className="font-bold">{title}</span> — <span className="text-zinc-400">{artist}</span>
                  </div>
                </div>
              ) : (
                /* Manual registration mode (editable title & artist) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Cadastro Manual
                    </span>
                    <button
                      type="button"
                      onClick={handleBackToSearch}
                      className="text-xs text-zinc-400 hover:text-emerald-400 underline underline-offset-4 cursor-pointer"
                    >
                      Voltar para busca
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Título da Música <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Minha Composição"
                      className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Artista / Intérprete <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Ex: Nome do Artista"
                      className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ─── Chords Section (Decoupled with Feedback & Alternative Inputs) ─── */}
            <div className="rounded-2xl bg-zinc-850/60 border border-zinc-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-200">
                  Cifra / Acordes
                </label>
                <div className="flex items-center gap-2">
                  {isSearchingChords ? (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent inline-block" />
                      Buscando cifra...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAltChordSearch((prev) => !prev)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
                    >
                      {showAltChordSearch ? "Ocultar busca de cifra" : "Buscar / Ajustar Cifra"}
                    </button>
                  )}
                </div>
              </div>

              {/* Chords Status Feedback */}
              {chordsFeedback && (
                <div
                  className={`rounded-xl p-2.5 text-xs flex items-center justify-between gap-2 ${
                    chordsFeedback.type === "success"
                      ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                      : chordsFeedback.type === "warning"
                      ? "bg-amber-950/60 border border-amber-800 text-amber-300"
                      : chordsFeedback.type === "error"
                      ? "bg-red-950/60 border border-red-800 text-red-300"
                      : "bg-zinc-800/80 border border-zinc-700 text-zinc-300"
                  }`}
                >
                  <span>{chordsFeedback.text}</span>
                  <button
                    type="button"
                    onClick={() => setChordsFeedback(null)}
                    className="text-zinc-400 hover:text-zinc-200 cursor-pointer p-0.5 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Decoupled / Alternative Chord Search Panel */}
              {showAltChordSearch && (
                <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/60 p-3 space-y-2.5">
                  <p className="text-[11px] text-zinc-400">
                    Se a cifra não foi encontrada automaticamente com a grafia oficial, informe termos alternativos para buscar sem alterar o título ou artista da música.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={altTitle}
                      onChange={(e) => setAltTitle(e.target.value)}
                      placeholder={title || "Título alternativo para cifra"}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 border border-zinc-700 focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
                    />
                    <input
                      type="text"
                      value={altArtist}
                      onChange={(e) => setAltArtist(e.target.value)}
                      placeholder={artist || "Artista alternativo para cifra"}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 border border-zinc-700 focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleSearchAlternativeChords()}
                      disabled={isSearchingChords}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-3 py-1.5 text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSearchingChords ? "Consultando..." : "Buscar Cifra"}
                    </button>
                  </div>
                </div>
              )}

              <textarea
                rows={4}
                value={chords}
                onChange={(e) => setChords(e.target.value)}
                placeholder="Cole aqui a cifra no formato ChordPro ou texto..."
                className="w-full font-mono text-xs rounded-xl bg-zinc-800/80 p-3 text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* ─── Lyrics Section ─── */}
            <div className="rounded-2xl bg-zinc-850/60 border border-zinc-800 p-3.5 space-y-2">
              <label className="block text-xs font-medium text-zinc-200">
                Letra da Música
              </label>
              <textarea
                rows={5}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Letra da música..."
                className="w-full font-mono text-xs rounded-xl bg-zinc-800/80 p-3 text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* ─── Genres (Up to 3 styles) ─── */}
            <div className="rounded-2xl bg-zinc-850/60 border border-zinc-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-200">
                  Estilos Musicais
                  <span className="ml-1 text-[11px] text-zinc-400 font-normal">
                    (Selecione até 3 estilos)
                  </span>
                </label>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    genres.length === 3
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                  }`}
                >
                  {genres.length} de 3 selecionados
                </span>
              </div>

              {genres.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 shadow-sm"
                    >
                      <span>{GENRE_LABELS[g] || g}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGenre(g)}
                        className="rounded-full p-0.5 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-100 transition-colors cursor-pointer"
                        title={`Remover estilo ${GENRE_LABELS[g] || g}`}
                        aria-label={`Remover estilo ${GENRE_LABELS[g] || g}`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  Nenhum estilo selecionado ainda.
                </p>
              )}

              {genres.length < 3 ? (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddGenre(e.target.value as MusicGenre);
                    }
                  }}
                  className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">
                    {genres.length === 0
                      ? "+ Selecionar estilo musical..."
                      : `+ Adicionar outro estilo (${3 - genres.length} restante${
                          3 - genres.length > 1 ? "s" : ""
                        })...`}
                  </option>
                  {MUSIC_GENRES.filter((g) => !genres.includes(g)).map((g) => (
                    <option key={g} value={g}>
                      {GENRE_LABELS[g] || g}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {/* ─── Keys Row ─── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tom Preferido
                </label>
                <select
                  value={preferredKey}
                  onChange={(e) => setPreferredKey(e.target.value as MusicalKey | "")}
                  className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Não informado</option>
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tom Original
                </label>
                <select
                  value={originalKey}
                  onChange={(e) => setOriginalKey(e.target.value as MusicalKey | "")}
                  className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Não informado</option>
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── Status de Estudo ─── */}
            <div className="flex items-center gap-3 rounded-xl bg-zinc-800/40 p-3 border border-zinc-700/40">
              <input
                type="checkbox"
                id="studyingCheckbox"
                checked={studying}
                onChange={(e) => setStudying(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-500 border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500/20"
              />
              <label
                htmlFor="studyingCheckbox"
                className="text-xs font-medium text-zinc-200 cursor-pointer select-none flex items-center gap-1.5"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                Música ainda em estudo
              </label>
            </div>

            {/* ─── Notes ─── */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Observações
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Introdução com violão de 7 cordas, modulação no refrão..."
                className="w-full text-xs rounded-xl bg-zinc-800/80 p-3 text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* ─── Sheet Music ─── */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Partitura / Arquivo de Cifra (Link ou Nome)
              </label>
              <input
                type="text"
                value={sheetMusicFile}
                onChange={(e) => setSheetMusicFile(e.target.value)}
                placeholder="Ex: partituras/como-nossos-pais.pdf"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* ─── Spotify ─── */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Link do Spotify
              </label>
              <input
                type="url"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* ─── Actions ─── */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar Música"
                  : "Cadastrar Música"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
