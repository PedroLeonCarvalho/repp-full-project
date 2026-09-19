import { NextRequest, NextResponse } from "next/server";
import type { ChordSuggestion } from "@/features/music/types";

interface SolrDoc {
  t?: string;
  txt?: string;
  art?: string;
  dns?: string;
  url?: string;
  [key: string]: unknown;
}

interface SolrResponse {
  response?: {
    docs?: SolrDoc[];
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 3) {
    return NextResponse.json<ChordSuggestion[]>([]);
  }

  const query = q.trim();
  const searchUrl = `https://solr.sscdn.co/cifraclub/busca?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) REPP/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json<ChordSuggestion[]>([]);
    }

    const data = (await response.json()) as SolrResponse;
    const docs = data.response?.docs ?? [];

    // Filter only song items (t === "2") with valid fields
    const suggestions: ChordSuggestion[] = docs
      .filter((doc): doc is Required<Pick<SolrDoc, "txt" | "art" | "url" | "dns">> & SolrDoc => {
        return (
          doc.t === "2" &&
          typeof doc.txt === "string" &&
          typeof doc.art === "string" &&
          typeof doc.url === "string" &&
          typeof doc.dns === "string" &&
          doc.txt.trim().length > 0 &&
          doc.art.trim().length > 0 &&
          doc.url.trim().length > 0 &&
          doc.dns.trim().length > 0
        );
      })
      .map((doc) => ({
        title: doc.txt.trim(),
        artist: doc.art.trim(),
        songSlug: doc.url.trim(),
        artistSlug: doc.dns.trim(),
      }));

    return NextResponse.json<ChordSuggestion[]>(suggestions);
  } catch {
    return NextResponse.json<ChordSuggestion[]>([]);
  }
}
