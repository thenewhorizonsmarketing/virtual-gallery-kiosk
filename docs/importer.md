# Offline Content Pack Tooling

The kiosk ships with a small Node-based toolkit that can run entirely offline on the Windows kiosk workstation. The tooling
implements the update workflow described in the executive summary: verify a signed content pack, stage it in SQLite, copy the
hashed asset store, generate derivatives, and then promote or roll back the data file.

## Directory layout

The CLI assumes the default content tree lives under `./content` (matching the runtime layout used by Electron):

```
content/
  db/
    app.db           # active database (WAL enabled)
    app.db.staging   # most recent staged import
    app.db.previous  # backup snapshot from last activation
  assets/
    img/
    flipbooks/
  derivatives/
    thumb/
    screen/
  logs/
```

Use the `--content-root` flag to point at another root when running on a different volume.

## Commands

Run the tool with `node tools/importer/index.js <command> [options]`.

| Command | Purpose |
| --- | --- |
| `import-pack <pack.zip>` | Extract, validate, and stage a content pack into `app.db.staging`, copying images, flipbooks, and writing an audit log. |
| `activate-staged` | Promote the staged database to active (`app.db`), snapshotting the current database to `app.db.previous`. |
| `rollback` | Restore the previous snapshot if an activation fails. |
| `gen-derivatives` | Create or refresh the thumbnail/screen image derivatives for every known photo. |
| `check-integrity` | Run consistency checks against the database and filesystem. |
| `reindex-fts` | Rebuild the `person_fts` FTS5 index. |

Every command accepts `--content-root <path>` to override the default tree. Additional command specific flags include:

- `import-pack`
  - `--verify` and `--public-key <path>` to require manifest signature validation (Ed25519 public key in PEM or base64 form).
  - `--skip-derivatives` to avoid running the derivative pass during import.
  - `--force` to force derivative regeneration.
- `check-integrity`
  - `--level strict` enables duplicate slug/hash detection.
  - `--staged` checks the staged database instead of the active database.
- `gen-derivatives`
  - `--force` regenerates derivatives even if files already exist.

## Import flow

1. Copy the signed content pack ZIP onto the kiosk and run:
   ```bash
   node tools/importer/index.js import-pack D:\\packs\\alumni-2025.zip --verify --public-key keys\\content-team.pub
   ```
2. Review the generated log file under `content/logs/` to confirm row counts and hashes.
3. Promote the staged database once validation passes:
   ```bash
   node tools/importer/index.js activate-staged
   ```
4. Run integrity checks in strict mode to confirm there are no missing assets:
   ```bash
   node tools/importer/index.js check-integrity --level strict
   ```
5. If anything fails after activation, revert instantly:
   ```bash
   node tools/importer/index.js rollback
   ```

The derivative generator will use ImageMagick (`magick` or `convert`) when available; otherwise it will fall back to copying the
source images into the derivative folders so the kiosk UI always has assets to load.

## Database schema

The importer initialises the SQLite database with the canonical tables described in the product specification. Every import wipes
and re-populates the tables inside a single transaction, then repopulates the `person_fts` virtual table. The schema lives in
`tools/importer/lib/sqlite.js`.

## Extending the toolchain

The CLI is intentionally modular. Each command lives in `tools/importer/commands/` and only relies on Node built-ins plus
`sqlite3` and `unzip` binaries that ship with Windows Subsystem for Linux or standard admin images. Add new commands or expand the
existing ones by composing helpers in `tools/importer/lib/`.
