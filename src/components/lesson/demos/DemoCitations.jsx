import { useState } from 'react'
import { ShieldCheck, MousePointerClick, AlertTriangle, Quote } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Grounded-with-citations vs ungrounded answering. Four numbered source snippets
 * hold the only facts the model is allowed to use. The grounded answer makes claims,
 * each tagged with an inline [n] marker you can click to reveal + verify the exact
 * source it came from. Toggle strict grounding off and an extra confident-but-uncited
 * (hallucinated) sentence slips in — the core failure citations are designed to catch.
 */

const QUESTION = 'How fast is the Peregrine falcon, and what makes its dive possible?'

// The ONLY facts the model may use. Each claim below must trace to one of these.
const SOURCES = [
  { id: 1, title: 'Raptor Field Guide, p.112', text: 'In a hunting stoop (dive), the peregrine falcon reaches speeds over 380 km/h, making it the fastest animal on Earth.' },
  { id: 2, title: 'Journal of Avian Aerodynamics, 2019', text: 'A third, bony tubercle in each nostril is thought to slow incoming air, letting the bird breathe at extreme dive speeds.' },
  { id: 3, title: 'Ornithology Today, Issue 44', text: 'Specialized nictitating membranes sweep across the eye during the stoop to clear debris and protect vision without blinding the bird.' },
  { id: 4, title: 'Bird Migration Atlas', text: 'Peregrine falcons are found on every continent except Antarctica and migrate up to 25,000 km in a single year.' },
]

// Each claim is a supported sentence + the source id that backs it.
const GROUNDED = [
  { text: 'In a dive, the peregrine reaches speeds over 380 km/h — the fastest of any animal.', cite: 1 },
  { text: 'A bony tubercle in each nostril slows the incoming air so it can still breathe.', cite: 2 },
  { text: 'A nictitating membrane sweeps across the eye to protect vision during the stoop.', cite: 3 },
]

// With strict grounding OFF, the model volunteers this extra, confident, UNSOURCED line.
const HALLUCINATION = 'It can also spot prey from over 8 km away and locks radar-like onto a single target.'

export default function DemoCitations({ onInteract }) {
  const [strict, setStrict] = useState(true)
  const [active, setActive] = useState(null) // source id being verified

  const fire = () => onInteract?.()

  const verify = (id) => {
    fire()
    setActive((prev) => (prev === id ? null : id))
  }

  const toggle = () => {
    fire()
    setStrict((s) => !s)
  }

  return (
    <div>
      {/* question + grounding toggle */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest txt-3">question</div>
          <div className="text-sm font-medium txt-1">{QUESTION}</div>
        </div>
        <button
          onClick={toggle}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
            strict
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400'
          )}
          aria-pressed={strict}
        >
          <ShieldCheck size={13} />
          strict grounding {strict ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* grounded answer */}
        <div className="card p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold txt-1">
            <Quote size={13} className="text-brand-500 dark:text-brand-300" /> Model answer
          </div>
          <p className="text-sm leading-relaxed txt-1">
            {GROUNDED.map((c, i) => (
              <span key={i}>
                {c.text}{' '}
                <button
                  onClick={() => verify(c.cite)}
                  className={cn(
                    'mr-1 inline-flex -translate-y-px items-center rounded px-1 py-0.5 align-middle font-mono text-[10px] font-bold tabular-nums transition-colors',
                    active === c.cite
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-500/15 text-brand-600 hover:bg-brand-500/25 dark:text-brand-300'
                  )}
                  aria-label={`Verify citation ${c.cite}`}
                >
                  [{c.cite}]
                </button>{' '}
              </span>
            ))}
            {!strict && (
              <span className="animate-fade-up rounded bg-rose-500/10 px-1 text-rose-600 dark:text-rose-400">
                {HALLUCINATION}
                <span className="ml-1 font-mono text-[10px] font-bold uppercase tracking-wide">[no source]</span>
              </span>
            )}
          </p>

          <div className="mt-3 flex items-start gap-1.5 border-t border-zinc-200 pt-2 text-[11px] leading-snug dark:border-zinc-800">
            {strict ? (
              <>
                <MousePointerClick size={13} className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-300" />
                <span className="txt-3">Every sentence carries a marker. Click a <span className="font-mono">[n]</span> to reveal the exact source and check the claim is really supported.</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-500" />
                <span className="txt-3">The highlighted sentence has <strong className="text-rose-600 dark:text-rose-400">no citation</strong> — it isn't in any source. That's a hallucination the model would abstain from under strict grounding.</span>
              </>
            )}
          </div>
        </div>

        {/* sources */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-widest txt-3">sources</div>
          {SOURCES.map((s) => {
            const on = active === s.id
            const cited = GROUNDED.some((c) => c.cite === s.id)
            return (
              <button
                key={s.id}
                onClick={() => verify(s.id)}
                className={cn(
                  'rounded-xl border p-2.5 text-left transition-all',
                  on
                    ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/40'
                    : 'border-zinc-200 hover:border-brand-400 dark:border-zinc-800'
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] font-bold',
                    on ? 'bg-brand-500 text-white' : 'bg-zinc-200 txt-2 dark:bg-zinc-800'
                  )}>{s.id}</span>
                  <span className="truncate text-[11px] font-semibold txt-2">{s.title}</span>
                  {on && <span className="ml-auto shrink-0 chip-green">verifying</span>}
                  {!on && !cited && <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wide txt-3">uncited</span>}
                </div>
                <p className={cn('text-[11px] leading-snug', on ? 'txt-1' : 'txt-3')}>{s.text}</p>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Citations make AI answers <span className="txt-2">auditable</span> — every claim traces back to a source you can open and check.
        Requiring the model to cite (and to <span className="txt-2">abstain</span> when the sources don't support a claim, rather than
        inventing one) is a core hallucination defense for <span className="font-mono text-brand-500 dark:text-brand-300">RAG</span> systems:
        an unsupported sentence like the one above should never make it into a grounded answer.
      </p>
    </div>
  )
}
