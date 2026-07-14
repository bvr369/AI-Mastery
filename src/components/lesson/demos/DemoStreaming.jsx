import { useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Feel the difference: the same response delivered streamed vs all-at-once. */

const RESPONSE = 'Streaming works because generation is genuinely sequential: the model produces one token per loop iteration, and Server-Sent Events deliver each token the moment it exists. Your UI renders them immediately, so the user starts reading at ~300ms instead of staring at a spinner for the full six seconds. Total time is identical — perceived speed is transformed. This is the single highest-impact UX pattern in AI products.'

export default function DemoStreaming({ onInteract }) {
  const [mode, setMode] = useState('stream')
  const [delay, setDelay] = useState(45)
  const [shown, setShown] = useState('')
  const [running, setRunning] = useState(false)
  const [ttft, setTtft] = useState(null)
  const [total, setTotal] = useState(null)
  const timers = useRef([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const run = () => {
    onInteract?.()
    clear()
    setShown(''); setTtft(null); setTotal(null); setRunning(true)
    const tokens = RESPONSE.match(/\S+\s*/g)
    const totalMs = 400 + tokens.length * delay

    if (mode === 'stream') {
      tokens.forEach((tok, i) => {
        timers.current.push(setTimeout(() => {
          setShown((s) => s + tok)
          if (i === 0) setTtft(400 + delay)
          if (i === tokens.length - 1) { setTotal(totalMs); setRunning(false) }
        }, 400 + i * delay))
      })
    } else {
      timers.current.push(setTimeout(() => {
        setShown(RESPONSE)
        setTtft(totalMs)
        setTotal(totalMs)
        setRunning(false)
      }, totalMs))
    }
  }

  const reset = () => { clear(); setShown(''); setTtft(null); setTotal(null); setRunning(false) }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
          {[['stream', 'Streaming (SSE)'], ['wait', 'await json()']].map(([id, l]) => (
            <button key={id} onClick={() => { setMode(id); reset() }} className={cn('px-3 py-1.5 text-xs font-medium', mode === id ? 'bg-brand-500 text-white' : 'txt-2')}>{l}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs txt-2">
          token delay
          <input type="range" min="15" max="120" value={delay} onChange={(e) => setDelay(+e.target.value)} className="accent-brand-500" />
          <span className="w-12 tabular-nums txt-3">{delay}ms</span>
        </label>
        <button onClick={run} disabled={running} className="btn-primary px-3 py-1.5 text-xs"><Play size={12} /> Send request</button>
        <button onClick={reset} className="btn-ghost px-2 py-1.5 text-xs"><RotateCcw size={12} /></button>
      </div>

      <div className="min-h-[130px] rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
        {running && !shown && (
          <div className="flex items-center gap-2 text-sm txt-3">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            {mode === 'wait' ? 'waiting for the ENTIRE response…' : 'connecting…'}
          </div>
        )}
        <p className="text-sm leading-relaxed txt-1">
          {shown}
          {running && shown && <span className="ml-0.5 inline-block h-4 w-[7px] animate-pulse-soft bg-brand-500 align-middle" />}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className={cn('card p-3 text-center', ttft !== null && ttft < 1000 ? 'border-emerald-500/50' : '')}>
          <div className="text-lg font-bold tabular-nums txt-1">{ttft === null ? '—' : `${(ttft / 1000).toFixed(2)}s`}</div>
          <div className="text-[10px] uppercase tracking-wide txt-3">TTFT — when reading starts</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold tabular-nums txt-1">{total === null ? '—' : `${(total / 1000).toFixed(2)}s`}</div>
          <div className="text-[10px] uppercase tracking-wide txt-3">total generation time</div>
        </div>
      </div>
      <p className="mt-3 text-xs txt-3">Run both modes with the same delay. Total time is identical — but in stream mode you were reading the whole time. That gap between TTFT and total is free UX.</p>
    </div>
  )
}
