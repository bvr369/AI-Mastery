// Lesson 7.4 — Retrieval Quality & RAG Evals

export default {
  sections: [
    {
      id: 'measure-before-blame',
      title: 'Measure before you blame',
      blocks: [
        { type: 'p', text: "Your RAG bot just answered a question wrong. The instinct is to reach for the model — swap to a bigger one, rewrite the system prompt, crank the instructions. Nine times out of ten that's the wrong move, because the bug lives one layer down: the model never got the right context in the first place. **You can't fix what you haven't measured**, and RAG has two things to measure, not one." },
        { type: 'p', text: "This lesson is about turning \"the bot feels kind of dumb\" into numbers you can act on. That shift — from vibes to metrics — is what separates a demo that impresses your manager once from a system you can actually improve week over week. It's also the single most common RAG interview topic, because it's where junior and senior engineers visibly diverge." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the open-book exam, graded twice', text: "Picture a student taking an open-book exam. They can fail two completely different ways. **One:** they flip to the wrong page and never find the relevant passage — a *research* failure. **Two:** they find the perfect passage and then misread it, ignore it, or make something up anyway — a *reasoning* failure. Same wrong answer on the paper, totally different fix. Grading only the final answer tells you they failed; grading each step tells you *why*. RAG evals grade both steps." },
        { type: 'h', text: 'The two failure layers' },
        { type: 'p', text: "Every RAG answer passes through two gates, and a failure at either one produces a bad response. Naming them is half the battle:" },
        { type: 'list', items: [
          "**Retrieval quality — did we fetch the right chunks?** This is the R in [[RAG]]. If the relevant passage never made it into the context window, the model is answering blind no matter how smart it is. Garbage retrieved, garbage generated.",
          "**Generation quality — did the model faithfully USE what we fetched?** Even with perfect context, the model can ignore it, contradict it, blend in stale training-data memories, or hallucinate a citation. This is [[Grounding]]: does the answer actually stick to the provided sources?",
        ] },
        { type: 'callout', variant: 'tip', title: 'The debugging flow that saves hours', text: "When an answer is bad, **check retrieval FIRST.** Print the chunks that were actually retrieved for that query and read them with your own eyes. If the right chunk isn't there, stop — it's a retrieval bug, and no prompt tweak will save you. Only if the correct chunk *was* retrieved and the model still blew it do you have a generation bug. This one habit — look at the retrieved context before touching the prompt — will resolve most of your RAG failures." },
      ],
    },
    {
      id: 'retrieval-metrics',
      title: 'Retrieval metrics: is the right chunk in the top-k?',
      blocks: [
        { type: 'p', text: "Retrieval is really just a ranking problem: given a query, your retriever returns an ordered list of chunks, and you keep the top **k** (say, the top 5). The whole question is whether the chunks that *should* be there actually are. To measure that you need a **labeled set**: a handful of real queries, each paired with the IDs of the chunks a human judged relevant — the ground truth. With that in hand, four classic metrics do the work." },
        { type: 'table', headers: ['Metric', 'Question it answers', 'Formula (per query)', 'When you care'], rows: [
          ['**Precision@k**', 'Of the k chunks I retrieved, how many were relevant?', 'relevant retrieved ÷ k', 'Context window is precious — junk chunks crowd out good ones and cost tokens'],
          ['**Recall@k**', 'Of all relevant chunks that exist, how many did I catch in the top-k?', 'relevant retrieved ÷ total relevant', 'Missing a key fact is fatal (legal, medical, support)'],
          ['**Hit-rate@k**', 'Did *at least one* relevant chunk make the top-k?', '1 if any relevant in top-k, else 0', 'A quick, forgiving health check — did we get *anything* right?'],
          ['**MRR**', 'How high up was the *first* relevant chunk?', '1 ÷ (rank of first relevant hit)', 'Ranking order matters — the best chunk should be near the top'],
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: precision vs recall, the fishing net', text: "Cast a net into a lake to catch trout. **Precision** is: of everything in your net, what fraction is actually trout (vs boots and seaweed)? **Recall** is: of all the trout in the lake, what fraction did you land? A tiny net over a known trout spot has high precision but low recall (you miss most fish). A giant net dragging the whole lake has high recall but low precision (you catch everything, including the junk). Tuning k is choosing your net size — and the two metrics pull against each other." },
        { type: 'p', text: "That tension is the core tradeoff. **Raise k** and recall goes up (you catch more relevant chunks) but precision drops (more junk sneaks in, and junk both wastes tokens and can distract the model). **Lower k** and precision improves but you risk dropping a chunk the answer needed. There's no universal right answer — it depends on how costly a *miss* is versus how costly a *distraction* is for your app." },
        { type: 'callout', variant: 'info', title: 'MRR, concretely', text: "[[Mean Reciprocal Rank]] rewards putting the best chunk first. If the first relevant chunk is at position 1, the reciprocal rank is 1/1 = 1.0. Position 2 → 1/2 = 0.5. Position 5 → 0.2. You average this across all your test queries. MRR is ideal when the model mostly leans on the top result, so *order*, not just presence, matters. Hit-rate only asks \"is it in there?\"; MRR asks \"is it near the top?\"" },
        { type: 'h', text: 'Tune the retriever, watch the metrics move' },
        { type: 'p', text: "Numbers on a page are abstract; watching them move as you turn knobs is where the intuition lands. In the demo below, adjust the retriever (change k, tighten or loosen the similarity threshold) and watch precision@k and recall@k trade off against each other in real time. Find the point where you're catching the relevant chunks without drowning them in noise." },
        { type: 'demo', id: 'retrieval-eval' },
        { type: 'callout', variant: 'tip', text: "Notice the shape of the tradeoff as you drag k upward: recall climbs toward 1.0 and then flattens, while precision slides down the whole way. The \"knee\" of that curve — where recall is high but precision hasn't cratered — is usually a sane default k for production. Then you validate it against real answer quality, not just the retrieval numbers." },
      ],
    },
    {
      id: 'generation-metrics',
      title: 'Generation metrics: did the model behave?',
      blocks: [
        { type: 'p', text: "Suppose retrieval is perfect — the golden chunk is sitting right there in the context. The model can still ruin the answer. It might invent a detail not in the sources, contradict them, answer a different question than the one asked, or cite chunk #3 for a claim that's actually only in chunk #1. Retrieval metrics are blind to all of this. You need a second family of metrics that grade the *generated answer* against the *retrieved context*." },
        { type: 'table', headers: ['Metric', 'What it checks', 'Failure it catches'], rows: [
          ['**Faithfulness / Groundedness**', 'Is every claim in the answer supported by the retrieved context?', 'Hallucination — the model added facts that aren\'t in the sources'],
          ['**Answer relevance**', 'Does the answer actually address the user\'s question?', 'Evasion or drift — a fluent answer to the wrong question'],
          ['**Citation accuracy**', 'Do the cited chunks actually contain the claims they\'re attached to?', 'Fake or mismatched citations — right-looking source, wrong content'],
          ['**Context precision/recall**', 'Was the retrieved context relevant, and did it cover the answer?', 'Bridges the two layers — grades retrieval *as the generator experienced it*'],
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: faithfulness is a book report, not an essay', text: "[[Faithfulness]] asks the model to write a *book report*, not a creative essay. A book report may only contain what's actually in the book; the moment the student adds \"and then the dragon appeared\" — a fun detail that's nowhere in the text — the report is unfaithful, no matter how well-written. A grounded RAG answer is the same: every claim must trace back to the retrieved context. If a sentence has no home in the sources, it's a hallucination wearing a nice outfit." },
        { type: 'h', text: 'How do you measure something this fuzzy? LLM-as-judge' },
        { type: 'p', text: "\"Is this claim supported by that paragraph?\" is a judgment call — you can't regex it. The standard trick is **LLM-as-judge**: use a second LLM call, with a careful rubric, to grade the answer. To score faithfulness you decompose the answer into individual claims, then ask the judge whether each claim is supported by the retrieved context. Faithfulness = supported claims ÷ total claims. It's the same open-book grading a human would do, automated and cheap enough to run on hundreds of examples." },
        { type: 'code', lang: 'javascript', filename: 'llm-judge.js', code: `// LLM-as-judge for faithfulness. The judge sees ONLY the context and the
// answer — never the model's training knowledge — and grades claim by claim.
const JUDGE_SYSTEM = \`You are a strict grading judge for a RAG system.
You will be given CONTEXT and an ANSWER.
Split the ANSWER into individual factual claims.
For EACH claim, decide if it is fully supported by the CONTEXT alone.
Do not use any outside knowledge. If a claim is not in the CONTEXT, it is UNSUPPORTED.
Return JSON: { "claims": [ { "claim": "...", "supported": true|false } ] }\`;

async function faithfulness(context, answer) {
  const raw = await llm(
    \`CONTEXT:\\n\${context}\\n\\nANSWER:\\n\${answer}\`,
    { system: JUDGE_SYSTEM, json: true }
  );
  const { claims } = JSON.parse(raw);
  const supported = claims.filter((c) => c.supported).length;
  return supported / claims.length; // 1.0 = fully grounded, 0 = all hallucinated
}`, caption: 'The judge is deliberately told to ignore outside knowledge — otherwise it "helpfully" confirms claims that are true in general but absent from your context.' },
        { type: 'callout', variant: 'warn', title: 'LLM-as-judge is useful, not gospel', text: "A judge model has its own biases: it can be swayed by fluent writing, favor longer answers, or be inconsistent run-to-run. Mitigate it — use a strong model as the judge, give it a crisp rubric with examples, force structured JSON output, and *calibrate against human labels* on a sample before you trust the numbers. Treat judge scores as a fast, noisy signal that tracks quality, not as ground truth handed down from the mountain." },
      ],
    },
    {
      id: 'frameworks-and-golden-sets',
      title: 'Golden sets and the frameworks that score them',
      blocks: [
        { type: 'p', text: "You don't build this from scratch every time. The engine of any RAG eval is a **golden set** (also called an eval set): a curated list of test cases, each with a question, the ideal answer or the relevant chunk IDs, and sometimes a reference answer. It's the RAG equivalent of a test suite — and like tests, its value is that it catches regressions the moment you change an embedding model, a chunking strategy, or a prompt." },
        { type: 'callout', variant: 'tip', title: 'Build the golden set from REAL queries', text: "The best golden set isn't invented at a whiteboard — it's mined from your logs. Pull the actual questions users asked, especially the ones that failed. Add the tricky edge cases support keeps escalating. For each, have a human label the relevant chunks and write the ideal answer. Fifty *real, representative* questions beat five hundred synthetic ones, because they match the distribution your system actually faces. Grow the set every time a new failure mode surfaces." },
        { type: 'p', text: "Once you have a golden set, a framework automates the scoring. **[[Ragas]]** is the most popular RAG-specific one: you hand it your questions, retrieved contexts, generated answers, and (optionally) ground-truth answers, and it computes faithfulness, answer relevance, context precision, and context recall — many of them via LLM-as-judge under the hood. Others in this space: **TruLens**, **DeepEval**, **Phoenix/Arize**, and LangChain's built-in evaluators. They differ in ergonomics, not in the core idea." },
        { type: 'code', lang: 'python', filename: 'ragas_eval.py', code: `# Ragas-style evaluation: score a RAG system on a labeled dataset.
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    faithfulness,        # answer claims supported by retrieved context?
    answer_relevancy,    # does the answer address the question?
    context_precision,   # were the retrieved chunks relevant?
    context_recall,      # did retrieval cover the ground-truth answer?
)

# One row per test question. In practice this comes from your golden set,
# with 'contexts' filled in by actually running your retriever.
data = {
    "question":      ["What is our refund window for annual plans?"],
    "answer":        ["Annual plans can be refunded within 30 days of purchase."],
    "contexts":      [["Refunds: annual subscriptions are eligible for a full "
                       "refund within 30 days of the initial charge."]],
    "ground_truth":  ["Annual plans are refundable within 30 days."],
}

dataset = Dataset.from_dict(data)

result = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)
print(result)
# -> {'faithfulness': 1.00, 'answer_relevancy': 0.98,
#     'context_precision': 1.00, 'context_recall': 1.00}
# Run this on every commit that touches retrieval or prompts — it's your RAG CI.`, caption: 'Ragas turns "does our RAG work?" into a dashboard of numbers. The same dataset re-scored after each change is how you prove an improvement instead of guessing at one.' },
        { type: 'callout', variant: 'info', title: 'Reference-free vs reference-based', text: "Some metrics need a human-written `ground_truth` answer (context recall, answer correctness) — powerful but expensive to label. Others are *reference-free*: faithfulness and answer relevance only need the question, context, and answer, all of which you already have. Start with reference-free metrics for cheap, broad coverage, then invest in ground-truth labels for the high-stakes queries where correctness must be pinned down exactly." },
      ],
    },
    {
      id: 'build-the-evaluator',
      title: 'Build a RAG evaluator (runnable)',
      blocks: [
        { type: 'p', text: "Enough theory — let's compute these metrics ourselves. The playground below is a complete miniature RAG eval: a labeled set of queries with known-relevant chunk IDs, a toy retriever, and functions that compute **precision@k** and **recall@k** against the ground truth, plus a simple **faithfulness check** that flags any fact in the answer that doesn't appear in the retrieved chunks. Run it, read the report, then do the exercise in the caption." },
        { type: 'playground', id: 'rag-eval-lab', title: 'Compute precision@k, recall@k, and a faithfulness check', height: 560, code: `// --- A tiny labeled corpus. Each doc has an id and text. ---
const corpus = {
  d1: "Annual plans can be refunded within 30 days of purchase.",
  d2: "Monthly plans are non-refundable but cancel anytime.",
  d3: "Enterprise SLA guarantees 99.9% uptime and 1-hour support response.",
  d4: "Password resets are sent to the email on file within 5 minutes.",
  d5: "Refund requests are processed back to the original payment method.",
};

// --- Golden set: query -> the doc ids a human judged relevant. ---
const golden = [
  { q: "How do I get a refund on my yearly subscription?", relevant: ["d1", "d5"] },
  { q: "What's the enterprise uptime guarantee?",          relevant: ["d3"] },
];

// --- A toy retriever. Real code embeds + cosine-ranks; here we fake a
// ranking by keyword overlap so the lesson stays offline & deterministic. ---
function retrieve(query, k) {
  const qWords = new Set(query.toLowerCase().match(/[a-z]+/g));
  return Object.entries(corpus)
    .map(([id, text]) => {
      const overlap = text.toLowerCase().match(/[a-z]+/g)
        .filter((w) => qWords.has(w)).length;
      return { id, score: overlap };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.id);
}

// --- Retrieval metrics for ONE query ---
function precisionAtK(retrieved, relevant) {
  const hits = retrieved.filter((id) => relevant.includes(id)).length;
  return hits / retrieved.length;          // of what we fetched, how much was good
}
function recallAtK(retrieved, relevant) {
  const hits = retrieved.filter((id) => relevant.includes(id)).length;
  return hits / relevant.length;           // of all good chunks, how many we caught
}

const K = 2;
console.log("=== RETRIEVAL METRICS (k=" + K + ") ===");
let pSum = 0, rSum = 0;
for (const { q, relevant } of golden) {
  const retrieved = retrieve(q, K);
  const p = precisionAtK(retrieved, relevant);
  const r = recallAtK(retrieved, relevant);
  pSum += p; rSum += r;
  console.log(\`Q: \${q}\`);
  console.log(\`   retrieved=[\${retrieved}]  relevant=[\${relevant}]\`);
  console.log(\`   precision@\${K}=\${p.toFixed(2)}  recall@\${K}=\${r.toFixed(2)}\`);
}
console.log(\`\\nMEAN precision@\${K}=\${(pSum / golden.length).toFixed(2)}  \` +
            \`MEAN recall@\${K}=\${(rSum / golden.length).toFixed(2)}\`);

// --- GENERATION metric: a crude faithfulness check. ---
// Every "fact" (here: number-bearing statement) in the answer must appear
// in the retrieved context, or we flag it as ungrounded.
function faithfulnessCheck(answer, contextText) {
  const ctx = contextText.toLowerCase();
  const facts = answer.split(/[.\\n]/).map((s) => s.trim()).filter(Boolean);
  const ungrounded = facts.filter((f) => {
    const nums = f.match(/\\d+/g) || [];
    // if the fact cites a number not present in the context, it's suspect
    return nums.some((n) => !ctx.includes(n));
  });
  return { grounded: ungrounded.length === 0, ungrounded };
}

console.log("\\n=== FAITHFULNESS CHECK ===");
const ctx = [corpus.d1, corpus.d5].join(" ");
const goodAnswer = "Annual plans are refundable within 30 days.";
const badAnswer  = "Annual plans are refundable within 60 days.";  // wrong number!
console.log("good ->", faithfulnessCheck(goodAnswer, ctx));
console.log("bad  ->", faithfulnessCheck(badAnswer, ctx));`, solution: `// SOLUTION: add hit-rate@k and MRR, and sweep k to see the tradeoff.
const corpus = {
  d1: "Annual plans can be refunded within 30 days of purchase.",
  d2: "Monthly plans are non-refundable but cancel anytime.",
  d3: "Enterprise SLA guarantees 99.9% uptime and 1-hour support response.",
  d4: "Password resets are sent to the email on file within 5 minutes.",
  d5: "Refund requests are processed back to the original payment method.",
};
const golden = [
  { q: "How do I get a refund on my yearly subscription?", relevant: ["d1", "d5"] },
  { q: "What's the enterprise uptime guarantee?",          relevant: ["d3"] },
];
function retrieve(query, k) {
  const qWords = new Set(query.toLowerCase().match(/[a-z]+/g));
  return Object.entries(corpus)
    .map(([id, text]) => ({
      id,
      score: text.toLowerCase().match(/[a-z]+/g).filter((w) => qWords.has(w)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.id);
}
const hit = (ret, rel) => (ret.some((id) => rel.includes(id)) ? 1 : 0);
const reciprocalRank = (ret, rel) => {
  const i = ret.findIndex((id) => rel.includes(id));
  return i === -1 ? 0 : 1 / (i + 1);
};
const precision = (ret, rel) => ret.filter((id) => rel.includes(id)).length / ret.length;
const recall    = (ret, rel) => ret.filter((id) => rel.includes(id)).length / rel.length;

for (const K of [1, 2, 3, 5]) {
  let p = 0, r = 0, h = 0, m = 0;
  for (const { q, relevant } of golden) {
    const ret = retrieve(q, K);
    p += precision(ret, relevant);
    r += recall(ret, relevant);
    h += hit(ret, relevant);
    m += reciprocalRank(ret, relevant);
  }
  const n = golden.length;
  console.log(\`k=\${K}  P=\${(p/n).toFixed(2)}  R=\${(r/n).toFixed(2)}  \` +
              \`hit-rate=\${(h/n).toFixed(2)}  MRR=\${(m/n).toFixed(2)}\`);
}
// Watch recall & hit-rate rise while precision falls as k grows — the tradeoff.`, caption: '**Exercise:** add a `hitRate@k` (1 if any relevant chunk is in the top-k) and an `MRR` (1 / rank of the first relevant hit). Then loop k over [1, 2, 3, 5] and print all four metrics per k. Watch precision fall while recall climbs — that curve is the whole tuning problem. (Solution provided.)' },
        { type: 'callout', variant: 'info', title: 'From toy retriever to real one', text: "The `retrieve()` above fakes ranking with keyword overlap so the lesson runs offline. In production you'd swap that one function for an embedding search — embed the query, cosine-rank the chunks (Module 5), return the top-k. **Every other line of the eval stays identical.** That's the point: your metrics harness doesn't care how retrieval works, only what it returns. Build the eval once and it outlives every retriever you'll try." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your RAG bot gives a wrong answer to a user question. What is the FIRST thing you should check?',
            options: [
              'Swap to a larger, more capable generation model',
              'Print the chunks that were actually retrieved for that query and read them',
              'Rewrite the system prompt to be stricter about accuracy',
              'Lower the temperature to reduce randomness',
            ],
            answer: 1,
            explain: 'Check retrieval first. If the relevant chunk never made it into the context, no prompt tweak or bigger model can fix it — the model is answering blind. Reading the retrieved chunks instantly tells you whether it\'s a retrieval bug or a generation bug, which need completely different fixes.',
          },
          {
            q: 'A retriever returns 10 chunks for a query. 3 of them are relevant, and there are 4 relevant chunks in the whole corpus. What are precision@10 and recall@10?',
            options: [
              'Precision = 0.75, Recall = 0.30',
              'Precision = 0.30, Recall = 0.75',
              'Precision = 0.40, Recall = 0.30',
              'Precision = 0.30, Recall = 0.40',
            ],
            answer: 1,
            explain: 'Precision@k = relevant retrieved ÷ k = 3/10 = 0.30 (of what we fetched, 30% was good). Recall@k = relevant retrieved ÷ total relevant = 3/4 = 0.75 (we caught 75% of all relevant chunks). Precision is about the noise in your net; recall is about the fish you missed.',
          },
          {
            q: 'Retrieval is perfect — the exact right chunk is in the context — but the answer still states a fact that contradicts that chunk. Which metric is designed to catch this, and what does it measure?',
            options: [
              'Recall@k — whether all relevant chunks were retrieved',
              'MRR — how high the first relevant chunk was ranked',
              'Faithfulness / groundedness — whether every claim in the answer is supported by the retrieved context',
              'Precision@k — whether the retrieved chunks were relevant',
            ],
            answer: 2,
            explain: 'This is a generation failure, invisible to retrieval metrics. Faithfulness (groundedness) checks each claim in the answer against the provided context; a claim that contradicts or isn\'t supported by the context is flagged. It\'s the "book report, not creative essay" rule made measurable.',
          },
          {
            q: 'Why is LLM-as-judge the standard approach for scoring faithfulness, rather than a simple string or regex match?',
            options: [
              'Regex is too slow to run on large datasets',
              'Whether a claim is "supported by" a passage is a semantic judgment that exact-matching can\'t make, but a rubric-guided LLM can',
              'LLM judges are always perfectly accurate and unbiased',
              'String matching requires a ground-truth answer, which is never available',
            ],
            answer: 1,
            explain: '"Is this claim supported by that paragraph?" is a meaning-level judgment — the same words can support or contradict depending on context, and paraphrases have no shared tokens. A rubric-guided LLM approximates human grading at scale. It\'s noisy and biased (option 3 is wrong — always calibrate against human labels), but far better than brittle string matching.',
          },
          {
            q: 'You increase k from 3 to 10 in your retriever. Recall@k improves noticeably, but users report the bot\'s answers got vaguer and it sometimes cites irrelevant details. What most likely happened?',
            options: [
              'Higher k always improves every metric; the reports are unrelated',
              'Precision@k dropped — more irrelevant chunks entered the context, distracting the model and diluting the answer',
              'The embedding model changed when you raised k',
              'Recall and precision are the same metric, so this is impossible',
            ],
            answer: 1,
            explain: 'Precision and recall trade off. Raising k catches more relevant chunks (recall up) but also drags in more junk (precision down). Those extra irrelevant chunks eat context budget and distract the generator, producing vaguer answers and stray citations. The fix is finding the "knee" of the curve — high recall before precision craters — not just maximizing k.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l4-c1', front: 'The two failure layers of a RAG system?', back: '**Retrieval** — did we fetch the right chunks? (the R in RAG). **Generation** — did the model faithfully USE the fetched chunks? Same bad answer, different fixes. Always debug retrieval first.' },
          { id: 'm7-l4-c2', front: 'Precision@k vs Recall@k?', back: 'Precision@k = relevant retrieved ÷ k (how clean is my net?). Recall@k = relevant retrieved ÷ total relevant (how many fish did I catch?). They trade off: raising k lifts recall but drops precision.' },
          { id: 'm7-l4-c3', front: 'What is MRR (Mean Reciprocal Rank)?', back: 'Averages 1 ÷ (rank of the first relevant chunk) across queries. First hit at position 1 → 1.0, position 2 → 0.5. Rewards putting the best chunk near the top; use when the generator leans on top results.' },
          { id: 'm7-l4-c4', front: 'What is faithfulness / groundedness?', back: 'Whether every claim in the generated answer is supported by the retrieved context. A "book report, not a creative essay" — any fact with no home in the sources is a hallucination. Usually scored via LLM-as-judge.' },
          { id: 'm7-l4-c5', front: 'What is a golden (eval) set, and where does it come from?', back: 'A curated list of test cases — question + relevant chunk IDs + ideal answer. Best mined from REAL user queries (especially failures), human-labeled. It\'s your RAG test suite: catches regressions when you change chunking, embeddings, or prompts.' },
          { id: 'm7-l4-c6', front: 'What does Ragas do?', back: 'A RAG-eval framework: given questions, retrieved contexts, answers, and optional ground truth, it scores faithfulness, answer relevance, context precision, and context recall (many via LLM-as-judge). Run it as RAG CI on every change.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'A RAG answer can fail two ways: bad retrieval (wrong chunks fetched) or bad generation (model ignored/misused good chunks). Debug retrieval FIRST.',
          'Retrieval metrics: precision@k (net cleanliness), recall@k (fish caught), hit-rate@k (caught anything?), MRR (how high was the first hit?). Precision and recall trade off as you tune k.',
          'Generation metrics: faithfulness/groundedness (claims supported by context), answer relevance (addresses the question), citation accuracy — usually scored via LLM-as-judge.',
          'Build a golden set from REAL user queries with human-labeled relevant chunks; it\'s your RAG test suite and regression guard.',
          'Frameworks like Ragas automate the scoring; run them as CI so every retrieval or prompt change is measured, not guessed.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Blaming the model before checking retrieval', text: 'The reflex to swap models or rewrite the prompt when an answer is wrong wastes days. Most RAG failures are retrieval failures — the right chunk never arrived. Always print and read the retrieved context first; if the answer isn\'t in there, the generator was never the problem.' },
          { title: 'Only grading the final answer', text: 'A single end-to-end "is the answer good?" score can\'t tell you why it failed. Measure the two layers separately — retrieval metrics AND groundedness — or you\'re debugging blind, unable to tell a research failure from a reasoning one.' },
          { title: 'Evaluating on made-up questions', text: 'Whiteboard queries don\'t match the messy, ambiguous questions real users ask. A golden set mined from production logs (especially past failures) measures the distribution you actually face. Fifty real questions beat five hundred synthetic ones.' },
          { title: 'Trusting the LLM judge blindly', text: 'Judge models are biased toward fluent, long answers and can be inconsistent. Never ship judge scores without calibrating them against human labels on a sample, forcing structured output, and giving a crisp rubric. It\'s a fast noisy signal, not ground truth.' },
        ] },
        { type: 'interview', items: [
          { q: '"Your RAG chatbot is giving wrong answers. Walk me through how you\'d debug it."', a: 'First I separate the two failure layers. I take the failing queries and print the chunks the retriever actually returned. If the relevant chunk isn\'t there, it\'s a retrieval bug — I look at chunking, the embedding model, k, and whether hybrid search would help, and I measure with precision@k and recall@k against a labeled set. If the right chunk WAS retrieved and the answer\'s still wrong, it\'s a generation bug — I check faithfulness (is the answer grounded in the context?) and tighten the prompt or model. The key is I never guess: I look at the retrieved context before touching anything, because retrieval and generation need completely different fixes.' },
          { q: '"Explain precision@k and recall@k and the tradeoff between them."', a: 'Precision@k is, of the k chunks I retrieved, what fraction were relevant — it measures noise in the context. Recall@k is, of all the relevant chunks that exist, what fraction I caught in the top-k — it measures what I missed. They pull against each other: raising k improves recall (I catch more relevant chunks) but hurts precision (more junk sneaks in, wasting context budget and distracting the model). The right k depends on cost asymmetry — if missing a fact is catastrophic (legal, medical) I bias toward recall; if a tight, cheap context matters more, I bias toward precision. I tune it empirically against a golden set, looking for the knee where recall is high before precision collapses.' },
          { q: '"How do you measure whether an LLM answer is faithful to its sources, at scale?"', a: 'Faithfulness means every claim in the answer is supported by the retrieved context. Since that\'s a semantic judgment, not a string match, I use LLM-as-judge: a second model decomposes the answer into individual claims and grades each one as supported or not, using only the context — no outside knowledge. Faithfulness is supported claims over total claims. I make the judge reliable with a strong model, a crisp rubric, structured JSON output, and — critically — calibration against a sample of human labels so I know how much to trust the score. Frameworks like Ragas package this exact flow.' },
          { q: '"How would you set up continuous evaluation for a RAG system in production?"', a: 'I build a golden set from real user queries — pulling failures and edge cases from logs, with humans labeling the relevant chunks and ideal answers. I wire a framework like Ragas into CI so that every change to chunking, embeddings, retrieval, or prompts re-scores the golden set on retrieval metrics (precision/recall/MRR) and generation metrics (faithfulness, answer relevance). A regression on any metric blocks the change or flags it for review. I also log live traffic and periodically sample it back into the golden set so the eval keeps up with how usage drifts. The goal is that "did this change help?" is always a number, never an opinion.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Support-bot regression gates', text: 'Companies running "chat with our docs" support bots keep a golden set of the hardest tickets and re-score it on every deploy. A drop in faithfulness or recall blocks the release before customers see a hallucinated policy.' },
          { title: 'Legal & medical retrieval audits', text: 'In high-stakes domains a missed clause is unacceptable, so teams optimize hard for recall@k and run citation-accuracy checks — every claim must trace to a real, correct source before an answer is shown.' },
          { title: 'Embedding-model bake-offs', text: 'Choosing between embedding models (or chunking strategies) is decided by running each through the same golden set and comparing retrieval metrics — an objective bake-off instead of a vibe check.' },
          { title: 'Observability platforms', text: 'Tools like Arize Phoenix, LangSmith, and TruLens trace live RAG traffic and score faithfulness/relevance continuously, surfacing drift and per-query failures on a dashboard so teams catch degradation in production.' },
        ] },
        { type: 'project', title: 'Build a small RAG eval', goal: 'Measure a real (or toy) RAG pipeline on both layers and diagnose whether its failures are retrieval or generation.', steps: [
          'Assemble a labeled query set: 8–10 questions, each tagged with the chunk IDs a human judges relevant (mine real questions if you have logs; invent realistic ones otherwise).',
          'Run your retriever for each query and compute precision@k and recall@k against the labels. Record the mean across queries and note which questions score worst.',
          'Generate an answer for each query with the retrieved context, then run a groundedness check — flag any answer whose claims aren\'t supported by its retrieved chunks (start with the number-matching heuristic from the playground, or an LLM judge).',
          'For each failing question, classify the failure: retrieval (the relevant chunk was missing) or generation (chunk was present but the answer ignored/contradicted it).',
          'Write a one-paragraph diagnosis: which layer is your bottleneck, and what you\'d change first (chunking/embeddings/k for retrieval; prompt/model for generation).',
        ], deliverable: 'A `rag_eval.js` (or `.py`) that prints per-query precision/recall and a groundedness verdict, plus a short notes file classifying each failure as retrieval vs generation.' },
        { type: 'challenge', title: 'Add an LLM-as-judge faithfulness score', text: 'Upgrade the playground\'s crude number-matching faithfulness check into a real LLM-as-judge. Use the sandbox `llm()` as the judge: feed it the retrieved context and the generated answer, have it split the answer into claims and mark each as supported or not, then compute faithfulness = supported ÷ total. Compare the LLM judge\'s verdicts against the heuristic on a few answers and note where they disagree.', hints: [
          'Give the judge a strict system prompt: grade using ONLY the context, no outside knowledge, and return structured JSON like { claims: [{ claim, supported }] }.',
          'Force JSON output and parse it; average the `supported` booleans to get the score. Handle the case where the model returns malformed JSON.',
          'Deliberately craft one answer with a subtle hallucination (a plausible fact not in the context) and confirm the judge catches what a keyword check would miss.',
        ] },
        { type: 'reading', links: [
          { label: 'Ragas documentation', url: 'https://docs.ragas.io/', note: 'The official docs for the most popular RAG-eval framework — metric definitions (faithfulness, answer relevance, context precision/recall) and runnable examples.' },
          { label: 'Pinecone: RAG evaluation guide', url: 'https://www.pinecone.io/learn/series/vector-databases-in-production-for-busy-engineers/rag-evaluation/', note: 'A practical, developer-focused walkthrough of evaluating retrieval and generation separately, with the metrics that matter in production.' },
          { label: 'Hugging Face Cookbook: LLM-as-a-judge', url: 'https://huggingface.co/learn/cookbook/en/llm_judge', note: 'A hands-on guide to building and calibrating an LLM judge, including the biases to watch for and how to check it against human labels.' },
        ] },
      ],
    },
  ],
}
