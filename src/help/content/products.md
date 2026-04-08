# VibeSQL Product Family

VibeSQL is a family of seven products delivering a compliant, governed, globally synchronized database ecosystem. Each product can be used independently or together as an integrated stack.

## Products at a Glance

| Product | Role | Port |
|---------|------|------|
| vibesql-micro | SQLite-over-HTTP database server | 5173 |
| vsql-vault | Encrypted blob storage | 8443 |
| vsql-backup | Governed backup with pgBackRest engine | 8445 |
| vsql-sync | Governed data movement — PCI-scoped replication | 8444 |
| vsql-cryptaply | Key governance and compliance engine | — |
| vibesql-admin | Unified admin hub + MCP server | 5174 |
| vibesql (core) | Core database library | — |

---

## vibesql-micro

Lightweight SQLite-over-HTTP database server. Ships as a single binary with zero configuration required.

**Key endpoints:**

```
POST /v1/query    Execute SQL statements
GET  /v1/health   Service health check
```

Designed for edge deployments, local-first applications, and embedded use cases where a full RDBMS is unnecessary overhead.

---

## vsql-vault

Encrypted blob storage with envelope encryption. All data is encrypted at rest using AES-256-GCM. RSA key wrapping protects the data encryption keys.

Features: access logging (who accessed what, when), configurable retention policies (auto-delete after N days), and a health endpoint.

---

## vsql-backup

**Architecture:** Rust binary wrapping **pgBackRest** (MIT, C) as the backup engine. CryptAply provides key governance authority.

The governance layer that nobody else has: envelope encryption with KMS integration, restore authorization gates, compliance audit reports, and WAL retention lock management. pgBackRest handles the heavy lifting of streaming backup and PITR mechanics; vsql-backup adds the compliance and encryption wrapper.

Each backup receives its own Data Encryption Key (DEK), wrapped by a Key Encryption Key (KEK). A SHA-256 manifest provides integrity verification across all backup segments.

---

## vsql-sync

**The governed data movement layer.**

> "The only PostgreSQL replication where the wire is out of PCI scope."

vsql-sync solves an unsolved problem in the PostgreSQL ecosystem: native replication traffic is unencrypted in transit, which means any node touching that wire falls within PCI DSS scope. vsql-sync encrypts replication payloads with envelope encryption, so downstream replicas can operate entirely outside the Cardholder Data Environment (CDE).

Features: CRDT-based conflict resolution (Last-Writer-Wins registers), Ed25519-signed audit trail with hash chaining, publication-based selective replication with column exclusion for PCI scope reduction.

---

## vsql-cryptaply (CryptAply)

Key governance and compliance engine. CryptAply enforces directive-based policies over encryption keys used by vault, backup, and sync. Manages the full key lifecycle — creation, rotation, expiry, and revocation — and provides compliance reporting for PCI DSS and similar frameworks.

CryptAply is the trust anchor for the entire ecosystem.

---

## vibesql-admin

Unified administration hub for the entire product family. One web UI for humans, one MCP server for AI agents, one help system for everyone. Provides dashboards for database queries, vault management, backup monitoring, sync status, and help documentation.

---

## How the Products Work Together

```
vibesql-micro  ──▶  vsql-vault   ──▶  vsql-backup (Rust + pgBackRest)
                        │                  │
                    vsql-sync              │
                    (governed wire)         │
                        │                  │
                    CryptAply ◀────────────┘
                (KEK management, key lifecycle,
                 directive enforcement, compliance)
                        │
                  vibesql-admin
              (unified hub + MCP server)
```

CryptAply acts as the trust anchor for the encrypted products. vsql-vault stores blobs, vsql-backup protects them over time (with pgBackRest doing the engine work), and vsql-sync keeps multiple nodes consistent — all with the wire out of PCI scope.
