// Lesson 6.5 — Hybrid Search & Reranking

export default {
  sections: [
    {
      id: 'two-blind-spots',
      title: 'Vector search is smart, but it has blind spots',
      blocks: [
        { type: 'p', text: "By now you can build semantic search: [[Chunking|chunk]] your docs, embed them, store the vectors, and retrieve by [[Cosine Similarity]]. It feels like magic — until it quietly fails on the exact queries your users care about most. This lesson is about the two failure modes of pure vector search and the two production techniques that fix them: **hybrid search** and **reranking**. Together they're the biggest quality lever you have after chunking." },
        { type: 'p', text: "Here's the uncomfortable truth: an [[Embedding]] is a *lossy summary of meaning*. That's exactly what makes it great at paraphrase — and exactly what makes it bad at precision. It blurs. It captures the gist and throws away the specifics. And the specifics are often the whole point of the query." },
        { type: 'h', text: 'Where pure vector search fails' },
        { type: 'p', text: "Embeddings smear over anything that has meaning *because of its exact characters*, not its semantics. That includes a huge, high-value slice of real queries:" },
        { type: 'list', items: [
          "**Exact terms & rare tokens** — a user searching for `useEffect` doesn't want \"React lifecycle hooks in general,\" they want the one about `useEffect`. Embeddings pull the whole neighborhood; they can't tell a rare token apart from its common cousins.",
          "**Names, IDs, and codes** — `ERR_2043`, invoice `#88214`, the customer \"Acme Corp\", SKU `GX-9`. These have almost no *semantic* content — their value is that they match a specific string. Two different error codes embed to nearly the same blurry point.",
          "**Acronyms & jargon** — `SSO`, `p95`, `RAG`. Short, meaning-dense strings the embedding often flattens into something generic.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: describing a book to a librarian', text: "Semantic search is a brilliant librarian who understands *what you mean*. Say \"that sad novel about a green light and a rich guy on Long Island\" and they hand you Gatsby — no title needed. But ask for \"ISBN 978-0743273565\" and they get a faraway look and bring you three books that *feel* similar. For the ISBN you don't want a librarian who understands meaning — you want `Ctrl+F`. Real search needs both people on staff." },
        { type: 'h', text: 'Where keyword search fails' },
        { type: 'p', text: "The old-school fix for all that is **keyword search** — specifically [[BM25]], the ranking function behind Elasticsearch, Lucene, and Postgres full-text search. BM25 scores a document by how many query *terms* it contains, weighted so rare words count more and common words (`the`, `is`) count less. It's exact, fast, decades-proven, and completely literal. Which is also its weakness:" },
        { type: 'list', items: [
          "**Paraphrases miss.** \"My card was declined\" and \"payment failed at checkout\" share zero content words. BM25 scores that a near-zero match; the right doc never surfaces.",
          "**Synonyms miss.** \"laptop\" won't find a doc that only says \"notebook computer.\" \"Cancel my subscription\" won't find \"end your membership.\"",
          "**Intent is invisible.** BM25 matches strings, not goals. It has no idea that \"I can't log in\" and \"authentication error\" are the same problem.",
        ] },
        { type: 'callout', variant: 'info', title: 'The two are complementary, not competing', text: "Notice the symmetry: vector search nails paraphrase and dies on exact terms; keyword search nails exact terms and dies on paraphrase. Their failure modes are almost perfect mirror images. That's the entire insight behind hybrid search — you don't pick one, you run both and fuse the results so each covers the other's blind spot." },
      ],
    },
    {
      id: 'hybrid-fusion',
      title: 'Hybrid search: run both, then fuse the scores',
      blocks: [
        { type: 'p', text: "Hybrid search is exactly what it sounds like: for each query, run a [[BM25]] keyword search **and** a vector search, then combine the two ranked lists into one. The only real question is *how* you combine them — and this is where beginners trip." },
        { type: 'h', text: 'Why you can\'t just add the scores' },
        { type: 'p', text: "The naive move is `final = bm25_score + cosine_score`. Don't. The two scores live on totally different scales: BM25 is an unbounded positive number (could be 2.1 or 87.4 depending on term rarity and corpus), while cosine similarity is pinned between −1 and 1. Add them and BM25's big numbers swamp cosine every time. You'd have a keyword search wearing a semantic-search costume." },
        { type: 'p', text: "You *could* min-max normalize each score to [0, 1] and take a weighted blend — and that works if you tune it. But the scores are still fragile: one outlier BM25 hit stretches the normalization and distorts everything. The production-standard answer sidesteps score scales entirely by throwing the scores away and using only the **ranks**." },
        { type: 'h', text: 'Reciprocal Rank Fusion (RRF): the workhorse' },
        { type: 'p', text: "[[Reciprocal Rank Fusion]] (RRF) is the default fusion method in Elasticsearch, OpenSearch, Weaviate, and most hybrid stacks, because it's dead simple and shockingly robust. For each document, look at its *position* in each result list and score it as one-over-its-rank (plus a small constant *k*, usually 60). Sum those across the lists. Done." },
        { type: 'code', lang: 'python', filename: 'rrf.py', code: `# Reciprocal Rank Fusion — combine two ranked lists using RANK, not raw score.
# Each list is just an ordered list of doc ids (best first).

def rrf(ranked_lists, k=60):
    scores = {}
    for ranked in ranked_lists:                 # e.g. [bm25_ids, vector_ids]
        for rank, doc_id in enumerate(ranked):  # rank is 0-based here
            # 1/(k + rank): rank 0 -> ~0.0164, rank 9 -> ~0.0145. Gentle decay.
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    # Highest fused score first.
    return sorted(scores, key=scores.get, reverse=True)

bm25_ids  = ["doc7", "doc2", "doc9", "doc1"]   # keyword search ranking
vector_ids = ["doc2", "doc5", "doc7", "doc4"]  # semantic search ranking

print(rrf([bm25_ids, vector_ids]))
# doc2 and doc7 appear HIGH in BOTH lists -> they rise to the top.
# A doc that's #1 in one list but absent from the other still scores well.` , caption: 'RRF only needs the ordering from each retriever — no score normalization, no scale-matching, no per-query tuning. That robustness is why it\'s everywhere.' },
        { type: 'callout', variant: 'analogy', title: 'Analogy: two judges, ranked ballots', text: "Imagine a talent show with two judges who score on wildly different scales — one gives marks out of 10, the other out of 1000. Averaging their raw scores lets the second judge dominate. So instead you ask each judge only for their *ranked list* — 1st, 2nd, 3rd. A contestant who's near the top of *both* ballots wins. RRF is exactly that: it trusts each retriever's ordering and rewards whoever both retrievers liked, ignoring the incompatible scales." },
        { type: 'callout', variant: 'tip', title: 'The constant k dampens the top', text: "That `+k` (default 60) softens the difference between rank 1 and rank 2 so a single retriever can't completely dominate with its #1 pick. Small k = the top rank matters enormously; large k = ranks are treated more equally. You rarely need to touch it — 60 is a well-tested default from the original RRF paper." },
        { type: 'h', text: 'See all three side by side' },
        { type: 'p', text: "The demo below runs the same set of queries through keyword-only, semantic-only, and hybrid-plus-rerank. Fire the **exact-term** query (a code or rare token) and watch keyword nail it while semantic flails. Then fire the **paraphrase** query and watch them swap. Hybrid is the column that stays good in *both* rows — that's the whole pitch." },
        { type: 'demo', id: 'hybrid-search' },
      ],
    },
    {
      id: 'reranking',
      title: 'Reranking: the precision pass that fixes everything',
      blocks: [
        { type: 'p', text: "Hybrid search gets the right documents into your candidate pool. But being *in the top 20* isn't good enough — you feed the LLM only the top 3-5 chunks, so the final *ordering* of those candidates decides what actually reaches the model. This is where **reranking** comes in, and it's the single biggest quality lever in retrieval after chunking. If you add one thing to a RAG pipeline this quarter, add a reranker." },
        { type: 'h', text: 'Bi-encoders vs cross-encoders — the key distinction' },
        { type: 'p', text: "To understand why reranking works, you need to see *why embedding search is fundamentally limited*. Standard vector search uses a **bi-encoder**: the query and each document are embedded **separately**, into vectors, and compared with cosine. That separation is what makes it fast and scalable — you embed all your documents *once*, ahead of time, and each query is just a cheap nearest-neighbor lookup. But it's also the limitation: the model never sees the query and document *together*. It has to compress each into a fixed vector before they ever meet, guessing in advance what might be relevant." },
        { type: 'p', text: "A **cross-encoder** (a reranker) does the opposite. It takes the query and one candidate document **as a single joined input** and runs them through a transformer together, with full cross-attention between every query word and every document word. The output is one number: how relevant is *this* document to *this* query. It's far more accurate — it can see that \"apple\" means the fruit in this pairing and the company in that one — but it's *far* more expensive: no precomputation is possible, because the score depends on the specific pair." },
        { type: 'table', headers: ['', 'Bi-encoder (retrieval)', 'Cross-encoder (reranking)'], rows: [
          ['**How it works**', 'Embed query and doc **separately**, compare vectors', 'Feed query + doc **together**, output one relevance score'],
          ['**Precomputation**', 'Yes — embed all docs once, offline', 'No — must run at query time for every pair'],
          ['**Speed**', 'Blazing — nearest-neighbor over millions', 'Slow — one model pass per candidate'],
          ['**Accuracy**', 'Good (blurs on specifics)', 'Excellent (sees query+doc interaction)'],
          ['**Role in the pipeline**', 'Retrieve **many** cheaply', 'Reorder the **few** precisely'],
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: resume screening', text: "A bi-encoder is a recruiter skimming 1,000 resumes in an hour by keyword-and-vibe — fast, cheap, and it lets a few gems through alongside some noise. A cross-encoder is the hiring manager who reads the 20 shortlisted resumes *next to the actual job description*, line by line, and ranks them properly. You'd never read 1,000 resumes that carefully (too slow), and you'd never hire straight off the 60-second skim (too sloppy). You skim to 20, then read the 20. That two-stage funnel is retrieve-then-rerank." },
        { type: 'h', text: 'The retrieve-many-then-rerank pattern' },
        { type: 'p', text: "This is the pattern you'll actually ship, and it's a funnel with two stages tuned for two different jobs:" },
        { type: 'list', items: [
          "**Stage 1 — retrieve wide & cheap.** Use hybrid search (BM25 + vector) to pull a generous candidate set: top **20-100** chunks. Recall is the only goal here — you just need the right answer to be *somewhere* in the pile. Cast a wide net.",
          "**Stage 2 — rerank narrow & precise.** Send those candidates plus the query to a cross-encoder reranker. It scores each (query, chunk) pair and reorders them. Keep the top **3-5** and hand those to the LLM. Precision is the goal here.",
        ] },
        { type: 'p', text: "The elegance is that each stage does what it's good at. The bi-encoder never has to be *precise*, just *inclusive* — it only needs recall. The cross-encoder never has to be *fast*, because it only ever looks at the 20-100 survivors, not your whole corpus. You get cross-encoder accuracy at nearly bi-encoder cost." },
        { type: 'callout', variant: 'warn', title: 'The cost/latency tradeoff is real', text: "Reranking isn't free. A cross-encoder pass over 50 candidates adds latency (typically 50-300ms via a hosted API like Cohere Rerank) and cost (you're billed per document scored). The lever is *how many candidates you rerank*: rerank 100 and you get better recall but more latency and spend; rerank 20 and it's snappier but you might drop a good chunk in stage 1. Tune the candidate count against your latency budget — and measure whether the quality gain justifies it (Lesson 6.6 on evaluation is how you prove it)." },
      ],
    },
    {
      id: 'in-code',
      title: 'Build it: hybrid scoring in the Playground + a real reranker call',
      blocks: [
        { type: 'p', text: "Let's make hybrid concrete. The playground below implements both retrievers over a tiny corpus of support chunks: a **keyword score** (term overlap) and a **semantic score** (cosine over toy vectors), then a hybrid blend. Run it as-is and watch the punchline: for a paraphrase query, semantic wins and keyword whiffs; for an exact-code query, keyword wins and semantic whiffs. Hybrid is good on both. This is the entire lesson in one runnable block." },
        { type: 'playground', id: 'hybrid-lab', title: 'Keyword vs semantic vs hybrid', height: 560, lang: 'javascript', code: `// A tiny support knowledge base. Each chunk has text + a toy 4-D "embedding"
// on axes [auth, billing, errors, performance].
const chunks = [
  { id: "A", text: "Reset your password from the account settings page", vec: [0.9, 0.0, 0.1, 0.0] },
  { id: "B", text: "If your card is declined, update your billing method", vec: [0.0, 0.9, 0.2, 0.0] },
  { id: "C", text: "Error code ERR_2043 means your API key expired; rotate it", vec: [0.4, 0.0, 0.8, 0.0] },
  { id: "D", text: "Enable response caching to improve slow load times", vec: [0.0, 0.0, 0.1, 0.9] },
  { id: "E", text: "Two-factor authentication adds a second login step", vec: [0.85, 0.0, 0.1, 0.1] },
  { id: "F", text: "Refunds are processed within five business days", vec: [0.0, 0.85, 0.0, 0.0] },
]

// --- keyword score: fraction of query terms that appear in the chunk ---
const tokenize = (s) => s.toLowerCase().match(/[a-z0-9_]+/g) || []
function keywordScore(query, chunk) {
  const q = tokenize(query)
  const words = new Set(tokenize(chunk.text))
  const hits = q.filter((t) => words.has(t)).length
  return q.length ? hits / q.length : 0
}

// --- semantic score: cosine similarity over the toy vectors ---
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a) => Math.sqrt(dot(a, a))
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))

// --- hybrid blend: average of the two (both already 0..1 here) ---
function search(query, queryVec) {
  return chunks
    .map((c) => {
      const kw = keywordScore(query, c)
      const sem = cosine(queryVec, c.vec)
      return { id: c.id, kw, sem, hybrid: 0.5 * kw + 0.5 * sem }
    })
    .sort((a, b) => b.hybrid - a.hybrid)
}

function report(label, query, queryVec) {
  console.log("\\n=== " + label + ': "' + query + '" ===')
  const rows = search(query, queryVec)
  for (const r of rows) {
    console.log(
      "  " + r.id +
      "  kw=" + r.kw.toFixed(2) +
      "  sem=" + r.sem.toFixed(2) +
      "  hybrid=" + r.hybrid.toFixed(2)
    )
  }
  console.log("  winner (keyword-only):  " + [...rows].sort((a,b)=>b.kw-a.kw)[0].id)
  console.log("  winner (semantic-only): " + [...rows].sort((a,b)=>b.sem-a.sem)[0].id)
  console.log("  winner (HYBRID):        " + rows[0].id)
}

// PARAPHRASE query: no shared words with chunk A, but auth-heavy meaning.
report("Paraphrase", "I forgot my login credentials", [0.9, 0.0, 0.1, 0.0])

// EXACT-TERM query: the code itself. Semantic can't tell error codes apart.
report("Exact term", "ERR_2043", [0.4, 0.0, 0.6, 0.0])`, solution: `// SOLUTION: switch the blend to Reciprocal Rank Fusion (RRF), which uses
// RANK not raw score — the production-standard fusion. Notice it needs no
// score normalization and is robust to the two scales being different.
const chunks = [
  { id: "A", text: "Reset your password from the account settings page", vec: [0.9, 0.0, 0.1, 0.0] },
  { id: "B", text: "If your card is declined, update your billing method", vec: [0.0, 0.9, 0.2, 0.0] },
  { id: "C", text: "Error code ERR_2043 means your API key expired; rotate it", vec: [0.4, 0.0, 0.8, 0.0] },
  { id: "D", text: "Enable response caching to improve slow load times", vec: [0.0, 0.0, 0.1, 0.9] },
  { id: "E", text: "Two-factor authentication adds a second login step", vec: [0.85, 0.0, 0.1, 0.1] },
  { id: "F", text: "Refunds are processed within five business days", vec: [0.0, 0.85, 0.0, 0.0] },
]
const tokenize = (s) => s.toLowerCase().match(/[a-z0-9_]+/g) || []
const keywordScore = (query, c) => {
  const q = tokenize(query), w = new Set(tokenize(c.text))
  return q.length ? q.filter((t) => w.has(t)).length / q.length : 0
}
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a) => Math.sqrt(dot(a, a))
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))

// Rank ids best-first by a scoring function.
const rankBy = (scoreFn) =>
  [...chunks].map((c) => ({ id: c.id, s: scoreFn(c) }))
             .sort((a, b) => b.s - a.s).map((r) => r.id)

// RRF over the two ranked lists.
function rrf(query, queryVec, k = 60) {
  const kwRank  = rankBy((c) => keywordScore(query, c))
  const semRank = rankBy((c) => cosine(queryVec, c.vec))
  const scores = {}
  for (const list of [kwRank, semRank])
    list.forEach((id, i) => { scores[id] = (scores[id] || 0) + 1 / (k + i + 1) })
  return Object.entries(scores).sort((a, b) => b[1] - a[1])
}

console.log("Paraphrase ->", rrf("I forgot my login credentials", [0.9,0,0.1,0])[0][0])
console.log("Exact term ->", rrf("ERR_2043", [0.4,0,0.6,0])[0][0])
// RRF surfaces A (auth) for the paraphrase and C (the code) for the exact term,
// using only ranks — no fragile score normalization.`, caption: '**Exercise:** the demo uses a naive 50/50 blend of two conveniently-0..1 scores. Real BM25 scores are unbounded and would swamp cosine. Rewrite `search` to fuse by **rank** (RRF) instead of raw score, so the two scales can\'t distort each other. (Solution provided.)' },
        { type: 'h', text: 'The reranker call you\'ll actually write' },
        { type: 'p', text: "In production you don't build the cross-encoder yourself — you call a hosted reranker (Cohere Rerank, Voyage, Jina) or run an open one locally. The API shape is beautifully simple: pass the query and a list of candidate documents, get back the same documents reordered with relevance scores. Here's the full retrieve-then-rerank flow with Cohere:" },
        { type: 'code', lang: 'python', filename: 'rerank.py', code: `import cohere

co = cohere.Client("<API_KEY>")

# Stage 1: hybrid retrieval already gave us a WIDE candidate set (top ~50).
candidates = [
    "Error code ERR_2043 means your API key expired; rotate it in settings.",
    "Two-factor authentication adds a second login step for security.",
    "Reset your password from the account settings page.",
    "Enable response caching to improve slow load times.",
    # ... 46 more candidates from stage 1 ...
]

query = "why did I get ERR_2043 when calling the API?"

# Stage 2: the cross-encoder reranks the candidates by TRUE relevance.
reranked = co.rerank(
    model="rerank-english-v3.0",
    query=query,
    documents=candidates,
    top_n=3,               # keep only the best 3 to send to the LLM
)

for r in reranked.results:
    # r.index points back into 'candidates'; r.relevance_score is 0..1.
    print(f"{r.relevance_score:.3f}  {candidates[r.index]}")

# The ERR_2043 chunk now ranks #1 with a high score, even if hybrid
# retrieval had buried it at position 8. That reorder is the quality win.` , caption: 'One API call turns a noisy top-50 into a clean top-3. The reranker sees each (query, doc) pair together — something no bi-encoder embedding can do.' },
        { type: 'p', text: "Prefer to run it yourself with no per-call cost? The open-source `sentence-transformers` library ships cross-encoders you can run locally — same idea, your hardware:" },
        { type: 'code', lang: 'python', filename: 'local_rerank.py', code: `from sentence_transformers import CrossEncoder

# A small, fast cross-encoder trained on MS MARCO (query->passage relevance).
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

query = "why did I get ERR_2043 when calling the API?"
candidates = [
    "Error code ERR_2043 means your API key expired; rotate it in settings.",
    "Reset your password from the account settings page.",
    "Enable response caching to improve slow load times.",
]

# Score each (query, candidate) PAIR together — this is the cross-attention
# a separate-embedding bi-encoder can never do.
pairs = [(query, doc) for doc in candidates]
scores = reranker.predict(pairs)

ranked = sorted(zip(scores, candidates), reverse=True)
for score, doc in ranked[:3]:
    print(f"{score:.2f}  {doc}")` , caption: 'Same two-stage pattern, no API bill. The MiniLM cross-encoder is tiny and runs in milliseconds per pair on CPU — fine for reranking a few dozen candidates.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Users report that searching your docs for the exact error code "ERR_2043" returns vaguely related error articles but not the one defining ERR_2043. Your search is pure vector similarity. What is the root cause?',
            options: [
              'The embedding model is too small — upgrade to a larger one',
              'Embeddings blur exact tokens; a rare code has little semantic content, so it embeds near other codes and the exact match isn\'t privileged',
              'The chunk containing ERR_2043 was never indexed',
              'Cosine similarity is the wrong distance metric for this',
            ],
            answer: 1,
            explain: 'This is the classic vector-search blind spot. An embedding is a lossy summary of *meaning*, and an error code carries almost no meaning beyond its exact characters — so it lands near other codes and the exact match gets no special weight. A bigger model won\'t fix it; adding keyword/BM25 search (hybrid) will, because BM25 rewards the exact-term match.',
          },
          {
            q: 'You want to combine BM25 keyword scores with cosine similarity scores. Why is Reciprocal Rank Fusion (RRF) preferred over just adding the two scores together?',
            options: [
              'RRF is faster to compute than addition',
              'BM25 is unbounded while cosine is in [−1, 1]; summing lets BM25\'s larger numbers dominate, whereas RRF uses only each list\'s rank and is immune to scale mismatch',
              'RRF requires no retrieval, only reranking',
              'Adding scores is mathematically impossible',
            ],
            answer: 1,
            explain: 'The two scores live on incompatible scales, so raw addition (or even naive normalization) lets one retriever swamp the other. RRF throws away the scores and fuses by *rank* (1/(k+rank)), which is why it\'s robust and the default in Elasticsearch, Weaviate, and OpenSearch — no per-query tuning needed.',
          },
          {
            q: 'What is the fundamental architectural difference that makes a cross-encoder (reranker) more accurate than the bi-encoder used for retrieval?',
            options: [
              'The cross-encoder has more parameters',
              'The cross-encoder processes the query and document TOGETHER with cross-attention, while the bi-encoder embeds each separately before they ever meet',
              'The cross-encoder uses cosine similarity and the bi-encoder uses dot product',
              'The cross-encoder is trained on more data',
            ],
            answer: 1,
            explain: 'A bi-encoder must compress query and document into fixed vectors *independently*, guessing relevance in advance — that separation is what lets it precompute and scale. A cross-encoder feeds the pair through the model jointly, so every query word can attend to every document word. That interaction is the accuracy gain, and also why it can\'t be precomputed and must run at query time.',
          },
          {
            q: 'In the retrieve-many-then-rerank pattern, why do you retrieve 50-100 candidates cheaply before reranking instead of just reranking your entire corpus?',
            options: [
              'The reranker has a hard limit of 100 documents',
              'A cross-encoder must run at query time per (query, doc) pair, so reranking a whole corpus is prohibitively slow and costly; stage 1 cheaply narrows to a high-recall candidate set the reranker can afford to read carefully',
              'Retrieving fewer than 50 always misses the answer',
              'The corpus must be reranked offline, not at query time',
            ],
            answer: 1,
            explain: 'It\'s a funnel tuned for two jobs. Stage 1 (bi-encoder/hybrid) is fast and only needs *recall* — get the answer somewhere in the top ~50. Stage 2 (cross-encoder) is slow and precise but only ever reads those ~50 survivors, never the millions in the corpus. You get cross-encoder accuracy at near bi-encoder cost — the reason this pattern is everywhere.',
          },
          {
            q: 'A colleague says "we added a reranker and quality jumped, but p95 latency went from 200ms to 550ms." What is the correct lever to trade back some latency?',
            options: [
              'Switch the reranker off during peak hours',
              'Reduce how many stage-1 candidates you send to the reranker (e.g. rerank top 20 instead of top 80), accepting slightly lower recall for lower latency',
              'Increase the embedding dimension of the bi-encoder',
              'Lower the LLM temperature',
            ],
            answer: 1,
            explain: 'Reranking cost scales with the number of candidates scored. Fewer candidates = less latency and spend, at some risk of dropping a good chunk in stage 1. Tuning the candidate count against your latency budget is the standard dial — and you validate the tradeoff with retrieval evaluation (next lesson), not vibes.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm6-l5-c1', front: 'Where does pure vector search fail?', back: 'Exact terms, rare tokens, names, IDs, codes, and acronyms (e.g. `ERR_2043`, `useEffect`, SKUs). Embeddings blur anything whose value is its exact characters rather than its meaning.' },
          { id: 'm6-l5-c2', front: 'Where does keyword search (BM25) fail?', back: 'Paraphrases and synonyms. "Card declined" won\'t match "payment failed"; "cancel subscription" won\'t match "end membership." BM25 matches strings, not intent.' },
          { id: 'm6-l5-c3', front: 'What is hybrid search?', back: 'Run BM25 keyword search AND vector search for each query, then fuse the two ranked lists into one. Each covers the other\'s blind spot — keyword for exact terms, vector for paraphrase.' },
          { id: 'm6-l5-c4', front: 'What is Reciprocal Rank Fusion (RRF)?', back: 'The standard way to fuse ranked lists: score each doc as sum of 1/(k+rank) across lists (k≈60), using RANK not raw score. Immune to the scale mismatch between BM25 (unbounded) and cosine ([−1,1]).' },
          { id: 'm6-l5-c5', front: 'Bi-encoder vs cross-encoder?', back: 'Bi-encoder: embed query and doc separately, compare vectors — fast, precomputable, used for retrieval. Cross-encoder: feed query+doc together with cross-attention, output one relevance score — slow, accurate, used for reranking.' },
          { id: 'm6-l5-c6', front: 'The retrieve-many-then-rerank pattern?', back: 'Stage 1: hybrid-retrieve a wide top 20-100 (goal: recall). Stage 2: a cross-encoder reranker scores each (query, chunk) pair and reorders; keep top 3-5 for the LLM (goal: precision). Cross-encoder accuracy at near bi-encoder cost.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Vector search blurs exact terms, names, IDs, codes, and acronyms; keyword (BM25) search misses paraphrases and synonyms. Their failure modes are mirror images.',
          'Hybrid search runs both retrievers and fuses the results so each covers the other\'s blind spot — the standard production retrieval setup.',
          'Fuse by RANK, not raw score: Reciprocal Rank Fusion (RRF, k≈60) sidesteps the scale mismatch between unbounded BM25 and [−1,1] cosine and needs no tuning.',
          'Reranking is the biggest quality lever after chunking: a cross-encoder scores (query, doc) pairs together with cross-attention — far more accurate than separate-embedding bi-encoders.',
          'Ship the retrieve-many-then-rerank funnel: retrieve a wide, high-recall candidate set cheaply, then rerank to a precise top 3-5. Tune candidate count against your latency budget.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Adding BM25 and cosine scores directly', text: 'BM25 is unbounded (could be 80+); cosine is capped at 1. Summing them lets keyword scores swamp semantic ones, so your "hybrid" search is secretly just keyword search. Fuse by rank (RRF) or at minimum min-max normalize each score to [0,1] before blending.' },
          { title: 'Using a cross-encoder for retrieval', text: 'Cross-encoders can\'t be precomputed — the score depends on the specific (query, doc) pair — so running one over your whole corpus at query time is impossibly slow. Cross-encoders are for reranking a small candidate set only; retrieval stays a fast bi-encoder/BM25 job.' },
          { title: 'Reranking too few candidates', text: 'If stage-1 retrieval hands the reranker only the top 5, a great chunk sitting at rank 12 is already lost — the reranker can only reorder what it\'s given, never recover what retrieval missed. Retrieve wide (20-100) so recall is high, THEN let the reranker cut it down.' },
          { title: 'Adding a reranker without measuring the tradeoff', text: 'Reranking adds real latency and cost. "It feels better" isn\'t enough to justify 300ms per query. Measure retrieval quality (recall@k, MRR/nDCG — next lesson) with and without it, and tune the candidate count so the quality gain is worth the spend.' },
        ] },
        { type: 'interview', items: [
          { q: '"Your semantic search works great in demos but users complain it can\'t find specific error codes and product SKUs. How do you fix it?"', a: 'That\'s the signature failure of pure vector search: embeddings are lossy summaries of meaning, so exact tokens like `ERR_2043` or a SKU blur into their neighbors — the model can\'t privilege an exact string match. The fix is hybrid search: run a BM25 keyword retriever alongside the vector retriever and fuse the results with Reciprocal Rank Fusion. BM25 rewards the exact-term match that embeddings smear over, while vector search still handles the paraphrase queries. It\'s the standard production answer and most vector DBs (Weaviate, pgvector + tsvector, Elasticsearch) support it natively.' },
          { q: '"What is a reranker and where does it fit in a RAG pipeline?"', a: 'A reranker is a cross-encoder: it takes the query and a candidate document as one joined input and, using cross-attention between them, outputs a single precise relevance score. It fits as stage two of a retrieve-then-rerank funnel — stage one (hybrid/bi-encoder) cheaply pulls a wide, high-recall candidate set of 20-100 chunks; the reranker then reorders those and I keep the top 3-5 for the LLM. It\'s the biggest quality lever after chunking because the bi-encoder embeds query and document separately and has to guess relevance in advance, whereas the cross-encoder actually reads them together. The tradeoff is latency and cost, since cross-encoders run at query time per pair, so I tune how many candidates I rerank.' },
          { q: '"Why can\'t you just use the cross-encoder for the whole search instead of embeddings?"', a: 'Because a cross-encoder can\'t precompute anything. Its score depends on the specific (query, document) pair, so to search a million-document corpus you\'d have to run a full model pass for every document on every query — completely infeasible for latency and cost. The bi-encoder\'s whole advantage is that it embeds documents once, offline, and each query is a cheap nearest-neighbor lookup. So you use the cheap, scalable bi-encoder to narrow millions down to ~50, then spend the expensive cross-encoder only on those 50. Two stages, each doing the job it\'s suited for.' },
          { q: '"How would you fuse keyword and semantic results, and why that method?"', a: 'Reciprocal Rank Fusion. For each document I sum 1/(k+rank) over its position in each result list, with k around 60, and sort by the fused score. I use ranks rather than raw scores because BM25 is unbounded and cosine sits in [−1,1] — adding them lets BM25 dominate, and even min-max normalization is fragile to outliers. RRF only needs each retriever\'s ordering, so it\'s immune to the scale mismatch and needs no per-query tuning, which is exactly why it\'s the default in Elasticsearch and OpenSearch.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Developer documentation search', text: 'Docs sites (Stripe, Twilio, cloud consoles) must match both "how do I refund a charge" (paraphrase → vector) and exact symbols like `charge.refunded` or `useEffect` (exact term → BM25). Hybrid is non-negotiable here; pure vector search infuriates developers hunting for a specific API name.' },
          { title: 'E-commerce product search', text: 'Shoppers type both fuzzy intent ("warm waterproof jacket for hiking") and exact identifiers (model numbers, brand SKUs). Hybrid search plus a reranker that scores each product against the full query is what powers "relevant results" on large catalogs.' },
          { title: 'Enterprise RAG over internal knowledge', text: 'Support and internal-wiki bots retrieve 50+ candidate chunks with hybrid search, then rerank with Cohere Rerank to the best 4 before generation. The reranker is what stops the LLM from being fed near-duplicate or tangential chunks that dilute the answer.' },
          { title: 'Legal & compliance retrieval', text: 'Case and contract search must catch exact citations, clause numbers, and defined terms (keyword) as well as conceptually similar precedents (semantic). Reranking then surfaces the passages most on-point for the specific question — precision matters enormously when a missed clause is a liability.' },
        ] },
        { type: 'project', title: 'Build a hybrid retriever and find where each strategy wins', goal: 'Implement keyword scoring, semantic scoring, and a hybrid blend over a small corpus, then hunt for queries that prove why you need both.', steps: [
          'Create ~8 short chunks across 2-3 themes, and give each a small hand-made vector (like the playground). Include at least one chunk with an exact code/name/ID (e.g. "ERR_2043" or a SKU).',
          'Implement `keywordScore(query, chunk)` (fraction of query terms present) and `semanticScore(queryVec, chunk)` (cosine over the toy vectors).',
          'Implement a hybrid ranker. Start with a normalized weighted blend, then upgrade it to Reciprocal Rank Fusion (fuse by rank, k=60) and note how the results change.',
          'Find a PARAPHRASE query where semantic beats keyword (no shared words but right meaning) and an EXACT-TERM query where keyword beats semantic (the code/ID). Log all three rankings for each.',
          'Write two sentences: one on which query broke keyword-only, one on which broke semantic-only — and confirm hybrid handled both.',
        ], deliverable: 'A `hybrid_search.js` (or `.py`) that prints keyword, semantic, and hybrid rankings for at least two queries, demonstrating one clear win for each retriever and hybrid winning both.' },
        { type: 'challenge', title: 'Add a reranking signal that fixes a case hybrid gets wrong', text: 'Construct a query where hybrid retrieval ranks the WRONG chunk first — e.g. a chunk that shares the query\'s keywords AND sits near it in vector space, but doesn\'t actually answer the question (a common failure: a chunk that *mentions* the term in passing outranks the one that *explains* it). Then add a simple second-pass "reranker" — even a heuristic that rewards chunks where the query terms appear close together, or a length/exact-phrase signal — that reorders the hybrid top-5 and pushes the truly relevant chunk to #1. Show the before/after ranking.', hints: [
          'The cleanest way to build the failure case: two chunks both contain the keyword, but only one is a real answer — hybrid can\'t tell them apart because both score high on keyword AND vector.',
          'Your toy "reranker" stands in for a cross-encoder: any signal that considers the query and chunk *jointly* (exact phrase match, term proximity, does the chunk contain a definition) is the right spirit.',
          'Only rerank the hybrid top-5, not the whole corpus — that\'s the retrieve-many-then-rerank funnel in miniature, and it keeps the expensive signal cheap.',
        ] },
        { type: 'reading', links: [
          { label: 'Elastic: Reciprocal Rank Fusion explained', url: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html', note: 'The official Elasticsearch reference on hybrid retrieval and RRF — the fusion method and the k constant, straight from a production search engine.' },
          { label: 'Cohere Rerank documentation', url: 'https://docs.cohere.com/docs/rerank-overview', note: 'The provider-official guide to a hosted cross-encoder reranker: API shape, top_n, and where reranking fits in a retrieval pipeline.' },
          { label: 'Pinecone: BM25 / keyword vs. embeddings (hybrid search)', url: 'https://www.pinecone.io/learn/hybrid-search-intro/', note: 'A developer-focused comparison of sparse (BM25) vs dense (embedding) retrieval and why combining them beats either alone.' },
        ] },
      ],
    },
  ],
}
