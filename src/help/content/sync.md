# vsql-sync

**The governed data movement layer.**

> "The only PostgreSQL replication where the wire is out of PCI scope."

vsql-sync solves an unsolved problem in the PostgreSQL ecosystem: native replication traffic is unencrypted in transit, which means any node touching that wire falls within PCI DSS scope. vsql-sync encrypts replication payloads with envelope encryption, so downstream replicas can operate entirely outside the Cardholder Data Environment (CDE).

It runs on port **8444**. Repository: [github.com/PayEz-Net/vibesql-sync](https://github.com/PayEz-Net/vibesql-sync)

## The Problem vsql-sync Solves

PostgreSQL's built-in streaming replication sends WAL data in cleartext. Even with SSL, the replicated content is visible to the receiving node. This means:

- Every replica that receives cardholder data is **in PCI scope**
- Reporting databases, analytics nodes, and read replicas all inherit CDE obligations
- The cost and complexity of PCI compliance scales with every node

vsql-sync encrypts the replication payload itself, so the wire — and every node on the other end of it — is out of scope.

## Multi-Node Replication

vsql-sync connects two or more database nodes into a replication topology. Changes propagate asynchronously between nodes via the sync protocol.

```
Node A  ◀──▶  vsql-sync  ◀──▶  Node B
                  │
               Node C
```

Nodes can go offline and reconnect; sync catches up on missed changes automatically.

## Payload Encryption

Data payloads in transit between nodes are encrypted using envelope encryption (DEK per session or per batch, KEK from CryptAply). Replication traffic cannot be read by intermediaries or by the receiving node's OS-level access.

## CRDT Conflict Resolution (Last-Writer-Wins)

When the same row is modified on two nodes before they sync, a conflict occurs. vsql-sync resolves conflicts using **CRDT LWW (Last-Writer-Wins) registers**:

- Every write is tagged with a logical timestamp (Hybrid Logical Clock).
- On conflict, the write with the higher timestamp wins.
- Losing writes are discarded, not merged.

LWW is deterministic and requires no coordination: every node independently arrives at the same resolved state.

```
Node A writes row 42 at T=100
Node B writes row 42 at T=105

Conflict resolved: Node B's write wins (T=105 > T=100)
```

## Ed25519-Signed Audit Trail

Every sync event (insert, update, delete, conflict resolution) is written to an append-only audit trail. Each entry is signed with an Ed25519 key managed by CryptAply.

Audit entries cannot be forged without access to the private signing key.

## Hash Chain Integrity

Audit entries are linked into a **hash chain**: each entry includes the SHA-256 hash of the previous entry.

```
entry[n].previousHash = SHA-256(entry[n-1])
```

Tampering with any historical entry invalidates all subsequent hashes, making retroactive modification detectable. The chain can be verified at any time.

## Publication-Based Selective Replication

A **publication** defines which tables and columns replicate to which nodes:

```yaml
publication:
  id: pub-payments
  tables:
    - name: transactions
      columns: [id, amount, status, created_at]
      # card_number excluded — stays out of CDE scope
  subscribers:
    - node-reporting
    - node-analytics
```

**Column exclusion** is the key to scope reduction: sensitive columns (e.g., raw card numbers) can be excluded from a publication so they never leave the CDE.

## PCI Scope Reduction

By combining payload encryption with column exclusion:
1. The replication wire itself is encrypted — out of scope
2. Sensitive columns never leave the CDE — subscribers are out of scope
3. Reporting and analytics nodes operate without PCI obligations

This is the gap in the PostgreSQL ecosystem that vsql-sync fills.

## API Endpoints

```
GET    /v1/nodes                  List connected nodes
GET    /v1/publications           List publications
PUT    /v1/publications/{id}      Create or update a publication
GET    /v1/audit                  Query the audit trail
POST   /v1/audit/verify           Verify hash chain integrity
GET    /v1/scope-report           Generate PCI scope reduction report
GET    /v1/health                 Service health check
```
