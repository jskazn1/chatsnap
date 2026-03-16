// Simple markdown-subset renderer for chat messages
// Supports: **bold**, *italic*, `code`, ```code blocks```, ~~strikethrough~~

function MessageRenderer({ text }) {
  if (!text) return null

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).trim()
          return <pre key={i} className="msg-code-block">{code}</pre>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="msg-code-inline">{part.slice(1, -1)}</code>
        }
        return <InlineFormat key={i} text={part} />
      })}
    </>
  )
}

function InlineFormat({ text }) {
  // Process bold, italic, strikethrough
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith('~~') && part.endsWith('~~')) {
          return <del key={i}>{part.slice(2, -2)}</del>
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
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="msg-link">
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
