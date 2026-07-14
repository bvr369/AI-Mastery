import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { copyText } from '../../lib/utils'

/* Dependency-free syntax highlighting: good enough for teaching snippets. */

const RULES = {
  javascript: {
    comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\//,
    string: /`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/,
    keyword: /\b(?:const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|export|from|default|await|async|try|catch|throw|typeof|true|false|null|undefined)\b/,
    number: /\b\d[\d_]*(?:\.\d+)?\b/,
  },
  python: {
    comment: /#[^\n]*/,
    string: /"""[\s\S]*?"""|'''[\s\S]*?'''|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/,
    keyword: /\b(?:def|return|if|elif|else|for|while|in|import|from|as|class|try|except|raise|with|lambda|None|True|False|and|or|not|async|await|print|pass)\b/,
    number: /\b\d[\d_]*(?:\.\d+)?\b/,
  },
  json: {
    string: /"(?:\\.|[^"\\])*"/,
    keyword: /\b(?:true|false|null)\b/,
    number: /-?\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
  },
}
RULES.js = RULES.jsx = RULES.javascript
RULES.py = RULES.python

const CLS = {
  comment: 'italic text-zinc-500 dark:text-zinc-500',
  string: 'text-emerald-600 dark:text-emerald-300',
  keyword: 'font-medium text-brand-600 dark:text-brand-300',
  number: 'text-amber-600 dark:text-amber-300',
}

export function highlight(code, lang) {
  const rules = RULES[lang]
  if (!rules) return [{ text: code }]
  const names = Object.keys(rules)
  const rx = new RegExp(names.map((n) => `(${rules[n].source})`).join('|'), 'g')
  const out = []
  let last = 0
  let m
  while ((m = rx.exec(code)) !== null) {
    if (m.index > last) out.push({ text: code.slice(last, m.index) })
    const which = names[m.slice(1).findIndex((g) => g !== undefined)]
    out.push({ text: m[0], cls: CLS[which] })
    last = m.index + m[0].length
  }
  if (last < code.length) out.push({ text: code.slice(last) })
  return out
}

export default function CodeBlock({ lang = 'javascript', filename, code, caption }) {
  const [copied, setCopied] = useState(false)
  const tokens = highlight(code.trim(), lang)

  const onCopy = async () => {
    if (await copyText(code.trim())) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100/80 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="ml-1 font-mono text-xs txt-3">{filename || lang}</span>
        <button onClick={onCopy} className="ml-auto flex items-center gap-1 text-xs txt-3 transition-colors hover:text-brand-500">
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-white p-4 text-[13px] leading-relaxed dark:bg-zinc-950/60">
        <code className="font-mono text-zinc-800 dark:text-zinc-200">
          {tokens.map((t, i) => (t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text))}
        </code>
      </pre>
      {caption && <figcaption className="border-t border-zinc-200 px-3.5 py-2 text-xs txt-3 dark:border-zinc-800">{caption}</figcaption>}
    </figure>
  )
}
