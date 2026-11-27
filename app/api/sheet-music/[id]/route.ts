import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sheetMusicFiles } from "@/db/schema/sheet-music-files";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public PDF endpoint. Access is by unguessable file id (accepted for this app).
 * The id identifies one immutable file, so the response is cached for a year.
 * A replaced PDF gets a new id, so clients never see stale bytes.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const [file] = await db
    .select({
      fileName: sheetMusicFiles.fileName,
      sha256: sheetMusicFiles.sha256,
      content: sheetMusicFiles.content,
    })
    .from(sheetMusicFiles)
    .where(eq(sheetMusicFiles.id, id))
    .limit(1);

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const etag = `"${file.sha256}"`;
  const headers = {
    "Content-Type": "application/pdf",
    "Content-Length": String(file.content.length),
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(new Uint8Array(file.content), { headers });
}
