/** Statelessness: every turn re-sends the WHOLE conversation array. */

const TURNS = [
  { y: 60, msgs: ['u1'], note: 'turn 1: [user]' },
  { y: 115, msgs: ['u1', 'a1', 'u2'], note: 'turn 2: [user, assistant, user]' },
  { y: 170, msgs: ['u1', 'a1', 'u2', 'a2', 'u3'], note: 'turn 3: everything again' },
]

export default function DiagramMessagesLoop() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  return (
    <svg viewBox="0 0 760 270" className="w-full" role="img" aria-label="Each chat turn re-sends the entire growing messages array because the model keeps no state between calls">
      <text x="380" y="26" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">The model remembers NOTHING between calls — your array is the memory</text>

      {TURNS.map((t, ti) => (
        <g key={ti}>
          <text x="30" y={t.y + 22} fontSize="10" className={label}>{t.note}</text>
          {t.msgs.map((m, mi) => (
            <g key={mi}>
              <rect
                x={250 + mi * 62} y={t.y} width="54" height="32" rx="8"
                className={m.startsWith('u') ? 'fill-brand-500/15 stroke-brand-400/60' : 'fill-emerald-500/10 stroke-emerald-500/50'}
              >
                {mi === t.msgs.length - 1 && <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />}
              </rect>
              <text x={277 + mi * 62} y={t.y + 20} textAnchor="middle" fontSize="10" fontFamily="monospace" className="fill-zinc-700 dark:fill-zinc-200">{m}</text>
            </g>
          ))}
          <line x1={250 + t.msgs.length * 62 + 4} y1={t.y + 16} x2="640" y2={t.y + 16} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.2" strokeDasharray="3 4" />
          <circle r="3.5" cy={t.y + 16} className="fill-brand-500">
            <animate attributeName="cx" values={`${250 + t.msgs.length * 62 + 8};635`} dur="2s" begin={`${ti * 0.6}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${ti * 0.6}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* model */}
      <rect x="645" y="80" width="90" height="90" rx="14" className="fill-brand-500/10 stroke-brand-400/60" />
      <text x="690" y="120" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">LLM</text>
      <text x="690" y="138" textAnchor="middle" fontSize="8.5" className={label}>stateless</text>
      <text x="690" y="152" textAnchor="middle" fontSize="8.5" className={label}>every time</text>

      <text x="380" y="240" textAnchor="middle" fontSize="11" className={label}>user = brand, assistant = green. The array grows; you send ALL of it, every turn.</text>
      <text x="380" y="258" textAnchor="middle" fontSize="10" className="fill-zinc-400 dark:fill-zinc-500">Corollary: chat history size × turns = quadratic token spend. Lesson 1.4's budgeting is why.</text>
    </svg>
  )
}
