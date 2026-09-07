import { CifraclubProvider } from "@/lib/chords/providers/cifraclub-provider";
import { convertCifraToChordPro } from "@/lib/chordpro/converter";
import type { ChordSearchResult } from "../types";

/**
 * Orchestrates the chord-search flow:
 * 1. Fetches raw tabular data from the REPP CifraClub API via CifraclubProvider
 * 2. Converts the tabular array to ChordPro inline format via the converter
 * 3. Returns a normalized ChordSearchResult ready for the form / action layer
 */
export class ChordsService {
  constructor(private readonly provider = new CifraclubProvider()) {}

  async searchChords(
    title: string,
    artist: string
  ): Promise<ChordSearchResult> {
    const raw = await this.provider.fetchChords(artist, title);

    const chordpro = convertCifraToChordPro(raw.cifra);

    return {
      title: raw.name,
      artist: raw.artist,
      key: raw.key ?? null,
      chordpro,
    };
  }
}

export const chordsService = new ChordsService();
