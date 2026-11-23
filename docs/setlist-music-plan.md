# REPP — Implementation plan: `setlist_music` and removal of `music_catalog`

Status: **code implemented, not deployed** — Phase A (migration history repair) still pending

## 0. Implementation status

| Item | State |
|---|---|
| Catalog autocomplete removed (`searchCatalog`, `searchCatalogAction`) | Done |
| Schema: `customer_musics` (title/artist, case-insensitive unique index), `setlist_music` (new), `setlist_items` and `music_catalog` removed from TS | Done |
| Migration `drizzle/0012_setlist_music.sql` | Written, tested on PGlite (see below). **Not registered in `_journal.json`** |
| Services: `music-service`, `concert-service`, `project-service`; `music-catalog-service.ts` deleted | Done |
| UI: `SetlistItem.musicId` is the library link (nullable); item `id` is the copy's id; highlight/add checks use the link | Done |
| `npx tsc --noEmit`, `eslint` on changed files, `next build` | Pass |
| Migration test: replay 0000–0011, seed data, run 0012 | 15/15 checks pass (PGlite, scratch dir `/tmp/pgtest`) |
| Phase A: confirm 0007–0010, repair journal and snapshot per environment | **Pending** (needs database access decisions) |
| Drizzle snapshot for 0012 | Not generated; depends on Phase A |
| `docs/technical-design.md` domain model update | Pending |

Related: `db/schema/customer-musics.ts`, `db/schema/music-catalog.ts`, `db/schema/setlist-items.ts`, `features/concert/services/concert-service.ts`, `docs/compartilhamento-setlist-planejamento.txt`

---

## 1. Problem

1. A setlist row points to the live `customer_musics` row. Editing a song's lyrics, chords or key in one concert changes it in every concert that uses it.
2. Music data is split between `music_catalog` (title, artist, canonical lyrics/chords) and `customer_musics` (personal overrides). A concert shows values from both tables, and nothing guarantees it keeps the values it had when built.
3. Future sharing/import needs each song in a concert to be a self-contained snapshot, so a receiver can import it without reading the sender's private library.

## 2. Decisions (closed)

| # | Decision | Reason |
|---|---|---|
| D1 | **Copy-on-add.** Adding a song to a concert copies the `customer_musics` row into `setlist_music`. | Each concert owns its version. |
| D2 | `setlist_music` has the same content columns as `customer_musics`, plus setlist fields. | One shape for library, setlist, share and import. |
| D3 | **Merge `setlist_items` into `setlist_music`.** `position` and `note` move to `setlist_music`; `setlist_items` is dropped. | Each `setlist_music` row belongs to exactly one concert. |
| D4 | `setlist_music.id` **reuses `setlist_items.id`** during the migration. | Existing ids stay valid for the UI. |
| D5 | `source_customer_music_id` is nullable, FK to `customer_musics.id`, **`ON DELETE SET NULL`**. | Traceability without setlists depending on the library. |
| D6 | `customer_musics` holds `title` and `artist` directly; `music_catalog` is removed. | Catalog no longer needed. |
| D7 | Keep `setlist_items_backup` and `customer_musics_backup` for one release, then drop them. | Rollback safety. |
| D8 | Duplicate songs in one setlist stay allowed. | Current behaviour. |
| D9 | **Catalog autocomplete is removed.** | Confirmed by product owner. Already removed from code (see §5.1). |
| D10 | **Behaviour change accepted.** Existing concerts stop following later library edits. | Intended fix; release note required (§7). |

## 3. Current database state

Checked on one database (environment not confirmed; see §4 Phase A):

| Check | Result | Meaning |
|---|---|---|
| `music_catalog` exists | yes | not yet dropped |
| `customer_musics` exists | yes | 0006 rename applied |
| `musics` exists | no | 0006 applied |
| `concerts.presentation_date` nullable | YES | 0011 applied |
| 0007–0010 (genres, genre values, canonical fields, `is_custom`) | **not yet confirmed** | run the check in §4 Phase A |

The Drizzle journal (`drizzle/meta/_journal.json`) only lists 0000–0005. The database appears to be ahead of the journal.

## 4. Implementation plan

### Phase A — Repair migration history (blocker)

Goal: after this phase, `drizzle-kit` knows exactly which migrations exist and which are applied, so the new migration is generated from the right baseline.

1. **Confirm 0007–0010 on every environment** (local, Neon production, Neon preview):
   ```sql
   SELECT
     (SELECT count(*) FROM information_schema.columns
       WHERE table_name = 'customer_musics' AND column_name = 'genres')                       AS has_genres,
     (SELECT count(*) FROM information_schema.columns
       WHERE table_name = 'music_catalog'
         AND column_name IN ('canonical_lyrics','canonical_chords','is_custom'))              AS has_canonical_and_custom,
     (SELECT count(*) FROM information_schema.columns
       WHERE table_name = 'setlist_items')                                                    AS has_setlist_items;
   ```
   Expected: `has_genres` = 1, `has_canonical_and_custom` = 3, `has_setlist_items` = 1.
   If anything is missing, apply the matching file (0007–0010) by hand in order, then re-check.

2. **Record the applied state.** Check whether `drizzle.__drizzle_migrations` exists and what it contains:
   ```sql
   SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at;
   ```
   If it only has 6 rows (0000–0005), 0006–0011 were applied by hand.

3. **Repair the journal and snapshot** in a branch:
   - Add entries for 0006–0011 to `drizzle/meta/_journal.json`.
   - Create `drizzle/meta/0011_snapshot.json` that matches the current `db/schema` (the state the database is in). Use drizzle-kit's custom-migration option so no SQL is generated for the baseline. Verify the exact flags for the installed drizzle-kit version on a copy first.
   - Insert the 0006–0011 hashes into `drizzle.__drizzle_migrations` **only on databases where those migrations were applied by hand**, so the migrator does not try to run them again. Do this per environment and record which ones were done.
   - Run `drizzle-kit generate` on a clean branch. It must produce **no changes** before Phase B starts.

Do not start Phase B until generate produces an empty diff.

### Phase B — Migration `0012_setlist_music`

Preconditions (run on a copy of production first; each query should return zero rows):

```sql
-- Duplicate titles/artists per customer once lower() is applied
SELECT cm.customer_id, lower(mc.title), lower(mc.artist), count(*)
FROM customer_musics cm JOIN music_catalog mc ON mc.id = cm.music_catalog_id
GROUP BY 1, 2, 3 HAVING count(*) > 1;

-- Setlist rows whose music is missing
SELECT si.id FROM setlist_items si
LEFT JOIN customer_musics cm ON cm.id = si.music_id WHERE cm.id IS NULL;
```

If the first query returns rows, merge those library entries manually before running the migration.

Steps (single migration file; wrap in a transaction if the runner does not):

1. **Backup**
   ```sql
   CREATE TABLE setlist_items_backup AS SELECT * FROM setlist_items;
   CREATE TABLE customer_musics_backup AS SELECT * FROM customer_musics;
   ```

2. **Make `customer_musics` self-contained**
   ```sql
   ALTER TABLE customer_musics ADD COLUMN title text, ADD COLUMN artist text;

   UPDATE customer_musics cm
   SET title = mc.title,
       artist = mc.artist,
       lyrics = COALESCE(cm.lyrics, mc.canonical_lyrics),
       chords = COALESCE(cm.chords, mc.canonical_chords)
   FROM music_catalog mc
   WHERE mc.id = cm.music_catalog_id;

   ALTER TABLE customer_musics ALTER COLUMN title SET NOT NULL,
                               ALTER COLUMN artist SET NOT NULL;
   ```
   The displayed lyrics and chords stay the same as before.

3. **Create `setlist_music`**
   ```sql
   CREATE TABLE setlist_music (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     concert_id uuid NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
     source_customer_music_id uuid REFERENCES customer_musics(id) ON DELETE SET NULL,
     position integer NOT NULL,
     note text,
     title text NOT NULL,
     artist text NOT NULL,
     lyrics text,
     chords text,
     original_key musical_key,
     preferred_key musical_key,
     studying boolean NOT NULL DEFAULT false,
     genre music_genre,
     genres text[],
     spotify_link text,
     sheet_music_file text,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   );
   CREATE INDEX setlist_music_concert_position_idx ON setlist_music (concert_id, position);
   ```

4. **Backfill from `setlist_items`, keeping ids**
   ```sql
   INSERT INTO setlist_music (
     id, concert_id, source_customer_music_id, position, note,
     title, artist, lyrics, chords, original_key, preferred_key, studying,
     genre, genres, spotify_link, sheet_music_file, created_at
   )
   SELECT
     si.id, si.concert_id, cm.id, si.position, si.note,
     cm.title, cm.artist, cm.lyrics, cm.chords, cm.original_key, cm.preferred_key,
     cm.studying, cm.genre, cm.genres, cm.spotify_link, cm.sheet_music_file, si.created_at
   FROM setlist_items si
   JOIN customer_musics cm ON cm.id = si.music_id;
   ```

5. **Verify (fail the migration if not met)**
   ```sql
   DO $$
   BEGIN
     IF (SELECT count(*) FROM setlist_items) <> (SELECT count(*) FROM setlist_music) THEN
       RAISE EXCEPTION 'setlist row count mismatch';
     END IF;
     IF EXISTS (SELECT 1 FROM setlist_items si
                LEFT JOIN setlist_music sm ON sm.id = si.id
                WHERE sm.id IS NULL) THEN
       RAISE EXCEPTION 'unmapped setlist rows';
     END IF;
   END $$;
   ```
   Also compare per-concert counts before and after.

6. **Remove the catalog link**
   ```sql
   CREATE UNIQUE INDEX customer_musics_customer_title_artist_unique
     ON customer_musics (customer_id, lower(title), lower(artist));
   ALTER TABLE customer_musics DROP CONSTRAINT customer_musics_customer_catalog_unique;
   ALTER TABLE customer_musics DROP CONSTRAINT customer_musics_music_catalog_id_music_catalog_id_fk;
   ALTER TABLE customer_musics DROP COLUMN music_catalog_id;
   DROP TABLE music_catalog;
   ```
   Confirm constraint names against the real database before running.

7. **Drop the old join table**
   ```sql
   DROP TABLE setlist_items;
   ```

Notes:
- The migration never deletes PDF files; it only copies the URL strings.
- Keep both backup tables (D7).

### Rollback
- Before deploy: drop `setlist_music` and restore from backups if steps 2 or 6 ran.
- After deploy: restore from `*_backup` tables and redeploy the previous build. The backups must exist before the migration runs.

## 5. Code changes

### 5.1 Already done (uncommitted)
- Removed `searchCatalog` from `features/music/services/music-catalog-service.ts`.
- Deleted `features/music/actions/music-catalog-actions.ts` (`searchCatalogAction`; no UI used it).
- `npx tsc --noEmit` passes after these two changes.

### 5.2 Remaining changes

| Area | File(s) | Change |
|---|---|---|
| Schema | `db/schema/setlist-music.ts` (new) | Table definition as in Phase B step 3 |
| Schema | `db/schema/customer-musics.ts` | Add `title`, `artist`; remove `musicCatalogId`; expression unique index; remove `musicCatalog` import |
| Schema | `db/schema/index.ts` | Export `setlist-music`; remove `setlist-items` and `music-catalog` |
| Schema | `db/schema/setlist-items.ts`, `db/schema/music-catalog.ts` | Delete after migration |
| Music service | `features/music/services/music-catalog-service.ts` | Remove `findOrCreateCatalogEntry` (its logic moves into `createMusic`, which checks duplicates on `customer_musics`). The file can then be deleted. |
| Music service | `features/music/services/music-service.ts` | `createMusic`: insert title/artist directly; duplicate check on `(customer_id, lower(title), lower(artist))`. `getMusicById`, `listMusics`, `updateMusic`: read from `customer_musics` only. `listMusics` search: `title`/`artist` on `customer_musics`. Remove `mergeRow` and the `musicCatalog` join. |
| Music types | `features/music/types/index.ts` | Remove `MusicCatalogEntry`, `MusicCatalogFull`; `Music` gets `title`/`artist` from its own row; `musicCatalogId` removed. |
| Music schemas | `features/music/schemas/music-schema.ts` | Remove `musicCatalogId`; keep title/artist as input fields. |
| Music actions | `features/music/actions/music-actions.ts` | Adjust to the new input and return shapes. |
| Music UI | `features/music/components/music-form.tsx`, `music-list.tsx`, `music-detail.tsx`, `music-view.tsx` | Read `title`/`artist` from the record; remove catalog-specific fields. |
| Concert service | `features/concert/services/concert-service.ts` | Remove `musicCatalog` import (L7). `addMusicsToSetlist`: copy from `customer_musics` into `setlist_music` (`source_customer_music_id` set, next position). `removeSetlistItem`, `reorderSetlist`: on `setlist_music`. `getConcertById` (~L280–370): read `setlist_music` only. `duplicateConcert` (~L440): copy `setlist_music` rows with new ids, keep `source_customer_music_id`. Public share query (~L710–760): read `setlist_music` only. |
| Concert UI | `add-to-setlist-modal.tsx`, `concert-live-setlist.tsx`, `concert-presentation-mode.tsx`, `public-shared-setlist-view.tsx`, `concert-detail.tsx`, `share-setlist-modal.tsx`, `select-concert-modal.tsx` | Use the new item shape. `setlistItem.id` is now the `setlist_music` id. |
| Project service | `features/project/services/project-service.ts` (L6 import) | Remove `musicCatalog` usage; `project_musics` still references `customer_musics`. |
| Deletion | `features/music/services/music-service.ts` (`deleteMusic`) | Confirm whether it removes the PDF file. If so, do not delete a file still referenced by a `setlist_music` row. |
| Docs | `docs/technical-design.md` | Update the domain model (catalog removed, `setlist_music` added). |

Not in this release: a "reset to original" action for setlist songs (`source_customer_music_id` keeps the option open).

## 6. Verification

Run on a copy of production data before release:

- [ ] Phase A: generate produces no diff; `drizzle.__drizzle_migrations` matches the files.
- [ ] Migration completes; `setlist_items` and `setlist_music` row counts match.
- [ ] Each concert has the same songs, order and notes as before (diff a JSON export before/after for a sample).
- [ ] Each song shows the same lyrics, chords and keys as before.
- [ ] Editing a library song does **not** change an existing concert's copy.
- [ ] Adding a song to a concert copies the library values; reorder and remove work.
- [ ] Duplicating a concert creates an independent setlist with the same content.
- [ ] Deleting a library song leaves concert copies intact (`source_customer_music_id` becomes null).
- [ ] PDF links open in the concert view and on the public share page.
- [ ] Public share page shows the setlist and hides fee and contractor data.
- [ ] Music library list, search and filters work without `music_catalog`.
- [ ] Creating a song with a duplicate title/artist shows the existing error message.
- [ ] `npm run lint`, `npx tsc --noEmit` and `npm run build` pass.

## 7. Rollout

1. Phase A on a branch; verify on a preview database.
2. Full backup of production (Neon branch or `pg_dump`).
3. Merge code and migration together. The old build cannot run against the new schema, so deploy them in one step (short maintenance window if needed).
4. Run the verification queries on production.
5. Release note: "Changes to a song in your library no longer change concerts that already include it. Each concert keeps the version it was built with."
6. Watch error logs for 1–2 days. In the next release, drop `setlist_items_backup` and `customer_musics_backup`.

## 8. Future: sharing and import (not in this release)

- The public share DTO is built only from `setlist_music`, so it is already self-contained.
- Import: for each `setlist_music` row, find the receiver's `customer_musics` row by `lower(title)` + `lower(artist)`, or create it from the snapshot; then add the song to the receiver's concert.
- `concerts.original_concert_id` (sharing plan) records the origin of a copied show.
- Workspace (phase 2 of the sharing plan): add `concert_collaborators`; access checks move into `assertCanEditConcert`. `setlist_music` needs no change.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Journal and database out of sync | Phase A before anything else |
| Case-insensitive duplicates block the unique index | Precheck query; manual merge |
| Old build running against the new schema | Deploy code and migration together |
| Users surprised by the behaviour change | Release note (§7) |
| PDF files orphaned or deleted | Migration never touches files; check `deleteMusic` (§5.2) |
| Environments differ (some migrations applied by hand) | Per-environment check in Phase A |
