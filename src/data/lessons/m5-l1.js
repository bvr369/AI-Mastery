// Lesson 5.1 — Embeddings: How Meaning Becomes Numbers

export default {
  sections: [
    {
      id: 'meaning-as-numbers',
      title: 'The oldest trick in AI: turn meaning into coordinates',
      blocks: [
        { type: 'p', text: "Computers can't compare *meanings* — they compare *numbers*. So the first thing every model does with your text is quietly convert it into a list of numbers. That list is an [[Embedding]], and understanding it is the key that unlocks Module 6 (semantic search), RAG, recommendations, and half of what makes AI products feel smart." },
        { type: 'p', text: "The idea: every [[Token]] (from Lesson 1.2) maps to a **vector** — an ordered list of numbers like `[0.12, -0.44, 0.98, ...]`. Not a random list. A *learned* one, arranged so that **things with similar meaning land near each other** in space. `cat` and `kitten` end up as neighbors; `cat` and `spreadsheet` end up far apart. Meaning becomes geometry." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a map of a city you can\'t see', text: "Imagine a giant map where every word is a pin. You never see the map directly, but the model learned to place the pins so related things cluster: all the fruits in one neighborhood, all the emotions in another, formal words uptown and slang downtown. \"Distance on this map\" *means* \"difference in meaning.\" An embedding is just the (x, y, z, …) coordinates of one pin." },
        { type: 'p', text: "You already have the mental model for this. A hex color `#3b82f6` is three numbers `(59, 130, 246)` — a point in 3D color space, and *nearby points look like similar blues*. An embedding is the same move, applied to meaning instead of color, with hundreds of dimensions instead of three." },
        { type: 'diagram', id: 'word-to-vector', caption: 'A word goes in; a fixed-length vector comes out. The numbers are learned so that closeness in this space = closeness in meaning.' },
        { type: 'h', text: 'Why this is the foundation of everything downstream' },
        { type: 'list', items: [
          "**Search stops being about keywords.** \"How do I reset my password\" and \"I forgot my login\" share almost no words but sit close in embedding space. Nearest-neighbor over embeddings finds the second when you search the first — that's semantic search.",
          "**Meaning becomes math.** Once text is a vector, you can measure similarity, cluster, rank, and average it. All the linear-algebra machinery suddenly applies to language.",
          "**It's the bridge to RAG.** Retrieval-Augmented Generation (Module 6) works by embedding your documents *and* the user's question, then pulling the closest chunks to stuff into the prompt. No embeddings, no RAG.",
        ] },
      ],
    },
    {
      id: 'dimensions-and-geometry',
      title: 'Hundreds of dimensions, one intuition',
      blocks: [
        { type: 'p', text: "Real embeddings are *big*. OpenAI's `text-embedding-3-small` outputs **1536** numbers per input; larger models hit 3072+. You can't picture 1536-dimensional space, and you don't need to — the intuition survives the squeeze down to 2D. That's the whole trick behind the map you're about to play with." },
        { type: 'callout', variant: 'info', title: 'What are the dimensions?', text: "Each dimension is a learned *direction* in meaning-space. No one hand-labels them, but after training some directions end up roughly tracking human-readable ideas — a \"royalty\" direction, a \"plural\" direction, a \"gender\" direction. The model discovers whatever axes best explain how words are used. Most dimensions aren't cleanly interpretable, and that's fine: the geometry as a whole is what carries the meaning." },
        { type: 'p', text: "The most famous consequence: **meaning has arithmetic**. Because directions encode concepts, you can do algebra on words. Take the vector for `king`, subtract `man`, add `woman`, and the nearest pin to where you land is… `queen`. You subtracted \"male royalty,\" then added \"female,\" and the geometry carried you to the right place." },
        { type: 'code', lang: 'python', filename: 'analogy.py', code: `# The canonical demo (Word2Vec, 2013) — meaning as vector algebra
# vec[...] is the learned embedding for each word.

result = vec["king"] - vec["man"] + vec["woman"]

# Find the real word whose vector is closest to 'result':
nearest(result)   # -> "queen"

# Same geometry, different axis:
vec["paris"] - vec["france"] + vec["japan"]   # -> "tokyo"
vec["walking"] - vec["walk"] + vec["swim"]    # -> "swimming"` , caption: 'These analogies were not programmed. They fall out of the geometry the model learned from raw text.' },
        { type: 'callout', variant: 'warn', title: 'Don\'t oversell the magic', text: "\"king − man + woman = queen\" is a real, reproducible effect — but it's cleaner in cherry-picked examples than in general. Real embedding spaces are messy; not every analogy resolves this neatly. Treat it as *intuition for why the geometry is meaningful*, not a guaranteed operation you'd ship. The reliable, production-grade use is similarity, which is next." },
      ],
    },
    {
      id: 'the-map',
      title: 'Play with the map (the whole lesson in one demo)',
      blocks: [
        { type: 'p', text: "This is the centerpiece. Below is a 2D projection of a real embedding space. **Click any word** to light up its nearest neighbors — watch how the clusters make semantic sense. Then try the **analogy arithmetic** panel: pick `king − man + woman` and see the arrow land near `queen`. Spend real time here; everything else in this lesson is footnotes to this picture." },
        { type: 'demo', id: 'embedding-map' },
        { type: 'p', text: "Two things to notice as you poke at it. First, **neighbors are about meaning, not spelling** — `dog` sits by `puppy` and `cat`, nowhere near `dogma`. Second, **the analogy arrows are roughly parallel**: the arrow from `man`→`woman` looks a lot like `king`→`queen`. That parallelism *is* the \"gender direction\" made visible. When two relationships share a direction, the model has learned a reusable concept." },
        { type: 'callout', variant: 'tip', text: "What you see in 2D is a lossy shadow (via a technique like t-SNE or UMAP) of a 1536-D space — some neighbors get distorted by the flattening. The real space is cleaner, not messier. The map is for your intuition; the actual math always runs on the full-dimension vectors." },
      ],
    },
    {
      id: 'cosine-similarity',
      title: 'Cosine similarity: how aligned are two arrows?',
      blocks: [
        { type: 'p', text: "So embeddings put related things near each other. How do you *measure* \"near\" in code? The industry-standard answer is [[Cosine Similarity]], and despite the intimidating name, it's a one-liner you can hold in your head." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: two arrows from the same origin', text: "Picture each embedding as an arrow pointing out from the center of the map. Cosine similarity asks one question: **do these two arrows point the same way?** Same direction → similarity ≈ 1 (very related). Perpendicular → ≈ 0 (unrelated). Opposite → ≈ −1 (opposite meaning). It measures *direction*, deliberately ignoring how long the arrows are — because in meaning-space, which way you point matters, not how far." },
        { type: 'p', text: "Mechanically it's the **dot product of the two vectors, divided by their lengths** — i.e. the dot product of their *directions*. That's it. The dot product alone rewards vectors that are large; dividing by the lengths cancels that out so you're comparing pure orientation." },
        { type: 'code', lang: 'javascript', filename: 'cosine.js', code: `// Cosine similarity in 4 lines — the entire similarity engine of a search app.
function dot(a, b)  { return a.reduce((s, x, i) => s + x * b[i], 0) }
function norm(a)    { return Math.sqrt(dot(a, a)) }        // length of the arrow
function cosine(a, b) {
  return dot(a, b) / (norm(a) * norm(b))                   // dot of directions
}

cosine([1, 0], [1, 0])    // 1    — identical direction
cosine([1, 0], [0, 1])    // 0    — perpendicular / unrelated
cosine([1, 0], [-1, 0])   // -1   — opposite
cosine([2, 1], [4, 2])    // 1    — same direction, different length: still 1`, caption: 'Note the last line: length is ignored on purpose. Only the angle between the arrows counts.' },
        { type: 'callout', variant: 'info', title: 'Why cosine and not plain distance?', text: "Straight-line (Euclidean) distance also works and is common. Cosine is usually preferred for text because it's unaffected by vector magnitude — a long document and a short one about the *same* topic point the same way even if one arrow is \"bigger.\" Handy fact: if you **normalize** vectors to length 1 first (many embedding APIs already do), cosine similarity and dot product become the *same number*, which is why fast vector databases just use dot products." },
      ],
    },
    {
      id: 'in-code',
      title: 'Build a similarity ranker (runnable)',
      blocks: [
        { type: 'p', text: "Time to make it real. Below is a working cosine-similarity ranker: a handful of words as tiny hand-made vectors, a query, and a ranking by similarity. This is the exact algorithm behind semantic search — just with 3-D toy vectors instead of 1536-D real ones. Run it, read the ranking, then do the exercise in the caption." },
        { type: 'playground', id: 'cosine-ranker', title: 'Rank words by similarity to a query', height: 460, code: `// Tiny 3-D "embeddings". Axes (loosely): [animal-ness, tech-ness, royalty-ness]
const vectors = {
  cat:     [0.9, 0.1, 0.0],
  kitten:  [0.85, 0.05, 0.0],
  dog:     [0.88, 0.12, 0.0],
  laptop:  [0.0, 0.95, 0.05],
  server:  [0.05, 0.9, 0.0],
  king:    [0.1, 0.0, 0.95],
  queen:   [0.12, 0.0, 0.93],
}

// --- cosine similarity ---
const dot  = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a) => Math.sqrt(dot(a, a))
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))

// Rank every word against a query vector, best first.
function rank(query) {
  return Object.entries(vectors)
    .map(([word, v]) => ({ word, score: cosine(query, v) }))
    .sort((a, b) => b.score - a.score)
}

// Query: "something like a cat"
const query = vectors.cat
console.log("Most similar to 'cat':")
for (const { word, score } of rank(query)) {
  console.log(\`  \${word.padEnd(8)} \${score.toFixed(3)}\`)
}`, solution: `// SOLUTION: search by a NEW query vector (not an existing word),
// and turn it into a reusable "semantic search" function.
const vectors = {
  cat: [0.9,0.1,0.0], kitten:[0.85,0.05,0.0], dog:[0.88,0.12,0.0],
  laptop:[0.0,0.95,0.05], server:[0.05,0.9,0.0],
  king:[0.1,0.0,0.95], queen:[0.12,0.0,0.93],
}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0)
const norm=(a)=>Math.sqrt(dot(a,a))
const cosine=(a,b)=>dot(a,b)/(norm(a)*norm(b))

function search(query, k = 3) {
  return Object.entries(vectors)
    .map(([word, v]) => ({ word, score: cosine(query, v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

// A brand-new query pointing mostly at the "tech" axis:
console.log("Top 3 for a tech-ish query [0.05, 0.92, 0.0]:")
console.log(search([0.05, 0.92, 0.0]))
// -> server & laptop win. That's nearest-neighbor search in miniature.`, caption: '**Exercise:** change `query` to `vectors.king` and predict the ranking before running. Then write a `search(queryVector, k)` that returns the top-k — that function *is* semantic search. (Solution provided.)' },
        { type: 'h', text: 'The real thing: an embedding API + numpy' },
        { type: 'p', text: "In production you don't hand-write vectors — you call an **embedding model** (a standalone model whose only job is text → vector) and get back real high-dimensional embeddings. Here's the Python you'll actually write. It's the same cosine idea, just with a real API and `numpy` doing the arithmetic." },
        { type: 'code', lang: 'python', filename: 'semantic_search.py', code: `import numpy as np
from openai import OpenAI

client = OpenAI()

def embed(texts):
    # One API call returns a vector per input (1536 dims for -3-small).
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in resp.data])

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

docs = [
    "How to reset your password",
    "Our refund and return policy",
    "Setting up two-factor authentication",
]
doc_vecs = embed(docs)

query_vec = embed(["I forgot my login and can't get in"])[0]

# Rank docs by similarity to the query — semantic search in ~3 lines.
scores = [cosine(query_vec, d) for d in doc_vecs]
ranked = sorted(zip(scores, docs), reverse=True)
for score, doc in ranked:
    print(f"{score:.3f}  {doc}")

# Top hit: "How to reset your password" — despite ZERO shared keywords
# with "I forgot my login." That's meaning-based retrieval.`, caption: 'Swap the toy vectors for a real embedding API and you have a working semantic-search backend. This is the seed of RAG.' },
        { type: 'callout', variant: 'tip', title: 'Token embeddings vs embedding models', text: "Two related things share the name. **Inside** a chat model, every token has an embedding as the *first layer* of processing — meaning-as-numbers that then flows through attention. Separately, **standalone embedding models** (the `embeddings` API) exist only to output one vector for a whole piece of text, tuned for search and comparison. When people say \"use embeddings for search,\" they mean the second. Same core idea, different tool for the job." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A user searches your help center for "my card was declined" and the top result is an article titled "Payment failed at checkout" — which shares no words with the query. What made this work?',
            options: [
              'Keyword matching with fuzzy spelling correction',
              'The two phrases have similar embeddings, so nearest-neighbor retrieval ranked the article highly',
              'The model memorized this exact question during training',
              'A hardcoded synonym list mapping "declined" to "failed"',
            ],
            answer: 1,
            explain: 'This is semantic search. Both phrases embed to nearby vectors because they *mean* similar things, so cosine similarity ranks the article high despite zero shared keywords. Synonym lists don\'t scale; embeddings generalize to phrasings you never anticipated.',
          },
          {
            q: 'What does cosine similarity actually measure between two embedding vectors?',
            options: [
              'The straight-line distance between the two points',
              'How many dimensions the two vectors share exactly',
              'The angle (direction alignment) between the two arrows, ignoring their lengths',
              'The average of the two vectors',
            ],
            answer: 2,
            explain: 'Cosine = dot product of the two directions. It asks "do these arrows point the same way?" — 1 is aligned, 0 is perpendicular/unrelated, −1 is opposite. Magnitude is deliberately divided out, which is why it suits documents of different lengths.',
          },
          {
            q: 'Real embeddings from an API like text-embedding-3-small have ~1536 dimensions. Why do teaching visuals show them in 2D?',
            options: [
              'The API can be configured to return only 2 dimensions for search',
              '2D is just as accurate as 1536D for similarity',
              'Humans can\'t picture 1536D, so a 2D projection gives intuition — but the real math always runs on the full vectors',
              'Older embedding models genuinely used 2 dimensions',
            ],
            answer: 2,
            explain: '2D projections (t-SNE/UMAP) are a lossy shadow for human intuition. They can distort some neighbors during flattening. Similarity, ranking, and retrieval always compute on the full high-dimensional vectors — never on the 2D picture.',
          },
          {
            q: 'You normalize all your embeddings to length 1 before storing them in a vector database. What\'s the practical payoff?',
            options: [
              'Cosine similarity now equals the plain dot product, which is faster to compute',
              'The vectors take up less storage space',
              'It increases the number of dimensions',
              'It makes the embeddings more accurate',
            ],
            answer: 0,
            explain: 'For unit-length vectors, the denominator in cosine (the product of norms) is 1, so cosine similarity reduces to the raw dot product. Vector databases exploit this to run pure, hardware-optimized dot products at scale.',
          },
          {
            q: 'A teammate wants to build "smart search" by calling the chat completion API and asking the model "is this document relevant?" for every document. Why are standalone embeddings the better tool?',
            options: [
              'The chat API can\'t read documents',
              'Embedding each document once lets you compare via cheap vector math against any future query, instead of an expensive LLM call per document per query',
              'Embeddings are always more accurate than an LLM at judging relevance',
              'The chat API doesn\'t support search',
            ],
            answer: 1,
            explain: 'Embeddings are computed once per document and stored. Every future query is then a fast nearest-neighbor lookup — no per-document LLM call. The chat-per-document approach costs an API call for every (query, doc) pair and doesn\'t scale to thousands of documents.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l1-c1', front: 'What is an embedding?', back: 'A learned, fixed-length vector (list of numbers) representing a token or text, arranged so that **similar meanings sit near each other** in high-dimensional space. Meaning becomes geometry.' },
          { id: 'm5-l1-c2', front: 'What does cosine similarity measure?', back: 'The angle between two vectors — do the arrows point the same way? 1 = aligned/related, 0 = perpendicular/unrelated, −1 = opposite. It ignores magnitude (dot product of directions).' },
          { id: 'm5-l1-c3', front: 'How many dimensions do real embeddings have, and why visualize in 2D?', back: 'Hundreds to thousands (e.g. 1536). 2D projections (t-SNE/UMAP) are a lossy shadow for human intuition only; real similarity math runs on the full vectors.' },
          { id: 'm5-l1-c4', front: 'What does "king − man + woman ≈ queen" demonstrate?', back: 'Meaning has arithmetic. Concepts are encoded as directions, so vector algebra can traverse relationships. Real but cherry-picked — great intuition, not a guaranteed production operation.' },
          { id: 'm5-l1-c5', front: 'Token embeddings vs standalone embedding models?', back: 'Token embeddings are the first layer inside a chat model (per-token). Embedding models (the embeddings API) output one vector per text, tuned for search/comparison. "Use embeddings for search" means the second.' },
          { id: 'm5-l1-c6', front: 'Why are embeddings the foundation of semantic search & RAG?', back: 'Embed docs once and store them; embed the query; nearest-neighbor by cosine finds meaning-matched results regardless of keywords. RAG then feeds the closest chunks into the prompt.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'An embedding is a learned vector for text; similar meanings map to nearby points — meaning becomes geometry.',
          'Real embeddings have hundreds-to-thousands of dimensions; 2D maps are lossy intuition only, never the actual math.',
          'Concepts are directions, which is why analogy arithmetic (king − man + woman ≈ queen) emerges from the geometry.',
          '[[Cosine Similarity]] measures the angle between two arrows: 1 aligned, 0 unrelated, −1 opposite. Four lines of code.',
          'Nearest-neighbor over embeddings = semantic search, the seed of RAG (Module 6). Embed once, compare forever.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Comparing embeddings from different models', text: 'A vector from OpenAI\'s model and one from a different model live in incompatible spaces — their numbers mean different things. Cosine between them is nonsense. Always embed everything (documents AND queries) with the *same* model and version.' },
          { title: 'Treating the 2D map as the real thing', text: 'The pretty 2D plot is a projection that distorts distances. Never compute similarity or make decisions on the flattened coordinates — always use the full high-dimensional vectors the API returned.' },
          { title: 'Forgetting to normalize (or double-normalizing)', text: 'Mixing normalized and raw vectors in one index silently corrupts rankings. Pick one convention. If your vectors are unit-length, cosine = dot product; if not, divide by the norms. Just be consistent.' },
          { title: 'Expecting analogy arithmetic to be reliable', text: '"king − man + woman = queen" is a demo, not an API. It works on curated examples and breaks on many others. Use it to build intuition; use cosine similarity to build products.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain embeddings to someone who only knows web development."', a: 'An embedding turns a piece of text into a fixed-length array of numbers — a point in high-dimensional space — learned so that texts with similar meaning end up close together. It\'s like a hex color being three numbers where nearby numbers are similar shades, except it\'s meaning instead of color and ~1536 dimensions instead of 3. Once text is a vector, you can measure similarity with cosine and do nearest-neighbor lookups, which is how semantic search works.' },
          { q: '"What is cosine similarity and why is it used for text?"', a: 'It\'s the cosine of the angle between two vectors — the dot product divided by their magnitudes — so it measures directional alignment, ranging from 1 (same direction) to −1 (opposite). It\'s favored for text because it ignores vector length, so documents of very different sizes about the same topic still score as similar. If vectors are normalized to unit length, cosine equals the dot product, which vector databases use for speed.' },
          { q: '"How would you build semantic search over a knowledge base?"', a: 'Chunk the documents, embed every chunk once with an embedding model, and store the vectors in a vector database (Pinecone, pgvector, etc.). At query time, embed the user\'s question with the same model and do an approximate-nearest-neighbor search by cosine similarity to retrieve the top-k chunks. That retrieval step is also the R in RAG — you then feed those chunks to an LLM to generate a grounded answer.' },
          { q: '"Why not just use keyword search?"', a: 'Keyword search fails when the user\'s wording differs from the document\'s — "my card was declined" won\'t match an article titled "payment failed." Embeddings capture meaning, so semantically related phrasings retrieve each other regardless of exact words. In practice teams often combine both (hybrid search): keywords catch exact matches like error codes, embeddings catch paraphrases and intent.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Semantic help-center search', text: 'Support portals embed every article once; a user\'s natural-language question retrieves the right doc even with zero keyword overlap — dramatically better than the old keyword box.' },
          { title: 'RAG chatbots', text: 'Every "chat with your docs" product embeds your files, retrieves the closest chunks to each question by cosine similarity, and feeds them to the LLM. Embeddings are the retrieval half of RAG (Module 6).' },
          { title: 'Recommendations & "related items"', text: 'Embed products, articles, or songs; "more like this" is just nearest-neighbor in embedding space. Spotify-style and e-commerce "you might also like" rails run on exactly this.' },
          { title: 'Deduplication & clustering', text: 'Embed support tickets or reviews, then cluster by proximity to auto-group duplicates and surface themes — turning a pile of free text into structured insight without manual tagging.' },
        ] },
        { type: 'project', title: 'Build a tiny semantic search', goal: 'Implement meaning-based retrieval end to end: embed several short sentences, then rank them against a query by cosine similarity.', steps: [
          'Pick 8 short sentences on 2–3 themes (e.g. some about cooking, some about programming, some about travel). These are your "documents."',
          'Get vectors: either call a real embedding API (`text-embedding-3-small`) in Python, or use the JS playground\'s toy-vector approach if you want it fully offline.',
          'Write `cosine(a, b)` (dot product over the product of norms) — reuse this lesson\'s four-line version.',
          'Write `search(query, k)`: embed the query with the *same* model, score every document by cosine, sort descending, return the top-k.',
          'Test with a query that shares NO keywords with the best-matching sentence (e.g. query "I\'m hungry" against a sentence about pasta). Confirm meaning wins over exact words.',
        ], deliverable: 'A `semantic_search.py` (or `.js`) that prints the ranked results for 2–3 queries, including one keyword-free query that still finds the right sentence.' },
        { type: 'challenge', title: 'Make the analogy arithmetic work', text: 'On a small set of word vectors, implement the analogy operation `a − b + c` and find the nearest word to the result (excluding a, b, and c themselves). Test the classic `king − man + woman` and see whether `queen` comes out on top.', hints: [
          'You need real learned vectors for this to work — grab a small pretrained set like GloVe (glove.6B.50d) rather than hand-made toy vectors, which won\'t encode the relationships.',
          'Compute `target = vec[a] − vec[b] + vec[c]`, then rank all words by cosine similarity to `target`.',
          'Exclude the three input words from the results — otherwise the nearest match is often just one of your inputs, and you\'ll miss the real answer.',
        ] },
        { type: 'reading', links: [
          { label: 'The Illustrated Word2Vec — Jay Alammar', url: 'https://jalammar.github.io/illustrated-word2vec/', note: 'The definitive visual explainer of how words become vectors and why analogies emerge. Read this once and embeddings click.' },
          { label: 'OpenAI: Embeddings guide', url: 'https://platform.openai.com/docs/guides/embeddings', note: 'The provider-official how-to: models, dimensions, and code for embedding text and computing similarity.' },
          { label: 'Cohere: What are embeddings?', url: 'https://cohere.com/llmu/text-embeddings', note: 'A clear, developer-focused walkthrough of embeddings and semantic search with runnable examples.' },
        ] },
      ],
    },
  ],
}
