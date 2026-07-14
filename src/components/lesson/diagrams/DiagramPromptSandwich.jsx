/** The prompt sandwich: system > history > user, with authority levels. */

const LAYERS = [
  { y: 50, h: 64, title: 'SYSTEM PROMPT', sub: '“You are Acme\'s support bot. Rules: … Never: …”', tag: 'set by YOU · highest authority · user never sees it', cls: 'fill-brand-500/10 stroke-brand-400/70', text: 'fill-brand-600 dark:fill-brand-300' },
  { y: 122, h: 56, title: 'CONVERSATION HISTORY', sub: 'user ↔ assistant turns so far', tag: 'managed by your app (Lesson 1.4 budgeting)', cls: 'fill-zinc-500/10 stroke-zinc-400/60 dark:stroke-zinc-600', text: 'fill-zinc-600 dark:fill-zinc-300' },
  { y: 186, h: 56, title: 'NEW USER MESSAGE', sub: '“hey can I get a refund??”', tag: 'untrusted input — treat accordingly (M3: injection)', cls: 'fill-emerald-500/10 stroke-emerald-500/60', text: 'fill-emerald-600 dark:fill-emerald-400' },
]

export default function DiagramPromptSandwich() {
  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="Each request layers a system prompt on top of history on top of the new user message; the system prompt carries the highest authority">
      <text x="380" y="28" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">What the model actually receives, every single call</text>
      {LAYERS.map((l, i) => (
        <g key={l.title}>
          <rect x="90" y={l.y} width="440" height={l.h} rx="12" className={l.cls} strokeWidth="1.3">
            <animate attributeName="opacity" values="0.5;1;1;1" keyTimes={`0;${0.15 + i * 0.18};${0.2 + i * 0.18};1`} dur="5s" repeatCount="indefinite" />
          </rect>
          <text x="110" y={l.y + 24} fontSize="12" fontWeight="700" className={l.text}>{l.title}</text>
          <text x="110" y={l.y + 43} fontSize="10" fontFamily="monospace" className="fill-zinc-500 dark:fill-zinc-400">{l.sub}</text>
          <text x="545" y={l.y + l.h / 2 + 3} fontSize="9.5" className="fill-zinc-400 dark:fill-zinc-500">← {l.tag}</text>
        </g>
      ))}
      {/* authority gradient */}
      <line x1="66" y1="56" x2="66" y2="238" className="stroke-brand-400" strokeWidth="2" />
      <polygon points="66,50 61,60 71,60" className="fill-brand-400" />
      <text x="52" y="150" fontSize="9" transform="rotate(-90 52 150)" textAnchor="middle" className="fill-brand-500 dark:fill-brand-300">AUTHORITY</text>

      <text x="380" y="272" textAnchor="middle" fontSize="11" className="fill-zinc-500 dark:fill-zinc-400">The system prompt is a config file written in English: invisible to users, obeyed above them, and versioned in your repo.</text>
    </svg>
  )
}
