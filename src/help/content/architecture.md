# Architecture

This page describes the cross-cutting patterns shared across the VibeSQL product family.

## Envelope Encryption Pattern

vsql-vault, vsql-backup, and vsql-sync all use **envelope encryption**. The pattern separates the key that encrypts data (DEK) from the key that protects the DEK (KEK).

```
plaintext
   │
   ▼  AES-256-GCM (DEK)
ciphertext  ──▶  stored

DEK  ──▶  RSA wrap (KEK)  ──▶  wrapped DEK stored alongside ciphertext
```

**Why envelope encryption?**
- The DEK can be rotated or revoked by replacing only the wrapped DEK — no re-encryption of data required.
- The KEK never touches the data storage layer; it lives in CryptAply.
- Compromising one DEK affects only the data it encrypted, not the KEK or other DEKs.

| Product | DEK scope | KEK source |
|---------|-----------|------------|
| vsql-vault | Per blob | CryptAply (RSA) |
| vsql-backup | Per backup set | CryptAply (RSA) |
| vsql-sync | Per session/batch | CryptAply (RSA) |

## Hash Chains

vsql-sync uses a **hash chain** to guarantee audit trail integrity. Each audit entry includes the hash of the previous entry:

```
entry[0]: hash = SHA-256(entry[0].data)
entry[1]: previousHash = entry[0].hash,  hash = SHA-256(entry[1].data + entry[0].hash)
entry[2]: previousHash = entry[1].hash,  hash = SHA-256(entry[2].data + entry[1].hash)
```

Any modification to a historical entry breaks the chain from that point forward, making tampering immediately detectable during verification.

## Merkle Trees (Backup Manifest Verification)

vsql-backup organizes its SHA-256 segment hashes into a **Merkle tree**. Each leaf is the hash of one backup segment. Parent nodes are hashes of their children.

```
        root hash
       /          \
  hash(A+B)    hash(C+D)
   /    \       /    \
 h(A)  h(B)  h(C)  h(D)
  A     B     C     D     ← backup segments
```

The root hash represents the entire backup set. To verify any single segment, you only need the segment's sibling hashes along the path to the root — you do not need to re-download all segments. This enables efficient partial verification.

## Ed25519 Signing (Sync Audit Entries)

vsql-sync signs each audit trail entry with an **Ed25519** private key held by CryptAply. Ed25519 is a deterministic elliptic-curve signature scheme:

- **64-byte signatures** — compact, low overhead per entry
- **Fast verification** — suitable for high-throughput audit streams
- **No key material on sync nodes** — signing requests go to CryptAply

Any party with the public key can verify that an audit entry was produced by the authorized signing key, without being able to create new entries.

## Dev vs Prod Mode

| Feature | Dev mode | Prod mode |
|---------|----------|-----------|
| TLS | Optional (HTTP allowed) | Required (HTTPS only) |
| KEK source | Local key file | CryptAply (remote) |
| Audit trail signing | Disabled or local key | Ed25519 via CryptAply |
| Access log retention | Short (debugging) | Configured per policy |
| PITR window | Hours | Days to weeks |

In dev mode, CryptAply integration can be replaced with local key files to simplify local development. Prod mode requires live CryptAply for all key operations.

## How All Products Connect

```
vibesql-micro (SQLite HTTP server)
      │  query
      ▼
  application layer
      │  store blobs          │  replicate changes
      ▼                       ▼
  vsql-vault             vsql-sync
      │  backup               │  audit signing
      ▼                       │
  vsql-backup                 │
      │                       │
      └──────────────────────▶│
                         CryptAply
                    (KEK management, key lifecycle,
                     directive enforcement, compliance)
```

CryptAply is the trust anchor. All encrypted services depend on it for KEK operations. Removing or revoking a KEK via CryptAply immediately prevents new decryptions across all dependent services.
