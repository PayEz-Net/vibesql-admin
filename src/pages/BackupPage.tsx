import { useEffect, useState } from 'react'

interface BackupEntry {
  id: string
  status: 'complete' | 'pending' | 'failed' | string
  size: number
  created: string
  encrypted: boolean
}

interface ManifestEntry {
  path: string
  sha256: string
  size: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function statusBadge(status: string) {
  const classes =
    status === 'complete'
      ? 'bg-green-900/50 text-green-300'
      : status === 'pending'
      ? 'bg-yellow-900/50 text-yellow-300'
      : status === 'failed'
      ? 'bg-red-900/50 text-red-300'
      : 'bg-slate-700 text-slate-300'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${classes}`}>{status}</span>
  )
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null)
  const [manifestLoading, setManifestLoading] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<Record<string, 'idle' | 'verifying' | 'ok' | 'failed'>>({})

  useEffect(() => {
    fetch('/api/backup/list')
      .then((res) => {
        if (!res.ok) throw new Error('not connected')
        return res.json()
      })
      .then((data: BackupEntry[]) => {
        setBackups(data)
        setConnected(true)
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false))
  }, [])

  const openManifest = (id: string) => {
    setSelectedBackup(id)
    setManifest(null)
    setManifestLoading(true)
    fetch(`/api/backup/manifest/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
      .then((data: ManifestEntry[]) => setManifest(data))
      .catch(() => setManifest([]))
      .finally(() => setManifestLoading(false))
  }

  const verifyBackup = (id: string) => {
    setVerifyStatus((prev) => ({ ...prev, [id]: 'verifying' }))
    fetch(`/api/backup/verify/${id}`, { method: 'POST' })
      .then((res) => {
        setVerifyStatus((prev) => ({ ...prev, [id]: res.ok ? 'ok' : 'failed' }))
      })
      .catch(() => setVerifyStatus((prev) => ({ ...prev, [id]: 'failed' })))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Loading backup data...</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl">💾</div>
        <h2 className="text-xl font-semibold text-slate-300">Not Connected</h2>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          The Backup service is not running or not reachable at{' '}
          <code className="text-slate-400">/api/backup</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">💾 Backup</h2>
        <span className="text-slate-500 text-sm">{backups.length} backups</span>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Backup list */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
            {backups.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-slate-500 text-sm">No backups found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">ID</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Size</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Created</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Encrypted</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup, i) => {
                    const vs = verifyStatus[backup.id] ?? 'idle'
                    return (
                      <tr
                        key={backup.id}
                        className={`border-b border-slate-700/50 ${
                          selectedBackup === backup.id ? 'bg-slate-700/40' : i % 2 === 0 ? '' : 'bg-slate-800/50'
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-300 font-mono text-xs">{backup.id}</td>
                        <td className="px-4 py-2">{statusBadge(backup.status)}</td>
                        <td className="px-4 py-2 text-slate-400">{formatBytes(backup.size)}</td>
                        <td className="px-4 py-2 text-slate-500 text-xs">{new Date(backup.created).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          {backup.encrypted ? (
                            <span className="text-green-400 text-xs">Yes</span>
                          ) : (
                            <span className="text-slate-500 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-2 flex items-center gap-2">
                          <button
                            onClick={() => openManifest(backup.id)}
                            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                          >
                            Manifest
                          </button>
                          <button
                            onClick={() => verifyBackup(backup.id)}
                            disabled={vs === 'verifying'}
                            className={[
                              'text-xs px-2 py-1 rounded transition-colors',
                              vs === 'ok'
                                ? 'bg-green-900/50 text-green-300'
                                : vs === 'failed'
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50',
                            ].join(' ')}
                          >
                            {vs === 'verifying' ? 'Verifying...' : vs === 'ok' ? 'Verified' : vs === 'failed' ? 'Failed' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Manifest viewer */}
        {selectedBackup && (
          <div className="w-96 shrink-0 bg-slate-800 rounded-lg border border-slate-700 flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-300">Manifest</p>
              <button
                onClick={() => setSelectedBackup(null)}
                className="text-slate-600 hover:text-slate-400 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="px-4 py-2 text-xs text-slate-500 font-mono truncate border-b border-slate-700/50">
              {selectedBackup}
            </p>
            <div className="flex-1 overflow-auto">
              {manifestLoading ? (
                <p className="px-4 py-4 text-slate-500 text-sm">Loading manifest...</p>
              ) : !manifest || manifest.length === 0 ? (
                <p className="px-4 py-4 text-slate-500 text-sm">No manifest entries</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Path</th>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">SHA-256</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifest.map((entry, i) => (
                      <tr key={i} className="border-b border-slate-700/30">
                        <td className="px-3 py-1.5 text-slate-300 font-mono truncate max-w-32" title={entry.path}>
                          {entry.path}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 font-mono truncate" title={entry.sha256}>
                          {entry.sha256.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
