// Lesson 7.7 — Production RAG: Cost, Latency & Caching

export default {
  sections: [
    {
      id: 'the-bill',
      title: 'The demo was free. The bill is not.',
      blocks: [
        { type: 'p', text: "Your [[RAG]] prototype works. You ask it a question, it retrieves three chunks, the model answers, everyone claps. On your laptop, with ten users a day, it costs approximately nothing. Then it ships, traffic hits 50,000 queries a day, and someone in finance forwards you an invoice with a subject line that is just a question mark. **This lesson is about the gap between \"it works\" and \"it works at scale without lighting money on fire.\"**" },
        { type: 'p', text: "Here is the uncomfortable truth that surprises most engineers: in a RAG system, *retrieval is cheap and generation is expensive* — and the thing that makes generation expensive is **the context you retrieved**. Every chunk you stuff into the prompt is [[input tokens]] the model has to read, on **every single call**, forever. You don't pay for retrieval quality; you pay for retrieval *volume*, at the generation step, per query, at scale. Get careless with how many chunks you pass and you've built a machine that converts server budget into slightly-longer prompts." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the taxi meter', text: "Retrieval is hailing the cab — a small, fixed fee. Generation is the meter running, and **every chunk you retrieved is another passenger you're paying to drive across town.** Stuffing 10 chunks \"to be safe\" is like booking a 10-seat van for a solo trip: you'll get there, but you're paying for nine empty seats on every ride. Production RAG is mostly the discipline of sending fewer, better-chosen passengers." },
        { type: 'h', text: 'Where the money actually goes' },
        { type: 'p', text: "There are three cost centers in a RAG system, and they are wildly unequal. Knowing the ranking tells you where to spend your optimization effort." },
        { type: 'table', headers: ['Cost center', 'When you pay', 'Relative size', 'What drives it'], rows: [
          ['**Embedding (ingest)**', 'Once per document, at index time', 'Small, one-time', 'Total corpus size × embedding price'],
          ['**Embedding (query)**', 'Once per user query', 'Tiny', 'One short embedding call per question'],
          ['**Retrieval infra**', 'Continuously (hosting the index)', 'Small–medium, fixed', 'Vector DB size, QPS, replicas'],
          ['**Generation**', 'Once per query, on every call', '**Dominant**', '**Retrieved context tokens** + output tokens'],
        ] },
        { type: 'p', text: "Read that table twice. The one-time cost of embedding your entire knowledge base is often *less than a single day* of generation cost at scale, because you embed each document **once** but you pay to re-read the retrieved chunks on **every query**. This is why the highest-leverage cost lever in all of RAG is not \"cheaper embeddings\" — it's **how many tokens of context you feed the generator per call.**" },
        { type: 'callout', variant: 'info', title: 'The one number that dominates your bill', text: "Generation cost per query ≈ (chunks retrieved × avg tokens per chunk + prompt overhead) × input-token-price + output tokens × output-price. The retrieved context is almost always the biggest term. Halve your chunk count and you roughly halve your generation bill — which is why *reranking to fewer, better chunks* (Lesson 7.4) is a cost strategy, not just a quality one." },
      ],
    },
    {
      id: 'the-layers',
      title: 'Three levers: cost, latency, and caching',
      blocks: [
        { type: 'p', text: "Taking a RAG demo to production means managing three things at once, and they pull on each other. **Cost** (dollars per query), **latency** (seconds per query), and **caching** (the layer that quietly improves both). The diagram below is the mental map for the rest of this lesson — study where each optimization lives before we dig into each one." },
        { type: 'diagram', id: 'production-rag', caption: 'The production RAG stack. Cost is dominated by generation context; latency by the retrieval hop; caching sits across every layer and is the cheapest win you have.' },
        { type: 'p', text: "Notice how caching threads through *every* stage. You can cache the embedding of a document so you never re-embed it, cache the whole result of a frequent query so you skip retrieval *and* generation, and cache the stable prefix of your prompt so the model doesn't re-process the same retrieved context token-by-token. Each cache attacks a different cost. Together they are the difference between a system that scales and one that scales your invoice." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: three dials on a mixing board', text: "You're not turning one knob, you're balancing three. Push **latency** down by retrieving fewer chunks and you also push **cost** down — happy accident. But push cost down too far by retrieving too little and **answer quality** drops. Caching is the one dial that only ever helps: turned up, it lowers cost *and* latency with no quality penalty (as long as your cached data is fresh). Most of production RAG is learning which dial to reach for when a specific number is bad." },
        { type: 'h', text: 'The optimization priority order' },
        { type: 'list', items: [
          "**1. Trim the context first.** Fewer, better chunks (via reranking) is the single biggest win — it cuts cost *and* latency *and* often *improves* quality by removing distractors. Start here.",
          "**2. Cache aggressively.** Repeat queries, stable prompt prefixes, and document embeddings are all free money left on the table. Almost no downside except staleness.",
          "**3. Parallelize the pipeline.** Overlap embedding, search, and any reranking so the retrieval hop costs one round-trip, not three sequential ones.",
          "**4. Right-size the models.** A smaller/cheaper generation model with *good* retrieval often beats a flagship model with sloppy retrieval — and costs a fraction. Retrieval quality lets you buy down model size.",
        ] },
      ],
    },
    {
      id: 'caching',
      title: 'Caching: the same answer for the same question, minus the bill',
      blocks: [
        { type: 'p', text: "Caching is the highest return-on-effort optimization in production RAG, because real traffic is *lumpy*. In a docs chatbot, a huge fraction of questions are near-duplicates — \"how do I reset my password,\" \"reset password,\" \"I forgot my password\" — asked thousands of times. Recomputing the full pipeline for each is like re-cooking an identical meal from scratch for every customer who orders the daily special. Cache it once, serve it fast, pocket the difference." },
        { type: 'p', text: "There are **three distinct caches** in a RAG system, at three different layers. They are not interchangeable — each skips a different, increasingly expensive chunk of work." },
        { type: 'table', headers: ['Cache layer', 'Key', 'What it skips', 'Payoff'], rows: [
          ['**Embedding cache**', 'hash of the text', 'Re-embedding a doc/query you\'ve seen', 'Skip an embedding API call; huge on re-index'],
          ['**Query-result cache**', 'normalized query (or its embedding)', 'Retrieval **and** generation', 'Skip the *entire* pipeline — the biggest win'],
          ['**Prompt / KV cache**', 'the stable prompt prefix', 'Re-reading the same context tokens', 'Model reprocesses only the new part; cheaper + faster'],
        ] },
        { type: 'h', text: '1. Cache embeddings — never pay to embed the same text twice' },
        { type: 'p', text: "Embeddings are **deterministic**: the same text through the same model version always yields the same vector. That makes them perfectly cacheable by a hash of the input. On ingest this matters most when you **re-index** — if only 3 of 10,000 documents changed, you should re-embed 3, not 10,000. Key each embedding by `hash(text + model_version)` so a model upgrade correctly invalidates the cache." },
        { type: 'h', text: '2. Cache query results — skip the whole pipeline for repeat questions' },
        { type: 'p', text: "This is the big one. If you've already answered \"what's your refund policy\" this morning, and someone asks it again this afternoon, you can return the stored answer without touching the vector DB *or* the LLM. The subtlety is the **key**: exact string matching misses \"what is your refund policy?\" vs \"refund policy?\". Two better strategies: normalize the query (lowercase, trim, strip punctuation) for a loose exact-match, or — more powerful — cache by *embedding* and serve the cached answer when a new query's embedding is within a similarity threshold (a **semantic cache**)." },
        { type: 'callout', variant: 'warn', title: 'Semantic caches cut both ways', text: "A semantic cache that's too loose will serve the answer for \"how do I cancel\" to someone who asked \"how do I upgrade\" — because the embeddings are *close but not the same*. Set the similarity threshold conservatively (e.g. 0.95+), log cache hits, and spot-check them. A wrong cached answer is worse than a slow correct one. When in doubt, tighten the threshold; a lower hit-rate with correct answers beats a high hit-rate with subtle mistakes." },
        { type: 'h', text: '3. Prompt / KV caching — stop re-reading the same context' },
        { type: 'p', text: "This one is subtle and it's where real money hides at scale. When the model reads your prompt, it does expensive work turning those tokens into internal state (the [[KV cache]] — remember it from Modules 2.8 and 5.6). If your prompt has a **stable prefix** — a long system prompt, few-shot examples, or a big block of retrieved context that many queries share — the provider can cache that processed state and reuse it, charging you a fraction for the cached portion instead of full price to re-read it every call." },
        { type: 'code', lang: 'python', filename: 'prompt_caching.py', code: `# Anthropic prompt caching: mark the stable prefix with cache_control.
# The model processes it once, then reuses the cached state on later calls
# that share that exact prefix. Cache reads are ~10% of normal input price.

import anthropic
client = anthropic.Anthropic()

STABLE_SYSTEM = \"\"\"You are a support assistant for Acme Corp.
Answer only from the provided documentation. Cite sources as [n].
... (long, unchanging instructions + few-shot examples) ...\"\"\"

resp = client.messages.create(
    model=\"claude-sonnet-4-5\",
    max_tokens=512,
    system=[
        {
            \"type\": \"text\",
            \"text\": STABLE_SYSTEM,
            \"cache_control\": {\"type\": \"ephemeral\"},  # <-- cache this prefix
        }
    ],
    messages=[{\"role\": \"user\", \"content\": user_question}],
)
# First call: pays a small write premium to populate the cache.
# Every subsequent call reusing this prefix: pays ~1/10th for those tokens.` , caption: 'The order matters: put the *stable* content (system prompt, shared context) first so it forms a reusable prefix. Anything that changes per-query goes last, after the cache breakpoint.' },
        { type: 'callout', variant: 'tip', title: 'Prompt-cache the retrieved context when it\'s shared', text: "In a docs chatbot, many follow-up questions in one conversation reuse the *same* retrieved chunks. Put those chunks in the cached prefix and the model reprocesses them once, not once per turn. The rule of thumb: **order your prompt from most-stable to least-stable** — system → shared context → conversation history → the new question — so the longest possible prefix stays cacheable." },
      ],
    },
    {
      id: 'latency-and-lean',
      title: 'Latency, lean context, and the cost calculator',
      blocks: [
        { type: 'p', text: "RAG adds a hop. A plain LLM call is `question → model → answer`. RAG is `question → embed → search → (rerank) → model → answer`. Every arrow is time, and users feel it. The good news: most of that added latency is optimizable, and the same moves that cut latency usually cut cost too." },
        { type: 'h', text: 'Cutting the retrieval hop' },
        { type: 'list', items: [
          "**Keep top-K tight.** Retrieving 3 great chunks beats 20 mediocre ones — less to rerank, fewer tokens to generate over, less latency, lower cost. More chunks also *dilutes* the signal (the \"lost in the middle\" problem from Lesson 7.4).",
          "**Use fast [[ANN]] search.** Approximate nearest-neighbor (HNSW, IVF) returns near-perfect results in milliseconds instead of doing an exact scan of every vector. At scale you *must* use ANN; exact search is a latency cliff.",
          "**Parallelize what's independent.** You can embed the query and warm the LLM connection concurrently; if you query multiple indexes, fire them in parallel and merge. Don't run independent steps in series just because your code reads top-to-bottom.",
          "**Stream the answer.** You can't make generation instant, but streaming tokens to the UI makes *time-to-first-token* the number that matters — and that you can keep low by keeping the prompt (context!) lean.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: lean context is a smaller reading assignment', text: "Imagine handing a brilliant but hourly-billed expert a stack of documents and asking one question. Hand them 20 pages and they bill for reading 20 pages — *and* they might get distracted by the 17 irrelevant ones. Hand them the 3 pages that actually matter and they answer faster, cheaper, and more accurately. **Reranking to fewer chunks is that edit.** It's the rare optimization where cost, latency, and quality all improve together." },
        { type: 'h', text: 'Estimate the bill before you ship' },
        { type: 'p', text: "You should never deploy a RAG feature without a back-of-envelope cost-per-query. It's arithmetic, and it will save you from nasty surprises. The playground below computes it, then shows exactly how much reranking-to-fewer-chunks saves. Run it, then do the exercise." },
        { type: 'playground', id: 'rag-cost-calc', title: 'RAG cost per query: stuff 10 chunks vs rerank to 3', height: 520, lang: 'javascript', code: `// --- Prices (USD per 1M tokens). Ballpark 2026 numbers; tweak to your provider. ---
const INPUT_PRICE  = 3.00   // generation input tokens, per 1M
const OUTPUT_PRICE = 15.00  // generation output tokens, per 1M
const EMBED_PRICE  = 0.02   // query embedding, per 1M

// --- Per-query shape ---
const AVG_CHUNK_TOKENS = 250   // tokens in one retrieved chunk
const PROMPT_OVERHEAD  = 400   // system prompt + question + formatting
const OUTPUT_TOKENS    = 300   // tokens the model generates back
const QUERY_TOKENS     = 20    // tokens in the user's question (to embed)

function perMillion(tokens, price) { return (tokens / 1_000_000) * price }

function costPerQuery(numChunks) {
  const contextTokens = numChunks * AVG_CHUNK_TOKENS
  const inputTokens   = contextTokens + PROMPT_OVERHEAD
  const gen  = perMillion(inputTokens, INPUT_PRICE)
             + perMillion(OUTPUT_TOKENS, OUTPUT_PRICE)
  const embed = perMillion(QUERY_TOKENS, EMBED_PRICE)
  return { contextTokens, total: gen + embed }
}

const stuffed  = costPerQuery(10)   // "grab 10 chunks to be safe"
const reranked = costPerQuery(3)    // rerank down to the 3 best

const fmt = (n) => "$" + n.toFixed(6)
console.log("Stuff 10 chunks :", fmt(stuffed.total),  "  (", stuffed.contextTokens,  "context tokens )")
console.log("Rerank to 3     :", fmt(reranked.total), "  (", reranked.contextTokens, "context tokens )")

const saved = stuffed.total - reranked.total
const pct   = (saved / stuffed.total) * 100
console.log("Saved per query :", fmt(saved), "=", pct.toFixed(1) + "%")

// Now scale it up to a real bill:
const QUERIES_PER_MONTH = 2_000_000
const fmt2 = (n) => "$" + n.toFixed(2)
console.log("\\nAt", QUERIES_PER_MONTH.toLocaleString(), "queries/month:")
console.log("  Stuffed :", fmt2(stuffed.total  * QUERIES_PER_MONTH), "/mo")
console.log("  Reranked:", fmt2(reranked.total * QUERIES_PER_MONTH), "/mo")
console.log("  Savings :", fmt2(saved * QUERIES_PER_MONTH), "/mo")`, solution: `// SOLUTION: add a semantic cache with an 80% hit-rate on top of reranking.
// Cached queries cost ~nothing (a cheap embedding lookup), so the effective
// per-query cost is (miss-rate x generation cost).
const INPUT_PRICE = 3.00, OUTPUT_PRICE = 15.00, EMBED_PRICE = 0.02
const AVG_CHUNK_TOKENS = 250, PROMPT_OVERHEAD = 400, OUTPUT_TOKENS = 300, QUERY_TOKENS = 20
const perMillion = (t, p) => (t / 1_000_000) * p

function costPerQuery(numChunks) {
  const inputTokens = numChunks * AVG_CHUNK_TOKENS + PROMPT_OVERHEAD
  return perMillion(inputTokens, INPUT_PRICE)
       + perMillion(OUTPUT_TOKENS, OUTPUT_PRICE)
       + perMillion(QUERY_TOKENS, EMBED_PRICE)
}

const full = costPerQuery(3)               // a cache MISS: full reranked pipeline
const hit  = perMillion(QUERY_TOKENS, EMBED_PRICE)  // a cache HIT: just embed to look up

const HIT_RATE = 0.80
const effective = HIT_RATE * hit + (1 - HIT_RATE) * full

const fmt = (n) => "$" + n.toFixed(6)
console.log("Full pipeline (miss):", fmt(full))
console.log("Cache hit           :", fmt(hit))
console.log("Effective @ 80% hits:", fmt(effective), "->", ((1 - effective/full) * 100).toFixed(1) + "% cheaper than all-misses")

const Q = 2_000_000, fmt2 = (n) => "$" + n.toFixed(2)
console.log("Monthly:", fmt2(effective * Q), "vs", fmt2(full * Q), "with no cache")`, caption: '**Exercise:** the win from 10→3 chunks is already large. Now add a **semantic cache** on top: if 80% of queries are repeats served from cache (cost ≈ one cheap embedding), what\'s the *effective* cost per query? Compute it, then combine both levers. (Solution provided.)' },
        { type: 'h', text: 'A cost-control wrapper' },
        { type: 'p', text: "Here's the shape of a production retrieval-and-generate function with the cost controls wired in: an embedding cache, a semantic query-result cache, a tight top-K, and prompt caching on the stable prefix. This is the skeleton; the point is *where* each guard sits." },
        { type: 'code', lang: 'javascript', filename: 'ragWithCostControls.js', code: `// A RAG call with the money-savers wired in. Pseudocode-ish but faithful.
const embedCache  = new Map()   // text hash        -> vector
const answerCache = new SemanticCache({ threshold: 0.96 })  // query vec -> answer

async function embed(text) {
  const key = hash(text)
  if (embedCache.has(key)) return embedCache.get(key)   // skip the API call
  const vec = await embeddingApi(text)
  embedCache.set(key, vec)
  return vec
}

async function answer(query) {
  const qVec = await embed(query)

  // 1. Query-result cache: skip retrieval AND generation for repeats.
  const cached = answerCache.get(qVec)
  if (cached) return { text: cached, cached: true }

  // 2. Retrieve, but keep K tight and rerank down to the best few.
  const candidates = await vectorDb.search(qVec, { topK: 20 })   // fast ANN
  const chunks     = await rerank(query, candidates, { keep: 3 }) // fewer, better

  // 3. Generate with the STABLE prefix marked for prompt caching.
  const text = await llm.generate({
    system: STABLE_SYSTEM,        // cached prefix -> ~10% price on reuse
    context: chunks,              // only 3 chunks of input tokens, not 20
    query,
  })

  answerCache.set(qVec, text)     // populate the cache for next time
  return { text, cached: false }
}`, caption: 'Three guards, three savings: embed cache (skip re-embedding), answer cache (skip the whole pipeline), rerank-to-3 + prompt cache (shrink and cheapen generation).' },
        { type: 'h', text: 'Freshness: the tax you pay for caching and indexing' },
        { type: 'p', text: "Every cache and every index is a **snapshot**, and snapshots go stale. If your docs change, a cached answer can become *confidently wrong*, and your vector index can keep retrieving deleted or outdated chunks. Two disciplines keep you honest: **re-index on change** (embed and upsert only the documents that actually changed — cheap, thanks to your embedding cache), and **expire caches** with a TTL or an event-driven invalidation tied to the source-of-truth update. The right TTL is a product decision: a pricing page cache should expire in minutes; an archived policy doc can cache for days." },
        { type: 'callout', variant: 'info', title: 'Monitor the three numbers that predict trouble', text: "You can't optimize what you don't measure. Track: **(1) retrieval hit-rate / relevance** — are the retrieved chunks actually used in the answer? Falling relevance means your index is stale or your chunking is off. **(2) answer quality** — sampled evals or thumbs-up/down (Module 7.6). **(3) cost per query** and cache hit-rate — a rising cost-per-query with flat traffic means context creep or a cache that stopped working. These three tell you *which* dial slipped before the invoice does." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your RAG chatbot\'s monthly bill tripled after you increased retrieval from 3 chunks to 10 "to improve answer coverage." Traffic was flat. What most directly caused the cost jump?',
            options: [
              'Embedding the documents 10 times instead of 3',
              'The vector database charged more for returning more results',
              'Each query now feeds ~3x more context tokens into the generator, and you pay for those input tokens on every call',
              'Larger top-K forced a switch to a more expensive embedding model',
            ],
            answer: 2,
            explain: 'Generation cost is dominated by retrieved-context input tokens, paid per query. Going 3→10 chunks roughly tripled context tokens, so generation cost roughly tripled. Embedding is a one-time ingest cost and didn\'t change; the vector DB and embedding model are minor here. This is exactly why reranking to fewer chunks is a cost lever.',
          },
          {
            q: 'A docs chatbot gets the same ~200 questions over and over (80% repeat rate). Which single optimization cuts cost the most?',
            options: [
              'Switching to a cheaper embedding model for ingest',
              'A query-result (semantic) cache that returns stored answers for repeat questions, skipping retrieval and generation entirely',
              'Adding more replicas to the vector database',
              'Increasing top-K so answers are more complete',
            ],
            answer: 1,
            explain: 'With 80% repeats, a query-result cache lets 80% of traffic skip the entire expensive pipeline (retrieval + generation) for the price of a cheap embedding lookup. That dwarfs embedding-model savings (a one-time ingest cost) and vector-DB tuning. Caching the *most expensive* skipped work — generation — is the biggest win.',
          },
          {
            q: 'You mark your long, unchanging system prompt with prompt caching (cache_control). On the FIRST request it costs slightly MORE than an uncached call. Is something broken?',
            options: [
              'Yes — prompt caching should always be cheaper',
              'No — the first call pays a small write premium to populate the cache; savings come on subsequent calls that reuse the cached prefix at ~10% price',
              'Yes — the cache_control block disabled generation',
              'No — but only because the system prompt is too short to cache',
            ],
            answer: 1,
            explain: 'Prompt caching charges a one-time write premium to store the processed prefix, then serves cache reads at a large discount (~10% of input price on Anthropic). It pays off across many reuses of the same prefix. A single call with no reuse is a net loss — which is why you cache *stable, frequently-reused* prefixes, not one-off prompts.',
          },
          {
            q: 'Your semantic query-cache has a similarity threshold of 0.85 and users report occasionally getting answers to a *different* question than they asked. Best fix?',
            options: [
              'Lower the threshold to 0.70 to catch more matches',
              'Disable caching entirely — semantic caches are unsafe',
              'Raise the threshold (e.g. to 0.95+) so only very-close queries hit the cache, trading a lower hit-rate for correctness',
              'Cache by exact string match only, with no normalization',
            ],
            answer: 2,
            explain: 'A too-loose threshold serves near-but-wrong cached answers. Raising it means fewer cache hits but only genuinely-equivalent queries match — correctness over hit-rate. Lowering it makes the problem worse; disabling caching throws away a huge win; exact-match-only misses trivial rewordings. Tighten, log hits, and spot-check.',
          },
          {
            q: 'Which change improves cost, latency, AND answer quality at the same time?',
            options: [
              'Increasing top-K from 5 to 25 chunks',
              'Reranking retrieved candidates down to the 3 most relevant chunks before generation',
              'Switching from ANN to exact nearest-neighbor search',
              'Raising the generation model\'s max_tokens limit',
            ],
            answer: 1,
            explain: 'Reranking to fewer, better chunks cuts input tokens (cost), shortens the prompt the model must read (latency), and removes distractors that cause "lost in the middle" errors (quality). It\'s the rare triple win. More chunks and exact search both raise cost/latency; higher max_tokens only raises output cost.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l7-c1', front: 'In a RAG system, what dominates the cost?', back: 'Generation — specifically the **retrieved-context input tokens**, paid on *every* query. Embedding is a small one-time ingest cost; retrieval infra is a fixed cost. The number of chunks you feed the generator is the biggest lever.' },
          { id: 'm7-l7-c2', front: 'The three caches in production RAG, and what each skips?', back: '**Embedding cache** (skip re-embedding text you\'ve seen), **query-result / semantic cache** (skip retrieval + generation for repeat questions — the biggest win), **prompt/KV cache** (skip re-reading a stable prompt prefix; ~10% price on reuse).' },
          { id: 'm7-l7-c3', front: 'Why is reranking to fewer chunks a cost strategy, not just a quality one?', back: 'Fewer chunks = fewer input tokens per generation call = lower cost, *and* a shorter prompt = lower latency, *and* fewer distractors = better answers. It improves all three at once.' },
          { id: 'm7-l7-c4', front: 'How do you prompt-cache effectively?', back: 'Order the prompt **most-stable → least-stable**: system prompt → shared/retrieved context → history → the new question. The long stable prefix stays cacheable; the model reprocesses only the new tail at full price.' },
          { id: 'm7-l7-c5', front: 'The risk of a semantic query-result cache, and the mitigation?', back: 'Too-loose a similarity threshold serves the cached answer for a *different* question. Mitigate by setting a conservative threshold (0.95+), logging cache hits, and spot-checking. Prefer a lower hit-rate with correct answers.' },
          { id: 'm7-l7-c6', front: 'The three numbers to monitor in production RAG?', back: '**Retrieval hit-rate/relevance** (are retrieved chunks actually used?), **answer quality** (evals or thumbs), and **cost-per-query + cache hit-rate**. Rising cost-per-query at flat traffic = context creep or a broken cache.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'RAG cost is dominated by **generation**, and generation cost is dominated by **retrieved-context tokens** paid on every query — not by embeddings (a one-time ingest cost).',
          'Trim context first: **rerank to fewer, better chunks**. It cuts cost and latency and usually improves quality — the rare triple win.',
          'Cache at three layers: **embeddings** (skip re-embedding), **query results** (skip the whole pipeline for repeats), **prompt/KV** (skip re-reading a stable prefix at ~10% price).',
          'Latency comes from the retrieval hop: keep **top-K tight**, use **fast ANN**, **parallelize** independent steps, and **stream** the answer.',
          'Snapshots go stale: **re-index on change**, **expire caches** with sensible TTLs, and **monitor** retrieval relevance, answer quality, and cost-per-query.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Stuffing "just a few more" chunks to be safe', text: 'Every extra chunk is input tokens billed on every single call, plus latency, plus "lost in the middle" quality loss. Retrieve a wide candidate set, then rerank *down* to the 3–5 that matter. More context is not more better.' },
          { title: 'Optimizing embedding cost while ignoring generation', text: 'Teams agonize over the embedding model\'s per-token price — a one-time ingest cost — while the recurring generation bill, driven by context size, is 100x bigger. Spend your optimization effort where the recurring money is: context tokens per query.' },
          { title: 'A semantic cache with a loose threshold', text: 'Set the similarity threshold too low and you serve the cached answer for a *different* question — a confidently wrong response that\'s hard to catch. Start conservative (0.95+), log hits, and spot-check before loosening.' },
          { title: 'Caching forever with no invalidation', text: 'A cache with no TTL or change-invalidation quietly serves stale, wrong answers after the source doc updates. Tie cache lifetime to how fast the underlying content changes, and re-index on change so the vector store never points at deleted content.' },
        ] },
        { type: 'interview', items: [
          { q: '"Our RAG feature works but it\'s too expensive at scale. Where do you look first?"', a: 'I\'d confirm the cost breakdown first: in RAG, generation dominates, and generation cost is driven by retrieved-context input tokens paid per query. So my first move is to trim context — add a reranker and cut top-K from, say, 10 chunks to the 3 best. That roughly halves generation cost and usually improves quality by removing distractors. Next I\'d add caching: a semantic query-result cache for repeat questions (skips the whole pipeline) and prompt caching on the stable system-prompt prefix. Embedding cost is a one-time ingest expense, so I\'d only touch it if re-indexing is frequent. I\'d back all of this with a cost-per-query metric so I can prove the savings.' },
          { q: '"Explain the different caching layers in a RAG system and what each saves."', a: 'Three layers. First, an embedding cache keyed by a hash of the text — embeddings are deterministic, so you never re-embed the same doc or query twice; this matters most on re-index. Second, a query-result cache — for repeat questions, return the stored answer and skip both retrieval and generation, which is the single biggest win when traffic is repetitive; keying by embedding similarity (a semantic cache) catches rewordings. Third, prompt/KV caching — mark the stable prompt prefix (system prompt, shared context) so the provider reuses the processed state at roughly a tenth of the input price instead of re-reading those tokens every call. They stack: they skip re-embedding, then the whole pipeline, then re-reading the prefix.' },
          { q: '"How do you keep RAG latency low?"', a: 'RAG adds a retrieval hop, so I attack that hop. Keep top-K tight — 3 good chunks beat 20 mediocre ones, less to rerank and fewer tokens to generate over. Use approximate nearest-neighbor search (HNSW/IVF) so retrieval is milliseconds, not an exact scan. Parallelize independent steps — embed the query and warm the model connection concurrently, fire multi-index queries in parallel. And stream the response so time-to-first-token is the number users feel, which stays low when the prompt is lean. Most of these also cut cost, so latency and cost work tend to align.' },
          { q: '"What\'s the risk with a semantic cache and how do you manage it?"', a: 'The risk is a false hit: a new query is semantically *close* to a cached one but not actually the same question, so you serve a subtly wrong answer with full confidence. I manage it with a conservative similarity threshold — 0.95 or higher — logging of all cache hits, and periodic spot-checks or evals on served-from-cache answers. I\'d rather have a lower hit-rate with correct answers than a high hit-rate that occasionally answers the wrong question. I also give caches a TTL tied to how fast the source content changes, so a hit is never both wrong *and* stale.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Support docs chatbot with heavy repeats', text: 'Most questions are the same handful ("reset password", "refund policy"). A semantic query-result cache serves the bulk of traffic without touching the LLM, and prompt caching on the shared docs cuts the cost of the misses. Cost per served answer drops by an order of magnitude.' },
          { title: 'Internal knowledge assistant over a large wiki', text: 'The corpus is huge but changes slowly. Embed once, cache embeddings so nightly re-index only touches changed pages, and use ANN for fast retrieval. The dominant remaining cost is generation, controlled by reranking to a tight top-K.' },
          { title: 'Multi-turn RAG conversations', text: 'Follow-up questions reuse the same retrieved context. Prompt-caching the shared context prefix means the model reprocesses it once per conversation instead of once per turn — big savings on long threads.' },
          { title: 'High-freshness product/pricing assistant', text: 'Answers must reflect current prices, so caches get short TTLs and event-driven invalidation on catalog updates. The tradeoff is explicit: lower cache hit-rate in exchange for never serving a stale price. Freshness is a product-driven dial.' },
        ] },
        { type: 'project', title: 'Build a RAG cost calculator', goal: 'Turn the fuzzy fear of "AI is expensive" into a spreadsheet-grade estimate, and quantify exactly what reranking and caching save.', steps: [
          'Define inputs: queries/month, chunks retrieved, avg tokens per chunk, output tokens, and per-1M-token prices for input, output, and embedding. Hard-code sensible defaults, then make them adjustable.',
          'Compute cost-per-query = (chunks × chunk_tokens + prompt_overhead) × input_price + output_tokens × output_price + query_embed_cost. Multiply by queries/month for the monthly bill.',
          'Add a "rerank" scenario: recompute with fewer chunks (e.g. 10 → 3) and show the per-query and monthly savings, both absolute and percentage.',
          'Add a "cache" scenario: given a cache hit-rate (e.g. 80%), effective cost = hit_rate × cheap_lookup + (1 − hit_rate) × full_pipeline. Show the combined effect of reranking *and* caching.',
          'Print a small table: baseline vs +rerank vs +rerank+cache, with monthly cost for each. Sanity-check against real provider pricing pages.',
        ], deliverable: 'A `rag-cost.js` (or a small web page) that takes the inputs and prints monthly cost for three scenarios — baseline, reranked, and reranked+cached — so you can defend a cost estimate in a design review.' },
        { type: 'challenge', title: 'Design a caching strategy for an 80%-repeat docs chatbot', text: 'You run a documentation chatbot: ~2M queries/month, 80% are near-duplicate FAQs, docs update roughly weekly. Design what to cache at each of the three layers (embedding, query-result, prompt/KV), pick a key and a TTL/invalidation rule for each, and estimate the overall cost reduction versus a naive no-cache pipeline. State your assumptions.', hints: [
          'The query-result (semantic) cache is doing the heavy lifting here — with 80% repeats it can take 80% of traffic off the expensive pipeline. Pick a threshold and justify it against the false-hit risk.',
          'Weekly doc updates set your invalidation strategy: re-index changed docs on publish, and expire/invalidate any cached answers that touched a changed doc (or use a TTL shorter than a week).',
          'Estimate: full-pipeline cost × miss-rate + cheap-lookup cost × hit-rate, then compare to full-pipeline × 100%. Layer in reranking-to-3 on the misses for an extra cut, and prompt-caching the shared docs prefix.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: Prompt caching', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching', note: 'The official guide to caching stable prompt prefixes — pricing (write premium vs ~10% read), cache_control, and ordering rules. Read this before wiring prompt caching.' },
          { label: 'Pinecone: RAG in production / scaling', url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/', note: 'A practical walkthrough of the production retrieval stack — indexing, ANN, top-K, and the operational tradeoffs of serving RAG at scale.' },
          { label: 'OpenAI: Embeddings & cost considerations', url: 'https://platform.openai.com/docs/guides/embeddings', note: 'Provider-official pricing and dimensionality details for the embedding half of the cost model — useful for grounding your calculator in real numbers.' },
        ] },
      ],
    },
  ],
}
