import { useEffect, useState } from 'react'

interface Peer {
  id: string
  address: string
  clockSkewMs: number
  lagMs: number
  status: 'connected' | 'disconnected' | string
}

interface ReplicationStatus {
  peers: Peer[]
  lastSyncAt?: string
}

interface AuditEntry {
  id: string
  timestamp: string
  operation: string
  table: string
  hash: string
  prevHash: string
}

interface Publication {
  id: string
  name: string
  tables: string[]
  excludedColumns: Record<string, string[]>
  createdAt: string
}

interface ScopeReport {
  generatedAt: string
  content: string
}

export default function SyncPage() {
  const [replication, setReplication] = useState<ReplicationStatus | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [activeTab, setActiveTab] = useState<'replication' | 'audit' | 'publications'>('replication')
  const [hashChainStatus, setHashChainStatus] = useState<'idle' | 'verifying' | 'ok' | 'failed'>('idle')
  const [scopeReport, setScopeReport] = useState<ScopeReport | null>(null)
  const [scopeLoading, setScopeLoading] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [repRes, auditRes, pubRes] = await Promise.all([
          fetch('/api/sync/status'),
          fetch('/api/sync/audit'),
          fetch('/api/sync/publications'),
        ])
        if (!repRes.ok) throw new Error('sync not connected')
        setReplication(await repRes.json())
        if (auditRes.ok) setAuditLog(await auditRes.json())
        if (pubRes.ok) setPublications(await pubRes.json())
        setConnected(true)
      } catch {
        setConnected(false)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const verifyHashChain = () => {
    setHashChainStatus('verifying')
    fetch('/api/sync/audit/verify', { method: 'POST' })
      .then((res) => setHashChainStatus(res.ok ? 'ok' : 'failed'))
      .catch(() => setHashChainStatus('failed'))
  }

  const generateScopeReport = () => {
    setScopeLoading(true)
    fetch('/api/sync/scope-report')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
      .then((data: ScopeReport) => setScopeReport(data))
      .catch(() => setScopeReport({ generatedAt: new Date().toISOString(), content: 'Failed to generate report.' }))
      .finally(() => setScopeLoading(false))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Loading sync data...</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl">🔄</div>
        <h2 className="text-xl font-semibold text-slate-300">Not Connected</h2>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          The Sync service is not running or not reachable at{' '}
          <code className="text-slate-400">/api/sync</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">🔄 Sync</h2>
        {replication?.lastSyncAt && (
          <span className="text-slate-500 text-xs">
            Last sync: {new Date(replication.lastSyncAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {(['replication', 'audit', 'publications'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'text-white border-slate-400'
                : 'text-slate-500 border-transparent hover:text-slate-300',
            ].join(' ')}
          >
            {tab === 'audit' ? 'Audit Trail' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Replication Status Tab */}
      {activeTab === 'replication' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Peers</p>
            </div>
            {!replication?.peers || replication.peers.length === 0 ? (
              <p className="px-4 py-4 text-slate-500 text-sm">No peers configured</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Peer</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Address</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Clock Skew</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Lag</th>
                  </tr>
                </thead>
                <tbody>
                  {replication.peers.map((peer, i) => (
                    <tr key={peer.id} className={`border-b border-slate-700/50 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}>
                      <td className="px-4 py-2 text-slate-300 font-mono text-xs">{peer.id}</td>
                      <td className="px-4 py-2 text-slate-400">{peer.address}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${peer.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          <span className="text-xs text-slate-400">{peer.status}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-2 text-xs ${Math.abs(peer.clockSkewMs) > 1000 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {peer.clockSkewMs > 0 ? '+' : ''}{peer.clockSkewMs} ms
                      </td>
                      <td className={`px-4 py-2 text-xs ${peer.lagMs > 5000 ? 'text-red-400' : 'text-slate-400'}`}>
                        {peer.lagMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Scope Report */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-300">Scope Report</p>
              <button
                onClick={generateScopeReport}
                disabled={scopeLoading}
                className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded transition-colors"
              >
                {scopeLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
            {scopeReport ? (
              <div>
                <p className="text-xs text-slate-500 mb-2">Generated: {new Date(scopeReport.generatedAt).toLocaleString()}</p>
                <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap">
                  {scopeReport.content}
                </pre>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Click &quot;Generate Report&quot; to create a scope report.</p>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{auditLog.length} entries</p>
            <button
              onClick={verifyHashChain}
              disabled={hashChainStatus === 'verifying'}
              className={[
                'text-xs px-3 py-1.5 rounded transition-colors',
                hashChainStatus === 'ok'
                  ? 'bg-green-900/50 text-green-300'
                  : hashChainStatus === 'failed'
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50',
              ].join(' ')}
            >
              {hashChainStatus === 'verifying'
                ? 'Verifying...'
                : hashChainStatus === 'ok'
                ? 'Chain Verified'
                : hashChainStatus === 'failed'
                ? 'Verification Failed'
                : 'Verify Hash Chain'}
            </button>
          </div>
          <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
            {auditLog.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-slate-500 text-sm">No audit entries</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Timestamp</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Operation</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Table</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Hash</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Prev Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry, i) => (
                    <tr key={entry.id} className={`border-b border-slate-700/50 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}>
                      <td className="px-4 py-2 text-slate-500 text-xs">{new Date(entry.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={[
                          'px-2 py-0.5 rounded text-xs font-medium',
                          entry.operation === 'INSERT' ? 'bg-green-900/50 text-green-300' :
                          entry.operation === 'UPDATE' ? 'bg-blue-900/50 text-blue-300' :
                          entry.operation === 'DELETE' ? 'bg-red-900/50 text-red-300' :
                          'bg-slate-700 text-slate-300'
                        ].join(' ')}>
                          {entry.operation}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-300 font-mono text-xs">{entry.table}</td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-xs" title={entry.hash}>
                        {entry.hash.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-2 text-slate-600 font-mono text-xs" title={entry.prevHash}>
                        {entry.prevHash ? entry.prevHash.slice(0, 12) + '...' : 'genesis'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Publications Tab */}
      {activeTab === 'publications' && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {publications.length === 0 ? (
            <div className="flex items-center justify-center h-32 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-slate-500 text-sm">No publications configured</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {publications.map((pub) => (
                <div key={pub.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{pub.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{pub.id}</p>
                    </div>
                    <p className="text-xs text-slate-600">{new Date(pub.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Tables</p>
                      <div className="flex flex-wrap gap-1">
                        {pub.tables.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {Object.keys(pub.excludedColumns).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Excluded Columns</p>
                        {Object.entries(pub.excludedColumns).map(([table, cols]) => (
                          <div key={table} className="mb-1">
                            <span className="text-xs text-slate-500 font-mono">{table}: </span>
                            {cols.map((col) => (
                              <span key={col} className="mr-1 px-1.5 py-0.5 bg-red-900/30 text-red-400 text-xs rounded font-mono">
                                {col}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
