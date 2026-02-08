# vibesql-admin

Web UI for VibeSQL. Browse data, edit tables, run SQL.

---

## What is this?

`vibesql-admin` is a visual admin interface for [vibesql-micro](https://github.com/vibesql/vibesql-micro).

- **Browse tables** — View and edit rows
- **Run SQL** — Execute queries in the browser
- **Edit schema** — Create tables, add columns
- **One command** — `npx vibesql-admin` opens in your browser

No authentication, no config. Perfect for local development.

---

## Quick Start

```bash
# Terminal 1: Start the database
npx vibesql-micro

# Terminal 2: Start the admin UI
npx vibesql-admin
# → Opens http://localhost:5174 in your browser
```

---

## Installation

### npm (recommended)

```bash
npx vibesql-admin
```

### Global install

```bash
npm install -g vibesql-admin
vibesql-admin
```

### Configuration

Set environment variables:

```bash
VIBESQL_ADMIN_PORT=5174              # Admin UI port (default: 5174)
VIBESQL_MICRO_URL=http://localhost:5173  # Micro server URL
```

---

## Features

### Data Grid

- Browse tables
- Edit cells inline
- Add/delete rows
- Pagination (25, 50, 100 rows)
- Column sorting

### Query Runner

- Write and execute SQL
- View results in a table
- See execution time
- Query history (last 10 queries)

### Schema Editor

- View table schemas
- Add/remove columns
- Create new tables
- Drop tables (with confirmation)

### Connection Status

- Shows connection to vibesql-micro
- Green indicator = connected
- Red indicator = disconnected
- Auto-reconnect on failure

---

## Screenshots

(TODO: Add screenshots after UI is built)

---

## Use Cases

### Prototyping

Run `npx vibesql-admin` to visually inspect your data while building your app. No need to write SQL just to see what's in your database.

### Debugging

Query your local database visually when things go wrong. Much faster than writing SQL in the terminal.

### Data Entry

Add test data manually through the UI. Faster than writing INSERT statements.

---

## Architecture

```
┌─────────────────────────┐
│  Browser (port 5174)    │
│  ┌───────────────────┐  │
│  │  vibesql-admin    │  │
│  │  (React UI)       │  │
│  └──────────┬────────┘  │
└─────────────┼───────────┘
              │ HTTP
              ▼
┌─────────────────────────┐
│  vibesql-micro (5173)   │
│  POST /v1/query         │
│  GET  /v1/health        │
└─────────────────────────┘
              │
              ▼
┌─────────────────────────┐
│  SQLite Database        │
└─────────────────────────┘
```

The admin UI connects to vibesql-micro via HTTP API. No direct database access.

---

## Development

Clone the repo:

```bash
git clone https://github.com/vibesql/vibesql-admin.git
cd vibesql-admin
```

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
# → http://localhost:5174
```

Build for production:

```bash
npm run build
# → Outputs to dist/
```

Test the npm package:

```bash
npm link
vibesql-admin
```

---

## Tech Stack

- **Framework:** Vite + React
- **Styling:** Tailwind CSS
- **Data Grid:** TanStack Table
- **HTTP Client:** fetch API
- **Packaging:** npm (via npx)

---

## Project Structure

```
vibesql-admin/
├── src/
│   ├── components/
│   │   ├── DataGrid.tsx      # Table viewer/editor
│   │   ├── QueryRunner.tsx   # SQL query interface
│   │   ├── SchemaEditor.tsx  # Table schema manager
│   │   └── StatusBar.tsx     # Connection indicator
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
├── bin/
│   └── vibesql-admin.js       # CLI entry point
├── dist/                      # Built files (after npm run build)
├── package.json
└── vite.config.ts
```

---

## CLI Entry Point

The `npx vibesql-admin` command runs this script:

```javascript
#!/usr/bin/env node
const express = require('express');
const open = require('open');
const path = require('path');

const PORT = process.env.VIBESQL_ADMIN_PORT || 5174;
const MICRO_URL = process.env.VIBESQL_MICRO_URL || 'http://localhost:5173';

const app = express();
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/config', (req, res) => {
  res.json({ microServerUrl: MICRO_URL });
});

app.listen(PORT, () => {
  console.log(`VibeSQL Admin: http://localhost:${PORT}`);
  console.log(`Connecting to: ${MICRO_URL}`);
  open(`http://localhost:${PORT}`);
});
```

---

## Contributing

Contributions welcome. Open an issue or pull request.

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Links

- **Website:** [vibesql.online](https://vibesql.online)
- **Micro Server:** [github.com/vibesql/vibesql-micro](https://github.com/vibesql/vibesql-micro)
- **Docs:** [vibesql.online/docs](https://vibesql.online/docs)
- **Discord:** [discord.gg/vibesql](https://discord.gg/vibesql)

---

Built for developers. Visual database management. Zero config.
