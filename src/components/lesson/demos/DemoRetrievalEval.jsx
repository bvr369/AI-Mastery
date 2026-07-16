import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, CircleDashed, Target, Wand2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Measure the RETRIEVER, not the model. A fixed query + 10 doc chunks with baked
 * bi-encoder similarity scores and a ground-truth relevant set (3 of 10). Tune
 * top-K, a similarity threshold, and an optional reranker, then watch REAL
 * precision / recall recompute. The trap: lexical false positives ("reset your
 * device", "update your password") out-score a truly relevant chunk, so the
 * bi-encoder alone can't hit the target — you need the reranker. Eval discipline.
 */

const QUERY = 'How do I reset my forgotten password?'
const TOTAL_RELEVANT = 3
const ANSWER_ID = 1 // the chunk that actually contains the answer

// sim = bi-encoder cosine; rerank = cross-encoder score (sharper, order-changing).
// Relevant chunks (1,2,3) truly answer the query. 4,5,7 are lexical false positives.
const CHUNKS = [
  { id: 1, text: "Click 'Forgot password' on the login page and follow the emailed reset link.", relevant: true, sim: 0.81, rerank: 0.95 },
  { id: 2, text: 'Password reset links expire 30 minutes after they are requested.', relevant: true, sim: 0.74, rerank: 0.88 },
  { id: 4, text: 'Update your password regularly to keep your account secure.', relevant: false, sim: 0.72, rerank: 0.40 },
  { id: 5, text: 'Passwords must be at least 12 characters and include a symbol.', relevant: false, sim: 0.66, rerank: 0.34 },
  { id: 3, text: 'Forgot your password? Request a reset from your account settings.', relevant: true, sim: 0.63, rerank: 0.91 },
  { id: 7, text: 'Reset your device to factory settings from the system menu.', relevant: false, sim: 0.58, rerank: 0.12 },
  { id: 8, text: "Contact support if you're locked out of your account entirely.", relevant: false, sim: 0.51, rerank: 0.28 },
  { id: 6, text: 'Two-factor authentication adds a second step at login.', relevant: false, sim: 0.44, rerank: 0.18 },
  { id: 9, text: 'Change your billing email address in the Payments tab.', relevant: false, sim: 0.33, rerank: 0.09 },
  { id: 10, text: 'Our mobile app lets you manage push notifications.', relevant: false, sim: 0.22, rerank: 0.05 },
]

const Bar = ({ value, good }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
    <div
      className={cn('h-full rounded-full transition-all duration-300', good ? 'bg-emerald-500' : 'bg-amber-500')}
      style={{ width: `${Math.round(value * 100)}%` }}
    />
  </div>
)

export default function DemoRetrievalEval({ onInteract }) {
  const [topK, setTopK] = useState(3)
  const [threshold, setThreshold] = useState(0.3)
  const [rerank, setRerank] = useState(false)

  const touch = () => onInteract?.()

  const { rows, precision, recall, answerHit, passed } = useMemo(() => {
    const ranked = CHUNKS
      .map((c) => ({ ...c, score: rerank ? c.rerank : c.sim }))
      .sort((a, b) => b.score - a.score)
    const eligible = ranked.filter((c) => c.score >= threshold)
    const keepIds = new Set(eligible.slice(0, topK).map((c) => c.id))

    const rows = ranked.map((c) => ({ ...c, retrieved: keepIds.has(c.id) }))
    const retrieved = rows.filter((c) => c.retrieved)
    const relHit = retrieved.filter((c) => c.relevant).length
    const precision = retrieved.length ? relHit / retrieved.length : 0
    const recall = relHit / TOTAL_RELEVANT
    return {
      rows,
      precision,
      recall,
      answerHit: keepIds.has(ANSWER_ID),
      passed: recall >= 0.8 && precision > 0.6,
    }
  }, [topK, threshold, rerank])

  return (
    <div>
      {/* query */}
      <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest txt-3">query</div>
        <div className="font-mono text-sm txt-1">{QUERY}</div>
        <div className="mt-1 text-[11px] txt-3">
          Ground truth: <span className="font-semibold text-emerald-600 dark:text-emerald-400">3 of 10</span> chunks are truly relevant · the answer lives in chunk #{ANSWER_ID}
        </div>
      </div>

      {/* controls */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div className="card p-3">
          <div className="flex justify-between text-xs">
            <span className="font-mono font-semibold txt-1">top-K</span>
            <span className="tabular-nums text-brand-500 dark:text-brand-300">{topK}</span>
          </div>
          <input type="range" min={1} max={8} step={1} value={topK}
            onChange={(e) => { touch(); setTopK(+e.target.value) }}
            className="mt-1 w-full accent-brand-500" aria-label="top K" />
          <div className="text-[10px] txt-3">how many chunks you retrieve — more raises recall, dilutes precision</div>
        </div>
        <div className="card p-3">
          <div className="flex justify-between text-xs">
            <span className="font-mono font-semibold txt-1">similarity threshold</span>
            <span className="tabular-nums text-brand-500 dark:text-brand-300">{threshold.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={0.9} step={0.01} value={threshold}
            onChange={(e) => { touch(); setThreshold(+e.target.value) }}
            className="mt-1 w-full accent-brand-500" aria-label="similarity threshold" />
          <div className="text-[10px] txt-3">drop any chunk scoring below this before the top-K cut</div>
        </div>
      </div>

      <button
        onClick={() => { touch(); setRerank((v) => !v) }}
        className={cn('mb-3 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all',
          rerank ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}
      >
        <Wand2 size={14} className="shrink-0" />
        <span className="font-semibold">reranker {rerank ? 'ON' : 'OFF'}</span>
        <span className="txt-3">— a cross-encoder re-scores candidates; kills lexical false positives</span>
      </button>

      <div className="grid gap-3 lg:grid-cols-[1fr_210px]">
        {/* ranked list */}
        <div className="space-y-1.5">
          {rows.map((c) => {
            const status = c.retrieved
              ? (c.relevant ? 'hit' : 'fp')
              : (c.relevant ? 'miss' : 'skip')
            return (
              <div key={c.id}
                className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
                  c.retrieved ? 'border-brand-400/60 bg-brand-500/5' : 'border-zinc-200 opacity-60 dark:border-zinc-800')}
              >
                {status === 'hit' && <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />}
                {status === 'fp' && <XCircle size={15} className="shrink-0 text-rose-500" />}
                {status === 'miss' && <CircleDashed size={15} className="shrink-0 text-amber-500" />}
                {status === 'skip' && <CircleDashed size={15} className="shrink-0 text-zinc-400 dark:text-zinc-600" />}
                <span className="min-w-0 flex-1 truncate text-[11px] txt-1">{c.text}</span>
                {c.id === ANSWER_ID && <span className="chip-brand shrink-0 !px-1.5 !py-0 text-[9px]">answer</span>}
                <span className="shrink-0 font-mono text-[10px] tabular-nums txt-3">{c.score.toFixed(2)}</span>
              </div>
            )
          })}
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] txt-3">
            <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> relevant hit</span>
            <span className="flex items-center gap-1"><XCircle size={11} className="text-rose-500" /> false positive</span>
            <span className="flex items-center gap-1"><CircleDashed size={11} className="text-amber-500" /> relevant, missed</span>
          </div>
        </div>

        {/* metrics */}
        <div className="flex flex-col gap-3">
          <div className="card p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-semibold txt-1">Precision</span>
              <span className={cn('font-mono text-sm font-bold tabular-nums', precision > 0.6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>{precision.toFixed(2)}</span>
            </div>
            <Bar value={precision} good={precision > 0.6} />
            <div className="mt-1 text-[10px] txt-3">relevant ÷ retrieved — how clean the results are</div>

            <div className="mb-1 mt-3 flex items-baseline justify-between">
              <span className="text-xs font-semibold txt-1">Recall</span>
              <span className={cn('font-mono text-sm font-bold tabular-nums', recall >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>{recall.toFixed(2)}</span>
            </div>
            <Bar value={recall} good={recall >= 0.8} />
            <div className="mt-1 text-[10px] txt-3">found ÷ all relevant — how much you missed</div>

            <div className={cn('mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium',
              answerHit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400')}>
              {answerHit ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              answer chunk {answerHit ? 'retrieved' : 'MISSED — model can’t answer'}
            </div>
          </div>

          <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all',
            passed ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-zinc-300 txt-2 dark:border-zinc-700')}>
            <Target size={15} className="shrink-0" />
            <span><span className="font-semibold">Goal:</span> recall ≥ 0.80 &amp; precision &gt; 0.60 {passed ? '— cleared!' : '— not yet'}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        When a RAG answer is wrong, the cause is usually <span className="txt-2">retrieval, not the model</span> — if the answer chunk never
        made the cut, no LLM can save you. Measure <span className="font-mono text-brand-500 dark:text-brand-300">precision</span> and{' '}
        <span className="font-mono text-brand-500 dark:text-brand-300">recall</span> on the retriever first. Notice the trap: raising top-K lifts recall but
        drags precision down, and lexical look-alikes ("reset your device", "update your password") out-score a real answer — the bi-encoder alone
        can't beat the target. Turn the reranker on. This eval discipline is what separates a demo from a product (Module 10).
      </p>
    </div>
  )
}
