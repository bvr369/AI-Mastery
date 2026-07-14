/** The five-part prompt template, stacked and labeled. */

const PARTS = [
  { y: 42, title: 'ROLE', ex: '"You are a senior SQL analyst."', tag: 'who the model is', cls: 'fill-brand-500/10 stroke-brand-400/70', text: 'fill-brand-600 dark:fill-brand-300' },
  { y: 88, title: 'CONTEXT', ex: 'schema, docs, the data to work on', tag: 'what it needs to know', cls: 'fill-sky-500/10 stroke-sky-500/60', text: 'fill-sky-600 dark:fill-sky-400' },
  { y: 134, title: 'TASK', ex: '"Write a query that finds churned users."', tag: 'the actual instruction', cls: 'fill-emerald-500/10 stroke-emerald-500/60', text: 'fill-emerald-600 dark:fill-emerald-400' },
  { y: 180, title: 'FORMAT', ex: '"Return only SQL in a code block."', tag: 'shape of the output', cls: 'fill-amber-500/10 stroke-amber-500/60', text: 'fill-amber-600 dark:fill-amber-400' },
  { y: 226, title: 'EXAMPLES', ex: 'one or two worked input→output pairs', tag: 'show, don\'t just tell', cls: 'fill-rose-500/10 stroke-rose-500/60', text: 'fill-rose-600 dark:fill-rose-400' },
]

export default function DiagramPromptAnatomy() {
  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="A great prompt has five parts: role, context, task, format, and examples, stacked from top to bottom">
      <text x="380" y="26" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">The five-part prompt (use the parts your task needs)</text>
      {PARTS.map((p, i) => (
        <g key={p.title}>
          <rect x="150" y={p.y} width="460" height="38" rx="10" className={p.cls} strokeWidth="1.3">
            <animate attributeName="opacity" values="0.4;1;1" keyTimes={`0;${0.15 + i * 0.16};1`} dur="4s" repeatCount="indefinite" />
          </rect>
          <text x="170" y={p.y + 24} fontSize="12" fontWeight="700" className={p.text}>{p.title}</text>
          <text x="270" y={p.y + 24} fontSize="10.5" fontFamily="monospace" className="fill-zinc-600 dark:fill-zinc-300">{p.ex}</text>
          <text x="145" y={p.y + 24} textAnchor="end" fontSize="8.5" className="fill-zinc-400 dark:fill-zinc-500">{i + 1}</text>
          <text x="620" y={p.y + 24} fontSize="8.5" className="fill-zinc-400 dark:fill-zinc-500">{p.tag}</text>
        </g>
      ))}
      <text x="380" y="284" textAnchor="middle" fontSize="10.5" className="fill-zinc-500 dark:fill-zinc-400">Not every prompt needs all five — but when output is bad, a missing part is usually why.</text>
    </svg>
  )
}
