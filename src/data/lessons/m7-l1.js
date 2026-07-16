// Lesson 7.1 — Why RAG Exists

export default {
  sections: [
    {
      id: 'the-core-problem',
      title: 'The model is brilliant, sealed, and out of date',
      blocks: [
        { type: 'p', text: "A language model is a genius that finished school on a fixed day and hasn't read anything since. It absorbed a giant slice of the public internet up to its [[Knowledge Cutoff]], compressed it into weights, and then the doors closed. It has never seen your company's wiki, last night's support tickets, this morning's pricing change, or the private PDF sitting in your repo. Ask it about any of those and it's guessing." },
        { type: 'p', text: "Worse, it *guesses confidently*. Back in Module 1 you met [[Hallucination]]: when a model lacks a fact, it doesn't say \"I don't know\" — it produces the most plausible-sounding continuation, which is often a fluent, well-formatted lie. A cutoff plus a private-data gap plus a hallucination habit is a product-killer. \"Our AI invented a refund policy that doesn't exist\" is not a bug ticket you want." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the brilliant new hire on day one', text: "You just hired someone razor-sharp — great reasoning, wide general knowledge, writes beautifully. But it's their first morning. They've never seen your codebase, your customers, your internal docs, or your Slack. If you ask \"what's our SLA for enterprise tickets?\" they *should* say \"let me check.\" A raw LLM instead makes up a confident answer. RAG is handing that new hire the relevant page from the handbook *before* they answer — so the genius reasons over facts instead of vibes." },
        { type: 'p', text: "There are two separate gaps here, and it's worth naming them because they need different fixes. **The freshness gap:** the world changed after the cutoff. **The privacy gap:** the fact was never public, so no amount of training would include it. Both share one root cause — the needed information isn't in the weights — and both have the same cheap cure: *put the information in the prompt.*" },
      ],
    },
    {
      id: 'the-rag-solution',
      title: 'RAG in one sentence',
      blocks: [
        { type: 'p', text: "[[RAG]] (Retrieval-Augmented Generation) is almost embarrassingly simple to state: **retrieve the text that's relevant to the question, paste it into the prompt, and ask the model to answer using it.** That's the whole idea. Retrieve, augment, generate. The model stops answering from memory and starts answering from a fresh, private, cited source you handed it a millisecond ago." },
        { type: 'callout', variant: 'info', title: 'The three letters, decoded', text: "**R — Retrieval:** find the few chunks of text most relevant to the question (usually via semantic search over embeddings — Module 6). **A — Augmented:** stitch those chunks into the prompt as context. **G — Generation:** the LLM writes an answer *grounded* in that context. The model's job shifts from \"recall the fact\" to \"read these sources and synthesize\" — which is exactly what LLMs are best at." },
        { type: 'p', text: "Notice what changed. You didn't retrain anything. You didn't grow the model. You didn't wait for a new release with a later cutoff. You just did what you'd do for that new hire: *looked up the relevant page and set it on their desk.* The model's reasoning was always fine — it was starved of the specific facts. RAG feeds it." },
        { type: 'callout', variant: 'tip', title: 'Why this beats \"just tell the model the answer in the system prompt\"', text: "You could hardcode facts into the system prompt — and for a handful of stable facts you should (that's the long-context branch below). But you can't paste your entire 10,000-page knowledge base into every request: it won't fit in the context window, it'd cost a fortune per call, and the model's accuracy degrades when it has to find one needle in a giant haystack. RAG's trick is *selective* — retrieve only the 3-5 chunks that matter for *this* question, so the prompt stays small, cheap, and focused." },
      ],
    },
    {
      id: 'decision-framework',
      title: 'RAG vs the alternatives: a decision framework',
      blocks: [
        { type: 'p', text: "\"The model doesn't know something\" has four common fixes, and picking the wrong one wastes weeks. The single most useful question to ask: **is this a KNOWLEDGE problem or a BEHAVIOR problem?** Knowledge (facts, data, docs) points toward RAG. Behavior (tone, format, a new skill, a specialized style) points toward fine-tuning. Get that fork right and the rest follows." },
        { type: 'diagram', id: 'rag-decision', caption: 'The decision tree. Start at the top: are you adding knowledge or changing behavior? Then check size and freshness. Most \"talk to my docs\" problems land on RAG.' },
        { type: 'p', text: "Read the tree top-down and the choice usually makes itself. The quick tells that scream **RAG**:" },
        { type: 'list', items: [
          "The knowledge is **private** — it was never on the public internet, so no model was ever trained on it.",
          "The knowledge is **fresh** — it changed after the model's [[Knowledge Cutoff]], or it changes constantly (prices, tickets, docs).",
          "The knowledge is **big** — too large to paste into every prompt (a whole wiki, thousands of articles).",
          "You need **citations** — the answer must link back to a specific, auditable source.",
        ] },
        { type: 'h', text: 'The four tools, and what each is actually for' },
        { type: 'table', headers: ['Approach', 'Fixes', 'Reach for it when', 'Watch out for'], rows: [
          ['**RAG**', 'Missing *knowledge* — fresh, private, or too large to memorize', 'A knowledge base that changes, is proprietary, or is big; you need citations', 'Retrieval quality is now your bottleneck (garbage retrieved → garbage answer)'],
          ['**Fine-tuning**', '*Behavior* — tone, format, a narrow skill or style the base model does poorly', 'You need consistent voice/JSON shape/domain phrasing across every call', "Expensive, static (retrain to update), and it teaches *style* far better than *facts*"],
          ['**Long context**', 'A *small, static* set of facts', 'The info is a few pages and rarely changes — just paste it in the prompt', 'Doesn\'t scale: big/changing corpora blow the context window and the budget'],
          ['**Bigger / better model**', 'General *capability* — reasoning, coding, instruction-following', 'The model is dumb at the *task*, not missing your *data*', 'A smarter model still has no idea about your private docs — capability ≠ knowledge'],
        ] },
        { type: 'callout', variant: 'warn', title: 'The most common wrong turn: fine-tuning to add facts', text: "Teams constantly try to \"fine-tune the company knowledge into the model.\" It's the wrong tool. Fine-tuning bakes facts into weights *slowly and leakily* — the model still hallucinates around them, you can't cite a source, and the moment a fact changes you must retrain. Fine-tuning teaches the model *how to behave*, not *what is true today*. For knowledge, RAG wins on nearly every axis. Rule of thumb: **fine-tune for form, retrieve for facts.**" },
      ],
    },
    {
      id: 'why-rag-wins',
      title: 'Why RAG usually beats fine-tuning for knowledge',
      blocks: [
        { type: 'p', text: "When the goal is *knowledge*, RAG isn't just easier — it's better on the axes that matter in production. Line them up:" },
        { type: 'table', headers: ['Axis', 'RAG', 'Fine-tuning for knowledge'], rows: [
          ['**Cost to add data**', 'Embed a new doc — cents, seconds', 'Re-run a training job — dollars-to-thousands, hours'],
          ['**Updating a fact**', 'Edit/replace the source; next query sees it instantly', 'Retrain the whole model to change one number'],
          ['**Citations**', 'Native — you retrieved the chunk, so you can link it', 'None — the fact is smeared across billions of weights'],
          ['**Hallucination**', 'Lower — the answer is grounded in provided text', 'Still high — the model paraphrases fuzzy memories'],
          ['**Access control**', 'Filter what you retrieve per user/role', 'All-or-nothing — the fact is in the weights for everyone'],
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: open-book vs memorize-the-textbook', text: "Fine-tuning knowledge is making the student *memorize the whole textbook* the night before — expensive, lossy, and obsolete the instant the syllabus changes. RAG is an *open-book exam*: the student stays sharp at reasoning, and you just hand them the current edition, flagged to the right page. When chapter 7 gets rewritten, you swap the book, not the student's brain." },
        { type: 'callout', variant: 'info', title: 'They compose — this isn\'t either/or', text: "The pros don't pick one tool; they stack them. A production support bot might: use a **capable base model** for reasoning, be **fine-tuned** to always answer in your brand voice and emit strict JSON, use **RAG** to ground every answer in the live help center, and keep a couple of stable policies pinned in the **system prompt** (long context). RAG handles *what's true*; fine-tuning handles *how it sounds*; the base model handles *how well it thinks*. Different jobs, same pipeline." },
      ],
    },
    {
      id: 'in-code',
      title: 'See the difference in code',
      blocks: [
        { type: 'p', text: "Enough theory — let's watch RAG earn its keep. The playground below asks the sandbox `llm()` a question it *cannot* possibly know (a private, fictional fact), first with no context, then with the same fact retrieved and pasted in. The first answer is a guess; the second is grounded. This gap, at scale, is the entire reason RAG exists." },
        { type: 'playground', id: 'rag-value', title: 'Ungrounded guess vs grounded answer', height: 520, code: `// A private fact the model was NEVER trained on.
// (Made up for this lesson — it exists nowhere on the internet.)
const PRIVATE_FACT =
  "Krenovate's Enterprise plan includes a 4-hour support SLA " +
  "and a dedicated Slack channel. It costs $900/month, billed annually."

const question = "What's the support SLA on Krenovate's Enterprise plan?"

// --- 1) UNGROUNDED: ask with no context. The model must guess. ---
console.log("=== WITHOUT RAG (ungrounded) ===")
const blind = await llm(question, {
  system: "You are a helpful support assistant."
})
console.log(blind)

// --- 2) GROUNDED: retrieve the fact, paste it in, then ask. ---
console.log("\\n=== WITH RAG (grounded in retrieved context) ===")
const groundedSystem = \`You are a helpful support assistant.
Answer ONLY using the CONTEXT below. If the context doesn't
contain the answer, say you don't know. Cite the context.

CONTEXT:
\${PRIVATE_FACT}\`
const grounded = await llm(question, { system: groundedSystem })
console.log(grounded)

// The first answer is invented; the second is anchored to a fact
// you supplied one line earlier. That's retrieve -> augment -> generate.`, solution: `// SOLUTION: make it a reusable RAG loop with a tiny retriever.
// A "knowledge base" of chunks; retrieve the most relevant, then ground.

const KB = [
  "Krenovate's Enterprise plan: 4-hour support SLA, dedicated Slack, $900/mo billed annually.",
  "Krenovate's Starter plan: 48-hour email support, $29/mo.",
  "Krenovate's data is hosted in EU and US regions with SOC 2 Type II.",
]

// Dumb-but-real retriever: rank chunks by keyword overlap with the query.
function retrieve(query, k = 1) {
  const terms = query.toLowerCase().split(/\\W+/).filter(Boolean)
  return KB
    .map(chunk => {
      const c = chunk.toLowerCase()
      const score = terms.reduce((s, t) => s + (c.includes(t) ? 1 : 0), 0)
      return { chunk, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(r => r.chunk)
}

async function ragAnswer(question) {
  const context = retrieve(question, 2).join("\\n")
  const system = \`You are a support assistant. Use ONLY this context;
if it's not here, say you don't know. Quote the fact you used.

CONTEXT:
\${context}\`
  return llm(question, { system })
}

console.log(await ragAnswer("What's the Enterprise SLA and price?"))
console.log("\\n---\\n")
console.log(await ragAnswer("Where is Krenovate's data hosted?"))
// Each answer is grounded in the chunk the retriever pulled.`, caption: '**Exercise:** run it as-is and compare the two answers. Then, in the solution, add a 4th chunk to `KB` and a question that should retrieve it — confirm the retriever pulls the right fact before the model answers.' },
        { type: 'h', text: 'The prompt that makes it work: context injection' },
        { type: 'p', text: "The heart of RAG is a prompt template that keeps three things separate and explicit: the **system instructions** (behave like this, and *only* use the context), the **retrieved documents** (the facts), and the **user question**. Here's the shape you'll build a hundred times — first in Python, then a fuller LangChain-style chain." },
        { type: 'code', lang: 'python', filename: 'context_injection.py', code: `from anthropic import Anthropic

client = Anthropic()

# 1) RETRIEVE — in real life this is a vector search (Module 6).
#    Here we fake it with the chunks a retriever would have returned.
retrieved_chunks = [
    "Enterprise plan: 4-hour support SLA, dedicated Slack channel.",
    "Enterprise plan pricing: $900/month, billed annually.",
]

question = "What's the SLA on the Enterprise plan, and what does it cost?"

# 2) AUGMENT — inject the chunks as context, with strict grounding rules.
context = "\\n".join(f"- {c}" for c in retrieved_chunks)
system = (
    "You are a support assistant. Answer the question using ONLY the "
    "context below. If the answer isn't in the context, say you don't "
    "know — do not guess. Cite the specific line(s) you used."
)
user = f"CONTEXT:\\n{context}\\n\\nQUESTION: {question}"

# 3) GENERATE — the model reasons over the facts you handed it.
resp = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=300,
    system=system,
    messages=[{"role": "user", "content": user}],
)
print(resp.content[0].text)
# -> "The Enterprise plan has a 4-hour support SLA and costs $900/month,
#     billed annually (per the provided context)."`, caption: 'The whole RAG pattern in one file: retrieve chunks, inject as context with grounding rules, generate. Everything else in this module makes each step better.' },
        { type: 'code', lang: 'python', filename: 'rag_chain.py', code: `# A minimal end-to-end RAG chain, LangChain-style, to show the shape.
# (Later lessons build each piece for real; this is the skeleton.)
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# Vector store built once from your docs (embeddings -> Module 6).
store = Chroma(embedding_function=OpenAIEmbeddings())
retriever = store.as_retriever(search_kwargs={"k": 4})  # top-4 chunks

prompt = ChatPromptTemplate.from_template(
    "Answer using ONLY the context. If it's not there, say you don't know.\\n"
    "Context:\\n{context}\\n\\nQuestion: {question}"
)
llm = ChatOpenAI(model="gpt-4o-mini")

def format_docs(docs):
    return "\\n\\n".join(d.page_content for d in docs)

# retrieve -> stuff into prompt -> generate. That arrow IS RAG.
chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
)

print(chain.invoke("What's the Enterprise support SLA?").content)`, caption: 'The retrieve -> augment -> generate arrow made literal. Swap the vector store, prompt, or model independently — that modularity is why RAG is the default architecture for knowledge apps.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your app answers questions about your company\'s internal HR policies. The policies are in a 200-page handbook that gets edited monthly, and answers must be traceable to the source. Which approach fits best?',
            options: [
              'Fine-tune a model on the handbook so it memorizes the policies',
              'RAG — retrieve the relevant handbook sections and ground the answer in them',
              'Just use a bigger, smarter base model',
              'Paste the entire 200-page handbook into every system prompt',
            ],
            answer: 1,
            explain: 'This is a knowledge problem with three RAG tells: the data is private, it changes often, and it needs citations. RAG updates instantly (edit the source), cites naturally (you retrieved the chunk), and stays cheap. Fine-tuning would need a retrain per edit and can\'t cite; pasting 200 pages blows the context window and budget; a bigger model still has never seen your handbook.',
          },
          {
            q: 'A teammate says: "Our chatbot\'s answers are factually right but they don\'t match our brand voice and sometimes return prose when we need strict JSON." What\'s the right fix?',
            options: [
              'Add RAG to retrieve more documents',
              'Fine-tuning (or better prompting) — this is a BEHAVIOR/format problem, not a knowledge gap',
              'A model with a later knowledge cutoff',
              'Increase the number of retrieved chunks (top-k)',
            ],
            answer: 1,
            explain: 'The facts are already correct, so retrieval isn\'t the issue. Consistent tone and rigid output shape are behavior — the classic fine-tuning (or strong prompt-engineering) use case. Remember the fork: knowledge -> RAG, behavior -> fine-tuning. Adding more retrieval wouldn\'t touch voice or JSON structure.',
          },
          {
            q: 'Why is RAG generally preferred over fine-tuning when the goal is to give a model access to a frequently-changing knowledge base?',
            options: [
              'Fine-tuning is impossible on modern models',
              'RAG lets you update facts by editing the source (instant, cheap, citable) instead of retraining, and it grounds answers to reduce hallucination',
              'RAG makes the base model fundamentally smarter at reasoning',
              'Fine-tuning always produces slower responses at inference time',
            ],
            answer: 1,
            explain: 'For knowledge, RAG wins on cost (embed a doc vs. run a training job), freshness (edit the source vs. retrain), citations (you have the chunk), and hallucination (answers are grounded in provided text). Fine-tuning teaches behavior/style well but bakes facts in slowly and leakily. RAG doesn\'t make the model smarter — it makes it *informed*.',
          },
          {
            q: 'You need your assistant to know exactly 3 small, stable facts (your company name, founding year, and support email) that never change. What\'s the most pragmatic approach?',
            options: [
              'Build a full RAG pipeline with a vector database for those 3 facts',
              'Fine-tune the model on those 3 facts',
              'Just put the 3 facts directly in the system prompt (long context)',
              'Switch to a bigger model and hope it learns them',
            ],
            answer: 2,
            explain: 'RAG shines for large or changing corpora. For a handful of small, static facts, the retrieval machinery is overkill — just paste them in the system prompt. That\'s the "long context" branch of the decision tree. Reserve RAG for when the knowledge is too big to paste or changes too often to hardcode.',
          },
          {
            q: 'In interviews you\'re asked: "Why can\'t you fix hallucination by just using GPT-5 or a bigger frontier model?" Best answer?',
            options: [
              'Bigger models never hallucinate',
              'A more capable model improves reasoning and general knowledge, but it still has zero access to your private or post-cutoff data — capability is not the same as knowledge, so it will still confidently guess',
              'Bigger models automatically include your company\'s private documents',
              'Model size only affects speed, not accuracy',
            ],
            answer: 1,
            explain: 'Capability and knowledge are different axes. A frontier model reasons and writes better, but your internal wiki and today\'s prices were never in its training data — so on *your* facts it still hallucinates. The decision tree separates "the model is dumb at the task" (bigger model) from "the model lacks my data" (RAG). Hallucination on private/fresh facts is a data-access problem.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l1-c1', front: 'What is RAG, in one sentence?', back: 'Retrieval-Augmented Generation: **retrieve** the text relevant to a question, **augment** the prompt by pasting it in as context, and **generate** an answer grounded in it. The model answers from provided facts, not memory.' },
          { id: 'm7-l1-c2', front: 'What two problems does RAG solve?', back: 'The **freshness gap** (world changed after the [[Knowledge Cutoff]]) and the **privacy gap** (fact was never public). Both share one root cause — the info isn\'t in the weights — and one cure: put it in the prompt.' },
          { id: 'm7-l1-c3', front: 'The core decision-tree question: RAG vs fine-tuning?', back: 'Is it a **KNOWLEDGE** problem or a **BEHAVIOR** problem? Facts/data/docs -> RAG. Tone/style/format/skill -> fine-tuning. Rule of thumb: *fine-tune for form, retrieve for facts.*' },
          { id: 'm7-l1-c4', front: 'When is long-context (just paste it) better than RAG?', back: 'When the knowledge is **small and static** — a few pages that rarely change. RAG\'s selective retrieval is for corpora too big to paste or too fresh to hardcode. Don\'t build a vector DB for 3 stable facts.' },
          { id: 'm7-l1-c5', front: 'Why does RAG beat fine-tuning for knowledge?', back: 'Cheaper to add data (embed vs. retrain), instantly updatable (edit the source), citable (you have the chunk), less hallucination (grounded), and supports per-user access control. Fine-tuning bakes facts in slowly and leakily.' },
          { id: 'm7-l1-c6', front: 'Do RAG, fine-tuning, and long-context compete?', back: 'No — they **compose**. A production app can use a capable base model (reasoning), fine-tuning (voice/format), RAG (live facts), and system-prompt facts (stable policies) together. Different jobs, one pipeline.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'LLMs have a [[Knowledge Cutoff]] and no access to private/fresh data; when they lack a fact they hallucinate confidently. That\'s the problem RAG exists to fix.',
          'RAG = retrieve relevant text, augment the prompt with it, generate a grounded answer. No retraining — you just hand the model the right page.',
          'The decision fork: KNOWLEDGE -> RAG; BEHAVIOR/style/format -> fine-tuning; small static facts -> long context; weak general skill -> bigger model.',
          'For knowledge, RAG beats fine-tuning on cost, freshness, citations, hallucination, and access control. Fine-tune for form, retrieve for facts.',
          'These approaches compose — real systems stack a capable model + fine-tuning + RAG + pinned system-prompt facts. This module builds the RAG layer.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Fine-tuning to inject facts', text: 'The single most common mistake. Fine-tuning teaches behavior, not truth — it bakes facts in slowly, can\'t cite them, still hallucinates around them, and needs a full retrain to update one number. For knowledge, reach for RAG almost every time.' },
          { title: 'Building RAG for 3 static facts', text: 'The opposite over-engineering error. If the knowledge is small and rarely changes, skip the vector database and just put it in the system prompt. RAG\'s machinery pays off at scale — corpora too big to paste or too fresh to hardcode.' },
          { title: 'Assuming a bigger model fixes it', text: 'Upgrading from a small model to a frontier one improves reasoning, not access to your data. A smarter model still has never seen your internal wiki or today\'s prices. Capability and knowledge are different axes; RAG addresses the second.' },
          { title: 'Forgetting that retrieval is now the bottleneck', text: 'RAG shifts the failure mode: if you retrieve the wrong chunks, the model faithfully grounds its answer in garbage. "Grounded" only helps if you ground it in the *right* text. The rest of this module is largely about retrieving well.' },
        ] },
        { type: 'interview', items: [
          { q: '"What is RAG and what problem does it solve?"', a: 'Retrieval-Augmented Generation: at query time you retrieve the text most relevant to the question — usually via semantic search over embeddings — inject it into the prompt as context, and have the LLM generate an answer grounded in it. It solves two things a raw model can\'t: accessing data after its knowledge cutoff, and accessing private data that was never in training. It also cuts hallucination, because the model synthesizes from provided sources instead of recalling from fuzzy memory, and it enables citations because you know exactly which chunk fed the answer.' },
          { q: '"When would you fine-tune instead of using RAG?"', a: 'When the gap is behavior, not knowledge. Fine-tuning is the right tool for consistent tone or brand voice, rigid output formats like strict JSON, domain-specific phrasing, or teaching a narrow skill the base model does poorly. It\'s a poor tool for facts: it bakes them into weights slowly and leakily, can\'t cite sources, and requires a retrain to update. My heuristic is "fine-tune for form, retrieve for facts" — and in production they often compose, e.g. a model fine-tuned for voice that uses RAG for grounding.' },
          { q: '"Why not just paste all your documents into the context window? Models support huge contexts now."', a: 'For a small, stable corpus you should — that\'s the pragmatic long-context choice. But it doesn\'t scale: a large or growing knowledge base won\'t fit, you pay for every token on every call, and accuracy degrades when the model must find one relevant fact buried in a massive context (the "lost in the middle" effect). RAG is selective — it retrieves only the handful of chunks relevant to *this* question, keeping the prompt small, cheap, and focused. It\'s long context done surgically instead of by brute force.' },
          { q: '"How do RAG, fine-tuning, and prompt engineering relate?"', a: 'They\'re complementary layers, not competitors. Prompt engineering shapes the instruction and is always in play. Fine-tuning adjusts the model\'s default behavior and style. RAG supplies external, current, private knowledge at query time. A mature system uses all three: a capable base model for reasoning, light fine-tuning or a strong system prompt for voice and format, and RAG to ground every answer in live data. Picking the right layer for a given problem — knowledge vs. behavior vs. capability — is the core architectural judgment.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Customer support bots over a help center', text: 'The canonical RAG app. Embed every help article once; each user question retrieves the relevant ones and the LLM answers grounded in them, with a link to the source. Answers stay current as docs are edited — no retraining.' },
          { title: '"Chat with your documents" tools', text: 'Notion AI, PDF chat, contract analyzers — upload files, they get chunked and embedded, and your questions retrieve the right passages. RAG is what lets a general model answer about *your* specific private files.' },
          { title: 'Internal knowledge assistants', text: 'Company Slack/wiki/Confluence bots that answer "what\'s our deployment process?" from live internal docs. Per-user retrieval filtering means employees only get answers grounded in documents they\'re allowed to see.' },
          { title: 'Coding assistants over a private codebase', text: 'Tools that retrieve relevant functions, docs, and past PRs from *your* repo before answering, so suggestions match your actual code — not just the public code the base model was trained on.' },
        ] },
        { type: 'project', title: 'Prove the RAG value gap', goal: 'Demonstrate, end to end, that grounding a model in a retrieved fact fixes a hallucination the base model can\'t avoid.', steps: [
          'Invent a private fact that exists nowhere online — e.g. "The Zephyr API rate limit is 240 requests/minute on the Pro tier." Write it down as your single-chunk "knowledge base."',
          'Ask a real chat model (or the Playground) a question that needs that fact, with NO context. Record the answer — it will guess, hedge, or invent a number.',
          'Now build the grounded prompt: a system message saying "answer only from the CONTEXT below, cite it, say you don\'t know if it\'s absent," then paste your fact as CONTEXT, then the same question.',
          'Run it again and record the grounded answer — it should state the correct number and reference the context.',
          'Add a twist: ask a question your context does NOT cover and confirm the grounded prompt now says "I don\'t know" instead of hallucinating. That refusal is RAG working correctly.',
        ], deliverable: 'A short writeup (or notebook) with the ungrounded answer, the grounded answer, and the "unanswerable" case side by side — a concrete before/after that proves grounding beats guessing.' },
        { type: 'challenge', title: 'Write the decision rule for a real scenario', text: 'You\'re architecting a support bot over your company\'s help center (thousands of articles, edited weekly, answers must cite a source, and the bot must always reply in your brand voice with a specific greeting/sign-off). Write the decision as an explicit checklist or flowchart: for each requirement, name which tool handles it (RAG, fine-tuning, long context, or bigger model) and justify why. Then state the final composed architecture in 2-3 sentences.', hints: [
          'Split requirements into KNOWLEDGE ("cite the right article", "stay current with weekly edits") and BEHAVIOR ("brand voice", "fixed greeting/sign-off"). Route each to the correct tool.',
          'The "thousands of articles, edited weekly" clause rules out both long-context (too big) and fine-tuning-for-facts (too stale) — that\'s your RAG justification, written explicitly.',
          'Your final answer should COMPOSE tools: RAG for grounding + citations, fine-tuning or a strong system prompt for voice/format, a capable base model underneath. Name each layer and the job it does.',
        ] },
        { type: 'reading', links: [
          { label: 'Retrieval-Augmented Generation (original paper, Lewis et al. 2020)', url: 'https://arxiv.org/abs/2005.11401', note: 'The paper that named RAG. Read the abstract and intro for the original motivation — combining a parametric model with a non-parametric retrieved memory.' },
          { label: 'Anthropic: Retrieval-augmented generation guide', url: 'https://docs.anthropic.com/en/docs/build-with-claude/embeddings', note: 'Provider-official framing of retrieval and grounding with Claude — where RAG fits alongside long context and tool use.' },
          { label: 'Pinecone: RAG vs. fine-tuning', url: 'https://www.pinecone.io/learn/rag-vs-fine-tuning/', note: 'A clear, practitioner-focused breakdown of the exact decision this lesson frames — knowledge vs. behavior, and when to combine both.' },
        ] },
      ],
    },
  ],
}
