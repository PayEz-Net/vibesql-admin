# vsql-vault

vsql-vault is an encrypted blob storage service. All data is encrypted at rest using envelope encryption. It runs on port **8443**.

## Envelope Encryption

vsql-vault uses a two-layer encryption scheme:

1. **DEK (Data Encryption Key)** — A unique AES-256-GCM key generated per blob. The DEK encrypts the actual data.
2. **KEK (Key Encryption Key)** — An RSA key managed by CryptAply. The KEK wraps (encrypts) the DEK.

Only the wrapped DEK is stored alongside the blob. The KEK never touches the storage layer.

```
plaintext blob
     │
     ▼  encrypt with DEK (AES-256-GCM)
ciphertext blob  ──▶  stored
     │
     DEK  ──▶  wrap with KEK (RSA)  ──▶  wrapped DEK stored
```

To read a blob: unwrap the DEK using the KEK, then decrypt the blob with the DEK.

## AES-256-GCM

AES-256-GCM provides both confidentiality (256-bit key) and integrity (GCM authentication tag). Any tampering with the ciphertext will cause decryption to fail.

## Blob Storage API

```
PUT    /v1/blobs/{id}        Store a blob
GET    /v1/blobs/{id}        Retrieve a blob
DELETE /v1/blobs/{id}        Delete a blob
GET    /v1/blobs             List blobs (with optional filters)
GET    /v1/health            Service health check
```

Blobs are addressed by a client-supplied or server-generated ID. Metadata (content type, size, timestamps) is stored alongside the encrypted payload.

## Access Logging

Every read, write, and delete operation is recorded in the access log:

- **Who** — authenticated principal or API key identity
- **What** — blob ID and operation type
- **When** — UTC timestamp

Access logs are immutable and append-only. They can be exported for audit or fed into a SIEM.

## Retention Policies

Retention policies define how long blobs are kept before automatic deletion.

```json
{
  "policy": "default",
  "retainDays": 90,
  "onExpiry": "delete"
}
```

Policies can be set globally or per blob. When a blob's retention period expires, vsql-vault deletes it and writes a deletion event to the access log.

## Health Endpoint

```
GET /v1/health
```

Returns HTTP 200 with a JSON body indicating service status, KEK availability, and storage backend connectivity. Use this for load balancer probes and monitoring.
