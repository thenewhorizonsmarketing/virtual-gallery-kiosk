# Virtual Gallery Kiosk Executive Summary

## Vision & Goals
Create a fully offline, tamper-resistant Windows 10 kiosk that immerses visitors in a 3D rotunda. Alumni, faculty, publications, and archival assets are discoverable through a touch-first interface backed by a signed, structured content pack. Annual updates arrive via USB, are validated locally, and activate with rollback safeguards—no internet connectivity is ever required.

## Core Personas & Journeys
- **Visitor:** Enter the rotunda, tap doorways (Alumni, Faculty, Publications, Archives), browse by year/role, open detailed person views with photos and metadata, and launch HTML5 flipbooks for publications or archives.
- **Staff (Admin PIN):** Unlock an Admin Panel to import a content pack, rebuild SQLite indices and image derivatives, run integrity checks, tune kiosk settings (idle timeout, GPU fallback), and monitor device health metrics (disk, DB size, logs).
- **IT:** Deploy and lock the kiosk using Assigned Access/Shell Launcher, manage code-signed installers and content packs, verify cryptographic signatures, enforce allowlists, and export logs while maintaining an air-gapped environment.

## Offline Constraints & Experience Targets
- Operates 100% offline: bundled fonts, JS libraries, Three.js assets, and flipbook engine; no remote calls or CDNs.
- Performance: cold boot under 8 seconds; Three.js rotunda at 60 FPS on target hardware; SQLite FTS5 search responses under 200 ms.
- Touch UX: ≥48 px hit targets, kiosk-friendly keyboard, kinetic scrolling, idle attract-mode, accessibility toggles, captions when provided.

## Single Source of Truth (SSOT)
- **Content Packs:** Signed zip bundles containing `manifest.json`, CSV/Parquet tables, media assets, and checksums (Ed25519 signature). Content version drives DB migrations.
- **SQLite Runtime Store:** Canonical schema for people, cohorts, person_cohort links, photos, publications, archive items, and metadata. Photos deduplicated by SHA-256 hash with derivatives stored under `/content/derivatives`.
- **Importer Workflow:** Validates schemas, verifies signatures, copies assets, generates thumbnails/derivatives, updates SQLite in WAL mode, rebuilds FTS indices, and stages activation with rollback capability.

## Application Architecture
- **Electron Shell:** Hosts the kiosk with React + Three.js renderer, including 3D rotunda, fallback 2D navigation, and flipbook viewer modal (local engine such as StPageFlip/turn.js).
- **Local Services:** Typed DAOs for SQLite access, audit logging, health telemetry, and Node tooling for migrations and derivative generation.
- **Tooling Suite:** Importer CLI (`import-pack`, `activate-staged`, `rollback`, `gen-derivatives`, `check-integrity`, `reindex-fts`) and pack builder/signing utilities.

## Security & Hardening
- Windows 10 Assigned Access/Shell Launcher, AppLocker or WDAC allowlisting, outbound network blocked, optional Wi-Fi disablement.
- Code signing for Electron app and tooling; strict WebView confinement (no external protocols); admin PIN required for sensitive actions.
- USB policy: read-only media for content import, no autoplay; logs rotate locally and export via PIN-guarded workflow.

## Update Workflow
1. Author CSVs/media in the content repository.
2. Build a signed content pack with hashes and manifest.
3. IT stages pack on approved USB and performs offline validation.
4. Admin imports pack via kiosk UI → signature & schema verification → DB migration → integrity checks.
5. Activate staged database atomically; rollback restores prior snapshot if any check fails.

## Roadmap Phases
- **Phase A – Foundations:** Project scaffolding, SQLite schema/migrations, FTS5 seeding, importer CLI.
- **Phase B – SSOT & Packs:** Manifest schema, pack builder/signing, staging/rollback pipeline, integrity checks.
- **Phase C – UI:** Three.js rotunda, alumni/faculty/publication/archive flows, instant search, performance profiling, 2D fallback.
- **Phase D – Admin & Ops:** PIN gate, import UI with progress/logs, health dashboard, log export.
- **Phase E – Hardening & Deploy:** MSIX/Squirrel installer, kiosk watchdog, Assigned Access/AppLocker scripts.
- **Phase F – QA & UAT:** Synthetic dataset, soak tests, power-loss simulations, accessibility/touch QA.

## Acceptance Criteria & Success Metrics
- Kiosk boots locked down, resists tampering, and remains fully functional offline.
- Content imports require valid signatures, pass integrity checks, and support rollback without data loss.
- Browsing, search, flipbooks, and media playback are smooth; performance targets sustained during extended demos.
- Admin workflows (import, diagnostics, log export) operate without network access; power interruptions do not corrupt the active database.

## Data & Media Highlights
- Cohorts cover 1980–2025 (extendable) with class president filters; person_fts virtual table enables instant search.
- Media pipeline stores originals by SHA-256 under `/content/assets/img/<hash>.<ext>` and generates derivatives (`thumb`, `screen`, `tile`); EXIF stripped and metadata captured in DB.
- Flipbooks ship as self-contained folders (`/assets/flipbooks/<id>/index.html`) rendered in an embedded WebView with no external URLs.

## Deployment & Operations Snapshot
- Offline installer (MSIX preferred) with code signing; updates delivered annually via content packs or installer refresh.
- Watchdog restarts kiosk on crashes; crash logs stored locally with rotation policies.
- Laminated runbook: boot into kiosk, authenticate via admin PIN, import signed pack, verify integrity, activate, rollback if needed, export logs for IT review.
