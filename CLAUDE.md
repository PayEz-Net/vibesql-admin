# VibeSQL Admin

Unified admin hub and MCP server for the VibeSQL 7-product family. Provides comprehensive administration interface plus a Model Context Protocol server for AI-powered capabilities.

## Quick Start

- **UI Dev**: `npm run dev` → http://localhost:5174
- **MCP Server**: `npm run mcp` → API on http://localhost:5175
- **Production Build**: `npm run build`

## Port Layout

| Port | Purpose |
|------|---------|
| 5174 | Vite dev server (UI) |
| 5175 | Express API server (MCP) |

UI proxies to API via Vite config.

## Key Directories

- `src/services/` — API client services
- `src/mcp/` — MCP server implementation
- `src/pages/` — Vue components and page views
- `src/help/content/` — Help documentation content

## Tech Stack

- Vue 3 + TypeScript
- Vite (build tooling)
- Express (MCP API)
- Node.js 18+
