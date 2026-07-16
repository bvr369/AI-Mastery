// Lesson 6.3 — Vector Databases

export default {
  sections: [
    {
      id: 'the-problem',
      title: 'Where embeddings actually live in production',
      blocks: [
        { type: 'p', text: "You now know how to turn text into an [[Embedding]] (Lesson 5.1) and measure closeness with [[Cosine Similarity]]. In a demo, you keep a few vectors in an array and loop over them. Ship that to production and it falls apart the moment your knowledge base grows — because the loop that felt instant over 8 vectors becomes a stall over 8 million." },
        { type: 'p', text: "This lesson is about the piece of infrastructure that makes retrieval fast at real scale: the **[[Vector Database]]**. It's where your document embeddings live, get indexed, and get searched in milliseconds. Every RAG system, every \"chat with your docs\" product, every semantic search bar you've admired has one of these underneath." },
        { type: 'h', text: 'The problem: brute force does not scale' },
        { type: 'p', text: "Naive semantic search is a linear scan: to find the nearest chunk to a query, you compute cosine similarity against **every** stored vector, then sort. That's O(n) similarity calculations per query, and each one is a dot product over hundreds or thousands of dimensions. The math is simple; the volume is brutal." },
        { type: 'table', headers: ['Vectors in store', 'Brute-force comparisons per query', 'Feels like'], rows: [
          ['1,000', '1,000 dot products', 'Instant — do this, it\'s fine'],
          ['100,000', '100,000 dot products', 'Noticeable lag per query'],
          ['10,000,000', '10,000,000 dot products', 'Seconds per query — unusable'],
        ] },
        { type: 'p', text: "And that's *one* query. A real app serves many users concurrently, each firing queries that each demand a full scan. Brute force turns your search into a space heater. There has to be a way to *not* look at every vector — and there is." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: finding a book without reading every book', text: "Brute-force search is walking into a library and reading the first sentence of all two million books to find the one most like your query. A [[Vector Database]] is the library's organization system — sections, shelves, a card catalog — so you walk straight to the right neighborhood and only consider a few hundred candidates. You might occasionally miss a book shelved slightly wrong, but you find the right one ~99% of the time in a fraction of the effort. That trade — a tiny bit of accuracy for a massive speedup — is the entire game." },
      ],
    },
    {
      id: 'ann-and-hnsw',
      title: 'The solution: approximate nearest neighbor (ANN)',
      blocks: [
        { type: 'p', text: "The key insight: you almost never need the *mathematically perfect* nearest neighbors. You need the *right* results, fast. An **[[Approximate Nearest Neighbor]]** (ANN) index gives you the top-K that are correct ~99% of the time, while skipping the vast majority of comparisons. That last 1% — a slightly-wrong neighbor now and then — is invisible in a RAG pipeline where you retrieve several chunks and the LLM reads them all anyway." },
        { type: 'p', text: "The metric for \"how often did we get it right\" is **[[Recall]]**: of the true top-K nearest vectors, what fraction did the index actually return? Exact search has 100% recall but is slow. ANN indexes let you dial recall up toward 100% by working harder (searching more candidates) or down for more speed. Production systems tune this knob deliberately." },
        { type: 'diagram', id: 'vector-index', caption: 'Left: brute force compares the query to every vector. Right: an ANN index (HNSW) hops through a small graph, touching only a fraction of the vectors to find the nearest neighbors.' },
        { type: 'h', text: 'HNSW: the index you\'ll meet everywhere' },
        { type: 'p', text: "The dominant ANN algorithm today is **[[HNSW]]** (Hierarchical Navigable Small World). You don't need to implement it, but you should understand the shape of it, because it explains the tradeoffs you'll actually tune." },
        { type: 'p', text: "Picture a multi-layer graph. The **top layer** has a few vectors connected by long-range links — an express highway across the whole space. Each layer below is denser, with shorter links, until the **bottom layer** contains every vector connected to its close neighbors. A search *enters at the top*, greedily hops toward the query along the sparse highway, then *drops down a layer* and refines, and repeats — zooming from continent to city to street. It touches a few hundred nodes instead of ten million." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: zooming in on a map app', text: "HNSW searches the way you find a café on a map. You start zoomed all the way out (top layer, big jumps between cities), pan roughly toward the right region, then zoom in a level (fewer, shorter moves), then again, until you're on the exact street. You never inspected every address on Earth — you navigated a hierarchy from coarse to fine. That hierarchy is why HNSW is fast and why it's called *hierarchical* and *navigable*." },
        { type: 'table', headers: ['Knob', 'What it does', 'The tradeoff'], rows: [
          ['`ef_search` (query-time)', 'How many candidates to explore per query', 'Higher = better recall, slower queries'],
          ['`ef_construction` (build-time)', 'How carefully the graph is built', 'Higher = better index, slower + more RAM to build'],
          ['`M` (connections per node)', 'Graph density / links per vector', 'Higher = better recall, more memory per vector'],
        ] },
        { type: 'callout', variant: 'info', title: 'Other indexes exist', text: "HNSW is the default in Qdrant, Weaviate, Milvus, and pgvector, and it's what you'll tune 90% of the time. You may also hear **IVF** (inverted file — cluster vectors, search only the nearest clusters) and **product quantization / PQ** (compress vectors to save memory at some accuracy cost). Pinecone abstracts the algorithm away entirely. The concept — approximate, graph- or cluster-based, tunable recall — carries across all of them." },
      ],
    },
    {
      id: 'what-a-vector-db-does',
      title: 'What a vector database actually does',
      blocks: [
        { type: 'p', text: "\"Vector database\" undersells it. It's not just an ANN index in a box — it's a full data system built around vectors. Four jobs matter, and only the second is the exotic one:" },
        { type: 'list', items: [
          "**Store** vectors alongside their **metadata** and original text. Each record is roughly `{ id, vector, text, metadata }` — the embedding *and* everything you need to filter, display, and cite the result.",
          "**Index** the vectors (build the HNSW graph) so similarity search is fast, and keep that index updated as data changes.",
          "**Search** — given a query vector, return the top-K most similar records by cosine (or dot product), in milliseconds, at scale.",
          "**Filter by metadata** — restrict the search to records matching structured conditions (`tenant = 'acme'`, `date > '2026-01-01'`, `type = 'invoice'`) so you search the right subset, not the whole universe.",
        ] },
        { type: 'p', text: "That fourth job is what separates a real vector database from a similarity function you wrote in an afternoon. In production you almost never want to search *everything* — you want the closest chunks *belonging to this user*, *from this document set*, *within this date range*. Metadata filtering is how multi-tenant SaaS keeps Customer A's data from ever surfacing in Customer B's results." },
        { type: 'demo', id: 'vector-search-viz' },
        { type: 'p', text: "Play with the demo above. Move the query point and watch the top-K nearest chunks light up in 2D — that highlighting *is* what `query()` returns from a vector DB, just projected down from hundreds of dimensions so your eyes can follow it. Notice how the chosen chunks are the ones the query arrow points *toward*, not the ones that happen to be physically clustered elsewhere." },
        { type: 'callout', variant: 'warn', title: 'Filtering has real subtlety', text: "Combining metadata filters with ANN search is harder than it sounds. **Pre-filtering** (narrow to matching records, then search) can wreck the HNSW graph's connectivity if the filter is very selective — you may traverse into a region with no matching neighbors. **Post-filtering** (search first, then drop non-matches) can leave you with too few results after filtering. Mature databases (Qdrant, Pinecone) implement filtered search carefully so you get correct top-K *and* good recall. It's a real reason to use a purpose-built DB rather than rolling your own." },
      ],
    },
    {
      id: 'the-landscape',
      title: 'The landscape: choosing a vector database',
      blocks: [
        { type: 'p', text: "The space is crowded and moves fast, but the options sort into a few clear buckets. You don't need to memorize features — you need a decision framework. The biggest fork is **managed service vs. self-hosted**, and the biggest shortcut is **you might already have one**." },
        { type: 'table', headers: ['Database', 'Shape', 'Reach for it when'], rows: [
          ['**Pinecone**', 'Fully managed, serverless, closed-source', 'You want zero ops and to move fast; happy to pay and stay on their cloud'],
          ['**pgvector**', 'Postgres extension (open source)', 'You *already run Postgres* — add vectors next to your relational data, one less system'],
          ['**Qdrant**', 'Open source, Rust; managed cloud too', 'You want strong filtered search, self-host control, or a generous free tier'],
          ['**Weaviate**', 'Open source; managed cloud too', 'You want built-in hybrid search and modules; GraphQL-flavored API'],
          ['**Chroma**', 'Open source, embedded/lightweight', 'Local dev, prototypes, notebooks — the "SQLite of vector DBs"'],
          ['**Milvus**', 'Open source, distributed, heavy-duty', 'Billions of vectors, serious scale, you have a platform team'],
        ] },
        { type: 'callout', variant: 'tip', title: 'The pragmatic default', text: "**If you already run Postgres, start with [[pgvector]].** Adding one extension lets you store embeddings in the same database as your users and documents, filter with plain SQL `WHERE` clauses, and join vectors to relational data — no new service, no data-sync job, transactional consistency for free. It scales further than people expect (millions of vectors). Reach for a dedicated vector DB when you outgrow it — billions of vectors, or you need features Postgres doesn't have — not before. Adding infrastructure you don't need yet is a classic early mistake." },
        { type: 'p', text: "For a prototype, use **Chroma** — it runs in-process, no server to manage, and swaps out later. For a production app that's mostly CRUD with some semantic search bolted on, use **pgvector**. For a search-first product at large scale, a dedicated managed DB (**Pinecone**, **Qdrant Cloud**) earns its keep. There's no universally right answer — there's a right answer for your scale and your ops appetite." },
        { type: 'callout', variant: 'info', title: 'One thing they all share', text: "Whatever you pick, the *mental model* is identical: upsert `{id, vector, metadata}` records, then query with a vector to get top-K by similarity, optionally filtered by metadata. Learn that shape once (below) and every vector DB's SDK is a variation on it. Migrating between them is mostly re-embedding and re-loading, not rethinking." },
      ],
    },
    {
      id: 'the-api',
      title: 'The API shape: upsert, query, filter',
      blocks: [
        { type: 'p', text: "Every vector DB exposes two core operations. **Upsert** writes records (insert or update by id). **Query** takes a vector and returns the nearest records. Learn this pair and you can drive any of them. Here's the Pinecone-style shape, which most SDKs echo:" },
        { type: 'code', lang: 'python', filename: 'pinecone_basics.py', code: "from openai import OpenAI\nfrom pinecone import Pinecone\n\noai = OpenAI()\npc = Pinecone(api_key=\"...\")\nindex = pc.Index(\"docs\")\n\ndef embed(text):\n    r = oai.embeddings.create(model=\"text-embedding-3-small\", input=text)\n    return r.data[0].embedding\n\n# --- UPSERT: write vectors + metadata (insert or overwrite by id) ---\nindex.upsert(vectors=[\n    { \"id\": \"doc1#chunk0\",\n      \"values\": embed(\"How to reset your password\"),\n      \"metadata\": { \"doc\": \"account-help\", \"tenant\": \"acme\", \"type\": \"faq\" } },\n    { \"id\": \"doc1#chunk1\",\n      \"values\": embed(\"Setting up two-factor authentication\"),\n      \"metadata\": { \"doc\": \"account-help\", \"tenant\": \"acme\", \"type\": \"faq\" } },\n])\n\n# --- QUERY: embed the question, get top-K, filtered by metadata ---\nq = embed(\"I forgot my login and can't get in\")\nres = index.query(\n    vector=q,\n    top_k=3,\n    include_metadata=True,\n    filter={ \"tenant\": \"acme\", \"type\": \"faq\" },   # only search this tenant's FAQs\n)\nfor match in res[\"matches\"]:\n    print(round(match[\"score\"], 3), match[\"metadata\"][\"doc\"], match[\"id\"])", caption: 'Two calls run a semantic search backend: upsert once when documents change, query on every user question. The `filter` is what makes it multi-tenant-safe.' },
        { type: 'p', text: "The same shape in SQL, using **pgvector**, so you can see there's no magic — it's a column type plus an index plus an `ORDER BY`:" },
        { type: 'code', lang: 'sql', filename: 'pgvector.sql', code: "-- Enable the extension, then store vectors as a first-class column type.\nCREATE EXTENSION IF NOT EXISTS vector;\n\nCREATE TABLE chunks (\n  id      text PRIMARY KEY,\n  text    text,\n  tenant  text,\n  type    text,\n  embedding vector(1536)          -- must match your embedding model's dims\n);\n\n-- Build an HNSW index so search is fast (cosine distance operator class).\nCREATE INDEX ON chunks\n  USING hnsw (embedding vector_cosine_ops);\n\n-- UPSERT: plain SQL insert-or-update by primary key.\nINSERT INTO chunks (id, text, tenant, type, embedding)\nVALUES ('doc1#chunk0', 'How to reset your password', 'acme', 'faq', '[0.01, -0.2, ...]')\nON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding, text = EXCLUDED.text;\n\n-- QUERY: nearest neighbors by cosine distance (<=>), filtered with a WHERE clause.\n--   <=> is cosine distance, so SMALLER is closer; ORDER BY ascending.\nSELECT id, text, 1 - (embedding <=> '[...query vector...]') AS similarity\nFROM chunks\nWHERE tenant = 'acme' AND type = 'faq'        -- metadata filter = ordinary SQL\nORDER BY embedding <=> '[...query vector...]'  -- ANN search via the HNSW index\nLIMIT 3;", caption: 'pgvector turns similarity search into SQL you already know. The `<=>` operator is cosine distance; metadata filtering is just a `WHERE`. This is why "already on Postgres" is such a strong default.' },
        { type: 'callout', variant: 'warn', title: 'Upserts and re-indexing: the operational reality', text: "Documents change, so you'll re-embed and **upsert** (overwrite by id) constantly — that's normal and cheap. Two gotchas: (1) When you delete or edit a source document, you must delete/replace *its* chunk vectors too, or stale content keeps getting retrieved (a top cause of \"the bot cited something we deleted\"). (2) If you **switch embedding models**, every stored vector is now in an incompatible space — you must **re-embed and re-index the entire corpus**. Vectors from different models can't be compared, and the DB won't warn you; rankings just silently go wrong." },
      ],
    },
    {
      id: 'playground',
      title: 'Build the thing: an in-memory vector DB',
      blocks: [
        { type: 'p', text: "The fastest way to demystify a vector database is to build a tiny one. Under the hood, a vector DB is *conceptually* just: a store of `{id, vector, text}` records, an `upsert` to add them, and a `topK(query, k)` that ranks by cosine and returns the best. The production magic is the ANN index that makes `topK` fast — but the *behavior* is exactly the brute-force version below. Run it, read the ranking, then do the exercise." },
        { type: 'playground', id: 'tiny-vector-db', title: 'A brute-force vector DB in ~30 lines', height: 520, code: "// A minimal in-memory \"vector database\". Real DBs add an ANN index for\n// speed and metadata filtering — but this IS the behavior underneath.\n\nconst dot  = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)\nconst norm = (a) => Math.sqrt(dot(a, a))\nconst cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))\n\nfunction createVectorDB() {\n  const records = []   // each: { id, vector, text }\n  return {\n    upsert(id, vector, text) {\n      const existing = records.find(r => r.id === id)\n      if (existing) { existing.vector = vector; existing.text = text }\n      else records.push({ id, vector, text })\n    },\n    // Brute force: score every record, sort, take k. This is the O(n) scan\n    // an ANN index replaces — same result, far fewer comparisons.\n    topK(query, k = 3) {\n      return records\n        .map(r => ({ ...r, score: cosine(query, r.vector) }))\n        .sort((a, b) => b.score - a.score)\n        .slice(0, k)\n    },\n  }\n}\n\n// Toy 3-D \"embeddings\". Axes (loosely): [account, billing, security]\nconst db = createVectorDB()\ndb.upsert(\"c1\", [0.9, 0.1, 0.1], \"How to reset your password\")\ndb.upsert(\"c2\", [0.2, 0.9, 0.1], \"Update your billing card\")\ndb.upsert(\"c3\", [0.1, 0.1, 0.95], \"Enable two-factor authentication\")\ndb.upsert(\"c4\", [0.85, 0.15, 0.2], \"Recover a locked account\")\n\n// Query: a password/account-ish question. Note it points at the account axis.\nconst query = [0.88, 0.12, 0.15]\nconsole.log(\"Top 2 matches:\")\nfor (const m of db.topK(query, 2)) {\n  console.log(\"  \" + m.score.toFixed(3) + \"  \" + m.id + \"  \" + m.text)\n}", solution: "// SOLUTION: add METADATA + FILTERING, the fourth job of a real vector DB.\n// Records now carry a `meta` object; topK filters BEFORE ranking.\n\nconst dot  = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)\nconst norm = (a) => Math.sqrt(dot(a, a))\nconst cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))\n\nfunction createVectorDB() {\n  const records = []\n  const matches = (meta, filter) =>\n    Object.entries(filter).every(([key, val]) => meta[key] === val)\n  return {\n    upsert(id, vector, text, meta = {}) {\n      const hit = records.find(r => r.id === id)\n      if (hit) Object.assign(hit, { vector, text, meta })\n      else records.push({ id, vector, text, meta })\n    },\n    topK(query, k = 3, filter = {}) {\n      return records\n        .filter(r => matches(r.meta, filter))   // pre-filter by metadata\n        .map(r => ({ ...r, score: cosine(query, r.vector) }))\n        .sort((a, b) => b.score - a.score)\n        .slice(0, k)\n    },\n  }\n}\n\nconst db = createVectorDB()\ndb.upsert(\"c1\", [0.9, 0.1, 0.1], \"Reset your password\",       { tenant: \"acme\" })\ndb.upsert(\"c2\", [0.88, 0.12, 0.1], \"Reset password (other co)\", { tenant: \"globex\" })\ndb.upsert(\"c3\", [0.1, 0.1, 0.95], \"Enable 2FA\",                { tenant: \"acme\" })\n\n// Same query, but scoped to ONE tenant — globex's near-identical chunk is invisible.\nconst query = [0.9, 0.1, 0.12]\nconsole.log(\"acme-only matches:\")\nfor (const m of db.topK(query, 3, { tenant: \"acme\" })) {\n  console.log(\"  \" + m.score.toFixed(3) + \"  \" + m.id + \"  \" + m.text)\n}\n// c2 scores highest by cosine but is filtered out — multi-tenant safety in action.", caption: '**Exercise:** the base version stores and ranks. Now add **metadata filtering**: give each record a `meta` object (e.g. `{ tenant: \"acme\" }`) and make `topK(query, k, filter)` only rank records matching the filter. Test that a high-scoring chunk from the wrong tenant never appears. (Solution provided.)' },
        { type: 'callout', variant: 'tip', title: 'What you just proved', text: "Your 30-line `topK` returns the *same results* a production vector DB would — the DB just does it in milliseconds over millions of records via HNSW instead of a full scan over four. When you call Pinecone's `query()` or pgvector's `ORDER BY embedding <=> ...`, this is the behavior you're getting, accelerated. Understanding the brute-force version means you'll never be confused about what the DB is *for*." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your semantic search prototype loops over an array computing cosine similarity, and it\'s snappy with 500 documents. You\'re about to load 5 million chunks. What breaks, and what fixes it?',
            options: [
              'Nothing breaks; cosine similarity is O(1) regardless of size',
              'Brute-force search becomes O(n) per query and grinds to a halt; an ANN index (e.g. HNSW) in a vector database fixes it',
              'The embeddings expire and must be regenerated hourly',
              'You need a bigger embedding model with more dimensions',
            ],
            answer: 1,
            explain: 'Brute force compares the query to every vector — fine at 500, unusable at 5M. An Approximate Nearest Neighbor index like HNSW navigates a graph to touch only a few hundred candidates per query, trading ~1% recall for an enormous speedup. That index is the core of a vector database.',
          },
          {
            q: 'A colleague worries that HNSW\'s "approximate" nearest neighbor will return wrong answers and hurt your RAG quality. What\'s the accurate response?',
            options: [
              'They\'re right — always use exact brute-force search in production',
              'HNSW typically hits ~99% recall, and RAG retrieves several chunks the LLM reads together, so an occasional slightly-off neighbor is invisible; recall is a tunable knob',
              'HNSW is exact, not approximate — the name is misleading',
              'Approximate search only matters for images, not text',
            ],
            answer: 1,
            explain: 'ANN indexes reach ~99% recall and let you dial it higher by exploring more candidates (e.g. raising ef_search) at the cost of speed. In RAG you fetch top-K chunks and the model reads all of them, so a rare imperfect neighbor rarely changes the answer. The speedup is worth the tiny, tunable accuracy trade.',
          },
          {
            q: 'You\'re building multi-tenant SaaS where each customer\'s documents must NEVER appear in another customer\'s search results. Which vector DB capability is non-negotiable here?',
            options: [
              'A larger top_k value',
              'Metadata filtering — scoping the search to records where e.g. tenant = the current customer',
              'A higher-dimensional embedding model',
              'Storing vectors in float64 instead of float32',
            ],
            answer: 1,
            explain: 'Metadata filtering restricts the similarity search to records matching structured conditions (tenant, date, type). Without it, a semantically similar chunk from Customer B could surface in Customer A\'s results — a data-leak bug. Raising top_k or changing dimensions does nothing to isolate tenants.',
          },
          {
            q: 'Your team already runs Postgres for the app\'s relational data and now needs semantic search over a few hundred thousand document chunks. What\'s the pragmatic first choice?',
            options: [
              'Immediately adopt a distributed system like Milvus for future-proofing',
              'pgvector — add the extension to your existing Postgres, store vectors beside your relational data, and filter with plain SQL WHERE clauses',
              'Build a custom C++ ANN engine from scratch',
              'Avoid vectors entirely and use keyword search only',
            ],
            answer: 1,
            explain: 'pgvector adds a vector column type and HNSW index to Postgres you already operate — no new service, no sync job, metadata filtering via ordinary SQL, and transactional consistency for free. It scales to millions of vectors. Reaching for Milvus at a few hundred thousand chunks is premature infrastructure.',
          },
          {
            q: 'After six months you decide to switch from text-embedding-3-small to a newer, better embedding model. What must you do to your vector database?',
            options: [
              'Nothing — embeddings from different models are interchangeable',
              'Just update the query code; stored vectors stay valid',
              'Re-embed and re-index the ENTIRE corpus with the new model, because vectors from different models live in incompatible spaces',
              'Only re-embed documents added after the switch',
            ],
            answer: 2,
            explain: 'Vectors from different models occupy different learned spaces — their numbers aren\'t comparable, and cosine between them is meaningless. If old chunks stay embedded with the old model while queries use the new one, rankings silently degrade with no error. Switching models means re-embedding and re-indexing everything.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm6-l3-c1', front: 'Why can\'t you brute-force semantic search at scale?', back: 'It\'s O(n) per query — a cosine similarity against every stored vector. Fine for thousands, unusable for millions/billions. A vector database with an ANN index solves it by touching only a fraction of the vectors.' },
          { id: 'm6-l3-c2', front: 'What is ANN (Approximate Nearest Neighbor), and what is recall?', back: 'ANN returns the top-K nearest vectors correct ~99% of the time while skipping most comparisons — trading a little accuracy for huge speed. Recall = the fraction of the true top-K the index actually returned; it\'s a tunable knob.' },
          { id: 'm6-l3-c3', front: 'What is HNSW and how does it search?', back: 'Hierarchical Navigable Small World — a multi-layer graph. Search enters at a sparse top layer (big jumps), greedily hops toward the query, drops down denser layers to refine (coarse→fine, like zooming a map), touching a few hundred nodes instead of millions.' },
          { id: 'm6-l3-c4', front: 'The four jobs of a vector database?', back: 'Store vectors + metadata + text; Index them (build the HNSW graph); Search (top-K by cosine/dot, fast, at scale); Filter by metadata (search within a tenant/date/type). The filtering is what a hand-rolled cosine loop lacks.' },
          { id: 'm6-l3-c5', front: 'When should you just use pgvector?', back: 'When you already run Postgres. One extension adds a vector column + HNSW index; you store embeddings beside relational data, filter with plain SQL WHERE, and get transactional consistency free — no new service. Scales to millions of vectors before you need a dedicated DB.' },
          { id: 'm6-l3-c6', front: 'What breaks when you switch embedding models?', back: 'Everything, silently. Vectors from different models live in incompatible spaces and can\'t be compared. You must re-embed and re-index the entire corpus. Also: when a source doc is deleted/edited, delete/replace its chunk vectors or stale content keeps getting retrieved.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Brute-force similarity search is O(n) per query — fine for a demo, unusable past ~100k vectors. Vector databases exist to fix this.',
          'ANN indexes (dominantly HNSW) return top-K at ~99% recall while skipping most comparisons; recall is a tunable speed/accuracy knob.',
          'A vector DB does four things: store (vector + metadata + text), index, search top-K, and filter by metadata — the last is essential for multi-tenant safety.',
          'Choose by ops appetite and scale: pgvector if you\'re already on Postgres, Chroma for prototypes, Pinecone/Qdrant for managed scale, Milvus for billions.',
          'The universal API is upsert `{id, vector, metadata}` then query by vector for top-K. Switching embedding models means re-embedding and re-indexing everything.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Shipping brute-force to production', text: 'A cosine loop over an array is perfect for learning and prototyping — and a performance cliff in production. Once you\'re past tens of thousands of vectors and serving concurrent users, you need an ANN index. Don\'t discover this under load; pick a vector DB before the corpus grows.' },
          { title: 'Adding heavy infrastructure too early', text: 'Standing up Milvus or a managed cluster for 50k chunks is premature. Start with the lightest thing that works — Chroma locally, pgvector if you have Postgres — and graduate only when you actually hit its limits. Unneeded infrastructure is cost, ops burden, and complexity you pay for daily.' },
          { title: 'Forgetting to delete/update vectors when source docs change', text: 'When a document is edited or removed, its old chunk vectors linger in the index and keep getting retrieved — the bot cites content you deleted. Every write path to your source data needs a matching upsert/delete to the vector store. Stale vectors are a top cause of "why did it say that?"' },
          { title: 'Switching embedding models without re-indexing', text: 'Vectors from a new model are in a different space than your stored ones; comparing them yields silent, meaningless rankings with no error. Changing embedding models is a full re-embed + re-index of the corpus. Treat the model choice as part of the index\'s identity.' },
        ] },
        { type: 'interview', items: [
          { q: '"Why do we need a vector database — can\'t we just compute cosine similarity in code?"', a: 'You can, and should, while prototyping — it\'s the exact same math. The problem is scale: a code loop is O(n) per query, so it degrades linearly and becomes unusable at millions of vectors, especially under concurrent load. A vector database adds an Approximate Nearest Neighbor index (usually HNSW) that returns top-K at ~99% recall while touching only a small fraction of vectors, plus operational features you\'d otherwise rebuild: metadata filtering, upserts, persistence, and scaling. The DB is the cosine loop plus the index plus the plumbing.' },
          { q: '"Explain HNSW and the recall/speed tradeoff."', a: 'HNSW — Hierarchical Navigable Small World — is a multi-layer proximity graph. The top layer is sparse with long-range links; lower layers are progressively denser with shorter links. A search enters at the top, greedily hops toward the query, then descends layers to refine, like zooming from a world map to a street. It inspects a few hundred nodes instead of the whole set. It\'s approximate: recall (the fraction of true nearest neighbors returned) is typically ~99% and tunable — raising ef_search explores more candidates for higher recall at the cost of latency. In RAG that trade is almost free because you retrieve several chunks the model reads together.' },
          { q: '"How would you choose a vector database for a new project?"', a: 'I start from ops appetite and scale, not features. If we already run Postgres, pgvector is the default — vectors beside relational data, SQL metadata filtering, no new service. For a quick prototype, Chroma runs in-process. For a search-first product at large scale with a small team, a managed service like Pinecone or Qdrant Cloud removes the ops burden. Only at billions of vectors with a platform team would I reach for something like Milvus. The API shape is the same across all of them, so I optimize for the least infrastructure that meets current scale and migrate if we outgrow it.' },
          { q: '"How do you keep a vector store consistent with source data that changes?"', a: 'I treat the vector store as a derived index that must stay in lockstep with the source of truth. Every create/update/delete on a document triggers a matching upsert or delete of its chunk vectors, keyed by stable ids like docId#chunkIndex so re-processing overwrites cleanly. I never let deleted content linger — that\'s a top cause of the model citing stale material. And I treat the embedding model as part of the index identity: changing it means re-embedding and re-indexing the whole corpus, since vectors from different models aren\'t comparable.' },
        ] },
        { type: 'usecases', items: [
          { title: 'RAG chatbots over private docs', text: 'The retrieval half of every "chat with your docs" product: chunks are embedded and upserted into a vector DB; each question embeds and queries top-K, filtered to the user\'s allowed documents, then fed to the LLM. Metadata filtering enforces per-user access control at the retrieval layer.' },
          { title: 'Semantic product & content search', text: 'E-commerce and media sites embed catalog items and articles, then serve natural-language search ("cozy waterproof jacket for hiking") as ANN queries. Metadata filters layer in structured constraints — price range, in-stock, category — on top of semantic ranking.' },
          { title: 'Recommendations and "related items"', text: 'Embed users, products, songs, or posts; "more like this" and personalized feeds are top-K nearest-neighbor lookups in a vector DB. Running at Spotify/Amazon scale means billions of vectors and hard latency budgets — exactly what dedicated vector databases are built for.' },
          { title: 'Deduplication and anomaly detection', text: 'Embed incoming support tickets, transactions, or logs and query the store for near-duplicates or nearest known patterns. High similarity flags a duplicate ticket or a known issue; conspicuous distance from all clusters flags an anomaly worth review.' },
        ] },
        { type: 'project', title: 'Build a real semantic search backend on a vector DB', goal: 'Take the in-memory toy from the playground to a real, persistent vector store with metadata filtering — the retrieval spine of a RAG app.', steps: [
          'Pick a store: pgvector if you have Postgres, otherwise Chroma (runs locally, no server). Create a collection/table with an `embedding` column and metadata fields (source, tag, created_at).',
          'Gather ~30 short text chunks across 2–3 topics or "tenants." Embed each with `text-embedding-3-small` and upsert as `{id, vector, text, metadata}`, using stable ids like `docId#chunkIndex`.',
          'Build an HNSW index (pgvector: `CREATE INDEX ... USING hnsw`; Chroma indexes automatically). Confirm a query returns top-K in the expected order.',
          'Write `search(query, k, filter)`: embed the query with the SAME model, run a top-K similarity query with a metadata filter, and print scores + text. Verify a high-scoring chunk from the wrong tag/tenant is correctly excluded.',
          'Simulate a document update: change one chunk\'s text, re-embed, and upsert by the same id. Confirm the old vector is overwritten and stale content no longer appears in results.',
        ], deliverable: 'A `vector_search.py` (or `.js`) that upserts embedded chunks into pgvector/Chroma and runs filtered top-K queries, plus a short note on the recall/speed knob you\'d tune (e.g. ef_search) and why.' },
        { type: 'challenge', title: 'Measure the recall you\'re trading away', text: 'ANN is approximate — quantify it. Take a few thousand vectors, compute the TRUE top-10 for a set of queries with brute force (your O(n) ground truth), then run the same queries through an ANN index (pgvector HNSW, Qdrant, or a library like hnswlib) and measure recall@10: the average fraction of the true top-10 the index actually returned. Then sweep the search-effort knob (ef_search) and plot recall vs. query latency.', hints: [
          'Recall@10 for one query = (# of the true top-10 that appear in the ANN top-10) / 10. Average it across many queries for a stable number.',
          'Your brute-force cosine ranking is the ground truth — the playground\'s `topK` is exactly this, just scale it up to a few thousand vectors.',
          'Sweep ef_search from low to high: you\'ll see recall climb toward 1.0 while latency rises. That curve IS the tradeoff every production RAG system tunes.',
        ] },
        { type: 'reading', links: [
          { label: 'pgvector — official README', url: 'https://github.com/pgvector/pgvector', note: 'The extension\'s docs: vector column types, the distance operators (<=>, <->), and how to build HNSW/IVFFlat indexes in Postgres. The pragmatic starting point.' },
          { label: 'Pinecone — Docs & learning center', url: 'https://docs.pinecone.io/', note: 'Provider-official upsert/query API plus excellent conceptual guides on vector search, metadata filtering, and index tuning that generalize to any vector DB.' },
          { label: 'HNSW explained (Pinecone Learn)', url: 'https://www.pinecone.io/learn/series/faiss/hnsw/', note: 'A clear, visual walkthrough of the Hierarchical Navigable Small World graph — how the layered structure makes approximate nearest neighbor search fast.' },
        ] },
      ],
    },
  ],
}
