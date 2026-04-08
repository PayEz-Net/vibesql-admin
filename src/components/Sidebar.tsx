import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Database', icon: '🗄️' },
  { to: '/vault', label: 'Vault', icon: '🔐' },
  { to: '/backup', label: 'Backup', icon: '💾' },
  { to: '/sync', label: 'Sync', icon: '🔄' },
  { to: '/help', label: 'Help', icon: '❓' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-full border-r border-slate-700 shrink-0">
      <div className="px-4 py-5 border-b border-slate-700">
        <h1 className="text-white font-bold text-base leading-tight">VibeSQL Admin</h1>
        <p className="text-slate-400 text-xs mt-0.5">Unified Admin Hub</p>
      </div>
      <nav className="flex-1 py-3">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
              ].join(' ')
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-slate-600 text-xs">v0.1.0</p>
      </div>
    </aside>
  )
}
