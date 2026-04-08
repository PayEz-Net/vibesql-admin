import { useEffect, useState } from 'react'

interface ServiceHealth {
  status: 'connected' | 'disconnected' | 'unknown'
}

interface HealthData {
  micro?: ServiceHealth
  vault?: ServiceHealth
  backup?: ServiceHealth
  sync?: ServiceHealth
}

const PRODUCTS = ['micro', 'vault', 'backup', 'sync'] as const
type Product = typeof PRODUCTS[number]

const LABELS: Record<Product, string> = {
  micro: 'Micro',
  vault: 'Vault',
  backup: 'Backup',
  sync: 'Sync',
}

function statusColor(status?: 'connected' | 'disconnected' | 'unknown'): string {
  if (status === 'connected') return 'bg-green-500'
  if (status === 'disconnected') return 'bg-red-500'
  return 'bg-slate-500'
}

function statusTitle(status?: 'connected' | 'disconnected' | 'unknown'): string {
  if (status === 'connected') return 'Connected'
  if (status === 'disconnected') return 'Disconnected'
  return 'Unknown'
}

export default function StatusBar() {
  const [health, setHealth] = useState<HealthData>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data: HealthData = await res.json()
        setHealth(data)
      } else {
        setHealth({
          micro: { status: 'disconnected' },
          vault: { status: 'disconnected' },
          backup: { status: 'disconnected' },
          sync: { status: 'disconnected' },
        })
      }
    } catch {
      setHealth({
        micro: { status: 'disconnected' },
        vault: { status: 'disconnected' },
        backup: { status: 'disconnected' },
        sync: { status: 'disconnected' },
      })
    }
    setLastUpdated(new Date())
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="bg-slate-900 border-t border-slate-700 px-4 py-2 flex items-center gap-6 shrink-0">
      <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Services</span>
      {PRODUCTS.map((product) => {
        const svc = health[product]
        return (
          <div key={product} className="flex items-center gap-1.5" title={statusTitle(svc?.status)}>
            <span
              className={`inline-block w-2 h-2 rounded-full ${statusColor(svc?.status)}`}
            />
            <span className="text-slate-400 text-xs">{LABELS[product]}</span>
          </div>
        )
      })}
      {lastUpdated && (
        <span className="ml-auto text-slate-600 text-xs">
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </footer>
  )
}
