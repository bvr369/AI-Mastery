/** Project setup, translated: the Node/npm world mapped onto the Python equivalents. */

const PAIRS = [
  { node: 'npm install pkg', py: 'pip install pkg', role: 'add a dependency' },
  { node: 'package.json', py: 'pyproject.toml', role: 'declared deps' },
  { node: 'node_modules/', py: 'venv/', role: 'installed deps live here' },
  { node: 'npm run · npx', py: 'python -m', role: 'run scripts & tools' },
  { node: 'package-lock.json', py: 'pip freeze', role: 'pinned lockfile' },
  { node: 'nvm', py: 'pyenv', role: 'switch language versions' },
]

export default function DiagramNpmPip() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const rowH = 44
  const top = 84
  const nodeX = 70
  const pyX = 440
  const colW = 250

  return (
    <svg viewBox="0 0 760 400" className="w-full" role="img" aria-label="Node/npm project tooling mapped to the Python equivalents: npm install to pip install, package.json to pyproject.toml, node_modules to venv, npm run to python -m, package-lock.json to pip freeze, nvm to pyenv">
      <text x="380" y="34" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">Project setup, translated</text>

      {/* column headers */}
      <g>
        <rect x={nodeX} y="52" width={colW} height="26" rx="9" className="fill-emerald-500/10 stroke-emerald-500/50" strokeWidth="1.2" />
        <text x={nodeX + colW / 2} y="69" textAnchor="middle" fontSize="12.5" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">Node.js · npm</text>
        <rect x={pyX} y="52" width={colW} height="26" rx="9" className="fill-sky-500/10 stroke-sky-500/50" strokeWidth="1.2" />
        <text x={pyX + colW / 2} y="69" textAnchor="middle" fontSize="12.5" fontWeight="700" className="fill-sky-600 dark:fill-sky-400">Python</text>
      </g>

      {PAIRS.map((p, i) => {
        const y = top + i * rowH
        const cy = y + 17
        return (
          <g key={p.node}>
            {/* node cell */}
            <rect x={nodeX} y={y} width={colW} height="34" rx="10" className="fill-white stroke-zinc-300 dark:fill-zinc-900/60 dark:stroke-zinc-700" strokeWidth="1.1" />
            <text x={nodeX + 14} y={cy + 4} fontSize="12" fontFamily="monospace" className="fill-zinc-800 dark:fill-zinc-100">{p.node}</text>

            {/* python cell */}
            <rect x={pyX} y={y} width={colW} height="34" rx="10" className="fill-white stroke-zinc-300 dark:fill-zinc-900/60 dark:stroke-zinc-700" strokeWidth="1.1" />
            <text x={pyX + 14} y={cy + 4} fontSize="12" fontFamily="monospace" className="fill-zinc-800 dark:fill-zinc-100">{p.py}</text>

            {/* connector + role label */}
            <line x1={nodeX + colW} y1={cy} x2={pyX} y2={cy} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.4" strokeDasharray="3 4" />
            <text x={(nodeX + colW + pyX) / 2} y={cy - 5} textAnchor="middle" fontSize="8.5" className={label}>{p.role}</text>
            <circle r="3.2" cy={cy} className="fill-brand-500">
              <animate attributeName="cx" values={`${nodeX + colW + 4};${pyX - 4}`} dur="2.4s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )
      })}

      <text x="380" y="378" textAnchor="middle" fontSize="11" className={label}>venv is the node_modules you activate — one per project keeps deps isolated.</text>
    </svg>
  )
}
