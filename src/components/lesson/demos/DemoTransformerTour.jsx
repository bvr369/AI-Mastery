import { useState } from 'react'
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Step-through of one token flowing through a transformer: tokenize -> embed ->
 * +positional -> attention -> feed-forward -> repeat -> unembed + sample.
 * Numbers are illustrative but internally consistent (the same 6-dim vector is
 * carried and progressively enriched stage to stage).
 */

// The focus token whose representation we trace through the stack.
const WORD = 'learn'
const TOKEN_ID = 6248

// A 6-dim vector, enriched at each stage. Kept short so it reads on mobile.
const EMBED = [0.21, -0.44, 0.67, 0.09, -0.31, 0.52]
const POS = [0.0, 0.84, 0.14, -0.76, 0.4, -0.1] // positional signal for position 4
const ADDED = EMBED.map((v, i) => +(v + POS[i]).toFixed(2))
const ATTN = [0.58, -0.12, 0.41, -0.33, 0.29, 0.77] // after gathering context
const FFN = [0.63, 0.05, 0.19, -0.51, 0.44, 0.61] // after independent transform
const DEEP = [1.12, -0.38, 0.94, -0.72, 0.68, 1.05] // richer, after N layers

// Illustrative logits over a tiny vocab -> softmax for the unembed stage.
const LOGITS = [
  { t: 'AI', z: 5.1 },
  { t: 'code', z: 4.2 },
  { t: 'fast', z: 2.6 },
  { t: 'math', z: 1.9 },
  { t: 'slowly', z: 0.4 },
]
const expd = LOGITS.map((l) => Math.exp(l.z))
const zSum = expd.reduce((a, b) => a + b, 0)
const PROBS = LOGITS.map((l, i) => ({ ...l, p: expd[i] / zSum }))

const STAGES = [
  {
    title: 'Tokenize',
    blurb: 'Your text is chopped into tokens, and each token maps to an integer id from the model vocabulary.',
    kind: 'token',
  },
  {
    title: 'Embed',
    blurb: 'Each id looks up a learned vector. The word is now a list of numbers the model can do math on.',
    kind: 'vec',
    vec: EMBED,
    note: 'token id → embedding vector',
  },
  {
    title: '+ Positional',
    blurb: 'A position signal is added so “learn” at position 4 differs from the same word elsewhere. Order now matters.',
    kind: 'vec',
    vec: ADDED,
    note: 'embedding + position 4 signal',
  },
  {
    title: 'Attention',
    blurb: 'The token looks at every other token and pulls in the context it needs, reshaping its own vector.',
    kind: 'attn',
    vec: ATTN,
    note: 'vector after gathering context',
  },
  {
    title: 'Feed-forward',
    blurb: 'Each token vector is passed through the same small network on its own — non-linear polish, no mixing between tokens.',
    kind: 'vec',
    vec: FFN,
    note: 'vector after per-token transform',
  },
  {
    title: 'Repeat × N',
    blurb: 'Attention + feed-forward form one layer. Stack dozens of them; the residual stream carries an ever-richer meaning.',
    kind: 'deep',
    vec: DEEP,
    note: 'residual stream after many layers',
  },
  {
    title: 'Unembed + Sample',
    blurb: 'The final vector is projected to a logit per vocab word, softmax turns those into probabilities, and one token is picked.',
    kind: 'logits',
  },
]

function Vector({ vec, highlight }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {vec.map((v, i) => (
        <span
          key={i}
          className={cn(
            'rounded-md border px-2 py-1 font-mono text-xs tabular-nums',
            highlight
              ? 'border-brand-500/40 bg-brand-500/15 text-brand-700 dark:text-brand-300'
              : 'border-zinc-300 txt-2 dark:border-zinc-700'
          )}
        >
          {v > 0 ? '+' : ''}{v.toFixed(2)}
        </span>
      ))}
    </div>
  )
}

export default function DemoTransformerTour({ onInteract }) {
  const [step, setStep] = useState(0)
  const s = STAGES[step]

  const advance = () => {
    onInteract?.()
    setStep((x) => Math.min(STAGES.length - 1, x + 1))
  }
  const back = () => setStep((x) => Math.max(0, x - 1))
  const restart = () => setStep(0)

  return (
    <div>
      {/* progress rail */}
      <div className="mb-3 flex items-center gap-1.5">
        {STAGES.map((st, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'h-1.5 w-full rounded-full transition-all',
                i < step ? 'bg-brand-500/50' : i === step ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-800'
              )}
            />
            <span className={cn('hidden text-[9px] sm:block', i === step ? 'text-brand-500 dark:text-brand-300' : 'txt-3')}>{i + 1}</span>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="chip-brand">Step {step + 1} of {STAGES.length}</span>
          <span className="font-mono text-xs txt-3">tracing “{WORD}”</span>
        </div>

        <h3 className="text-base font-bold txt-1">{s.title}</h3>
        <p className="mt-1 text-sm leading-relaxed txt-2">{s.blurb}</p>

        {/* per-stage visual */}
        <div className="mt-3 min-h-[92px] rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          {s.kind === 'token' && (
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="rounded-md bg-zinc-200 px-2 py-1 txt-1 dark:bg-zinc-800">“…best way to <b className="text-brand-500 dark:text-brand-300">{WORD}</b> AI…”</span>
              <ArrowRight size={16} className="txt-3" />
              <span className="rounded-md border border-brand-500/40 bg-brand-500/15 px-2 py-1 text-brand-700 dark:text-brand-300">{WORD}</span>
              <ArrowRight size={16} className="txt-3" />
              <span className="rounded-md border border-brand-500/40 bg-brand-500/15 px-2 py-1 tabular-nums text-brand-700 dark:text-brand-300">id {TOKEN_ID}</span>
            </div>
          )}

          {(s.kind === 'vec' || s.kind === 'deep') && (
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wide txt-3">{s.note}</div>
              <Vector vec={s.vec} highlight={s.kind === 'deep'} />
            </div>
          )}

          {s.kind === 'attn' && (
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-1 text-xs">
                {['best', 'way', 'to', 'learn', 'AI'].map((w) => (
                  <span
                    key={w}
                    className={cn(
                      'rounded-md px-1.5 py-0.5 font-mono',
                      w === 'learn'
                        ? 'bg-brand-500/20 font-bold text-brand-700 dark:text-brand-300'
                        : w === 'AI'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : 'txt-3'
                    )}
                  >
                    {w}
                  </span>
                ))}
                <span className="ml-1 text-[10px] txt-3">← “learn” attends most to “AI”</span>
              </div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wide txt-3">{s.note}</div>
              <Vector vec={s.vec} />
            </div>
          )}

          {s.kind === 'logits' && (
            <div className="space-y-1">
              {PROBS.map((c, i) => (
                <div key={c.t} className="flex items-center gap-2">
                  <span className={cn('w-14 shrink-0 text-right font-mono text-xs', i === 0 ? 'font-bold text-emerald-500' : 'txt-2')}>{c.t}</span>
                  <div className="h-3.5 flex-1 overflow-hidden rounded-md bg-zinc-200/60 dark:bg-zinc-800">
                    <div className={cn('h-full rounded-md', i === 0 ? 'bg-gradient-to-r from-brand-500 to-indigo-500' : 'bg-brand-500/40')} style={{ width: `${(c.p * 100).toFixed(1)}%` }} />
                  </div>
                  <span className="w-10 text-right text-[10px] tabular-nums txt-3">{(c.p * 100).toFixed(1)}%</span>
                </div>
              ))}
              <div className="pt-0.5 text-[10px] txt-3">softmax(logits) → next token: <b className="text-emerald-500">AI</b></div>
            </div>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center gap-2">
        <button onClick={back} disabled={step === 0} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40">
          <ArrowLeft size={13} /> Back
        </button>
        {step < STAGES.length - 1 ? (
          <button onClick={advance} className="btn-primary px-3 py-1.5 text-xs">Next stage <ArrowRight size={13} /></button>
        ) : (
          <span className="chip-green">Pipeline complete</span>
        )}
        <button onClick={restart} className="btn-ghost ml-auto px-2 py-1.5 text-xs"><RotateCcw size={12} /> Restart</button>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        A transformer is just this pipeline: embed, attend, transform, repeat, then unembed. Bigger models simply stack more
        layers over wider vectors — same skeleton, scaled up. Notice the vector never disappears; each stage only enriches it.
      </p>
    </div>
  )
}
