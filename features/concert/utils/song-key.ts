/**
 * Identity of a song inside a setlist: normalized title + artist.
 * Used to block the same song twice in one concert. Independent of the
 * library ID, which may be NULL once the library entry is deleted.
 *
 * Keep in sync with the SQL expression in drizzle/0014_setlist_music_unique_song.sql.
 */
function normalizePart(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function songKey(title: string | null | undefined, artist: string | null | undefined): string {
  return JSON.stringify([normalizePart(title), normalizePart(artist)]);
}
