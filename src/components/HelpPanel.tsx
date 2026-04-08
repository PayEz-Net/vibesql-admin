import { useEffect, useState } from 'react'

interface HelpPanelProps {
  topic: string
}

export default function HelpPanel({ topic }: HelpPanelProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!topic) return
    setLoading(true)
    setError(null)
    fetch(`/api/help/${topic}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [topic])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <span className="font-medium">❓ Help: {topic}</span>
        <span className="text-slate-500 text-xs">{collapsed ? '▶ Show' : '▼ Hide'}</span>
      </button>
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700">
          {loading && <p className="text-slate-400 text-sm">Loading help content...</p>}
          {error && (
            <p className="text-slate-500 text-sm">Help content unavailable for &quot;{topic}&quot;.</p>
          )}
          {!loading && !error && content && (
            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
          {!loading && !error && !content && (
            <p className="text-slate-500 text-sm">No content found.</p>
          )}
        </div>
      )}
    </div>
  )
}
