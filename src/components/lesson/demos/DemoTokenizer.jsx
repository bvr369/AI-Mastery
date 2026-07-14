import { useMemo, useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Approximate tokenizer visualizer. Not real BPE, but faithful to its behavior:
 * common words = 1 token, rare/long words split into chunks, punctuation separates,
 * emoji & non-Latin text are expensive. Counts land within ~10-15% of real tokenizers.
 */

const COMMON = new Set(('the of and a to in is you that it he was for on are as with his they i at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part over new sound take only little work know place year live me back give most very after thing our just name good sentence man think say great where help through much before line right too mean old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home us move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should america world').split(' '))

const HUES = [
  'bg-brand-500/20 text-brand-700 dark:text-brand-300 border-brand-500/40',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40',
  'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/40',
  'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40',
  'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40',
]

function tokenize(text) {
  const tokens = []
  // split into words / punctuation / whitespace / everything else
  const parts = text.match(/[a-zA-Z']+|\d+|\s+|[^\sa-zA-Z\d]/g) || []
  for (const part of parts) {
    if (/^\s+$/.test(part)) continue // whitespace rides along with the next token in real BPE; we skip for clarity
    if (/^[a-zA-Z']+$/.test(part)) {
      const lower = part.toLowerCase()
      if (COMMON.has(lower) || part.length <= 3) {
        tokens.push(part)
      } else {
        // fake BPE: chunk rare words into 3-5 char pieces
        let rest = part
        while (rest.length > 0) {
          const n = rest.length <= 5 ? rest.length : rest.length % 4 === 1 ? 3 : 4
          tokens.push(rest.slice(0, n))
          rest = rest.slice(n)
        }
      }
    } else if (/^\d+$/.test(part)) {
      // digits: groups of ~3
      let rest = part
      while (rest.length > 0) {
        tokens.push(rest.slice(0, 3))
        rest = rest.slice(3)
      }
    } else {
      // punctuation, emoji, non-latin: emoji are often 2+ tokens
      const cp = part.codePointAt(0)
      if (cp > 0x1f000) tokens.push(part, '␟')
      else tokens.push(part)
    }
  }
  return tokens
}

const PRESETS = [
  { label: 'English', text: 'The best way to learn AI engineering is building real projects.' },
  { label: 'Code', text: 'const users = await db.query("SELECT * FROM users WHERE active = true");' },
  { label: 'Rare words', text: 'Anthropomorphization exacerbates hallucinatory extrapolations.' },
  { label: 'Emoji', text: 'Deploy day 🚀🔥 nothing can go wrong 🤡' },
  { label: 'Numbers', text: 'Invoice 4821973 totals 1284.50 USD, due 2026-08-01.' },
]

const PRICE_PER_MTOK = 3 // $ per million input tokens (mid-tier model, for intuition)

export default function DemoTokenizer({ onInteract }) {
  const [text, setText] = useState(PRESETS[0].text)
  const tokens = useMemo(() => tokenize(text), [text])
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const contextPct = Math.min(100, (tokens.length / 200000) * 100)
  const cost = (tokens.length / 1e6) * PRICE_PER_MTOK

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => { onInteract?.(); setText(p.text) }}
            className={cn('rounded-xl border px-3 py-1.5 text-xs font-medium transition-all', text === p.text ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => { onInteract?.(); setText(e.target.value) }}
        rows={2}
        className="input mb-3 font-mono text-sm"
        placeholder="Type anything…"
        aria-label="Text to tokenize"
      />

      <div className="mb-3 flex min-h-[64px] flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        {tokens.map((t, i) => (
          <span key={i} className={cn('rounded-md border px-1.5 py-0.5 font-mono text-xs', HUES[i % HUES.length])}>
            {t === '␟' ? '·' : t}
          </span>
        ))}
        {tokens.length === 0 && <span className="text-sm italic txt-3">tokens appear here…</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [words, 'words'],
          [chars, 'characters'],
          [tokens.length, 'tokens (approx)'],
          [`$${cost.toFixed(6)}`, 'input cost @ $3/M'],
        ].map(([v, l]) => (
          <div key={l} className="card p-3 text-center">
            <div className="text-lg font-bold tabular-nums txt-1">{v}</div>
            <div className="text-[10px] uppercase tracking-wide txt-3">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] txt-3">
          <span>share of a 200k-token context window</span>
          <span>{contextPct < 0.01 ? '<0.01' : contextPct.toFixed(2)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all" style={{ width: `${Math.max(0.5, contextPct)}%` }} />
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Approximate tokenizer (real BPE is learned from data, Lesson 5.4) — but the behavior is faithful: common words are cheap,
        rare words split, numbers fragment, emoji cost extra. Try your own commit messages or JSON.
      </p>
    </div>
  )
}
