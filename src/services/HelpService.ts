export interface HelpTopic {
  id: string;
  title: string;
  description: string;
}

export interface HelpTopicWithContent extends HelpTopic {
  content: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  excerpt: string;
}

interface ContentEntry {
  title: string;
  description: string;
  content: string;
}

function loadContent(): Record<string, ContentEntry> {
  return {
    products: {
      title: 'VibeSQL Product Family',
      description:
        'Overview of the seven VibeSQL products delivering a compliant, governed, globally synchronized database ecosystem.',
      content:
        'VibeSQL is a family of seven products: vibesql-micro (SQLite over HTTP), vsql-vault (encrypted blob storage), ' +
        'vsql-backup (Rust + pgBackRest governed backup), vsql-sync (PCI-scoped replication), vsql-cryptaply (key governance), ' +
        'vibesql-admin (unified hub + MCP server), and vibesql core. Full content is in src/help/content/products.md.',
    },
    'vibesql-micro': {
      title: 'vibesql-micro — SQLite over HTTP',
      description:
        'Lightweight SQLite-over-HTTP database server that ships as a single binary. Exposes POST /v1/query for SQL execution and GET /v1/health for service checks.',
      content:
        'vibesql-micro is a lightweight SQLite-over-HTTP database server designed for edge deployments and local-first applications. ' +
        'It ships as a single binary with zero configuration required. ' +
        'Full content is in src/help/content/vibesql-micro.md.',
    },
    'vsql-vault': {
      title: 'vsql-vault — Encrypted Blob Storage',
      description:
        'Encrypted blob storage using AES-256-GCM at rest with RSA key wrapping. Includes access logging, configurable retention policies, and a health endpoint.',
      content:
        'vsql-vault provides encrypted blob storage with envelope encryption — all data is encrypted at rest using AES-256-GCM, ' +
        'and RSA key wrapping protects the data encryption keys. ' +
        'Full content is in src/help/content/vsql-vault.md.',
    },
    'vsql-backup': {
      title: 'vsql-backup — Governed Backup (Rust + pgBackRest)',
      description:
        'Rust binary wrapping pgBackRest as the backup engine. Adds envelope encryption with KMS, restore authorization gates, compliance audit reports, and WAL retention lock management.',
      content:
        'vsql-backup is a Rust binary wrapping pgBackRest (MIT, C) as the backup engine. It adds the governance layer nobody else has: ' +
        'envelope encryption with KMS, restore authorization gates, compliance audit reports, and WAL retention lock management. ' +
        'Full content is in src/help/content/backup.md.',
    },
    'vsql-sync': {
      title: 'vsql-sync — The Governed Data Movement Layer',
      description:
        'The only PostgreSQL replication where the wire is out of PCI scope. Payload encryption, CRDT conflict resolution, Ed25519-signed audit trail, and publication-based column exclusion for scope reduction.',
      content:
        'vsql-sync solves an unsolved problem in the PostgreSQL ecosystem: native replication traffic is unencrypted in transit, ' +
        'putting every downstream node in PCI scope. vsql-sync encrypts replication payloads so the wire is out of scope. ' +
        'Full content is in src/help/content/sync.md.',
    },
    cryptaply: {
      title: 'CryptAply — Key Governance',
      description:
        'Key governance and compliance engine that enforces directive-based policies over encryption keys used by vault, backup, and sync. Manages key lifecycle and provides PCI DSS compliance reporting.',
      content:
        'CryptAply is the key governance and compliance engine that acts as the trust anchor for the VibeSQL encrypted product family. ' +
        'It enforces directive-based policies, manages the full key lifecycle (creation, rotation, expiry, revocation), and provides compliance reporting. ' +
        'Full content is in src/help/content/cryptaply.md.',
    },
    'admin-ui': {
      title: 'vibesql-admin UI',
      description:
        'Web-based administration interface for the VibeSQL product family. Provides dashboards for database queries, vault blobs, backup management, sync status, and MCP tool access.',
      content:
        'vibesql-admin is the web-based administration interface for the VibeSQL product family. ' +
        'It connects to vibesql-micro, vsql-vault, vsql-backup, and vsql-sync to provide unified monitoring and management. ' +
        'Full content is in src/help/content/admin-ui.md.',
    },
    mcp: {
      title: 'MCP Server Integration',
      description:
        'Model Context Protocol server built into vibesql-admin. Exposes VibeSQL operations as MCP tools so AI assistants can query databases, inspect backups, and read audit trails.',
      content:
        'The vibesql-admin MCP server exposes VibeSQL operations as Model Context Protocol tools, allowing AI assistants to interact ' +
        'with databases, vault blobs, backup manifests, and sync audit trails. ' +
        'Full content is in src/help/content/mcp.md.',
    },
  };
}

function extractExcerpt(content: string, query: string, maxLength = 150): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) {
    return content.slice(0, maxLength) + (content.length > maxLength ? '…' : '');
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 110);
  const excerpt = content.slice(start, end);
  return (start > 0 ? '…' : '') + excerpt + (end < content.length ? '…' : '');
}

export class HelpService {
  // baseUrl is accepted for interface consistency but unused — content is inlined.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_baseUrl: string) {}

  static create(baseUrl: string): HelpService {
    return new HelpService(baseUrl);
  }

  listTopics(): HelpTopic[] {
    const content = loadContent();
    return Object.entries(content).map(([id, entry]) => ({
      id,
      title: entry.title,
      description: entry.description,
    }));
  }

  getTopic(id: string): HelpTopicWithContent {
    const content = loadContent();
    const entry = content[id];
    if (!entry) {
      throw new Error(`HelpService.getTopic: unknown topic "${id}"`);
    }
    return {
      id,
      title: entry.title,
      description: entry.description,
      content: entry.content,
    };
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) return [];
    const content = loadContent();
    const lower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const [id, entry] of Object.entries(content)) {
      const titleMatch = entry.title.toLowerCase().includes(lower);
      const descMatch = entry.description.toLowerCase().includes(lower);
      const contentMatch = entry.content.toLowerCase().includes(lower);

      if (titleMatch || descMatch || contentMatch) {
        const searchableText = `${entry.title} ${entry.description} ${entry.content}`;
        results.push({
          id,
          title: entry.title,
          description: entry.description,
          excerpt: extractExcerpt(searchableText, query),
        });
      }
    }

    return results;
  }
}
