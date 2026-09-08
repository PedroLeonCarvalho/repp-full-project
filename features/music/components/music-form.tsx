"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";
import type {
  CreateMusicInput,
  LyricsSearchResult,
  Music,
  MusicCatalogEntry,
  MusicalKey,
  MusicGenre,
  UpdateMusicInput,
} from "../types";
import { GENRE_LABELS } from "./music-filters";
import { searchLyricsAction, searchChordsAction } from "../actions/music-actions";
import { searchCatalogAction } from "../actions/music-catalog-actions";
import { LyricsSearchModal } from "./lyrics-search-modal";

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

function MusicFormModal({ initialData, onClose, onSubmit }: MusicFormModalProps) {
  const isEditing = Boolean(initialData);

  // Catalog selection state (create mode only)
  const [selectedCatalogEntry, setSelectedCatalogEntry] =
    useState<MusicCatalogEntry | null>(null);

  // Title / artist fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [artist, setArtist] = useState(initialData?.artist || "");

  // Personal fields
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catalog autocomplete state (create mode)
  const [catalogResults, setCatalogResults] = useState<MusicCatalogEntry[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const catalogDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lyrics search state
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricsSearchResult[]>([]);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [lyricsFeedback, setLyricsFeedback] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);

  // Chords search state
  const [isSearchingChords, setIsSearchingChords] = useState(false);
  const [chordsFeedback, setChordsFeedback] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);

  const handleAddGenre = (genreToAdd: MusicGenre) => {
    if (!genreToAdd) return;
    if (genres.length >= 3) return;
    if (genres.includes(genreToAdd)) return;
    setGenres((prev) => [...prev, genreToAdd]);
  };

  const handleRemoveGenre = (genreToRemove: MusicGenre) => {
    setGenres((prev) => prev.filter((g) => g !== genreToRemove));
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        titleInputRef.current &&
        !titleInputRef.current.contains(e.target as Node)
      ) {
        setShowCatalogDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete search when title changes (create mode only, >= 4 chars)
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      // Reset catalog selection when user edits the title
      if (selectedCatalogEntry) {
        setSelectedCatalogEntry(null);
        setArtist("");
      }

      if (catalogDebounceRef.current) clearTimeout(catalogDebounceRef.current);

      if (!isEditing && value.trim().length >= 4) {
        catalogDebounceRef.current = setTimeout(async () => {
          setIsSearchingCatalog(true);
          try {
            const res = await searchCatalogAction(value.trim());
            if (res.success) {
              setCatalogResults(res.data);
              setShowCatalogDropdown(true);
            }
          } finally {
            setIsSearchingCatalog(false);
          }
        }, 350);
      } else {
        setCatalogResults([]);
        setShowCatalogDropdown(false);
      }
    },
    [isEditing, selectedCatalogEntry]
  );

  // When user selects an entry from the catalog dropdown
  const handleSelectCatalogEntry = (entry: MusicCatalogEntry) => {
    setSelectedCatalogEntry(entry);
    setTitle(entry.title);
    setArtist(entry.artist);
    setCatalogResults([]);
    setShowCatalogDropdown(false);
  };

  // Clear catalog selection (allow re-typing)
  const handleClearCatalogSelection = () => {
    setSelectedCatalogEntry(null);
    setTitle("");
    setArtist("");
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  // Chords search (REPP CifraClub API)
  const handleSearchChords = async () => {
    if (!title.trim()) {
      setChordsFeedback({
        type: "error",
        text: "Informe o título da música para buscar a cifra.",
      });
      return;
    }
    if (!artist.trim()) {
      setChordsFeedback({
        type: "error",
        text: "Informe o artista para buscar a cifra no CifraClub.",
      });
      return;
    }

    setIsSearchingChords(true);
    setChordsFeedback(null);

    try {
      const res = await searchChordsAction(title.trim(), artist.trim());

      if (!res.success) {
        setChordsFeedback({
          type: "error",
          text: res.error || "Erro ao consultar o CifraClub.",
        });
        return;
      }

      const found = res.data;

      // Update title/artist from the API canonical data (last search wins)
      // Only when not in edit mode and no catalog entry is locked
      if (!selectedCatalogEntry) {
        setTitle(found.title);
        setArtist(found.artist);
      }

      // Populate chords with the converted ChordPro text
      setChords(found.chordpro);

      // Auto-fill originalKey if it's still empty and the API returned a key
      if (found.key && !originalKey) {
        setOriginalKey(found.key as MusicalKey);
      }

      setChordsFeedback({
        type: "success",
        text: `Cifra de "${found.title}" importada com sucesso!`,
      });
    } catch {
      setChordsFeedback({
        type: "error",
        text: "Falha de conexão com o servidor de cifras.",
      });
    } finally {
      setIsSearchingChords(false);
    }
  };

  // Lyrics search (LRCLIB)
  const handleSearchLyrics = async () => {
    if (!title.trim()) {
      setLyricsFeedback({
        type: "error",
        text: "Informe o título da música para buscar a letra.",
      });
      return;
    }

    setIsSearchingLyrics(true);
    setLyricsFeedback(null);

    try {
      const res = await searchLyricsAction({
        title: title.trim(),
        artist: artist.trim() || undefined,
      });

      if (!res.success) {
        setLyricsFeedback({
          type: "error",
          text: res.error || "Erro ao consultar o serviço de letras.",
        });
        return;
      }

      if (res.data.length === 0) {
        setLyricsFeedback({
          type: "info",
          text: "Nenhuma letra encontrada para esta música no LRCLIB.",
        });
        return;
      }

      if (res.data.length === 1) {
        const foundItem = res.data[0];
        if (lyrics.trim() && lyrics.trim() !== foundItem.plainLyrics.trim()) {
          if (
            confirm(
              `Deseja substituir a letra pelos dados de "${foundItem.title}" (${foundItem.artist})?`
            )
          ) {
            if (!isEditing && !selectedCatalogEntry) {
              setTitle(foundItem.title);
              setArtist(foundItem.artist);
            }
            setLyrics(foundItem.plainLyrics);
            setLyricsFeedback({
              type: "success",
              text: `Letra de "${foundItem.title}" importada com sucesso!`,
            });
          }
        } else {
          if (!isEditing && !selectedCatalogEntry) {
            setTitle(foundItem.title);
            setArtist(foundItem.artist);
          }
          setLyrics(foundItem.plainLyrics);
          setLyricsFeedback({
            type: "success",
            text: `Letra de "${foundItem.title}" importada com sucesso!`,
          });
        }
      } else {
        setSearchResults(res.data);
        setIsLyricsModalOpen(true);
      }
    } catch {
      setLyricsFeedback({
        type: "error",
        text: "Falha de conexão com o provedor de letras.",
      });
    } finally {
      setIsSearchingLyrics(false);
    }
  };

  const handleSelectLyricCandidate = (selectedItem: LyricsSearchResult) => {
    if (lyrics.trim() && lyrics.trim() !== selectedItem.plainLyrics.trim()) {
      if (
        confirm(
          `Deseja substituir a letra pelos dados de "${selectedItem.title}" (${selectedItem.artist})?`
        )
      ) {
        if (!isEditing && !selectedCatalogEntry) {
          setTitle(selectedItem.title);
          setArtist(selectedItem.artist);
        }
        setLyrics(selectedItem.plainLyrics);
        setLyricsFeedback({
          type: "success",
          text: `Letra de "${selectedItem.title}" importada com sucesso!`,
        });
      }
    } else {
      if (!isEditing && !selectedCatalogEntry) {
        setTitle(selectedItem.title);
        setArtist(selectedItem.artist);
      }
      setLyrics(selectedItem.plainLyrics);
      setLyricsFeedback({
        type: "success",
        text: `Letra de "${selectedItem.title}" importada com sucesso!`,
      });
    }
    setIsLyricsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEditing) {
      if (!title.trim()) {
        setErrorMessage("O título da música é obrigatório.");
        return;
      }
      if (!artist.trim()) {
        setErrorMessage("O nome do artista é obrigatório.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let payload: CreateMusicInput | Omit<UpdateMusicInput, "id">;

      if (isEditing) {
        // Edit: only personal fields
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
        // Create: include title + artist for catalog lookup/upsert
        const createPayload: CreateMusicInput = {
          title: title.trim(),
          artist: artist.trim(),
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
        setErrorMessage(res.error || "Ocorreu um erro ao salvar a música.");
      }
    } catch {
      setErrorMessage("Erro de conexão ao salvar música.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTitleLocked = isEditing || Boolean(selectedCatalogEntry);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <h2 className="text-lg font-semibold text-zinc-50">
            {isEditing ? "Editar Música" : "Nova Música"}
          </h2>
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

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-red-950/60 border border-red-800/80 p-3.5 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ─── Title (with autocomplete in create mode) ─── */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Título da Música <span className="text-emerald-400">*</span>
            </label>

            {isTitleLocked ? (
              /* Locked state (edit mode or catalog entry selected) */
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-zinc-800/40 border border-zinc-700/40 px-3.5 py-2.5 text-sm text-zinc-300">
                  {title}
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleClearCatalogSelection}
                    className="shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/60 px-3 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                    title="Alterar seleção"
                  >
                    Alterar
                  </button>
                )}
              </div>
            ) : (
              /* Autocomplete input (create mode, not yet locked) */
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={titleInputRef}
                      type="text"
                      required
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setShowCatalogDropdown(false);
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (title.trim() && !isSearchingLyrics) {
                            void handleSearchLyrics();
                          }
                        }
                      }}
                      placeholder="Ex: Como Nossos Pais"
                      className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-500"
                      autoComplete="off"
                    />
                    {isSearchingCatalog && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      </div>
                    )}
                  </div>

                  {/* LRCLIB lyrics search button */}
                  <button
                    type="button"
                    onClick={handleSearchLyrics}
                    disabled={!title.trim() || isSearchingLyrics}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/80 hover:border-emerald-500/50 hover:bg-zinc-700 px-3 sm:px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
                    title={
                      !title.trim()
                        ? "Preencha o título para buscar a letra"
                        : "Buscar letra via LRCLIB"
                    }
                  >
                    {isSearchingLyrics ? (
                      <>
                        <span className="animate-spin text-xs">⏳</span>
                        <span className="text-xs">Buscando...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span className="hidden sm:inline">Buscar Letra</span>
                        <span className="sm:hidden">Letra</span>
                      </>
                    )}
                  </button>

                  {/* CifraClub chords search button */}
                  <button
                    type="button"
                    onClick={handleSearchChords}
                    disabled={!title.trim() || !artist.trim() || isSearchingChords}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 hover:bg-zinc-700 px-3 sm:px-3.5 py-2 text-xs font-semibold text-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
                    title={
                      !title.trim()
                        ? "Preencha o título para buscar a cifra"
                        : !artist.trim()
                        ? "Preencha o artista para buscar a cifra"
                        : "Buscar cifra via CifraClub"
                    }
                  >
                    {isSearchingChords ? (
                      <>
                        <span className="animate-spin text-xs">⏳</span>
                        <span className="text-xs">Buscando...</span>
                      </>
                    ) : (
                      <>
                        <span>🎸</span>
                        <span className="hidden sm:inline">Buscar Cifra</span>
                        <span className="sm:hidden">Cifra</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Catalog autocomplete dropdown */}
                {showCatalogDropdown && (catalogResults.length > 0 || title.trim().length >= 4) && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-zinc-850 border border-zinc-700 shadow-2xl overflow-hidden"
                    style={{ backgroundColor: "#18181b" }}
                  >
                    {catalogResults.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                          No catálogo
                        </div>
                        {catalogResults.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectCatalogEntry(entry);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 transition-colors group"
                          >
                            <span className="block text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors">
                              {entry.title}
                            </span>
                            <span className="block text-xs text-zinc-500">
                              {entry.artist}
                            </span>
                          </button>
                        ))}
                        <div className="border-t border-zinc-800">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowCatalogDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 transition-colors"
                          >
                            <span className="text-xs text-zinc-400">
                              ✚ Adicionar como nova música:{" "}
                              <span className="text-zinc-200 font-medium">
                                &quot;{title}&quot;
                              </span>
                            </span>
                          </button>
                        </div>
                      </>
                    ) : (
                      !isSearchingCatalog && (
                        <div className="px-3 py-3 text-xs text-zinc-500">
                          Nenhuma música encontrada no catálogo. Preencha o artista e salve para criar uma nova entrada.
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <p className="text-[11px] text-zinc-500 mt-1">
                {selectedCatalogEntry
                  ? "✓ Música do catálogo selecionada."
                  : "Digite ≥ 4 caracteres para buscar no catálogo ou crie uma nova música."}
              </p>
            )}
          </div>


          {/* ─── Artist ─── */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Artista / Intérprete <span className="text-emerald-400">*</span>
            </label>
            {isTitleLocked ? (
              <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 px-3.5 py-2.5 text-sm text-zinc-300">
                {artist}
              </div>
            ) : (
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ex: Elis Regina"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
              />
            )}
            {isTitleLocked && isEditing && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Título e artista são imutáveis após o cadastro.
              </p>
            )}
          </div>

          {/* ─── Genres (Up to 3 styles) ─── */}
          <div className="rounded-2xl bg-zinc-800/40 border border-zinc-700/50 p-3.5 space-y-2.5">
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

            {/* Selected Genres Badges (Registered/Visual feedback) */}
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
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
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

            {/* Selector Dropdown / Add More */}
            {genres.length < 3 ? (
              <div>
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
                      ? "+ Selecionar primeiro estilo..."
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
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                <span>ℹ️</span>
                <span>
                  Limite máximo de 3 estilos atingido. Para alterar, remova um dos estilos acima.
                </span>
              </div>
            )}
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

          {/* ─── Lyrics ─── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">
                Letra{isEditing && <span className="text-zinc-500 font-normal"> (substituição pessoal)</span>}
              </label>
              <button
                type="button"
                onClick={handleSearchLyrics}
                disabled={!title.trim() || isSearchingLyrics}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                title="Buscar letra na API LRCLIB"
              >
                <span>🔍</span>
                <span>{isSearchingLyrics ? "Buscando..." : "Buscar via LRCLIB"}</span>
              </button>
            </div>
            {lyricsFeedback && (
              <div
                className={`mb-2 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2 ${
                  lyricsFeedback.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                    : lyricsFeedback.type === "error"
                    ? "bg-red-950/60 border border-red-800 text-red-300"
                    : "bg-zinc-800/80 border border-zinc-700 text-zinc-300"
                }`}
              >
                <span>{lyricsFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setLyricsFeedback(null)}
                  className="text-zinc-400 hover:text-zinc-200 cursor-pointer text-xs p-1"
                >
                  ✕
                </button>
              </div>
            )}
            <textarea
              rows={6}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={
                isEditing
                  ? "Substitua a letra por uma nova busca ou digite sua versão personalizada..."
                  : "Cole aqui a letra da música ou busque pelo título..."
              }
              className="w-full font-mono text-xs rounded-xl bg-zinc-800/80 p-3 text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none leading-relaxed"
            />
            {isEditing && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Deixe em branco para usar a letra do catálogo global ou use &quot;Buscar via LRCLIB&quot; para substituir/adicionar.
              </p>
            )}
          </div>

          {/* ─── Chords ─── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">
                Cifra / Acordes{isEditing && <span className="text-zinc-500 font-normal"> (substituição pessoal)</span>}
              </label>
              <button
                type="button"
                onClick={handleSearchChords}
                disabled={!title.trim() || !artist.trim() || isSearchingChords}
                className="text-[11px] text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                🎸 {isSearchingChords ? "Buscando..." : "Buscar via CifraClub"}
              </button>
            </div>
            {chordsFeedback && (
              <div
                className={`mb-2 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2 ${
                  chordsFeedback.type === "success"
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
                  className="text-zinc-400 hover:text-zinc-200 cursor-pointer text-xs p-1"
                >
                  ✕
                </button>
              </div>
            )}
            <textarea
              rows={4}
              value={chords}
              onChange={(e) => setChords(e.target.value)}
              placeholder={
                isEditing
                  ? "Substitua a cifra do catálogo por uma versão personalizada..."
                  : "Cole aqui a cifra ou use \"Buscar via CifraClub\" acima..."
              }
              className="w-full font-mono text-xs rounded-xl bg-zinc-800/80 p-3 text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none leading-relaxed"
            />
            {isEditing && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Deixe em branco para usar a cifra do catálogo global.
              </p>
            )}
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
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Salvando..."
                : isEditing
                ? "Atualizar Música"
                : "Cadastrar Música"}
            </button>
          </div>
        </form>
      </div>

      {/* Lyrics Candidate Selection Modal */}
      <LyricsSearchModal
        isOpen={isLyricsModalOpen}
        results={searchResults}
        onClose={() => setIsLyricsModalOpen(false)}
        onSelect={handleSelectLyricCandidate}
      />
    </div>
  );
}
