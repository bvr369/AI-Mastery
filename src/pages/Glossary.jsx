import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, BookOpen } from 'lucide-react'
import { GLOSSARY } from '../data/glossary'

const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const TAG_LABELS = {
  core: 'Core concepts', api: 'APIs', rag: 'RAG & search', training: 'Training',
  internals: 'Under the hood', agents: 'Agents', security: 'Security', prompting: 'Prompting', production: 'Production',
}

export default function Glossary() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState(null)
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('!border-brand-500')
      setTimeout(() => el.classList.remove('!border-brand-500'), 2000)
    }
  }, [hash])

  const tags = useMemo(() => [...new Set(GLOSSARY.flatMap((g) => g.tags))], [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GLOSSARY
      .filter((g) => !tag || g.tags.includes(tag))
      .filter((g) => !q || g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q) || g.full?.toLowerCase().includes(q))
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [query, tag])

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight txt-1">Glossary</h1>
        <p className="mt-1 text-sm txt-2">Every AI term you'll meet in the course — in plain developer English. These power the hover-tooltips inside lessons.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 txt-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${GLOSSARY.length} terms…`} className="input pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setTag(null)} className={!tag ? 'chip-brand' : 'chip-zinc'}>All</button>
          {tags.map((t) => (
            <button key={t} onClick={() => setTag(tag === t ? null : t)} className={tag === t ? 'chip-brand' : 'chip-zinc'}>
              {TAG_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-sm txt-3">No terms match “{query}”.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((g) => (
          <div key={g.term} id={slugify(g.term)} className="card card-hover scroll-mt-24 p-4 transition-colors">
            <div className="flex items-start gap-2.5">
              <BookOpen size={15} className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-300" />
              <div>
                <div className="text-sm font-bold txt-1">
                  {g.term}
                  {g.full && <span className="ml-1.5 text-xs font-normal txt-3">· {g.full}</span>}
                </div>
                <p className="mt-1 text-xs leading-relaxed txt-2">{g.def}</p>
                <div className="mt-2 flex gap-1.5">
                  {g.tags.map((t) => <span key={t} className="chip-zinc">{TAG_LABELS[t] ?? t}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
