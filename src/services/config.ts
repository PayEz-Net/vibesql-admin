export interface AdminConfig {
  microUrl: string;
  vaultUrl: string;
  backupUrl: string;
  syncUrl: string;
  adminPort: number;
}

export function loadConfig(): AdminConfig {
  return {
    microUrl: process.env.VIBESQL_MICRO_URL || 'http://localhost:5173',
    vaultUrl: process.env.VSQL_VAULT_URL || 'http://localhost:8443',
    backupUrl: process.env.VSQL_BACKUP_URL || 'http://localhost:8445',
    syncUrl: process.env.VSQL_SYNC_URL || 'http://localhost:8444',
    adminPort: parseInt(process.env.VIBESQL_ADMIN_PORT || '5174', 10),
  };
}
