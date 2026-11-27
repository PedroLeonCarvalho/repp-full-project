import { createHash } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerMusics } from "@/db/schema/customer-musics";
import { setlistMusic } from "@/db/schema/setlist-music";
import { sheetMusicFiles } from "@/db/schema/sheet-music-files";
import { sheetMusicUrl } from "../utils/sheet-music-url";

export class SheetMusicUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetMusicUploadError";
  }
}

// Vercel caps request bodies at about 4.5 MB. The multipart envelope needs
// some of that room, so the PDF itself is limited to 4 MB.
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const ORPHAN_GRACE_HOURS = 36;

export interface UploadedSheetMusic {
  fileId: string;
  url: string;
  fileName: string;
  size: number;
}

export async function uploadSheetMusicFile(
  file: File,
  customerId: string
): Promise<UploadedSheetMusic> {
  if (!file) {
    throw new SheetMusicUploadError("Nenhum arquivo enviado.");
  }

  // 1. Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new SheetMusicUploadError(
      "O arquivo excede o tamanho limite permitido de 4MB."
    );
  }

  // 2. Validate MIME type or file extension
  const isPdfMime = file.type === "application/pdf";
  const hasPdfExt = file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfMime && !hasPdfExt) {
    throw new SheetMusicUploadError("Apenas arquivos PDF são permitidos.");
  }

  // 3. Read bytes and verify PDF magic bytes (%PDF)
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length < 4) {
    throw new SheetMusicUploadError("Arquivo inválido ou corrompido.");
  }

  const isPdfMagic =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  if (!isPdfMagic) {
    throw new SheetMusicUploadError(
      "O arquivo fornecido não é um documento PDF válido."
    );
  }

  // 4. Store in the database. The file stays unattached until a song is saved
  // with its id; unattached files are removed by the orphan cleanup.
  const [created] = await db
    .insert(sheetMusicFiles)
    .values({
      customerId,
      fileName: file.name.slice(0, 255),
      sizeBytes: buffer.length,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      content: buffer,
    })
    .returning({ id: sheetMusicFiles.id });

  return {
    fileId: created.id,
    url: sheetMusicUrl(created.id)!,
    fileName: file.name,
    size: buffer.length,
  };
}

/**
 * Throws unless the file exists and belongs to the customer.
 * Called before a song is saved with a file id.
 */
export async function assertOwnedSheetMusicFile(
  fileId: string,
  customerId: string
): Promise<void> {
  const [row] = await db
    .select({ id: sheetMusicFiles.id })
    .from(sheetMusicFiles)
    .where(and(eq(sheetMusicFiles.id, fileId), eq(sheetMusicFiles.customerId, customerId)))
    .limit(1);

  if (!row) {
    throw new SheetMusicUploadError(
      "O arquivo PDF não foi encontrado. Envie o arquivo novamente."
    );
  }
}

// A file is referenced by a library song or by any setlist copy of it.
function isUnreferenced(fileIdColumn: typeof sheetMusicFiles.id) {
  return sql`NOT EXISTS (SELECT 1 FROM ${customerMusics} WHERE ${customerMusics.sheetMusicFileId} = ${fileIdColumn})
    AND NOT EXISTS (SELECT 1 FROM ${setlistMusic} WHERE ${setlistMusic.sheetMusicFileId} = ${fileIdColumn})`;
}

/**
 * Deletes a file only if no library song or setlist copy references it.
 * Used when a song's PDF is replaced or the song is deleted.
 */
export async function deleteSheetMusicFileIfUnreferenced(fileId: string): Promise<boolean> {
  const deleted = await db
    .delete(sheetMusicFiles)
    .where(and(eq(sheetMusicFiles.id, fileId), isUnreferenced(sheetMusicFiles.id)))
    .returning({ id: sheetMusicFiles.id });

  return deleted.length > 0;
}

/**
 * Removes unreferenced files older than the grace period. Files younger than the
 * grace period are kept, because the user may still be about to save them.
 */
export async function cleanupOrphanSheetMusicFiles(): Promise<number> {
  const deleted = await db
    .delete(sheetMusicFiles)
    .where(
      and(
        lt(sheetMusicFiles.createdAt, sql`now() - make_interval(hours => ${ORPHAN_GRACE_HOURS})`),
        isUnreferenced(sheetMusicFiles.id)
      )
    )
    .returning({ id: sheetMusicFiles.id });

  return deleted.length;
}
