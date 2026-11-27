import { cleanupOrphanSheetMusicFiles } from "@/features/music/services/sheet-music-upload-service";

/**
 * Scheduled by vercel.json. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deleted = await cleanupOrphanSheetMusicFiles();
  return Response.json({ deleted });
}
