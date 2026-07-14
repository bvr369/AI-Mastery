import { useRef, useState } from 'react'
import { Play, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * The validate-and-retry loop, live: a flaky "model" returns JSON that's
 * sometimes broken; the validator catches it and retries with error feedback.
 */

const GOOD = { name: 'Aisha Kumar', email: 'aisha@example.com', intent: 'refund_request', priority: 3 }

const FAILURES = [
  { out: 'Sure! Here is the extracted data:\n{ "name": "Aisha Kumar", "email": "aisha@example.com", "intent": "refund_request", "priority": 3 }', err: 'JSON.parse failed: response contains prose around the JSON ("Sure! Here is…")' },
  { out: '{ "name": "Aisha Kumar", "email": "aisha@example.com", "intent": "refund_request" }', err: 'Schema error: missing required field "priority"' },
  { out: '{ "name": "Aisha Kumar", "email": "aisha@example.com", "intent": "refund_request", "priority": "high" }', err: 'Schema error: "priority" must be a number 1-5, got string "high"' },
]

export default function DemoStructured({ onInteract }) {
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)
  const [flaky, setFlaky] = useState(true)
  const timers = useRef([])

  const run = () => {
    onInteract?.()
    timers.current.forEach(clearTimeout)
    setLog([])
    setRunning(true)
    const steps = []
    const failCount = flaky ? 1 + Math.floor(Math.random() * 2) : 0
    for (let a = 0; a < failCount; a++) {
      const f = FAILURES[Math.floor(Math.random() * FAILURES.length)]
      steps.push({ kind: 'attempt', n: a + 1, out: f.out })
      steps.push({ kind: 'invalid', err: f.err })
      steps.push({ kind: 'retry', msg: `Retrying with feedback: "${f.err}. Return ONLY valid JSON."` })
    }
    steps.push({ kind: 'attempt', n: failCount + 1, out: JSON.stringify(GOOD, null, 2) })
    steps.push({ kind: 'valid' })

    steps.forEach((s, i) => {
      timers.current.push(setTimeout(() => {
        setLog((l) => [...l, s])
        if (i === steps.length - 1) setRunning(false)
      }, 500 + i * 800))
    })
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={running} className="btn-primary px-3 py-1.5 text-xs"><Play size={12} /> Extract data from messy email</button>
        <label className="flex cursor-pointer items-center gap-2 text-xs txt-2">
          <input type="checkbox" checked={flaky} onChange={(e) => setFlaky(e.target.checked)} className="accent-brand-500" />
          simulate flaky model (realistic)
        </label>
      </div>

      <div className="mb-2 rounded-xl border border-zinc-200 p-3 font-mono text-[11px] leading-relaxed txt-3 dark:border-zinc-800">
        <span className="text-brand-500 dark:text-brand-300">schema:</span> {'{ name: string, email: string, intent: enum, priority: number 1-5 }'}
      </div>

      <div className="min-h-[180px] space-y-2">
        {log.length === 0 && <p className="p-6 text-center text-sm italic txt-3">The attempt log appears here — run it a few times and count the retries.</p>}
        {log.map((s, i) => (
          <div key={i} className="animate-fade-up">
            {s.kind === 'attempt' && (
              <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest txt-3">model output — attempt {s.n}</div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed txt-1">{s.out}</pre>
              </div>
            )}
            {s.kind === 'invalid' && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <XCircle size={14} className="mt-0.5 shrink-0" /> <span><strong>Validator rejected:</strong> {s.err}</span>
              </div>
            )}
            {s.kind === 'retry' && <div className="pl-3 font-mono text-[11px] italic txt-3">↻ {s.msg}</div>}
            {s.kind === 'valid' && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span><strong>Valid — parsed object handed to your code.</strong> Your app never saw the broken attempts. That's the whole pattern.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className={cn('mt-2 text-xs leading-relaxed txt-3', running && 'opacity-60')}>
        The retry prompt INCLUDES the validator's error — models fix specific complaints far better than they obey vague "be careful" instructions.
        Production versions cap retries (2-3), then fall back or queue for review.
      </p>
    </div>
  )
}
