/**
 * The course's signature map: a decoder-style transformer, bottom to top.
 * tokens → embeddings + positions → N blocks (attention + FFN with residual
 * Add & Norm) → final norm → unembed → softmax → next-token probabilities.
 * A dot rides the residual spine upward (SMIL) to show data flowing through.
 */

const SPINE_X = 320
const label = 'fill-zinc-500 dark:fill-zinc-400'
const strong = 'fill-zinc-800 dark:fill-zinc-100'

// post-stack head: unembed → softmax, drawn top-down (smaller y = higher up)
const HEAD = [
  { cy: 80, t: 'Softmax', s: 'logits → probabilities', box: 'fill-emerald-500/10 stroke-emerald-500/50', tx: 'fill-emerald-600 dark:fill-emerald-400' },
  { cy: 120, t: 'Linear · unembed', s: 'hidden → vocab logits', box: 'fill-brand-500/10 stroke-brand-400/60', tx: 'fill-brand-600 dark:fill-brand-300' },
  { cy: 160, t: 'Final LayerNorm', s: 'normalize residual stream', box: 'fill-zinc-500/10 stroke-zinc-400/50', tx: 'fill-zinc-600 dark:fill-zinc-300' },
]

// next-token distribution (curated) shown as tiny bars at the very top
const PROBS = [
  { h: 16 }, { h: 30 }, { h: 46, pick: true }, { h: 24 }, { h: 12 },
]

const TOKENS = ['The', 'cat', 'sat']

export default function DiagramTransformerArch() {
  return (
    <svg viewBox="0 0 760 510" className="w-full" role="img" aria-label="A decoder-style transformer, bottom to top: input tokens become embeddings plus positional encodings, flow up a residual stream through N transformer blocks (each with multi-head self-attention and a feed-forward network, both wrapped by Add and Norm residual connections), then a final layer norm, a linear unembedding, and a softmax that produces next-token probabilities.">
      {/* residual stream: the brand-colored spine everything flows up */}
      <rect x={SPINE_X - 3} y="176" width="6" height="216" rx="3" className="fill-brand-500/25" />
      <rect x={SPINE_X - 1.5} y="176" width="3" height="216" className="fill-brand-500/60" />
      <text x="298" y="284" fontSize="9" transform="rotate(-90 298 284)" textAnchor="middle" className="fill-brand-500/80 dark:fill-brand-300/80">residual stream</text>

      {/* the token that rides the spine all the way up */}
      {[0, 2].map((d) => (
        <circle key={d} cx={SPINE_X} r="4.5" className="fill-brand-500">
          <animate attributeName="cy" values="472;30" dur="4s" begin={`${d}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.06;0.5;0.94;1" dur="4s" begin={`${d}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* ── TOP: next-token probabilities ── */}
      <text x={SPINE_X} y="16" textAnchor="middle" fontSize="11" fontWeight="700" className={strong}>next-token probabilities</text>
      {PROBS.map((b, i) => (
        <rect key={i} x={284 + i * 16} y={54 - b.h} width="10" height={b.h} rx="2"
          className={b.pick ? 'fill-emerald-500' : 'fill-brand-500/45'}>
          <animate attributeName="height" values={`${b.h * 0.7};${b.h};${b.h * 0.7}`} dur="2.4s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${54 - b.h * 0.7};${54 - b.h};${54 - b.h * 0.7}`} dur="2.4s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
        </rect>
      ))}

      {/* ── head pills: softmax / linear / final norm ── */}
      {HEAD.map((p) => (
        <g key={p.t}>
          <rect x="220" y={p.cy - 17} width="200" height="34" rx="10" className={p.box} strokeWidth="1.2" />
          <text x={SPINE_X} y={p.cy - 1} textAnchor="middle" fontSize="12" fontWeight="700" className={p.tx}>{p.t}</text>
          <text x={SPINE_X} y={p.cy + 12} textAnchor="middle" fontSize="9" className={label}>{p.s}</text>
        </g>
      ))}

      {/* ── the transformer block stack (× N) ── */}
      {/* ghost outlines behind, offset up, to imply the stack repeats */}
      {[2, 1].map((g) => (
        <rect key={g} x={150 + g * 14} y={182 - g * 12} width="352" height="178" rx="14"
          className="fill-none stroke-zinc-300/60 dark:stroke-zinc-700/60" strokeWidth="1" />
      ))}
      <rect x="150" y="182" width="352" height="178" rx="14" className="fill-zinc-50/70 stroke-zinc-300 dark:fill-zinc-800/40 dark:stroke-zinc-700" strokeWidth="1.2" />
      <text x="164" y="200" fontSize="11" fontWeight="700" className={strong}>Transformer block</text>
      <g>
        <rect x="444" y="188" width="48" height="20" rx="7" className="fill-brand-500" />
        <text x="468" y="202" textAnchor="middle" fontSize="11" fontWeight="800" className="fill-white">× N</text>
      </g>

      {/* residual skip arcs (spine bypasses each sublayer into its Add & Norm) */}
      <path d="M320 356 C 470 348, 470 284, 320 278" fill="none" className="stroke-brand-400/70" strokeWidth="1.4" strokeDasharray="4 4" />
      <path d="M320 262 C 470 254, 470 202, 320 196" fill="none" className="stroke-brand-400/70" strokeWidth="1.4" strokeDasharray="4 4" />
      <text x="486" y="322" fontSize="8.5" className="fill-brand-500/80 dark:fill-brand-300/80">skip</text>
      <text x="486" y="230" fontSize="8.5" className="fill-brand-500/80 dark:fill-brand-300/80">skip</text>

      {/* Add & Norm node — after FFN (top) */}
      <circle cx={SPINE_X} cy="196" r="9" className="fill-emerald-500/15 stroke-emerald-500/70" strokeWidth="1.2" />
      <text x={SPINE_X} y="200" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">+</text>
      <text x="200" y="200" textAnchor="end" fontSize="9" className={label}>Add &amp; Norm</text>

      {/* Feed-Forward sublayer */}
      <rect x="226" y="206" width="188" height="42" rx="10" className="fill-amber-500/10 stroke-amber-500/55" strokeWidth="1.2" />
      <text x={SPINE_X} y="223" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">Feed-Forward</text>
      <text x={SPINE_X} y="238" textAnchor="middle" fontSize="8.5" className={label}>expand → GELU → project</text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={250 + i * 40} y="242" width="20" height="3.5" rx="1.75" className="fill-amber-500/60">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </rect>
      ))}

      {/* Add & Norm node — after attention (middle) */}
      <circle cx={SPINE_X} cy="278" r="9" className="fill-emerald-500/15 stroke-emerald-500/70" strokeWidth="1.2" />
      <text x={SPINE_X} y="282" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">+</text>
      <text x="200" y="282" textAnchor="end" fontSize="9" className={label}>Add &amp; Norm</text>

      {/* Multi-Head Self-Attention sublayer */}
      <rect x="216" y="288" width="208" height="56" rx="10" className="fill-sky-500/10 stroke-sky-500/55" strokeWidth="1.2" />
      <text x={SPINE_X} y="306" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-sky-600 dark:fill-sky-400">Multi-Head Self-Attention</text>
      <text x={SPINE_X} y="320" textAnchor="middle" fontSize="8.5" className={label}>each token attends to every earlier token</text>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={252 + i * 34} cy="334" r="4.5" className="fill-sky-500/70">
          <animate attributeName="opacity" values="0.35;1;0.35" dur="1.4s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* ── embeddings + positional encodings ── */}
      <rect x="150" y="392" width="352" height="46" rx="12" className="fill-brand-500/10 stroke-brand-400/60" strokeWidth="1.2" />
      <text x={SPINE_X} y="410" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">Token embeddings + positional encodings</text>
      <text x={SPINE_X} y="426" textAnchor="middle" fontSize="9" className={label}>each token → a vector, plus a signal for its position</text>
      {/* little positional sine wave for flavor */}
      <path d="M170 431 q 8 -6 16 0 t 16 0 t 16 0 t 16 0" fill="none" className="stroke-brand-400/60" strokeWidth="1.2" />

      {/* ── input tokens ── */}
      {TOKENS.map((t, i) => (
        <g key={t}>
          <rect x={222 + i * 68} y="452" width="60" height="28" rx="8" className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="1.1" />
          <text x={252 + i * 68} y="470" textAnchor="middle" fontSize="12" fontFamily="monospace" className={strong}>{t}</text>
        </g>
      ))}
      <text x={SPINE_X} y="498" textAnchor="middle" fontSize="10" className={label}>input tokens — the prompt so far</text>
    </svg>
  )
}
