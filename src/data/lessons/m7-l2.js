// Lesson 7.2 — RAG Architecture End-to-End

export default {
  sections: [
    {
      id: 'two-flows',
      title: 'RAG is two pipelines wearing one name',
      blocks: [
        { type: 'p', text: "Last lesson you learned *why* [[RAG]] exists: hand the model the right page before it answers. This lesson is the *how* — the full architecture, wired end to end. And the first thing to internalize is that \"RAG\" is really **two separate pipelines** that run at completely different times, on different schedules, with different performance budgets. Confuse them and every design decision gets muddy; separate them and the whole system snaps into focus." },
        { type: 'p', text: "The **ingest** pipeline (also called *indexing*) runs **once, ahead of time**, or whenever your documents change. It takes raw docs, splits them into chunks, embeds each chunk into a vector, and loads those vectors into a [[Vector Database]]. It's a batch job. Nobody is waiting on it. If it takes ten minutes to index your entire wiki, fine — you run it on a schedule, not on the request path." },
        { type: 'p', text: "The **query** pipeline runs **on every single request**, while a user waits. It embeds the incoming question, retrieves the top-K nearest chunks from the vector DB, assembles them into an augmented prompt (system + context + question), calls the LLM, and returns a grounded answer with citations. This is the hot path. Every millisecond and every token here costs you latency and money at scale." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: building the library vs. answering at the reference desk', text: "**Ingest is building and shelving the library.** You take a truckload of books, break them into catalogued sections, and file each one by topic so it can be found later. Slow, careful, done once — and re-done only when new books arrive. **Query is the librarian at the reference desk.** A patron walks up with a question; the librarian darts to the right shelves, grabs the three most relevant passages, and hands them over with the answer and the shelf numbers. The shelving must already be done — the librarian can't re-catalogue the whole building for every question. Two jobs, two clocks." },
        { type: 'p', text: "Hold that split in your head for the rest of the lesson. Almost every RAG design question — *how big should chunks be? how many do I retrieve? where do I put them in the prompt?* — is really a question about one of these two pipelines. Let's walk both, stage by stage, and mark exactly where things break and where the levers are." },
      ],
    },
    {
      id: 'the-map',
      title: 'The whole architecture on one map',
      blocks: [
        { type: 'p', text: "Below is the signature RAG map — both pipelines drawn together so you can see how they meet. The two flows share exactly **one** component: the [[Vector Database]]. Ingest *writes* to it; query *reads* from it. That shared store is the seam of the entire system — the ingest pipeline's only job is to fill it well, and the query pipeline's only job is to pull from it well." },
        { type: 'diagram', id: 'rag-architecture', caption: 'Two flows, one shared vector store. Top (ingest, offline): docs → chunk → embed → store. Bottom (query, per-request): question → embed → retrieve top-K → build prompt → LLM → grounded answer.' },
        { type: 'h', text: 'Ingest, stage by stage (the offline half)' },
        { type: 'list', items: [
          "**Load** — pull the raw source: PDFs, HTML, Markdown, Notion pages, database rows. Strip boilerplate (nav bars, footers) so you embed *content*, not chrome.",
          "**Chunk** — split each document into passages small enough to be a precise retrieval unit but large enough to stand alone (whole lesson: [[Chunking]]). This is where most RAG quality is won or lost.",
          "**Embed** — run every chunk through an embedding model (Module 5) to get a vector. Whatever model you pick here, you are **married to it** — queries must use the exact same model.",
          "**Store** — write each vector, plus its original text and metadata (source, title, URL, section), into the [[Vector Database]]. The metadata is what lets you cite and filter later.",
        ] },
        { type: 'h', text: 'Query, stage by stage (the per-request half)' },
        { type: 'list', items: [
          "**Embed the question** — the same embedding model turns the user's question into a vector living in the same space as your chunks.",
          "**Retrieve top-K** — nearest-neighbor search by [[Cosine Similarity]] returns the K most relevant chunks (K is typically 3–8). This is the R in RAG.",
          "**Augment** — assemble the prompt: system instructions + the retrieved chunks as CONTEXT + the user's question. This prompt-assembly step is the soul of RAG and the focus of this lesson.",
          "**Generate** — the LLM reads the context and writes an answer *grounded* in it (Module 1's [[Grounding]]), ideally citing which chunks it used.",
        ] },
        { type: 'callout', variant: 'info', title: 'The one rule that ties the halves together', text: "The embedding model in **ingest** and the embedding model in **query** must be **identical** — same provider, same model, same version. Vectors from two different models live in incompatible coordinate systems; comparing them is like measuring one arrow in miles and the other in kilograms. If you ever re-embed your corpus with a new model, you must re-embed *and* re-index everything, and switch the query side in lockstep. This single constraint quietly dictates a lot of RAG ops." },
      ],
    },
    {
      id: 'step-through',
      title: 'Step through a live request',
      blocks: [
        { type: 'p', text: "Reading the map is one thing; watching data flow through it is another. The simulator below walks a single question through the query pipeline one stage at a time — question in, embedding, retrieval scores, the assembled prompt, the grounded answer out. Step through it slowly and watch the **prompt get built**: notice how the retrieved chunks get wrapped, labeled, and fenced off from the instructions. That assembly is the part beginners skip and seniors obsess over." },
        { type: 'demo', id: 'rag-pipeline-sim' },
        { type: 'p', text: "Two things to watch for as you step. First, **retrieval happens before the LLM is ever called** — by the time the model sees anything, the interesting decision (which chunks?) is already made. If the wrong chunks came back, the model is doomed no matter how good it is. Second, the **prompt has a rigid skeleton**: instructions, then a clearly delimited CONTEXT block, then the question. That structure isn't decoration — it's what lets the model tell *your rules* apart from *the retrieved facts* apart from *the user's ask*." },
        { type: 'callout', variant: 'warn', title: 'Where each stage fails', text: "Every stage has a signature failure. **Chunking** too big → retrieval returns a wall of mostly-irrelevant text; too small → the answer is split across chunks you didn't retrieve. **Embedding** mismatch → garbage similarity scores. **Retrieval** K too low → the answer's chunk never gets pulled; K too high → you drown the good chunk in noise and pay for it. **Assembly** → chunks pasted with no delimiters, or instructions the model can ignore, or the key chunk buried in the middle (more on that next). **Generation** → the model answers from its own memory instead of the context, or won't admit when the context lacks the answer. Debugging RAG is mostly figuring out *which* stage betrayed you." },
      ],
    },
    {
      id: 'prompt-assembly',
      title: 'Prompt assembly: the stage that makes or breaks it',
      blocks: [
        { type: 'p', text: "Retrieval gets the glory, but **prompt assembly is where good retrieval turns into a good answer — or gets wasted.** You pulled five great chunks; now you have to present them to the model in a way that makes it *use only them*, *cite them*, and *refuse gracefully* when they don't contain the answer. Get this wrong and even perfect retrieval yields a confident hallucination." },
        { type: 'h', text: 'Anatomy of a RAG prompt' },
        { type: 'p', text: "A production RAG prompt keeps three things visually and structurally separate so the model never confuses them:" },
        { type: 'list', items: [
          "**System instructions** — the grounding rules: *answer using ONLY the context, cite your sources, and say \"I don't know\" if the context doesn't cover it.* These are your guardrails against hallucination.",
          "**Context block** — the retrieved chunks, each clearly delimited and ideally labeled with a source id so the model can cite it. Fence it off (headers, tags, numbered blocks) so it can't bleed into the instructions.",
          "**The question** — the user's actual ask, placed so it reads as the thing to answer, not part of the data.",
        ] },
        { type: 'code', lang: 'javascript', filename: 'assemble_prompt.js', code: `// Turn retrieved chunks into a grounded, citable prompt.
function buildPrompt(chunks, question) {
  // Label each chunk so the model can cite it by id.
  const context = chunks
    .map((c, i) => \`[\${i + 1}] (source: \${c.source})\\n\${c.text}\`)
    .join("\\n\\n")

  const system = [
    "You are a support assistant. Follow these rules exactly:",
    "1. Answer using ONLY the numbered CONTEXT below.",
    "2. Cite the chunk id(s) you used, like [1] or [2].",
    "3. If the CONTEXT does not contain the answer, reply",
    "   \\"I don't have that information\\" — do NOT use outside knowledge.",
  ].join("\\n")

  const user = \`CONTEXT:\\n\${context}\\n\\nQUESTION: \${question}\`
  return { system, user }
}

// Example shape of what goes in:
// chunks = [{ source: "billing.md", text: "Enterprise SLA is 4 hours." }, ...]`, caption: 'The numbered, source-labeled context block is what makes citations possible — the model can point back to [1] because you gave [1] a name.' },
        { type: 'h', text: 'The context-ordering trap: "lost in the middle"' },
        { type: 'p', text: "Remember from Module 1 that models don't attend evenly across a long context — they reliably weight the **beginning** and the **end** far more than the **middle**. This *lost-in-the-middle* effect is a real, measured failure mode, and RAG walks straight into it: you paste 5–8 chunks and the most important one might land in position 4, exactly where the model's attention sags." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the meeting where only the first and last speakers are remembered', text: "You've been in the hour-long meeting where eight people present. A week later everyone remembers the opening pitch and the closing ask — the six talks in the middle are a blur. LLMs read long context the same way. So if your single most relevant chunk is speaker number four, it might as well not have shown up. The fix is the same one a good facilitator uses: **put the most important item first or last, never buried in the middle.**" },
        { type: 'callout', variant: 'tip', title: 'Practical assembly levers', text: "Rank retrieved chunks by relevance, then **place the strongest chunks at the start and end** of the context block, weakest in the middle (some teams literally reorder to a \"\\u2228\" shape). Keep K modest — 3–5 strong chunks usually beat 15 mediocre ones, both for accuracy and cost. De-duplicate near-identical chunks so you don't spend the context budget saying the same thing twice. And always delimit chunks clearly; a model that can't tell where one source ends and the next begins will blend them into a mush." },
      ],
    },
    {
      id: 'in-code',
      title: 'Build the whole loop (runnable)',
      blocks: [
        { type: 'p', text: "Time to wire all of it together. The playground below is a **complete, tiny RAG system** over a baked-in corpus: it chunks the docs, mock-embeds them into an in-memory index, and then for a question it embeds the query, retrieves the top-K by cosine similarity, assembles the grounded prompt, and calls the sandbox `llm()`. This is the exact architecture from the map — just miniaturized so it runs in your browser. Read it top to bottom; it's the shape of every RAG app you'll ever build." },
        { type: 'playground', id: 'mini-rag', title: 'A mini end-to-end RAG pipeline', height: 620, code: `// ===== INGEST (runs once) =====
// A tiny corpus. In real life these are PDFs, wiki pages, tickets.
const DOCS = [
  { source: "billing.md", text: "The Enterprise plan costs $900/month, billed annually. It includes a 4-hour support SLA and a dedicated Slack channel." },
  { source: "billing.md", text: "The Starter plan is $29/month with 48-hour email support. There is no phone support on Starter." },
  { source: "security.md", text: "All data is encrypted at rest and in transit. We are SOC 2 Type II certified and host in EU and US regions." },
  { source: "product.md", text: "The export feature supports CSV and JSON. Exports over 1GB are delivered as a downloadable link via email." },
]

// Mock embedding: a real API returns ~1536 floats; we fake a small vector
// from word presence so cosine similarity still works for the demo.
const VOCAB = ["enterprise","plan","cost","price","sla","support","slack",
  "starter","email","data","encrypted","soc","region","export","csv","json"]
function embed(text) {
  const t = text.toLowerCase()
  return VOCAB.map(w => (t.includes(w) ? 1 : 0))
}

// Build the in-memory "vector DB": each chunk + its vector + metadata.
const INDEX = DOCS.map(d => ({ ...d, vector: embed(d.text) }))

// ===== QUERY (runs per request) =====
const dot  = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a) => Math.sqrt(dot(a, a)) || 1e-9
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))

function retrieve(question, k = 2) {
  const q = embed(question)
  return INDEX
    .map(chunk => ({ ...chunk, score: cosine(q, chunk.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

function buildPrompt(chunks, question) {
  const context = chunks
    .map((c, i) => \`[\${i + 1}] (\${c.source}) \${c.text}\`)
    .join("\\n")
  const system = \`You are a support assistant. Answer using ONLY the CONTEXT.
Cite the chunk id you used, like [1]. If the answer is not in the
CONTEXT, say "I don't have that information."

CONTEXT:
\${context}\`
  return { system, question }
}

async function rag(question) {
  const chunks = retrieve(question, 2)
  console.log("Q:", question)
  console.log("Retrieved chunks:")
  chunks.forEach((c, i) => console.log(\`  [\${i + 1}] \${c.score.toFixed(2)} \${c.source}\`))
  const { system, question: q } = buildPrompt(chunks, question)
  const answer = await llm(q, { system })
  console.log("Answer:", answer, "\\n")
}

await rag("How much is the Enterprise plan and what's its SLA?")
await rag("Where is our data hosted?")`, solution: `// SOLUTION: add citation-forcing + graceful abstention, and prove it
// abstains on a question the corpus can't answer.
const DOCS = [
  { source: "billing.md", text: "The Enterprise plan costs $900/month, billed annually. It includes a 4-hour support SLA and a dedicated Slack channel." },
  { source: "security.md", text: "All data is encrypted at rest and in transit. We are SOC 2 Type II certified and host in EU and US regions." },
]
const VOCAB = ["enterprise","plan","cost","sla","support","data","encrypted","soc","region","refund","mobile","app"]
const embed = (t) => VOCAB.map(w => (t.toLowerCase().includes(w) ? 1 : 0))
const INDEX = DOCS.map(d => ({ ...d, vector: embed(d.text) }))
const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0)
const norm = (a) => Math.sqrt(dot(a,a)) || 1e-9
const cosine = (a,b) => dot(a,b)/(norm(a)*norm(b))

function retrieve(q, k=2) {
  const qv = embed(q)
  return INDEX.map(c => ({ ...c, score: cosine(qv, c.vector) }))
    .sort((a,b)=>b.score-a.score).slice(0, k)
}
async function rag(question) {
  const chunks = retrieve(question, 2)
  const context = chunks.map((c,i)=>\`[\${i+1}] (\${c.source}) \${c.text}\`).join("\\n")
  const system = \`Answer ONLY from CONTEXT and cite the id like [1].
If CONTEXT lacks the answer, reply exactly: "I don't have that information."

CONTEXT:
\${context}\`
  console.log("Q:", question)
  console.log(await llm(question, { system }), "\\n")
}
await rag("What's the Enterprise SLA?")          // grounded + cited
await rag("Do you offer refunds on the mobile app?")  // NOT in corpus -> abstain
// The second call should refuse instead of inventing a refund policy.`, caption: '**Exercise:** run it, then (1) change K from 2 to 1 and find a question that now fails because its chunk got cut, and (2) ask something the corpus does NOT cover and confirm the model abstains instead of hallucinating. The solution shows the abstain pattern.' },
        { type: 'h', text: 'The same chain in Python (production shape)' },
        { type: 'p', text: "In production you swap the mock embedder for a real embedding API and the in-memory array for a vector DB — but the three moves are identical: **retrieve → format the prompt → generate.** Here's the idiomatic Python, written plainly so you can see the arrow, then the same thing as a composable LangChain chain." },
        { type: 'code', lang: 'python', filename: 'rag_pipeline.py', code: `import numpy as np
from openai import OpenAI
from anthropic import Anthropic

oai = OpenAI()          # embeddings
claude = Anthropic()    # generation

# ---- INGEST (once): chunk -> embed -> store ----
DOCS = [
    {"source": "billing.md", "text": "Enterprise plan: $900/mo billed annually, 4-hour support SLA, dedicated Slack."},
    {"source": "security.md", "text": "Data encrypted at rest and in transit. SOC 2 Type II. Hosted in EU and US."},
    {"source": "product.md",  "text": "Export supports CSV and JSON. Exports over 1GB arrive as an emailed link."},
]

def embed(texts):
    resp = oai.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in resp.data])

# The "vector DB": in real life this is Pinecone / pgvector / Chroma.
INDEX = [{**d, "vec": v} for d, v in zip(DOCS, embed([d["text"] for d in DOCS]))]

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# ---- QUERY (per request): embed -> retrieve -> augment -> generate ----
def retrieve(question, k=3):
    qv = embed([question])[0]
    ranked = sorted(INDEX, key=lambda c: cosine(qv, c["vec"]), reverse=True)
    return ranked[:k]

def answer(question):
    chunks = retrieve(question, k=3)
    context = "\\n".join(f"[{i+1}] ({c['source']}) {c['text']}"
                         for i, c in enumerate(chunks))
    system = (
        "Answer using ONLY the CONTEXT. Cite the chunk id like [1]. "
        "If the CONTEXT lacks the answer, say you don't have that information."
    )
    resp = claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        system=system,
        messages=[{"role": "user",
                   "content": f"CONTEXT:\\n{context}\\n\\nQUESTION: {question}"}],
    )
    return resp.content[0].text

print(answer("What's the Enterprise SLA and does it include Slack?"))
# -> "The Enterprise plan has a 4-hour support SLA and a dedicated Slack channel [1]."`, caption: 'retrieve → augment → generate, made literal. Note embeddings and generation can come from different providers — the embedding model just has to match between ingest and query.' },
        { type: 'code', lang: 'python', filename: 'rag_chain_langchain.py', code: `# The same pipeline as a composable LangChain chain.
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# INGEST: built once from your documents.
store = Chroma.from_texts(
    texts=[d["text"] for d in DOCS],
    embedding=OpenAIEmbeddings(model="text-embedding-3-small"),
    metadatas=[{"source": d["source"]} for d in DOCS],
)
retriever = store.as_retriever(search_kwargs={"k": 3})  # top-3 chunks

prompt = ChatPromptTemplate.from_template(
    "Answer using ONLY the context and cite the source. "
    "If it's not there, say you don't know.\\n\\n"
    "Context:\\n{context}\\n\\nQuestion: {question}"
)
llm = ChatOpenAI(model="gpt-4o-mini")

def format_docs(docs):
    return "\\n\\n".join(f"({d.metadata['source']}) {d.page_content}" for d in docs)

# QUERY: the retrieve -> augment -> generate arrow, as one object.
chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
)

print(chain.invoke("What's the Enterprise support SLA?").content)`, caption: 'Each stage is swappable: change the vector store, the K, the prompt, or the model independently. That modularity is why this is the default architecture for knowledge apps.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'In a RAG system, which stages run ONCE (offline, ahead of time) versus on EVERY user request?',
            options: [
              'Everything runs on every request — RAG has no offline phase',
              'Chunking runs per request; everything else is offline',
              'Chunking and embedding the documents run offline (ingest); embedding the question, retrieval, prompt assembly, and generation run per request (query)',
              'Only generation runs per request; retrieval is precomputed for all possible questions',
            ],
            answer: 2,
            explain: 'RAG is two pipelines. Ingest (load → chunk → embed → store) is a batch job you run once or when docs change — no user is waiting. Query (embed question → retrieve top-K → assemble prompt → generate) runs on the hot path for every request. You can\'t precompute retrieval because you don\'t know the questions in advance.',
          },
          {
            q: 'You built your vector index six months ago using one embedding model. Today you want to switch to a newer, better embedding model for the query side only, to save time. What happens?',
            options: [
              'It works fine — embedding models are interchangeable',
              'Retrieval breaks: query vectors from the new model live in a different space than the stored chunk vectors, so similarity scores become meaningless. You must re-embed and re-index the whole corpus with the new model too',
              'It works but is slightly slower',
              'Only the citations break; retrieval is unaffected',
            ],
            answer: 1,
            explain: 'The ingest and query embedding models must be identical — same provider, model, and version. Vectors from two different models are incompatible coordinate systems. Switching one side silently corrupts every similarity score. Upgrading an embedding model means re-embedding and re-indexing the entire corpus and switching the query side in lockstep.',
          },
          {
            q: 'Your retrieval is excellent — the correct chunk is always in the top 5 returned — but the model still sometimes ignores it and gives a wrong answer. It\'s the 3rd of 5 chunks in the prompt. Most likely cause?',
            options: [
              'The embedding model is broken',
              'The vector database is corrupted',
              'You need to retrieve more chunks (higher K)',
              'The "lost in the middle" effect — models attend most to the start and end of context, so a critical chunk buried in the middle can be under-weighted. Reorder to put the strongest chunk first or last',
            ],
            answer: 3,
            explain: 'This is a prompt-assembly problem, not a retrieval problem — retrieval already succeeded. Models weight the beginning and end of a long context far more than the middle. The fix is ordering: rank chunks by relevance and place the strongest at the edges. Raising K would make it worse by adding more middle to get lost in.',
          },
          {
            q: 'What is the single most important instruction to include in a RAG system prompt to reduce hallucination?',
            options: [
              'Tell the model to be creative and thorough',
              'Instruct it to answer using ONLY the provided context and to say it doesn\'t know when the context lacks the answer',
              'Ask it to use its full training knowledge to fill gaps',
              'Set a very low temperature',
            ],
            answer: 1,
            explain: 'The grounding rule — "use only the context; if it\'s not there, say you don\'t know" — is the core guardrail. Without it, the model happily blends retrieved facts with its own fuzzy memory and hallucinates around gaps. Explicit permission to abstain is what turns a confident liar into a trustworthy assistant. (A worse alternative — "fill gaps from training" — invites exactly the hallucination RAG exists to prevent.)',
          },
          {
            q: 'A teammate wants to improve answer quality by cranking K from 4 to 20 retrieved chunks. What\'s the most likely result?',
            options: [
              'Strictly better answers — more context is always better',
              'No change at all',
              'Often worse answers plus higher cost and latency: the one relevant chunk gets diluted by 16 mediocre ones, more content lands in the ignored "middle", and you pay for every extra token',
              'The retrieval step will now run offline',
            ],
            answer: 2,
            explain: 'More retrieval is not more signal. A large K drowns the strong chunks in weak ones, pushes content into the low-attention middle, inflates token cost and latency, and raises the chance of contradictory chunks confusing the model. Usually 3–5 well-ranked chunks beat 20. Tune K deliberately; bigger is not better.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l2-c1', front: 'What are the two pipelines in a RAG system?', back: '**Ingest** (offline, once/on-change): load → chunk → embed → store in vector DB. **Query** (per-request, hot path): embed question → retrieve top-K → assemble prompt → generate. They share one component: the [[Vector Database]].' },
          { id: 'm7-l2-c2', front: 'What are the four query-time stages, in order?', back: '1) Embed the question, 2) Retrieve top-K chunks by [[Cosine Similarity]], 3) Augment — assemble system + context + question, 4) Generate a grounded, cited answer. Retrieval happens *before* the LLM is ever called.' },
          { id: 'm7-l2-c3', front: 'Why must the ingest and query embedding models be identical?', back: 'Vectors from different models live in incompatible coordinate systems, so cosine similarity between them is meaningless. Same provider/model/version on both sides. Upgrading means re-embedding and re-indexing the entire corpus.' },
          { id: 'm7-l2-c4', front: 'What are the three parts of a RAG prompt, kept separate?', back: '**System instructions** (grounding rules: use only context, cite, abstain), a delimited **context block** of labeled retrieved chunks, and the **user question**. Clear delimiters stop the model from confusing rules, facts, and the ask.' },
          { id: 'm7-l2-c5', front: 'What is "lost in the middle" and how do you fix it in RAG?', back: 'Models attend most to the start and end of a long context and under-weight the middle. If your best chunk lands in the middle, it may be ignored. Fix: rank chunks and place the strongest first and last, weakest in the middle.' },
          { id: 'm7-l2-c6', front: 'How do you make a RAG system cite sources and abstain?', back: 'Label each context chunk with an id/source, and instruct the model to cite the id it used and to reply "I don\'t know" when the context lacks the answer. Citations come from the metadata you stored at ingest time.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'RAG is two pipelines: **ingest** (offline: load → chunk → embed → store) and **query** (per-request: embed question → retrieve top-K → augment → generate). They meet at the shared vector database.',
          'The ingest and query embedding models must be the *same model*; different models produce incompatible vector spaces and meaningless similarity scores.',
          'Prompt assembly is where retrieval pays off: keep system rules, a delimited context block of labeled chunks, and the question separate — and instruct the model to use only the context, cite it, and abstain when it can\'t answer.',
          'Beware "lost in the middle": models under-weight the center of long context, so place the strongest retrieved chunks at the start and end.',
          'Every stage has a signature failure (chunk size, embedding mismatch, wrong K, sloppy assembly, ungrounded generation). Debugging RAG is identifying which stage betrayed you.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Treating ingest and query as one flow', text: 'Conflating the offline index-building with the per-request hot path leads to bad decisions — like optimizing chunking for speed (it doesn\'t matter, it\'s offline) or re-embedding documents on every request (catastrophic). Separate the two clocks: ingest is batch, query is latency-critical.' },
          { title: 'Mismatched embedding models between ingest and query', text: 'The silent killer. If you embed documents with one model and questions with another (or upgrade one side without the other), similarity scores become noise and retrieval quietly returns garbage. Always pin the exact same embedding model and version on both sides.' },
          { title: 'Dumping chunks into the prompt with no structure', text: 'Pasting raw retrieved text with no delimiters, labels, or grounding instructions lets the model blur your rules, the facts, and the question together — and answer from its own memory. Fence the context, label each chunk, and state the grounding rules explicitly.' },
          { title: 'Assuming more retrieved chunks = better answers', text: 'Cranking K drowns the one relevant chunk in noise, buries content in the ignored middle, and inflates cost and latency. Retrieval quality beats retrieval quantity; 3–5 well-ranked, well-ordered chunks usually outperform 20.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through the architecture of a RAG system end to end."', a: 'It\'s two pipelines. The ingest pipeline runs offline: I load the source documents, chunk them into passages, embed each chunk with an embedding model, and store the vectors plus their text and metadata in a vector database. The query pipeline runs per request: I embed the user\'s question with the same embedding model, do a nearest-neighbor search to retrieve the top-K most similar chunks, assemble a prompt that keeps the system grounding rules, the retrieved context, and the question separate, and send that to the LLM to generate an answer grounded in the context with citations. The two pipelines share only the vector store — ingest writes to it, query reads from it.' },
          { q: '"Retrieval is returning the right documents, but the final answers are still poor. How do you debug?"', a: 'Since retrieval is confirmed good, the problem is downstream — in assembly or generation. First I check ordering: if the key chunk sits in the middle of many chunks, the "lost in the middle" effect may be under-weighting it, so I reorder strongest-first-and-last. Then I check the prompt structure and instructions: are chunks clearly delimited, and does the system prompt explicitly say to use only the context and to abstain when it\'s missing? A weak grounding instruction lets the model answer from its own memory. I\'d also check K — too many chunks dilute the signal — and whether near-duplicate chunks are wasting the context. Retrieval and generation fail differently; isolating which one is the whole game.' },
          { q: '"Why do the embedding models on the ingest and query sides have to match?"', a: 'Because an embedding model defines a specific coordinate system for meaning, and two different models produce incompatible spaces — the same sentence maps to totally different vectors. Retrieval works by measuring cosine similarity between the question vector and the stored chunk vectors, and that comparison is only meaningful if both live in the same space. Mix models and the scores are noise, so you silently retrieve irrelevant chunks. It also has an ops consequence: upgrading to a better embedding model isn\'t a one-line change — you have to re-embed and re-index the entire corpus and switch the query side at the same time.' },
          { q: '"How do you get a RAG system to cite its sources and refuse to answer when it can\'t?"', a: 'Two moves. For citations, I carry metadata through the pipeline: at ingest I store each chunk\'s source (title, URL, section), and at assembly I label each chunk in the context with an id and source, then instruct the model to cite the id it used. Because it retrieved a specific chunk, I can always trace and link the answer. For abstention, I put an explicit rule in the system prompt: answer using only the provided context, and if the context doesn\'t contain the answer, say so instead of guessing. That permission to say "I don\'t know" is what prevents the model from filling gaps with hallucinations — and I\'d test it with a deliberately unanswerable question to confirm it abstains.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Support bot with source links', text: 'A help-center assistant ingests every article once, and each question retrieves the relevant chunks and answers grounded in them with a "source: [article]" link. The two-pipeline design means editing an article and re-ingesting it updates answers with zero model changes.' },
          { title: 'Internal knowledge assistant with access control', text: 'A company wiki bot stores per-document permissions as metadata at ingest time, then filters retrieval per user at query time — so employees only get answers grounded in documents they\'re allowed to see. The architecture makes access control a retrieval-filter concern, not a model concern.' },
          { title: 'Contract / document Q&A with citations', text: 'Legal and finance tools chunk long PDFs, embed them, and at query time retrieve and cite the exact clauses used — the labeled-chunk assembly pattern is what lets the product say "per section 4.2" instead of an unverifiable claim.' },
          { title: 'Docs search inside a developer tool', text: 'An in-IDE assistant ingests your framework\'s docs and changelog nightly (offline pipeline) and answers coding questions grounded in the current version at query time — keeping answers current without retraining anything.' },
        ] },
        { type: 'project', title: 'Build the minimal RAG loop end to end', goal: 'Implement both pipelines in memory and answer three questions grounded in a provided corpus, printing which chunks fed each answer.', steps: [
          'Write a small corpus of 6–8 chunks across 2–3 topics (e.g. billing, security, product), each tagged with a source name. This is your knowledge base.',
          'Ingest: write an `embed(text)` (real embedding API, or the playground\'s mock vector) and build an in-memory index of `{ source, text, vector }` for every chunk.',
          'Query: write `retrieve(question, k)` that embeds the question and returns the top-K chunks by cosine similarity, and `buildPrompt(chunks, question)` that assembles a grounded, source-labeled prompt.',
          'Wire `rag(question)` = retrieve → build prompt → call the LLM, and have it print the retrieved chunks (with scores and sources) before the answer, so you can see the grounding.',
          'Run three questions — each answerable from a different topic — and verify each answer is grounded in the right chunks and cites its source.',
        ], deliverable: 'A single runnable file (`mini_rag.js` or `.py`) that answers 3 questions, printing the retrieved chunks and sources used for each, proving the answers are grounded rather than guessed.' },
        { type: 'challenge', title: 'Force citations and graceful abstention', text: 'Extend your mini RAG so every answer must cite the chunk id(s) it used, and so the system reliably refuses when the corpus can\'t answer. Then test it with a question your corpus genuinely does not cover (e.g. "what\'s your refund policy?" when no chunk mentions refunds) and confirm it says "I don\'t have that information" instead of inventing one.', hints: [
          'Label each context chunk with a numbered id and its source, and add an explicit system rule: "cite the id like [1]" and "if the CONTEXT lacks the answer, reply exactly: I don\'t have that information."',
          'Test abstention deliberately: pick a question whose best-retrieved chunk still has a low similarity score and doesn\'t actually contain the answer — the model should refuse, not stretch.',
          'For extra credit, add a similarity threshold: if the top chunk\'s score is below a cutoff, short-circuit and return the "I don\'t know" message *before* even calling the LLM — cheaper and more reliable than trusting the model to abstain.',
        ] },
        { type: 'reading', links: [
          { label: 'LangChain: Build a RAG app (end-to-end tutorial)', url: 'https://python.langchain.com/docs/tutorials/rag/', note: 'The canonical hands-on walkthrough of both pipelines — load, split, embed, store, retrieve, and generate — in real code.' },
          { label: 'Anthropic: Embeddings guide', url: 'https://docs.anthropic.com/en/docs/build-with-claude/embeddings', note: 'Provider-official guide to the embedding step both pipelines share — how to turn documents and questions into vectors for retrieval (and why the model must match on both sides).' },
          { label: 'Retrieval-Augmented Generation (Lewis et al., 2020)', url: 'https://arxiv.org/abs/2005.11401', note: 'The original RAG paper. Read the architecture section to see the retrieve-then-generate design this whole lesson unpacks.' },
        ] },
      ],
    },
  ],
}
