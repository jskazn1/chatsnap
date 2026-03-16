// Markdown-subset renderer for chat messages
// Supports: **bold**, *italic*, `code`, ```code blocks```, ~~strikethrough~~, URLs

function MessageRenderer({ text }) {
  if (!text) return null

  // Split by code blocks first
  const parts = text.split(/([`]{3}[sS]*?[`]{3}|[`][^`]+[`])/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).trim()
          return (
            <pre
              key={i}
              className="my-1.5 p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all"
            >
              {code}
            </pre>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 bg-slate-700 text-indigo-300 text-xs font-mono rounded"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        return <InlineFormat key={i} text={part} />
      })}
    </>
  )
}

function InlineFormat({ text }) {
  // Process bold, italic, strikethrough
  const regex = /(**[^*]+**|*[^*]+*|~~[^~]+~~)/g
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>
        }
        if (part.startsWith('~~') && part.endsWith('~~')) {
          return <del key={i} className="line-through opacity-60">{part.slice(2, -2)}</del>
        }
        // Auto-link URLs
        return <AutoLink key={i} text={part} />
      })}
    </>
  )
}

function AutoLink({ text }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all transition-colors"
            >
              {part}
            </a>
          )
        }
        return part
      })}
    </>
  )
}

export default MessageRenderer
