import { useState } from 'react'
import { cn } from '../../../lib/utils'
import { highlight } from '../CodeBlock'

/**
 * Side-by-side JavaScript ↔ Python reference. A JS dev already knows the
 * concepts; only the syntax differs. Pick a concept, read both columns.
 */

const CONCEPTS = [
  {
    id: 'Variables',
    js: `const name = "Ada";\nlet count = 5;\ncount += 1;`,
    py: `name = "Ada"\ncount = 5\ncount += 1`,
    note: 'No const/let/var — just assign. Names use snake_case, not camelCase.',
  },
  {
    id: 'Functions',
    js: `function greet(name) {\n  return \`Hi \${name}\`;\n}\ngreet("Ada");`,
    py: `def greet(name):\n    return f"Hi {name}"\n\ngreet("Ada")`,
    note: 'def instead of function, a colon and indentation instead of { }.',
  },
  {
    id: 'Conditionals',
    js: `if (score > 90) {\n  grade = "A";\n} else if (score > 80) {\n  grade = "B";\n}`,
    py: `if score > 90:\n    grade = "A"\nelif score > 80:\n    grade = "B"`,
    note: 'else if becomes elif, no parentheses needed around the condition.',
  },
  {
    id: 'Loops',
    js: `for (const item of arr) {\n  console.log(item);\n}`,
    py: `for item in arr:\n    print(item)`,
    note: 'for…of becomes for…in. Python’s in iterates values directly.',
  },
  {
    id: 'Arrays/Lists',
    js: `const xs = [1, 2, 3];\nxs.push(4);\nconst ys = xs.map(x => x * 2);`,
    py: `xs = [1, 2, 3]\nxs.append(4)\nys = [x * 2 for x in xs]`,
    note: 'push→append, and .map() is usually a list comprehension.',
  },
  {
    id: 'Objects/Dicts',
    js: `const user = { name: "Ada" };\nuser.age = 36;\nconsole.log(user.name);`,
    py: `user = {"name": "Ada"}\nuser["age"] = 36\nprint(user["name"])`,
    note: 'Dict keys are strings in quotes; access with ["key"], not .key.',
  },
  {
    id: 'Classes',
    js: `class Dog {\n  constructor(name) {\n    this.name = name;\n  }\n  bark() {\n    return this.name;\n  }\n}`,
    py: `class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        return self.name`,
    note: 'constructor→__init__, this→self (passed explicitly as first arg).',
  },
  {
    id: 'Async/await',
    js: `async function load() {\n  const res = await fetch(url);\n  return res;\n}`,
    py: `import asyncio\n\nasync def load():\n    res = await get(url)\n    return res`,
    note: 'Same async/await keywords — but Python runs them via asyncio.',
  },
  {
    id: 'Modules/imports',
    js: `import { sum } from "./math.js";\nexport const PI = 3.14;`,
    py: `from math import sum\n\nPI = 3.14`,
    note: 'from…import mirrors named imports; every top-level name is exported.',
  },
]

function Code({ code, lang }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[12.5px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950/50">
      <code className="font-mono text-zinc-800 dark:text-zinc-200">
        {highlight(code, lang).map((t, i) =>
          t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text
        )}
      </code>
    </pre>
  )
}

export default function DemoJSPyTranslator({ onInteract }) {
  const [active, setActive] = useState(0)
  const c = CONCEPTS[active]

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {CONCEPTS.map((concept, i) => (
          <button
            key={concept.id}
            onClick={() => { onInteract?.(); setActive(i) }}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              i === active
                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            {concept.id}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="chip-amber">JavaScript</span>
            <span className="text-[10px] txt-3">what you know</span>
          </div>
          <Code code={c.js} lang="javascript" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="chip-brand">Python</span>
            <span className="text-[10px] txt-3">the equivalent</span>
          </div>
          <Code code={c.py} lang="python" />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        <span className="text-xs font-semibold text-brand-500 dark:text-brand-300">The difference: </span>
        <span className="text-xs txt-2">{c.note}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Notice the mapping is almost 1:1 — the <em>concepts</em> transfer directly. Loops, functions, classes, async: you
        already own the mental model. What changes is surface syntax (colons and indentation instead of braces, snake_case
        instead of camelCase). You know roughly 80% of Python already.
      </p>
    </div>
  )
}
