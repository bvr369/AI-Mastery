// Lesson 7.8 — Checkpoint Project: Chat With Your Docs

export default {
  sections: [
    {
      id: 'the-build',
      title: 'The project every AI engineer ships',
      blocks: [
        { type: 'p', text: "This is the capstone of Modules 6 and 7, and it is not an accident that it is *the* classic AI-engineer portfolio project: a **\"chat with your documents\"** app that answers questions using **your** content — a wiki, a product manual, a stack of PDFs — and **cites its sources** so a human can verify every claim. Build it well and you can walk into any interview and say the sentence that opens doors: *\"I built a production RAG system, and I understand every layer.\"*" },
        { type: 'p', text: "You have all the parts already. Module 2 gave you a streaming chatbot with a secret-safe backend. Module 5 gave you [[Embedding]]s. This module gave you [[Chunking]], [[Vector Database]]s, top-K retrieval, hybrid search, reranking, [[Grounding]], evals, and caching. The checkpoint is where they **assemble into one app**. Nothing new to learn — everything to wire together." },
        { type: 'diagram', id: 'rag-architecture', caption: "The system you are building. Ingest (offline, top): docs → chunk → embed → store. Query (per request, bottom): question → embed → retrieve top-K → grounded prompt → streamed, cited answer." },
        { type: 'callout', variant: 'info', text: "This is a **guided build**, not copy-paste. The code is real and runnable, but the learning is in wiring it to *your* documents with *your* provider key. Budget 2–4 hours for a minimal version. When it answers a question about your docs with a clickable citation — and *refuses* to answer something the docs don't cover — you have built the thing companies are hiring for." },
      ],
    },
    {
      id: 'architecture',
      title: 'The system, tier by tier',
      blocks: [
        { type: 'p', text: "A chat-with-your-docs app is the Module 2 three-tier chatbot with a **retrieval step bolted in front of the LLM call**. The tiers are the same, and the reason for the middle tier is the same: the browser is public, so keys and control logic live server-side (Lesson 2.1). What is new is that the backend now owns a second expensive thing — the [[Vector Database]] — and a new step on the hot path." },
        { type: 'list', items: [
          "**Frontend (React):** the chat UI from Lesson 2.9 — messages state, a streaming renderer, a Stop button. Plus one new thing: it renders **citations** as clickable chips or footnotes that link back to the source. Zero secrets, zero retrieval logic.",
          "**Backend (your server):** holds the provider key AND the vector-DB credentials. On each question it embeds the query, retrieves top-K chunks, assembles the grounded prompt, calls the LLM with `stream: true`, and pipes the answer back — attaching the source metadata for citations. This is where RAG *lives*.",
          "**Provider(s):** the embedding model (to vectorize the question) and the generation model (to write the grounded answer). Often the same vendor, not always.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the app is a librarian with a phone to an expert', text: "The **frontend** is the front desk where a patron asks a question. The **backend** is the librarian: they don't personally know the answer, but they know exactly which three passages to pull from the stacks (retrieval), they hand those passages to an **expert on the phone** (the LLM) saying *\"answer only from these, and tell me which one you used\"* (grounding + citations), and they relay the expert's reply back to the patron **with the shelf numbers** (sources). The expert never touches the stacks; the librarian never invents facts. That division of labor is the entire design." },
        { type: 'p', text: "Two pipelines, one shared store (Lesson 7.2). **Ingest** runs offline: load → chunk → embed → upsert into the vector DB, storing each chunk's *text* and *metadata* (source title, URL, page/section) alongside its vector. The metadata is not optional decoration — it is **what makes citations possible**. If you don't store where a chunk came from at ingest time, you cannot cite it at query time. **Query** runs per request on the hot path, where every token and millisecond costs money and latency." },
      ],
    },
    {
      id: 'grounded-experience',
      title: 'Feel the difference: grounded vs. winging it',
      blocks: [
        { type: 'p', text: "Before you build it, *feel* what you are building. The demo below is the whole product in miniature. Ask a question with retrieval **off** and the model answers from its parametric memory — fluent, confident, and possibly wrong about *your* specific docs. Turn retrieval **on** and the same model answers from the retrieved passages, with citations you can click. This gap is the entire value proposition of RAG." },
        { type: 'demo', id: 'rag-playground' },
        { type: 'callout', variant: 'analogy', title: 'Analogy: open-book vs. closed-book exam', text: "Ungrounded is a **closed-book exam** — the model answers from memory, sounds authoritative, and quietly bluffs on anything it half-remembers. Grounded RAG is an **open-book exam where citing the page is mandatory**: the model can only use what is in front of it, and it must point at the exact passage. Open-book with mandatory citations is how you turn a confident bluffer into a trustworthy assistant." },
        { type: 'h', text: 'The feature that separates toys from products: abstention' },
        { type: 'p', text: "A demo answers everything. A *product* knows when to **shut up**. If retrieval comes back empty — or with only weak, low-similarity chunks — the right behavior is not to answer from parametric memory (that is exactly the hallucination you are trying to kill). It is to **abstain**: *\"I don't have information about that in the provided documents.\"* You implement this with a **similarity-score threshold**: if the best retrieved chunk scores below it, you don't even call the LLM. Cheaper, faster, and honest." },
        { type: 'callout', variant: 'warn', text: "Abstention is the single most under-built and most-tested feature in RAG interviews. Anyone can pipe chunks into a prompt; the senior move is handling the *no good chunks* case gracefully. Build it in from day one, not as a bolt-on." },
      ],
    },
    {
      id: 'build-the-pieces',
      title: 'Build it: the grounded, cited, streaming endpoint',
      blocks: [
        { type: 'h', text: 'The prompt is where grounding is enforced' },
        { type: 'p', text: "Retrieval gets you the right passages; the **prompt** is what forces the model to *use only them* and to *cite*. A grounded prompt has three jobs, all stated explicitly: (1) answer **only** from the provided context, (2) **cite** each claim by its source marker, and (3) if the context is insufficient, **say so** rather than guessing. Number your chunks so the model has a stable handle to cite — `[1]`, `[2]` — and map those numbers back to real source URLs in your UI." },
        { type: 'code', lang: 'text', filename: 'grounded-prompt.txt', code: `SYSTEM:
You are a documentation assistant. Answer the user's question using ONLY
the numbered sources below. Follow these rules exactly:
- Cite the source for every claim, inline, like [1] or [2].
- If the sources do not contain the answer, reply exactly:
  "I don't have information about that in the provided documents."
- Do not use outside knowledge. Do not guess.

SOURCES:
[1] (Billing / refunds.md) Annual plans can be refunded within 30 days
    of purchase. Refunds return to the original payment method.
[2] (Billing / plans.md) Monthly plans are non-refundable but can be
    cancelled at any time, effective at the end of the cycle.

USER:
Can I get my money back on a yearly plan?`, caption: "Numbered sources + explicit rules = grounding you can verify. The exact-string abstention line makes the 'no answer' case trivial to detect in code." },
        { type: 'p', text: "Now the backend endpoint that produces that prompt on every request. It embeds the question, retrieves top-K (with the hybrid/rerank stack from Lessons 7.5–7.6 if you have it), gates on a score threshold, assembles the grounded prompt, and **streams** the answer back token-by-token (Lesson 2.4) while carrying the source list for the UI to render as citations." },
        { type: 'code', lang: 'javascript', filename: 'api/chat.js (Node / Express)', code: `import express from "express"
const app = express(); app.use(express.json())

const MIN_SCORE = 0.35          // abstain below this (tune with evals — Lesson 7.4)
const TOP_K = 5

app.post("/api/chat", async (req, res) => {
  const { question } = req.body
  if (!question) return res.status(400).json({ error: "question required" })

  // 1) EMBED the question (same model used at ingest — Lesson 7.2)
  const qVec = await embed(question)

  // 2) RETRIEVE top-K chunks from the vector DB (metadata rides along)
  let hits = await vectorDB.search(qVec, TOP_K)   // [{ text, score, source, url }]

  // 3) ABSTAIN if nothing is good enough — do NOT call the LLM
  hits = hits.filter(h => h.score >= MIN_SCORE)
  if (hits.length === 0) {
    return res.json({
      answer: "I don't have information about that in the provided documents.",
      sources: [],
    })
  }

  // 4) GROUND: build a numbered-source prompt
  const context = hits
    .map((h, i) => \`[\${i + 1}] (\${h.source}) \${h.text}\`)
    .join("\\n\\n")
  const system = \`You are a documentation assistant. Answer using ONLY the
numbered sources. Cite every claim inline like [1]. If the sources do not
answer the question, reply exactly: "I don't have information about that in
the provided documents."\\n\\nSOURCES:\\n\${context}\`

  // 5) STREAM the grounded answer back (SSE — Lesson 2.4)
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,   // key stays server-side
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: question }],
      stream: true,
    }),
  })

  // send the citation map FIRST so the UI can render source chips immediately
  res.write(\`data: \${JSON.stringify({ sources: hits.map(h => ({ source: h.source, url: h.url })) })}\\n\\n\`)

  const reader = upstream.body.getReader(); const dec = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    for (const line of dec.decode(value).split("\\n")) {
      if (!line.startsWith("data:")) continue
      const evt = JSON.parse(line.slice(5))
      if (evt.type === "content_block_delta")
        res.write(\`data: \${JSON.stringify({ text: evt.delta.text })}\\n\\n\`)
    }
  }
  res.write("data: [DONE]\\n\\n"); res.end()
})

app.listen(3001, () => console.log("RAG backend on :3001"))`, caption: "The whole query pipeline in one handler: embed → retrieve → gate → ground → stream. Sources go out first so citations render before the prose arrives." },
        { type: 'code', lang: 'python', filename: 'app.py (FastAPI + streaming)', code: `from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import os, json, anthropic

app = FastAPI()
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MIN_SCORE, TOP_K = 0.35, 5

@app.post("/api/chat")
async def chat(body: dict):
    question = body["question"]

    q_vec = embed(question)                       # same model as ingest
    hits = vector_db.search(q_vec, TOP_K)         # [{text, score, source, url}]
    hits = [h for h in hits if h["score"] >= MIN_SCORE]

    if not hits:                                  # abstain — never call the LLM
        return {"answer": "I don't have information about that in the "
                          "provided documents.", "sources": []}

    context = "\\n\\n".join(f"[{i+1}] ({h['source']}) {h['text']}"
                           for i, h in enumerate(hits))
    system = ("You are a documentation assistant. Answer using ONLY the "
              "numbered sources. Cite every claim inline like [1]. If the "
              "sources do not answer, reply exactly: \\"I don't have "
              "information about that in the provided documents.\\"\\n\\n"
              f"SOURCES:\\n{context}")

    def gen():
        # citation map first, then the streamed grounded answer
        yield f"data: {json.dumps({'sources': [{'source': h['source'], 'url': h['url']} for h in hits]})}\\n\\n"
        with client.messages.stream(
            model="claude-sonnet-5", max_tokens=1024, system=system,
            messages=[{"role": "user", "content": question}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return StreamingResponse(gen(), media_type="text/event-stream")`, caption: "Same pipeline in Python. Note the abstain check happens BEFORE any generation cost — the cheapest request is the one you never send." },
        { type: 'h', text: 'Now run the whole loop yourself' },
        { type: 'p', text: "The playground below is the entire query pipeline over a baked corpus — retrieve, gate, ground, generate, cite — with a real (simulated) `llm()` call. Run it: the first question is answerable (watch it retrieve, ground, and cite); the second is *not* covered by the docs (watch it abstain **without** ever calling the model). This is the core of your capstone in ~40 lines." },
        { type: 'playground', id: 'rag-chat-loop', title: 'A complete mini RAG chat: retrieve → ground → cite → abstain', height: 620, lang: 'javascript', code: `// ---- The "documents": a tiny baked corpus with citable metadata. ----
const CORPUS = [
  { id: "d1", source: "billing/refunds.md",  text: "Annual plans can be refunded within 30 days of purchase. Refunds return to the original payment method." },
  { id: "d2", source: "billing/plans.md",    text: "Monthly plans are non-refundable but can be cancelled anytime, effective at the end of the billing cycle." },
  { id: "d3", source: "security/sso.md",     text: "Single sign-on via SAML is available on Enterprise plans. Admins configure it in Settings > Security." },
  { id: "d4", source: "support/uptime.md",   text: "The Enterprise SLA guarantees 99.9% uptime and a one-hour support response time." },
];

// ---- Retriever. Real code embeds + cosine-ranks; here we score by keyword
// overlap so the lesson stays offline and deterministic. Same SHAPE as prod. ----
function retrieve(query, k) {
  const qWords = new Set((query.toLowerCase().match(/[a-z]+/g) || []));
  return CORPUS
    .map((doc) => {
      const words = doc.text.toLowerCase().match(/[a-z]+/g) || [];
      const hits = words.filter((w) => qWords.has(w)).length;
      return { ...doc, score: hits / Math.sqrt(words.length) }; // length-normalized
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const MIN_SCORE = 0.25;   // abstain threshold — the trust dial

async function answer(question) {
  console.log("Q: " + question);
  const hits = retrieve(question, 3).filter((h) => h.score >= MIN_SCORE);

  // ---- Abstention: no good chunks => don't spend a token. ----
  if (hits.length === 0) {
    console.log("A: I don't have information about that in the provided documents.");
    console.log("   (abstained — best chunk scored below " + MIN_SCORE + ", LLM never called)\\n");
    return;
  }

  // ---- Ground: build a numbered-source prompt. ----
  const context = hits.map((h, i) => "[" + (i + 1) + "] (" + h.source + ") " + h.text).join("\\n");
  const system = "You are a documentation assistant. Answer using ONLY the "
    + "numbered sources below. Cite every claim inline like [1]. If they do "
    + "not answer the question, say you don't have the information.\\n\\nSOURCES:\\n" + context;

  console.log("  retrieved " + hits.length + " chunk(s):");
  hits.forEach((h, i) => console.log("   [" + (i + 1) + "] " + h.source + "  (score " + h.score.toFixed(2) + ")"));

  // ---- Generate: call the (simulated) grounded model. ----
  const reply = await llm(question, { system, temperature: 0.2 });
  console.log("A: " + reply);

  // ---- Cite: map the numbered markers back to real sources for the UI. ----
  console.log("  Sources:");
  hits.forEach((h, i) => console.log("   [" + (i + 1) + "] " + h.source));
  console.log("");
}

await answer("Can I get a refund on my annual plan?");   // answerable -> grounded + cited
await answer("What's your parental leave policy?");        // not in docs -> abstain`, solution: `// SOLUTION: add rerank-style exact-phrase boosting + citation de-duplication,
// and tune the abstain threshold so a marginal question flips.
const CORPUS = [
  { id: "d1", source: "billing/refunds.md",  text: "Annual plans can be refunded within 30 days of purchase. Refunds return to the original payment method." },
  { id: "d2", source: "billing/plans.md",    text: "Monthly plans are non-refundable but can be cancelled anytime, effective at the end of the billing cycle." },
  { id: "d3", source: "security/sso.md",     text: "Single sign-on via SAML is available on Enterprise plans. Admins configure it in Settings > Security." },
  { id: "d4", source: "support/uptime.md",   text: "The Enterprise SLA guarantees 99.9% uptime and a one-hour support response time." },
];

function retrieve(query, k) {
  const q = query.toLowerCase();
  const qWords = new Set((q.match(/[a-z]+/g) || []));
  return CORPUS
    .map((doc) => {
      const t = doc.text.toLowerCase();
      const words = t.match(/[a-z]+/g) || [];
      let score = words.filter((w) => qWords.has(w)).length / Math.sqrt(words.length);
      // cheap "rerank": bonus if a 2-word query phrase appears verbatim (Lesson 7.6)
      const bigrams = q.match(/[a-z]+ [a-z]+/g) || [];
      if (bigrams.some((b) => t.includes(b))) score += 0.3;
      return { ...doc, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const MIN_SCORE = 0.25;

async function answer(question) {
  console.log("Q: " + question);
  const hits = retrieve(question, 3).filter((h) => h.score >= MIN_SCORE);
  if (hits.length === 0) {
    console.log("A: I don't have information about that in the provided documents.\\n");
    return;
  }
  const context = hits.map((h, i) => "[" + (i + 1) + "] (" + h.source + ") " + h.text).join("\\n");
  const system = "You are a documentation assistant. Answer using ONLY the numbered "
    + "sources. Cite every claim inline like [1].\\n\\nSOURCES:\\n" + context;
  const reply = await llm(question, { system, temperature: 0.2 });
  console.log("A: " + reply);
  // de-dupe citations by source before rendering
  const seen = new Set();
  console.log("  Sources:");
  hits.forEach((h, i) => { if (!seen.has(h.source)) { seen.add(h.source); console.log("   [" + (i + 1) + "] " + h.source); } });
  console.log("");
}

await answer("Can I get a refund on my annual plan?");
await answer("What's your parental leave policy?");`, caption: "**Exercise:** (1) Add a 'rerank' bonus when a two-word phrase from the question appears verbatim in a chunk (Lesson 7.6). (2) De-duplicate the Sources list so the same file is never cited twice. (3) Raise `MIN_SCORE` to 0.4 and find a question that flips from answered to abstained — that dial is your precision/recall tradeoff." },
        { type: 'h', text: 'The production layer (do not skip this in the interview)' },
        { type: 'p', text: "A demo that streams a cited answer is impressive. What makes it a *system* is the operational envelope around it — and it is exactly what senior interviewers probe for after the happy path." },
        { type: 'table', headers: ['Concern', 'The move', 'Why it matters'], rows: [
          ['**Cost**', 'Retrieve fewer, better chunks; cap `max_tokens`; use a cheaper model for easy questions.', 'Every retrieved chunk is input tokens you pay for on every request. Context bloat is the #1 RAG cost sink.'],
          ['**Caching**', 'Prompt-cache the stable system+instructions block; cache full answers for repeated questions (Lesson 7.7).', 'The rules and format never change between requests — paying to re-read them every time is pure waste.'],
          ['**Evals**', 'A golden set of question→expected-source pairs; track precision@k / recall@k and answer faithfulness (Lesson 7.4).', 'Without evals you are tuning `TOP_K` and `MIN_SCORE` by vibes. Evals turn "seems better" into a number.'],
          ['**Abstention rate**', 'Log how often you abstain and audit a sample.', 'Too high = retrieval is missing content; too low = you may be answering things you should refuse.'],
          ['**Freshness**', 'Re-ingest changed docs on a schedule or webhook; version your index.', 'A stale index cites deleted policies. Ingest is offline, but it is not one-and-done.'],
        ] },
      ],
    },
    {
      id: 'quiz',
      title: 'Checkpoint quiz',
      blocks: [
        { type: 'p', text: "These are the exact questions an interviewer asks about a RAG app on your resume. Answer them cold." },
        { type: 'quiz', questions: [
          {
            q: 'An interviewer asks: "A user asks your docs-bot something your documents don\'t cover. What happens?" The BEST design answer:',
            options: [
              'The LLM answers from its training data so the user always gets a reply',
              'If the best retrieved chunk scores below a similarity threshold, abstain — return "I don\'t have that in the documents" without calling the LLM',
              'Retrieve more chunks until something matches',
              'Raise the temperature so the model is more creative',
            ],
            answer: 1,
            explain: 'Abstention via a score threshold is the senior move. Answering from parametric memory reintroduces exactly the hallucination RAG exists to prevent. Gating before the LLM call also saves the token cost.',
          },
          {
            q: 'Why must chunk metadata (source title, URL, section) be stored at INGEST time, not derived later?',
            options: [
              'It makes embeddings more accurate',
              'Because citations at query time can only point to what you saved with the chunk — no metadata at ingest means no citations at query',
              'Vector databases require it to function',
              'It reduces the number of tokens in the prompt',
            ],
            answer: 1,
            explain: 'Citations are just the chunk\'s stored provenance surfaced to the user. If ingest didn\'t record where a chunk came from, query time has nothing to cite. Metadata is a first-class part of the ingest schema, not an afterthought.',
          },
          {
            q: 'In the streaming endpoint, why send the sources list as the FIRST SSE event, before any answer tokens?',
            options: [
              'SSE requires metadata before text',
              'So the UI can render citation chips immediately while the grounded answer streams in — better perceived latency',
              'To reduce the provider\'s token count',
              'Because the model needs the sources to generate',
            ],
            answer: 1,
            explain: 'The sources are known the instant retrieval finishes — before generation even starts. Emitting them first lets the frontend show "answering from 3 sources" instantly, then stream prose into place. It\'s the optimistic-UI instinct from Lesson 2.9 applied to citations.',
          },
          {
            q: 'Your RAG bot gives fluent answers but they\'re subtly wrong about your specific product. The MOST likely culprit:',
            options: [
              'The generation model is too small',
              'Retrieval is failing to surface the right chunks, so the model falls back on general knowledge — fix retrieval (chunking, hybrid, rerank) and tighten the grounding prompt',
              'The temperature is too low',
              'You need a bigger max_tokens',
            ],
            answer: 1,
            explain: 'Wrong-but-fluent is the fingerprint of a retrieval miss plus a weak grounding instruction. If the right chunk never reaches the prompt, no model can ground on it. Debug retrieval first (evals!), then harden the prompt to forbid outside knowledge.',
          },
          {
            q: 'Which change most directly cuts the per-request COST of this RAG app without hurting answer quality?',
            options: [
              'Switch every request to the largest available model',
              'Prompt-cache the stable system+instructions block and retrieve fewer, higher-quality chunks',
              'Increase TOP_K to send more context every time',
              'Disable streaming',
            ],
            answer: 1,
            explain: 'The system prompt and rules are identical across requests — caching them (Lesson 7.7) stops you paying to re-read them. And fewer, better chunks (via rerank) means fewer input tokens per call. Raising TOP_K does the opposite: more tokens, more cost, often more noise.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l8-c1', front: 'The three tiers of a chat-with-your-docs app?', back: 'Frontend (chat UI + clickable citations, no secrets) → backend (owns vector-DB creds + LLM key; embeds, retrieves, grounds, streams) → provider(s) (embedding + generation model). RAG lives in the backend.' },
          { id: 'm7-l8-c2', front: 'What is abstention and how do you implement it?', back: 'Refusing to answer when the docs don\'t cover the question. Implement with a similarity-score threshold: if the best retrieved chunk scores below it, return a fixed "no information" reply WITHOUT calling the LLM — cheaper and honest.' },
          { id: 'm7-l8-c3', front: 'What makes citations possible?', back: 'Chunk metadata (source title, URL, section) stored at INGEST time. Query-time citations just surface that stored provenance. No ingest metadata → no citations.' },
          { id: 'm7-l8-c4', front: 'The three jobs of a grounding prompt?', back: '(1) Answer ONLY from the numbered sources, (2) cite each claim inline by its marker [1]/[2], (3) if the context is insufficient, say so instead of guessing. Number the chunks so the model has stable handles to cite.' },
          { id: 'm7-l8-c5', front: 'Why stream the sources list before the answer tokens?', back: 'Retrieval finishes before generation starts, so sources are known first. Emitting them as the first SSE event lets the UI render citation chips instantly while the grounded answer streams in — better perceived latency.' },
          { id: 'm7-l8-c6', front: 'Diagnosis: fluent answers that are subtly wrong about your product?', back: 'Almost always a retrieval miss — the right chunk never reached the prompt, so the model fell back on general knowledge. Fix retrieval (chunking/hybrid/rerank) and tighten the grounding prompt to forbid outside knowledge; measure with evals.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Module wrap-up — you can build production RAG now',
      blocks: [
        { type: 'summary', points: [
          'Chat-with-your-docs = the Module 2 three-tier chatbot with retrieval bolted in front of the LLM call. The backend owns the vector DB and the keys.',
          'The query hot path: embed the question → retrieve top-K → gate on a score threshold → assemble a grounded, numbered-source prompt → stream a cited answer.',
          'Grounding is enforced by the PROMPT (answer only from sources, cite every claim, abstain if insufficient) — retrieval just supplies the passages.',
          'Abstention is the feature that separates a toy from a product, and the one interviewers probe hardest. Gate before you generate.',
          'Citations come from chunk metadata stored at ingest; production RAG lives or dies on cost control, caching, and evals — not on the demo.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Answering everything (no abstention)', text: 'A bot that always replies will confidently hallucinate on anything outside its docs — the exact failure RAG is supposed to fix. Add a similarity threshold and a fixed "I don\'t have that" reply before you ship. It is three lines and it is the whole point.' },
          { title: 'Citing nothing (or faking citations)', text: 'An uncited answer is unverifiable, which in a docs assistant is worthless. Worse is asking the model to invent citation numbers with no source map behind them. Store metadata at ingest and map real markers to real URLs — a citation must click through to the source.' },
          { title: 'Stuffing every chunk into the prompt', text: 'Sending TOP_K = 20 "to be safe" bloats input tokens, raises cost and latency, and buries the good chunk in noise (the lost-in-the-middle problem). Retrieve few and rerank for quality; more context is not more accuracy.' },
          { title: 'Shipping with zero evals', text: 'Tuning TOP_K, MIN_SCORE, and chunk size by vibes means every change is a guess. Build a small golden set (question → expected sources) first; then every knob you turn produces a number, not an opinion (Lesson 7.4).' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through the RAG chatbot on your resume."', a: 'Lead with the two pipelines. Ingest (offline): load docs, chunk them, embed each chunk, upsert into a vector DB with source metadata for citations. Query (per request): embed the question, retrieve top-K by cosine similarity — optionally hybrid + reranked — gate on a similarity threshold to abstain when nothing is relevant, assemble a grounded prompt that numbers the sources and forbids outside knowledge, then stream the answer back over SSE with the source list sent first so citations render immediately. Close with the production layer: prompt caching for the stable system block, a golden-set eval for precision/recall and faithfulness, and cost control via reranking down to fewer, better chunks.' },
          { q: '"How do you stop it from hallucinating?"', a: 'Three layers. Retrieval: get the right chunks in front of the model — this is 80% of it; a fact that never reaches the prompt can\'t be grounded on. Prompt: explicitly instruct "answer only from these sources, cite each claim, and if they don\'t cover it, say so." Abstention: a score threshold that refuses to call the LLM at all when retrieval is weak. Then I verify with a faithfulness eval — does each sentence trace to a retrieved chunk? Grounding reduces hallucination; it doesn\'t eliminate it, so I measure it.' },
          { q: '"Your users say answers are wrong even though the info is in the docs. Debug it."', a: 'That is a retrieval failure, not a generation failure — the right chunk isn\'t reaching the prompt. I\'d check, in order: chunking (is the answer split across a boundary so no single chunk contains it?), the embedding match (does the query phrase the concept differently than the doc — a case for hybrid keyword + vector search), and ranking (is the good chunk retrieved but buried below TOP_K — a case for a reranker). I\'d confirm each hypothesis against the golden set rather than guessing, because "wrong answer" has several very different root causes.' },
          { q: '"How do you keep the cost sane at scale?"', a: 'The dominant cost is input tokens on the hot path, so I attack context size first: rerank to send fewer, higher-quality chunks instead of a big TOP_K, and cap max_tokens. Then prompt caching (Lesson 7.7) on the stable system+instructions block, which is identical across requests. For high-repeat questions, cache the full answer. And I route easy questions to a cheaper model. Every one of those is measurable — I watch cost-per-answer alongside the quality evals so I never trade away accuracy blindly.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Customer support assistants', text: 'Intercom Fin, Zendesk AI, and countless in-house bots are this exact system over a help center — grounded, cited answers that deflect tickets, and abstain (or escalate to a human) when the KB doesn\'t cover it.' },
          { title: 'Internal knowledge / "ask the wiki"', text: 'Glean, Notion AI Q&A, and homegrown Slack bots let employees query the company\'s docs, tickets, and code. Citations back to the source page are what make people trust the answer.' },
          { title: 'Developer docs chat', text: 'The "Ask AI" widget on documentation sites (many built on the same RAG stack) answers API questions grounded in the current docs and links the exact page — reducing support load and keeping answers version-fresh.' },
          { title: 'Legal / policy / compliance search', text: 'Contract and policy assistants where an uncited answer is a liability. Grounding + mandatory citations + abstention are non-negotiable, and the audit trail (which passage justified which claim) is a feature, not a nicety.' },
        ] },
        { type: 'project', title: 'Capstone: build & ship a chat-with-your-docs app', goal: 'Turn everything in Modules 6–7 into one deployable RAG chatbot over content you choose, with grounded + cited answers, abstention, and streaming.', steps: [
          'Pick a corpus you actually know (your project\'s README + docs, a favorite library\'s docs, a set of your own notes) and write the INGEST script: load → chunk → embed → upsert into a vector DB (pgvector, Chroma, Pinecone — your pick), storing source + URL metadata on every chunk.',
          'Build the BACKEND endpoint: embed the question, retrieve top-K, gate on a MIN_SCORE threshold (abstain below it), assemble a grounded numbered-source prompt, and stream the answer back with the sources sent first.',
          'Build the FRONTEND: reuse your Lesson 2.9 streaming chat UI and add clickable citation chips that link to each source. Show the abstention message clearly when it fires.',
          'Harden it: prompt-cache the system block (Lesson 7.7), cap max_tokens and TOP_K, and log usage + abstention rate so you can see cost and behavior.',
          'Deploy it (Vercel/Render/Fly, key in env, never committed) and write a README covering the architecture diagram, the ingest/query split, and every RAG concept you used (chunking, embeddings, top-K, hybrid/rerank if you added it, grounding, citations, abstention).',
        ], deliverable: 'A working (even minimal) RAG chatbot repo + deployed URL, with a README that walks through the architecture and names the RAG concepts used. This is your portfolio centerpiece.' },
        { type: 'challenge', title: 'Measure it like an engineer, not a demo', text: 'Add a retrieval eval and prompt caching, then REPORT the numbers. Build a golden set of 15–20 question→expected-source pairs over your corpus and compute precision@k and recall@k (Lesson 7.4). Turn on prompt caching for the system block (Lesson 7.7) and measure cost-per-answer before and after. Write a one-page results note: retrieval quality, a couple of failure cases you found and fixed, and the % cost reduction from caching.', hints: [
          'Include at least three questions your docs do NOT answer — a good eval measures abstention, not just correct answers.',
          'When a question fails, classify the cause: chunking, embedding/lexical mismatch, or ranking. The fix is different for each.',
          'Report cost as tokens-per-answer and dollars-per-1k-answers — the numbers an engineering manager actually asks for.',
        ] },
        { type: 'reading', links: [
          { label: 'LangChain: build a RAG "chat with your data" app (tutorial)', url: 'https://python.langchain.com/docs/tutorials/rag/', note: 'An end-to-end, code-complete walkthrough of the exact ingest→retrieve→generate pipeline you just built by hand.' },
          { label: 'Anthropic cookbook: retrieval-augmented generation', url: 'https://github.com/anthropics/anthropic-cookbook', note: 'Runnable RAG + contextual-retrieval notebooks from the provider — patterns for grounding, citations, and reranking you can lift directly.' },
          { label: 'Pinecone: RAG in production (design & pitfalls)', url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/', note: 'A production-minded writeup on chunking, retrieval quality, and the operational concerns that separate a demo from a system.' },
        ] },
      ],
    },
  ],
}
