import { useEffect, useRef, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * "Same prompt, different output" — a canned generator that demonstrates
 * non-determinism without needing an API key. Outputs are pre-written.
 */

const PROMPTS = [
  {
    label: 'Write a tagline for a tiny coffee shop',
    focused: [
      'Small cup. Big mornings.',
      'Your daily ritual, perfected.',
      'Coffee worth slowing down for.',
    ],
    creative: [
      'A caffeine cathedral for the sleep-deprived. ☕',
      'We speak fluent espresso.',
      'Where Wi-Fi is fast and mornings are forgiven.',
    ],
  },
  {
    label: 'Explain React state to a 10-year-old',
    focused: [
      "State is a component's memory. When it changes, React redraws the screen to match.",
      'State is like a scoreboard: the game updates the number, and everyone watching sees it change instantly.',
      "State is the stuff a component remembers between renders — like what you typed in a box.",
    ],
    creative: [
      "Imagine your component is a snowman with a magic belly. Whatever you put in the belly (state) changes how the snowman looks — new hat, new smile — instantly! ⛄",
      "State is your component's diary. Every time it writes a new entry, it also redecorates its whole room to match the mood.",
      'Think of a Tamagotchi: feed it (setState) and its little face changes. That face? That\'s state.',
    ],
  },
  {
    label: 'Name a robot cat',
    focused: ['Whiskers-9', 'Circuit', 'Robo-Mittens'],
    creative: ['Sir Purrs-a-Lot v2.0', 'Meowtrix', 'Nyanotech 3000 🐾'],
  },
]

export default function DemoPossibilities({ onInteract }) {
  const [promptIdx, setPromptIdx] = useState(0)
  const [creative, setCreative] = useState(false)
  const [output, setOutput] = useState('')
  const [typed, setTyped] = useState('')
  const [runs, setRuns] = useState(0)
  const lastPick = useRef(-1)
  const timer = useRef(null)

  // typewriter effect
  useEffect(() => {
    clearInterval(timer.current)
    setTyped('')
    if (!output) return
    let i = 0
    timer.current = setInterval(() => {
      i += 1
      setTyped(output.slice(0, i))
      if (i >= output.length) clearInterval(timer.current)
    }, 16)
    return () => clearInterval(timer.current)
  }, [output])

  const generate = () => {
    onInteract?.()
    const pool = creative ? PROMPTS[promptIdx].creative : PROMPTS[promptIdx].focused
    let pick
    do {
      pick = Math.floor(Math.random() * pool.length)
    } while (pool.length > 1 && pick === lastPick.current)
    lastPick.current = pick
    setOutput(pool[pick])
    setRuns((r) => r + 1)
  }

  const selectPrompt = (i) => {
    setPromptIdx(i)
    setOutput('')
    setRuns(0)
    lastPick.current = -1
  }

  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide txt-3">1 · Pick a prompt</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => selectPrompt(i)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              i === promptIdx
                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={generate} className="btn-primary">
          {runs === 0 ? <Sparkles size={15} /> : <RefreshCw size={15} />}
          {runs === 0 ? 'Generate' : 'Generate again'}
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium txt-2">
          <span
            role="switch"
            aria-checked={creative}
            onClick={() => setCreative((c) => !c)}
            className={cn('relative h-5 w-9 rounded-full transition-colors', creative ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-700')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', creative ? 'left-[18px]' : 'left-0.5')} />
          </span>
          Creative mode {creative ? '(high temperature)' : '(low temperature)'}
        </label>
        {runs > 1 && <span className="chip-amber animate-pop-in">run #{runs} — notice it changed?</span>}
      </div>

      <div className="min-h-[72px] rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
        {typed ? (
          <p className="text-sm leading-relaxed txt-1">
            {typed}
            {typed.length < output.length && <span className="ml-0.5 inline-block h-4 w-[7px] animate-pulse-soft bg-brand-500 align-middle" />}
          </p>
        ) : (
          <p className="text-sm italic txt-3">Output appears here — hit Generate a few times and watch it change.</p>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        This demo uses pre-written outputs (no API), but the behavior is real: an LLM <strong className="txt-2">samples</strong> from
        probabilities, so the same prompt gives different results each run. Creative mode = higher temperature = wilder picks.
      </p>
    </div>
  )
}
