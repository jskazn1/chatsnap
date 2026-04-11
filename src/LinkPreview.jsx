import { useState, useEffect, memo } from 'react'
import { FiExternalLink } from 'react-icons/fi'

// Match http/https URLs — simple but effective for chat messages
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]{2,}/g

export function extractUrls(text) {
  if (!text) return []
  const matches = [...text.matchAll(URL_REGEX)]
  // Deduplicate and limit to first 2 previews per message
  return [...new Set(matches.map(m => m[0]))].slice(0, 2)
}

const LinkPreview = memo(function LinkPreview({ url }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!url) return
    let cancelled = false

    async function fetchMeta() {
      try {
        const res = await fetch(
          `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`,
          { signal: AbortSignal.timeout(5000) }
        )
        const json = await res.json()
        if (!cancelled && json.status === 'success') {
          setData(json.data)
        }
      } catch {
        // silently fail — link previews are decorative
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMeta()
    return () => { cancelled = true }
  }, [url])

  // Don't render anything while loading or if no useful data
  if (loading || !data || (!data.title && !data.description)) return null

  let hostname = url
  try { hostname = new URL(url).hostname.replace(/^www\./, '') } catch {}

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-0 mt-2 max-w-sm rounded-xl border border-slate-700/70 bg-slate-800/50
                 overflow-hidden hover:bg-slate-700/50 hover:border-slate-600 transition-all
                 no-underline group/preview"
      aria-label={`Link preview: ${data.title || hostname}`}
    >
      {/* Thumbnail */}
      {data.image?.url && (
        <div className="w-20 shrink-0 overflow-hidden bg-slate-700/50">
          <img
            src={data.image.url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0 p-2.5 py-2.5 flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-violet-400 font-semibold truncate uppercase tracking-wide mb-0.5">
            {hostname}
          </p>
          {data.title && (
            <p className="text-xs text-white font-semibold leading-snug line-clamp-2">
              {data.title}
            </p>
          )}
          {data.description && (
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* External link icon — subtle */}
      <div className="flex items-start pt-2 pr-2 shrink-0 opacity-0 group-hover/preview:opacity-100 transition-opacity">
        <FiExternalLink size={11} className="text-slate-500" />
      </div>
    </a>
  )
})

export default LinkPreview
