const GOOGLE_SEARCH_BASE_URL = "https://www.google.com/search";
const CIFRACLUB_SITE = "site:cifraclub.com.br";

/**
 * Builds a Google search restricted to cifraclub.com.br, pre-filled with the
 * song title and artist, e.g.
 * https://www.google.com/search?q=site%3Acifraclub.com.br+title+artist
 *
 * Google is used instead of Cifra Club's own search because mobile apps
 * intercept cifraclub.com.br links and drop the query params.
 * Returns null when there is nothing to search for.
 */
export function buildCifraClubSearchUrl(
  title: string,
  artist?: string | null
): string | null {
  const query = [title, artist ?? ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  if (!query) return null;

  const params = new URLSearchParams({ q: `${CIFRACLUB_SITE} ${query}` });
  return `${GOOGLE_SEARCH_BASE_URL}?${params.toString()}`;
}
