import { useState } from 'react'
import { ThumbsUp, RotateCcw, Brain } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Be the human in RLHF: pick the best response 3 times and watch
 * a toy reward model learn which traits you prefer.
 */

const ROUNDS = [
  {
    prompt: '“My code throws undefined is not a function. Help?”',
    options: [
      { text: 'That error means you called something that isn\'t a function. Check: (1) typos in the method name, (2) whether the variable is assigned before the call, (3) if an import is missing. Paste the stack trace line and I\'ll pinpoint it.', traits: { helpful: 3, concise: 1, honest: 2 } },
      { text: 'JavaScript errors occur for many reasons. Debugging is an important skill every developer should cultivate. Consider examining your code carefully.', traits: { helpful: 0, concise: 1, honest: 1 } },
      { text: 'Easy — your Node version is outdated. Upgrade to the latest Node and this error type disappears.', traits: { helpful: 1, concise: 3, honest: 0 } },
    ],
  },
  {
    prompt: '“Will this SQL query be slow on 10M rows?”',
    options: [
      { text: 'Impossible to say without the schema — but here\'s what matters: does the WHERE column have an index? Share EXPLAIN output and I\'ll tell you definitively. Without an index on user_id, yes, it will table-scan.', traits: { helpful: 3, concise: 2, honest: 3 } },
      { text: 'Yes it will definitely be slow. SQL databases struggle beyond a million rows; you should migrate to a NoSQL solution for scale.', traits: { helpful: 0, concise: 2, honest: 0 } },
      { text: 'Query performance depends on many factors including hardware, indexes, statistics, configuration, load, caching layers, and query structure.', traits: { helpful: 1, concise: 0, honest: 2 } },
    ],
  },
  {
    prompt: '“Summarize this 40-page contract for me.” (no contract attached)',
    options: [
      { text: 'I don\'t see the contract attached — could you paste the text or upload the file? Then I\'ll summarize it section by section.', traits: { helpful: 3, concise: 3, honest: 3 } },
      { text: 'Certainly! The contract outlines standard terms including payment schedules, liability clauses, and termination conditions typical of such agreements.', traits: { helpful: 0, concise: 2, honest: 0 } },
      { text: 'Contracts are complex legal documents. I recommend consulting a licensed attorney for a thorough professional review.', traits: { helpful: 1, concise: 2, honest: 2 } },
    ],
  },
]

const TRAITS = [
  ['helpful', 'Actually helpful', 'text-emerald-500'],
  ['honest', 'Honest about limits', 'text-sky-500'],
  ['concise', 'Concise', 'text-amber-500'],
]

export default function DemoRLHF({ onInteract }) {
  const [round, setRound] = useState(0)
  const [weights, setWeights] = useState({ helpful: 0, honest: 0, concise: 0 })
  const [picked, setPicked] = useState(null)
  const done = round >= ROUNDS.length

  const pick = (i) => {
    if (picked !== null) return
    onInteract?.()
    setPicked(i)
    const t = ROUNDS[round].options[i].traits
    setWeights((w) => ({ helpful: w.helpful + t.helpful, honest: w.honest + t.honest, concise: w.concise + t.concise }))
  }

  const next = () => { setRound((r) => r + 1); setPicked(null) }
  const restart = () => { setRound(0); setPicked(null); setWeights({ helpful: 0, honest: 0, concise: 0 }) }
  const maxW = Math.max(1, ...Object.values(weights))

  return (
    <div>
      {!done ? (
        <>
          <div className="mb-2 flex items-center justify-between text-xs txt-3">
            <span className="chip-brand">Labeling task {round + 1} / {ROUNDS.length}</span>
            <span>Click the response YOU would rank best</span>
          </div>
          <div className="mb-3 rounded-xl bg-zinc-100 p-3 text-sm font-medium txt-1 dark:bg-zinc-800/60">{ROUNDS[round].prompt}</div>
          <div className="space-y-2">
            {ROUNDS[round].options.map((o, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={cn(
                  'w-full rounded-xl border p-3 text-left text-xs leading-relaxed transition-all',
                  picked === null && 'border-zinc-300 txt-2 hover:border-brand-400 hover:bg-brand-500/5 dark:border-zinc-700',
                  picked === i && 'border-brand-500 bg-brand-500/10 txt-1',
                  picked !== null && picked !== i && 'border-zinc-200 opacity-50 dark:border-zinc-800'
                )}
              >
                {picked === i && <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-brand-500 dark:text-brand-300"><ThumbsUp size={11} /> your pick</span>}
                {o.text}
              </button>
            ))}
          </div>
          {picked !== null && <button onClick={next} className="btn-primary mt-3 w-full">{round + 1 >= ROUNDS.length ? 'See what the reward model learned' : 'Next labeling task'}</button>}
        </>
      ) : (
        <div className="animate-pop-in p-2 text-center">
          <Brain size={26} className="mx-auto mb-2 text-brand-500 dark:text-brand-300" />
          <div className="text-base font-bold txt-1">The reward model learned your taste</div>
          <p className="mx-auto mt-1 max-w-md text-xs txt-2">From just 3 rankings, it inferred trait weights. Scale this to millions of rankings and you get the "personality" of a production assistant.</p>
        </div>
      )}

      {/* live reward-model weights */}
      <div className="mt-4 rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest txt-3">🧮 Reward model — learned preferences</div>
        <div className="space-y-2">
          {TRAITS.map(([key, label, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={cn('w-36 shrink-0 text-xs font-medium', color)}>{label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500" style={{ width: `${(weights[key] / (maxW || 1)) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-xs tabular-nums txt-3">{weights[key]}</span>
            </div>
          ))}
        </div>
        {done && <button onClick={restart} className="btn-ghost mx-auto mt-3 flex text-xs"><RotateCcw size={12} /> Label again with different taste</button>}
      </div>
    </div>
  )
}
