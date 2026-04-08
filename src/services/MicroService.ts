export interface HealthResult {
  status: string;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  time: number;
}

const TABLE_NAME_RE = /^[A-Za-z0-9_]+$/;

export class MicroService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  static create(baseUrl: string): MicroService {
    return new MicroService(baseUrl);
  }

  async health(): Promise<HealthResult> {
    const res = await fetch(`${this.baseUrl}/v1/health`);
    if (!res.ok) {
      throw new Error(`MicroService.health failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<HealthResult>;
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    const res = await fetch(`${this.baseUrl}/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`MicroService.query failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`);
    }
    return res.json() as Promise<QueryResult>;
  }

  async listTables(): Promise<QueryResult> {
    return this.query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
  }

  async describeTable(table: string): Promise<QueryResult> {
    if (!TABLE_NAME_RE.test(table)) {
      throw new Error(
        `MicroService.describeTable: invalid table name "${table}" — only alphanumeric characters and underscores are allowed`
      );
    }
    return this.query(`PRAGMA table_info('${table}')`);
  }
}
