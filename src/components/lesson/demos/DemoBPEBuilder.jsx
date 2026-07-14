import { useState } from 'react'
import { Combine, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Byte-Pair Encoding, learned for real. A tiny word-frequency corpus starts as
 * bare characters; each "Merge next" runs ONE genuine BPE step — count adjacent
 * symbol pairs (weighted by word frequency), merge the most frequent everywhere,
 * add it to the vocab. All counting/merging below is the real algorithm.
 */

const CORPUS = { low: 5, lower: 2, newest: 6, widest: 3, newer: 2 }
const END = '</w>' // end-of-word marker, shown as a muted ·
const TARGETS = ['newest', 'lowest']
const MAX_MERGES = 8

const initSeg = () => {
  const seg = {}
  for (const w of Object.keys(CORPUS)) seg[w] = [...w, END]
  return seg
}

// Count adjacent pairs across the corpus, weighted by word frequency.
// Returns rows sorted by count desc, tie-broken by earliest appearance (stable).
function pairStats(seg) {
  const map = new Map()
  let order = 0
  for (const [word, freq] of Object.entries(CORPUS)) {
    const syms = seg[word]
    for (let i = 0; i < syms.length - 1; i++) {
      const key = syms[i] + '' + syms[i + 1]
      const cur = map.get(key)
      if (cur) cur.count += freq
      else map.set(key, { a: syms[i], b: syms[i + 1], count: freq, order: order++ })
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.order - y.order)
}

// Merge every adjacent (a,b) occurrence into a single symbol a+b.
function applyMerge(syms, a, b) {
  const out = []
  for (let i = 0; i < syms.length; i++) {
    if (i < syms.length - 1 && syms[i] === a && syms[i + 1] === b) {
      out.push(a + b)
      i++
    } else out.push(syms[i])
  }
  return out
}

// Encode an arbitrary word by replaying the learned merges in order (real BPE inference).
function encode(word, merges) {
  let syms = [...word, END]
  for (const m of merges) syms = applyMerge(syms, m.a, m.b)
  return syms
}

const baseVocab = [...new Set(Object.keys(CORPUS).flatMap((w) => [...w]))].sort()
const show = (s) => s.replaceAll(END, '·')

export default function DemoBPEBuilder({ onInteract }) {
  const [seg, setSeg] = useState(initSeg)
  const [merges, setMerges] = useState([])
  const [stats, setStats] = useState(null) // pair table that produced the last merge
  const [justAdded, setJustAdded] = useState(null)

  const step = merges.length
  const done = step >= MAX_MERGES

  const mergeNext = () => {
    if (done) return
    onInteract?.()
    const rows = pairStats(seg)
    if (rows.length === 0) return
    const win = rows[0]
    const token = win.a + win.b
    const next = {}
    for (const w of Object.keys(seg)) next[w] = applyMerge(seg[w], win.a, win.b)
    setSeg(next)
    setMerges((m) => [...m, { a: win.a, b: win.b, freq: win.count, token }])
    setStats({ rows, win })
    setJustAdded(token)
  }

  const reset = () => {
    setSeg(initSeg()); setMerges([]); setStats(null); setJustAdded(null)
  }

  const vocab = [...baseVocab, ...merges.map((m) => m.token)]

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={mergeNext} disabled={done} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40">
          <Combine size={14} /> Merge next
        </button>
        <button onClick={reset} className="btn-ghost px-2 py-1.5 text-xs"><RotateCcw size={12} /> Reset</button>
        <span className="chip-brand ml-auto">merge {step} / {MAX_MERGES}</span>
        <span className="chip-zinc">{vocab.length} vocab</span>
      </div>

      {/* corpus segmentation — the live state of every word */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide txt-3">corpus segmentation</div>
        <div className="space-y-1.5">
          {Object.entries(CORPUS).map(([w, freq]) => (
            <div key={w} className="flex items-center gap-2">
              <span className="w-16 shrink-0 font-mono text-xs txt-2">{w}</span>
              <span className="chip-zinc shrink-0 !px-1.5 !py-0 text-[10px]">×{freq}</span>
              <div className="flex flex-wrap gap-1">
                {seg[w].map((s, i) => (
                  <span key={i} className={cn('rounded-md border px-1.5 py-0.5 font-mono text-xs', s === END ? 'border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600' : s.length > 1 ? 'border-brand-500/40 bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'border-zinc-300 txt-2 dark:border-zinc-700')}>
                    {show(s)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* pair-frequency table for the step just run */}
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide txt-3">pair frequencies {stats ? '(this step)' : ''}</div>
          {stats ? (
            <div className="space-y-1">
              {stats.rows.slice(0, 6).map((r) => {
                const isWin = r === stats.win
                return (
                  <div key={r.a + r.b} className={cn('flex items-center gap-2 rounded-md px-1.5 py-0.5 text-xs', isWin && 'bg-brand-500/15')}>
                    <span className={cn('flex-1 font-mono', isWin ? 'font-bold text-brand-600 dark:text-brand-300' : 'txt-2')}>
                      {show(r.a)} + {show(r.b)}
                    </span>
                    <span className={cn('tabular-nums', isWin ? 'font-bold text-brand-600 dark:text-brand-300' : 'txt-3')}>{r.count}</span>
                    {isWin && <span className="text-[9px] font-bold uppercase text-brand-500">win</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs italic txt-3">Hit “Merge next” — the most frequent adjacent pair wins and becomes one token.</p>
          )}
          {justAdded && (
            <div className="mt-2 border-t border-zinc-200 pt-2 text-xs dark:border-zinc-800">
              <span className="txt-3">new token: </span>
              <span className="rounded-md border border-brand-500/40 bg-brand-500/15 px-1.5 py-0.5 font-mono font-bold text-brand-700 dark:text-brand-300">{show(justAdded)}</span>
            </div>
          )}
        </div>

        {/* payoff: unseen target words tokenized by the merges learned so far */}
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide txt-3">tokenizing new words</div>
          <div className="space-y-2.5">
            {TARGETS.map((t) => {
              const toks = encode(t, merges)
              return (
                <div key={t}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="font-mono text-xs txt-2">{t}</span>
                    <span className={cn('text-[10px] tabular-nums', toks.length <= 2 ? 'text-emerald-500' : 'txt-3')}>{toks.length} tokens</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {toks.map((s, i) => (
                      <span key={i} className={cn('rounded-md border px-1.5 py-0.5 font-mono text-xs', s === END ? 'border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600' : s.length > 1 ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'border-zinc-300 txt-2 dark:border-zinc-700')}>
                        {show(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] txt-3">Same words, fewer tokens as merges accumulate — even combos never seen in training.</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        This is the real BPE learning loop. Production tokenizers run <span className="font-semibold txt-2">tens of thousands</span> of these
        merges over enormous corpora — which is why frequent words collapse into a single token while rare words stay split into pieces.
        That token count is exactly what you pay for (Lesson 1.4, token economics).
      </p>
    </div>
  )
}
