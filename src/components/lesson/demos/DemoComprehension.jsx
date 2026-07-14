import { useState } from 'react'
import { cn } from '../../../lib/utils'
import { highlight } from '../CodeBlock'

/**
 * A Python list comprehension is just map + filter in one line. For each preset we show
 * three genuinely equivalent versions — comprehension, plain for-loop, JS .map()/.filter() —
 * plus the REAL output array, computed live in JS so it is always correct.
 */

const PRESETS = [
  {
    label: 'Squares',
    input: [1, 2, 3, 4, 5],
    inputRepr: 'nums = [1, 2, 3, 4, 5]',
    py: '[n * n for n in nums]',
    loop: 'out = []\nfor n in nums:\n    out.append(n * n)',
    js: 'nums.map(n => n * n)',
    run: (nums) => nums.map((n) => n * n),
    note: 'map only — every element is transformed, none dropped.',
  },
  {
    label: 'Evens only',
    input: [1, 2, 3, 4, 5, 6, 7, 8],
    inputRepr: 'nums = [1, 2, 3, 4, 5, 6, 7, 8]',
    py: '[n for n in nums if n % 2 == 0]',
    loop: 'out = []\nfor n in nums:\n    if n % 2 == 0:\n        out.append(n)',
    js: 'nums.filter(n => n % 2 === 0)',
    run: (nums) => nums.filter((n) => n % 2 === 0),
    note: 'filter only — the `if` keeps elements, the body leaves them unchanged.',
  },
  {
    label: 'Uppercase names',
    input: ['ada', 'linus', 'grace'],
    inputRepr: "names = ['ada', 'linus', 'grace']",
    py: '[name.upper() for name in names]',
    loop: 'out = []\nfor name in names:\n    out.append(name.upper())',
    js: 'names.map(name => name.toUpperCase())',
    run: (names) => names.map((name) => name.toUpperCase()),
    note: 'map over strings — .upper() in Python is .toUpperCase() in JS.',
  },
  {
    label: 'Long word lengths',
    input: ['hi', 'code', 'to', 'learn', 'ai'],
    inputRepr: "words = ['hi', 'code', 'to', 'learn', 'ai']",
    py: '[len(w) for w in words if len(w) > 3]',
    loop: 'out = []\nfor w in words:\n    if len(w) > 3:\n        out.append(len(w))',
    js: 'words.filter(w => w.length > 3)\n     .map(w => w.length)',
    run: (words) => words.filter((w) => w.length > 3).map((w) => w.length),
    note: 'filter + map — the comprehension does both at once, JS chains them.',
  },
]

function reprOutput(arr) {
  const items = arr.map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
  return `[${items.join(', ')}]`
}

function Code({ code, lang }) {
  const tokens = highlight(code, lang)
  return (
    <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-3 text-[12.5px] leading-relaxed dark:bg-zinc-950/60">
      <code className="font-mono text-zinc-800 dark:text-zinc-200">
        {tokens.map((t, i) => (t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text))}
      </code>
    </pre>
  )
}

export default function DemoComprehension({ onInteract }) {
  const [idx, setIdx] = useState(0)
  const p = PRESETS[idx]
  const output = p.run(p.input)

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((preset, i) => (
          <button
            key={preset.label}
            onClick={() => { onInteract?.(); setIdx(i) }}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              i === idx
                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-100/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
        <span className="mr-2 text-[10px] font-bold uppercase tracking-wide txt-3">Input</span>
        <span className="font-mono text-[12.5px] txt-1">{p.inputRepr}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ['1 · Python comprehension', p.py, 'python', 'chip-brand'],
          ['2 · Python for-loop', p.loop, 'python', 'chip-zinc'],
          ['3 · JavaScript map/filter', p.js, 'javascript', 'chip-amber'],
        ].map(([title, code, lang, chip]) => (
          <div key={title}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className={chip}>{title}</span>
            </div>
            <Code code={code} lang={lang} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Output</span>
        <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">{reprOutput(output)}</span>
        <span className="ml-auto text-[11px] text-emerald-600/80 dark:text-emerald-400/80">computed live in JS · all three agree</span>
      </div>

      <p className="mt-2 text-[11px] txt-3">{p.note}</p>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        A comprehension is just <span className="font-mono txt-2">map</span> + <span className="font-mono txt-2">filter</span> folded into one
        line: the expression before <span className="font-mono txt-2">for</span> is the map, the optional <span className="font-mono txt-2">if</span> at
        the end is the filter. Once you see that mapping, Python comprehensions stop looking alien.
      </p>
    </div>
  )
}
