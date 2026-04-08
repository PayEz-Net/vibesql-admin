import { useEffect, useState } from 'react'

const TOPICS = [
  { id: 'products', label: 'Products Overview' },
  { id: 'vault', label: 'Vault' },
  { id: 'cryptaply', label: 'CryptAply' },
  { id: 'backup', label: 'Backup' },
  { id: 'sync', label: 'Sync' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'glossary', label: 'Glossary' },
]

export default function HelpPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0].id)
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ topic: string; excerpt: string }[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!selectedTopic) return
    setLoading(true)
    setError(null)
    setSearchResults(null)
    fetch(`/api/help/topic/${selectedTopic}`)
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
        setContent('')
        setLoading(false)
      })
  }, [selectedTopic])

  const handleSearch = () => {
    if (!search.trim()) return
    setSearchLoading(true)
    setSearchResults(null)
    fetch(`/api/help/search?q=${encodeURIComponent(search)}`)
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
      .then((data: { topic: string; excerpt: string }[]) => {
        setSearchResults(data)
        setSearchLoading(false)
      })
      .catch(() => {
        setSearchResults([])
        setSearchLoading(false)
      })
  }

  const filteredTopics = TOPICS.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">❓ Help</h2>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search help topics..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-500"
        />
        <button
          onClick={handleSearch}
          disabled={searchLoading || !search.trim()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 text-sm rounded transition-colors"
        >
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
        {search && (
          <button
            onClick={() => {
              setSearch('')
              setSearchResults(null)
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-500 text-sm rounded transition-colors border border-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Search Results ({searchResults.length})
          </p>
          {searchResults.length === 0 ? (
            <p className="text-slate-500 text-sm">No results found for &quot;{search}&quot;</p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const topic = TOPICS.find((t) => t.id === result.topic)
                    if (topic) {
                      setSelectedTopic(topic.id)
                      setSearchResults(null)
                    }
                  }}
                  className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded transition-colors"
                >
                  <p className="text-sm font-medium text-slate-300">
                    {TOPICS.find((t) => t.id === result.topic)?.label ?? result.topic}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.excerpt}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Topic list */}
        <div className="w-48 shrink-0 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
          <div className="px-3 py-2 border-b border-slate-700">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Topics</p>
          </div>
          <ul>
            {filteredTopics.map((topic) => (
              <li key={topic.id}>
                <button
                  onClick={() => {
                    setSelectedTopic(topic.id)
                    setSearchResults(null)
                  }}
                  className={[
                    'w-full text-left px-3 py-2.5 text-sm transition-colors',
                    selectedTopic === topic.id
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200',
                  ].join(' ')}
                >
                  {topic.label}
                </button>
              </li>
            ))}
            {filteredTopics.length === 0 && (
              <li className="px-3 py-3 text-slate-600 text-sm">No topics match</li>
            )}
          </ul>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-auto">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-300">
              {TOPICS.find((t) => t.id === selectedTopic)?.label ?? selectedTopic}
            </h3>
          </div>
          <div className="px-4 py-4">
            {loading && (
              <p className="text-slate-400 text-sm">Loading content...</p>
            )}
            {error && (
              <div className="text-slate-500 text-sm">
                <p>Help content for &quot;{selectedTopic}&quot; is not available.</p>
                <p className="text-xs mt-1 text-slate-600">Error: {error}</p>
              </div>
            )}
            {!loading && !error && content && (
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            )}
            {!loading && !error && !content && (
              <p className="text-slate-500 text-sm">No content available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
