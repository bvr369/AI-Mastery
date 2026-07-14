import { useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Rate-limit survival: fire 8 requests at a 3-req/sec fake API.
 * Naive mode hammers; backoff mode waits smart. Watch the timeline fill.
 */

export default function DemoBackoff({ onInteract }) {
  const [mode, setMode] = useState('backoff')
  const [rows, setRows] = useState([])
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState(null)
  const timers = useRef([])

  const run = () => {
    onInteract?.()
    timers.current.forEach(clearTimeout)
    setRows([])
    setStats(null)
    setRunning(true)

    // simulate: server allows 3 requests per rolling second
    const events = []
    const windowHits = [] // timestamps of accepted requests
    let clock = 0

    for (let req = 0; req < 8; req++) {
      let attempt = 0
      let t = clock
      for (;;) {
        // prune window to last 1000ms
        while (windowHits.length && windowHits[0] <= t - 1000) windowHits.shift()
        if (windowHits.length < 3) {
          windowHits.push(t)
          events.push({ req, attempt, t, ok: true })
          break
        }
        events.push({ req, attempt, t, ok: false })
        attempt += 1
        if (mode === 'naive') {
          t += 120 // instant-ish retry
          if (attempt > 6) { events.push({ req, attempt, t, gaveUp: true }); break }
        } else {
          const wait = Math.min(4000, 500 * 2 ** (attempt - 1)) + Math.random() * 200 // expo + jitter
          t += wait
        }
      }
      clock += 150 // requests originate 150ms apart
    }

    const maxT = Math.max(...events.map((e) => e.t)) || 1
    const SPEED = 2400 / maxT // compress into ~2.4s of animation

    events.forEach((e) => {
      timers.current.push(setTimeout(() => {
        setRows((r) => [...r, { ...e, maxT }])
      }, e.t * SPEED))
    })
    timers.current.push(setTimeout(() => {
      const ok = events.filter((e) => e.ok).length
      const retries = events.filter((e) => !e.ok && !e.gaveUp).length
      const gaveUp = events.filter((e) => e.gaveUp).length
      setStats({ ok, retries, gaveUp, totalMs: Math.round(maxT) })
      setRunning(false)
    }, maxT * SPEED + 200))
  }

  const reset = () => { timers.current.forEach(clearTimeout); setRows([]); setStats(null); setRunning(false) }

  const lanes = Array.from({ length: 8 }, (_, i) => rows.filter((r) => r.req === i))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
          {[['naive', 'Naive retry'], ['backoff', 'Expo backoff + jitter']].map(([id, l]) => (
            <button key={id} onClick={() => { setMode(id); reset() }} className={cn('px-3 py-1.5 text-xs font-medium', mode === id ? 'bg-brand-500 text-white' : 'txt-2')}>{l}</button>
          ))}
        </div>
        <button onClick={run} disabled={running} className="btn-primary px-3 py-1.5 text-xs"><Play size={12} /> Fire 8 requests</button>
        <button onClick={reset} className="btn-ghost px-2 py-1.5 text-xs"><RotateCcw size={12} /></button>
        <span className="chip-zinc">fake API limit: 3 req/sec</span>
      </div>

      <div className="space-y-1 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        {lanes.map((lane, i) => (
          <div key={i} className="flex h-6 items-center gap-1">
            <span className="w-10 shrink-0 font-mono text-[10px] txt-3">req {i + 1}</span>
            <div className="relative h-4 flex-1">
              {lane.map((e, j) => (
                <span
                  key={j}
                  title={e.gaveUp ? 'gave up' : e.ok ? `success at ${Math.round(e.t)}ms` : `429 at ${Math.round(e.t)}ms`}
                  className={cn(
                    'absolute top-0 flex h-4 w-4 -translate-x-1/2 animate-pop-in items-center justify-center rounded-full text-[8px] font-bold text-white',
                    e.gaveUp ? 'bg-zinc-500' : e.ok ? 'bg-emerald-500' : 'bg-rose-500'
                  )}
                  style={{ left: `${(e.t / e.maxT) * 96 + 2}%` }}
                >
                  {e.gaveUp ? '–' : e.ok ? '✓' : '✗'}
                </span>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="py-4 text-center text-xs italic txt-3">Timeline renders here — red = 429 rejected, green = accepted.</p>}
      </div>

      {stats && (
        <div className="mt-3 grid animate-fade-up grid-cols-3 gap-2 text-center">
          <div className="card p-2.5"><div className="text-base font-bold text-emerald-500">{stats.ok}/8</div><div className="text-[10px] txt-3">succeeded</div></div>
          <div className="card p-2.5"><div className="text-base font-bold text-rose-500">{stats.retries}</div><div className="text-[10px] txt-3">429s absorbed</div></div>
          <div className="card p-2.5"><div className="text-base font-bold txt-1">{stats.gaveUp > 0 ? `${stats.gaveUp} gave up` : `${(stats.totalMs / 1000).toFixed(1)}s`}</div><div className="text-[10px] txt-3">{stats.gaveUp > 0 ? 'requests LOST' : 'to drain the burst'}</div></div>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Run both modes. Naive mode's instant retries land inside the same rate window — burning attempts and losing requests.
        Backoff waits let the window drain, so everything eventually succeeds. Jitter (the random extra wait) stops multiple servers from retrying in lockstep.
      </p>
    </div>
  )
}
