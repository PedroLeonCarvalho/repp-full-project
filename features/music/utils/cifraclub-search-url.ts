const CIFRACLUB_SEARCH_BASE_URL = "https://www.cifraclub.com.br/";

/**
 * Builds a Cifra Club site search URL pre-filled with the song title and artist,
 * e.g. https://www.cifraclub.com.br/?q=title+artist
 * Returns null when there is nothing to search for.
 */
export function buildCifraClubSearchUrl(
  title: string,
  artist: string
): string | null {
  const query = [title, artist]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  if (!query) return null;

  const params = new URLSearchParams({ q: query });
  return `${CIFRACLUB_SEARCH_BASE_URL}?${params.toString()}`;
}
