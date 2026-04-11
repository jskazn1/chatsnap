import { useState, useRef } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

// Set VITE_TENOR_KEY in your .env file. See .env.example.
const TENOR_KEY = import.meta.env.VITE_TENOR_KEY || 'AIzaSyAyImkuYQYF_FXVALexPuGQctUMRURdCHQ'
const TENOR_URL = 'https://tenor.googleapis.com/v2'

function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const searchTimeout = useRef(null)

  async function search(term) {
    const capped = term.slice(0, 100) // cap query length
    setQuery(capped)
    clearTimeout(searchTimeout.current)
    if (capped.trim().length < 2) { // require 2+ chars before hitting Tenor API
      setGifs([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${TENOR_URL}/search?q=${encodeURIComponent(capped)}&key=${TENOR_KEY}&limit=20&media_filter=tinygif`
        )
        const data = await res.json()
        setGifs(data.results || [])
      } catch {
        setGifs([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function handleSelect(gif) {
    const url = gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url
    if (url) onSelect(url)
  }

  return (
    <div className="flex flex-col w-80 h-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2 flex-1 bg-slate-700 rounded-lg px-3 py-1.5">
          <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Search GIFs..."
            autoFocus
            maxLength={100}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !query && gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <span className="text-3xl">🎞️</span>
            <p className="text-xs">Search for a GIF</p>
          </div>
        ) : !loading && query && gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            No GIFs found for "{query}"
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map(gif => (
              <button
                key={gif.id}
                onClick={() => handleSelect(gif)}
                className="relative aspect-video rounded-lg overflow-hidden bg-slate-700 hover:ring-2 hover:ring-violet-500 transition-all group"
              >
                <img
                  src={gif.media_formats?.tinygif?.url}
                  alt={gif.content_description}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-slate-700 text-center">
        <span className="text-slate-600 text-xs">Powered by Tenor</span>
      </div>
    </div>
  )
}

export default GifPicker
