import { useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * A chunking laboratory. One baked doc is split into overlapping windows whose
 * size + overlap you control. Each chunk is scored against a baked question with
 * a real keyword term-frequency overlap; the top chunk is "retrieved". The whole
 * answer lives in words 13–27, so small/misaligned chunks split it at a boundary
 * and retrieval can only return a fragment — that's what wrecks RAG quality.
 */

const DOC =
  'Every account gets a secret token that authenticates its requests. Keep it private. ' +
  'To reset your API key, open Settings, pick the Security tab, and click Regenerate Key. ' +
  'The old key still works for a sixty minute grace period, so live services keep running. ' +
  'After that window it is permanently revoked. Store the new credential in an environment ' +
  'variable and never commit it to source control.'

const WORDS = DOC.trim().split(/\s+/)
const N = WORDS.length
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')

const QUESTION = 'How do I reset my API key?'
const STOP = new Set(['how', 'do', 'i', 'my', 'the', 'a', 'an', 'to', 'is', 'of', 'for', 'and', 'you', 'your', 'it', 'in'])
const KEYWORDS = [...new Set(QUESTION.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w && !STOP.has(w)))]

// The answer span: "To reset your API key … Regenerate Key." (word indices).
const A_START = WORDS.findIndex((w) => norm(w) === 'reset') - 1
const A_END = WORDS.findIndex((w) => norm(w) === 'regenerate') + 2 // exclusive
const A_LEN = A_END - A_START

const TINTS = ['bg-zinc-500/10', 'bg-sky-500/10', 'bg-amber-500/10', 'bg-emerald-500/10', 'bg-rose-500/10', 'bg-indigo-500/10']

const PRESETS = [
  { label: 'Too small', size: 8, overlap: 0, hint: 'answer gets split' },
  { label: 'Too big', size: 40, overlap: 0, hint: 'noisy & expensive' },
  { label: 'Just right + overlap', size: 20, overlap: 8, hint: 'clean retrieval' },
]

// score(chunk) = total occurrences of any question keyword in the chunk tokens (real TF overlap).
function scoreChunk(start, end) {
  let s = 0
  for (let i = start; i < end; i++) if (KEYWORDS.includes(norm(WORDS[i]))) s++
  return s
}

function buildChunks(size, overlap) {
  const ov = Math.min(overlap, size - 1)
  const step = Math.max(1, size - ov)
  const chunks = []
  for (let start = 0; start < N; start += step) {
    const end = Math.min(start + size, N)
    chunks.push({ start, end, score: scoreChunk(start, end) })
    if (end >= N) break
  }
  return chunks
}

const STATUS = {
  clean: { chip: 'chip-green', ring: 'border-emerald-500/50 bg-emerald-500/10', tx: 'text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2, title: 'Clean retrieval', msg: 'The retrieved chunk contains the entire answer with little noise.' },
  noisy: { chip: 'chip-amber', ring: 'border-amber-500/50 bg-amber-500/10', tx: 'text-amber-600 dark:text-amber-400', Icon: AlertTriangle, title: 'Answer found, but noisy', msg: 'The answer is buried in a large chunk — more tokens, weaker signal, higher cost.' },
  missed: { chip: 'chip-amber', ring: 'border-amber-500/50 bg-amber-500/10', tx: 'text-amber-600 dark:text-amber-400', Icon: AlertTriangle, title: 'Wrong chunk on top', msg: 'A chunk holds the full answer, but a different one scored higher — retrieval returns a fragment.' },
  split: { chip: 'chip-rose', ring: 'border-rose-500/50 bg-rose-500/10', tx: 'text-rose-600 dark:text-rose-400', Icon: XCircle, title: 'Answer split at a boundary', msg: 'No single chunk holds the whole answer, so retrieval can never return it intact.' },
}

export default function DemoChunkingLab({ onInteract }) {
  const [size, setSize] = useState(20)
  const [overlap, setOverlap] = useState(8)

  const touch = () => onInteract?.()

  const { chunks, retrieved, member, status, precision } = useMemo(() => {
    const chunks = buildChunks(size, overlap)
    let retrieved = 0
    for (let i = 1; i < chunks.length; i++) if (chunks[i].score > chunks[retrieved].score) retrieved = i

    const member = Array.from({ length: N }, () => [])
    chunks.forEach((c, ci) => { for (let i = c.start; i < c.end; i++) member[i].push(ci) })

    const holds = (c) => c.start <= A_START && c.end >= A_END
    const anyHolds = chunks.some(holds)
    const rc = chunks[retrieved]
    const precision = A_LEN / (rc.end - rc.start)

    let status
    if (!anyHolds) status = 'split'
    else if (holds(rc)) status = precision >= 0.5 ? 'clean' : 'noisy'
    else status = 'missed'

    return { chunks, retrieved, member, status, precision }
  }, [size, overlap])

  const st = STATUS[status]
  const maxScore = Math.max(1, ...chunks.map((c) => c.score))

  const changeSize = (v) => { touch(); const s = +v; setSize(s); if (overlap > s - 1) setOverlap(Math.max(0, s - 1)) }
  const changeOverlap = (v) => { touch(); setOverlap(Math.min(+v, size - 1)) }
  const applyPreset = (p) => { touch(); setSize(p.size); setOverlap(Math.min(p.overlap, p.size - 1)) }

  return (
    <div>
      {/* baked question */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <Search size={14} className="text-brand-500 dark:text-brand-300" />
        <span className="text-xs txt-3">query</span>
        <span className="font-mono text-xs font-semibold txt-1">"{QUESTION}"</span>
        <span className="ml-auto flex flex-wrap gap-1">
          {KEYWORDS.map((k) => <span key={k} className="chip-brand">{k}</span>)}
        </span>
      </div>

      {/* presets */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const on = size === p.size && overlap === Math.min(p.overlap, p.size - 1)
          return (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={cn('rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all',
                on ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}
            >
              <span className="font-semibold">{p.label}</span>
              <span className="ml-1 txt-3">· {p.hint}</span>
            </button>
          )
        })}
      </div>

      {/* sliders */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex justify-between text-xs">
            <span className="font-mono font-semibold txt-1">chunk size</span>
            <span className="tabular-nums text-brand-500 dark:text-brand-300">{size} words</span>
          </div>
          <input type="range" min={4} max={N} step={1} value={size} onChange={(e) => changeSize(e.target.value)} className="mt-1 w-full accent-brand-500" aria-label="chunk size in words" />
        </div>
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex justify-between text-xs">
            <span className="font-mono font-semibold txt-1">overlap</span>
            <span className="tabular-nums text-brand-500 dark:text-brand-300">{Math.min(overlap, size - 1)} words</span>
          </div>
          <input type="range" min={0} max={20} step={1} value={overlap} onChange={(e) => changeOverlap(e.target.value)} className="mt-1 w-full accent-brand-500" aria-label="overlap in words" />
        </div>
      </div>

      {/* document with chunk segments */}
      <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 leading-loose dark:border-zinc-800 dark:bg-zinc-950/50">
        {WORDS.map((w, i) => {
          const inRetrieved = member[i].includes(retrieved)
          const inAnswer = i >= A_START && i < A_END
          const isOverlap = member[i].length > 1
          const primary = member[i][0] ?? 0
          return (
            <span
              key={i}
              className={cn(
                'mr-1 inline-block rounded px-0.5 font-mono text-[11px] transition-colors',
                inRetrieved ? 'bg-brand-500/25 text-brand-800 dark:text-brand-100' : TINTS[primary % TINTS.length] + ' txt-2',
                isOverlap && !inRetrieved && 'ring-1 ring-inset ring-zinc-400/40',
                inAnswer && 'border-b-2 border-amber-500',
              )}
            >
              {w}
            </span>
          )
        })}
      </div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] txt-3">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-brand-500/25" /> retrieved chunk</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded ring-1 ring-inset ring-zinc-400/40" /> overlap region</span>
        <span className="flex items-center gap-1"><span className="h-0 w-4 border-b-2 border-amber-500" /> the answer</span>
      </div>

      {/* retrieval quality */}
      <div className={cn('mb-3 flex items-start gap-2 rounded-xl border p-3', st.ring)}>
        <st.Icon size={16} className={cn('mt-0.5 shrink-0', st.tx)} />
        <div className="text-xs leading-relaxed">
          <span className={cn('font-semibold', st.tx)}>{st.title}</span>
          <span className="txt-2"> — {st.msg}</span>
          <span className="ml-1 font-mono txt-3">(answer coverage {(precision * 100).toFixed(0)}% of the retrieved chunk)</span>
        </div>
      </div>

      {/* chunk cards */}
      <div className="grid gap-2 sm:grid-cols-2">
        {chunks.map((c, ci) => {
          const isRet = ci === retrieved
          const holds = c.start <= A_START && c.end >= A_END
          return (
            <div key={ci} className={cn('card p-2.5', isRet && 'ring-2 ring-brand-500')}>
              <div className="mb-1 flex items-center gap-2">
                <span className={cn('font-mono text-[11px] font-bold', isRet ? 'text-brand-500 dark:text-brand-300' : 'txt-2')}>chunk {ci + 1}</span>
                <span className="font-mono text-[10px] txt-3">[{c.start}–{c.end}]</span>
                {isRet && <span className="chip-brand ml-auto">retrieved</span>}
                {holds && <span className={cn('chip-green', !isRet && 'ml-auto')}>full answer</span>}
              </div>
              <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className={cn('h-full rounded-full', isRet ? 'bg-brand-500' : 'bg-zinc-400 dark:bg-zinc-600')} style={{ width: `${(c.score / maxScore) * 100}%` }} />
              </div>
              <p className="font-mono text-[10px] leading-snug txt-3">
                {WORDS.slice(c.start, c.end).join(' ')}
              </p>
              <div className="mt-1 font-mono text-[10px] txt-3">keyword hits: {c.score}</div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Chunk too small and you lose context — the answer gets <span className="text-rose-600 dark:text-rose-400">split at a boundary</span> and
        retrieval only returns a fragment. Chunk too big and retrieval gets <span className="text-amber-600 dark:text-amber-400">noisy and expensive</span> —
        the answer is there, drowned in unrelated tokens. <span className="txt-2">Overlap</span> re-includes boundary words so a spanning answer still
        lands whole in one chunk. There is no universal best size; you tune it against your own data with retrieval evals (Lesson m6-l4).
      </p>
    </div>
  )
}
