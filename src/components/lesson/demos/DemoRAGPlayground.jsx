import { useMemo, useState } from 'react'
import { Search, FileText, ShieldCheck, TriangleAlert, Bot } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Chat with your docs. A tiny baked corpus about a fictional product "Nimbus".
 * Ask a preset question -> real keyword retrieval scores every chunk (overlap of
 * query terms / chunk length, TF-IDF-ish), the top hits become the CONTEXT, and we
 * compare a GROUNDED answer (cites only retrieved chunks, abstains when absent) vs an
 * UNGROUNDED answer (what a model with no context confidently makes up).
 */

const CORPUS = [
  { id: 'C1', title: 'Pricing', text: 'Nimbus Pro costs $29 per user per month, billed annually. The monthly plan is $35 per user.' },
  { id: 'C2', title: 'Free tier', text: 'The Nimbus Free plan includes 3 projects and 500 MB of storage, with no credit card required.' },
  { id: 'C3', title: 'Rate limits', text: 'Nimbus API requests are capped at 120 requests per minute on Pro and 20 per minute on Free.' },
  { id: 'C4', title: 'Refund policy', text: 'Nimbus offers a 30-day money-back guarantee on all paid plans, no questions asked.' },
  { id: 'C5', title: 'Uptime SLA', text: 'The Nimbus Enterprise plan guarantees 99.9% uptime backed by a service credit SLA.' },
  { id: 'C6', title: 'Data region', text: 'Customer data is stored in the EU (Frankfurt) region and encrypted at rest with AES-256.' },
  { id: 'C7', title: 'Support', text: 'Pro customers get email support with a 24-hour response target; Enterprise adds a phone line.' },
]

// Curated questions. `answer` fields are hand-written to model real behavior; retrieval
// (the scoring below) genuinely selects which chunks are surfaced as context.
const QUESTIONS = [
  {
    q: 'How much does Nimbus Pro cost?',
    grounded: 'Nimbus Pro is $29 per user/month billed annually, or $35 per user on the monthly plan. [C1]',
    ungrounded: 'Nimbus Pro is around $49 per user per month, with volume discounts on annual billing.',
    wrong: true,
  },
  {
    q: "What's the API rate limit on the Free plan?",
    grounded: 'On Free, the Nimbus API is capped at 20 requests per minute (Pro allows 120). [C3]',
    ungrounded: 'The Free plan allows up to 1,000 API requests per hour, then throttles new requests.',
    wrong: true,
  },
  {
    q: 'Can I get a refund, and where is my data stored?',
    grounded: 'Yes — all paid plans have a 30-day money-back guarantee [C4]. Data is stored in the EU (Frankfurt), encrypted at rest with AES-256 [C6].',
    ungrounded: 'Refunds are handled case-by-case within 14 days, and data is stored in US-East by default.',
    wrong: true,
  },
  {
    q: 'Does Nimbus integrate with Salesforce?',
    grounded: "I don't have that in the docs — the provided context doesn't mention Salesforce or any integrations.",
    ungrounded: 'Yes, Nimbus has a native two-way Salesforce integration you can enable in Settings → Integrations.',
    wrong: true,
    absent: true,
  },
]

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'my', 'i', 'on', 'in', 'and', 'with', 'of', 'get', 'can', 'where', 'what', 'how', 'much', 'plan', 'nimbus'])

// crude stemmer so "costs"->"cost", "requests"->"request", "plans"->"plan" match the query
const stem = (w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w)
const terms = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem)

// TF-IDF-ish: sum idf of query terms present in a chunk, normalized by sqrt(chunk length).
const N = CORPUS.length
const DF = {}
CORPUS.forEach((c) => {
  new Set(terms(c.text + ' ' + c.title)).forEach((t) => { DF[t] = (DF[t] || 0) + 1 })
})
const idf = (t) => Math.log((N + 1) / ((DF[t] || 0) + 1)) + 1

function retrieve(query) {
  const qt = terms(query)
  return CORPUS.map((c) => {
    const ct = terms(c.text + ' ' + c.title)
    const cset = new Set(ct)
    const score = qt.reduce((s, t) => s + (cset.has(t) ? idf(t) : 0), 0) / Math.sqrt(ct.length)
    return { c, score, hits: qt.filter((t) => cset.has(t)) }
  }).sort((a, b) => b.score - a.score)
}

export default function DemoRAGPlayground({ onInteract }) {
  const [qi, setQi] = useState(null)
  const [showRetrieval, setShowRetrieval] = useState(true)

  const ranked = useMemo(() => (qi == null ? [] : retrieve(QUESTIONS[qi].q)), [qi])
  const top = ranked.filter((r) => r.score > 0).slice(0, 2)
  const cur = qi == null ? null : QUESTIONS[qi]

  const ask = (i) => { onInteract?.(); setQi(i) }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {QUESTIONS.map((item, i) => (
          <button
            key={i}
            onClick={() => ask(i)}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium transition-all',
              qi === i ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700',
            )}
          >
            {item.q}
          </button>
        ))}
      </div>

      {cur == null ? (
        <div className="card flex items-center justify-center gap-2 p-8 text-sm italic txt-3">
          <Search size={15} /> Pick a question to chat with the Nimbus docs.
        </div>
      ) : (
        <div className="space-y-3">
          {/* retrieval */}
          <div className="card p-3">
            <div className="mb-2 flex items-center gap-2">
              <FileText size={14} className="text-brand-500 dark:text-brand-300" />
              <span className="text-xs font-semibold txt-1">Retrieved context</span>
              <span className="chip-brand ml-1">{top.length} chunk{top.length === 1 ? '' : 's'}</span>
              <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11px] txt-3">
                <input type="checkbox" checked={showRetrieval} onChange={(e) => setShowRetrieval(e.target.checked)} className="accent-brand-500" />
                show scores
              </label>
            </div>

            {top.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2.5 text-[11px] text-amber-600 dark:text-amber-400">
                <TriangleAlert size={14} className="shrink-0" /> No chunk scored above zero — nothing in the corpus matches. The grounded model must abstain.
              </div>
            ) : (
              <div className="space-y-1.5">
                {top.map((r) => (
                  <div key={r.c.id} className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="chip-zinc font-mono">{r.c.id}</span>
                      <span className="text-[11px] font-semibold txt-2">{r.c.title}</span>
                      {showRetrieval && <span className="ml-auto font-mono text-[10px] tabular-nums text-brand-500 dark:text-brand-300">score {r.score.toFixed(2)}</span>}
                    </div>
                    <p className="text-[11px] leading-relaxed txt-1">{r.c.text}</p>
                  </div>
                ))}
                {showRetrieval && (
                  <div className="pt-0.5 text-[10px] leading-snug txt-3">
                    scored by TF-IDF-ish keyword overlap over all {N} chunks; top 2 become the model's context
                  </div>
                )}
              </div>
            )}
          </div>

          {/* answers side by side */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* grounded */}
            <div className={cn('card p-3 ring-1', cur.absent ? 'ring-amber-500/40' : 'ring-emerald-500/40')}>
              <div className="mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold txt-1">Grounded (RAG)</span>
                <span className={cn('ml-auto', cur.absent ? 'chip-amber' : 'chip-green')}>{cur.absent ? 'abstains' : 'cited'}</span>
              </div>
              <p className="text-[12px] leading-relaxed txt-1">{cur.grounded}</p>
              <div className="mt-2 text-[10px] leading-snug txt-3">reads only the retrieved chunks — verifiable against the source</div>
            </div>

            {/* ungrounded */}
            <div className="card p-3 ring-1 ring-rose-500/40">
              <div className="mb-2 flex items-center gap-1.5">
                <Bot size={14} className="text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold txt-1">Ungrounded (no retrieval)</span>
                <span className="chip-rose ml-auto">{cur.wrong ? 'hallucinated' : 'guess'}</span>
              </div>
              <p className="text-[12px] leading-relaxed txt-1">{cur.ungrounded}</p>
              <div className="mt-2 flex items-start gap-1.5 text-[10px] leading-snug text-rose-600 dark:text-rose-400">
                <TriangleAlert size={12} className="mt-px shrink-0" />
                recalled from weights — sounds confident, but contradicts the docs
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Grounding turns <span className="txt-2">"recall from weights"</span> (fluent but hallucination-prone) into{' '}
        <span className="txt-2">"read and cite the provided text"</span> (checkable against a source) — and lets the system honestly say
        <span className="font-mono text-brand-500 dark:text-brand-300"> "I don't have that in the docs"</span> when the answer isn't retrieved.
        That's the core value of RAG: same model, but the answer is now anchored to evidence you control.
      </p>
    </div>
  )
}
