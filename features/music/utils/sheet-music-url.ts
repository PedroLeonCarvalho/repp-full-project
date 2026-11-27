/**
 * Public URL of a sheet music PDF stored in sheet_music_files.
 * The file id is the version: a replaced PDF gets a new id and therefore a new URL,
 * so the response can be cached as immutable.
 */
export function sheetMusicUrl(fileId: string | null | undefined): string | null {
  return fileId ? `/api/sheet-music/${fileId}` : null;
}
