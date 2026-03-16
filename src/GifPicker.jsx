import { useState, useRef } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCHQ' // Google's public Tenor API key
const TENOR_URL = 'https://tenor.googleapis.com/v2'

function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const searchTimeout = useRef(null)

  async function search(term) {
    setQuery(term)
    clearTimeout(searchTimeout.current)
    if (!term.trim()) {
      setGifs([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${TENOR_URL}/search?q=${encodeURIComponent(term)}&key=${TENOR_KEY}&limit=20&media_filter=tinygif`
        )
        const data = await res.json()
        setGifs(data.results || [])
      } catch {
        setGifs([])
      }
      setLoading(false)
    }, 400)
  }

  function handleSelect(gif) {
    const url = gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url
    if (url) onSelect(url)
  }

  return (
    <div className="gif-picker">
      <div className="gif-picker-header">
        <div className="gif-picker-search">
          <FiSearch />
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search GIFs..."
            autoFocus
          />
        </div>
        <button className="gif-picker-close" onClick={onClose}>
          <FiX />
        </button>
      </div>
      <div className="gif-picker-grid">
        {loading && <div className="gif-picker-status">Searching...</div>}
        {!loading && query && gifs.length === 0 && (
          <div className="gif-picker-status">No GIFs found</div>
        )}
        {!query && !loading && (
          <div className="gif-picker-status">Type to search for GIFs</div>
        )}
        {gifs.map((gif) => (
          <button key={gif.id} className="gif-item" onClick={() => handleSelect(gif)}>
            <img
              src={gif.media_formats?.tinygif?.url}
              alt={gif.content_description || 'GIF'}
              loading="lazy"
            />
          </button>
        ))}
      </div>
      <div className="gif-picker-powered">Powered by Tenor</div>
    </div>
  )
}

export default GifPicker
