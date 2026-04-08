# CryptAply

CryptAply is the key governance and compliance engine for the VibeSQL product family. It manages the encryption keys used by vsql-vault, vsql-backup, and vsql-sync, and enforces policy through a directive-based system.

## Directive-Based Key Governance

Directives are policy documents that define rules for how keys are created, used, rotated, and retired. Each directive targets a key or key family and specifies:

- **Algorithm** — e.g., AES-256-GCM, RSA-4096, Ed25519
- **Rotation schedule** — how frequently the key must be rotated
- **Allowed consumers** — which services may use the key
- **Expiry behavior** — what happens when a key expires (rotate, suspend, alert)

```yaml
directive:
  id: vault-kek-prod
  algorithm: RSA-4096
  rotationDays: 90
  consumers:
    - vsql-vault
  onExpiry: rotate
```

Directives are version-controlled. Changing a directive creates a new revision; the previous revision remains auditable.

## Key Lifecycle Management

CryptAply manages the full lifecycle of every key it governs:

| Phase | Description |
|-------|-------------|
| **Creation** | Key is generated and bound to a directive |
| **Active** | Key is available for encryption and decryption |
| **Rotation** | New key version created; old version enters grace period |
| **Grace** | Old key version decrypts only (no new encryptions) |
| **Expired** | Key version is retired; access requires explicit override |
| **Revoked** | Key version is immediately unavailable; emergency use only |

## Integration with vsql-vault, vsql-backup, and vsql-sync

CryptAply acts as a KEK provider for the encrypted VibeSQL products:

- **vsql-vault** — CryptAply supplies the RSA KEK used to wrap per-blob DEKs.
- **vsql-backup** — CryptAply supplies the KEK used to wrap per-backup DEKs.
- **vsql-sync** — CryptAply supplies the Ed25519 signing key for audit trail entries and the KEK for payload encryption.

None of these services store KEK material directly. They request key operations from CryptAply at runtime, keeping the KEK isolated in the governance layer.

## Compliance Enforcement

CryptAply generates compliance reports mapping key usage to regulatory controls:

- **PCI DSS** — Requirement 3 (protect stored data) and Requirement 10 (audit trails)
- Key age, rotation history, and access logs are exportable for QSA review

Directives can enforce minimum key strengths, mandatory rotation windows, and separation of duties between key administrators and key consumers.

## Admin API

```
GET    /v1/keys              List governed keys
GET    /v1/keys/{id}         Key details and status
POST   /v1/keys/{id}/rotate  Trigger manual rotation
GET    /v1/directives        List directives
PUT    /v1/directives/{id}   Create or update a directive
GET    /v1/compliance/report Generate compliance summary
```
