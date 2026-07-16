// Lesson 7.3 — Ingestion Pipelines

export default {
  sections: [
    {
      id: 'the-unglamorous-80',
      title: 'The unglamorous 80% of every RAG system',
      blocks: [
        { type: 'p', text: "Demos of [[RAG]] always show the fun 20%: a slick chat box, a clever prompt, a grounded answer with citations. Nobody films the other 80% — the part where you wrestle a 200-page scanned PDF, a Notion export full of `\\u200b` zero-width junk, and a Confluence page whose \"table\" is actually four nested `<div>`s pretending to be one. That messy, upstream work is the [[Ingestion]] pipeline, and it is where real RAG projects live or die." },
        { type: 'p', text: "Here's the reframe that makes this lesson click: **ingestion is a data-engineering job, not an AI job.** It's ETL — extract, transform, load — with embeddings bolted on the end. You already know this shape from any web app that pulls messy third-party data, normalizes it, and writes clean rows to a database. Swap \"clean rows\" for \"clean, chunked, embedded records\" and you have a RAG ingestion pipeline. The AI is the easy part; the plumbing is the job." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: mise en place', text: "A great restaurant kitchen looks calm at dinner service because all the chaos happened hours earlier — vegetables washed and diced, sauces reduced, everything in labeled containers within arm's reach. That prep is *mise en place*, \"everything in its place.\" Retrieval at query time is the calm dinner service; ingestion is the frantic afternoon prep. If the prep is sloppy — a dirty cut here, a mislabeled container there — dinner service falls apart no matter how good the chef is. Your embedding model and LLM are the chef. Ingestion is whether they get clean ingredients." },
        { type: 'p', text: "The through-line of the whole pipeline: **garbage in, garbage retrieved.** No embedding model rescues a chunk that's half navigation menu and half footer boilerplate. No reranker fixes a table that got flattened into `col1 col2 col3 4 5 6` with the meaning stripped out. The single highest-leverage thing you can do for retrieval quality is not a fancier index — it's cleaner ingestion." },
        { type: 'diagram', id: 'embed-pipeline', caption: 'The ingestion pipeline end to end: sources → parse/extract → clean → chunk (+ metadata) → embed in batches → upsert into the index. Every stage upstream of the index is this lesson.' },
      ],
    },
    {
      id: 'sources-and-their-pain',
      title: 'Sources, and the specific pain each one brings',
      blocks: [
        { type: 'p', text: "Your knowledge lives in a dozen formats, and every one of them fights you differently. The first job is *loading* — pulling raw content out of each source — and the second is *parsing* — turning that raw content into clean text. Knowing each source's failure mode up front saves you days." },
        { type: 'table', headers: ['Source', 'How you load it', 'The pain'], rows: [
          ['**PDF**', 'A parser like `pdfplumber`, PyMuPDF, or a document-AI service', 'The worst offender. No reliable notion of reading order, multi-column layouts scramble, tables collapse, headers/footers repeat on every page, and *scanned* PDFs are just images with zero text.'],
          ['**HTML / web**', 'Fetch + an extractor (`trafilatura`, readability, BeautifulSoup)', 'Buried in boilerplate: nav bars, cookie banners, sidebars, footers, ads. The real content is often 10% of the bytes.'],
          ['**Office docs** (`.docx`, `.pptx`, `.xlsx`)', '`python-docx`, `python-pptx`, `openpyxl`, or `unstructured`', 'Structure hides in XML. Slides have almost no prose; spreadsheets are grids where a cell means nothing without its row/column headers.'],
          ['**Notion / Confluence / wikis**', 'Official API or an export', 'Nested blocks, toggle lists, embedded databases, and invisible unicode. Permissions are per-page and *must* travel with the content.'],
          ['**Databases / SaaS APIs**', 'SQL query or REST pull', 'The cleanest source — but you have to *serialize rows into readable text* and decide what a "document" even is (one row? one joined record?).'],
        ] },
        { type: 'callout', variant: 'warn', title: 'PDFs are where projects go to die', text: "Budget for this specifically. A PDF is a *layout* format — it stores \"put this glyph at these coordinates,\" not \"this is a paragraph, this is a table cell.\" Reconstructing meaning from coordinates is genuinely hard. Multi-column academic papers interleave text across columns; financial tables lose their row/column relationships; and a scanned contract is literally a photograph. If your corpus is mostly PDFs, your parsing choice matters more than your embedding model choice." },
        { type: 'h', text: 'Scanned documents: when there is no text at all' },
        { type: 'p', text: "A scanned PDF or an image has *no extractable text* — it's pixels. To ingest it you need [[OCR]] (Optical Character Recognition): a model that reads pixels and outputs characters. Tools like Tesseract, AWS Textract, Google Document AI, or the `unstructured` library's OCR mode do this. OCR is imperfect — it invents `rn` where the original said `m`, mangles tables, and struggles with handwriting — so treat OCR'd text as *noisy* and lean harder on cleaning. Detecting whether a PDF needs OCR is itself a step: if a page yields near-zero characters from a normal text extractor, it's probably a scan." },
        { type: 'callout', variant: 'info', title: 'Tables are their own special hell', text: "Tables carry dense, high-value information (pricing, specs, comparisons) and they're the thing parsers most reliably destroy. Flattened row-by-row, `Plan Price Seats Pro 49 10` is nearly meaningless to an embedding model — the column relationships are gone. Better strategies: extract tables separately and render each *row* as a self-describing sentence (\"The Pro plan costs $49 for 10 seats\"), or convert the table to Markdown/HTML so structure survives into the chunk. Whatever you do, don't let a table dissolve into a word soup." },
      ],
    },
    {
      id: 'cleaning-and-chunking',
      title: 'Clean the text, then chunk with structure awareness',
      blocks: [
        { type: 'p', text: "Once you have raw-ish text, two transforms stand between you and good records: **cleaning** (strip the junk) and **chunking** (split into retrieval-sized pieces). You met chunking in depth back in Module 6.4 — the *why* and the *how big*. Here we apply it to real, messy documents, where the twist is **structure awareness**." },
        { type: 'h', text: 'Cleaning: delete what will never help retrieval' },
        { type: 'p', text: "Cleaning is unglamorous find-and-destroy work. The goal isn't perfection — it's removing the reliably-useless so it doesn't pollute chunks or waste embedding tokens. The usual suspects:" },
        { type: 'list', items: [
          "**Boilerplate** — repeated headers, footers, nav menus, \"Copyright © 2026,\" cookie notices. If a string appears on every page, it's almost certainly chrome, not content.",
          "**Invisible unicode** — zero-width spaces, non-breaking spaces, smart-quote noise, soft hyphens. These wreck deduplication and sometimes tokenization.",
          "**Whitespace chaos** — the classic PDF artifact where every line ends mid-sentence with a hard newline. Collapse runs of whitespace; rejoin broken lines.",
          "**Encoding gremlins** — mojibake like `â€™` where a smart apostrophe should be. Normalize to UTF-8 and fix common mis-decodings.",
        ] },
        { type: 'callout', variant: 'tip', title: 'Detect boilerplate statistically, not by hand', text: "You don't have to hardcode every footer. A robust trick: across all pages/documents, count how often each line appears. Lines that repeat far more than the content warrants (the same 8 words on 200 pages) are boilerplate — drop them automatically. This generalizes across sources far better than a brittle list of regexes you maintain forever." },
        { type: 'h', text: 'Structure-aware chunking' },
        { type: 'p', text: "Naive chunking slices every N characters and calls it a day. **Structure-aware** chunking respects the document's own boundaries — split on headings, sections, paragraphs, or Markdown structure *before* falling back to size limits. Why it matters: a chunk that starts mid-sentence and ends mid-table embeds to a muddy vector that matches nothing well. A chunk aligned to a real section (\"Refund Policy,\" whole and intact) embeds to a clean, on-topic vector. Same corpus, wildly different retrieval." },
        { type: 'p', text: "The practical recipe most teams converge on: **recursive splitting.** Try to split on the biggest structural boundary (say, `##` headings); if a resulting piece is still too big, split it on the next boundary down (paragraphs); keep recursing until pieces fit your target size, then add a little overlap so ideas straddling a boundary aren't severed. Play with the tradeoffs in the lab below." },
        { type: 'demo', id: 'chunking-lab' },
        { type: 'p', text: "Notice as you experiment: too-small chunks fragment a single idea across many vectors (retrieval returns half an answer); too-large chunks dilute the signal (one on-topic sentence buried in 800 off-topic words embeds to a vague vector). The sweet spot is \"one coherent idea per chunk,\" which is exactly why aligning to structure beats slicing by raw character count." },
      ],
    },
    {
      id: 'metadata-and-embedding',
      title: 'Metadata is half the value — and batch your embeddings',
      blocks: [
        { type: 'p', text: "A chunk of text alone is a second-class citizen. The moment you attach **metadata** to it, it becomes something you can filter, cite, secure, and update. Metadata is the difference between \"here's a relevant paragraph\" and \"here's a relevant paragraph from the *Q3 Pricing* doc, section *Enterprise*, page 4, last edited June 2026, visible to the *finance* team.\" That extra context powers three things you'll absolutely need in production:" },
        { type: 'list', items: [
          "**Citations & trust** — `source`, `title`, `url`, `page` let you show *where* an answer came from. Ungrounded answers users can't verify don't get trusted.",
          "**Filtered retrieval** — `date`, `section`, `doc_type`, `language` let you narrow the search before or during the vector query (\"only the latest version,\" \"only English docs\"). Massively improves precision.",
          "**Security & multi-tenancy** — `permissions` / `tenant_id` / `acl` is non-negotiable for any app with more than one customer. You *filter by tenant at query time* so customer A can never retrieve customer B's chunk.",
        ] },
        { type: 'callout', variant: 'warn', title: 'Permission metadata is a security control, not a nice-to-have', text: "If you index everyone's documents into one shared vector store and forget the tenant/permission filter, a semantic search will happily return another customer's confidential chunk as \"most relevant.\" That's a data breach dressed up as a feature. Stamp `tenant_id` (and per-document ACLs where needed) onto every record at *ingestion* time, and enforce the filter on *every* query. Never rely on the LLM to \"just not mention\" data it retrieved — if it's in the context, it can leak." },
        { type: 'h', text: 'Embed in batches, not one call per chunk' },
        { type: 'p', text: "Embedding is a network call, and a naive loop that embeds one chunk per request will be slow and rate-limited into oblivion. Embedding APIs accept **arrays** — send 100–1000 texts per request and get back a vector each. Batching cuts latency and cost dramatically and keeps you under rate limits. Wrap it in retry-with-backoff, because at corpus scale you *will* hit transient 429s and 500s. This is ordinary resilient-API-client engineering, applied to embeddings." },
        { type: 'code', lang: 'python', filename: 'ingest.py', code: `import hashlib
from openai import OpenAI
from itertools import islice

client = OpenAI()

def batched(iterable, n):
    """Yield lists of up to n items."""
    it = iter(iterable)
    while (batch := list(islice(it, n))):
        yield batch

def embed_batch(texts):
    # One request → one vector per input. Batch to amortize latency & cost.
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return [d.embedding for d in resp.data]

def ingest(doc_text, source_meta, index):
    # 1. LOAD/PARSE happened upstream; assume doc_text is extracted text.
    # 2. CLEAN
    text = clean(doc_text)                      # strip boilerplate, fix whitespace
    # 3. CHUNK (structure-aware) with per-chunk metadata
    chunks = structure_aware_chunks(text)       # -> [{text, section}, ...]
    records = []
    for i, ch in enumerate(chunks):
        content_hash = hashlib.sha256(ch["text"].encode()).hexdigest()
        records.append({
            "id": f'{source_meta["doc_id"]}::{i}',
            "text": ch["text"],
            "content_hash": content_hash,        # for incremental re-indexing
            "metadata": {
                **source_meta,                   # source, title, url, tenant_id, permissions
                "section": ch["section"],
                "chunk_index": i,
            },
        })
    # 4. EMBED in batches
    for batch in batched(records, 256):
        vectors = embed_batch([r["text"] for r in batch])
        for r, v in zip(batch, vectors):
            r["embedding"] = v
    # 5. UPSERT (insert-or-update by id) into the vector index
    index.upsert(records)
    return len(records)`, caption: 'The five stages in one function: parse → clean → chunk (+metadata) → embed in batches → upsert. Note the per-chunk content_hash — that\'s what makes the next section (incremental re-indexing) possible.' },
      ],
    },
    {
      id: 'incremental-and-dedup',
      title: 'Documents change: re-index incrementally, and dedup',
      blocks: [
        { type: 'p', text: "Your first ingestion run is a one-time event. Then reality hits: docs get edited, pages get added, old files get deleted. The naive response — \"re-embed the entire corpus every night\" — is slow, expensive, and pointless when 99% of chunks are byte-for-byte identical to yesterday. The professional move is **incremental re-indexing**: only touch what actually changed." },
        { type: 'p', text: "The mechanism is a **content hash**. Hash each chunk's text (SHA-256 is fine). On re-ingestion, compare the new chunk's hash to the stored one for that chunk id:" },
        { type: 'list', items: [
          "**Hash unchanged** → skip it. No re-embed, no upsert. This is the 99% case and where all the savings live.",
          "**Hash changed** → re-embed just that chunk and upsert (overwrite by id).",
          "**New chunk id** → embed and insert.",
          "**Chunk id gone from the new version** → delete it from the index (the paragraph was removed).",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: git for your knowledge base', text: "Incremental re-indexing is `git diff` for embeddings. Git doesn't re-store your whole repo on every commit — it hashes content and only records what changed. Same idea: hash every chunk, and on each run compute the diff against what's indexed. Re-embed the changed chunks, add the new ones, delete the removed ones, leave the rest untouched. A 500-page manual where someone fixed one typo should cost you *one* re-embedded chunk, not 500." },
        { type: 'h', text: 'Deduplication: the same fact five times poisons retrieval' },
        { type: 'p', text: "Real corpora are full of duplicates: the same policy pasted into three wikis, a doc and its PDF export, boilerplate legalese on every page. If five near-identical chunks all match a query, they crowd out the top-k and your LLM sees the *same fact five times* instead of five *different* useful facts. [[Deduplication]] fixes this. Exact dupes are trivial — the content hash catches them (two chunks, same hash → keep one). *Near*-duplicates need a similarity check: embed, and if two chunks have cosine similarity above ~0.95, treat them as the same and keep one (ideally the one with the richer metadata or newer date)." },
        { type: 'callout', variant: 'info', title: 'Idempotency: run it twice, get the same index', text: "A well-built ingestion pipeline is *idempotent* — running it on unchanged data produces zero writes and an identical index. That property (stable chunk ids + content hashing + upsert-by-id) is what lets you safely re-run ingestion on a schedule, retry after a crash halfway through, or backfill without creating duplicate records. If re-running your pipeline doubles your index, it isn't finished." },
        { type: 'p', text: "Now build one. The playground below is a miniature end-to-end pipeline: a messy document goes in, and clean, chunked, metadata-stamped, index-ready records come out." },
        { type: 'playground', id: 'ingestion-lab', title: 'Build a mini ingestion pipeline', height: 560, code: `// A "messy" document: repeated boilerplate, whitespace chaos, section headers.
const rawDoc = \`
ACME DOCS — CONFIDENTIAL — Copyright (c) 2026 ACME Inc.

## Refund Policy
Customers may request a  refund within 30 days
of purchase. Refunds are issued to the
original payment method.

ACME DOCS — CONFIDENTIAL — Copyright (c) 2026 ACME Inc.

## Enterprise Plan
The Enterprise plan includes SSO, a dedicated
success manager, and a 99.9% uptime SLA.

ACME DOCS — CONFIDENTIAL — Copyright (c) 2026 ACME Inc.
\`

const sourceMeta = { doc_id: "acme-handbook", title: "ACME Handbook", tenant_id: "acme" }

// --- tiny content hash (djb2) so records are stable & diffable ---
const hash = (s) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(16)
}

// 1. CLEAN: drop boilerplate lines + collapse whitespace
function clean(text) {
  const lines = text.split("\\n")
  const counts = {}
  for (const l of lines) counts[l.trim()] = (counts[l.trim()] || 0) + 1
  return lines
    .filter((l) => counts[l.trim()] < 2)          // repeated line = boilerplate
    .join("\\n")
    .replace(/[ \\t]+/g, " ")                       // collapse runs of spaces
    .replace(/\\n{2,}/g, "\\n")                      // collapse blank lines
    .trim()
}

// 2. CHUNK: structure-aware — split on "## " section headings
function chunk(text) {
  return text
    .split(/\\n(?=## )/)                            // keep heading with its body
    .map((block) => {
      const [head, ...body] = block.trim().split("\\n")
      const section = head.replace(/^##\\s*/, "").trim()
      const content = body.join(" ").replace(/\\s+/g, " ").trim()
      return { section, text: content }
    })
    .filter((c) => c.text.length > 0)
}

// 3. RECORDS: attach per-chunk metadata + content hash (embed-ready)
function toRecords(chunks) {
  return chunks.map((c, i) => ({
    id: \`\${sourceMeta.doc_id}::\${i}\`,
    text: c.text,
    content_hash: hash(c.text),
    metadata: { ...sourceMeta, section: c.section, chunk_index: i },
  }))
}

const records = toRecords(chunk(clean(rawDoc)))
console.log("Produced", records.length, "index-ready records:\\n")
console.log(JSON.stringify(records, null, 2))`, solution: `// SOLUTION: add incremental re-indexing by content hash.
// Re-ingest a CHANGED doc and only re-embed the chunks that changed.
const rawDoc = \`
ACME DOCS — CONFIDENTIAL — Copyright (c) 2026 ACME Inc.

## Refund Policy
Customers may request a refund within 30 days of purchase.

ACME DOCS — CONFIDENTIAL — Copyright (c) 2026 ACME Inc.

## Enterprise Plan
The Enterprise plan includes SSO and a 99.9% uptime SLA.
\`
const sourceMeta = { doc_id: "acme-handbook", title: "ACME Handbook", tenant_id: "acme" }
const hash = (s) => { let h=5381; for (let i=0;i<s.length;i++) h=((h*33)^s.charCodeAt(i))>>>0; return h.toString(16) }
const clean = (t) => { const L=t.split("\\n"),c={}; for(const l of L)c[l.trim()]=(c[l.trim()]||0)+1; return L.filter(l=>c[l.trim()]<2).join("\\n").replace(/[ \\t]+/g," ").replace(/\\n{2,}/g,"\\n").trim() }
const chunk = (t) => t.split(/\\n(?=## )/).map(b=>{const[h,...r]=b.trim().split("\\n");return{section:h.replace(/^##\\s*/,"").trim(),text:r.join(" ").replace(/\\s+/g," ").trim()}}).filter(c=>c.text.length>0)
const toRecords = (cs) => cs.map((c,i)=>({id:\`\${sourceMeta.doc_id}::\${i}\`,text:c.text,content_hash:hash(c.text),metadata:{...sourceMeta,section:c.section,chunk_index:i}}))

// Pretend this is what's already in the index from a previous run:
const indexed = { "acme-handbook::0": "OLD-refund-hash", "acme-handbook::1": hash("The Enterprise plan includes SSO and a 99.9% uptime SLA.") }

const fresh = toRecords(chunk(clean(rawDoc)))
let embedded = 0, skipped = 0
for (const r of fresh) {
  if (indexed[r.id] === r.content_hash) { skipped++; continue }   // unchanged → skip
  embedded++                                                       // changed/new → re-embed
  console.log("RE-EMBED", r.id, "(", r.metadata.section, ")")
}
console.log(\`\\nRe-embedded \${embedded}, skipped \${skipped} unchanged. That's the savings.\`)`, caption: '**Exercise:** the base pipeline outputs clean records. Now make it *incremental* — given a set of already-indexed hashes, only re-embed chunks whose content_hash changed. (Solution provided — it\'s the git-diff trick in code.)' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your RAG chatbot gives vague, half-right answers. You\'ve tried a bigger embedding model and a reranker with no improvement. Where should you look FIRST?',
            options: [
              'Switch to a larger LLM for generation',
              'The ingestion pipeline — retrieval quality is capped by chunk quality; muddy chunks (boilerplate, mid-sentence splits, flattened tables) embed to muddy vectors',
              'Raise the temperature so answers are more creative',
              'Add more example prompts to the system message',
            ],
            answer: 1,
            explain: 'Garbage in, garbage retrieved. If chunks are polluted with boilerplate or split mid-idea, no downstream component recovers the lost signal. Ingestion quality is the ceiling on retrieval quality — fix the chunks before touching the model.',
          },
          {
            q: 'You\'re building RAG over a corpus that\'s mostly scanned contracts (photos of pages). What\'s the critical ingestion step you cannot skip?',
            options: [
              'Increasing the vector database\'s dimension count',
              'OCR — scanned pages are images with zero extractable text, so you must recognize characters from pixels before anything downstream can work',
              'Lowering the chunk overlap to zero',
              'Using cosine similarity instead of dot product',
            ],
            answer: 1,
            explain: 'A scanned document has no text layer — a normal extractor returns nothing. OCR converts pixels to characters. Its output is noisy (rn→m errors, mangled tables), so you also lean harder on cleaning. No OCR, no ingestion.',
          },
          {
            q: 'A multi-tenant SaaS indexes every customer\'s docs into one shared vector store. At query time it does a plain top-k semantic search with no filter. What is the most serious problem?',
            options: [
              'The index will be slightly slower to query',
              'A data breach — a search can return another tenant\'s confidential chunk as "most relevant"; permission/tenant metadata must be stamped at ingestion and filtered on every query',
              'Embeddings from different customers are incompatible',
              'Deduplication will stop working',
            ],
            answer: 1,
            explain: 'Semantic search ranks by meaning, not ownership — it will happily surface customer B\'s chunk to customer A. Permission/tenant_id metadata is a security control: attach it at ingestion, enforce the filter on every query. Never trust the LLM to "not mention" retrieved data.',
          },
          {
            q: 'A 500-page manual gets one typo fixed. Your nightly job re-embeds all ~2,000 chunks. What\'s the fix?',
            options: [
              'Embed only the first and last chunk of each document',
              'Incremental re-indexing: hash each chunk, compare to the stored hash, and only re-embed the chunks whose hash changed (here, just one)',
              'Switch to a cheaper embedding model to make the full re-embed affordable',
              'Delete and rebuild the entire index from scratch each night',
            ],
            answer: 1,
            explain: 'Content hashing turns re-indexing into a diff, like git. Unchanged hash → skip; changed → re-embed; new id → insert; missing id → delete. One typo should cost one re-embedded chunk, not two thousand. This is the standard production pattern.',
          },
          {
            q: 'The same refund policy is pasted into three different wiki pages in your corpus. A user asks about refunds. Why is this a retrieval problem, and what\'s the fix?',
            options: [
              'It isn\'t a problem — more copies means more confidence',
              'The three near-identical chunks crowd the top-k with one repeated fact, starving the LLM of other useful context; deduplication (content hash for exact, cosine > ~0.95 for near-dupes) keeps one copy',
              'The embedding model will crash on duplicate inputs',
              'Duplicates make cosine similarity return values above 1',
            ],
            answer: 1,
            explain: 'Duplicates waste your limited top-k slots: five copies of one fact displace five different facts the LLM could have used. Exact dupes are caught by content hash; near-dupes by a similarity threshold (~0.95 cosine). Keep the richest/newest copy, drop the rest.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l3-c1', front: 'What is a RAG ingestion pipeline, and why is it framed as data engineering?', back: 'The upstream 80%: load → parse/extract → clean → chunk (+metadata) → embed in batches → upsert. It\'s ETL with embeddings on the end — plumbing, not AI. Retrieval quality is capped by ingestion quality.' },
          { id: 'm7-l3-c2', front: 'Why are PDFs (especially scanned ones) the hardest source?', back: 'PDF is a layout format (glyphs at coordinates), so reading order, columns, and tables scramble on extraction. Scanned PDFs have no text at all — they\'re images requiring OCR, whose output is noisy.' },
          { id: 'm7-l3-c3', front: 'What is structure-aware chunking and why does it beat fixed-size slicing?', back: 'Split on the document\'s own boundaries (headings, sections, paragraphs) before falling back to size limits. Chunks aligned to one coherent idea embed to clean vectors; mid-sentence/mid-table splits embed to muddy ones.' },
          { id: 'm7-l3-c4', front: 'What metadata should you attach to each chunk, and why?', back: 'source/title/url/page (citations), date/section/doc_type (filtered retrieval), and permissions/tenant_id (security & multi-tenancy). Metadata is what makes a chunk filterable, citable, securable, and updatable.' },
          { id: 'm7-l3-c5', front: 'How does incremental re-indexing work?', back: 'Hash each chunk\'s content. On re-ingest, diff against stored hashes: unchanged → skip, changed → re-embed, new id → insert, missing id → delete. Like git for embeddings — one typo costs one chunk, not the whole doc.' },
          { id: 'm7-l3-c6', front: 'Why deduplicate, and how?', back: 'Near-identical chunks crowd the top-k with one repeated fact, starving the LLM of variety. Exact dupes: content hash. Near-dupes: cosine similarity above ~0.95. Keep the richest/newest copy, drop the rest.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Ingestion is the unglamorous 80% of RAG and it\'s a data-engineering job: load → parse → clean → chunk (+metadata) → embed in batches → upsert. Garbage in, garbage retrieved.',
          'Every source fights differently; PDFs are the worst (layout, tables, scans needing OCR). Clean out boilerplate and unicode junk before chunking.',
          'Chunk with structure awareness (split on headings/sections, then size), so each chunk is one coherent idea and embeds to a clean vector.',
          'Metadata (source, section, page, date, and especially permissions/tenant_id) powers citations, filtered retrieval, and multi-tenant security — attach it at ingestion.',
          'Embed in batches with retries; re-index incrementally by content hash (git-diff style); dedup exact (hash) and near (cosine > ~0.95) copies so the pipeline is cheap and idempotent.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Chunking before cleaning', text: 'If you split first, boilerplate footers and nav menus end up baked into your chunks — permanently polluting their embeddings. Clean the full document first (strip repeated lines, fix whitespace/unicode), then chunk the clean text.' },
          { title: 'Letting tables dissolve into word soup', text: 'A flattened table (`Plan Price Seats Pro 49 10`) loses the column relationships that carried its meaning. Extract tables separately and render each row as a self-describing sentence, or keep them as Markdown/HTML so structure survives into the chunk.' },
          { title: 'Forgetting permission/tenant metadata', text: 'Indexing all tenants into one store without a tenant_id filter means a semantic search can return another customer\'s data as the top hit. That\'s a breach. Stamp permissions at ingestion and enforce the filter on every single query.' },
          { title: 'Re-embedding the entire corpus on every change', text: 'Naively re-ingesting everything nightly is slow, expensive, and pointless when 99% of chunks are unchanged. Hash chunks and diff — re-embed only what changed. Without stable ids + hashing, you also risk duplicating records on every run.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through how you\'d build an ingestion pipeline for a RAG system over mixed documents."', a: 'I treat it as ETL. For each source I pick a loader (pdfplumber/PyMuPDF for PDFs, trafilatura for HTML, python-docx for Office, the API for Notion), with OCR for scanned pages. Then I clean — strip repeated boilerplate lines statistically, normalize unicode, collapse whitespace. Then structure-aware chunking: split on headings/sections, recurse down to paragraphs, cap size, add small overlap. Each chunk gets metadata (source, title, section, page, date, and tenant/permissions) plus a content hash. I embed in batches of a few hundred with retry-and-backoff, and upsert by stable id into the vector store. Re-runs are incremental via the content hash, and I dedup exact and near-duplicate chunks. The whole thing is idempotent so I can safely schedule and retry it.' },
          { q: '"Why is ingestion often the hardest part of a RAG project?"', a: 'Because retrieval quality is capped by chunk quality, and real-world documents are hostile. PDFs store layout, not structure, so extraction scrambles columns and destroys tables; scans need OCR that introduces noise; HTML is buried in boilerplate; every source has its own failure mode. None of that is glamorous AI work — it\'s data-engineering plumbing — but it\'s where retrieval quality is actually won or lost. The embedding and generation steps are comparatively trivial.' },
          { q: '"A customer edits one paragraph in a 300-page document. How does your system handle re-indexing efficiently?"', a: 'Incremental re-indexing via content hashing. Each chunk carries a hash of its text and a stable id. On re-ingestion I re-chunk the document and diff the new hashes against what\'s stored: unchanged hashes are skipped, the changed chunk is re-embedded and upserted, any brand-new chunk is inserted, and any chunk id that disappeared is deleted. So one edited paragraph costs one re-embedded chunk, not 300. It\'s conceptually git diff for the knowledge base.' },
          { q: '"How do you prevent cross-tenant data leakage in a shared vector store?"', a: 'Metadata plus enforced filtering. At ingestion I stamp every chunk with a tenant_id (and per-document ACLs where the model is finer-grained). At query time I always constrain the vector search to the requesting tenant\'s id — a pre-filter or metadata filter on the ANN query — so another tenant\'s chunks are never even candidates. I never rely on the LLM to withhold retrieved data; if it\'s in the context window, assume it can leak, so the control has to be at retrieval time.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Enterprise "chat with your docs"', text: 'A company points a bot at Confluence, Google Drive, and a pile of PDFs. The ingestion pipeline is 90% of the build: connectors per source, OCR for scanned policies, per-page metadata for citations, and tenant/permission filters so employees only retrieve what they\'re allowed to see.' },
          { title: 'Support knowledge base sync', text: 'Help-center articles change constantly. A scheduled incremental pipeline hashes each chunk and re-embeds only edited articles nightly, keeping the assistant current without re-embedding the whole KB every run.' },
          { title: 'Financial / legal document search', text: 'Contracts and filings are table-heavy scanned PDFs. Ingestion leans on OCR plus dedicated table extraction (rows rendered as sentences), with page and clause metadata so answers cite the exact source paragraph.' },
          { title: 'Codebase & wiki assistants', text: 'Dev-tool assistants ingest repos and internal wikis, chunking on file/function and heading boundaries, attaching path/section metadata, and re-indexing incrementally on each commit so the assistant reflects the latest code.' },
        ] },
        { type: 'project', title: 'Build an ingestion function', goal: 'Write a function that turns a raw document + source metadata into clean, chunked, metadata-stamped records that are ready to embed.', steps: [
          'Take two inputs: `docText` (a messy multi-section string with repeated boilerplate) and `sourceMeta` (doc_id, title, tenant_id).',
          'Clean: remove lines that repeat across the document (boilerplate), collapse whitespace, and normalize obvious unicode junk.',
          'Chunk with structure awareness: split on section headings first; if a section is too long, fall back to splitting on paragraphs, capping chunk size.',
          'For each chunk, produce a record with a stable id (`${doc_id}::${index}`), the text, a content hash, and metadata merging sourceMeta with { section, chunk_index }.',
          'Return the array of records and print it. Verify: no boilerplate survives, each chunk is one coherent section, and every record carries its metadata and hash.',
        ], deliverable: 'An `ingest(docText, sourceMeta)` function (JS or Python) that outputs embed-ready records, demonstrated on a messy sample document.' },
        { type: 'challenge', title: 'Handle a changed document incrementally', text: 'Extend your ingest function so that re-running it on an *edited* version of a document only re-embeds the chunks that actually changed. Simulate an "index" as a map of chunk id → content hash, feed in a lightly-edited version of the doc, and prove that only the changed/new chunks are marked for re-embedding while unchanged ones are skipped (and removed chunks are deleted).', hints: [
          'Compute a content hash (SHA-256 or a simple djb2) per chunk and store it alongside the record id.',
          'On re-ingest, diff the fresh chunks against the stored hashes: unchanged → skip, changed → re-embed, new id → insert, id present before but absent now → delete.',
          'Log a summary line ("re-embedded 1, skipped 47, deleted 0") — that count is the whole point: it proves you\'re not re-embedding the world.',
        ] },
        { type: 'reading', links: [
          { label: 'LlamaIndex: Data Connectors (LlamaHub)', url: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/connector/', note: 'The standard library of loaders for PDFs, Notion, databases, and dozens more sources — the "extract" half of ingestion, batteries included.' },
          { label: 'Unstructured: document parsing & preprocessing', url: 'https://docs.unstructured.io/welcome', note: 'A production-grade toolkit for extracting clean, structured text (incl. OCR and table handling) from messy real-world documents.' },
          { label: 'Pinecone: Chunking strategies for RAG', url: 'https://www.pinecone.io/learn/chunking-strategies/', note: 'A practical, benchmarked walkthrough of chunk sizing, overlap, and structure-aware splitting — the transform half of ingestion.' },
        ] },
      ],
    },
  ],
}
