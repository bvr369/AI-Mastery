// Lesson 6.7 — Checkpoint: Search Quality Challenge

export default {
  sections: [
    {
      id: 'briefing',
      title: 'Checkpoint briefing: stop guessing, start measuring',
      blocks: [
        { type: 'p', text: "You can now embed text, store vectors, chunk documents, and blend keyword + semantic search with a reranker on top. That's a full retrieval stack. But here's the uncomfortable question that separates a demo from a product: **is it actually any good?** \"It felt right in the three queries I tried\" is not an answer an engineer gives. This checkpoint is about the discipline that turns retrieval from vibes into a number you can move." },
        { type: 'callout', variant: 'info', text: "**Rules of engagement:** five hard, interview-shaped questions spanning the *whole* module — embeddings, [[Cosine Similarity]], vector DBs, [[Chunking]], hybrid/rerank, and evals. Read every explanation, right or wrong — the explanation is the lesson. Then the flash-review and a build-a-real-eval project seal it in." },
        { type: 'h', text: 'The one idea: retrieval is a measurable system' },
        { type: 'p', text: "Every tuning decision you've learned — chunk size, top-K, hybrid weighting, whether to add a reranker — is a knob. Knobs without a gauge are gambling. The gauge is a **retrieval eval**: a small labeled set of `query -> relevant chunk ids`, plus a couple of metrics computed over what your retriever returns. Build that once and every future change becomes an experiment with a verdict instead of an argument." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: retrieval eval is a unit test suite for search', text: "You'd never refactor a function without tests and just *hope* you didn't break it. A retrieval eval is exactly that: `query` is the input, the labeled relevant chunks are the expected output, and precision/recall are your assertions. Change the chunker, re-run the suite, read the diff. Green means ship; red means you just learned something before your users did." },
        { type: 'h', text: 'The four metrics you must be able to define cold' },
        { type: 'p', text: "You retrieve the top-K chunks for a query. Some are truly relevant (in your labeled set), some aren't. The metrics are just different ways of scoring that list:" },
        { type: 'table', headers: ['Metric', 'Question it answers', 'Formula (per query, then averaged)'], rows: [
          ['**Precision@K**', 'Of the K I returned, what fraction were relevant?', '`relevant_in_topK / K`'],
          ['**Recall@K**', 'Of all relevant chunks that exist, what fraction did I retrieve?', '`relevant_in_topK / total_relevant`'],
          ['**Hit-rate@K**', 'Did at least ONE relevant chunk make the top-K?', '`1 if any_relevant_in_topK else 0`'],
          ['**MRR**', 'How high up was the FIRST relevant hit?', '`1 / rank_of_first_relevant`'],
        ] },
        { type: 'p', text: "**[[MRR]]** (Mean Reciprocal Rank) deserves a note because it's the RAG favorite: if the first relevant chunk is at position 1 you score 1.0; position 2 scores 0.5; position 5 scores 0.2. It rewards putting the good stuff *at the top* — which is exactly what matters when a reranker feeds a limited context window. Hit-rate is MRR's blunt cousin: it only asks *whether* you found something, not *where*." },
        { type: 'h', text: 'Precision vs recall: the tension you cannot escape' },
        { type: 'p', text: "Turn K up and you retrieve more chunks. **Recall goes up** (you catch more of the relevant ones) but **precision usually goes down** (you also drag in junk). Turn a similarity threshold up and the opposite happens: precision climbs, recall drops. There is no setting that maxes both — you're always trading. The right trade depends on what's downstream:" },
        { type: 'list', items: [
          "**Feeding an LLM (RAG)?** Lean toward *recall* — a strong model can ignore an irrelevant chunk, but it can't cite a chunk you never retrieved. Missing evidence is fatal; extra evidence is (mostly) survivable.",
          "**Showing results directly to a human (search UI)?** Lean toward *precision* — nobody scrolls past three garbage results. Rank quality (MRR) matters more than catching every last match.",
          "**Latency/cost bound?** Smaller K is cheaper to rerank and cheaper on prompt tokens. Precision-first keeps K small.",
        ] },
        { type: 'h', text: 'Why you measure retrieval SEPARATELY from generation' },
        { type: 'p', text: "This is the single most valuable debugging instinct in RAG, and it's the checkpoint's punchline. When a RAG answer is wrong, there are two suspects: the **retriever** handed the LLM the wrong chunks, or the retriever was fine and the **generator** fumbled good context. If you only eval the final answer, you can't tell which — and you'll waste days prompt-tuning a generation step that was never the problem." },
        { type: 'callout', variant: 'warn', title: 'The 80/20 of broken RAG', text: "In practice, most bad RAG answers are **retrieval failures**, not generation failures. If the right chunk isn't in the context, no prompt on earth saves you — the model is grounded on garbage. So eval retrieval *first and independently*: check recall@K on your labeled set. If the relevant chunk isn't being retrieved, stop touching the prompt and go fix chunking, K, or hybrid weighting." },
        { type: 'callout', variant: 'tip', title: 'The tuning loop', text: "It's a boring, powerful loop: (1) build a labeled set, (2) measure your baseline, (3) change ONE thing — chunk size, K, add hybrid, add a reranker, (4) re-measure, (5) keep it only if the number went up. Change one variable at a time or you won't know what worked. This is A/B testing for search, and it's what \"tuning retrieval\" actually means on the job." },
      ],
    },
    {
      id: 'the-challenge',
      title: 'The challenge: tune K and threshold, watch the trade-off',
      blocks: [
        { type: 'p', text: "Enough theory — feel the tension. The demo below runs a retriever against a labeled ground-truth set and plots **precision** and **recall** as you turn the two main knobs: **top-K** and the **similarity threshold**. Your challenge: find a setting that beats the target on *both* without cranking K so high the results are mostly noise." },
        { type: 'demo', id: 'retrieval-eval' },
        { type: 'p', text: "Watch what happens as you drag K up: recall climbs toward 1.0 (you're catching every relevant chunk) but precision sags (you're also hauling in irrelevant ones). Raise the threshold instead and you filter out weak matches — precision recovers, but a few borderline-relevant chunks fall below the cut and recall dips. That seesaw is the whole game. There's no free lunch; there's only the trade that fits what's downstream." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a fishing net', text: "Top-K is the size of your net. A huge net (big K) catches every fish you wanted — great recall — but also boots, seaweed, and tires — poor precision. A tiny, fine net (small K, high threshold) brings up only prize fish — great precision — but the ones that slipped the edges are gone forever — poor recall. Tuning retrieval is choosing the net for what you're cooking tonight." },
      ],
    },
    {
      id: 'score-it',
      title: 'Score a retriever yourself (runnable)',
      blocks: [
        { type: 'p', text: "Metrics stop being abstract the moment you compute them. Below is a complete, runnable eval: a tiny corpus, a labeled ground-truth set of `query -> relevant chunk ids`, a toy retriever, and functions that compute **precision@k** and **recall@k**. Run it, read the baseline, then do the exercise: tune K to beat the target average recall." },
        { type: 'playground', id: 'eval-scorer', title: 'Compute precision@k and recall@k against ground truth', height: 620, lang: 'javascript', code: `// A retrieval eval in ~40 lines. This is the real algorithm, just tiny.

// 1) The corpus: id -> a keyword "fingerprint" standing in for an embedding.
const corpus = {
  d1: ['reset', 'password', 'login'],
  d2: ['forgot', 'login', 'account'],
  d3: ['refund', 'return', 'policy'],
  d4: ['two', 'factor', 'authentication', 'login'],
  d5: ['billing', 'invoice', 'charge'],
  d6: ['password', 'change', 'security'],
}

// 2) Ground truth: for each query, the ids a human labeled as RELEVANT.
const groundTruth = {
  'how do I log back in': ['d1', 'd2'],
  'update my password':   ['d1', 'd6'],
  'get my money back':    ['d3'],
}

// 3) A toy retriever: score by shared keywords, return ids best-first.
//    (Stand-in for cosine similarity over real embeddings.)
function retrieve(query, k) {
  const terms = query.toLowerCase().split(' ')
  return Object.entries(corpus)
    .map(([id, words]) => {
      const overlap = words.filter(w => terms.includes(w)).length
      return { id, score: overlap }
    })
    .filter(r => r.score > 0)          // drop zero-overlap docs
    .sort((a, b) => b.score - a.score) // best first
    .slice(0, k)
    .map(r => r.id)
}

// 4) The metrics — the heart of the eval.
function precisionAtK(retrieved, relevant) {
  if (retrieved.length === 0) return 0
  const hits = retrieved.filter(id => relevant.includes(id)).length
  return hits / retrieved.length              // of what I returned, how much was good
}
function recallAtK(retrieved, relevant) {
  if (relevant.length === 0) return 0
  const hits = retrieved.filter(id => relevant.includes(id)).length
  return hits / relevant.length               // of all the good, how much did I catch
}

// 5) Run the whole labeled set at a given K and average.
function evaluate(k) {
  let pSum = 0, rSum = 0, n = 0
  for (const [query, relevant] of Object.entries(groundTruth)) {
    const retrieved = retrieve(query, k)
    const p = precisionAtK(retrieved, relevant)
    const r = recallAtK(retrieved, relevant)
    console.log(\`  [K=\${k}] "\${query}"  ->  \${JSON.stringify(retrieved)}  P=\${p.toFixed(2)} R=\${r.toFixed(2)}\`)
    pSum += p; rSum += r; n++
  }
  return { precision: pSum / n, recall: rSum / n }
}

const K = 2
console.log(\`Evaluating retriever at K=\${K}:\`)
const { precision, recall } = evaluate(K)
console.log(\`\\nAVG precision@\${K} = \${precision.toFixed(3)}\`)
console.log(\`AVG recall@\${K}    = \${recall.toFixed(3)}\`)
console.log('\\nTarget: average recall >= 0.90. Beat it by tuning K.')`, solution: `// SOLUTION: sweep K and pick the smallest K that hits recall >= 0.90.
// (Smallest-K-that-passes = best precision among the passing options.)
const corpus = {
  d1:['reset','password','login'], d2:['forgot','login','account'],
  d3:['refund','return','policy'],  d4:['two','factor','authentication','login'],
  d5:['billing','invoice','charge'], d6:['password','change','security'],
}
const groundTruth = {
  'how do I log back in':['d1','d2'], 'update my password':['d1','d6'], 'get my money back':['d3'],
}
function retrieve(query, k) {
  const terms = query.toLowerCase().split(' ')
  return Object.entries(corpus)
    .map(([id, words]) => ({ id, score: words.filter(w => terms.includes(w)).length }))
    .filter(r => r.score > 0).sort((a,b)=>b.score-a.score).slice(0,k).map(r=>r.id)
}
const recallAtK = (ret, rel) => rel.length ? ret.filter(id=>rel.includes(id)).length/rel.length : 0
const precisionAtK = (ret, rel) => ret.length ? ret.filter(id=>rel.includes(id)).length/ret.length : 0
function evaluate(k) {
  let p=0,r=0,n=0
  for (const [q, rel] of Object.entries(groundTruth)) {
    const ret = retrieve(q,k); p+=precisionAtK(ret,rel); r+=recallAtK(ret,rel); n++
  }
  return { precision:p/n, recall:r/n }
}
for (let k=1; k<=5; k++) {
  const { precision, recall } = evaluate(k)
  const pass = recall >= 0.90 ? '  <-- beats target' : ''
  console.log(\`K=\${k}: precision=\${precision.toFixed(3)} recall=\${recall.toFixed(3)}\${pass}\`)
}
// Notice recall rises with K while precision falls: the core trade-off,
// measured instead of guessed. Pick the smallest K that clears the bar.`, caption: '**Exercise:** the baseline runs at K=2. Wrap `evaluate(k)` in a loop over K = 1..5, print average precision and recall for each, and find the smallest K where average recall reaches 0.90. Watch precision drop as you climb. (Solution provided.)' },
        { type: 'h', text: 'The same harness, production-shaped (Python)' },
        { type: 'p', text: "In a real project the retriever calls a vector DB and the ground truth lives in a JSON or CSV file that grows as you find failure cases. The eval loop is identical — embed the query, retrieve top-K, compare ids to labels, average the metrics. Here's the shape you'll actually write and re-run on every change." },
        { type: 'code', lang: 'python', filename: 'eval_retriever.py', code: `import json, numpy as np

# ground_truth.json:  { "query text": ["chunk_id_1", "chunk_id_2"], ... }
ground_truth = json.load(open("ground_truth.json"))

def retrieve(query: str, k: int) -> list[str]:
    """Embed the query, hit the vector DB, return top-k chunk ids."""
    qvec = embed(query)                      # same model used to index!
    hits = vector_db.query(qvec, top_k=k)    # e.g. Pinecone / pgvector / Qdrant
    return [h.id for h in hits]

def precision_recall_at_k(retrieved, relevant):
    hits = len(set(retrieved) & set(relevant))
    precision = hits / len(retrieved) if retrieved else 0.0
    recall    = hits / len(relevant)  if relevant  else 0.0
    return precision, recall

def mrr(retrieved, relevant):
    for rank, cid in enumerate(retrieved, start=1):
        if cid in relevant:
            return 1.0 / rank                # reward the FIRST relevant hit's position
    return 0.0

def evaluate(k: int) -> dict:
    P, R, M = [], [], []
    for query, relevant in ground_truth.items():
        retrieved = retrieve(query, k)
        p, r = precision_recall_at_k(retrieved, relevant)
        P.append(p); R.append(r); M.append(mrr(retrieved, relevant))
    return {
        "precision@k": float(np.mean(P)),
        "recall@k":    float(np.mean(R)),
        "mrr":         float(np.mean(M)),
        "hit_rate":    float(np.mean([1.0 if r > 0 else 0.0 for r in R])),
    }

# The tuning loop: change ONE knob, re-run, keep what wins.
baseline = evaluate(k=5)
print("baseline:", baseline)
# ...now change chunk size / add hybrid / add a reranker, re-run, compare.
# If recall@k didn't move, the fix is in retrieval — not the LLM prompt.` , caption: 'Run this before and after every retrieval change. The number, not your gut, decides whether the change ships.' },
        { type: 'callout', variant: 'info', title: 'Where the labels come from', text: "The hardest part of an eval isn't the code — it's the ground truth. Three practical sources: (1) hand-label 20-50 real queries from your logs, marking which chunks *should* answer each; (2) synthesize — have an LLM read a chunk and generate a question it answers, giving you `(question -> chunk)` pairs for free; (3) mine click/thumbs-up data once you're in production. Start with 20 hand-labeled queries. Even a tiny labeled set beats zero, because zero means you're flying blind." },
      ],
    },
    {
      id: 'quiz',
      title: 'The search-quality gauntlet',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your RAG bot gives a confidently wrong answer. You have limited time. What do you check FIRST, and why?',
            options: [
              'Rewrite the generation prompt — the model clearly misunderstood the instructions',
              'Check retrieval: run the query and inspect whether the relevant chunk was in the top-K at all',
              'Lower the temperature to 0 to make the answer more factual',
              'Switch to a larger, more capable generation model',
            ],
            answer: 1,
            explain: 'Most bad RAG answers are retrieval failures, not generation failures. If the correct chunk never reached the context, no prompt or bigger model can fix it — the model is grounded on the wrong evidence. Always eval retrieval independently and first: check recall@K on the failing query before touching the prompt.',
          },
          {
            q: 'You increase top-K from 3 to 20. On your labeled eval, recall@K jumps from 0.6 to 0.95 but precision@K falls from 0.8 to 0.25. For a RAG pipeline feeding an LLM, is this a good trade?',
            options: [
              'No — precision dropping below 0.5 always means the retriever is broken',
              'It depends, but generally yes-ish: for RAG, missing the relevant chunk is fatal while extra chunks are mostly tolerable, so higher recall is usually worth some precision — bounded by context-window and cost limits',
              'Yes, unconditionally — recall is the only metric that matters',
              'No — you should always maximize precision and recall equally',
            ],
            answer: 1,
            explain: 'Precision and recall trade off; you can\'t max both. For RAG, recall is usually weighted higher because a capable model can ignore an irrelevant chunk but cannot cite one it never received. The catch is real: K=20 costs more prompt tokens, adds latency, and can bury the key chunk — which is exactly why rerankers exist (retrieve wide for recall, rerank to restore precision at the top).',
          },
          {
            q: 'Two RAG configs both get recall@5 = 0.9. Config A has MRR = 0.8; Config B has MRR = 0.35. If a reranker then keeps only the top 2 chunks, which config is better and why?',
            options: [
              'They\'re identical — same recall means same quality',
              'Config B — lower MRR means more diverse results',
              'Config A — higher MRR means relevant chunks sit near the TOP, so they survive the top-2 cut; B\'s relevant chunks are ranked low and get discarded',
              'Config A — but only because MRR measures precision',
            ],
            answer: 2,
            explain: 'Recall@5 only says the relevant chunk is somewhere in the top 5; it doesn\'t say where. MRR captures *rank position* of the first relevant hit. When a downstream step (reranker, small context budget) keeps only the top few, ranking quality decides everything. A\'s relevant chunks are high (MRR 0.8 ≈ around position 1-2) and survive the cut; B\'s are low and get thrown away despite equal recall.',
          },
          {
            q: 'Semantic-only search fails on a query for the error code "ERR_2043" — the exact code exists verbatim in a doc but doesn\'t rank. What\'s happening, and the standard fix?',
            options: [
              'The embedding model is broken; retrain it on your error codes',
              'Embeddings capture meaning, not rare exact tokens — a random code has weak semantic signal. Fix: hybrid search (combine dense embeddings with sparse keyword/BM25) so exact matches are caught too',
              'Increase top-K to 1000 so the doc is eventually included',
              'Codes can never be retrieved; hardcode a lookup table for each one',
            ],
            answer: 1,
            explain: 'This is the classic dense-retrieval blind spot. Embeddings excel at paraphrase and intent but struggle with rare, meaningless-to-the-model exact strings (SKUs, error codes, IDs, names). Keyword/BM25 nails exact matches but misses paraphrases. Hybrid search fuses both scores, getting the best of each — which is precisely why production retrieval is usually hybrid, not pure vector.',
          },
          {
            q: 'You change your chunk size from 1000 to 250 tokens and recall@10 improves on your eval, but answer quality in the app gets noticeably worse. Most likely cause?',
            options: [
              'The eval is wrong — recall improving always means quality improves',
              'Smaller chunks retrieve the right SPOT more precisely (higher recall) but each chunk now lacks surrounding context, so the LLM gets fragments too small to reason over — retrieval improved while grounding got worse',
              'The embedding model can\'t handle 250-token inputs',
              'Recall@10 and answer quality are unrelated, so this is coincidence',
            ],
            answer: 1,
            explain: 'A sharp cross-lesson trap. Tiny chunks pinpoint the relevant location (recall up) but strip the context the model needs to actually answer — a sentence retrieved without its paragraph can mislead. This is why retrieval eval and end-to-end answer eval are BOTH needed: optimizing recall alone can quietly degrade generation. The usual fix is moderate chunks with overlap, or retrieving small but expanding to the parent chunk before generation.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Module flash-review',
      blocks: [
        { type: 'p', text: "Six cards distilling Module 6's most interview-quoted facts. These join your spaced-repetition deck — the retrieval-eval vocabulary is exactly what senior AI-engineering screens probe." },
        { type: 'flashcards', cards: [
          { id: 'm6-l7-c1', front: 'Precision@K vs Recall@K in one line each?', back: 'Precision@K = of the K you returned, the fraction that were relevant (`hits/K`). Recall@K = of all relevant chunks, the fraction you retrieved (`hits/total_relevant`). Raising K lifts recall, usually lowers precision.' },
          { id: 'm6-l7-c2', front: 'What does MRR reward, and why care for RAG?', back: 'Mean Reciprocal Rank scores the position of the FIRST relevant hit (`1/rank`): pos 1 = 1.0, pos 5 = 0.2. It rewards putting good chunks at the TOP — critical when a reranker or small context window keeps only the first few.' },
          { id: 'm6-l7-c3', front: 'Why eval retrieval SEPARATELY from generation?', back: 'A wrong RAG answer has two suspects: bad retrieval or bad generation. Eval only the final answer and you can\'t tell which. Most failures are retrieval — if the right chunk isn\'t in context, no prompt saves you. Check recall@K first.' },
          { id: 'm6-l7-c4', front: 'The precision/recall trade — how to pick a side?', back: 'You can\'t max both. RAG (feeds an LLM) → favor recall; a missing chunk is fatal, an extra one is tolerable. Human-facing search UI → favor precision/MRR; nobody scrolls past junk. Bounded by cost/latency/context.' },
          { id: 'm6-l7-c5', front: 'Why is production retrieval usually HYBRID?', back: 'Dense embeddings capture meaning/paraphrase but miss rare exact tokens (error codes, SKUs, names). Sparse keyword/BM25 nails exact matches but misses paraphrases. Hybrid fuses both scores to cover each other\'s blind spots.' },
          { id: 'm6-l7-c6', front: 'The retrieval tuning loop?', back: 'Build a labeled `query->relevant chunks` set, measure a baseline, change ONE knob (chunk size / K / hybrid weight / reranker), re-measure, keep it only if the metric rose. One variable at a time — it\'s A/B testing for search.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'A retrieval eval is a labeled `query -> relevant chunk ids` set plus metrics — a unit-test suite for search that turns tuning from vibes into verdicts.',
          'Precision@K, Recall@K, Hit-rate@K, and MRR each score the returned list differently; MRR (rewards top rank) is the RAG favorite.',
          'Precision and recall trade off: bigger K raises recall, lowers precision. RAG leans recall; human-facing search leans precision — bounded by cost, latency, and context.',
          'Eval retrieval SEPARATELY from generation. Most bad RAG answers are retrieval failures — check recall@K before ever touching the prompt.',
          'The tuning loop: baseline, change ONE knob (chunk / K / hybrid / rerank), re-measure, keep what wins. Hybrid + rerank exist to reconcile the recall/precision trade.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Judging retrieval by "it felt right on a few queries"', text: 'Three lucky queries prove nothing and hide the tail of failures your users will hit. Build even a 20-query labeled set and compute a number. Anecdotes don\'t survive a code review; metrics do.' },
          { title: 'Only evaluating the final answer', text: 'End-to-end answer eval can\'t tell you whether retrieval or generation broke. You\'ll prompt-tune for days on a problem that was actually a missing chunk. Always measure retrieval independently first — recall@K is the fast diagnostic.' },
          { title: 'Chasing recall until precision collapses', text: 'Cranking K to catch every relevant chunk floods the context with noise, spikes token cost and latency, and can bury the key chunk so deep the model ignores it. Retrieve wide for recall, then rerank to restore precision at the top — don\'t just raise K forever.' },
          { title: 'Tuning multiple knobs at once', text: 'Change chunk size AND K AND add a reranker in one commit, and when the metric moves you have no idea which change did it — or whether two changes cancelled out. One variable per experiment, re-measure, then the next. It\'s slower per step and far faster overall.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you know your RAG system\'s retrieval is actually good?"', a: 'I build a retrieval eval: a labeled set of representative queries, each mapped to the chunk ids that should answer it (hand-labeled from logs, plus LLM-synthesized question→chunk pairs). Then I compute recall@K, precision@K, and MRR over that set. Recall@K tells me if the right chunks are being found at all; MRR tells me if they\'re ranked high enough to survive a reranker or a small context budget. I re-run this on every retrieval change so tuning is measured, not guessed.' },
          { q: '"A RAG answer is wrong. Walk me through debugging it."', a: 'First I split the problem: was it retrieval or generation? I re-run the query and inspect the retrieved chunks. If the chunk that contains the answer isn\'t in the top-K, it\'s a retrieval failure — I look at chunking, K, and whether I need hybrid search for exact terms, and I check recall@K on my eval. Only if the right chunk WAS retrieved do I look at the generation prompt. Most of the time it\'s retrieval, so checking that first saves the most time.' },
          { q: '"When would you trade precision for recall, or the reverse?"', a: 'It depends on what\'s downstream of retrieval. For RAG feeding an LLM, I favor recall — a capable model can ignore an irrelevant chunk but can\'t use one it never got, so missing evidence is the worse failure. For a search results page a human scrolls, I favor precision and rank quality (MRR) because irrelevant top results destroy trust. And I bound recall by context-window size, token cost, and latency — which is why I\'d retrieve wide then rerank rather than just increasing K indefinitely.' },
          { q: '"Why is production retrieval usually hybrid rather than pure vector search?"', a: 'Dense embeddings are great at meaning and paraphrase but weak on rare exact tokens — error codes, SKUs, proper names, IDs — because those carry little semantic signal. Keyword/BM25 is the mirror image: perfect on exact matches, blind to paraphrase. Hybrid search fuses both scores so each covers the other\'s blind spot. I\'d validate the fusion weighting on my eval set rather than guessing it, and often add a reranker on top to fix final ranking.' },
        ] },
        { type: 'usecases', items: [
          { title: 'RAG regression suites in CI', text: 'Teams commit a labeled retrieval eval and run it in CI on every change to the chunker, embedding model, or index config. A drop in recall@K blocks the merge — search quality becomes a tested contract, not a hope.' },
          { title: 'Ragas / eval frameworks', text: 'Tools like Ragas, TruLens, and LlamaIndex\'s evaluators compute context recall/precision and answer faithfulness so teams can score retrieval and generation separately — productizing exactly this checkpoint\'s discipline.' },
          { title: 'Choosing an embedding model with data', text: 'Before committing to an embedding model, teams run each candidate through the same labeled eval and pick by recall@K/MRR on THEIR corpus — because MTEB leaderboard rank rarely matches your domain\'s ranking.' },
          { title: 'Tuning K and rerankers in production', text: 'Retrieval evals decide whether adding a cross-encoder reranker or bumping K actually earns its latency and cost — the metric, not intuition, justifies the extra compute.' },
        ] },
        { type: 'project', title: 'Build a real retrieval eval', goal: 'Turn a retriever from "seems fine" into a measured system: label five queries, compute precision@k and recall@k, then tune to beat a baseline.', steps: [
          'Take a small corpus (10-20 chunks from real docs, or reuse the playground\'s). Write 5 realistic queries a user might actually type.',
          'For each query, hand-label the chunk ids that genuinely answer it — this is your ground truth. Store it as a `{ query: [ids] }` object or JSON file.',
          'Run your search (the playground retriever, or a real embedding + cosine search) and compute average precision@k and recall@k at K=3. Record this as your baseline.',
          'Change ONE knob — raise K, add a keyword/hybrid pass, or re-chunk — and re-run the eval. Note what moved and in which direction.',
          'Report: baseline vs tuned, which metric improved, and the precision/recall trade you observed. State whether you\'d ship the change for a RAG use case and why.',
        ], deliverable: 'An `eval.md` (or notebook) with your 5 labeled queries, baseline and tuned precision@k/recall@k numbers, the one change you made, and a one-paragraph verdict.' },
        { type: 'challenge', title: 'Write the next checkpoint', text: 'Author THREE new hard, scenario-first search-quality questions this checkpoint SHOULD have asked — each with four options, a 0-based correct answer, and an explanation that teaches. Writing good distractors forces sharper understanding than answering ever does.', hints: [
          'Steal the scenario-first shape: "Your recall jumped but answers got worse…", "Two configs, same recall, different MRR…".',
          'The nastiest distractors are true statements that don\'t answer THIS question — e.g. a real fact about embeddings offered as the reason for a chunking bug.',
          'Cross-lesson combos are the hardest: chunk size × recall, hybrid × exact-token queries, MRR × reranking. Aim for at least one that spans two lessons.',
        ] },
        { type: 'reading', links: [
          { label: 'Ragas: RAG evaluation metrics', url: 'https://docs.ragas.io/en/stable/concepts/metrics/', note: 'The go-to open-source RAG eval library — context precision/recall and faithfulness, the production version of this lesson.' },
          { label: 'Pinecone: Evaluation measures in IR', url: 'https://www.pinecone.io/learn/offline-evaluation/', note: 'A clear, developer-focused primer on precision@k, recall@k, MRR, and MAP with worked examples — the metric definitions, solidified.' },
          { label: 'MTEB: Massive Text Embedding Benchmark', url: 'https://huggingface.co/spaces/mteb/leaderboard', note: 'How embedding models are evaluated at scale across retrieval tasks — use it to shortlist candidates, then validate on YOUR labeled set.' },
        ] },
      ],
    },
  ],
}
