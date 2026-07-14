/** Zero-shot vs few-shot: examples in the prompt teach the pattern in-context. */

export default function DiagramFewShot() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 290" className="w-full" role="img" aria-label="Zero-shot gives instructions only; few-shot adds worked examples that teach the model the exact pattern to follow">
      {/* zero-shot */}
      <text x="190" y="26" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>Zero-shot</text>
      <rect x="40" y="42" width="300" height="70" rx="12" className={box} />
      <text x="56" y="64" fontSize="10.5" fontFamily="monospace" className="fill-zinc-600 dark:fill-zinc-300">"Classify sentiment: 'shipping was slow'"</text>
      <text x="56" y="92" fontSize="9.5" className={label}>instruction only — model guesses your format</text>

      <line x1="190" y1="112" x2="190" y2="140" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
      <rect x="90" y="142" width="200" height="34" rx="9" className="fill-amber-500/10 stroke-amber-500/50" />
      <text x="190" y="164" textAnchor="middle" fontSize="10.5" className="fill-amber-600 dark:fill-amber-400">"This has a negative tone because…"</text>
      <text x="190" y="196" textAnchor="middle" fontSize="9" className={label}>verbose, inconsistent shape ✗</text>

      {/* few-shot */}
      <text x="570" y="26" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>Few-shot</text>
      <rect x="420" y="42" width="300" height="70" rx="12" className="fill-brand-500/5 stroke-brand-400/60" />
      <text x="436" y="60" fontSize="9.5" fontFamily="monospace" className="fill-brand-600 dark:fill-brand-300">"great product" → positive</text>
      <text x="436" y="76" fontSize="9.5" fontFamily="monospace" className="fill-brand-600 dark:fill-brand-300">"broke instantly" → negative</text>
      <text x="436" y="92" fontSize="9.5" fontFamily="monospace" className="fill-zinc-600 dark:fill-zinc-300">"shipping was slow" →</text>
      <text x="436" y="106" fontSize="8.5" className={label}>examples TEACH the exact format</text>

      <line x1="570" y1="112" x2="570" y2="140" className="stroke-brand-400" strokeWidth="1.5" />
      <rect x="490" y="142" width="160" height="34" rx="9" className="fill-emerald-500/10 stroke-emerald-500/60" />
      <text x="570" y="164" textAnchor="middle" fontSize="11" fontFamily="monospace" className="fill-emerald-600 dark:fill-emerald-400">negative</text>
      <text x="570" y="196" textAnchor="middle" fontSize="9" className={label}>one word, exactly like the examples ✓</text>

      <text x="380" y="240" textAnchor="middle" fontSize="11" className={label}>This is in-context learning: the model "learns" the pattern from examples in the prompt —</text>
      <text x="380" y="258" textAnchor="middle" fontSize="11" className={label}>no training, no weight changes, just this one request. Delete the examples and it's forgotten.</text>
    </svg>
  )
}
