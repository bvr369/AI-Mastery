import { useNavigate } from 'react-router-dom'
import { getTerm } from '../../data/glossary'

/**
 * Tiny inline formatter for lesson text:
 *   **bold**   `code`   *italic*   [link](url)   [[Glossary Term]]
 * [[Term]] renders a hoverable definition sourced from the glossary.
 */

function GlossaryTerm({ name }) {
  const navigate = useNavigate()
  const g = getTerm(name)
  if (!g) return <span>{name}</span>
  return (
    <span className="glossary-term" onClick={() => navigate(`/glossary#${g.slug}`)}>
      {name}
      <span className="glossary-pop">
        <span className="mb-1 block font-semibold txt-1">
          {g.term}
          {g.full ? <span className="font-normal txt-3"> · {g.full}</span> : null}
        </span>
        {g.def}
        <span className="mt-1.5 block text-[10px] font-medium text-brand-500 dark:text-brand-300">Click for glossary →</span>
      </span>
    </span>
  )
}

const SPLIT_RX = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g
const LINK_RX = /\[([^\]]+)\]\(([^)]+)\)/

export default function RichText({ text }) {
  if (!text) return null
  return text.split(SPLIT_RX).map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="inline-code">{part.slice(1, -1)}</code>
    if (part.startsWith('[[') && part.endsWith(']]')) return <GlossaryTerm key={i} name={part.slice(2, -2)} />
    if (part.startsWith('[')) {
      const m = part.match(LINK_RX)
      if (m) {
        return (
          <a key={i} href={m[2]} target="_blank" rel="noreferrer" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
            {m[1]}
          </a>
        )
      }
    }
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return <span key={i}>{part}</span>
  })
}
