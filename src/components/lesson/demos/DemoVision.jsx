import { useState } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Multimodal messages: pick an "image", ask a question, see payload + answer. */

const IMAGES = [
  {
    id: 'receipt', label: '🧾 Receipt',
    svg: (
      <svg viewBox="0 0 120 90" className="h-full w-full">
        <rect x="25" y="5" width="70" height="80" rx="4" className="fill-white stroke-zinc-400" />
        <text x="60" y="20" textAnchor="middle" fontSize="8" fontWeight="700" className="fill-zinc-700">CAFÉ NOVA</text>
        {[['Latte', '4.50'], ['Croissant', '3.20'], ['Tip', '1.30']].map(([item, price], i) => (
          <g key={item}><text x="32" y={34 + i * 11} fontSize="6.5" className="fill-zinc-600">{item}</text><text x="88" y={34 + i * 11} fontSize="6.5" textAnchor="end" className="fill-zinc-600">{price}</text></g>
        ))}
        <line x1="32" y1="66" x2="88" y2="66" className="stroke-zinc-400" strokeWidth="0.5" />
        <text x="32" y="77" fontSize="7" fontWeight="700" className="fill-zinc-800">TOTAL</text>
        <text x="88" y="77" fontSize="7" fontWeight="700" textAnchor="end" className="fill-zinc-800">9.00</text>
      </svg>
    ),
    answers: {
      'What is the total?': 'The total is **9.00** — a latte (4.50), croissant (3.20), and tip (1.30) at Café Nova.',
      'Extract as JSON': '{"merchant":"Café Nova","items":[{"name":"Latte","price":4.5},{"name":"Croissant","price":3.2}],"tip":1.3,"total":9.0}',
      'Anything unusual?': 'Nothing suspicious: items sum to 7.70, plus the 1.30 tip = 9.00 exactly. Standard café receipt.',
    },
  },
  {
    id: 'chart', label: '📊 Error chart',
    svg: (
      <svg viewBox="0 0 120 90" className="h-full w-full">
        <line x1="15" y1="75" x2="110" y2="75" className="stroke-zinc-400" />
        <line x1="15" y1="75" x2="15" y2="10" className="stroke-zinc-400" />
        {[62, 58, 60, 55, 22, 20, 18].map((h, i) => (
          <rect key={i} x={20 + i * 12} y={75 - h} width="8" height={h} className={i === 4 ? 'fill-rose-400' : 'fill-indigo-400'} />
        ))}
        <text x="63" y="86" textAnchor="middle" fontSize="6" className="fill-zinc-500">Mon → Sun · 5xx errors</text>
      </svg>
    ),
    answers: {
      'What is the total?': "This is a bar chart, not a receipt — there's no monetary total. It shows daily 5xx error counts across a week.",
      'Extract as JSON': '{"metric":"5xx_errors","days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"values":[62,58,60,55,22,20,18],"anomaly":"sharp drop from Friday onward"}',
      'Anything unusual?': 'Yes — errors drop ~60% starting Friday (highlighted bar). That timing suggests a fix was deployed Thursday night or traffic patterns changed for the weekend.',
    },
  },
  {
    id: 'ui', label: '📱 Login screen',
    svg: (
      <svg viewBox="0 0 120 90" className="h-full w-full">
        <rect x="35" y="5" width="50" height="80" rx="6" className="fill-white stroke-zinc-400" />
        <rect x="42" y="25" width="36" height="8" rx="2" className="fill-zinc-200 stroke-zinc-300" strokeWidth="0.5" />
        <rect x="42" y="38" width="36" height="8" rx="2" className="fill-zinc-200 stroke-zinc-300" strokeWidth="0.5" />
        <rect x="42" y="52" width="36" height="9" rx="4" className="fill-indigo-500" />
        <text x="60" y="58.5" textAnchor="middle" fontSize="5" className="fill-white">Sign up</text>
        <text x="60" y="70" textAnchor="middle" fontSize="4.5" className="fill-indigo-500">Forgot password?</text>
      </svg>
    ),
    answers: {
      'What is the total?': "No totals here — this is a mobile auth screen with two input fields, a primary button, and a link.",
      'Extract as JSON': '{"screen":"auth","fields":["email","password"],"primary_cta":"Sign up","links":["Forgot password?"]}',
      'Anything unusual?': 'UX inconsistency: the primary button says "Sign up" but there\'s a "Forgot password?" link — password recovery implies LOGIN. The screen\'s purpose is ambiguous; that link probably belongs on a login variant.',
    },
  },
]

const QUESTIONS = ['What is the total?', 'Extract as JSON', 'Anything unusual?']

export default function DemoVision({ onInteract }) {
  const [img, setImg] = useState(0)
  const [q, setQ] = useState(null)
  const [showPayload, setShowPayload] = useState(false)
  const image = IMAGES[img]

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {IMAGES.map((im, i) => (
          <button
            key={im.id}
            onClick={() => { onInteract?.(); setImg(i); setQ(null) }}
            className={cn('rounded-xl border p-2 transition-all', i === img ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-300 hover:border-brand-400 dark:border-zinc-700')}
          >
            <div className="h-20">{im.svg}</div>
            <div className="mt-1 text-center text-xs font-medium txt-2">{im.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => { onInteract?.(); setQ(question) }}
            className={cn('rounded-xl border px-3 py-1.5 text-xs font-medium', q === question ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}
          >
            {question}
          </button>
        ))}
      </div>

      {q && (
        <div className="animate-fade-up rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500"><Eye size={11} /> model answer</div>
          <p className="font-mono text-xs leading-relaxed txt-1">{image.answers[q]}</p>
        </div>
      )}

      <button onClick={() => setShowPayload((s) => !s)} className="btn-ghost mt-2 px-2 py-1 text-xs">{showPayload ? 'Hide' : 'Show'} the actual message payload</button>
      {showPayload && (
        <pre className="mt-1 animate-fade-up overflow-x-auto rounded-xl bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
{`{ "role": "user", "content": [
    { "type": "image", "source": { "type": "base64",
        "media_type": "image/png", "data": "iVBORw0KGg…" } },
    { "type": "text", "text": ${JSON.stringify(q ?? 'your question')} }
] }`}
        </pre>
      )}

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Same chat API, same messages array — content just becomes a LIST of blocks (image + text). Answers are canned here,
        but they're modeled on real vision-model behavior, including the chart-vs-receipt confusion resistance.
      </p>
    </div>
  )
}
