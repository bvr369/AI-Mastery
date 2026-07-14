import { useState } from 'react'
import { Play, RotateCcw, Trophy } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Run two prompt variants against a shared test set and score them.
 * Demonstrates eval-driven prompt iteration: pick the winner by data.
 */

const TEST_SET = [
  { input: '"The checkout button does nothing when clicked"', expected: 'bug' },
  { input: '"Please add support for Apple Pay"', expected: 'feature' },
  { input: '"What are your business hours?"', expected: 'question' },
  { input: '"I have been charged twice this month"', expected: 'billing' },
  { input: '"Love the new design, so clean!"', expected: 'praise' },
  { input: '"The export keeps timing out on large files"', expected: 'bug' },
]

// Prompt A (weak): zero-shot, no format constraint → verbose, mislabels edge cases
const RESULT_A = {
  0: 'bug', 1: 'feature', 2: 'question', 3: 'question', 4: 'feedback', 5: 'bug',
}
// Prompt B (strong): few-shot + strict label set → all correct
const RESULT_B = {
  0: 'bug', 1: 'feature', 2: 'question', 3: 'billing', 4: 'praise', 5: 'bug',
}

export default function DemoPromptAB({ onInteract }) {
  const [ran, setRan] = useState(false)
  const [progress, setProgress] = useState(0)

  const run = () => {
    onInteract?.()
    setRan(true)
    setProgress(0)
    TEST_SET.forEach((_, i) => setTimeout(() => setProgress(i + 1), (i + 1) * 350))
  }
  const reset = () => { setRan(false); setProgress(0) }

  const scoreA = TEST_SET.filter((t, i) => RESULT_A[i] === t.expected).length
  const scoreB = TEST_SET.filter((t, i) => RESULT_B[i] === t.expected).length

  return (
    <div>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-400/40 bg-brand-500/5 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-300">Prompt A</div>
          <div className="mt-0.5 text-xs txt-2">"Classify this support message."</div>
          <div className="text-[10px] txt-3">zero-shot, no fixed labels</div>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Prompt B</div>
          <div className="mt-0.5 text-xs txt-2">"Classify as exactly one of: bug, feature, question, billing, praise. Examples: …"</div>
          <div className="text-[10px] txt-3">few-shot + strict label set</div>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <button onClick={run} disabled={ran && progress < TEST_SET.length} className="btn-primary px-3 py-1.5 text-xs"><Play size={13} /> Run eval ({TEST_SET.length} cases)</button>
        <button onClick={reset} className="btn-ghost px-2 py-1.5 text-xs"><RotateCcw size={12} /></button>
      </div>

      {ran && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-2 py-1.5 text-left font-semibold txt-1">input</th>
                <th className="px-2 py-1.5 font-semibold txt-1">expected</th>
                <th className="px-2 py-1.5 font-semibold text-brand-500 dark:text-brand-300">A</th>
                <th className="px-2 py-1.5 font-semibold text-emerald-500">B</th>
              </tr>
            </thead>
            <tbody>
              {TEST_SET.slice(0, progress).map((t, i) => {
                const aOk = RESULT_A[i] === t.expected
                const bOk = RESULT_B[i] === t.expected
                return (
                  <tr key={i} className="animate-fade-up border-b border-zinc-200/60 last:border-0 dark:border-zinc-800/60">
                    <td className="max-w-[160px] truncate px-2 py-1.5 font-mono txt-2">{t.input}</td>
                    <td className="px-2 py-1.5 text-center font-mono txt-2">{t.expected}</td>
                    <td className={cn('px-2 py-1.5 text-center font-mono', aOk ? 'text-emerald-500' : 'text-rose-500')}>{RESULT_A[i]}{aOk ? '' : ' ✗'}</td>
                    <td className={cn('px-2 py-1.5 text-center font-mono', bOk ? 'text-emerald-500' : 'text-rose-500')}>{RESULT_B[i]}{bOk ? '' : ' ✗'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {ran && progress >= TEST_SET.length && (
        <div className="mt-3 grid animate-pop-in grid-cols-2 gap-2">
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-brand-500 dark:text-brand-300">{Math.round((scoreA / TEST_SET.length) * 100)}%</div>
            <div className="text-[10px] txt-3">Prompt A — {scoreA}/{TEST_SET.length}</div>
          </div>
          <div className="card border-emerald-500/40 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-emerald-500"><Trophy size={16} /> {Math.round((scoreB / TEST_SET.length) * 100)}%</div>
            <div className="text-[10px] txt-3">Prompt B — {scoreB}/{TEST_SET.length}</div>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Prompt B wins on the exact cases A fumbles: the "charged twice" billing case and the "love the design" praise case.
        Without this eval you'd never know — you'd ship A and wonder why billing tickets get mis-routed. <strong className="txt-2">Measure, don't guess.</strong>
      </p>
    </div>
  )
}
