/**
 * The context window as a conveyor: conversation tokens slide left;
 * whatever exits the window stops existing for the model.
 */

const TOKENS = ['sys', 'You', 'are', 'helpful', 'U:', 'My', 'name', 'is', 'Sam', 'A:', 'Hi', 'Sam!', 'U:', 'What', 'was', 'my', 'name?', '…']

export default function DiagramContextWindow() {
  const W = 46
  return (
    <svg viewBox="0 0 760 250" className="w-full" role="img" aria-label="Tokens slide through a fixed-size context window; tokens that fall out are forgotten by the model">
      <text x="380" y="26" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">The context window is a fixed-size conveyor belt</text>

      {/* forgotten zone */}
      <rect x="20" y="60" width="150" height="80" rx="12" className="fill-rose-500/5 stroke-rose-500/40" strokeDasharray="4 4" />
      <text x="95" y="50" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-rose-500">FORGOTTEN</text>
      <text x="95" y="158" textAnchor="middle" fontSize="9" className="fill-rose-400/80">does not exist for the model</text>

      {/* the window */}
      <rect x="190" y="56" width="480" height="88" rx="14" className="fill-brand-500/5 stroke-brand-400" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-brand-500 dark:fill-brand-300">CONTEXT WINDOW (what the model can see)</text>

      {/* sliding token belt */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="480 0; -100 0" dur="14s" repeatCount="indefinite" />
        {TOKENS.map((t, i) => (
          <g key={i}>
            <rect x={190 + i * (W + 6)} y="82" width={W} height="34" rx="8" className={t.endsWith(':') || t === 'sys' ? 'fill-amber-500/20 stroke-amber-500/60' : 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-600'} />
            <text x={190 + i * (W + 6) + W / 2} y="103" textAnchor="middle" fontSize="10" fontFamily="monospace" className="fill-zinc-700 dark:fill-zinc-200">{t}</text>
          </g>
        ))}
      </g>

      {/* masks so the belt visually clips outside interest zones — drawn as theme-aware covers */}
      <rect x="0" y="70" width="20" height="70" className="fill-white dark:fill-zinc-900" opacity="0" />

      {/* new tokens entering */}
      <text x="700" y="105" fontSize="18" className="fill-zinc-400">→</text>
      <text x="712" y="90" fontSize="9" className="fill-zinc-500 dark:fill-zinc-400" textAnchor="middle">new</text>
      <text x="712" y="120" fontSize="9" className="fill-zinc-500 dark:fill-zinc-400" textAnchor="middle">tokens</text>

      <text x="380" y="185" textAnchor="middle" fontSize="11" className="fill-zinc-500 dark:fill-zinc-400">When the chat outgrows the window, the oldest tokens fall off the left edge —</text>
      <text x="380" y="202" textAnchor="middle" fontSize="11" className="fill-zinc-500 dark:fill-zinc-400">the model doesn't "forget like a person"; that text simply is not in the input anymore.</text>
      <text x="380" y="232" textAnchor="middle" fontSize="10" className="fill-zinc-400 dark:fill-zinc-500">Real windows: 8k → 200k → 1M+ tokens. Bigger window = more memory = more cost per call.</text>
    </svg>
  )
}
