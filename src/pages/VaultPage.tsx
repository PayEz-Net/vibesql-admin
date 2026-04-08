import { useEffect, useState } from 'react'

interface BlobEntry {
  id: string
  size: number
  created: string
  contentType: string
}

interface AccessLogEntry {
  id: string
  blobId: string
  action: string
  timestamp: string
  clientId?: string
}

interface RetentionPolicy {
  id: string
  pattern: string
  retentionDays: number
  description?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function VaultPage() {
  const [blobs, setBlobs] = useState<BlobEntry[]>([])
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([])
  const [policies, setPolicies] = useState<RetentionPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [activeTab, setActiveTab] = useState<'blobs' | 'access-log' | 'retention'>('blobs')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [blobsRes, logRes, policiesRes] = await Promise.all([
          fetch('/api/vault/list'),
          fetch('/api/vault/access-log'),
          fetch('/api/vault/retention-policies'),
        ])
        if (!blobsRes.ok) throw new Error('vault not connected')
        setBlobs(await blobsRes.json())
        if (logRes.ok) setAccessLog(await logRes.json())
        if (policiesRes.ok) setPolicies(await policiesRes.json())
        setConnected(true)
      } catch {
        setConnected(false)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Loading vault data...</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl">🔐</div>
        <h2 className="text-xl font-semibold text-slate-300">Not Connected</h2>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          The Vault service is not running or not reachable at{' '}
          <code className="text-slate-400">/api/vault</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">🔐 Vault</h2>
        <span className="text-slate-500 text-sm">{blobs.length} blobs</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {(['blobs', 'access-log', 'retention'] as const).map((tab) => (
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
            {tab === 'access-log' ? 'Access Log' : tab === 'retention' ? 'Retention Policies' : 'Blobs'}
          </button>
        ))}
      </div>

      {/* Blobs Tab */}
      {activeTab === 'blobs' && (
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
          {blobs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500 text-sm">No blobs found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Content Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Size</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody>
                {blobs.map((blob, i) => (
                  <tr
                    key={blob.id}
                    className={`border-b border-slate-700/50 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}
                  >
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{blob.id}</td>
                    <td className="px-4 py-2 text-slate-400">{blob.contentType}</td>
                    <td className="px-4 py-2 text-slate-400">{formatBytes(blob.size)}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{new Date(blob.created).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Access Log Tab */}
      {activeTab === 'access-log' && (
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
          {accessLog.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500 text-sm">No access log entries</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Timestamp</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Blob ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Client</th>
                </tr>
              </thead>
              <tbody>
                {accessLog.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-slate-700/50 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}
                  >
                    <td className="px-4 py-2 text-slate-500 text-xs">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={[
                        'px-2 py-0.5 rounded text-xs font-medium',
                        entry.action === 'read' ? 'bg-blue-900/50 text-blue-300' :
                        entry.action === 'write' ? 'bg-green-900/50 text-green-300' :
                        entry.action === 'delete' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-700 text-slate-300'
                      ].join(' ')}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{entry.blobId}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{entry.clientId ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Retention Policies Tab */}
      {activeTab === 'retention' && (
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
          {policies.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500 text-sm">No retention policies configured</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Pattern</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Retention</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy, i) => (
                  <tr
                    key={policy.id}
                    className={`border-b border-slate-700/50 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}
                  >
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{policy.id}</td>
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{policy.pattern}</td>
                    <td className="px-4 py-2 text-slate-400">{policy.retentionDays} days</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{policy.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
