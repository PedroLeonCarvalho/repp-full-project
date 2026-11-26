import { buildSpotifySearchUrl } from "../utils/spotify-search-url";

interface SpotifySearchButtonProps {
  title?: string | null;
  artist?: string | null;
  /** "compact" hides the label on very small screens (for dense rows). */
  variant?: "compact" | "full";
  /** Disables the button, e.g. when no song is loaded. */
  disabled?: boolean;
  className?: string;
}

/**
 * External link that opens Spotify's web search pre-filled with the song
 * title and artist, in a new tab. Disabled when there is no song loaded.
 */
export function SpotifySearchButton({
  title,
  artist,
  variant = "full",
  disabled = false,
  className = "",
}: SpotifySearchButtonProps) {
  const href = title ? buildSpotifySearchUrl(title, artist) : null;
  const isDisabled = disabled || !href;

  const baseClassName = `inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 hover:text-emerald-200 ${className}`;
  const disabledClassName =
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-950/40 disabled:hover:text-emerald-300";

  const content = (
    <>
      <span aria-hidden="true">🎧</span>
      <span className={variant === "compact" ? "hidden xs:inline" : ""}>
        Buscar no Spotify
      </span>
    </>
  );

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        title="Nenhuma música carregada"
        aria-label="Buscar no Spotify (indisponível)"
        className={`${baseClassName} ${disabledClassName}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Buscar "${title}" no Spotify (abre em nova aba)`}
      aria-label={`Buscar ${title} no Spotify`}
      className={baseClassName}
    >
      {content}
    </a>
  );
}
