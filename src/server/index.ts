import express from 'express';
import { loadConfig } from '../services/config.js';
import { MicroService } from '../services/MicroService.js';
import { VaultService } from '../services/VaultService.js';
import { BackupService } from '../services/BackupService.js';
import { SyncService } from '../services/SyncService.js';
import { HelpService } from '../services/HelpService.js';

const config = loadConfig();

const micro = MicroService.create(config.microUrl);
const vault = VaultService.create(config.vaultUrl);
const backup = BackupService.create(config.backupUrl);
const sync = SyncService.create(config.syncUrl);
const help = HelpService.create('');

const app = express();
app.use(express.json());

// Health

app.get('/api/health', async (_req, res) => {
  const settled = await Promise.allSettled([
    micro.health(),
    vault.status(),
    backup.status(),
    sync.status(),
  ]);

  const [microResult, vaultResult, backupResult, syncResult] = settled;

  res.json({
    micro: microResult.status === 'fulfilled' ? 'up' : 'down',
    vault: vaultResult.status === 'fulfilled' ? 'up' : 'down',
    backup: backupResult.status === 'fulfilled' ? 'up' : 'down',
    sync: syncResult.status === 'fulfilled' ? 'up' : 'down',
  });
});

// Micro proxy

app.get('/api/micro/tables', async (_req, res) => {
  try {
    const result = await micro.listTables();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/micro/query', async (req, res) => {
  try {
    const { sql, params } = req.body as { sql: string; params?: unknown[] };
    const result = await micro.query(sql, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/micro/describe/:table', async (req, res) => {
  try {
    const result = await micro.describeTable(req.params.table);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Vault proxy

app.get('/api/vault/status', async (_req, res) => {
  try {
    const result = await vault.status();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/vault/list', async (req, res) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;
    const result = await vault.list(limit, offset);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/vault/access-log', async (req, res) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const result = await vault.accessLog(limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/vault/retention-policies', async (_req, res) => {
  try {
    const result = await vault.retentionPolicies();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Backup proxy

app.get('/api/backup/list', async (_req, res) => {
  try {
    const result = await backup.list();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/backup/status', async (_req, res) => {
  try {
    const result = await backup.status();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/backup/manifest/:id', async (req, res) => {
  try {
    const result = await backup.manifest(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/backup/verify/:id', async (req, res) => {
  try {
    const result = await backup.verify(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Sync proxy

app.get('/api/sync/status', async (_req, res) => {
  try {
    const result = await sync.status();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/sync/audit', async (req, res) => {
  try {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const after = req.query.after !== undefined ? String(req.query.after) : undefined;
    const result = await sync.auditTrail(limit, after);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/sync/audit/verify', async (_req, res) => {
  try {
    const result = await sync.auditVerify();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/sync/publications', async (_req, res) => {
  try {
    const result = await sync.publications();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/sync/scope-report', async (_req, res) => {
  try {
    const result = await sync.scopeReport();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Help

app.get('/api/help/topics', (_req, res) => {
  try {
    const result = help.listTopics();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/help/topic/:id', (req, res) => {
  try {
    const result = help.getTopic(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/help/search', (req, res) => {
  try {
    const q = req.query.q !== undefined ? String(req.query.q) : '';
    const result = help.search(q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const port = parseInt(process.env.VIBESQL_ADMIN_API_PORT || '5175', 10);

app.listen(port, () => {
  console.log(`VibeSQL Admin API listening on port ${port}`);
});
