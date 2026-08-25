"use client";

import { useState } from "react";
import { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";
import type { CreateMusicInput, LyricsSearchResult, Music, MusicalKey, MusicGenre } from "../types";
import { GENRE_LABELS } from "./music-filters";
import { searchLyricsAction } from "../actions/music-actions";
import { LyricsSearchModal } from "./lyrics-search-modal";

interface MusicFormProps {
  initialData?: Music | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMusicInput) => Promise<{ success: boolean; error?: string }>;
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
  onSubmit: (data: CreateMusicInput) => Promise<{ success: boolean; error?: string }>;
}

function MusicFormModal({
  initialData,
  onClose,
  onSubmit,
}: MusicFormModalProps) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [artist, setArtist] = useState(initialData?.artist || "");
  const [lyrics, setLyrics] = useState(initialData?.lyrics || "");
  const [originalKey, setOriginalKey] = useState<MusicalKey | "">(
    initialData?.originalKey || ""
  );
  const [preferredKey, setPreferredKey] = useState<MusicalKey | "">(
    initialData?.preferredKey || ""
  );
  const [skillLevel, setSkillLevel] = useState<boolean>(
    initialData?.skillLevel ?? true
  );
  const [genre, setGenre] = useState<MusicGenre | "">(
    initialData?.genre || ""
  );
  const [note, setNote] = useState(initialData?.note || "");
  const [spotifyLink, setSpotifyLink] = useState(
    initialData?.spotifyLink || ""
  );
  const [sheetMusicFile, setSheetMusicFile] = useState(
    initialData?.sheetMusicFile || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Assisted Lyrics Search states
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricsSearchResult[]>([]);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [lyricsFeedback, setLyricsFeedback] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);

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
              `Deseja substituir a letra atual pela letra encontrada de "${foundItem.title}" (${foundItem.artist})?`
            )
          ) {
            setLyrics(foundItem.plainLyrics);
            setLyricsFeedback({
              type: "success",
              text: `Letra de "${foundItem.title}" importada com sucesso!`,
            });
          }
        } else {
          setLyrics(foundItem.plainLyrics);
          setLyricsFeedback({
            type: "success",
            text: `Letra de "${foundItem.title}" importada com sucesso!`,
          });
        }
      } else {
        // Multiple matches -> Open selection modal
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

  const handleSelectLyricCandidate = (selectedText: string) => {
    if (lyrics.trim() && lyrics.trim() !== selectedText.trim()) {
      if (
        confirm(
          "Deseja substituir o conteúdo atual da letra pela versão selecionada?"
        )
      ) {
        setLyrics(selectedText);
        setLyricsFeedback({
          type: "success",
          text: "Letra selecionada importada para o formulário!",
        });
      }
    } else {
      setLyrics(selectedText);
      setLyricsFeedback({
        type: "success",
        text: "Letra selecionada importada para o formulário!",
      });
    }
    setIsLyricsModalOpen(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("O título da música é obrigatório.");
      return;
    }

    if (!artist.trim()) {
      setErrorMessage("O nome do artista é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateMusicInput = {
        title: title.trim(),
        artist: artist.trim(),
        lyrics: lyrics.trim() || null,
        originalKey: originalKey ? (originalKey as MusicalKey) : null,
        preferredKey: preferredKey ? (preferredKey as MusicalKey) : null,
        skillLevel,
        genre: genre ? (genre as MusicGenre) : null,
        note: note.trim() || null,
        spotifyLink: spotifyLink.trim() || null,
        sheetMusicFile: sheetMusicFile.trim() || null,
      };

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
            <svg
              className="h-5 w-5"
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
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-red-950/60 border border-red-800/80 p-3.5 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Título da Música <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como Nossos Pais"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Artista / Intérprete <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Elis Regina"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Gênero Musical
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as MusicGenre | "")}
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Selecione um gênero</option>
              {MUSIC_GENRES.map((g) => (
                <option key={g} value={g}>
                  {GENRE_LABELS[g]}
                </option>
              ))}
            </select>
          </div>

          {/* Keys Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Tom Preferido
              </label>
              <select
                value={preferredKey}
                onChange={(e) =>
                  setPreferredKey(e.target.value as MusicalKey | "")
                }
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Não informado</option>
                {MUSICAL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Tom Original
              </label>
              <select
                value={originalKey}
                onChange={(e) =>
                  setOriginalKey(e.target.value as MusicalKey | "")
                }
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Não informado</option>
                {MUSICAL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill Level Checkbox */}
          <div className="flex items-center gap-3 rounded-xl bg-zinc-800/40 p-3 border border-zinc-700/40">
            <input
              type="checkbox"
              id="skillLevelCheckbox"
              checked={skillLevel}
              onChange={(e) => setSkillLevel(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500 border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500/20"
            />
            <label
              htmlFor="skillLevelCheckbox"
              className="text-xs font-medium text-zinc-200 cursor-pointer select-none"
            >
              Música dominada no repertório (pronta para apresentações)
            </label>
          </div>

          {/* Lyrics with Assisted Search */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <label className="block text-xs font-medium text-zinc-300">
                Letra / Cifra
              </label>

              <button
                type="button"
                onClick={handleSearchLyrics}
                disabled={!title.trim() || isSearchingLyrics}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-zinc-700 hover:border-emerald-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
                title={
                  !title.trim()
                    ? "Preencha o título da música para buscar a letra"
                    : "Buscar letra na base pública LRCLIB"
                }
              >
                {isSearchingLyrics ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Buscando letra...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Buscar letra (LRCLIB)</span>
                  </>
                )}
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
              placeholder="Cole aqui a letra e/ou cifra da música ou clique em 'Buscar letra'..."
              className="w-full font-mono text-xs rounded-xl bg-zinc-800/80 p-3 text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>


          {/* Notes */}
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

          {/* Sheet Music / Score */}
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

          {/* Spotify Link */}
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

          {/* Action buttons */}
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

