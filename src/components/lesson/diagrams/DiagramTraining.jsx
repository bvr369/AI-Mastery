/** The three-stage training pipeline: pretraining → SFT → RLHF. */

const STAGES = [
  { x: 30, title: '1 · Pretraining', sub: 'trillions of tokens', out: 'Base model', desc: '“predict the next token”', note: 'months · $10M+', cls: 'fill-sky-500/10 stroke-sky-500/50', text: 'fill-sky-600 dark:fill-sky-400' },
  { x: 290, title: '2 · SFT', sub: 'curated conversations', out: 'Assistant', desc: 'learns Q→A behavior', note: 'days · curated data', cls: 'fill-brand-500/10 stroke-brand-400/60', text: 'fill-brand-600 dark:fill-brand-300' },
  { x: 550, title: '3 · RLHF', sub: 'human rankings', out: 'Aligned model', desc: 'learns what people prefer', note: 'reward model loop', cls: 'fill-emerald-500/10 stroke-emerald-500/50', text: 'fill-emerald-600 dark:fill-emerald-400' },
]

export default function DiagramTraining() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  return (
    <svg viewBox="0 0 760 260" className="w-full" role="img" aria-label="Training pipeline: pretraining creates a base model, supervised fine-tuning makes it an assistant, RLHF aligns it with human preferences">
      {STAGES.map((s, i) => (
        <g key={s.title}>
          <rect x={s.x} y="60" width="180" height="110" rx="14" className={s.cls} strokeWidth="1.2" />
          <text x={s.x + 90} y="84" textAnchor="middle" fontSize="13" fontWeight="700" className={s.text}>{s.title}</text>
          <text x={s.x + 90} y="102" textAnchor="middle" fontSize="10" className={label}>{s.sub}</text>
          <text x={s.x + 90} y="126" textAnchor="middle" fontSize="11" fontWeight="600" className="fill-zinc-800 dark:fill-zinc-100">→ {s.out}</text>
          <text x={s.x + 90} y="143" textAnchor="middle" fontSize="9.5" className={label}>{s.desc}</text>
          <text x={s.x + 90} y="188" textAnchor="middle" fontSize="9" className="fill-zinc-400 dark:fill-zinc-500">{s.note}</text>
          {i < 2 && (
            <>
              <line x1={s.x + 184} y1="115" x2={s.x + 256} y2="115" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
              <circle r="4" cy="115" className="fill-brand-500">
                <animate attributeName="cx" values={`${s.x + 186};${s.x + 254}`} dur="1.8s" begin={`${i * 0.9}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin={`${i * 0.9}s`} repeatCount="indefinite" />
              </circle>
            </>
          )}
        </g>
      ))}

      {/* inputs raining into stage 1 */}
      {[0, 1, 2].map((i) => (
        <text key={i} x={60 + i * 45} y="30" fontSize="12" className="fill-sky-500/80">
          📄
          <animate attributeName="y" values="24;54" dur="1.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </text>
      ))}
      {/* preference thumbs into stage 3 */}
      {[0, 1].map((i) => (
        <text key={i} x={600 + i * 55} y="30" fontSize="12">
          {i ? '👎' : '👍'}
          <animate attributeName="y" values="24;54" dur="1.8s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
        </text>
      ))}

      <text x="380" y="225" textAnchor="middle" fontSize="11" className={label}>Base models autocomplete. SFT teaches them to answer. RLHF teaches them to answer *well*.</text>
      <text x="380" y="245" textAnchor="middle" fontSize="10" className="fill-zinc-400 dark:fill-zinc-500">When an API model feels "helpful", you're feeling stages 2–3. Its knowledge came from stage 1.</text>
    </svg>
  )
}
