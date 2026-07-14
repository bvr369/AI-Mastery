/**
 * Model size vs capability, cost and speed — plus distillation.
 * A diminishing-returns quality curve over three model sizes, with cost/latency
 * indicators that climb with size, and a teacher→student distillation arrow.
 */

// x positions map to the three sizes; qy is the quality-curve y (lower y = higher quality)
const MODELS = [
  { x: 150, label: '8B', tier: 'Small', qy: 190, cost: '1×', lat: 'fast', cls: 'fill-emerald-500/10 stroke-emerald-500/50', text: 'fill-emerald-600 dark:fill-emerald-400' },
  { x: 380, label: '70B', tier: 'Mid', qy: 120, cost: '9×', lat: 'medium', cls: 'fill-sky-500/10 stroke-sky-500/50', text: 'fill-sky-600 dark:fill-sky-400' },
  { x: 610, label: '400B', tier: 'Frontier', qy: 88, cost: '50×', lat: 'slow', cls: 'fill-brand-500/10 stroke-brand-400/60', text: 'fill-brand-600 dark:fill-brand-300' },
]

export default function DiagramScaling() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const faint = 'fill-zinc-400 dark:fill-zinc-500'
  // smooth diminishing-returns curve through the three quality points
  const curve = `M 60 208 C 150 190, 210 150, 380 120 S 520 96, 700 84`

  return (
    <svg viewBox="0 0 760 330" className="w-full" role="img" aria-label="Quality rises with model size along a diminishing-returns curve while cost per token and latency also rise; distillation transfers most of a big model's quality to a small one">
      <text x="20" y="24" fontSize="13" fontWeight="700" className={strong}>Bigger is smarter — and slower and pricier</text>

      {/* axes */}
      <line x1="60" y1="40" x2="60" y2="230" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.2" />
      <line x1="60" y1="230" x2="710" y2="230" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.2" />
      <text x="24" y="130" fontSize="10" transform="rotate(-90 24 130)" textAnchor="middle" className={faint}>quality →</text>
      <text x="385" y="322" textAnchor="middle" fontSize="10" className={faint}>parameters (model size) →</text>

      {/* the diminishing-returns quality curve */}
      <path d={curve} fill="none" className="stroke-brand-500" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="900" strokeDashoffset="900">
        <animate attributeName="stroke-dashoffset" from="900" to="0" dur="1.8s" fill="freeze" />
      </path>
      <text x="640" y="66" textAnchor="middle" fontSize="9.5" className="fill-brand-600 dark:fill-brand-300">diminishing returns</text>

      {/* per-model markers, gridlines and stat cards */}
      {MODELS.map((m, i) => (
        <g key={m.label}>
          <line x1={m.x} y1={m.qy} x2={m.x} y2="230" className="stroke-zinc-300/70 dark:stroke-zinc-700/70" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx={m.x} cy={m.qy} r="6" className={m.cls} strokeWidth="1.5">
            <animate attributeName="r" values="6;8;6" dur="2.4s" begin={`${1.6 + i * 0.2}s`} repeatCount="indefinite" />
          </circle>
          <text x={m.x} y="248" textAnchor="middle" fontSize="12" fontWeight="700" className={m.text}>{m.label}</text>
          <text x={m.x} y="262" textAnchor="middle" fontSize="9" className={faint}>{m.tier}</text>
          {/* cost + latency indicators climb with size */}
          <text x={m.x} y="283" textAnchor="middle" fontSize="9.5" className={label}>💰 {m.cost} / token</text>
          <text x={m.x} y="298" textAnchor="middle" fontSize="9.5" className={label}>⏱ {m.lat}</text>
        </g>
      ))}

      {/* distillation: teacher (frontier) → student (small) */}
      <path id="distill" d="M 610 78 C 640 30, 300 20, 150 176" fill="none" className="stroke-amber-500/70" strokeWidth="1.6" strokeDasharray="4 5" />
      <circle r="4" className="fill-amber-500">
        <animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="linear" path="M 610 78 C 640 30, 300 20, 150 176" />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.68;0.72;1" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <text x="380" y="34" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">distillation: teacher → student</text>
      <text x="380" y="48" textAnchor="middle" fontSize="9" className={faint}>train the small model on the big model's outputs</text>

      {/* student "punches above its size" — lifted marker */}
      <circle cx="150" cy="150" r="5" className="fill-amber-500/20 stroke-amber-500" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M 150 184 L 150 158" fill="none" className="stroke-amber-500/70" strokeWidth="1.4" strokeDasharray="2 3" />
      <path d="M 146 164 L 150 156 L 154 164" fill="none" className="stroke-amber-500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="150" y="140" textAnchor="middle" fontSize="8.5" className="fill-amber-600 dark:fill-amber-400">punches above its size</text>

      <text x="380" y="316" textAnchor="middle" fontSize="10.5" className={label}>Pick the smallest model that clears your quality bar — distillation lets a small model punch above its weight (Module 11).</text>
    </svg>
  )
}
