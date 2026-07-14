/** Format control: the same content shaped by different output contracts. */

const SHAPES = [
  { x: 30, title: 'XML tags', body: '<answer>\n  <summary>…</summary>\n  <risk>low</risk>\n</answer>', tag: 'easy to parse, model-friendly' },
  { x: 275, title: 'Markdown', body: '## Summary\n- point one\n- point two\n\n`code here`', tag: 'human-readable, great for chat' },
  { x: 520, title: 'JSON', body: '{\n  "summary": "…",\n  "risk": "low"\n}', tag: 'machine-consumable' },
]

export default function DiagramFormatControl() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  return (
    <svg viewBox="0 0 760 270" className="w-full" role="img" aria-label="The same answer can be shaped as XML, markdown, or JSON depending on who consumes it">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">Same answer, three output contracts — you choose by who reads it</text>

      <rect x="250" y="40" width="260" height="34" rx="9" className="fill-brand-500/10 stroke-brand-400/60" />
      <text x="380" y="62" textAnchor="middle" fontSize="11" className="fill-brand-600 dark:fill-brand-300">"Summarize this ticket + rate the risk"</text>

      {SHAPES.map((s, i) => (
        <g key={s.title}>
          <line x1="380" y1="74" x2={s.x + 105} y2="96" className="stroke-zinc-300 dark:stroke-zinc-700" strokeDasharray="3 4" />
          <rect x={s.x} y="98" width="210" height="120" rx="12" className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" />
          <text x={s.x + 105} y="120" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">{s.title}</text>
          {s.body.split('\n').map((line, j) => (
            <text key={j} x={s.x + 14} y={138 + j * 13} fontSize="8.5" fontFamily="monospace" className="fill-emerald-600 dark:fill-emerald-400">{line}</text>
          ))}
          <text x={s.x + 105} y="232" textAnchor="middle" fontSize="8.5" className={label}>{s.tag}</text>
        </g>
      ))}

      <text x="380" y="258" textAnchor="middle" fontSize="10.5" className={label}>The content is identical; the contract is a prompt instruction. XML tags are especially reliable for models to produce AND for you to parse.</text>
    </svg>
  )
}
