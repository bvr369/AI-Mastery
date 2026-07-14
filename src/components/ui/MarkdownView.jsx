import RichText from './RichText'

/**
 * Markdown-lite renderer for notes: #/##/### headings, - lists, 1. lists,
 * ``` code fences, > quotes, paragraphs. Inline formatting via RichText.
 */
export default function MarkdownView({ text }) {
  if (!text?.trim()) return <p className="text-sm italic txt-3">Nothing here yet…</p>

  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++])
      i++ // closing fence
      blocks.push({ type: 'code', text: buf.join('\n') })
    } else if (/^#{1,3}\s/.test(line)) {
      blocks.push({ type: `h${line.match(/^#+/)[0].length}`, text: line.replace(/^#+\s/, '') })
      i++
    } else if (/^[-*]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s/, ''))
      blocks.push({ type: 'ul', items })
    } else if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s/, ''))
      blocks.push({ type: 'ol', items })
    } else if (line.startsWith('> ')) {
      const buf = []
      while (i < lines.length && lines[i].startsWith('> ')) buf.push(lines[i++].slice(2))
      blocks.push({ type: 'quote', text: buf.join(' ') })
    } else if (line.trim() === '') {
      i++
    } else {
      const buf = []
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3}\s|[-*]\s|\d+\.\s|```|> )/.test(lines[i])) buf.push(lines[i++])
      blocks.push({ type: 'p', text: buf.join(' ') })
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, k) => {
        switch (b.type) {
          case 'h1': return <h2 key={k} className="text-lg font-bold txt-1"><RichText text={b.text} /></h2>
          case 'h2': return <h3 key={k} className="text-base font-bold txt-1"><RichText text={b.text} /></h3>
          case 'h3': return <h4 key={k} className="text-sm font-bold txt-1"><RichText text={b.text} /></h4>
          case 'code':
            return (
              <pre key={k} className="overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {b.text}
              </pre>
            )
          case 'ul':
            return (
              <ul key={k} className="space-y-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2 text-sm txt-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" /><span><RichText text={it} /></span></li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={k} className="space-y-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2 text-sm txt-2"><span className="shrink-0 font-semibold text-brand-500 dark:text-brand-300">{j + 1}.</span><span><RichText text={it} /></span></li>
                ))}
              </ol>
            )
          case 'quote':
            return <blockquote key={k} className="border-l-2 border-brand-400 pl-3 text-sm italic txt-2"><RichText text={b.text} /></blockquote>
          default:
            return <p key={k} className="text-sm leading-relaxed txt-2"><RichText text={b.text} /></p>
        }
      })}
    </div>
  )
}
