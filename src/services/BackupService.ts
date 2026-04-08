export interface BackupEntry {
  id: string;
  [key: string]: unknown;
}

export interface BackupListResult {
  backups: BackupEntry[];
  [key: string]: unknown;
}

export interface BackupStatus {
  status: string;
  [key: string]: unknown;
}

export interface BackupManifest {
  backupId: string;
  segments?: unknown[];
  [key: string]: unknown;
}

export interface BackupVerifyResult {
  valid: boolean;
  [key: string]: unknown;
}

export class BackupService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  static create(baseUrl: string): BackupService {
    return new BackupService(baseUrl);
  }

  async list(): Promise<BackupListResult> {
    const res = await fetch(`${this.baseUrl}/v1/backups`);
    if (!res.ok) {
      throw new Error(`BackupService.list failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<BackupListResult>;
  }

  async status(): Promise<BackupStatus> {
    const res = await fetch(`${this.baseUrl}/v1/status`);
    if (!res.ok) {
      throw new Error(`BackupService.status failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<BackupStatus>;
  }

  async manifest(backupId: string): Promise<BackupManifest> {
    const res = await fetch(`${this.baseUrl}/v1/backups/${encodeURIComponent(backupId)}/manifest`);
    if (!res.ok) {
      throw new Error(`BackupService.manifest failed for "${backupId}": ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<BackupManifest>;
  }

  async verify(backupId: string): Promise<BackupVerifyResult> {
    const res = await fetch(`${this.baseUrl}/v1/backups/${encodeURIComponent(backupId)}/verify`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`BackupService.verify failed for "${backupId}": ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<BackupVerifyResult>;
  }
}
