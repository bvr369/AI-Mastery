// Lesson 6.4 — Chunking Strategies

export default {
  sections: [
    {
      id: 'why-chunk',
      title: 'The unglamorous skill that makes or breaks RAG',
      blocks: [
        { type: 'p', text: "Everyone wants to talk about the fancy parts of [[RAG]] — the vector database, the reranker, the clever prompt. But the single biggest lever on retrieval quality is the least glamorous decision in the whole pipeline: **how you cut your documents into pieces**. Get [[Chunking]] wrong and no amount of embedding-model upgrades will save you — you're retrieving garbage, just faster." },
        { type: 'p', text: "A chunk is one unit of text you embed, store, and retrieve as an atom. Your 40-page handbook doesn't go into the [[Vector Database]] as one blob — it goes in as dozens or hundreds of chunks, each with its own [[Embedding]]. When a user asks a question, you retrieve *chunks*, not documents. So the boundaries you draw decide what can possibly be found." },
        { type: 'h', text: 'Three hard reasons you must chunk' },
        { type: 'list', items: [
          "**Embeddings have a fixed capacity for meaning.** An embedding is one fixed-length vector no matter how much text you feed it. Embed a whole chapter and you get one blurry average of a dozen topics — the 'reset password' signal drowns in everything else. Small, focused chunks produce *sharp* embeddings that actually stand for one idea.",
          "**Context windows are finite (and you pay per token).** You stuff retrieved chunks into the LLM's prompt. You can't paste the whole knowledge base — it won't fit, and even where it fits you'd pay for thousands of irrelevant tokens on every call. Chunking lets you send only the few passages that matter.",
          "**Retrieval granularity = answer precision.** If your chunk is a whole page, a hit returns a page and the model has to find the needle itself. If your chunk is a tight paragraph, a hit returns the *answer*. Finer granularity means the retrieved text is mostly signal.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: indexing a textbook', text: "Chunking is writing the index of a textbook. Index the book by *chapter* (\"Chapter 4: Networking, p.112\") and a reader hunting one fact has to skim 30 pages. Index it by *specific concept* (\"TCP handshake, p.118\") and they land on the exact paragraph. Too coarse and the index is useless; too fine — a separate entry for every sentence — and it's noise. A good index, like good chunking, is cut at the grain of the questions people actually ask." },
        { type: 'callout', variant: 'info', title: 'Where this sits in the pipeline', text: "Chunking happens at **ingestion time**, before embedding: load document → split into chunks → embed each chunk → store vectors + metadata. It's a one-time preprocessing step per document, but it silently governs every retrieval forever after. That's why it's worth tuning deliberately instead of grabbing a default and moving on." },
      ],
    },
    {
      id: 'the-tradeoff',
      title: 'The size tradeoff: too small vs too big',
      blocks: [
        { type: 'p', text: "There is no universally correct chunk size — there's a tension you have to balance, and both extremes hurt you in different ways. Understanding the failure modes is what lets you tune intelligently instead of cargo-culting `chunk_size=1000` from a tutorial." },
        { type: 'table', headers: ['Chunk size', 'What breaks', 'Symptom in production'], rows: [
          ['**Too small** (a sentence)', 'Context is lost — the chunk is a fragment that can\'t answer on its own', 'Retrieval finds the right *area* but the chunk lacks the surrounding detail needed to answer; pronouns dangle ("it does this") with no antecedent'],
          ['**Too big** (a whole page)', 'Embedding is a blurry average of many topics; retrieved text is mostly noise; wasted tokens', 'Relevant chunks rank lower (their signal is diluted), and each hit dumps paragraphs of irrelevant text into the prompt, distracting the LLM and costing tokens'],
          ['**Just right** (a focused passage)', 'Nothing — one coherent idea per chunk', 'The chunk stands alone as a mini-answer and its embedding sharply represents one topic'],
        ] },
        { type: 'p', text: "The 'blurry average' point is the one developers underrate. An embedding model compresses whatever you give it into a single vector. Feed it one focused paragraph about refund windows and the vector points cleanly at 'refunds.' Feed it a page covering refunds, shipping, *and* warranty, and the vector points at the mushy centroid of all three — so a refund question matches it only weakly, and it may lose to a smaller, sharper chunk elsewhere. **Big chunks don't just add noise; they actively degrade ranking.**" },
        { type: 'callout', variant: 'warn', title: 'The seductive wrong intuition', text: "\"Bigger chunks = more context = better, right?\" feels true and burns people constantly. More context in the *chunk* means less *precision* in the embedding and more noise in the prompt. The goal isn't maximum context per chunk — it's **one coherent idea per chunk**, with just enough surrounding text to stand on its own. Tune down from too-big far more often than you tune up." },
        { type: 'p', text: "A rough starting point most teams use: **300–800 tokens per chunk** for prose, then measure and adjust against your own data and queries (more on measuring in Lesson 6.7). Dense reference material and short FAQ entries want smaller chunks; flowing narrative or tutorials tolerate larger ones. There's no default that survives contact with a real corpus — you *tune*." },
      ],
    },
    {
      id: 'overlap',
      title: 'Overlap: the fix for answers split at a boundary',
      blocks: [
        { type: 'p', text: "Here's the failure that overlap exists to solve. You chunk your doc into clean 500-token pieces. Unluckily, the two sentences that *together* answer a question fall on opposite sides of a chunk boundary — the setup ends chunk 3, the payoff starts chunk 4. Now **neither chunk contains the full answer**. Retrieve chunk 3 and you get the question restated with no answer; retrieve chunk 4 and you get an answer with no context. The information existed in your corpus and your pipeline still failed. This is the single most common silent RAG bug." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: tearing a photo strip', text: "Cutting a document into hard, non-overlapping chunks is like tearing a strip of photos apart exactly on the perforations — sometimes a face lands half on one photo and half on the next, and now no single photo shows the whole face. **Overlap** is cutting so each piece includes a bit of its neighbors' edges. The face (your answer) is now whole in at least one piece, because every boundary is covered twice." },
        { type: 'p', text: "Mechanically, **overlap** means consecutive chunks share their edges: chunk N ends with the same 50–100 tokens that chunk N+1 begins with. You slide a window across the text with a *stride* smaller than the window. A sentence near a boundary therefore appears in *both* neighboring chunks, so whichever one retrieval picks, the surrounding context comes along for the ride." },
        { type: 'table', headers: ['Term', 'Meaning', 'Typical value'], rows: [
          ['**Chunk size**', 'Window width — how much text per chunk', '300–800 tokens'],
          ['**Overlap**', 'How much each chunk shares with the previous one', '10–20% of chunk size (e.g. 50–100 tokens)'],
          ['**Stride**', 'How far the window advances each step = size − overlap', 'e.g. size 500, overlap 100 → stride 400'],
        ] },
        { type: 'callout', variant: 'tip', title: 'Don\'t crank overlap to the max', text: "Overlap isn't free. At 50% overlap you nearly double your chunk count — double the vectors to store, double the embedding cost, and near-duplicate chunks that clutter your top-k results (the same passage retrieved twice, crowding out variety). Enough overlap to cover a boundary crossing (roughly one to two sentences' worth) is plenty. More is waste, not safety." },
      ],
    },
    {
      id: 'lab',
      title: 'Play with size and overlap (the whole lesson in one demo)',
      blocks: [
        { type: 'p', text: "This is the centerpiece — spend real time here. Drag the **size** and **overlap** sliders and watch the same document re-chunk live, then see which chunk a sample question retrieves. Push size tiny and watch chunks become context-starved fragments; push it huge and watch the answer get buried in noise and rank worse. Set overlap to zero and find a question whose answer straddles a boundary — then add overlap and watch it get rescued." },
        { type: 'demo', id: 'chunking-lab' },
        { type: 'p', text: "Two things to notice as you play. First, there's a **visible sweet spot** where each chunk is one coherent idea and the right chunk clearly wins retrieval — that's the target you'll tune toward on real data. Second, **overlap changes which questions are answerable at all**, not just the scores: a boundary-straddling answer goes from unretrievable to retrievable the moment neighboring chunks share their edges." },
      ],
    },
    {
      id: 'strategies',
      title: 'Four chunking strategies, worst to best',
      blocks: [
        { type: 'p', text: "\"Chunk the document\" hides a ladder of strategies, each respecting more of the document's real structure than the last. You climb this ladder as your data demands — start simple, get smarter only where retrieval evals tell you it's worth it." },
        { type: 'h', text: '1. Fixed-size (character/token windows)' },
        { type: 'p', text: "Cut every N characters or tokens, ignoring content entirely. Dead simple, fast, and the baseline everyone starts with. Its flaw is obvious: it happily slices mid-sentence, mid-word, mid-table — the boundary falls wherever the counter hits N. Add overlap and it's a perfectly serviceable starting point; it just treats text as an undifferentiated stream." },
        { type: 'h', text: '2. Sentence / paragraph (natural boundaries)' },
        { type: 'p', text: "Split on sentence or paragraph boundaries, then pack sentences into a chunk until you approach the size limit, so you never cut mid-thought. A paragraph is usually one idea, which is exactly the grain you want. This is a big quality jump over fixed-size for prose and costs almost nothing." },
        { type: 'h', text: '3. Recursive (hierarchical splitting)' },
        { type: 'p', text: "The pragmatic default in tools like [[LangChain]] and LlamaIndex. Try to split on the biggest separator first (double newline = paragraphs); if a piece is still too big, recurse and split it on the next separator (single newline), then sentences, then finally raw characters as a last resort. It keeps the largest natural units intact that fit, and only makes fine cuts where it's forced to. Best general-purpose choice." },
        { type: 'h', text: '4. Structure-aware / semantic (respect the document\'s shape)' },
        { type: 'p', text: "The smartest tier: chunk along the document's *actual* structure. For **Markdown**, split on headings so each chunk is a self-contained section. For **code**, split on function/class boundaries so a function is never torn in half. For **HTML**, respect the DOM. \"Semantic\" chunking goes further and cuts where the *topic* shifts (using embedding-similarity between sentences to detect the seam). More work, but it produces chunks that map to how the document actually means things." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: cutting a cake vs cutting along the layers', text: "Fixed-size chunking is cutting a layer cake with a grid stamp — every piece is the same size but flavors get mangled, half-chocolate half-vanilla slices everywhere. Structure-aware chunking is cutting *along the layers*: each piece is one clean flavor. Same knife, radically different result, because one respects how the cake is actually built." },
        { type: 'callout', variant: 'info', title: 'Metadata is half the point of good chunking', text: "Every chunk should carry [[Metadata]]: its `source` document, the `section`/heading it came from, a `page` number, maybe a `chunk_index`. Two payoffs. **Citations:** when the LLM answers, you can show \"from *Employee Handbook*, §4.2, p.12\" — [[Grounding]] the answer in a real, checkable source. **Filtering:** you can restrict retrieval to `source = 'billing-docs'` or the newest version before the vector search even runs. Chunking that throws away structure throws away this metadata — capture it as you split." },
      ],
    },
    {
      id: 'in-code',
      title: 'Build a chunker (runnable) + a smarter splitter',
      blocks: [
        { type: 'p', text: "Time to make it real. Below is a working fixed-size-with-overlap chunker over a sample document, plus a naive keyword retriever so you can *see* which chunk answers a question — and watch overlap rescue a boundary-straddling answer. Run it, read the output, then do the exercise in the caption." },
        { type: 'playground', id: 'chunker-lab', title: 'Chunk a document, then retrieve the answer', height: 560, code: `// A tiny corpus. Notice the answer to "how long is the return window?"
// and its condition are one sentence apart — a boundary risk.
const doc = \`Our store offers free standard shipping on all orders over fifty dollars.
Orders below that ship for a flat five dollar fee.
Returns are accepted within thirty days of delivery for a full refund.
To qualify, items must be unused and in their original packaging.
Refunds are issued to the original payment method within five business days.
Gift cards and final-sale items cannot be returned under any circumstances.\`

// --- Fixed-size chunker with overlap (word-based for readability) ---
function chunk(text, size, overlap) {
  const words = text.split(/\\s+/)
  const stride = size - overlap          // how far the window advances
  const chunks = []
  for (let i = 0; i < words.length; i += stride) {
    chunks.push(words.slice(i, i + size).join(" "))
    if (i + size >= words.length) break  // last window covered the tail
  }
  return chunks
}

// --- Naive keyword retriever: score = # of query words present ---
function retrieve(chunks, query) {
  const q = query.toLowerCase().split(/\\s+/)
  return chunks
    .map((c, i) => {
      const text = c.toLowerCase()
      const score = q.filter(w => text.includes(w)).length
      return { i, score, c }
    })
    .sort((a, b) => b.score - a.score)[0]
}

const chunks = chunk(doc, 12, 4)   // 12 words per chunk, 4-word overlap
console.log(\`Made \${chunks.length} chunks:\\n\`)
chunks.forEach((c, i) => console.log(\`[\${i}] \${c}\\n\`))

const q = "how many days is the return window for a refund"
const hit = retrieve(chunks, q)
console.log(\`Question: \${q}\`)
console.log(\`Best chunk [\${hit.i}] (score \${hit.score}): \${hit.c}\`)`, solution: `// SOLUTION: compare overlap=0 vs overlap=4 on a boundary-straddling answer.
const doc = \`Our store offers free standard shipping on all orders over fifty dollars.
Orders below that ship for a flat five dollar fee.
Returns are accepted within thirty days of delivery for a full refund.
To qualify, items must be unused and in their original packaging.
Refunds are issued to the original payment method within five business days.
Gift cards and final-sale items cannot be returned under any circumstances.\`

function chunk(text, size, overlap) {
  const words = text.split(/\\s+/)
  const stride = size - overlap
  const chunks = []
  for (let i = 0; i < words.length; i += stride) {
    chunks.push(words.slice(i, i + size).join(" "))
    if (i + size >= words.length) break
  }
  return chunks
}
function retrieve(chunks, query) {
  const q = query.toLowerCase().split(/\\s+/)
  return chunks.map((c, i) => ({
    i, c, score: q.filter(w => c.toLowerCase().includes(w)).length,
  })).sort((a, b) => b.score - a.score)[0]
}

const q = "what condition must items meet to qualify for a return"
for (const overlap of [0, 4]) {
  const chunks = chunk(doc, 10, overlap)
  const hit = retrieve(chunks, q)
  console.log(\`overlap=\${overlap} -> best chunk [\${hit.i}] score \${hit.score}\`)
  console.log(\`   \${hit.c}\\n\`)
}
// With overlap, the winning chunk is more likely to hold BOTH the
// "return" trigger and the "unused / original packaging" condition together.`, caption: '**Exercise:** run it, then change `chunk(doc, 12, 4)` to `chunk(doc, 6, 0)` (tiny, no overlap). Watch the best chunk become a context-starved fragment. Then try `chunk(doc, 40, 0)` — one giant chunk that "answers" everything and nothing. The solution compares overlap 0 vs 4 head-to-head.' },
        { type: 'h', text: 'The real thing: recursive & structure-aware splitting' },
        { type: 'p', text: "In production you rarely hand-roll the fixed-size loop — you reach for a battle-tested splitter. Here's the **recursive** splitter (the sane default) and a **Markdown heading-aware** splitter that also attaches section metadata for citations." },
        { type: 'code', lang: 'python', filename: 'splitters.py', code: `from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    MarkdownHeaderTextSplitter,
)

# 1) Recursive: the pragmatic default.
# Tries "\\n\\n" (paragraphs), then "\\n", then " ", then "" (chars),
# keeping the largest natural units that still fit under chunk_size.
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # target size (in characters here)
    chunk_overlap=80,     # ~15% overlap to cover boundary crossings
    separators=["\\n\\n", "\\n", ". ", " ", ""],
)
chunks = splitter.split_text(document_text)

# 2) Structure-aware: split a Markdown doc on its headings so each
# chunk is a self-contained section — AND capture heading metadata.
md_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[("#", "h1"), ("##", "h2"), ("###", "h3")]
)
docs = md_splitter.split_text(markdown_text)
for d in docs:
    # d.page_content is the section body;
    # d.metadata carries {"h1": "...", "h2": "..."} for citations & filtering.
    print(d.metadata, "->", d.page_content[:60])`, caption: 'RecursiveCharacterTextSplitter is the everyday workhorse; the Markdown splitter is the leap to structure-aware chunking with citation-ready metadata.' },
        { type: 'code', lang: 'python', filename: 'chunk_with_metadata.py', code: `# Every chunk should be a record, not a bare string — metadata is what
# turns retrieval into *cited*, filterable answers.
def to_records(chunks, source, section):
    return [
        {
            "text": text,
            "metadata": {
                "source": source,       # which document
                "section": section,     # heading it came from
                "chunk_index": i,       # position within the section
            },
        }
        for i, text in enumerate(chunks)
    ]

records = to_records(chunks, source="employee_handbook.md", section="4.2 Refunds")
# Later, at answer time, you can show the user:
#   "From employee_handbook.md, §4.2 Refunds"  -> grounded, checkable.
# And pre-filter the vector search:  where source == "employee_handbook.md".`, caption: 'Attach metadata as you split — recovering it after the fact is painful, and it powers both citations and pre-filtering.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A RAG bot over your docs keeps retrieving the right *page* but its answers miss key details that are clearly written on that page. Chunks are one full page each. Best first fix?',
            options: [
              'Switch to a bigger, more expensive embedding model',
              'Increase the number of chunks retrieved (top-k) to 50',
              'Reduce chunk size so each chunk is a focused passage, improving retrieval granularity and embedding sharpness',
              'Raise the LLM temperature so it reasons more creatively',
            ],
            answer: 2,
            explain: 'Page-sized chunks give coarse granularity and blurry, averaged embeddings. Smaller, focused chunks retrieve the actual answer-bearing passage and embed one idea sharply. A bigger embedding model can\'t fix a chunk that mixes ten topics; the chunking is the bottleneck.',
          },
          {
            q: 'Your chunker cuts on clean 500-token boundaries with zero overlap. Users report the bot fails on exactly the questions whose answer spans two sentences. What\'s happening and the fix?',
            options: [
              'The embedding model is broken; switch providers',
              'The vector database is returning stale results; rebuild the index',
              'The query is too long; truncate it before embedding',
              'The answer straddles a chunk boundary so neither chunk is complete — add overlap so neighboring chunks share their edges',
            ],
            answer: 3,
            explain: 'This is the classic boundary failure. When the setup and payoff land in different chunks, no single retrieved chunk holds the whole answer. Overlap makes consecutive chunks share their edges, so a boundary-crossing answer appears complete in at least one chunk.',
          },
          {
            q: 'Why does an oversized chunk (a whole multi-topic page) actually *lower* retrieval quality, beyond just wasting tokens?',
            options: [
              'The embedding becomes a blurry average of many topics, so its vector weakly matches any single-topic query and can rank below a smaller, sharper chunk',
              'Large chunks exceed the embedding model\'s token limit and are rejected',
              'Vector databases can\'t store large vectors',
              'Large chunks are always retrieved first, hiding better ones',
            ],
            answer: 0,
            explain: 'An embedding is one fixed vector regardless of input length. A multi-topic chunk embeds to the mushy centroid of all its topics, so it only weakly matches a focused query — and a tighter chunk elsewhere can outrank it. Big chunks degrade ranking, not just cost.',
          },
          {
            q: 'You\'re building RAG over a large Markdown knowledge base with clear headings. Which chunking strategy best preserves meaning and enables citations like "§4.2 Refunds"?',
            options: [
              'Fixed-size character windows, because they\'re the fastest',
              'One chunk per document to maximize context',
              'Structure-aware splitting on headings, so each chunk is a self-contained section and carries its heading as metadata',
              'Random splitting to ensure even chunk sizes',
            ],
            answer: 2,
            explain: 'Heading-aware (structure-aware) splitting keeps each section intact and lets you attach the heading path as metadata — powering both grounded citations and pre-filtering. Fixed-size windows would slice mid-section and discard the heading structure entirely.',
          },
          {
            q: 'An interviewer asks: "How did you pick your chunk size and overlap?" What\'s the strongest answer?',
            options: [
              '"I used chunk_size=1000, chunk_overlap=200 because that\'s the tutorial default."',
              '"I always use the largest chunks possible so the model has maximum context."',
              '"I set overlap to 50% to be completely safe against boundary issues."',
              '"I tuned them against our own documents and query patterns, measured with retrieval evals, and picked the setting that best surfaced answer-bearing chunks."',
            ],
            answer: 3,
            explain: 'There is no universal best size — it depends on your data and queries. The senior answer ties chunking to measurement: tune on real docs and questions, evaluate retrieval, iterate. Blindly citing a default, maxing size, or maxing overlap all signal you never measured.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm6-l4-c1', front: 'Why chunk documents at all for RAG?', back: 'Three reasons: embeddings have fixed capacity (small chunks embed one idea sharply), context windows are finite and cost tokens (send only relevant passages), and finer granularity means retrieved text is mostly the answer, not noise.' },
          { id: 'm6-l4-c2', front: 'Too-small vs too-big chunks — what breaks?', back: 'Too small: context is lost, the fragment can\'t answer on its own. Too big: the embedding is a blurry average of many topics (weak matching, worse ranking) plus wasted tokens and noise. Aim for one coherent idea per chunk.' },
          { id: 'm6-l4-c3', front: 'What is chunk overlap and what does it fix?', back: 'Consecutive chunks share their edges (e.g. the last ~80 tokens of one start the next). It fixes the "answer straddles a boundary" failure, where the setup and payoff land in different chunks so neither is complete. Typical: 10–20% of chunk size.' },
          { id: 'm6-l4-c4', front: 'Name the four chunking strategies, worst to best.', back: '1) Fixed-size (blind N-char/token windows). 2) Sentence/paragraph (natural boundaries). 3) Recursive (split on biggest separator, recurse if too big — the default). 4) Structure-aware/semantic (headings, functions, topic shifts).' },
          { id: 'm6-l4-c5', front: 'Why attach metadata to each chunk?', back: 'Source, section/heading, page, and index enable two things: grounded citations ("from Handbook §4.2, p.12") and pre-filtering the vector search (e.g. source == "billing-docs") before it runs. Capture it as you split — recovering it later is painful.' },
          { id: 'm6-l4-c6', front: 'How do you choose chunk size and overlap?', back: 'There\'s no universal default. Tune against YOUR documents and query patterns, measure with retrieval evals (Lesson 6.7), and pick the setting that best surfaces answer-bearing chunks. A rough start: 300–800 tokens, 10–20% overlap.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Chunking is the highest-leverage, least-glamorous decision in RAG — the boundaries you draw decide what can be retrieved at all.',
          'Chunk because embeddings have fixed capacity (sharp = focused), context windows are finite and priced, and granularity drives answer precision.',
          'Too small loses context; too big blurs the embedding and dilutes ranking. Target one coherent idea per chunk (~300–800 tokens).',
          'Overlap (10–20%) makes consecutive chunks share edges, rescuing answers that straddle a boundary — the most common silent RAG bug.',
          'Climb the strategy ladder — fixed-size → sentence/paragraph → recursive → structure-aware — and carry metadata for citations and filtering. Then tune against real data and evals.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Grabbing a default chunk size and never measuring', text: 'Copying `chunk_size=1000` from a tutorial and shipping it. The right size depends entirely on your documents and queries. Treat chunking as a tunable hyperparameter measured with retrieval evals, not a constant.' },
          { title: 'Zero overlap (or 50% overlap)', text: 'Zero overlap guarantees some answers get split across a boundary and become unretrievable. But cranking overlap to 50% doubles storage and cost and floods your top-k with near-duplicates. Use just enough to cover a boundary crossing — roughly one to two sentences.' },
          { title: 'Assuming bigger chunks are safer because "more context"', text: 'More context per chunk means a blurrier embedding and noisier prompts. Oversized chunks actively lower ranking because their vector is an average of many topics. Precision comes from focus, not from stuffing more text into each chunk.' },
          { title: 'Throwing away structure and metadata while splitting', text: 'Blind character windows slice mid-section and discard headings, so you lose both meaning boundaries and the metadata needed for citations and filtering. Split along the document\'s real structure and attach source/section/page as you go.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through how you\'d chunk documents for a RAG system."', a: 'I start by looking at the document structure and the questions users will ask. For structured docs (Markdown, code) I split on natural boundaries — headings, functions — so each chunk is a self-contained unit, and I attach metadata like source and section. For unstructured prose I use a recursive splitter that keeps paragraphs intact where they fit, with roughly 300–800 tokens per chunk and 10–20% overlap to cover boundary crossings. Then I don\'t trust my guess: I build a small retrieval eval set of real questions and measure whether the answer-bearing chunk is actually retrieved, and I tune size and overlap from there.' },
          { q: '"What is chunk overlap and why does it matter?"', a: 'Overlap means consecutive chunks share some text at their edges — the end of one chunk repeats at the start of the next. It exists to fix the boundary problem: when the two halves of an answer land in adjacent chunks, non-overlapping chunking leaves neither chunk complete, so retrieval fails even though the information is in the corpus. Overlap ensures a boundary-crossing answer appears whole in at least one chunk. I keep it around 10–20% — enough to cover a sentence or two, not so much that I double my storage and get duplicate hits.' },
          { q: '"Why can chunks that are too large hurt retrieval quality, not just cost?"', a: 'An embedding is a single fixed-length vector no matter how much text you embed. A large chunk covering several topics embeds to the average of all of them, so its vector only weakly matches any one focused query — and a smaller, sharper chunk elsewhere can outrank it. So oversized chunks don\'t just waste tokens and add prompt noise; they degrade ranking by blurring the signal. That\'s why the goal is one coherent idea per chunk, not maximum context.' },
          { q: '"How do you decide between fixed-size, recursive, and semantic chunking?"', a: 'I match the strategy to the data and let evals justify added complexity. Fixed-size with overlap is a fine baseline. For most prose, a recursive splitter is the pragmatic default — it respects paragraphs and sentences while guaranteeing a max size. I move up to structure-aware or semantic chunking when the document has real structure to exploit (headings, code) or when evals show topic-mixed chunks are hurting retrieval. Semantic chunking (cutting on topic shifts via embedding similarity) costs more to build, so I only reach for it when the simpler tiers plateau.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Chat-with-your-docs products', text: 'Every "upload a PDF and ask questions" tool lives or dies on chunking. They typically use recursive splitting with overlap, plus page-number metadata so answers can cite "p.14" back to the source document.' },
          { title: 'Codebase assistants', text: 'Tools that answer questions about a repo chunk along function and class boundaries (structure-aware) rather than by line count, so a retrieved chunk is a whole function with its signature intact — not a torn-in-half fragment.' },
          { title: 'Customer-support knowledge bases', text: 'Help centers chunk articles by heading and attach category metadata, enabling both grounded citations to the exact section and pre-filtering retrieval to the relevant product area before the vector search runs.' },
          { title: 'Legal & compliance search', text: 'Contract and policy tools chunk on clause and section structure and keep precise section/page metadata, because a wrong or unciteable answer is a liability — grounding and traceability are non-negotiable.' },
        ] },
        { type: 'project', title: 'Tune a chunker against a real question', goal: 'Feel the size/overlap tradeoff empirically: run one chunker at three settings on a document and find which setting cleanly retrieves the answer.', steps: [
          'Pick a real ~1–2 page document (a README, a policy page, an article) and write down 3 test questions whose answers are definitely in it — include at least one whose answer spans two adjacent sentences.',
          'Implement `chunker(text, size, overlap)` — reuse this lesson\'s word-based fixed-size-with-overlap version, or a real splitter if you prefer.',
          'Run it at three settings: tiny+no-overlap (e.g. 40/0), medium+overlap (e.g. 150/30), and huge+no-overlap (e.g. 600/0). Print the chunks for each.',
          'For each question, use a simple keyword or cosine retriever to pick the best chunk at each setting, and record whether that chunk cleanly contains the full answer.',
          'Write one paragraph: which setting won, why the tiny chunks lost context, why the huge chunk buried the answer, and where the boundary-spanning question needed overlap.',
        ], deliverable: 'A short `chunking-report.md` with your three questions, a 3×3 results table (setting × question → clean answer? yes/no), and your conclusion on the best setting for this document.' },
        { type: 'challenge', title: 'Heading-aware chunking with section metadata', text: 'Implement a chunker that never splits mid-section: given a Markdown document, split on headings (`#`, `##`, `###`) so each chunk is one whole section, and attach the section title (and its heading path) as metadata on every chunk. If a section is longer than your max size, fall back to fixed-size-with-overlap *within* that section — but keep the section title on each sub-chunk so citations still work.', hints: [
          'Parse line by line: when a line matches a heading pattern, start a new chunk and record the current heading path (e.g. h1 > h2). Accumulate body lines until the next heading.',
          'Track a stack of the current heading at each level so a chunk under "## Refunds" nested in "# Policies" carries both — that path is your citation string.',
          'For over-long sections, run your `chunker(text, size, overlap)` on the section body and copy the same section metadata onto each resulting sub-chunk so every piece is still traceable.',
        ] },
        { type: 'reading', links: [
          { label: 'LangChain: Text Splitters', url: 'https://python.langchain.com/docs/concepts/text_splitters/', note: 'The canonical reference for recursive, character, token, and structure-aware splitters — with the concepts and code you\'ll actually use.' },
          { label: 'LlamaIndex: Node Parsers / Chunking', url: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/', note: 'The other major framework\'s take on chunking (they call chunks "nodes") — sentence, token, and hierarchical parsers with metadata.' },
          { label: 'Pinecone: Chunking Strategies for RAG', url: 'https://www.pinecone.io/learn/chunking-strategies/', note: 'A thorough, vendor-neutral walkthrough of chunk size, overlap, and strategy tradeoffs with evaluation guidance — the best single-page primer.' },
        ] },
      ],
    },
  ],
}
