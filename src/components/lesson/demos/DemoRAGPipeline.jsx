import { useMemo, useState } from 'react'
import { HelpCircle, Binary, Search, Layers, Sparkles, ArrowRight, ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * The full RAG pipeline for one question: query -> embed -> retrieve -> augment -> generate.
 * The retrieval scores are REAL cosine similarity over hand-authored topic vectors
 * (dims below), so the ranking is honest and the answer cites ONLY the chunks it used.
 */

const DIMS = ['battery', 'solar', 'water', 'warranty', 'ports', 'price']

// Knowledge base: 6 short chunks about a fictional product so every answer is verifiable.
const CHUNKS = [
  { id: 1, tag: 'Battery', text: 'The Nimbus power bank holds 26,800 mAh — enough to recharge a typical smartphone about 5 times on a single charge.', vec: [1.0, 0.2, 0, 0, 0.15, 0] },
  { id: 2, tag: 'Solar', text: 'Its built-in 5W solar panel tops the pack up in sunlight; a full solar-only recharge takes roughly 20 hours of direct sun.', vec: [0.2, 1.0, 0, 0, 0.1, 0] },
  { id: 3, tag: 'Durability', text: 'The Nimbus is rated IP67: dust-tight and protected against submersion in up to 1 m of water for 30 minutes.', vec: [0, 0, 1.0, 0.1, 0, 0] },
  { id: 4, tag: 'Warranty', text: 'Every Nimbus ships with a 2-year limited warranty covering manufacturing defects (physical water damage is excluded).', vec: [0, 0, 0.15, 1.0, 0, 0.1] },
  { id: 5, tag: 'Ports', text: 'Ports: two 100W USB-C, one USB-A, plus a 15W Qi wireless pad on top for cable-free charging.', vec: [0.2, 0.1, 0, 0, 1.0, 0] },
  { id: 6, tag: 'Pricing', text: 'The Nimbus sells for $89 with free shipping and a 30-day return window for a full refund.', vec: [0, 0, 0, 0.25, 0, 1.0] },
]

const QUESTIONS = [
  {
    q: 'How many times can it charge my phone?',
    vec: [1.0, 0.1, 0, 0, 0.2, 0],
    grounded: [{ t: 'The Nimbus can recharge a typical smartphone about 5 times per charge, from its 26,800 mAh battery', c: 1 }, { t: '.', c: null }],
    naive: 'Most power banks charge a phone 1–2 times, so probably around 2. (No source — the model is guessing; the real answer is 5×.)',
  },
  {
    q: 'Is it safe to use in the rain?',
    vec: [0, 0, 1.0, 0.1, 0, 0],
    grounded: [{ t: 'Yes — it carries an IP67 rating, protected against dust and submersion in 1 m of water for 30 min, so light rain is no problem', c: 3 }, { t: '.', c: null }],
    naive: 'It should be fine in light rain, but check the manual to be sure. (Unverifiable guess — no rating cited.)',
  },
  {
    q: 'What is the warranty and return policy?',
    vec: [0, 0, 0.1, 1.0, 0, 0.5],
    grounded: [{ t: 'It includes a 2-year limited warranty on manufacturing defects', c: 4 }, { t: ', and you can return it within 30 days for a full refund', c: 6 }, { t: '.', c: null }],
    naive: 'Warranties are usually 1 year and returns around 14–30 days, but it varies by seller. (Model guessing.)',
  },
]

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}

const STAGES = [
  { key: 'ask', icon: HelpCircle, title: 'User question', blurb: 'The query the model must answer using YOUR private knowledge base.' },
  { key: 'embed', icon: Binary, title: 'Embed the query', blurb: 'The question becomes a vector so it can be compared to the stored chunk vectors.' },
  { key: 'retrieve', icon: Search, title: 'Retrieve top-K', blurb: 'Rank every chunk by cosine similarity to the query; keep the closest few.' },
  { key: 'augment', icon: Layers, title: 'Augment the prompt', blurb: 'Assemble: system instructions + retrieved chunks as context + the question.' },
  { key: 'generate', icon: Sparkles, title: 'Generate grounded answer', blurb: 'The model answers using ONLY the retrieved context, citing each chunk it used.' },
]

const K = 3

export default function DemoRAGPipeline({ onInteract }) {
  const [qi, setQi] = useState(0)
  const [step, setStep] = useState(0)
  const [showNaive, setShowNaive] = useState(false)

  const question = QUESTIONS[qi]

  const ranked = useMemo(
    () => CHUNKS.map((c) => ({ ...c, score: cosine(question.vec, c.vec) })).sort((a, b) => b.score - a.score),
    [question]
  )
  const topK = ranked.slice(0, K)
  const selected = topK.slice(0, 2) // chunks actually placed in the prompt
  const selIds = new Set(selected.map((c) => c.id))

  const pickQuestion = (i) => { setQi(i); setStep(0); setShowNaive(false) }
  const next = () => { onInteract?.(); setStep((s) => Math.min(STAGES.length - 1, s + 1)) }
  const back = () => setStep((s) => Math.max(0, s - 1))
  const restart = () => { setStep(0); setShowNaive(false) }

  const Stage = STAGES[step]

  return (
    <div>
      {/* question picker */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest txt-3">Ask the Nimbus knowledge base</div>
        <div className="flex flex-wrap gap-1.5">
          {QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => pickQuestion(i)}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all',
                i === qi ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
              )}
            >
              {q.q}
            </button>
          ))}
        </div>
      </div>

      {/* progress dots */}
      <div className="mb-3 flex items-center gap-1.5">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-1.5">
            <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
              i < step ? 'border-brand-500 bg-brand-500 text-white' : i === step ? 'border-brand-500 text-brand-500 dark:text-brand-300' : 'border-zinc-300 txt-3 dark:border-zinc-700')}>
              <s.icon size={13} />
            </div>
            {i < STAGES.length - 1 && <div className={cn('h-0.5 flex-1 rounded-full', i < step ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-800')} />}
          </div>
        ))}
      </div>

      {/* stage header */}
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold txt-1"><Stage.icon size={15} className="text-brand-500 dark:text-brand-300" /> {Stage.title}</div>
        <span className="chip-zinc">step {step + 1} of {STAGES.length}</span>
      </div>
      <p className="mb-2 text-[11px] leading-snug txt-3">{Stage.blurb}</p>

      {/* stage body */}
      <div className="min-h-[190px]">
        {Stage.key === 'ask' && (
          <div className="card p-4">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest txt-3">query</div>
            <div className="font-mono text-sm txt-1">“{question.q}”</div>
            <div className="mt-3 text-[11px] leading-relaxed txt-3">The knowledge base has {CHUNKS.length} chunks about the Nimbus. The model was never trained on them — RAG feeds them in at question time.</div>
          </div>
        )}

        {Stage.key === 'embed' && (
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2 font-mono text-xs txt-2">“{question.q}” <ArrowRight size={13} className="text-brand-500" /> <span className="txt-1">vector</span></div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {question.vec.map((v, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 p-1.5 text-center dark:border-zinc-800">
                  <div className="text-[9px] uppercase tracking-wide txt-3">{DIMS[i]}</div>
                  <div className="mt-1 h-10 flex items-end justify-center">
                    <div className="w-3 rounded-t bg-brand-500/80" style={{ height: `${8 + v * 32}px` }} />
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] tabular-nums txt-2">{v.toFixed(1)}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] leading-snug txt-3">Real embedders output hundreds of dimensions; here 6 named topic axes make the geometry legible. Same vector lives beside every stored chunk.</div>
          </div>
        )}

        {Stage.key === 'retrieve' && (
          <div className="space-y-1.5">
            {ranked.map((c, i) => {
              const inTop = i < K
              const used = selIds.has(c.id)
              return (
                <div key={c.id} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors',
                  used ? 'border-brand-500 bg-brand-500/10' : inTop ? 'border-zinc-300 dark:border-zinc-700' : 'border-zinc-200 opacity-55 dark:border-zinc-800')}>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold', used ? 'bg-brand-500 text-white' : 'bg-zinc-200 txt-2 dark:bg-zinc-800')}>{c.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] txt-2"><span className="font-semibold txt-1">{c.tag}.</span> {c.text}</span>
                  <div className="flex w-24 shrink-0 items-center gap-1.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className="h-full rounded-full bg-brand-500" style={{ width: `${c.score * 100}%` }} /></div>
                    <span className="font-mono text-[10px] tabular-nums text-brand-500 dark:text-brand-300">{c.score.toFixed(2)}</span>
                  </div>
                  {used && <span className="chip-brand shrink-0">used</span>}
                </div>
              )
            })}
            <div className="text-[10px] leading-snug txt-3">Score = cosine(query, chunk). Top-{K} are the candidates; the {selected.length} closest get placed in the prompt.</div>
          </div>
        )}

        {Stage.key === 'augment' && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="text-brand-500 dark:text-brand-300">### System</div>
            <div className="txt-2">Answer using ONLY the context. Cite sources as [n]. If the context is insufficient, say so.</div>
            <div className="mt-2 text-brand-500 dark:text-brand-300">### Context</div>
            {selected.map((c) => (
              <div key={c.id} className="txt-1">[{c.id}] {c.text}</div>
            ))}
            <div className="mt-2 text-brand-500 dark:text-brand-300">### Question</div>
            <div className="txt-1">{question.q}</div>
          </div>
        )}

        {Stage.key === 'generate' && (
          <div className="space-y-2">
            <div className="rounded-xl border border-brand-500/40 bg-brand-500/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-300"><Sparkles size={12} /> grounded answer</div>
              <p className="text-sm leading-relaxed txt-1">
                {question.grounded.map((seg, i) => (
                  <span key={i}>{seg.t}{seg.c != null && <sup className="ml-0.5 rounded bg-brand-500/15 px-1 font-mono text-[9px] font-bold text-brand-600 dark:text-brand-300">[{seg.c}]</sup>}</span>
                ))}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.map((c) => (
                  <span key={c.id} className="chip-zinc text-[10px]"><span className="font-mono">[{c.id}]</span> {c.tag}</span>
                ))}
              </div>
            </div>

            <button onClick={() => setShowNaive((v) => !v)} className="btn-outline px-2.5 py-1 text-[11px]">
              <AlertTriangle size={12} /> {showNaive ? 'Hide' : 'Show'} the answer WITHOUT retrieval
            </button>
            {showNaive && (
              <div className="animate-fade-up rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400"><AlertTriangle size={12} /> no retrieval — model guesses</div>
                <p className="text-sm leading-relaxed txt-2">{question.naive}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* nav */}
      <div className="mt-3 flex items-center gap-2">
        <button onClick={back} disabled={step === 0} className="btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-40"><ArrowLeft size={13} /> Back</button>
        {step < STAGES.length - 1 ? (
          <button onClick={next} className="btn-primary px-3 py-1.5 text-xs">Next step <ArrowRight size={13} /></button>
        ) : (
          <button onClick={restart} className="btn-outline px-3 py-1.5 text-xs"><RotateCcw size={12} /> Restart</button>
        )}
        <span className="ml-auto text-[10px] txt-3">{STAGES[step].title}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        RAG = <span className="txt-2">retrieve</span> relevant context, then <span className="txt-2">generate</span> an answer grounded in it. It's how you give a
        model your <span className="txt-2">private or fresh</span> knowledge without retraining — and the inline
        <span className="font-mono text-brand-500 dark:text-brand-300"> [citations]</span> make every claim traceable back to a source chunk, so answers are verifiable.
      </p>
    </div>
  )
}
