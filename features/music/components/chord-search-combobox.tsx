"use client";

import { useEffect, useRef, useState } from "react";
import type { ChordSuggestion } from "../types";

interface ChordSearchComboboxProps {
  onSelectSuggestion: (suggestion: ChordSuggestion) => void;
  isLoadingChords?: boolean;
  initialQuery?: string;
  placeholder?: string;
}

export function ChordSearchCombobox({
  onSelectSuggestion,
  isLoadingChords = false,
  initialQuery = "",
  placeholder = "Digite o título ou artista para buscar a cifra...",
}: ChordSearchComboboxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<ChordSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef<string>("");

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions from internal API proxy
  const fetchSuggestions = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    latestQueryRef.current = trimmed;
    setIsSearching(true);
    setHasSearched(true);
    setHighlightedIndex(-1);

    try {
      const res = await fetch(
        `/api/chords/search?q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        if (latestQueryRef.current === trimmed) {
          setSuggestions([]);
        }
        return;
      }
      const data = (await res.json()) as ChordSuggestion[];
      if (latestQueryRef.current === trimmed) {
        setSuggestions(data);
        setIsOpen(true);
      }
    } catch {
      if (latestQueryRef.current === trimmed) {
        setSuggestions([]);
      }
    } finally {
      if (latestQueryRef.current === trimmed) {
        setIsSearching(false);
      }
    }
  };

  // Handle typing with 300ms debounce
  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        void fetchSuggestions(trimmed);
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  };

  const handleSelect = (item: ChordSuggestion) => {
    setIsOpen(false);
    setQuery(`${item.title} — ${item.artist}`);
    onSelectSuggestion(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-zinc-500 text-sm pointer-events-none select-none">
          🎸
        </span>
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="chord-suggestions-list"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 3) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoadingChords}
          className="w-full rounded-xl bg-zinc-900/90 pl-9 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 border border-zinc-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all disabled:opacity-50"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {isSearching || isLoadingChords ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
                setHasSearched(false);
              }}
              className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded text-xs cursor-pointer"
              title="Limpar busca"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && query.trim().length >= 3 && (
        <div
          id="chord-suggestions-list"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-700/90 shadow-2xl p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={`${item.artistSlug}-${item.songSlug}-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition-colors ${
                    isHighlighted
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                      : "text-zinc-200 hover:bg-zinc-800/80 hover:text-zinc-100"
                  }`}
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-zinc-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-zinc-400 text-xs truncate">
                      — {item.artist}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono shrink-0 ml-2">
                    Cifra
                  </span>
                </div>
              );
            })
          ) : hasSearched && !isSearching ? (
            <div className="px-3 py-3 text-center text-xs text-zinc-400">
              Nenhuma cifra encontrada para o termo digitado
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
