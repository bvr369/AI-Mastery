// Lesson 7.6 — Advanced RAG: Query Rewriting, Multi-hop, Agentic RAG

export default {
  sections: [
    {
      id: 'when-naive-breaks',
      title: 'When "retrieve then generate" quietly fails',
      blocks: [
        { type: 'p', text: "You've built the naive [[RAG]] pipeline: embed the user's question, pull the top-k chunks, stuff them into the prompt, generate. For a huge slice of questions, that's genuinely all you need — and you should ship it before reaching for anything here. But then your evals (Lesson 7.7 territory) start showing a stubborn tail of questions where the answer is *right there in your corpus* and the model still whiffs. This lesson is the toolbox for that tail." },
        { type: 'p', text: "The failures aren't random. They cluster into a few shapes, and each shape has a matching fix. The mistake juniors make is bolting on all the fixes at once — a 6-stage Rube Goldberg pipeline for a corpus that a single embedding lookup would've handled. **Advanced RAG is a set of *layers you add on evidence*, not a starting architecture.** You earn each layer by watching naive RAG fail on a specific query type." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a librarian vs a search box', text: "Naive RAG is a search box: it takes your exact words and matches them. Advanced RAG is a *good librarian*. You mumble \"that book about the guy and the whale,\" and the librarian doesn't type that verbatim into the catalog — they **rewrite** your request (\"Moby-Dick, Melville\"), realize they need two lookups (\"first the author, then his catalog\"), know **which section** to walk to, and pull the *surrounding shelf* not just the one spine you described. Every technique in this lesson is a thing the librarian does that a dumb search box can't." },
        { type: 'h', text: 'The four failure shapes' },
        { type: 'table', headers: ['Symptom in your evals', 'Root cause', 'The layer that fixes it'], rows: [
          ["Answer exists but retrieval misses it; user phrasing ≠ document phrasing", "The raw question is a *bad search query*", "**Query rewriting / expansion / HyDE**"],
          ["Question needs two+ facts chained (\"who manages the author of X?\")", "One retrieval can't gather facts that depend on each other", "**Multi-hop / iterative retrieval**"],
          ["Right chunks retrieved but buried at rank 8–15, out of the top-k", "First-stage recall is fine, precision/ordering is bad", "**Reranking** (recall from Lesson 6.5)"],
          ["Query should hit a different index/tool entirely (SQL, docs vs code)", "One index isn't the right destination for every query", "**Query routing**"],
        ] },
        { type: 'p', text: "And sitting above all of them is [[Agentic RAG]] — instead of a *fixed* pipeline, the model itself decides *when* to retrieve, *what* to search for, and *whether it has enough* to answer yet. That's the bridge into Module 8 (agents). We'll build the intuition here and the full loop there." },
      ],
    },
    {
      id: 'fix-the-query',
      title: 'Fix the query before you ever hit the index',
      blocks: [
        { type: 'p', text: "Here's the highest-leverage, most under-appreciated idea in all of RAG: **the user's raw question is often a terrible search query.** People type conversationally (\"why is it so slow lately??\"), reference earlier turns (\"what about the second one?\"), and phrase things nothing like your documents do. Embedding that mess and hoping for good neighbors is leaving recall on the floor. So don't embed the raw question — *transform it first*." },
        { type: 'diagram', id: 'advanced-rag', caption: 'Naive RAG (top) sends the raw question straight to the index. The enriched pipeline (bottom) rewrites and expands the query, retrieves in parallel, reranks, and only then generates. Each stage is optional — add the ones your evals demand.' },
        { type: 'h', text: 'Three flavors of query transformation' },
        { type: 'list', items: [
          "**Rewriting** — clean the query into something search-friendly. Resolve pronouns from chat history (\"the second one\" → \"the Pro plan\"), strip filler, turn a question into a declarative keyword-rich statement. Cheap, huge payoff for conversational apps.",
          "**Expansion / multi-query** — generate *several* alternative phrasings of the same intent, retrieve for each, and **fuse** the results. \"How do I make it faster?\" becomes \"reduce API latency,\" \"database query optimization,\" \"caching strategies.\" Each casts a differently-shaped net; the union has far better recall.",
          "**HyDE (Hypothetical Document Embeddings)** — the clever one. Ask the LLM to *write a fake answer* to the question, then embed *that* and search with it. Why? A hypothetical answer looks a lot more like your real answer-documents than the question does — so it lands closer to them in [[Embedding]] space. You search with an imagined document, not a question.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: HyDE is describing the answer to the librarian', text: "Imagine asking a librarian \"is intermittent fasting effective?\" — vague, and it shares few words with any actual book. Now instead you say: \"I'm looking for something that reads like *'studies show 16:8 fasting reduces caloric intake and modestly improves insulin sensitivity over 12 weeks…'*\" — even though you made that up. That fabricated description matches the *real* books' language far better than your question did. HyDE hallucinates on purpose, then uses the hallucination purely as a **search key** — the fake answer is thrown away; only its embedding is used to retrieve real, grounded chunks." },
        { type: 'callout', variant: 'warn', title: 'HyDE hallucinates — and that\'s fine, if you\'re careful', text: "The hypothetical document is fabricated and you must **never show it to the user or feed it to the generator**. It exists only to produce a better query vector. The real answer is still generated strictly from the *retrieved* chunks (Lesson 7.5 grounding rules apply). HyDE improves *retrieval*; it does nothing for *faithfulness* — keep those two concerns separate." },
        { type: 'callout', variant: 'info', title: 'The cost you\'re trading', text: "Every one of these adds an LLM call (or several) *before* retrieval, so latency and token cost go up. Multi-query with 3 rewrites means 3× the vector lookups plus a fusion step. That's the deal: you spend compute and milliseconds to buy recall. Measure it — if naive RAG already answers the query type well, these layers are pure tax." },
      ],
    },
    {
      id: 'multi-hop-and-agentic',
      title: 'Multi-hop, routing, parent-docs, and the leap to agentic',
      blocks: [
        { type: 'p', text: "Query transformation fixes *phrasing*. But some questions can't be answered by any single retrieval no matter how well you phrase it — because the facts *depend on each other*. That's where iteration comes in." },
        { type: 'h', text: 'Multi-hop / iterative retrieval' },
        { type: 'p', text: "Take: *\"What's the vacation policy for the team that the author of the Q3 roadmap manages?\"* No single chunk contains that. You need to **hop**: (1) retrieve to find who authored the Q3 roadmap → \"Priya,\" (2) retrieve to find which team Priya manages → \"Platform,\" (3) retrieve the Platform team's vacation policy. Each hop's *answer becomes the next hop's query*. Retrieve → reason → retrieve again, until you have the whole chain." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: following footnotes', text: "Multi-hop is doing research the way a human does — you read something, it mentions a name you don't know, so you go look *that* up, which points you somewhere else. Each source hands you the search term for the next. Naive RAG is only allowed to read the first page; multi-hop lets it follow the footnotes." },
        { type: 'h', text: 'Reranking (callback to Lesson 6.5)' },
        { type: 'p', text: "First-stage vector search optimizes for **recall** — cast a wide net, grab the top 20–50 candidates, accept some junk. A [[Reranking|reranker]] (a cross-encoder that reads the query and each candidate *together*) then re-scores them for **precision** and floats the truly relevant ones to the top-k you actually send to the model. Retrieve broad and cheap; rerank narrow and smart. In advanced pipelines this is where multi-query results get fused and ordered before generation." },
        { type: 'h', text: 'Query routing' },
        { type: 'p', text: "Not every question belongs in the same place. \"What's our refund policy?\" wants the docs index; \"How many refunds did we issue in June?\" wants the SQL database; \"Fix this stack trace\" wants the code index. **Routing** uses a quick classifier (often just an LLM with a list of tools) to send each query to the right destination — index, tool, or even 'answer directly, no retrieval needed.' A router is the first thing that starts making your RAG feel *agentic*." },
        { type: 'h', text: 'Parent-document / contextual retrieval' },
        { type: 'p', text: "There's a tension in [[Chunking]] (Lesson 6.4): **small chunks embed and match precisely, but large chunks give the generator enough context to actually answer.** Parent-document retrieval resolves it — you *index and search on small child chunks* for pinpoint matching, but once a child is retrieved, you *expand to its surrounding parent* (the full section, or the neighbors on either side) before handing it to the LLM. Match small, generate big." },
        { type: 'callout', variant: 'tip', title: 'The pattern in one line', text: "Retrieve on the unit that matches best; generate on the unit that answers best. They don't have to be the same unit — decouple them." },
        { type: 'h', text: 'Agentic RAG: let the model run the pipeline' },
        { type: 'p', text: "Everything above is still a *fixed* pipeline — you, the engineer, hardcoded the stages. [[Agentic RAG]] hands the steering wheel to the model. You give it a `search(query)` tool and a loop, and *it* decides: do I even need to retrieve? What should I search for? Looking at what came back — is it enough, or do I need another hop with a refined query? When it judges it has enough, it stops and answers." },
        { type: 'code', lang: 'python', filename: 'agentic_rag_loop.py', code: `# The shape of an agentic RAG loop (pseudocode).
# The MODEL decides when to retrieve and when it's done.
context = []
for hop in range(MAX_HOPS):            # a budget, so it can't loop forever
    decision = llm(
        system="You answer from retrieved context. If you have enough, "
               "respond with FINAL: <answer>. If not, respond with "
               "SEARCH: <the exact query to look up next>.",
        messages=[question] + context,
    )
    if decision.startswith("FINAL:"):
        return decision.removeprefix("FINAL:").strip()   # done — enough info
    query = decision.removeprefix("SEARCH:").strip()      # model wrote a query
    chunks = retrieve(query)                              # go get more
    context.append(f"Results for '{query}': {chunks}")    # feed back, loop
return "I couldn't find enough information to answer confidently."`, caption: 'This is a proto-agent — the Module 8 pattern (reason → act → observe → repeat) applied to retrieval. A hop budget is non-negotiable: without it, a confused model loops forever and burns your token budget.' },
        { type: 'callout', variant: 'warn', title: 'Agentic is powerful and expensive', text: "Each hop is a full LLM call plus a retrieval, and the model decides the count — so latency and cost are *variable and unbounded* without a hard cap. Agentic RAG shines for genuinely multi-step research questions and is overkill for \"what's your return policy?\". Route simple queries to a cheap single-shot path; reserve the agent loop for questions that actually need it." },
      ],
    },
    {
      id: 'build-it',
      title: 'Build it: query rewriting that measurably lifts recall',
      blocks: [
        { type: 'p', text: "Enough theory — let's watch a vague query fail and then watch rewriting rescue it. The playground below runs a tiny retriever over a small corpus. First it searches with the user's raw, mushy question and you'll see it miss relevant docs. Then it uses the sandbox `llm()` to expand that question into several sharper search queries, retrieves for each, and **fuses** the results with Reciprocal Rank Fusion. Compare the recall." },
        { type: 'playground', id: 'query-rewrite-lab', title: 'Multi-query rewriting + fusion vs the raw query', height: 620, lang: 'javascript', code: `// A tiny keyword retriever over a support KB. In real life these are
// embeddings + a vector DB, but term-overlap makes the WIN visible here.
const CORPUS = [
  { id: 'd1', text: 'Reduce API latency by adding a Redis cache layer', topic: 'perf' },
  { id: 'd2', text: 'Database query optimization: add indexes, avoid N+1', topic: 'perf' },
  { id: 'd3', text: 'Caching strategies: TTL, invalidation, CDN edge caching', topic: 'perf' },
  { id: 'd4', text: 'How to reset your password from the login screen', topic: 'auth' },
  { id: 'd5', text: 'Billing: change your plan or update a credit card', topic: 'billing' },
  { id: 'd6', text: 'Profiling slow endpoints with flame graphs', topic: 'perf' },
]
// The docs that SHOULD be retrieved for a perf question (our ground truth).
const RELEVANT = new Set(['d1', 'd2', 'd3', 'd6'])

// Toy retriever: score by shared words, return ranked ids.
function retrieve(query, k = 3) {
  const q = new Set(query.toLowerCase().split(/\\W+/).filter(Boolean))
  return CORPUS
    .map(d => {
      const words = d.text.toLowerCase().split(/\\W+/)
      const score = words.filter(w => q.has(w)).length
      return { id: d.id, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(d => d.id)
}

const recall = (ids) =>
  ids.filter(id => RELEVANT.has(id)).length + '/' + RELEVANT.size

// --- BASELINE: search with the raw, vague question ---
const raw = 'why is it so slow lately??'
const rawHits = retrieve(raw, 4)
console.log('RAW QUERY:', JSON.stringify(raw))
console.log('  hits   :', rawHits.length ? rawHits.join(', ') : '(nothing!)')
console.log('  recall :', recall(rawHits))   // shares no words -> misses everything

// --- REWRITE: ask the LLM for better search queries ---
const prompt = \`A user asked: "\${raw}". Their app is slow.
Write 3 short, keyword-rich search queries that would find relevant docs.
Return ONLY the queries, one per line, no numbering.\`
const reply = await llm(prompt, { system: 'You rewrite vague questions into search queries.' })

// Parse the LLM output; fall back to a fixed set if it doesn't cooperate.
let queries = reply.split('\\n').map(s => s.replace(/^[-*\\d.\\s]+/, '').trim()).filter(Boolean)
if (queries.length < 2) {
  queries = ['reduce API latency', 'database query optimization', 'caching strategies slow endpoints']
}
console.log('\\nREWRITTEN QUERIES:')
queries.forEach(q => console.log('  -', q))

// --- FUSE: Reciprocal Rank Fusion across all sub-query result lists ---
function rrf(resultLists, kConst = 60) {
  const scores = {}
  for (const list of resultLists)
    list.forEach((id, rank) => { scores[id] = (scores[id] || 0) + 1 / (kConst + rank) })
  return Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

const lists = queries.map(q => retrieve(q, 3))
const fused = rrf(lists).slice(0, 4)
console.log('\\nFUSED RESULTS:', fused.join(', '))
console.log('  recall :', recall(fused), '  <-- rewriting rescued the query')`, solution: `// SOLUTION: add HyDE as a 4th sub-query. Ask the LLM to WRITE a fake
// answer, then search with that hypothetical doc's text. It matches
// answer-style documents better than any question phrasing does.
const hyde = await llm(
  \`Write one sentence that would plausibly appear in a doc answering:
   "why is my app slow?" Be specific and technical.\`,
  { system: 'You write hypothetical answer snippets used only as search keys.' }
)
console.log('\\nHYDE (fake doc, used only as a query):', hyde.trim())

// Add HyDE's text as another retrieval list, then fuse ALL of them.
const hydeHits = retrieve(hyde, 3)
const allLists = [...queries.map(q => retrieve(q, 3)), hydeHits]
const fusedPlus = rrf(allLists).slice(0, 4)
console.log('FUSED + HyDE:', fusedPlus.join(', '), '  recall', recall(fusedPlus))
// Takeaway: more differently-shaped queries -> better recall, up to a point.
// Never show 'hyde' to the user; it's fabricated and used ONLY to retrieve.`, caption: '**Exercise:** the raw query retrieves nothing because it shares no words with the docs. Run it, watch fusion fix recall, then open the solution to add a **HyDE** sub-query. Bonus: change `raw` to an auth question and confirm the router-less pipeline over-retrieves perf docs — motivation for query *routing*.' },
        { type: 'h', text: 'The production version: multi-query + HyDE with a real embedding API' },
        { type: 'p', text: "Here's what the same two techniques look like against a real vector store. Note the structure: the LLM produces *query strings*, you embed those, and retrieval is still plain nearest-neighbor — the intelligence moved *upstream* into query construction." },
        { type: 'code', lang: 'python', filename: 'advanced_retrieval.py', code: `from openai import OpenAI
client = OpenAI()

def embed(text):
    r = client.embeddings.create(model="text-embedding-3-small", input=[text])
    return r.data[0].embedding

def multi_query(question, n=3):
    """Expand one question into n keyword-rich search queries."""
    out = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content":
            f"Generate {n} diverse search queries for: {question}\\n"
            f"One per line, no numbering."}],
    )
    return [q.strip() for q in out.choices[0].message.content.splitlines() if q.strip()]

def hyde(question):
    """Write a hypothetical answer; its embedding is the search key."""
    out = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content":
            f"Write a short, plausible passage answering: {question}"}],
    )
    return out.choices[0].message.content   # fabricated on purpose

def advanced_retrieve(question, vector_db):
    queries = multi_query(question) + [hyde(question)]   # rewrites + 1 HyDE
    hits = []
    for q in queries:
        hits += vector_db.search(embed(q), k=5)          # retrieve per query
    fused = reciprocal_rank_fusion(hits)                 # merge + dedupe
    return rerank(question, fused)[:5]                   # cross-encoder -> top-5

# The generator still answers ONLY from these retrieved chunks (grounding, 7.5).
# HyDE and the rewrites improved WHAT we found, not how faithfully we answer.`, caption: 'Multi-query and HyDE both boil down to "make better search keys with the LLM." Retrieval, fusion, and reranking underneath are unchanged.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your eval set shows one cluster of questions failing: the answer is clearly in the corpus, but retrieval never surfaces it because users phrase things nothing like the docs. Which layer do you reach for FIRST?',
            options: [
              'Multi-hop iterative retrieval',
              'Query rewriting / expansion (transform the query before searching)',
              'A bigger embedding model',
              'Increase k to retrieve 100 chunks',
            ],
            answer: 1,
            explain: 'The symptom — user phrasing ≠ document phrasing, answer exists but is missed — is the textbook case for query transformation. Rewriting/expansion reshapes the search key to match how documents are written. Multi-hop fixes chained facts, not phrasing; a bigger model or larger k doesn\'t address the phrasing mismatch and adds cost/noise.',
          },
          {
            q: 'What is the core idea of HyDE (Hypothetical Document Embeddings)?',
            options: [
              'Retrieve documents, then hypothesize which are relevant using a reranker',
              'Generate multiple hypotheses and let the user pick the right one',
              'Ask the LLM to write a fake answer, embed THAT, and use it as the search query — because a hypothetical answer matches real answer-documents better than the question does',
              'Cache hypothetical queries to speed up future retrieval',
            ],
            answer: 2,
            explain: 'HyDE searches with an imagined answer rather than the question. Answer-shaped text lands nearer to real answer-documents in embedding space than a question does. Critically, the fabricated document is used ONLY as a search key and is never shown to the user or fed to the generator — it improves retrieval, not faithfulness.',
          },
          {
            q: 'A question is "What is the PTO policy for the team managed by the author of the Q3 roadmap?" Naive RAG fails no matter how you rephrase it. Why, and what fixes it?',
            options: [
              'The query is too long; truncate it. Fixed by chunking.',
              'The facts are chained — you must find the author, then their team, then that team\'s policy — so you need multi-hop / iterative retrieval',
              'The embedding model is too small; upgrade it',
              'It needs HyDE to hallucinate the policy directly',
            ],
            answer: 1,
            explain: 'No single chunk contains the full answer; each fact is the key to finding the next. That\'s multi-hop: retrieve (author) → reason → retrieve (their team) → reason → retrieve (the policy). Rephrasing can\'t help because the problem is *dependency between facts*, not phrasing. HyDE would just fabricate an ungrounded policy.',
          },
          {
            q: 'What distinguishes AGENTIC RAG from a fixed advanced-RAG pipeline?',
            options: [
              'Agentic RAG uses a bigger model',
              'Agentic RAG skips retrieval entirely and answers from memory',
              'Agentic RAG only works with keyword search, not embeddings',
              'In agentic RAG, the model itself decides at runtime whether to retrieve, what to search for, and when it has enough — instead of the engineer hardcoding the stages',
            ],
            answer: 3,
            explain: 'A fixed pipeline runs the same hardcoded stages every time. Agentic RAG hands control to the model in a reason→retrieve→observe loop: it chooses queries, judges sufficiency, and decides when to stop. That flexibility costs variable, unbounded latency/tokens (hence a hop budget) and bridges directly into Module 8 agents.',
          },
          {
            q: 'Your team indexes tiny 1-sentence chunks so vector matches are pinpoint-accurate, but the generator keeps giving incomplete answers because each chunk lacks context. What is the clean fix?',
            options: [
              'Re-index everything as huge 2000-token chunks',
              'Add more rewritten queries',
              'Parent-document retrieval: match on the small child chunks, but expand to their surrounding parent section before sending to the LLM',
              'Switch from cosine similarity to Euclidean distance',
            ],
            answer: 2,
            explain: 'This is the classic chunk-size tension: small chunks match precisely, large chunks answer completely. Parent-document (contextual) retrieval decouples the two — search on children for precision, then expand to the parent for generation. Re-indexing as huge chunks would wreck match precision; the other options don\'t address the missing-context problem.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l6-c1', front: 'Why rewrite/expand the query before retrieving?', back: 'The user\'s raw question is often a bad search query — conversational, full of pronouns, phrased unlike your docs. Rewriting/expanding it (or generating multiple sub-queries and fusing results) reshapes the search key to match document language and lifts recall.' },
          { id: 'm7-l6-c2', front: 'What is HyDE and why does it work?', back: 'Hypothetical Document Embeddings: ask the LLM to write a fake answer, embed THAT, and search with it. A hypothetical answer sits nearer to real answer-documents in embedding space than a question does. The fabricated doc is a search key only — never shown to the user or given to the generator.' },
          { id: 'm7-l6-c3', front: 'What is multi-hop / iterative retrieval?', back: 'For questions whose facts depend on each other, retrieve → reason → retrieve again, where each hop\'s answer becomes the next hop\'s query. Like following footnotes. Naive RAG can\'t answer these no matter how you rephrase, because the problem is fact dependency, not phrasing.' },
          { id: 'm7-l6-c4', front: 'What is query routing?', back: 'A quick classifier (often an LLM with a tool list) that sends each query to the right destination — docs index, SQL DB, code index, or "answer directly, no retrieval." Different questions belong in different places; routing picks. It\'s the first step toward agentic behavior.' },
          { id: 'm7-l6-c5', front: 'Parent-document / contextual retrieval — the one-liner?', back: 'Retrieve on the unit that matches best (small child chunks for pinpoint precision); generate on the unit that answers best (expand to the surrounding parent section). Decouple the match unit from the generation unit to resolve the chunk-size tension.' },
          { id: 'm7-l6-c6', front: 'Agentic RAG vs a fixed pipeline?', back: 'A fixed pipeline runs hardcoded stages every time. Agentic RAG gives the model a search tool and a loop; it decides when to retrieve, what to search, and whether it has enough before answering. Powerful for multi-step research, but variable/unbounded cost — always cap it with a hop budget.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Advanced RAG is a set of layers you add *on evidence* when evals show naive RAG failing on a specific query type — not a default architecture. Ship naive first.',
          'The raw question is often a bad search query: rewrite it, expand it into multiple sub-queries and fuse (RRF), or use HyDE (search with a fabricated answer) to lift recall.',
          'Multi-hop / iterative retrieval chains dependent facts (retrieve → reason → retrieve); reranking floats the truly relevant chunks to the top; routing sends each query to the right index/tool.',
          'Parent-document retrieval decouples match unit from generation unit: search small for precision, expand to the parent for complete context.',
          'Agentic RAG lets the model decide when/what/whether to retrieve in a loop — powerful, but variable-cost, so always enforce a hop budget. It\'s the bridge to Module 8 agents.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Bolting on every layer at once', text: 'A 6-stage pipeline for a corpus a single embedding lookup would\'ve handled is complexity you\'ll pay for forever in latency, cost, and debugging. Add each layer only after an eval proves naive RAG fails on that query type. Complexity is a cost, not a feature.' },
          { title: 'Feeding the HyDE document to the generator', text: 'The hypothetical document is fabricated. It exists solely to produce a better query vector and must be thrown away after retrieval. Show it to the user or let the model answer from it and you\'ve just laundered a hallucination into the response. Answer only from retrieved chunks.' },
          { title: 'Agentic loops with no hop budget', text: 'A confused model in an unbounded retrieve-loop burns tokens and stalls the request indefinitely. Always cap hops (e.g. MAX_HOPS = 4) and have a graceful "couldn\'t find enough" fallback. Variable cost without a ceiling is an outage waiting to happen.' },
          { title: 'Using multi-hop/agentic when the query is simple', text: 'Most questions ("what\'s your refund policy?") need one retrieval. Routing every query through an expensive agent loop multiplies cost and latency for no benefit. Route simple queries to a cheap single-shot path; reserve iteration for genuinely multi-step questions.' },
        ] },
        { type: 'interview', items: [
          { q: '"Your naive RAG works in the demo but fails on a chunk of real user queries. How do you diagnose and fix it?"', a: 'I\'d first build an eval set from the failing queries and separate the two failure modes: bad retrieval (the right chunk was never pulled) vs bad generation (right chunk pulled, model misread it). For retrieval failures I look at query type. Phrasing mismatch → query rewriting/expansion or HyDE. Chunks retrieved but ranked too low → add a reranker. Facts that depend on each other → multi-hop. Wrong index entirely → routing. Incomplete answers from tiny chunks → parent-document retrieval. The discipline is: each layer is justified by a specific, measured failure, not added speculatively.' },
          { q: '"Explain HyDE and when you\'d use it."', a: 'HyDE — Hypothetical Document Embeddings — asks the LLM to write a plausible answer to the question, then embeds that fabricated answer and uses it as the retrieval query instead of the question. It works because answer-shaped text sits closer to real answer-documents in embedding space than a question does, so recall improves, especially for terse or vaguely-worded queries. The key discipline: the hypothetical is a search key only — never shown to the user, never fed to the generator, which still answers strictly from the real retrieved chunks. It trades an extra LLM call for better recall.' },
          { q: '"What is agentic RAG and how is it different from a normal RAG pipeline?"', a: 'In a normal pipeline the engineer hardcodes the stages — retrieve, maybe rerank, generate — and they run identically every time. Agentic RAG gives the model a retrieval tool and a loop, and the model decides at runtime whether to retrieve, what query to issue, and whether the accumulated context is sufficient to answer or it needs another hop. It\'s the reason→act→observe agent pattern applied to retrieval. The upside is handling open-ended multi-step questions; the cost is variable, potentially unbounded latency and tokens, so you cap it with a hop budget and route simple queries around it. It\'s essentially the on-ramp to full agents in Module 8.' },
          { q: '"Why do multi-query and reranking often show up together?"', a: 'They\'re complementary halves of a recall-then-precision strategy. Multi-query casts several differently-worded nets and fuses the results to maximize the chance the relevant chunk is retrieved *at all* (recall). But fusing multiple result lists produces more candidates than you want to send to the model, and ordering gets noisy. A reranker — a cross-encoder that scores each candidate against the query jointly — then re-sorts them for precision and trims to the final top-k. Retrieve broad, rerank narrow.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Conversational support assistants', text: 'Chat products rewrite each turn against the conversation history ("what about the second one?" → "the Pro plan\'s cancellation terms") before retrieving, so follow-up questions actually hit the right docs instead of retrieving on ambiguous pronouns.' },
          { title: 'Enterprise research copilots', text: 'Tools like Perplexity-style researchers and internal knowledge agents run multi-hop / agentic loops: decompose a complex question, retrieve, reason, retrieve again across sources, and synthesize — following the chain of facts a human researcher would.' },
          { title: 'Code assistants over large repos', text: 'Routing sends "explain this error" to the code+logs index, "how do I configure X" to the docs index, and "what changed last week" to git history — each destination tuned differently, chosen per query by a lightweight router.' },
          { title: 'Legal / medical retrieval', text: 'High-stakes domains lean on parent-document retrieval (match a precise clause, expand to the full section for context) and reranking, so the model sees pinpoint-relevant *and* fully-contextualized passages before generating a grounded, citable answer.' },
        ] },
        { type: 'project', title: 'Query rewriting that beats the raw query', goal: 'Prove to yourself that transforming the query lifts recall, by building multi-query expansion + fusion and measuring the improvement against a labeled set.', steps: [
          'Assemble a tiny corpus of ~10 short docs across 2–3 topics, and write 5 deliberately vague/conversational questions (e.g. "why is it acting up?"). For each question, hand-label which docs are truly relevant — that\'s your ground truth.',
          'Build a baseline retriever (toy term-overlap like the playground, or real embeddings) and record recall@k for each raw question. Expect it to be poor on the vague ones.',
          'For each question, use an LLM (sandbox `llm()` or a real API) to generate 3 improved search queries. Retrieve for each sub-query.',
          'Fuse the sub-query result lists with Reciprocal Rank Fusion (RRF), dedupe, and take the top-k. Record recall@k for the fused result.',
          'Tabulate raw vs fused recall across all 5 questions. Note which question types improved most (usually the vaguest). Bonus: add a HyDE sub-query and see if recall climbs further.',
        ], deliverable: 'A script + a short table showing raw-query recall vs rewritten-and-fused recall on your 5 labeled questions, with a one-line note on which query types benefited most.' },
        { type: 'challenge', title: 'Build a 2-hop agentic retriever', text: 'Implement an agentic loop where the model decides whether it has enough information or needs to retrieve again, then prove it on a genuinely 2-hop question ("What\'s the PTO policy of the team led by the person who wrote doc X?"). The model must issue hop 1 (find the author), read the result, then issue hop 2 (find that person\'s team → policy), and only then answer — all decided by the model, not hardcoded.', hints: [
          'Give the model a strict output protocol: it must reply with either `SEARCH: <query>` or `FINAL: <answer>`. Parse the prefix to decide whether to retrieve again or stop.',
          'Feed each hop\'s retrieved results back into the message history before the next decision, so the model can use hop 1\'s answer to write hop 2\'s query.',
          'Enforce MAX_HOPS (e.g. 3) with a graceful "couldn\'t find enough info" fallback — without a budget a confused model loops forever. This is exactly the Module 8 agent pattern in miniature.',
        ] },
        { type: 'reading', links: [
          { label: 'HyDE: Precise Zero-Shot Dense Retrieval without Relevance Labels (paper)', url: 'https://arxiv.org/abs/2212.10496', note: 'The original HyDE paper — search with a generated hypothetical document. Short and readable; the intuition is exactly the "describe the answer to the librarian" move.' },
          { label: 'LangChain: Query Transformations (multi-query, HyDE, decomposition)', url: 'https://blog.langchain.dev/query-transformations/', note: 'A practical tour of rewriting, multi-query, HyDE, step-back, and decomposition with code — the engineering counterpart to this lesson.' },
          { label: 'Anthropic: Contextual Retrieval', url: 'https://www.anthropic.com/news/contextual-retrieval', note: 'How prepending chunk-level context before embedding (a cousin of parent-document retrieval) sharply cuts retrieval failures — with real numbers and reranking comparisons.' },
        ] },
      ],
    },
  ],
}
