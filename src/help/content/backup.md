# vsql-backup

vsql-backup is a Rust binary that wraps **pgBackRest** (MIT, C) as the backup engine, adding a governance and encryption layer that no other PostgreSQL backup tool provides. It runs on port **8445**.

## Architecture

```
vsql-backup (Rust binary)
     │  governance layer
     │  ├── envelope encryption with KMS
     │  ├── restore authorization gates
     │  ├── compliance audit reports
     │  └── WAL retention lock management
     │
     ▼
pgBackRest (C, MIT)
     │  backup engine
     │  ├── streaming backup
     │  ├── incremental/differential
     │  ├── parallel compression
     │  └── PITR mechanics
     │
CryptAply ── KEK authority
```

pgBackRest handles the heavy lifting of streaming backup and point-in-time recovery mechanics. vsql-backup adds the compliance and encryption wrapper — the part nobody else has.

## What vsql-backup Adds

- **Envelope encryption with KMS** — Per-backup DEKs wrapped by KEKs from CryptAply
- **Restore authorization gates** — Policy-controlled restore access; not everyone who can back up can restore
- **Compliance audit reports** — Exportable backup history and key usage for QSA review
- **WAL retention lock management** — Governed retention windows ensuring PITR coverage

## Envelope Encryption

vsql-backup uses per-backup envelope encryption:

1. **DEK (Data Encryption Key)** — A unique AES-256-GCM key generated for each backup. The DEK encrypts all segments in that backup set.
2. **KEK (Key Encryption Key)** — Managed by CryptAply. The KEK wraps the DEK, and only the wrapped DEK is stored.

```
backup data stream
     │
     ▼  encrypt with DEK (AES-256-GCM, per-backup)
encrypted segments  ──▶  stored in backup storage
     │
     DEK  ──▶  wrap with KEK (from CryptAply)  ──▶  stored in manifest
```

Different backup sets use different DEKs, so compromising one backup's DEK does not affect any other backup set.

## SHA-256 Manifest

Every backup set includes a manifest file containing:

- SHA-256 hash of each segment
- Segment byte ranges (for partial restore)
- Backup timestamp and sequence number
- Wrapped DEK

The manifest is itself signed so that any tampering with segment hashes is detectable. Restore operations verify all hashes before applying data.

## Point-in-Time Recovery (PITR)

PITR allows restoring the database to any recorded point, not just the most recent backup.

```
full backup (T0)  ──▶  incremental (T1)  ──▶  incremental (T2)  ──▶  now
                                                        ▲
                                              restore to this point
```

To restore to time T:
1. Identify the most recent full backup before T.
2. Apply incrementals up to T.
3. All segments are verified against the manifest before apply.

## Backup Verification

Run verification without performing a restore:

```
POST /v1/backups/{id}/verify
```

vsql-backup re-downloads each segment, computes its SHA-256, and compares against the manifest. Returns a pass/fail report with per-segment detail.

## API Endpoints

```
POST   /v1/backups              Start a backup job
GET    /v1/backups              List backup sets
GET    /v1/backups/{id}         Backup set details and status
POST   /v1/backups/{id}/verify  Verify backup integrity
POST   /v1/restore              Initiate a restore
GET    /v1/health               Service health check
```
