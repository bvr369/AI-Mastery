/**
 * Python async is the JS event loop with different keywords: one thread,
 * cooperative, yielding control at every await point while it waits on I/O.
 * 8s SMIL cycle: Task A runs → awaits (yields) → Task B runs → awaits → A resumes.
 */

// JS ↔ Python term pairs, shown as a shared vocabulary
const PAIRS = [
  { js: 'async function', py: 'async def' },
  { js: 'await fetch()', py: 'await httpx.get()' },
  { js: 'Promise.all', py: 'asyncio.gather' },
  { js: 'runtime', py: 'asyncio.run(main())' },
]

// Two tasks orbiting the loop; each has an await (yield) point
const TASKS = [
  { x: 70, label: 'Task A', note: 'await httpx.get()' },
  { x: 560, label: 'Task B', note: 'await httpx.get()' },
]

export default function DiagramPyAsync() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'

  return (
    <svg viewBox="0 0 760 340" className="w-full" role="img" aria-label="Python async works like the JavaScript event loop: a single-threaded loop runs one task until it hits await, the task yields control back to the loop so another task can run while it waits on I/O, then resumes">
      <text x="380" y="26" textAnchor="middle" fontSize="15" fontWeight="700" className={strong}>Same event loop, different keywords</text>

      {/* central event loop */}
      <circle cx="380" cy="150" r="58" className="fill-brand-500/10 stroke-brand-400/60" strokeWidth="1.4" />
      <text x="380" y="145" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">event loop</text>
      <text x="380" y="162" textAnchor="middle" fontSize="9.5" className={label}>single thread</text>
      {/* rotating hint on the loop */}
      <g>
        <circle cx="380" cy="92" r="4" className="fill-brand-500">
          <animateMotion dur="8s" repeatCount="indefinite" path="M 0 0 A 58 58 0 1 1 0 0.1" />
        </circle>
      </g>

      {/* task cards */}
      {TASKS.map((t, i) => (
        <g key={t.label}>
          <rect x={t.x} y="108" width="130" height="70" rx="14"
            className={cardCls(i)} strokeWidth="1.3" />
          <text x={t.x + 65} y="132" textAnchor="middle" fontSize="12" fontWeight="700" className={i === 0 ? 'fill-sky-600 dark:fill-sky-400' : 'fill-emerald-600 dark:fill-emerald-400'}>{t.label}</text>
          <text x={t.x + 65} y="150" textAnchor="middle" fontSize="9" fontFamily="monospace" className={label}>async def work()</text>
          <text x={t.x + 65} y="167" textAnchor="middle" fontSize="9" fontFamily="monospace" className={i === 0 ? 'fill-sky-600 dark:fill-sky-400' : 'fill-emerald-600 dark:fill-emerald-400'}>{t.note}</text>
        </g>
      ))}

      {/* connectors loop <-> tasks */}
      <line x1="200" y1="143" x2="322" y2="147" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.4" strokeDasharray="3 4" />
      <line x1="438" y1="147" x2="560" y2="143" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.4" strokeDasharray="3 4" />

      {/* control dot: A runs -> yields to loop -> B runs -> yields -> A resumes */}
      {/* phase legend near the moving dot */}
      <g opacity="0">
        <rect x="300" y="214" width="160" height="20" rx="10" className="fill-amber-500/15 stroke-amber-500/60" />
        <text x="380" y="228" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">await → yields control</text>
        <animate attributeName="opacity" values="0;0;1;1;0;0;1;1;0" keyTimes="0;0.22;0.27;0.35;0.4;0.72;0.77;0.85;0.9" dur="8s" repeatCount="indefinite" />
      </g>

      {/* the single control-flow dot */}
      <circle r="6" className="fill-brand-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5">
        <animateMotion dur="8s" repeatCount="indefinite" calcMode="linear"
          keyPoints="0;0;0.5;0.5;1;1"
          keyTimes="0;0.1;0.4;0.55;0.9;1"
          path="M 135 143 L 380 150 L 625 143 L 380 150 L 135 143" />
      </circle>
      {/* 'waiting on I/O' pulse over the idle task */}
      {[0, 1].map((i) => (
        <text key={i} x={i === 0 ? 625 : 135} y="98" textAnchor="middle" fontSize="9" className="fill-amber-600 dark:fill-amber-400" opacity="0">
          ⏳ waiting on I/O
          <animate attributeName="opacity" values="0;0;1;1;0"
            keyTimes="0;0.1;0.4;0.5;0.55" dur="8s" begin={`${i * 4}s`} repeatCount="indefinite" />
        </text>
      ))}

      {/* term-pair legend */}
      <text x="30" y="252" fontSize="11" fontWeight="700" className={strong}>JS you know</text>
      <text x="410" y="252" fontSize="11" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">Python equivalent</text>
      {PAIRS.map((p, i) => {
        const y = 268 + i * 17
        return (
          <g key={p.js}>
            <text x="30" y={y} fontSize="10.5" fontFamily="monospace" className={label}>{p.js}</text>
            <text x="228" y={y} fontSize="10.5" className="fill-zinc-400 dark:fill-zinc-600">↔</text>
            <text x="410" y={y} fontSize="10.5" fontFamily="monospace" className="fill-brand-600 dark:fill-brand-300">{p.py}</text>
          </g>
        )
      })}

      <text x="380" y="336" textAnchor="middle" fontSize="11" className={label}>await yields control so other work runs while you wait on I/O — the identical mental model to JS.</text>
    </svg>
  )
}

function cardCls(i) {
  return i === 0
    ? 'fill-sky-500/10 stroke-sky-500/50'
    : 'fill-emerald-500/10 stroke-emerald-500/50'
}
