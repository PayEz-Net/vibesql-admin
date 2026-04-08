# Glossary

Reference definitions for terms used across VibeSQL documentation.

---

## AES-256-GCM

Advanced Encryption Standard with a 256-bit key in Galois/Counter Mode. Provides both confidentiality and authenticated integrity (the GCM authentication tag detects tampering). Used by vsql-vault, vsql-backup, and vsql-sync for data encryption.

## Blob

An opaque binary object stored in vsql-vault. A blob has an ID, metadata, and an encrypted payload. vsql-vault makes no assumptions about the content type.

## CDE (Cardholder Data Environment)

The systems and processes that store, process, or transmit cardholder data. PCI DSS controls apply to everything in scope of the CDE. vsql-sync's publication-based column exclusion can keep sensitive columns out of nodes that would otherwise expand CDE scope.

## CRDT (Conflict-free Replicated Data Type)

A data structure designed so that concurrent updates on different nodes can always be merged without coordination. vsql-sync uses CRDTs for conflict resolution. See also: LWW.

## DEK (Data Encryption Key)

The symmetric key that directly encrypts data. In VibeSQL products, a DEK is an AES-256-GCM key. DEKs are generated per blob (vault), per backup set (backup), or per session (sync). DEKs are always stored wrapped by a KEK — never in plaintext.

## Directive

A policy document in CryptAply that governs a key or key family. Directives specify algorithm, rotation schedule, allowed consumers, and expiry behavior. Directives are version-controlled and auditable.

## Ed25519

An elliptic-curve digital signature algorithm using Curve25519. Produces 64-byte signatures with fast verification. Used by vsql-sync to sign audit trail entries, with the private key held in CryptAply.

## Envelope Encryption

A two-layer encryption pattern: a DEK encrypts the data; a KEK encrypts (wraps) the DEK. Only the wrapped DEK is stored alongside the ciphertext. The KEK is managed separately (by CryptAply). Used by vsql-vault, vsql-backup, and vsql-sync.

## Hash Chain

A sequence of records where each record contains the hash of the previous record. Modification of any historical record invalidates all subsequent hashes, making tampering detectable. Used in vsql-sync's audit trail.

## KEK (Key Encryption Key)

The key that wraps (encrypts) a DEK. KEKs are managed by CryptAply and never exposed to the storage layer. In VibeSQL products, KEKs are RSA keys.

## LWW (Last Writer Wins)

A CRDT conflict resolution strategy in which, when two nodes have conflicting updates for the same record, the update with the higher logical timestamp is kept and the other is discarded. Used by vsql-sync. Deterministic and coordination-free.

## Merkle Tree

A binary tree of hashes where each leaf is the hash of a data block and each parent is the hash of its children. The root hash represents the entire dataset. Used by vsql-backup to organize segment hashes in the manifest, enabling efficient partial verification.

## PCI DSS

Payment Card Industry Data Security Standard. A set of security requirements for organizations that handle cardholder data. Relevant VibeSQL features: envelope encryption (Requirement 3), access logging and audit trails (Requirement 10), and publication-based column exclusion (scope reduction).

## PITR (Point-in-Time Recovery)

The ability to restore a database to any recorded moment in time, not just the most recent backup. vsql-backup supports PITR by chaining full backups with incrementals and verifying segment integrity before apply.

## Publication

A named configuration in vsql-sync that defines which tables and columns replicate to which subscriber nodes. Publications enable selective replication and column exclusion for PCI scope reduction.

## QSA (Qualified Security Assessor)

A company or individual certified by the PCI Security Standards Council to assess merchant and service provider compliance with PCI DSS. CryptAply's compliance reports are designed to support QSA review.

## Retention Policy

A vsql-vault configuration that specifies how long blobs are retained before automatic deletion. Policies can be set globally or per blob and trigger a deletion event in the access log on expiry.

## RSA

Rivest–Shamir–Adleman asymmetric encryption algorithm. Used in VibeSQL as the KEK algorithm for wrapping DEKs. The public key encrypts (wraps) the DEK; the private key in CryptAply decrypts (unwraps) it.

## SHA-256

Secure Hash Algorithm 2 with 256-bit output. Used for segment integrity hashes in vsql-backup manifests and for hash chain linking in vsql-sync audit trails.
