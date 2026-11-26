const SPOTIFY_SEARCH_BASE_URL = "https://open.spotify.com/search/";

/**
 * Builds a Spotify Web search URL for the song, e.g.
 * https://open.spotify.com/search/Juras%20Rosa%20Passos
 * Returns null when there is nothing to search for.
 */
export function buildSpotifySearchUrl(
  title: string,
  artist?: string | null
): string | null {
  const query = [title, artist ?? ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  if (!query) return null;

  return `${SPOTIFY_SEARCH_BASE_URL}${encodeURIComponent(query)}`;
}
