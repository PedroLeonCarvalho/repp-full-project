import { buildCifraClubSearchUrl } from "../utils/cifraclub-search-url";

interface CifraClubSearchButtonProps {
  title: string;
  artist?: string | null;
  /** "compact" hides the label on very small screens (for dense rows). */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * External link that opens Cifra Club's site search pre-filled with
 * the song title and artist, in a new tab.
 */
export function CifraClubSearchButton({
  title,
  artist,
  variant = "full",
  className = "",
}: CifraClubSearchButtonProps) {
  const href = buildCifraClubSearchUrl(title, artist);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Buscar "${title}" no Cifra Club (abre em nova aba)`}
      aria-label={`Buscar ${title} no Cifra Club`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-700/60 bg-amber-950/40 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-900/50 hover:text-amber-200 ${className}`}
    >
      <span aria-hidden="true">🎸</span>
      <span className={variant === "compact" ? "hidden xs:inline" : ""}>
        Buscar no Cifra Club
      </span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
