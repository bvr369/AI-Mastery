import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, GraduationCap, CornerDownLeft, Compass } from 'lucide-react'
import { useUI } from '../../store/ui'
import { ALL_LESSONS } from '../../data/curriculum'
import { GLOSSARY_MAP } from '../../data/glossary'
import { cn } from '../../lib/utils'

const PAGES = [
  { label: 'Dashboard', to: '/' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Review — Flashcards', to: '/review' },
  { label: 'Glossary', to: '/glossary' },
  { label: 'Settings', to: '/settings' },
]

export default function CommandPalette() {
  const open = useUI((s) => s.paletteOpen)
  const setPalette = useUI((s) => s.setPalette)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (s) => s.toLowerCase().includes(q)

    const lessons = ALL_LESSONS
      .filter((l) => !q || match(l.title) || match(l.desc) || match(l.moduleTitle))
      .slice(0, q ? 6 : 3)
      .map((l) => ({
        type: 'lesson', icon: GraduationCap,
        label: l.title,
        sub: `Module ${l.moduleNum} · ${l.live ? `${l.minutes}m · ${l.difficulty}` : `coming in Phase ${l.modulePhase}`}`,
        to: l.live ? `/learn/${l.id}` : '/roadmap',
        dim: !l.live,
      }))

    const terms = Object.values(GLOSSARY_MAP)
      .filter((g) => !q || match(g.term) || match(g.def))
      .slice(0, q ? 5 : 3)
      .map((g) => ({ type: 'term', icon: BookOpen, label: g.term, sub: g.def.slice(0, 70) + '…', to: `/glossary#${g.slug}` }))

    const pages = PAGES.filter((p) => !q || match(p.label)).map((p) => ({ type: 'page', icon: Compass, label: p.label, to: p.to }))

    return [...pages.slice(0, q ? 3 : 2), ...lessons, ...terms]
  }, [query])

  const go = (r) => {
    if (!r) return
    setPalette(false)
    navigate(r.to)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') go(results[active])
    else if (e.key === 'Escape') setPalette(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPalette(false)} />
      <div className="card relative w-full max-w-lg animate-pop-in overflow-hidden p-0">
        <div className="flex items-center gap-2.5 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Search size={16} className="txt-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search lessons, glossary terms, pages…"
            className="flex-1 bg-transparent text-sm txt-1 placeholder-zinc-400 focus:outline-none"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <div className="px-3 py-8 text-center text-sm txt-3">No results for “{query}”</div>}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.label}-${i}`}
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                i === active && 'bg-brand-500/10',
                r.dim && 'opacity-60'
              )}
            >
              <r.icon size={16} className={i === active ? 'text-brand-500 dark:text-brand-300' : 'txt-3'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium txt-1">{r.label}</span>
                {r.sub && <span className="block truncate text-xs txt-3">{r.sub}</span>}
              </span>
              {i === active && <CornerDownLeft size={14} className="txt-3" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
