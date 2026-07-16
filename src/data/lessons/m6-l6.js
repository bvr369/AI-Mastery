// Lesson 6.6 — Build: Semantic Search for Your Docs

export default {
  sections: [
    {
      id: 'assemble-the-engine',
      title: 'Five lessons, one working engine',
      blocks: [
        { type: 'p', text: "You've now met every part on its own: [[Embedding]]s turn text into vectors (6.1), [[Cosine Similarity]] measures how close two vectors point (6.1), [[Chunking]] cuts documents into retrievable pieces (6.4), and a [[Vector Database]] stores and searches those vectors at scale (6.3, 6.5). This lesson is the assembly: we bolt the parts together into a **working semantic search engine** over a real set of documents, end to end." },
        { type: 'p', text: "This is the half of AI engineering that shows up in almost every interview and almost every product. And it's worth being precise about what we're building: **semantic search is the retrieval half of [[RAG]]**. Everything here — load, chunk, embed, index, query, rank — is the R. Next module we add the G (generation): feed the retrieved chunks to an LLM to write a grounded answer. Build the retriever right and the generator becomes easy; get retrieval wrong and no prompt on earth saves you." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: building a library, then a librarian', text: "Ingestion is building the library — you take a pile of documents, cut them into shelvable pieces (chunks), and file each one by *meaning* rather than by title (embeddings as the catalog). Search is the librarian — someone walks up with a vague question, the librarian understands what they *mean*, and walks straight to the three most relevant passages. The magic isn't the shelves; it's that the filing system is organized by meaning, so a question and its answer end up near each other even when they share no words." },
        { type: 'h', text: 'The contract we\'re fulfilling' },
        { type: 'p', text: "By the end you'll have a `search(query, k)` function that takes a plain-English question and returns the top-`k` most relevant passages — each with its **source metadata** (which file, which section) so results are traceable, not anonymous blobs. That metadata is not a nice-to-have: it's what turns retrieval into *citations* later, and what lets you debug why a bad chunk got returned." },
        { type: 'list', items: [
          "**Ingestion (once per document):** load → chunk → embed in batches → store vectors + metadata in an index.",
          "**Query (every search):** embed the question with the *same* model → compare against every stored vector → return the top-`k` by similarity, with their source.",
          "**The golden rule that ties it together:** documents and queries must be embedded by the **same model**, or their vectors live in incompatible spaces and every score is garbage.",
        ] },
      ],
    },
    {
      id: 'the-pipeline',
      title: 'The pipeline, stage by stage',
      blocks: [
        { type: 'p', text: "Here's the whole thing in one picture. The top row runs once when you ingest documents; the bottom row runs on every query. They meet in the middle — at the index — which is the entire point: you do the expensive work (embedding every chunk) *once*, then every future query is a cheap lookup against what you already computed." },
        { type: 'diagram', id: 'embed-pipeline', caption: 'Ingestion (top) happens once per document; query (bottom) happens every search. They meet at the index. Same embedding model on both paths — non-negotiable.' },
        { type: 'h', text: 'What actually happens at each stage' },
        { type: 'table', headers: ['Stage', 'Input → Output', 'The practical decision'], rows: [
          ['**1. Load**', 'Files → raw text + source info', 'Strip boilerplate (nav, footers), but **keep** the source path and section headings — you\'ll attach them as metadata and need them for citations.'],
          ['**2. Chunk**', 'One document → many chunks', 'Size and overlap (Lesson 6.4). Too big → blurry embeddings; too small → context-starved fragments. 300–800 tokens with light overlap is the usual starting point.'],
          ['**3. Embed**', 'Chunks → vectors', 'Call the embedding model in **batches** (many chunks per request), not one call per chunk. Same model you\'ll use at query time.'],
          ['**4. Store**', 'Vectors + metadata → index', 'Each record = `{ id, vector, text, metadata }`. In-memory array for a prototype; [[Vector Database]] (pgvector, Pinecone) for anything real.'],
          ['**5. Query**', 'Question → question vector', 'Embed the user\'s question with the *same* model. One embedding call per search.'],
          ['**6. Search**', 'Question vector → top-k chunks', 'Rank every stored vector by [[Cosine Similarity]], return the k highest **with their metadata**. This is nearest-neighbor search.'],
        ] },
        { type: 'callout', variant: 'info', title: 'Ingestion is offline; query is online', text: "Stages 1–4 are a batch job you run when documents change — slow, expensive, and that's fine because it's not on the user's critical path. Stages 5–6 run live while a user waits, so they must be fast. This split is *why* embeddings win over asking an LLM \"is this relevant?\" per document: you pay the big cost once, offline, and every query afterward is milliseconds of vector math." },
        { type: 'callout', variant: 'warn', title: 'The #1 rookie bug: model mismatch', text: "Embed your documents with `text-embedding-3-small` and your queries with `text-embedding-3-large` (or a different provider entirely) and everything *runs* — no error — but the scores are meaningless because the two models put meaning in different coordinate systems. If retrieval quality is mysteriously terrible, check this first. Pin the model name and dimensions in one config constant used by both paths." },
      ],
    },
    {
      id: 'search-in-action',
      title: 'Watch the search run',
      blocks: [
        { type: 'p', text: "Before we write it, see it. Below, a set of documents already lives in the index as points in vector space. Type or pick a query and watch it get embedded into the same space, then watch the engine light up the nearest neighbors and rank them. This is stages 5–6 of the pipeline happening in real time." },
        { type: 'demo', id: 'vector-search-viz' },
        { type: 'p', text: "Two things to internalize as you play. First, **the query is just another point** — there's nothing special about it; search is 'find the stored points nearest to this new point.' Second, **the winners often share no keywords with the query**. A question about 'signing in' pulls a chunk about 'authentication.' That's the entire value proposition: you're matching on meaning, and the ranking is pure geometry — cosine similarity, sorted descending, top-k." },
      ],
    },
    {
      id: 'build-it',
      title: 'Build the whole engine (runnable)',
      blocks: [
        { type: 'p', text: "Now the real thing. The playground below is a complete, tiny semantic search engine in ~40 lines: it chunks sample documents, embeds them (with a mock embedder so it runs offline), builds an in-memory index carrying source metadata, and exposes `search(query, k)` that returns ranked chunks with scores *and* their source. Run it, read the ranking, then do the exercise in the caption. This is the actual shape of production code — swap the mock `embed()` for a real API call and the structure doesn't change." },
        { type: 'playground', id: 'tiny-search-engine', title: 'A complete in-memory semantic search engine', height: 620, code: `// ---------- 1. DOCUMENTS (normally loaded from files) ----------
const docs = [
  { source: "billing.md", title: "Refunds",
    text: "You can request a refund within 30 days of purchase. Refunds are issued to the original payment method and take 5 to 10 business days to appear." },
  { source: "account.md", title: "Password reset",
    text: "If you cannot sign in, use the Forgot Password link on the login page. We email a reset link that stays valid for one hour." },
  { source: "account.md", title: "Two-factor auth",
    text: "Enable two-factor authentication in Security settings. You will need an authenticator app to scan the setup QR code." },
  { source: "shipping.md", title: "Delivery times",
    text: "Standard shipping takes 3 to 5 business days. Express shipping arrives next business day if ordered before 2pm." },
]

// ---------- 2. CHUNK (here: one chunk per doc; real docs split further) ----------
// Each chunk keeps its source metadata so results are traceable.
const chunks = docs.map((d, i) => ({
  id: i,
  text: d.text,
  metadata: { source: d.source, section: d.title },
}))

// ---------- 3. EMBED (mock: deterministic bag-of-words vector) ----------
// A REAL app calls an embedding API here. The interface is identical:
//   text in -> fixed-length vector out. We fake it so this runs offline.
const VOCAB = ["refund","payment","days","sign","password","reset","login",
  "email","two","factor","authentication","security","shipping","delivery","express","order"]
function embed(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || []
  return VOCAB.map(term => words.filter(w => w === term || w.startsWith(term)).length)
}

// ---------- 4. INDEX (embed every chunk once, store vector + metadata) ----------
const index = chunks.map(c => ({ ...c, vector: embed(c.text) }))

// ---------- cosine similarity (the ranking function) ----------
const dot  = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a) => Math.sqrt(dot(a, a)) || 1e-9
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))

// ---------- 5 + 6. SEARCH: embed query, rank all vectors, return top-k ----------
function search(query, k = 3) {
  const q = embed(query)                       // SAME embedder as ingestion
  return index
    .map(item => ({
      score: cosine(q, item.vector),
      text: item.text,
      source: item.metadata.source,
      section: item.metadata.section,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

// ---------- try it ----------
const query = "I forgot my login and can't get in"
console.log(\`Query: "\${query}"\\n\`)
for (const r of search(query, 3)) {
  console.log(\`\${r.score.toFixed(3)}  [\${r.source} > \${r.section}]\`)
  console.log(\`        \${r.text.slice(0, 60)}...\\n\`)
}
// Top hit is the password-reset chunk. Our mock matches on the shared
// word "login" — crude, but enough here. A REAL embedder goes further:
// it ranks this #1 even for "can't access my account" (zero shared
// words), because it matches on meaning, not spelling.`, solution: `// SOLUTION: add metadata FILTERING (only search a given source file),
// and return citation-ready results. This is the challenge, generalized.
const docs = [
  { source: "billing.md", title: "Refunds", text: "You can request a refund within 30 days of purchase. Refunds go to the original payment method." },
  { source: "account.md", title: "Password reset", text: "If you cannot sign in, use the Forgot Password link. The reset link stays valid for one hour." },
  { source: "account.md", title: "Two-factor auth", text: "Enable two-factor authentication in Security settings using an authenticator app." },
  { source: "shipping.md", title: "Delivery times", text: "Standard shipping takes 3 to 5 business days. Express arrives next business day." },
]
const chunks = docs.map((d, i) => ({ id: i, text: d.text, metadata: { source: d.source, section: d.title } }))
const VOCAB = ["refund","payment","days","sign","password","reset","login","email","two","factor","authentication","security","shipping","delivery","express","order"]
const embed = (t) => { const w = t.toLowerCase().match(/[a-z]+/g) || []; return VOCAB.map(term => w.filter(x => x === term || x.startsWith(term)).length) }
const index = chunks.map(c => ({ ...c, vector: embed(c.text) }))
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), norm=a=>Math.sqrt(dot(a,a))||1e-9, cosine=(a,b)=>dot(a,b)/(norm(a)*norm(b))

// Now search() accepts an optional metadata filter (e.g. { source: "account.md" }).
function search(query, k = 3, filter = {}) {
  const q = embed(query)
  return index
    .filter(item => Object.entries(filter).every(([key, val]) => item.metadata[key] === val))
    .map(item => ({ score: cosine(q, item.vector), ...item.metadata, text: item.text }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

console.log("Unfiltered — search everything:")
console.log(search("how do I turn on two-factor security", 2))
console.log("\\nFiltered — only account.md:")
console.log(search("how do I turn on two-factor security", 2, { source: "account.md" }))
// Citation-ready: every result carries { source, section } you can render as [account.md > Two-factor auth].`, caption: '**Exercise:** (1) Change `query` and predict the top hit before running. (2) Add a metadata `filter` argument to `search` so you can restrict results to a single `source` file — then return each result as a citation string like `[account.md > Password reset]`. (Solution provided.)' },
        { type: 'h', text: 'The same pipeline in Python, with a real embedding API' },
        { type: 'p', text: "The playground fakes the embedder so it runs in your browser. In production you call a real embedding model and (usually) a real vector store. Here's the identical pipeline in Python — batch-embed the chunks with OpenAI, store them, and search. Notice the structure is *the same six stages*; only `embed()` and the storage change." },
        { type: 'code', lang: 'python', filename: 'search_engine.py', code: `import numpy as np
from openai import OpenAI

client = OpenAI()
MODEL = "text-embedding-3-small"   # ONE constant — used by ingest AND query

# ---------- 1-2. Load + chunk (toy chunker; use a real one in prod) ----------
def chunk(text, size=500, overlap=50):
    words, out, i = text.split(), [], 0
    while i < len(words):
        out.append(" ".join(words[i:i + size]))
        i += size - overlap          # stride = size - overlap
    return out

documents = [
    {"source": "billing.md",  "section": "Refunds",       "text": "Refunds are available within 30 days ..."},
    {"source": "account.md",  "section": "Password reset", "text": "Use the Forgot Password link to sign in ..."},
    {"source": "shipping.md", "section": "Delivery",       "text": "Standard shipping takes 3 to 5 days ..."},
]

# Build chunk records, carrying metadata through.
records = []
for doc in documents:
    for piece in chunk(doc["text"]):
        records.append({"text": piece, "source": doc["source"], "section": doc["section"]})

# ---------- 3. Embed in BATCHES (one API call for many chunks) ----------
def embed(texts):
    resp = client.embeddings.create(model=MODEL, input=texts)
    return np.array([d.embedding for d in resp.data])

# ---------- 4. Index: store vectors alongside their metadata ----------
vectors = embed([r["text"] for r in records])          # one batched call
for r, v in zip(records, vectors):
    r["vector"] = v

# ---------- 5-6. Search: embed query, cosine-rank, return top-k ----------
def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def search(query, k=3, source=None):
    q = embed([query])[0]                              # SAME model as ingest
    pool = [r for r in records if source is None or r["source"] == source]
    ranked = sorted(pool, key=lambda r: cosine(q, r["vector"]), reverse=True)
    return [
        {"score": float(cosine(q, r["vector"])),
         "cite": f"[{r['source']} > {r['section']}]",
         "text": r["text"]}
        for r in ranked[:k]
    ]

for hit in search("I can't log in"):
    print(f"{hit['score']:.3f}  {hit['cite']}")`, caption: 'Same six stages as the playground. Swap the in-memory list for pgvector or Pinecone and only stages 4 and 6 change — the shape holds.' },
        { type: 'code', lang: 'python', filename: 'pgvector_search.py', code: `# The "store" and "search" stages backed by a real vector database (pgvector).
# Ingestion inserts vectors; query uses Postgres to do nearest-neighbor for you.
import psycopg2
from pgvector.psycopg2 import register_vector

conn = psycopg2.connect("postgresql://localhost/mydb")
register_vector(conn)
cur = conn.cursor()

# One-time schema: a table holding the vector + its source metadata.
cur.execute("""
  CREATE TABLE IF NOT EXISTS chunks (
    id       bigserial PRIMARY KEY,
    content  text,
    source   text,
    section  text,
    embedding vector(1536)          -- must match your model's dimensions
  );
""")

# --- INGEST: insert each chunk's vector + metadata (batch in real code) ---
cur.execute(
    "INSERT INTO chunks (content, source, section, embedding) VALUES (%s, %s, %s, %s)",
    (chunk_text, "account.md", "Password reset", query_vector),
)

# --- SEARCH: <=> is cosine distance; ORDER BY ... LIMIT k = top-k retrieval ---
# Optional metadata filter is just a WHERE clause — that's the payoff of pgvector.
cur.execute("""
  SELECT content, source, section, 1 - (embedding <=> %s) AS score
  FROM chunks
  WHERE source = %s
  ORDER BY embedding <=> %s
  LIMIT 3;
""", (query_vector, "account.md", query_vector))

for content, source, section, score in cur.fetchall():
    print(f"{score:.3f}  [{source} > {section}]  {content[:50]}...")`, caption: 'The <=> operator is cosine distance; 1 - distance gives similarity. The vector DB runs the nearest-neighbor search (and metadata filter) for you at scale.' },
        { type: 'callout', variant: 'tip', title: 'Batch your embeddings', text: "Embedding APIs accept an array of inputs per request and are billed per token, not per call. Embedding 1,000 chunks in one-at-a-time calls is 1,000 round trips and dramatically slower than a handful of batched calls of ~100 inputs each. Batch ingestion; the query path embeds just one string (the question), so that stays a single call." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your semantic search returns bizarre, seemingly-random results even though the code runs without errors. You discover documents were embedded with text-embedding-3-small and queries with text-embedding-3-large. What\'s happening?',
            options: [
              'The large model is too accurate and overwhelms the small one',
              'The two models produce vectors in different, incompatible spaces, so cosine scores between them are meaningless',
              'The query vectors have too many dimensions to compare',
              'This is fine; mixing models improves recall',
            ],
            answer: 1,
            explain: 'Every embedding model learns its own coordinate system. A vector from one model and a vector from another aren\'t comparable — cosine similarity between them is noise, even though the math executes fine. Documents and queries must always be embedded by the same model and dimensions. This is the single most common RAG-pipeline bug.',
          },
          {
            q: 'Why is embedding-based semantic search preferred over calling an LLM with "is this document relevant to the query?" for each document at query time?',
            options: [
              'LLMs cannot read documents',
              'Embeddings are always more accurate at judging relevance',
              'Embeddings are computed once per chunk offline and stored; each query is then cheap vector math, instead of an expensive LLM call per document per query',
              'The chat API has no way to compare text',
            ],
            answer: 2,
            explain: 'The pipeline pays the expensive cost (embedding every chunk) once, offline. Every future query is then a fast nearest-neighbor lookup against precomputed vectors. The LLM-per-document approach costs an API call for every (query, document) pair and doesn\'t scale past a handful of documents.',
          },
          {
            q: 'You\'re building the ingestion pipeline and want each search result to be traceable back to where it came from (for citations and debugging). What must you do?',
            options: [
              'Store only the raw vectors; sources can be looked up later by re-embedding',
              'Attach source metadata (file, section) to each chunk record and carry it through storage and retrieval',
              'Use a larger embedding model so it encodes the filename',
              'Return the vector itself as the citation',
            ],
            answer: 1,
            explain: 'A vector on its own is anonymous — you can\'t recover which file or section it came from. You store metadata alongside each vector at ingestion time and return it with each result. That metadata is what enables citations later and lets you debug why a particular chunk was retrieved.',
          },
          {
            q: 'You have 5,000 chunks to embed during ingestion. Which approach is correct and efficient?',
            options: [
              'Call the embedding API 5,000 times, once per chunk',
              'Send the chunks in batches (e.g. 100 inputs per request), since the API accepts arrays and bills per token',
              'Concatenate all 5,000 chunks into one string and embed it once',
              'Embed only the queries; chunks don\'t need embedding',
            ],
            answer: 1,
            explain: 'Embedding APIs accept an array of inputs per call and charge per token, not per request — so batching many chunks per call is far faster (fewer round trips) at the same token cost. Concatenating into one string would produce a single blurry vector for everything (option C is wrong), and you obviously must embed the chunks (D is wrong).',
          },
          {
            q: 'In the pipeline, which stages run once (offline) versus on every user query (online)?',
            options: [
              'Everything runs on every query, for freshness',
              'Load, chunk, embed, and store run once at ingestion; embed-the-query and search run on every query',
              'Only search runs at ingestion; everything else runs per query',
              'Load and chunk run per query; embedding runs once',
            ],
            answer: 1,
            explain: 'Ingestion (load → chunk → embed → store) is a batch job run when documents change — slow and off the critical path. The query path (embed the question → nearest-neighbor search) runs live while the user waits, so it must be fast. This split is exactly why precomputing embeddings wins: expensive work once, cheap lookups forever.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm6-l6-c1', front: 'The six stages of a semantic search pipeline?', back: 'Load → Chunk → Embed → Store (index) — done once at ingestion. Then Embed-the-query → Search (top-k nearest neighbors) — done on every query. They meet at the index.' },
          { id: 'm6-l6-c2', front: 'The one non-negotiable rule tying the pipeline together?', back: 'Documents and queries must be embedded by the SAME model (and dimensions). Different models produce incompatible vector spaces, making similarity scores meaningless.' },
          { id: 'm6-l6-c3', front: 'Why store metadata (source, section) with each vector?', back: 'A vector alone is anonymous. Carrying source metadata through storage and retrieval makes results traceable — enabling citations and letting you debug why a chunk was returned.' },
          { id: 'm6-l6-c4', front: 'Why does precomputed embedding beat "ask an LLM if each doc is relevant"?', back: 'Embed every chunk once, offline, and store it. Each query is then cheap vector math, not an LLM call per (query, document) pair. It scales to thousands of docs; the LLM approach doesn\'t.' },
          { id: 'm6-l6-c5', front: 'How is semantic search related to RAG?', back: 'Semantic search IS the retrieval (R) half of RAG. RAG adds generation (G): feed the retrieved top-k chunks to an LLM to produce a grounded answer. Build retrieval right and generation is easy.' },
          { id: 'm6-l6-c6', front: 'Ingestion vs query: which is offline, which is online?', back: 'Ingestion (load/chunk/embed/store) is an offline batch job, off the user\'s critical path. Query (embed question + nearest-neighbor search) is online and must be fast. Batch-embed on ingest; single embed on query.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Semantic search = the retrieval half of RAG. Six stages: load, chunk, embed, store (once) → embed-query, search (per query).',
          'Ingestion is expensive and offline; query is a cheap online nearest-neighbor lookup against precomputed vectors — that\'s the whole efficiency win.',
          'Non-negotiable: documents and queries must use the SAME embedding model, or the vector spaces don\'t match and scores are noise.',
          'Carry source metadata (file, section) through the whole pipeline so results are traceable and citation-ready.',
          'Batch-embed chunks on ingestion; swap the in-memory index for pgvector/Pinecone when you outgrow a prototype — the six-stage shape never changes.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Mismatched embedding models', text: 'Embedding documents with one model and queries with another (or different dimensions) produces incompatible vectors and meaningless scores — with no error to warn you. Pin the model and dimensions in one config constant shared by both the ingest and query paths.' },
          { title: 'Dropping source metadata', text: 'Storing only vectors and text, with no record of which file/section each chunk came from, leaves you unable to cite sources or debug bad retrievals. Attach metadata at chunk time and return it with every result — it costs nothing and you\'ll need it constantly.' },
          { title: 'Re-embedding documents on every query', text: 'Embedding your corpus inside the request handler defeats the entire architecture — you\'ve turned a cheap lookup into a full ingestion on every search. Embed once, store, and only embed the incoming question at query time.' },
          { title: 'One API call per chunk', text: 'Looping and calling the embedding API once per chunk is needlessly slow — thousands of round trips. The API takes arrays; batch ~100 inputs per request. Same token cost, a fraction of the wall-clock time.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through how you\'d build semantic search over a company\'s documentation."', a: 'Two phases. Ingestion (offline, run when docs change): load the files, chunk each into 300–800-token passages with light overlap, batch-embed the chunks with an embedding model, and store each vector alongside its source metadata in a vector database like pgvector or Pinecone. Query (online, per request): embed the user\'s question with the same model, run an approximate-nearest-neighbor search by cosine similarity to get the top-k chunks, and return them with their sources. That retrieval is also the R in RAG — feed those chunks to an LLM and you have a grounded chatbot.' },
          { q: '"Retrieval quality is bad — the right document exists but never gets retrieved. How do you debug it?"', a: 'I\'d check the pipeline in order. First, model consistency: are documents and queries embedded by the exact same model and dimensions? A mismatch silently ruins everything. Second, chunking: is the answer split across a chunk boundary, or buried in a huge blurry chunk whose embedding averages away the relevant signal? Third, inspect the actual top-k scores for a failing query — if the right chunk scores low, it\'s an embedding/chunking problem; if it scores high but ranks just outside k, raise k or add a reranker. Metadata on each chunk makes this inspection possible.' },
          { q: '"Why embeddings instead of keyword search — and when would you use both?"', a: 'Keyword search fails on vocabulary mismatch: "my card was declined" won\'t match "payment failed." Embeddings match on meaning, so paraphrases retrieve each other. But embeddings can miss exact tokens — error codes, SKUs, proper nouns — where keyword search excels. Production systems often run hybrid search: combine a keyword (BM25) score and a vector-similarity score so you catch both exact matches and semantic paraphrases.' },
          { q: '"How does this relate to RAG, and what\'s left to add?"', a: 'This IS RAG minus the generation. Semantic search retrieves the top-k relevant chunks; RAG then passes those chunks, plus the question, into an LLM prompt so it answers grounded in your documents instead of its parametric memory. Everything I built — the retriever and the source metadata — becomes the context and the citations for the generator. Getting retrieval right is the hard part; generation is mostly prompt assembly on top.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Docs & knowledge-base search', text: 'Product docs, internal wikis, and help centers embed every page section once; a natural-language question retrieves the right passage even with zero keyword overlap — the modern replacement for the old keyword search box.' },
          { title: 'Customer support copilots', text: 'Support tools retrieve the top-k relevant help articles and past tickets for an incoming question, then draft a grounded reply with citations. The retriever built here is the engine underneath.' },
          { title: 'Code and API search', text: 'Search engines over large codebases embed functions and doc comments so developers can ask "where do we validate refunds?" and land on the right file — meaning-based, not grep.' },
          { title: '"Chat with your PDFs" products', text: 'Every upload-and-ask tool chunks and embeds the document on upload, then retrieves the closest chunks per question. It\'s exactly this pipeline with a generation step bolted on top.' },
        ] },
        { type: 'project', title: 'Semantic search over 5 markdown files', goal: 'Build a working retriever that answers plain-English queries over a small document set and returns the top-3 passages with their source.', steps: [
          'Gather ~5 markdown files (your own notes, a project README set, or any docs). Write a loader that reads each file and captures its path and section headings as metadata.',
          'Chunk each file into 300–800-token passages with a small overlap (reuse Lesson 6.4\'s chunker). Keep the source path and section on every chunk.',
          'Batch-embed all chunks with a real embedding model (`text-embedding-3-small`) and store each vector alongside its text and metadata — an in-memory list is fine to start.',
          'Write `search(query, k=3)`: embed the query with the *same* model, cosine-rank every stored vector, and return the top-3 with their score and source.',
          'Test with three queries, at least one sharing no keywords with its best match. Print each result as `score  [file > section]  text…` to confirm sources are traceable.',
        ], deliverable: 'A `search.py` (or `.js`) + a CLI/function that, for any query, prints the top-3 chunks with score and `[source > section]` citation.' },
        { type: 'challenge', title: 'Add metadata filtering and real citations', text: 'Extend your engine so `search(query, k, filter)` can restrict results to a subset of documents by metadata — e.g. only `source == "billing.md"`, or only chunks whose section matches a pattern. Return each result as a citation-ready object carrying the exact source file and section, and render it like a footnote a user could click. This is what separates a toy from a shippable retriever.', hints: [
          'Apply the filter BEFORE ranking (filter the candidate pool, then cosine-sort) so you never waste similarity computation on excluded chunks — and in a real vector DB this becomes a WHERE clause on the metadata columns.',
          'Design the metadata schema up front: at minimum `{ source, section }`, ideally also a stable chunk `id` and maybe a `date` so you can filter by recency later.',
          'A good citation object is `{ source, section, text, score }` — render it as `[billing.md > Refunds]` and keep the score around for debugging why it ranked where it did.',
        ] },
        { type: 'reading', links: [
          { label: 'LlamaIndex: Starter Tutorial', url: 'https://docs.llamaindex.ai/en/stable/getting_started/starter_example/', note: 'The most popular framework for exactly this pipeline — load, index, query — in a few lines. Great for seeing the six stages as production abstractions.' },
          { label: 'pgvector: README & usage', url: 'https://github.com/pgvector/pgvector', note: 'The canonical Postgres vector extension: schema, the <=> distance operators, and indexing. This is the store+search half at real scale, in a database you may already run.' },
          { label: 'OpenAI: Embeddings guide', url: 'https://platform.openai.com/docs/guides/embeddings', note: 'The provider-official how-to for the embed stage: models, dimensions, batching, and computing similarity — the reference for both ingest and query paths.' },
        ] },
      ],
    },
  ],
}
