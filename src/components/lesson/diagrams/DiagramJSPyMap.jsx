/** "You already know this" bridge: JavaScript concepts map 1:1 to Python — same ideas, different spelling. */

const ROWS = [
  { js: 'const / let x', py: 'x  (snake_case)', note: 'a variable' },
  { js: 'function f() {}', py: 'def f():', note: 'a function' },
  { js: '{ key: val }', py: '{ "key": val }', note: 'object → dict' },
  { js: '[ 1, 2, 3 ]', py: '[ 1, 2, 3 ]', note: 'array → list' },
  { js: 'async / await', py: 'async / await + asyncio', note: 'concurrency' },
  { js: 'class · this', py: 'class · self', note: 'objects' },
  { js: 'npm install', py: 'pip install', note: 'packages' },
]

export default function DiagramJSPyMap() {
  const top = 74
  const rh = 40
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const H = top + ROWS.length * rh + 46

  return (
    <svg viewBox={`0 0 760 ${H}`} className="w-full" role="img" aria-label="JavaScript concepts map one-to-one onto Python: const/let to a snake_case variable, function to def, object to dict, array to list, async/await to asyncio, class/this to class/self, npm to pip">
      {/* header */}
      <text x="380" y="28" textAnchor="middle" fontSize="15" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">The same ideas, different spelling</text>

      {/* column headers */}
      <g>
        <rect x="40" y="44" width="300" height="24" rx="8" className="fill-amber-500/10 stroke-amber-500/50" strokeWidth="1.2" />
        <text x="190" y="61" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">JavaScript — what you write now</text>
        <rect x="420" y="44" width="300" height="24" rx="8" className="fill-brand-500/10 stroke-brand-400/60" strokeWidth="1.2" />
        <text x="570" y="61" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">Python — same idea, new spelling</text>
      </g>

      {ROWS.map((r, i) => {
        const y = top + i * rh
        const cy = y + 15
        return (
          <g key={r.js}>
            {/* JS token */}
            <rect x="40" y={y} width="300" height="30" rx="9" className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" />
            <text x="56" y={cy + 4} fontSize="12" fontFamily="monospace" className="fill-zinc-800 dark:fill-zinc-100">{r.js}</text>

            {/* connector */}
            <line x1="340" y1={cy} x2="420" y2={cy} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" strokeDasharray="3 4" />
            <text x="380" y={cy - 6} textAnchor="middle" fontSize="8.5" className="fill-zinc-400 dark:fill-zinc-500">{r.note}</text>
            <circle r="3.5" cy={cy} className="fill-brand-500">
              <animate attributeName="cx" values="344;416" dur="2s" begin={`${i * 0.28}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${i * 0.28}s`} repeatCount="indefinite" />
            </circle>

            {/* Python token */}
            <rect x="420" y={y} width="300" height="30" rx="9" className="fill-brand-500/5 stroke-brand-400/50" />
            <text x="436" y={cy + 4} fontSize="12" fontFamily="monospace" className="fill-brand-700 dark:fill-brand-200">{r.py}</text>
          </g>
        )
      })}

      <text x="380" y={H - 20} textAnchor="middle" fontSize="11.5" className={label}>About 80% of Python is JavaScript you already write — only the syntax changes.</text>
    </svg>
  )
}
