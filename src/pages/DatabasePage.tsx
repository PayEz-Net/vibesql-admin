import { useEffect, useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
}

export default function DatabasePage() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [queryText, setQueryText] = useState('')
  const [loading, setLoading] = useState(false)
  const [tablesLoading, setTablesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    setTablesLoading(true)
    fetch('/api/micro/tables')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: string[]) => {
        setTables(data)
        setConnected(true)
        setTablesLoading(false)
      })
      .catch(() => {
        setConnected(false)
        setTablesLoading(false)
      })
  }, [])

  const fetchTable = (table: string) => {
    setSelectedTable(table)
    setQueryText(`SELECT * FROM "${table}" LIMIT 100`)
    setLoading(true)
    setError(null)
    fetch('/api/micro/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: `SELECT * FROM "${table}" LIMIT 100` }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: QueryResult) => {
        setQueryResult(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }

  const runQuery = () => {
    if (!queryText.trim()) return
    setLoading(true)
    setError(null)
    fetch('/api/micro/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: queryText }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: QueryResult) => {
        setQueryResult(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!queryResult?.columns) return []
    return queryResult.columns.map((col) => ({
      accessorKey: col,
      header: col,
      cell: ({ getValue }) => {
        const val = getValue()
        if (val === null || val === undefined) return <span className="text-slate-600 italic">null</span>
        return String(val)
      },
    }))
  }, [queryResult?.columns])

  const table = useReactTable({
    data: queryResult?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl">🗄️</div>
        <h2 className="text-xl font-semibold text-slate-300">Not Connected</h2>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          The Micro database service is not running or not reachable at{' '}
          <code className="text-slate-400">/api/micro</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">🗄️ Database</h2>
        <span className="text-slate-500 text-sm">{tables.length} tables</span>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Table list sidebar */}
        <div className="w-48 shrink-0 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
          <div className="px-3 py-2 border-b border-slate-700">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tables</p>
          </div>
          {tablesLoading ? (
            <p className="px-3 py-4 text-slate-500 text-sm">Loading...</p>
          ) : tables.length === 0 ? (
            <p className="px-3 py-4 text-slate-500 text-sm">No tables found</p>
          ) : (
            <ul>
              {tables.map((t) => (
                <li key={t}>
                  <button
                    onClick={() => fetchTable(t)}
                    className={[
                      'w-full text-left px-3 py-2 text-sm transition-colors truncate',
                      selectedTable === t
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200',
                    ].join(' ')}
                    title={t}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Data grid */}
          <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 text-sm">Loading...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-400 text-sm">Error: {error}</p>
              </div>
            ) : !queryResult ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500 text-sm">Select a table or run a query</p>
              </div>
            ) : queryResult.rows.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500 text-sm">No rows returned</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2 text-slate-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-1.5 text-slate-300 whitespace-nowrap max-w-xs truncate border-b border-slate-700/50"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Query runner */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 shrink-0">
            <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Query Runner</p>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              rows={3}
              placeholder="SELECT * FROM ..."
              className="w-full bg-slate-900 text-slate-300 text-sm font-mono px-3 py-2 rounded border border-slate-700 resize-none focus:outline-none focus:border-slate-500 placeholder-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  runQuery()
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-600 text-xs">Ctrl+Enter to run</span>
              <button
                onClick={runQuery}
                disabled={loading || !queryText.trim()}
                className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                Run Query
              </button>
            </div>
          </div>
        </div>
      </div>

      {queryResult && (
        <p className="text-slate-600 text-xs shrink-0">
          {queryResult.rows.length} row{queryResult.rows.length !== 1 ? 's' : ''} returned
        </p>
      )}
    </div>
  )
}
