import { useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Python core data structures vs their JS analogs. Pick a structure to see what
 * it is, its JS equivalent, real syntax for create/access/iterate in BOTH
 * languages, and when to reach for it. Plus a tiny "which structure?" chooser.
 */

const STRUCTS = [
  {
    key: 'list',
    py: 'list',
    js: 'Array',
    chip: 'chip-brand',
    what: 'Ordered, mutable sequence — your default collection.',
    reach: 'a growing, ordered collection where duplicates are fine.',
    ops: [
      ['create', 'nums = [3, 1, 2]', 'const nums = [3, 1, 2]'],
      ['add', 'nums.append(4)', 'nums.push(4)'],
      ['access', 'nums[0]  # 3', 'nums[0]  // 3'],
      ['iterate', 'for n in nums:', 'for (const n of nums)'],
    ],
  },
  {
    key: 'dict',
    py: 'dict',
    js: 'Object / Map',
    chip: 'chip-green',
    what: 'Key → value pairs, fast lookup by key.',
    reach: 'you need to look things up by a label instead of a position.',
    ops: [
      ['create', 'u = {"name": "Ada"}', 'const u = { name: "Ada" }'],
      ['add', 'u["age"] = 36', 'u.age = 36'],
      ['access', 'u["name"]  # "Ada"', 'u.name  // "Ada"'],
      ['iterate', 'for k, v in u.items():', 'for (const [k,v] of Object.entries(u))'],
    ],
  },
  {
    key: 'set',
    py: 'set',
    js: 'Set',
    chip: 'chip-amber',
    what: 'Unordered collection of unique items; O(1) membership.',
    reach: 'deduping, or asking "is x in here?" a lot.',
    ops: [
      ['create', 'tags = {"ai", "ml"}', 'const tags = new Set(["ai","ml"])'],
      ['add', 'tags.add("nlp")', 'tags.add("nlp")'],
      ['member', '"ai" in tags  # True', 'tags.has("ai")  // true'],
      ['iterate', 'for t in tags:', 'for (const t of tags)'],
    ],
  },
  {
    key: 'tuple',
    py: 'tuple',
    js: 'frozen array',
    chip: 'chip-rose',
    what: 'Ordered, IMMUTABLE sequence — a fixed record.',
    reach: 'a fixed group of values that must not change (coordinates, a row).',
    ops: [
      ['create', 'pt = (4, 2)', 'const pt = Object.freeze([4, 2])'],
      ['unpack', 'x, y = pt', 'const [x, y] = pt'],
      ['access', 'pt[0]  # 4', 'pt[0]  // 4'],
      ['frozen', 'pt[0] = 9  # TypeError', 'pt[0] = 9  // silently ignored'],
    ],
  },
]

const QUIZ = [
  {
    q: 'Store 10k user IDs and check "have we seen this one?" constantly.',
    answer: 'set',
    why: 'Membership tests are O(1) in a set — a list would scan every element.',
  },
  {
    q: 'Return a latitude/longitude pair that must never be mutated.',
    answer: 'tuple',
    why: 'A tuple is immutable, so it can be a safe fixed record (and a dict key).',
  },
  {
    q: 'Map each username to their profile for fast lookup by name.',
    answer: 'dict',
    why: 'A dict looks up by key in O(1) instead of searching by position.',
  },
]

export default function DemoPyDataStructures({ onInteract }) {
  const [active, setActive] = useState('list')
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)

  const s = STRUCTS.find((x) => x.key === active)
  const quiz = QUIZ[qi]

  const select = (key) => { onInteract?.(); setActive(key) }

  const answer = (key) => {
    if (picked !== null) return
    onInteract?.()
    setPicked(key)
  }

  const nextQuiz = () => { setQi((i) => (i + 1) % QUIZ.length); setPicked(null) }

  return (
    <div>
      {/* structure selector */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STRUCTS.map((x) => (
          <button
            key={x.key}
            onClick={() => select(x.key)}
            className={cn(
              'rounded-xl border p-2.5 text-left transition-all',
              active === x.key
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-zinc-300 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            <div className={cn('font-mono text-sm font-bold', active === x.key ? 'text-brand-600 dark:text-brand-300' : 'txt-1')}>{x.py}</div>
            <div className="text-[10px] txt-3">≈ {x.js}</div>
          </button>
        ))}
      </div>

      {/* detail card */}
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold txt-1">{s.py}</span>
          <span className={s.chip}>Python</span>
          <span className="txt-3">↔</span>
          <span className="chip-zinc font-mono">{s.js}</span>
          <span className="text-[10px] txt-3">JavaScript</span>
        </div>
        <p className="mb-3 text-sm txt-2">{s.what}</p>

        {/* two-language op table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-[minmax(52px,auto)_1fr_1fr] bg-zinc-100 text-[10px] font-semibold uppercase tracking-wide txt-3 dark:bg-zinc-800/60">
            <div className="px-2 py-1.5">op</div>
            <div className="border-l border-zinc-200 px-2 py-1.5 dark:border-zinc-800">Python 🐍</div>
            <div className="border-l border-zinc-200 px-2 py-1.5 dark:border-zinc-800">JavaScript</div>
          </div>
          {s.ops.map(([op, py, js]) => (
            <div key={op} className="grid grid-cols-[minmax(52px,auto)_1fr_1fr] border-t border-zinc-200 text-xs dark:border-zinc-800">
              <div className="px-2 py-1.5 font-medium txt-2">{op}</div>
              <div className="overflow-x-auto whitespace-pre border-l border-zinc-200 px-2 py-1.5 font-mono text-brand-600 dark:border-zinc-800 dark:text-brand-300">{py}</div>
              <div className="overflow-x-auto whitespace-pre border-l border-zinc-200 px-2 py-1.5 font-mono txt-1 dark:border-zinc-800">{js}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg bg-brand-500/10 px-3 py-2 text-xs leading-relaxed text-brand-700 dark:text-brand-300">
          <span className="font-semibold">Reach for {s.py} when</span> {s.reach}
        </div>
      </div>

      {/* which structure? chooser */}
      <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold txt-2">Which structure?</span>
          <span className="chip-zinc text-[10px]">{qi + 1} / {QUIZ.length}</span>
        </div>
        <p className="mb-2.5 text-sm txt-1">{quiz.q}</p>
        <div className="flex flex-wrap gap-2">
          {STRUCTS.map((x) => {
            const isAnswer = x.key === quiz.answer
            const revealed = picked !== null
            return (
              <button
                key={x.key}
                onClick={() => answer(x.key)}
                disabled={revealed}
                className={cn(
                  'rounded-lg border px-3 py-1.5 font-mono text-xs transition-all',
                  !revealed && 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700',
                  revealed && isAnswer && 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  revealed && !isAnswer && picked === x.key && 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  revealed && !isAnswer && picked !== x.key && 'border-zinc-200 opacity-40 dark:border-zinc-800'
                )}
              >
                {x.py}
              </button>
            )
          })}
        </div>
        {picked !== null && (
          <div className="mt-2.5 animate-fade-up">
            <div className="text-xs leading-relaxed txt-2">
              <span className={cn('font-semibold', picked === quiz.answer ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {picked === quiz.answer ? 'Correct — ' : `Nope, it's ${quiz.answer}. `}
              </span>
              {quiz.why}
            </div>
            <button onClick={nextQuiz} className="btn-outline mt-2 px-3 py-1 text-xs">Next scenario</button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Same four ideas you already use in JS — ordered lists, key/value maps, unique sets, fixed tuples —
        just different names. Python hands you two extra powers as first-class built-ins: a real <span className="font-mono">set</span> for
        instant membership, and an immutable <span className="font-mono">tuple</span> you can even use as a dict key.
      </p>
    </div>
  )
}
