import { useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Few-shot classifier: add examples and watch a "model" go from
 * verbose/inconsistent (zero-shot) to crisp one-word labels.
 */

const TEST_INPUTS = [
  { text: 'The app crashes every time I open it.', label: 'bug' },
  { text: 'Could you add a dark mode please?', label: 'feature' },
  { text: 'How do I reset my password?', label: 'question' },
  { text: 'Your product is garbage and support is worse.', label: 'complaint' },
]

const EXAMPLES = [
  { text: '"It keeps freezing on checkout" → bug', label: 'bug' },
  { text: '"Wish it could export to PDF" → feature', label: 'feature' },
  { text: '"Where is the settings page?" → question', label: 'question' },
  { text: '"This is the worst app ever" → complaint', label: 'complaint' },
]

// zero-shot: verbose, sometimes wrong format
const ZERO_SHOT = {
  bug: 'This appears to describe a technical problem or malfunction, which I would categorize as a bug report.',
  feature: 'The user seems to be requesting new functionality — this could be considered a feature request.',
  question: 'This looks like the user is asking for help or information.',
  complaint: 'The tone here is quite negative; this is likely a complaint or negative feedback.',
}

export default function DemoFewShot({ onInteract }) {
  const [shots, setShots] = useState(0) // number of examples included

  const setN = (n) => { onInteract?.(); setShots(n) }
  const includedExamples = EXAMPLES.slice(0, shots)

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium txt-2">Examples in prompt:</span>
        {[0, 1, 2, 4].map((n) => (
          <button key={n} onClick={() => setN(n)} className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium', shots === n ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 dark:border-zinc-700')}>
            {n === 0 ? 'zero-shot' : `${n}-shot`}
          </button>
        ))}
      </div>

      {includedExamples.length > 0 && (
        <div className="mb-3 rounded-xl border border-brand-400/30 bg-brand-500/5 p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-300">examples teaching the pattern</div>
          {includedExamples.map((e, i) => <div key={i} className="font-mono text-xs txt-2">{e.text}</div>)}
        </div>
      )}

      <div className="space-y-2">
        {TEST_INPUTS.map((t, i) => {
          const correct = shots >= 1
          const output = correct ? t.label : ZERO_SHOT[t.label]
          return (
            <div key={i} className="rounded-xl border border-zinc-200 p-2.5 dark:border-zinc-800">
              <div className="mb-1 font-mono text-xs txt-2">"{t.text}"</div>
              <div className={cn('flex items-center gap-2 text-xs', correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                <span className="txt-3">→</span>
                {correct ? <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono font-semibold">{output}</span> : <span className="italic">{output}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className={cn('mt-3 rounded-xl p-3 text-xs leading-relaxed', shots === 0 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}>
        {shots === 0
          ? 'Zero-shot: the model understands the task but invents its own verbose format — impossible to parse reliably in code.'
          : `${shots}-shot: the examples pinned down the EXACT output format (one lowercase word). Even one example transforms consistency. This is in-context learning — no training, just examples in the prompt.`}
      </div>
    </div>
  )
}
