import { useState } from 'react'
import { Brain, Zap, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Chain-of-thought reveal: the same tricky question answered with and without
 * step-by-step reasoning. Direct answer trips the trap; reasoning gets it right.
 */

const PROBLEMS = [
  {
    q: 'A bat and a ball cost $1.10 total. The bat costs $1.00 more than the ball. How much is the ball?',
    direct: '$0.10',
    directWrong: true,
    steps: ['Let ball = x, so bat = x + $1.00', 'x + (x + 1.00) = 1.10', '2x + 1.00 = 1.10', '2x = 0.10, so x = 0.05'],
    answer: '$0.05',
  },
  {
    q: 'If it takes 5 machines 5 minutes to make 5 widgets, how long for 100 machines to make 100 widgets?',
    direct: '100 minutes',
    directWrong: true,
    steps: ['5 machines make 5 widgets in 5 min → 1 machine makes 1 widget in 5 min', 'Each machine works in parallel', '100 machines make 100 widgets in the same 5 min'],
    answer: '5 minutes',
  },
  {
    q: 'I have 3 apples. I eat one, buy a bag of 6, give away 2, then split the rest evenly with a friend. How many do I have?',
    direct: '6 apples',
    directWrong: true,
    steps: ['Start: 3 apples', 'Eat one: 3 − 1 = 2', 'Buy 6: 2 + 6 = 8', 'Give away 2: 8 − 2 = 6', 'Split evenly with a friend: 6 ÷ 2 = 3'],
    answer: '3 apples',
  },
]

export default function DemoCoT({ onInteract }) {
  const [idx, setIdx] = useState(0)
  const [mode, setMode] = useState(null) // 'direct' | 'cot'
  const [revealedSteps, setRevealedSteps] = useState(0)
  const p = PROBLEMS[idx]

  const runCoT = () => {
    onInteract?.()
    setMode('cot')
    setRevealedSteps(0)
    p.steps.forEach((_, i) => setTimeout(() => setRevealedSteps(i + 1), (i + 1) * 600))
  }
  const runDirect = () => { onInteract?.(); setMode('direct'); setRevealedSteps(0) }
  const nextProblem = () => { setIdx((i) => (i + 1) % PROBLEMS.length); setMode(null); setRevealedSteps(0) }

  return (
    <div>
      <div className="mb-3 rounded-xl bg-zinc-100 p-3 text-sm font-medium txt-1 dark:bg-zinc-800/60">{p.q}</div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={runDirect} className={cn('btn px-3 py-1.5 text-xs', mode === 'direct' ? 'bg-rose-500 text-white' : 'btn-outline')}>
          <Zap size={13} /> Answer directly
        </button>
        <button onClick={runCoT} className={cn('btn px-3 py-1.5 text-xs', mode === 'cot' ? 'bg-emerald-500 text-white' : 'btn-outline')}>
          <Brain size={13} /> Think step by step
        </button>
        <button onClick={nextProblem} className="btn-ghost px-2 py-1.5 text-xs"><RotateCcw size={12} /> Another problem</button>
      </div>

      {mode === 'direct' && (
        <div className="animate-fade-up rounded-xl border border-rose-500/40 bg-rose-500/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500">direct answer (no reasoning)</div>
          <div className="mt-1 text-lg font-bold txt-1">{p.direct}</div>
          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">✗ Wrong — this is the intuitive trap. The model pattern-matched to the "obvious" answer instead of working it out.</div>
        </div>
      )}

      {mode === 'cot' && (
        <div className="animate-fade-up rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">step-by-step reasoning</div>
          <ol className="mt-2 space-y-1.5">
            {p.steps.slice(0, revealedSteps).map((s, i) => (
              <li key={i} className="flex animate-fade-up gap-2 font-mono text-xs txt-2">
                <span className="font-bold text-emerald-500">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
          {revealedSteps >= p.steps.length && (
            <div className="mt-2 animate-pop-in text-sm font-bold text-emerald-600 dark:text-emerald-400">Answer: {p.answer} ✓</div>
          )}
        </div>
      )}

      {!mode && <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-xs italic txt-3 dark:border-zinc-700">Try "answer directly" first, then "think step by step" — same question, same model.</p>}

      <p className="mt-3 text-xs leading-relaxed txt-3">
        These are famous "cognitive reflection" traps. Forcing the model to reason BEFORE answering routes it around the intuitive-but-wrong pattern.
        In practice: add "think step by step", show worked examples, or use a reasoning model that does this internally.
      </p>
    </div>
  )
}
