export interface VaultHealth {
  status: string;
  [key: string]: unknown;
}

export interface BlobListResult {
  blobs: unknown[];
  total?: number;
  [key: string]: unknown;
}

export interface AccessLogResult {
  entries: unknown[];
  [key: string]: unknown;
}

export interface RetentionPoliciesResult {
  policies: unknown[];
  [key: string]: unknown;
}

export class VaultService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  static create(baseUrl: string): VaultService {
    return new VaultService(baseUrl);
  }

  async status(): Promise<VaultHealth> {
    const res = await fetch(`${this.baseUrl}/v1/health`);
    if (!res.ok) {
      throw new Error(`VaultService.status failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<VaultHealth>;
  }

  async list(limit?: number, offset?: number): Promise<BlobListResult> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set('limit', String(limit));
    if (offset !== undefined) params.set('offset', String(offset));
    const qs = params.toString();
    const url = `${this.baseUrl}/v1/blobs${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`VaultService.list failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<BlobListResult>;
  }

  async accessLog(limit?: number): Promise<AccessLogResult> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set('limit', String(limit));
    const qs = params.toString();
    const url = `${this.baseUrl}/v1/access-log${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`VaultService.accessLog failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<AccessLogResult>;
  }

  async retentionPolicies(): Promise<RetentionPoliciesResult> {
    const res = await fetch(`${this.baseUrl}/v1/retention-policies`);
    if (!res.ok) {
      throw new Error(`VaultService.retentionPolicies failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<RetentionPoliciesResult>;
  }
}
