// Lesson 6.1 — Embedding APIs & What They Encode

export default {
  sections: [
    {
      id: 'from-idea-to-api',
      title: 'From "embeddings exist" to "I called one at 9am"',
      blocks: [
        { type: 'p', text: "Lesson 5.1 gave you the mental model: an [[Embedding]] is a learned vector where similar meanings sit near each other, and [[Cosine Similarity]] measures how aligned two of those arrows are. That was the *why*. This lesson is the *how* — the part you'll actually type into a codebase. By the end you'll know how to turn a pile of text into vectors with one API call, what those vectors do and don't capture, and how to avoid the mistakes that silently wreck a retrieval system." },
        { type: 'p', text: "The good news for a developer who's weak on math: **generating embeddings is just an HTTP call.** You send text, you get back an array of floats. No linear algebra required to *produce* them — the model does that. Your job is to call it correctly, store the results, and understand the vectors well enough to trust (and debug) what your search does." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a barcode scanner for meaning', text: "An embedding model is like a barcode scanner, but instead of reading a printed code it *invents* one for whatever text you feed it. Scan \"I forgot my password\" and it prints a 1536-number barcode. Scan \"I can't log in\" and it prints a *different but nearby* barcode. The scanner never understood English — it just learned to print barcodes that land close together when the meanings are close. Your search engine then just compares barcodes." },
        { type: 'p', text: "Every major provider ships one of these scanners behind an API: OpenAI's `text-embedding-3` family, Cohere's `embed-v3`, Voyage AI's `voyage-3` (popular for code and retrieval), and open models like `nomic-embed-text` or the E5/BGE families you can self-host. They all speak the same shape: **text in, fixed-length float vector out.**" },
      ],
    },
    {
      id: 'the-call',
      title: 'What an embedding API call actually looks like',
      blocks: [
        { type: 'p', text: "Here's the entire interface. You give the API a string (or a list of strings), you name a model, and you get back one vector per input. Each vector is a plain JavaScript-style array of floats — for `text-embedding-3-small` that array has exactly **1536** elements, every time, for every input, whether the text is one word or one thousand words." },
        { type: 'code', lang: 'python', filename: 'embed_call.py', code: `from openai import OpenAI
client = OpenAI()

resp = client.embeddings.create(
    model="text-embedding-3-small",   # 1536 dims; -large is 3072
    input=["I forgot my password", "How do I reset my login?"],
)

vecs = [d.embedding for d in resp.data]   # list of 2 vectors
print(len(vecs), len(vecs[0]))            # -> 2 1536
print(vecs[0][:5])                        # -> [0.021, -0.045, 0.013, ...]
print(resp.usage.total_tokens)            # tokens billed for this call`, caption: 'Text in, fixed-length vector out. The input is a LIST — send many texts per call (batching) to cut latency and cost.' },
        { type: 'code', lang: 'javascript', filename: 'embed_call.js', code: `import OpenAI from "openai";
const client = new OpenAI();

const resp = await client.embeddings.create({
  model: "text-embedding-3-small",
  input: ["I forgot my password", "How do I reset my login?"],
});

const vecs = resp.data.map((d) => d.embedding); // array of 2 vectors
console.log(vecs.length, vecs[0].length);       // -> 2 1536
// Each vec is Array<number> of length 1536 — store these, don't recompute.`, caption: 'The JS SDK mirrors Python exactly. Same request shape across almost every provider.' },
        { type: 'callout', variant: 'info', title: 'Why "fixed-length" is the whole point', text: "A one-word input and a 500-word paragraph both come back as **the same length** vector (e.g. 1536). That's what makes the math possible: you can only compare, average, or index vectors that live in the same-dimensional space. Fixed length is what lets you dump a million wildly different documents into one [[Vector Database]] and compare any query against all of them with the identical dot-product operation." },
        { type: 'h', text: 'Dimensions: what the number 1536 buys you' },
        { type: 'p', text: "The dimension count is the length of every vector the model emits. More dimensions means more room to encode fine-grained distinctions — but also more storage, more memory, and slightly slower similarity math at scale. It's a capacity-vs-cost dial, not a quality-guaranteed one: a well-trained 1024-dim model routinely beats a mediocre 3072-dim one." },
        { type: 'table', headers: ['Model', 'Dimensions', 'Notes'], rows: [
          ['`text-embedding-3-small`', '1536', 'Cheap, strong default. Dimensions shortenable (see below).'],
          ['`text-embedding-3-large`', '3072', 'Higher quality, ~6.5x the price, bigger index.'],
          ['Cohere `embed-v3`', '1024', 'Great multilingual; has input_type for query vs doc.'],
          ['Voyage `voyage-3`', '1024', 'Strong on code + retrieval benchmarks.'],
          ['`nomic-embed-text` (open)', '768', 'Self-hostable, no per-token API cost.'],
        ] },
        { type: 'callout', variant: 'tip', title: 'Matryoshka: you can often shorten the vector', text: "`text-embedding-3` models are trained with **Matryoshka representation learning**, meaning the *front* of the vector holds the most important information. You can pass `dimensions=512` to get a shorter 512-dim vector that keeps most of the quality — smaller index, faster search, lower memory. Just decide once and use the same length everywhere. Truncating an existing full vector yourself works too, but re-normalize afterward." },
      ],
    },
    {
      id: 'what-they-encode',
      title: 'What embeddings capture — and what they quietly miss',
      blocks: [
        { type: 'p', text: "This is the section that separates engineers who ship reliable search from those who file confused bug reports. Embeddings are astonishing at *meaning* and genuinely bad at a few specific things. Knowing the failure modes up front tells you when to reach for embeddings, when to add keyword search, and why your \"smart search\" sometimes returns nonsense." },
        { type: 'h', text: 'What they capture well' },
        { type: 'list', items: [
          "**Semantics and intent.** \"My card was declined\" and \"payment failed at checkout\" land close together despite zero shared words. This is the superpower.",
          "**Paraphrase and synonymy.** Different wording, same idea → nearby vectors. You get synonym handling for free, without maintaining a synonym list.",
          "**Topic and domain.** Text about databases clusters away from text about baking. Great for routing, deduplication, and \"more like this.\"",
          "**Some structure and sentiment.** A furious review and a delighted one separate; a question and a statement can differ in the geometry.",
        ] },
        { type: 'h', text: 'What they miss or blur' },
        { type: 'list', items: [
          "**Exact IDs, codes, SKUs, order numbers.** `INV-4471` and `INV-4470` mean totally different things to a human but embed almost identically — the model sees \"an invoice code,\" not the precise digits. Embeddings are the wrong tool for exact-match lookups.",
          "**Numbers and quantities.** \"$50\" vs \"$500\", \"2019\" vs \"2021\" — magnitude and precise values get blurred. Don't rely on embeddings to distinguish \"under 10mg\" from \"under 100mg.\"",
          "**Negation and fine detail.** \"The drug is safe\" and \"the drug is not safe\" can sit uncomfortably close, because most of the words match. Embeddings compress; nuance is what gets compressed.",
          "**Out-of-domain jargon.** A general-purpose model under-separates specialized text (legal clauses, genomics, internal product names) it saw little of in training. Domain-tuned models or fine-tuning help.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a thumbnail of the text', text: "An embedding is like a thumbnail image of a document. Squint and you can tell a beach photo from a spreadsheet — the *gist* survives shrinking beautifully. But you can't read the license plate in a thumbnail. Exact IDs, precise numbers, and single-word negations are the license plates: real information that the compression throws away. For those, you need the full-resolution original — i.e. keyword or exact match." },
        { type: 'callout', variant: 'warn', title: 'The negation trap in production', text: "This bites RAG systems constantly. A user asks \"which plans do NOT include support?\" and retrieval happily returns the chunk about plans that *do* include support, because it's lexically almost identical. Embeddings alone can't be trusted on negation. Mitigations: hybrid search (keywords catch the polarity words), a reranker (Lesson 6.x), or letting the LLM read enough surrounding context to sort it out." },
        { type: 'p', text: "The practical takeaway: **embeddings for meaning, keywords for exactness.** Most serious retrieval systems run *both* (hybrid search) and combine the scores — embeddings catch the paraphrases, keyword/BM25 catches the order numbers and error codes. You'll build toward that in this module." },
      ],
    },
    {
      id: 'pipeline',
      title: 'The ingestion pipeline: docs → chunk → embed → store',
      blocks: [
        { type: 'p', text: "Zoom out from the single API call to the system it lives in. Every semantic-search and RAG product runs the same four-stage **ingestion pipeline** to get documents ready for retrieval. Burn this picture into memory — the rest of Module 6 is just filling in each box." },
        { type: 'diagram', id: 'embed-pipeline', caption: 'The ingestion pipeline. Raw documents are split into chunks, each chunk is embedded once, and the vectors are stored in a vector database for fast nearest-neighbor search.' },
        { type: 'list', items: [
          "**Docs** — your raw source material: PDFs, help articles, Notion pages, code, transcripts. Loaded and cleaned into plain text.",
          "**[[Chunking]]** — split each document into bite-sized pieces (a few hundred tokens each). You embed *chunks*, not whole documents, so retrieval can pull the exact relevant passage. (Whole lesson coming — chunking strategy makes or breaks RAG.)",
          "**Embed** — run every chunk through the embedding API, in batches, to get one vector per chunk. This is the call you just learned.",
          "**Store** — write each vector (plus its source text and metadata) into a [[Vector Database]] like pgvector, Pinecone, Qdrant, or Weaviate, indexed for fast approximate-nearest-neighbor lookup.",
        ] },
        { type: 'callout', variant: 'warn', title: 'The rule that breaks the most systems: same model, both sides', text: "You must embed your **documents** and your **queries** with the **same model and version**. Vectors from `text-embedding-3-small` and `text-embedding-3-large` live in different, incompatible coordinate spaces — cosine between them is meaningless noise. If you re-index with a new model, you must re-embed *everything*, including refusing to compare old vectors against new query vectors. Pin the model name in config and treat changing it like a database migration." },
        { type: 'callout', variant: 'info', title: 'Some models want to know: query or document?', text: "Cohere and Voyage let you pass an `input_type` (`search_query` vs `search_document`), and instruction-tuned open models (E5, BGE) expect a prefix like `query:` or `passage:`. This is *not* the same as \"using different models\" — it's one model told which role the text plays, which measurably improves retrieval. OpenAI's models don't need it. Read your provider's docs and be consistent." },
      ],
    },
    {
      id: 'cost-and-normalize',
      title: 'Cost, batching, and normalization — the operational details',
      blocks: [
        { type: 'p', text: "Two things trip up first-time embedders in production: how much this costs (spoiler: almost nothing) and whether to normalize (spoiler: usually already done for you). Let's make both concrete." },
        { type: 'h', text: 'Cost: embeddings are the cheapest call in your stack' },
        { type: 'p', text: "Embeddings are billed per input token, and they're *dramatically* cheaper than chat completions. `text-embedding-3-small` is on the order of **$0.02 per million tokens** — roughly a few cents to embed an entire book. You embed each document **once** at ingestion time; after that, every search is pure vector math with no API cost. Queries are tiny (a sentence), so query-time embedding cost rounds to zero." },
        { type: 'callout', variant: 'tip', title: 'Batch your inputs', text: "The `input` field takes a **list**. Sending 100 chunks in one request is far faster and cheaper (in overhead) than 100 separate requests. Providers cap the batch size and total tokens per request (e.g. up to ~2048 inputs for OpenAI), so chunk your ingestion into batches, respect rate limits, and retry on 429s. This is the single biggest speed win when indexing a large corpus." },
        { type: 'h', text: 'Normalization: making cosine cheap' },
        { type: 'p', text: "Recall from 5.1: if vectors are **normalized to length 1**, cosine similarity equals the plain dot product — so vector databases can skip the division and run raw, hardware-optimized dot products. OpenAI's embeddings come back **already normalized** to unit length, so you can dot-product them directly. Not every provider does; when in doubt, normalize once at ingestion and you're safe." },
        { type: 'code', lang: 'python', filename: 'normalize.py', code: `import numpy as np

def normalize(v):
    v = np.asarray(v, dtype=np.float32)
    n = np.linalg.norm(v)
    return v / n if n > 0 else v   # guard the zero vector

# After normalizing, cosine(a, b) == dot(a, b):
a = normalize(vec_a)
b = normalize(vec_b)
similarity = float(np.dot(a, b))   # no division needed anymore

# Bonus: store float32 (or smaller) — full float64 wastes memory at scale.`, caption: 'Normalize once at ingestion so every future comparison is a cheap dot product. Guard against the zero vector.' },
        { type: 'callout', variant: 'warn', title: "Don't mix normalized and raw vectors", text: "If half your index is unit-length and half isn't, your rankings are silently corrupted — the raw vectors' magnitudes leak into the scores. Pick one convention (normalize everything is the safe default), apply it to documents and queries alike, and never mix. This is a top source of \"why is my search subtly wrong?\" bugs." },
      ],
    },
    {
      id: 'try-it',
      title: 'Try it: rank sentences by meaning',
      blocks: [
        { type: 'p', text: "Before you write code, build the intuition with the interactive below. Type two sentences and watch their cosine similarity update live — try a pair that shares words but differs in meaning, then a pair that shares *no* words but means the same thing. That second case is the entire reason embeddings beat keyword search." },
        { type: 'demo', id: 'cosine-playground' },
        { type: 'p', text: "Now make it runnable. The playground below *mock-embeds* a handful of sentences into small vectors, then ranks them against a query by real cosine similarity — the exact algorithm the ingestion pipeline uses, just with toy vectors so it runs offline. Read the ranking, then do the exercise in the caption." },
        { type: 'playground', id: 'semantic-rank', title: 'Rank sentences by cosine similarity to a query', height: 520, code: `// A tiny "semantic dictionary". In production these vectors would come
// from an embedding API (1536 dims). Here they're hand-made 5-D vectors.
// Axes (loosely): [auth/login, payment/billing, shipping, food, weather]
const docs = {
  "I can't log into my account":        [0.95, 0.05, 0.0, 0.0, 0.0],
  "How do I reset my password?":        [0.90, 0.10, 0.0, 0.0, 0.0],
  "My card was declined at checkout":   [0.05, 0.95, 0.0, 0.0, 0.0],
  "When will my order arrive?":         [0.0, 0.10, 0.92, 0.0, 0.0],
  "The pasta recipe needs more salt":   [0.0, 0.0, 0.0, 0.97, 0.05],
  "Is it going to rain tomorrow?":      [0.0, 0.0, 0.0, 0.05, 0.96],
}

// --- real cosine similarity over these vectors ---
const dot   = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm  = (a) => Math.sqrt(dot(a, a))
const cosim = (a, b) => dot(a, b) / (norm(a) * norm(b))

// Rank every doc against a query vector, best match first.
function rank(queryVec) {
  return Object.entries(docs)
    .map(([text, v]) => ({ text, score: cosim(queryVec, v) }))
    .sort((a, b) => b.score - a.score)
}

// Query: "I forgot my login" — note it shares NO words with the top doc.
const query = [0.93, 0.08, 0.0, 0.0, 0.0]
console.log("Query: 'I forgot my login'\\n")
for (const { text, score } of rank(query)) {
  console.log(score.toFixed(3) + "  " + text)
}`, solution: `// SOLUTION: wrap it into a reusable search() that returns top-k,
// and try a query on a totally different topic.
const docs = {
  "I can't log into my account":      [0.95,0.05,0,0,0],
  "How do I reset my password?":      [0.90,0.10,0,0,0],
  "My card was declined at checkout": [0.05,0.95,0,0,0],
  "When will my order arrive?":       [0,0.10,0.92,0,0],
  "The pasta recipe needs more salt": [0,0,0,0.97,0.05],
  "Is it going to rain tomorrow?":    [0,0,0,0.05,0.96],
}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0)
const norm=(a)=>Math.sqrt(dot(a,a))
const cosim=(a,b)=>dot(a,b)/(norm(a)*norm(b))

function search(queryVec, k = 2) {
  return Object.entries(docs)
    .map(([text, v]) => ({ text, score: +cosim(queryVec, v).toFixed(3) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

console.log("Billing query:", search([0.02, 0.98, 0, 0, 0]))
console.log("Weather query:", search([0, 0, 0, 0.02, 0.99]))
// The right topic wins each time — nearest-neighbor search in miniature.`, caption: '**Exercise:** the top result shares no keywords with the query, yet ranks #1 — that\'s semantic search. Now write `search(queryVec, k)` returning the top-k, and test it with a billing-topic query. (Solution provided.)' },
        { type: 'h', text: 'The real thing: an embedding API + similarity' },
        { type: 'p', text: "Swap the toy vectors for a real embedding API and the code barely changes — `numpy` does the arithmetic. This is a complete, if minimal, semantic-search backend: embed the docs once, embed the query, rank by cosine." },
        { type: 'code', lang: 'python', filename: 'semantic_search.py', code: `import numpy as np
from openai import OpenAI
client = OpenAI()

def embed(texts):
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in resp.data])  # (n, 1536)

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

docs = [
    "How to reset your password",
    "Our refund and return policy",
    "Setting up two-factor authentication",
]
doc_vecs = embed(docs)                                  # embed ONCE, then store

q = embed(["I can't get into my account"])[0]           # same model!
scores = [cosine(q, d) for d in doc_vecs]
for score, doc in sorted(zip(scores, docs), reverse=True):
    print(f"{score:.3f}  {doc}")

# Top hit: the password/2FA docs — despite no shared keywords with the query.`, caption: 'Same cosine idea as the playground, real vectors. Notice: docs embedded once, query embedded with the SAME model.' },
        { type: 'callout', variant: 'tip', title: 'In real life, you skip the manual cosine loop', text: "Computing cosine against every document in a Python loop is fine for a demo and hopeless for a million docs. In production you push the vectors into a [[Vector Database]] (pgvector, Pinecone, Qdrant) that runs **approximate nearest-neighbor** search — sub-linear time to find the top-k without scoring everything. Same math, industrial-strength index. That's the next lessons." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'You embedded your documents last month with `text-embedding-3-small`. Today you switch your query embedding to `text-embedding-3-large` because it "scored higher on benchmarks." Retrieval quality collapses to near-random. Why?',
            options: [
              'The large model is actually worse at retrieval',
              'Query and document vectors now come from different models, so they live in incompatible spaces and cosine between them is meaningless',
              'The large model returns fewer dimensions',
              'You forgot to raise the temperature',
            ],
            answer: 1,
            explain: 'Embeddings from different models occupy different coordinate systems — their axes mean different things. Comparing a -large query vector against -small document vectors produces noise. The fix is to embed both sides with the same model and version; changing the model means re-embedding the entire corpus.',
          },
          {
            q: 'A legal-search RAG app keeps failing on queries like "clauses that do NOT permit assignment" — it returns clauses that DO permit assignment. What is the root cause?',
            options: [
              'Embeddings blur negation: "do permit" and "do not permit" share almost all their words, so their vectors sit very close',
              'The embedding model has a bug and should be reported',
              'The vector database index is corrupted',
              'The documents were embedded twice',
            ],
            answer: 0,
            explain: 'Negation is a classic embedding weakness. The polarity word ("not") is a tiny lexical change against otherwise near-identical text, so cosine similarity barely moves. Mitigations: hybrid search (keywords catch "not"), a reranker, or giving the LLM enough context to reason about polarity.',
          },
          {
            q: 'Your team wants to use embeddings to look up records by exact order number like "ORD-88231". It works ~40% of the time. What should you tell them?',
            options: [
              'Increase the embedding dimensions to 3072 and it will work',
              'Normalize the vectors and the IDs will match exactly',
              'Embeddings blur exact IDs and numbers — use exact/keyword match for order numbers, not semantic similarity',
              'Switch to a multilingual model',
            ],
            answer: 2,
            explain: 'Embeddings capture "this is an order code," not the precise digits, so "ORD-88231" and "ORD-88232" embed almost identically. Exact identifiers belong in a keyword/exact-match index or a plain database lookup. This is why production systems use hybrid search: semantics for meaning, keywords for exactness.',
          },
          {
            q: 'What is the practical benefit of an embedding model returning vectors that are already normalized to unit length?',
            options: [
              'The vectors capture more meaning',
              'The API call becomes cheaper per token',
              'It allows comparing vectors from different models',
              'Cosine similarity reduces to a plain dot product, so vector databases can run faster hardware-optimized comparisons',
            ],
            answer: 3,
            explain: 'For unit-length vectors the norms in the cosine denominator are both 1, so cosine similarity equals the raw dot product. That lets vector databases skip the division and run pure dot products at scale. It does NOT let you compare across models — that space-mismatch problem is separate.',
          },
          {
            q: 'You need to embed 50,000 document chunks for ingestion. Which approach is correct and efficient?',
            options: [
              'Send one API request per chunk (50,000 requests) to be safe',
              'Embed the whole corpus as a single giant string in one request',
              'Send chunks in batches (many texts per request), respecting the provider batch/token limits and retrying on rate limits',
              'Embed each chunk twice and average the results for accuracy',
            ],
            answer: 2,
            explain: 'The `input` field accepts a list, so batching many chunks per request slashes overhead and latency versus one-request-per-chunk. You can\'t jam everything into one string (you\'d lose per-chunk vectors and blow the token cap), and double-embedding wastes money. Batch within the provider\'s limits and handle 429s with retries.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm6-l1-c1', front: 'What does an embedding API take in and return?', back: 'Text in (a string or list of strings) → a fixed-length float vector out, one per input. Length is constant per model (e.g. 1536 for text-embedding-3-small) regardless of input length.' },
          { id: 'm6-l1-c2', front: 'Why must docs and queries use the same embedding model?', back: 'Different models produce vectors in incompatible coordinate spaces — cosine between them is meaningless. Changing the model means re-embedding the entire corpus. Pin the model in config.' },
          { id: 'm6-l1-c3', front: 'What do embeddings capture well, and what do they miss?', back: 'Capture: meaning, paraphrase/synonymy, topic, sentiment. Miss/blur: exact IDs & codes, precise numbers, negation ("not"), and out-of-domain jargon. Use keywords for the exact stuff.' },
          { id: 'm6-l1-c4', front: 'The four stages of the ingestion pipeline?', back: 'Docs → Chunk → Embed → Store. Split documents into chunks, embed each chunk once (batched), and write the vectors + metadata into a vector database for nearest-neighbor search.' },
          { id: 'm6-l1-c5', front: 'How cheap are embeddings, and how do you keep them cheap?', back: 'Billed per input token — around $0.02 per million tokens for a small model (cents for a whole book). Embed each doc once at ingestion; batch inputs per request; queries are tiny so their cost is negligible.' },
          { id: 'm6-l1-c6', front: 'Why normalize embeddings to unit length?', back: 'For unit-length vectors, cosine similarity equals the plain dot product, so DBs run faster dot products. OpenAI already normalizes; when unsure, normalize once at ingestion. Never mix normalized and raw vectors.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Generating embeddings is one HTTP call: text in, fixed-length float vector out — the model does all the math for you.',
          'Fixed length is what makes indexing and comparison possible; dimensions (768–3072) trade capacity against storage and speed.',
          'Embeddings capture meaning, paraphrase, and topic — but blur exact IDs, precise numbers, and negation. Pair them with keyword search for exactness.',
          'The ingestion pipeline is docs → chunk → embed → store; you MUST embed documents and queries with the same model and version.',
          'Embeddings are extremely cheap; batch inputs at ingestion, embed once, and normalize so cosine becomes a fast dot product.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Changing the embedding model without re-indexing', text: 'Swapping models (even -small to -large of the same family) puts your queries in a different space from your stored documents. Cosine becomes noise and retrieval silently degrades. Treat a model change as a full re-embed migration, and pin the model name in config.' },
          { title: 'Using embeddings for exact-match lookups', text: 'Order numbers, SKUs, error codes, and precise figures embed almost identically to their neighbors. If users search by exact identifier, route that to a keyword/DB lookup — embeddings are for meaning, not precision.' },
          { title: 'Ignoring negation in retrieval', text: '"Includes support" and "does not include support" sit close in embedding space. If your domain hinges on polarity, add hybrid search or a reranker and let the LLM see enough context — never trust raw semantic similarity to respect "not".' },
          { title: 'Mixing normalized and unnormalized vectors', text: 'A half-normalized index leaks magnitude into your scores and corrupts rankings in ways that are maddening to debug. Pick one convention (normalize everything is safe) and apply it identically to documents and queries.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through how you\'d generate embeddings for a knowledge base and what the vectors capture."', a: 'I\'d load and clean the source docs, chunk them into a few-hundred-token pieces, then call an embedding API (e.g. text-embedding-3-small) in batches — one vector per chunk, fixed length like 1536 — and store those vectors plus metadata in a vector DB. The vectors capture semantics: paraphrases and synonyms of a chunk land nearby, so a query retrieves meaning-matched passages even with no shared keywords. The critical rule is embedding queries with the exact same model, since vectors from different models aren\'t comparable.' },
          { q: '"When would embeddings be the WRONG tool, and what do you do instead?"', a: 'When the task hinges on exactness — order numbers, SKUs, error codes, precise numeric thresholds — or on negation, because embeddings blur those. "INV-4470" and "INV-4471" embed almost identically, and "is safe" sits near "is not safe." For those cases I use keyword/BM25 or exact DB lookups, and in practice I run hybrid search: embeddings for paraphrase and intent, keywords to nail the literal tokens, then combine the scores or add a reranker.' },
          { q: '"How do you keep embedding costs and latency under control at scale?"', a: 'Embeddings are billed per token and are very cheap — pennies to embed a whole book — and each document is embedded only once at ingestion, so ongoing cost is basically just tiny query embeddings. The main lever is batching: send many chunks per API request rather than one at a time, respect the provider\'s batch and token limits, and retry on rate limits. I also normalize vectors once so similarity is a fast dot product, and store them as float32 to save memory in the index.' },
          { q: '"What does the dimension count (e.g. 1536) actually mean, and does bigger always help?"', a: 'It\'s the fixed length of every vector the model outputs — its capacity to encode distinctions. More dimensions can capture finer nuance but cost more storage, memory, and compute per comparison, and a well-trained smaller model often beats a mediocre larger one. Some models (text-embedding-3) use Matryoshka training so you can safely shorten the vector to trade a little quality for a smaller, faster index. I pick based on retrieval benchmarks like MTEB and my latency/cost budget, not on the dimension number alone.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Chat-with-your-docs ingestion', text: 'Every "upload your PDFs and ask questions" product runs this exact pipeline: chunk the files, embed each chunk once via an API, store the vectors, then retrieve the closest chunks per question to feed the LLM.' },
          { title: 'Semantic product & content search', text: 'E-commerce and media sites embed product descriptions or articles so a natural-language query ("cozy waterproof jacket for hiking") retrieves items that never contain those exact words.' },
          { title: 'Support ticket routing & dedup', text: 'Incoming tickets are embedded and compared to known issues; near-duplicate vectors auto-group related tickets and route them to the right team without manual tagging.' },
          { title: 'Recommendations / "related items"', text: 'Embed every article, song, or repo once; "more like this" is a nearest-neighbor query in embedding space — the same API call powering search also powers recommendations.' },
        ] },
        { type: 'project', title: 'Build a tiny semantic dictionary', goal: 'Generate real (or mock) embeddings for a small sentence set and return the most similar sentence to any query — meaning-based lookup end to end.', steps: [
          'Pick ~8 short sentences spanning 3 themes (e.g. login/auth, billing, shipping). These are your "documents."',
          'Embed all 8 in ONE batched API call to `text-embedding-3-small` (or reuse the playground\'s toy-vector approach to stay fully offline).',
          'Write `cosine(a, b)` (or normalize once and use a dot product), then a `search(query, k)` that embeds the query with the SAME model and returns the top-k sentences by score.',
          'Test with a query that shares NO words with its best match (e.g. "I can\'t get into my account" against "reset your password") and confirm meaning wins over keywords.',
          'Add one deliberately tricky query — an exact ID or a negation — and observe it fail. Note in a comment why, and what you\'d add (keyword/hybrid) to fix it.',
        ], deliverable: 'A `semantic_dictionary.py` (or `.js`) that prints ranked results for 3 queries, including one keyword-free hit and one failure case that motivates hybrid search.' },
        { type: 'challenge', title: 'Beat keyword search with embeddings', text: 'Find two sentences that share NO words at all yet mean nearly the same thing, and prove that embeddings rank them as highly similar while a keyword search would score them zero. Then find the opposite: two sentences that share most words but mean opposite things (a negation pair), and show embeddings wrongly rank them as similar.', hints: [
          'For the positive case, try pairs like "my card was declined" / "the payment did not go through" — real embeddings should score these high despite zero shared content words.',
          'For the failure case, use a negation: "the room was clean" vs "the room was not clean" — measure the cosine and notice how close it stays.',
          'Quantify it: print the cosine similarity for each pair AND a simple keyword-overlap count (shared words / total). The gap between the two metrics is the whole argument for semantic search — and the negation pair is the argument for hybrid.',
        ] },
        { type: 'reading', links: [
          { label: 'OpenAI: Embeddings guide', url: 'https://platform.openai.com/docs/guides/embeddings', note: 'The provider-official reference: models, dimensions (including shortening), the API shape, and similarity code.' },
          { label: 'Cohere: Introduction to Text Embeddings', url: 'https://docs.cohere.com/docs/embeddings', note: 'A clear developer walkthrough including input_type (query vs document) and multilingual embeddings.' },
          { label: 'MTEB: Massive Text Embedding Benchmark (leaderboard)', url: 'https://huggingface.co/spaces/mteb/leaderboard', note: 'How to actually choose a model: compare embedding models across retrieval and other tasks instead of guessing by dimension count.' },
        ] },
      ],
    },
  ],
}
