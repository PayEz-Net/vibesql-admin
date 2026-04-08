export interface SyncStatus {
  status: string;
  [key: string]: unknown;
}

export interface AuditTrailResult {
  entries: unknown[];
  [key: string]: unknown;
}

export interface AuditVerifyResult {
  valid: boolean;
  [key: string]: unknown;
}

export interface PublicationsResult {
  publications: unknown[];
  [key: string]: unknown;
}

export interface ScopeReportResult {
  [key: string]: unknown;
}

export class SyncService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  static create(baseUrl: string): SyncService {
    return new SyncService(baseUrl);
  }

  async status(): Promise<SyncStatus> {
    const res = await fetch(`${this.baseUrl}/v1/status`);
    if (!res.ok) {
      throw new Error(`SyncService.status failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<SyncStatus>;
  }

  async auditTrail(limit?: number, after?: string): Promise<AuditTrailResult> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set('limit', String(limit));
    if (after !== undefined) params.set('after', after);
    const qs = params.toString();
    const url = `${this.baseUrl}/v1/audit${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`SyncService.auditTrail failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<AuditTrailResult>;
  }

  async auditVerify(): Promise<AuditVerifyResult> {
    const res = await fetch(`${this.baseUrl}/v1/audit/verify`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`SyncService.auditVerify failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<AuditVerifyResult>;
  }

  async publications(): Promise<PublicationsResult> {
    const res = await fetch(`${this.baseUrl}/v1/publications`);
    if (!res.ok) {
      throw new Error(`SyncService.publications failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<PublicationsResult>;
  }

  async scopeReport(): Promise<ScopeReportResult> {
    const res = await fetch(`${this.baseUrl}/v1/scope-report`);
    if (!res.ok) {
      throw new Error(`SyncService.scopeReport failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<ScopeReportResult>;
  }
}
