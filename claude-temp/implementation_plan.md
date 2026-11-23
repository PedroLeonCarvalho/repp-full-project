# Remove cifraclub-api and chord views, add "Buscar no Cifra Club" button

The cifraclub-api integration and every chord screen users can see will be removed. The database keeps its chord columns (`customer_musics.chords`, `music_catalog.canonical_chords`) and its data. **No migration.**

## Open Questions

> [!IMPORTANT]
> **1. Where should the "Buscar no Cifra Club" button go?** My proposal is to put it wherever a "Cifra" button or tab exists today:
> - Music form (next to the title and artist fields)
> - Music detail
> - Music list rows (replacing the "Cifra" / "Sem cifra" button)
> - Concert setlist rows: concert detail and live setlist (replacing "Ver Cifra" / "Cifra")
> - Presentation mode, both the private view and the public shared setlist (replacing the "Cifra" tab)
>
> Should the **public shared setlist** (the one open to people who aren't logged in) also get the button, or should I just drop "Cifra" there?

> [!NOTE]
> **2. Back-end chord plumbing:** services and types still read `chords ?? canonicalChords`, and the Zod schema accepts `chords`. My proposal is to **keep the data layer as it is**, since the DB keeps the column, and remove only the API and the UI. Existing chords stay stored but nobody can see or edit them. Do you agree?

> [!NOTE]
> **3. The "Partitura / Cifra (Anexo PDF)" upload** is a sheet-music PDF, not cifraclub. I'll keep it and only change its wording to "Partitura (Anexo PDF)". Do you agree?

## Proposed Changes

### cifraclub-api removal
- [DELETE] `lib/chords/providers/cifraclub-provider.ts`
- [DELETE] `features/music/services/chords-service.ts`
- [DELETE] `lib/chordpro/converter.ts`
- [DELETE] `app/api/chords/search/route.ts` (Cifra Club autocomplete)
- [DELETE] `features/music/components/chord-search-combobox.tsx`
- [MODIFY] `music-actions.ts`: remove `searchChordsAction`
- [MODIFY] `features/music/types/index.ts`: remove `ReppCifraClubApiResponse`, `ChordSearchResult`, `ChordSuggestion`
- [MODIFY] `package.json`: remove the `dev:remote`, `dev:local` and `api:cifraclub` scripts
- [MODIFY] `.env.example`: remove the `CIFRACLUB_API_*` settings

### Chord views removal
- [DELETE] `features/music/components/chords-viewer.tsx`
- [DELETE] `lib/chordpro/transposer.ts` (only used by the viewer)
- [MODIFY] `music-form.tsx`: remove the chord textarea, auto-fetch, combobox and feedback; add the button
- [MODIFY] `music-detail.tsx`: remove the Letra/Cifra tabs and the chord view; lyrics only, plus the button
- [MODIFY] `music-list.tsx` and `music-view.tsx`: remove the "Cifra" button and the `"chords"` tab option; add the button
- [MODIFY] `concert-presentation-mode.tsx`: remove the Cifra mode, toggles and viewer; add the button
- [MODIFY] `concert-detail.tsx` and `concert-live-setlist.tsx`: remove "Ver Cifra", the `"chords"` mode, and chord-text search matching; add the button
- [MODIFY] `public-shared-setlist-view.tsx`: remove the Cifra tab, button and viewer (button depends on question 1)

### New
- [NEW] `features/music/utils/cifraclub-search-url.ts`: `buildCifraClubSearchUrl(title, artist)` → `https://www.cifraclub.com.br/?q=title+artist`
- [NEW] `features/music/components/cifraclub-search-button.tsx`: a reusable `<a target="_blank">` labelled "Buscar no Cifra Club", in compact and full variants

## Verification Plan
- `npm run lint`, `npx tsc --noEmit`, `npm run build`
- `grep` to confirm no `cifraclub-api` / `ChordsViewer` references remain
- Manual: open the music form, detail, setlist and presentation views, and check that the button opens the pre-filled Cifra Club search
