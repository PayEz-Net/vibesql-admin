import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig } from '../services/config.js';
import { MicroService } from '../services/MicroService.js';
import { VaultService } from '../services/VaultService.js';
import { BackupService } from '../services/BackupService.js';
import { SyncService } from '../services/SyncService.js';
import { HelpService } from '../services/HelpService.js';

const config = loadConfig();
const micro = new MicroService(config.microUrl);
const vault = new VaultService(config.vaultUrl);
const backup = new BackupService(config.backupUrl);
const sync = new SyncService(config.syncUrl);
const help = new HelpService('');

const server = new McpServer({
  name: 'vibesql-admin',
  version: '0.1.0',
});

// ---------------------------------------------------------------------------
// Database tools
// ---------------------------------------------------------------------------

server.tool(
  'query',
  'Execute a SQL query against the VibeSQL Micro database',
  {
    sql: z.string().describe('SQL statement to execute'),
    params: z.string().optional().describe('JSON array of query parameters'),
  },
  async ({ sql, params }) => {
    try {
      const parsedParams = params ? (JSON.parse(params) as unknown[]) : undefined;
      const result = await micro.query(sql, parsedParams);
      const header = result.columns.join('\t');
      const rows = result.rows.map((row) => row.join('\t')).join('\n');
      const text = [header, rows].filter(Boolean).join('\n');
      return {
        content: [{ type: 'text', text: text || '(no rows returned)' }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'list_tables',
  'List all tables in the VibeSQL Micro database',
  async () => {
    try {
      const result = await micro.listTables();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'describe_table',
  'Describe the columns of a table in the VibeSQL Micro database',
  {
    table: z.string().describe('Table name to describe'),
  },
  async ({ table }) => {
    try {
      const result = await micro.describeTable(table);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'table_data',
  'Retrieve rows from a table with optional pagination',
  {
    table: z.string().describe('Table name to query'),
    limit: z.number().optional().describe('Maximum number of rows to return'),
    offset: z.number().optional().describe('Number of rows to skip'),
  },
  async ({ table, limit, offset }) => {
    try {
      const limitClause = limit !== undefined ? ` LIMIT ${limit}` : '';
      const offsetClause = offset !== undefined ? ` OFFSET ${offset}` : '';
      const sql = `SELECT * FROM "${table}"${limitClause}${offsetClause}`;
      const result = await micro.query(sql);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Vault tools
// ---------------------------------------------------------------------------

server.tool(
  'vault_status',
  'Get the current status of the VibeSQL Vault service',
  async () => {
    try {
      const result = await vault.status();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'vault_list',
  'List vault entries with optional pagination',
  {
    limit: z.number().optional().describe('Maximum number of entries to return'),
    offset: z.number().optional().describe('Number of entries to skip'),
  },
  async ({ limit, offset }) => {
    try {
      const result = await vault.list(limit, offset);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'vault_access_log',
  'Retrieve the vault access log',
  {
    limit: z.number().optional().describe('Maximum number of log entries to return'),
  },
  async ({ limit }) => {
    try {
      const result = await vault.accessLog(limit);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'vault_retention_policies',
  'Get the configured retention policies for the vault',
  async () => {
    try {
      const result = await vault.retentionPolicies();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Backup tools
// ---------------------------------------------------------------------------

server.tool(
  'backup_list',
  'List all available backups',
  async () => {
    try {
      const result = await backup.list();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'backup_status',
  'Get the current status of the backup service',
  async () => {
    try {
      const result = await backup.status();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'backup_manifest',
  'Retrieve the manifest for a specific backup',
  {
    backup_id: z.string().describe('Unique identifier of the backup'),
  },
  async ({ backup_id }) => {
    try {
      const result = await backup.manifest(backup_id);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'backup_verify',
  'Verify the integrity of a specific backup',
  {
    backup_id: z.string().describe('Unique identifier of the backup to verify'),
  },
  async ({ backup_id }) => {
    try {
      const result = await backup.verify(backup_id);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Sync tools
// ---------------------------------------------------------------------------

server.tool(
  'sync_status',
  'Get the current status of the VibeSQL Sync service',
  async () => {
    try {
      const result = await sync.status();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'sync_audit_trail',
  'Retrieve the sync audit trail with optional filtering',
  {
    limit: z.number().optional().describe('Maximum number of audit entries to return'),
    after: z.string().optional().describe('Return entries after this cursor or timestamp'),
  },
  async ({ limit, after }) => {
    try {
      const result = await sync.auditTrail(limit, after);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'sync_audit_verify',
  'Verify the integrity of the sync audit trail',
  async () => {
    try {
      const result = await sync.auditVerify();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'sync_publications',
  'List all sync publications',
  async () => {
    try {
      const result = await sync.publications();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'sync_scope_report',
  'Generate a scope report for the sync service',
  async () => {
    try {
      const result = await sync.scopeReport();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Help tools
// ---------------------------------------------------------------------------

server.tool(
  'help',
  'Get help content for a specific VibeSQL topic',
  {
    topic: z.string().describe('Topic name to look up'),
  },
  async ({ topic }) => {
    try {
      const result = await help.getTopic(topic);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'help_products',
  'List all available VibeSQL help topics and products',
  async () => {
    try {
      const result = await help.listTopics();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'help_architecture',
  'Get the VibeSQL architecture overview',
  async () => {
    try {
      const result = await help.getTopic('architecture');
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.resource(
  'vibesql-products',
  'vibesql://products',
  { description: 'VibeSQL product family overview' },
  async () => {
    const content = await help.getTopic('products');
    return {
      contents: [
        {
          uri: 'vibesql://products',
          mimeType: 'text/markdown',
          text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        },
      ],
    };
  }
);

server.resource(
  'vibesql-config',
  'vibesql://config',
  { description: 'Current VibeSQL admin configuration' },
  async () => {
    return {
      contents: [
        {
          uri: 'vibesql://config',
          mimeType: 'application/json',
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }
);

server.resource(
  'vibesql-help-topic',
  new ResourceTemplate('vibesql://help/{topic}', { list: undefined }),
  { description: 'VibeSQL help content by topic' },
  async (uri, variables) => {
    const topic = Array.isArray(variables.topic) ? variables.topic[0] : variables.topic;
    const content = await help.getTopic(topic as string);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
