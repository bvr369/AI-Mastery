// Lesson 7.5 — Citations & Grounded Answers

export default {
  sections: [
    {
      id: 'why-citations',
      title: "An answer you can't verify is a rumor with good grammar",
      blocks: [
        { type: 'p', text: "By now your RAG pipeline retrieves good chunks and stuffs them into the prompt. The model reads them and writes a fluent, confident answer. Here's the uncomfortable question your boss (or your legal team) will eventually ask: **how do we know it's true?** A polished paragraph is not evidence. If you can't point to *which retrieved chunk* backs each claim, you've built a very expensive way to launder hallucinations into prose." },
        { type: 'p', text: "This lesson is about closing that gap. Two moves do almost all the work: force the model to **cite its sources** ([[Grounding]] each claim to a specific chunk), and force it to **admit when the context doesn't contain the answer** (abstention). Together they turn \"trust me\" into \"check for yourself\" — which is the difference between a demo and a product people are allowed to rely on." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the journalist vs the gossip', text: "A gossip tells you a great story and you have no idea if it's real. A journalist tells you the same story but every sentence is footnoted: \"according to the Q3 filing [1], per the mayor's office [2].\" You can *audit* the journalist. When one footnote turns out to be wrong, you catch it — and you trust the rest more precisely because it's checkable. Citations turn your model from a gossip into a journalist." },
        { type: 'p', text: "This isn't a nice-to-have in regulated domains — it's the whole ballgame. A medical assistant that says \"take 400mg\" **must** link to the source document, because a human has to verify it before acting. A legal-research tool that cites a case that doesn't exist gets lawyers sanctioned (this has literally happened). Auditability, user trust, and hallucination-catching all ride on the same mechanism: every claim traceable to a source." },
        { type: 'h', text: 'What citations actually buy you' },
        { type: 'list', items: [
          "**Auditability** — a human (or another system) can open the cited chunk and confirm the claim. Non-negotiable in legal, medical, finance, compliance.",
          "**Trust & UX** — users believe a grounded answer more, and rightly so. Clickable citations let them drill in instead of taking your word for it.",
          "**Hallucination detection** — if the model cites chunk [3] but chunk [3] doesn't say that, you've *caught* a fabrication programmatically. No citation, no way to catch it.",
          "**Debuggability** — when an answer is wrong, citations tell you *why*: bad retrieval (wrong chunk pulled) vs bad generation (right chunk, model misread it). Different bugs, different fixes.",
        ] },
        { type: 'callout', variant: 'info', title: 'Callback to Lesson 1.5', text: "Remember the core hallucination defense from Module 1: a model will happily invent a confident answer rather than say \"I don't know.\" Grounding + abstention is that defense operationalized for RAG. You're not hoping the model is honest — you're structurally *removing its permission* to answer from outside the provided context, and giving it an explicit escape hatch (\"say you don't know\") so it doesn't have to fabricate to satisfy you." },
      ],
    },
    {
      id: 'prompting-for-grounding',
      title: 'The grounding prompt: three rules that change everything',
      blocks: [
        { type: 'p', text: "Grounding is mostly a prompting discipline. You give the model the retrieved context, label each chunk with an id, and impose three rules. Get these three right and the behavior transforms." },
        { type: 'list', items: [
          "**Answer ONLY from the context.** \"Use only the information in the sources below. Do not use prior knowledge.\" This is the leash — it stops the model from blending training-data memories into the answer.",
          "**Cite every claim.** \"After each sentence, cite the source id(s) that support it, like `[1]` or `[2][3]`.\" This makes grounding *visible and checkable* instead of an unfalsifiable promise.",
          "**Abstain when unsupported.** \"If the sources don't contain the answer, say exactly: *I don't have enough information to answer that.* Do not guess.\" This is the escape hatch that prevents fabrication under pressure.",
        ] },
        { type: 'code', lang: 'javascript', filename: 'grounding-prompt.js', code: `// The grounding system prompt — the load-bearing part of a trustworthy RAG app.
const GROUNDING_SYSTEM = \`You are a precise assistant that answers ONLY from the
provided sources. Follow these rules exactly:

1. Use ONLY the information in the SOURCES below. Do not use prior knowledge.
2. After every sentence, cite the source id(s) that support it, e.g. [1] or [2][3].
3. If the sources do not contain enough information to answer, respond with
   exactly: "I don't have enough information to answer that."
   Do not guess, infer beyond the text, or fill gaps from memory.
4. Do not cite a source for a claim it does not actually support.\`

// Build the user turn: the labeled context + the question.
function buildPrompt(chunks, question) {
  const sources = chunks
    .map((c, i) => \`[\${i + 1}] (\${c.source}) \${c.text}\`)
    .join("\\n\\n")
  return \`SOURCES:\\n\${sources}\\n\\nQUESTION: \${question}\`
}`, caption: 'The chunk ids the model cites are the *same* ids you print in this list. That shared numbering is what makes citations verifiable later.' },
        { type: 'callout', variant: 'warn', title: 'Citations are necessary, not sufficient', text: "A citation says \"the model *claims* chunk [2] supports this.\" It does **not** guarantee chunk [2] actually does. Models still paraphrase wrong, over-generalize, or attach a real citation to a subtly false statement — a plausible sentence with a genuine-looking `[2]` bolted on. That's why the second half of this lesson is *verification*: don't just render citations, check them." },
        { type: 'p', text: "One more subtlety: **attribution is not correctness**. The model can cite the right chunk and still misread it — say the chunk reads \"revenue grew *except* in EMEA\" and the answer says \"revenue grew everywhere [2].\" The citation is real, the claim is wrong. Verification has to check that the cited text *entails* the claim, not merely that the id exists." },
      ],
    },
    {
      id: 'demo',
      title: 'See grounding and verification in action',
      blocks: [
        { type: 'p', text: "This is the centerpiece. Below is a grounded-answer view: an answer with inline `[n]` citation markers, the retrieved chunks beside it, and two things to poke at. **Click any citation** to jump to the chunk it points to and judge for yourself whether it supports the claim. Then **toggle strict grounding off** and watch the answer drift — it starts asserting things no chunk actually says, and stops abstaining on questions the context can't support." },
        { type: 'demo', id: 'citation-grounding' },
        { type: 'p', text: "Two things to notice. First, with strict grounding **on**, every sentence carries a marker and the out-of-scope question triggers an honest \"I don't have enough information\" — that abstention is a *feature*, not a failure. Second, clicking a citation is exactly what your users will do: verification isn't a backend nicety, it's the primary trust affordance in the UI. An answer whose citations you can't click is an answer you're asking users to take on faith." },
        { type: 'callout', variant: 'tip', title: 'Render citations as first-class UI', text: "In production, don't leave `[2]` as raw text. Parse the markers, turn them into clickable superscripts or chips, and on click scroll to / highlight the source chunk (with its title, section, and a link to the original doc). Perplexity, ChatGPT-with-search, and Claude's citations all do this. The clickable footnote *is* the product's trust signal — treat it like a core component, not an afterthought." },
      ],
    },
    {
      id: 'verify-in-code',
      title: 'Parse, verify, and abstain (runnable)',
      blocks: [
        { type: 'p', text: "Now make it real. A grounded-answer function does four things: build the grounding prompt, call the model with the retrieved context, **parse** the `[n]` markers out of the answer, and **verify** each one points to a real chunk. The playground below does exactly this against the sandbox `llm()`. Run it, read the verification report, then do the exercise in the caption." },
        { type: 'playground', id: 'grounded-answer', title: 'A grounded-answer function with citation verification', height: 560, code: `// A mini grounded-RAG loop: prompt for citations, then verify them.

// 1) Pretend these came out of your retriever (top-k chunks).
const chunks = [
  { id: 1, source: "refund-policy.md", text: "Customers may request a refund within 30 days of purchase." },
  { id: 2, source: "refund-policy.md", text: "Refunds are issued to the original payment method within 5 business days." },
  { id: 3, source: "shipping.md",      text: "Standard shipping takes 3 to 7 business days within the US." },
]

// 2) The grounding system prompt (answer only from context; cite; abstain).
const system = \`Answer ONLY from the SOURCES. After each sentence cite the
source id(s) like [1]. If the sources lack the answer, reply exactly:
"I don't have enough information to answer that." Never guess.\`

function buildPrompt(chunks, question) {
  const sources = chunks.map(c => \`[\${c.id}] (\${c.source}) \${c.text}\`).join("\\n")
  return \`SOURCES:\\n\${sources}\\n\\nQUESTION: \${question}\`
}

// 3) Ask a question the context CAN answer.
const question = "How long do I have to request a refund, and how is it paid back?"
const answer = await llm(buildPrompt(chunks, question), { system })
console.log("ANSWER:\\n" + answer + "\\n")

// 4) Parse the [n] markers and verify each maps to a real chunk.
function citedIds(text) {
  const ids = new Set()
  for (const m of text.matchAll(/\\[(\\d+)\\]/g)) ids.add(Number(m[1]))
  return [...ids]
}
const validIds = new Set(chunks.map(c => c.id))

const cited = citedIds(answer)
console.log("Cited ids:", cited)
for (const id of cited) {
  const ok = validIds.has(id)
  console.log(\`  [\${id}] -> \${ok ? "OK (real chunk)" : "INVALID — no such chunk!"}\`)
}
if (cited.length === 0 && !/enough information/i.test(answer)) {
  console.log("WARNING: an answer with zero citations that didn't abstain.")
}`, solution: `// SOLUTION: add abstention testing + a "hallucinated citation" guard.
const chunks = [
  { id: 1, source: "refund-policy.md", text: "Customers may request a refund within 30 days of purchase." },
  { id: 2, source: "refund-policy.md", text: "Refunds are issued to the original payment method within 5 business days." },
  { id: 3, source: "shipping.md",      text: "Standard shipping takes 3 to 7 business days within the US." },
]
const system = \`Answer ONLY from the SOURCES. After each sentence cite the
source id(s) like [1]. If the sources lack the answer, reply exactly:
"I don't have enough information to answer that." Never guess.\`
const buildPrompt = (chunks, q) =>
  \`SOURCES:\\n\${chunks.map(c => \`[\${c.id}] (\${c.source}) \${c.text}\`).join("\\n")}\\n\\nQUESTION: \${q}\`

const validIds = new Set(chunks.map(c => c.id))
const citedIds = t => [...new Set([...t.matchAll(/\\[(\\d+)\\]/g)].map(m => Number(m[1])))]

async function groundedAnswer(question) {
  const answer = await llm(buildPrompt(chunks, question), { system })
  const abstained = /enough information/i.test(answer)
  const cited = citedIds(answer)
  const invalid = cited.filter(id => !validIds.has(id))   // hallucinated citations
  return { question, answer, abstained, cited, invalid }
}

// Case A: answerable — expect citations, no abstention, no invalid ids.
// Case B: OUT of scope — expect an honest abstention (context can't answer it).
for (const q of [
  "How long do I have to request a refund?",
  "What is your CEO's home address?",
]) {
  const r = await groundedAnswer(q)
  console.log("Q:", r.question)
  console.log("  abstained:", r.abstained, "| cited:", r.cited, "| invalid:", r.invalid)
  console.log("  answer:", r.answer, "\\n")
}
// The out-of-scope question SHOULD abstain instead of inventing an address.`, caption: '**Exercise:** add a second call that asks something the chunks *cannot* answer (e.g. the CEO\'s address) and confirm the model abstains instead of inventing one. Then flag any cited id that is not in `validIds` as a hallucinated citation. (Solution provided.)' },
        { type: 'h', text: 'The real thing: a grounded RAG chain in Python' },
        { type: 'p', text: "Here's the production shape. Same three rules, a real chat model, and a verification pass that goes beyond \"does the id exist\" toward \"does the cited chunk actually support the claim.\" The cheap check is set membership; the stronger check uses a second model call (an LLM judge) to test entailment sentence-by-sentence." },
        { type: 'code', lang: 'python', filename: 'grounded_rag.py', code: `import re
from openai import OpenAI

client = OpenAI()

GROUNDING_SYSTEM = """Answer ONLY from the SOURCES below. Do not use prior knowledge.
After every sentence, cite the supporting source id(s) like [1] or [2][3].
If the sources do not contain the answer, reply exactly:
"I don't have enough information to answer that." Never guess."""

def build_prompt(chunks, question):
    sources = "\\n".join(f"[{c['id']}] ({c['source']}) {c['text']}" for c in chunks)
    return f"SOURCES:\\n{sources}\\n\\nQUESTION: {question}"

def grounded_answer(chunks, question):
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,   # deterministic, less room to embellish
        messages=[
            {"role": "system", "content": GROUNDING_SYSTEM},
            {"role": "user",   "content": build_prompt(chunks, question)},
        ],
    )
    return resp.choices[0].message.content

def cited_ids(text):
    return {int(m) for m in re.findall(r"\\[(\\d+)\\]", text)}

def verify(answer, chunks):
    valid = {c["id"] for c in chunks}
    cited = cited_ids(answer)
    invalid = cited - valid                      # citations to non-existent chunks
    abstained = "enough information" in answer.lower()
    uncited = (not cited) and not abstained      # asserted something with no source
    return {"cited": cited, "invalid": invalid,
            "abstained": abstained, "uncited_claim": uncited}

chunks = [
    {"id": 1, "source": "policy.md", "text": "Refunds are available within 30 days."},
    {"id": 2, "source": "policy.md", "text": "Refunds go to the original payment method."},
]
ans = grounded_answer(chunks, "Can I get a refund and how is it paid?")
print(ans)
print(verify(ans, chunks))
# Cheap checks catch fake ids + un-grounded answers. For real support-checking,
# add an LLM judge that asks: "Does chunk [2] entail this sentence? yes/no."`, caption: 'temperature=0 plus the three rules is the workhorse config. The verify() pass is your programmatic hallucination alarm.' },
        { type: 'callout', variant: 'info', title: 'Provider-native citations', text: "Some APIs give you grounding for free. Anthropic's **Citations** feature lets you pass documents and get back answers with citation objects pointing to exact character ranges in the source — no `[n]` parsing, and the model is trained not to fabricate them. When your platform offers native citations, prefer them: they're more reliable than prompt-and-regex and the spans are guaranteed to reference real source text." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your RAG legal assistant returns a fluent answer citing "[4]" — but your retriever only returned 3 chunks. What has almost certainly happened, and what should your system do?',
            options: [
              'The model found a 4th document on its own; render it as-is',
              'The model fabricated a citation; a verification pass should flag [4] as invalid (no such chunk) and refuse or warn',
              'Nothing is wrong — models renumber citations internally',
              'Raise the temperature so it stops citing',
            ],
            answer: 1,
            explain: 'A citation to a chunk that was never provided is a hallucinated citation — the classic failure. Set-membership verification (is the cited id in the retrieved set?) catches it instantly. This is exactly why you verify rather than trust the markers, especially in legal or medical.',
          },
          {
            q: 'A chunk says "Q3 revenue grew in every region except EMEA." The model answers "Revenue grew across all regions [2]." The citation id is valid. Is this answer trustworthy?',
            options: [
              'Yes — the citation points to a real, retrieved chunk',
              'No — attribution is not correctness; the cited chunk does not actually support (in fact contradicts) the claim',
              'Yes — as long as temperature was 0',
              'It cannot be evaluated without embeddings',
            ],
            answer: 1,
            explain: 'A valid citation only proves the id exists, not that the chunk entails the claim. Here the model over-generalized and the citation is real but the statement is false. Strong verification checks entailment (often via an LLM judge), not just id existence.',
          },
          {
            q: 'Which instruction is the core hallucination defense that lets a grounded model avoid fabricating when the context is insufficient?',
            options: [
              '"Be as detailed and comprehensive as possible."',
              '"If the sources do not contain the answer, say you do not have enough information — do not guess."',
              '"Always give the user a confident final answer."',
              '"Summarize everything you know about the topic."',
            ],
            answer: 1,
            explain: 'An explicit abstention clause is the escape hatch (Module 1.5). Without permission to say "I do not know," a model under pressure to be helpful will invent an answer. The abstention instruction removes the incentive to fabricate.',
          },
          {
            q: 'You want the highest-value payoff of clickable inline citations in your RAG UI. Which is it?',
            options: [
              'They make the answer longer, which users prefer',
              'They let users and auditors verify each claim against its source, converting "trust me" into "check for yourself"',
              'They reduce the token cost of the generation',
              'They let you skip the retrieval step',
            ],
            answer: 1,
            explain: 'Auditability is the point. A clickable citation lets a human open the source and confirm the claim — essential for trust and mandatory in regulated domains. It also turns the UI into a hallucination-catcher: a citation that does not support its claim becomes visible.',
          },
          {
            q: 'In an interview: "How do you keep a RAG system from hallucinating?" Which answer best reflects this lesson?',
            options: [
              'Use a bigger model and hope it hallucinates less',
              'Ground answers strictly in retrieved context, require inline citations, allow explicit abstention, and verify that each citation actually supports its claim',
              'Increase the number of retrieved chunks to 100 so something is always relevant',
              'Turn temperature to 1.0 for more creative answers',
            ],
            answer: 1,
            explain: 'The layered defense: restrict to context (grounding), make claims traceable (citations), permit "I do not know" (abstention), and check the citations (verification). No single knob fixes hallucination; this combination is the engineering answer interviewers want.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm7-l5-c1', front: 'Why do citations matter in RAG?', back: 'Auditability, trust, and hallucination-catching. A human can open the cited chunk and verify the claim — mandatory in legal/medical/finance. No citation means no way to check or catch a fabrication.' },
          { id: 'm7-l5-c2', front: 'The three grounding-prompt rules?', back: '1) Answer ONLY from the provided context (no prior knowledge). 2) Cite the source id after every claim, like [1]. 3) If the context lacks the answer, abstain with a fixed phrase — never guess.' },
          { id: 'm7-l5-c3', front: 'What is abstention and why does it matter?', back: 'The model explicitly refusing or escalating when the context cannot support an answer. It is the core hallucination defense (Module 1.5): giving the model permission to say "I do not know" removes its incentive to fabricate.' },
          { id: 'm7-l5-c4', front: 'Attribution vs correctness?', back: 'A valid citation proves the chunk id exists, NOT that the chunk supports the claim. The model can cite the right source and still paraphrase it wrong. Verification must check entailment, not just id existence.' },
          { id: 'm7-l5-c5', front: 'How do you verify a citation programmatically?', back: 'Cheap check: parse the [n] markers and confirm each id is in the retrieved set (catches fabricated ids). Strong check: an LLM judge asks "does this chunk entail this sentence? yes/no" to catch valid-id-but-false claims.' },
          { id: 'm7-l5-c6', front: 'How should citations be rendered in a UI?', back: 'As clickable first-class elements (superscripts/chips) that scroll to and highlight the source chunk with its title, section, and link. The clickable footnote is the product\'s primary trust affordance — not raw [2] text.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'An unverifiable answer is a liability; citations make every claim traceable to a source — the basis of auditability and trust.',
          'Grounding is three prompt rules: answer only from context, cite each claim, and abstain when the context cannot support an answer.',
          'Abstention (say "I do not know") is the core hallucination defense from Module 1.5, operationalized for RAG.',
          'Attribution is not correctness: a real citation can still back a false claim, so verify that the cited chunk actually supports the statement.',
          'Verify cheaply (cited id is in the retrieved set) and strongly (LLM-judge entailment), and render citations as clickable, checkable UI.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Rendering citations without verifying them', text: 'Printing `[2]` next to a sentence *looks* trustworthy and is the easiest thing to fake. If you never check that chunk 2 supports the claim (or even exists), you have added a trust signal with no trust behind it. Always run at least the set-membership check; ideally an entailment check too.' },
          { title: 'No abstention path, so the model always answers', text: 'If your prompt never says "you may say I do not know," the model will fabricate before it disappoints you. Every grounded prompt needs an explicit, exactly-worded abstention clause — and you should test that out-of-scope questions actually trigger it.' },
          { title: 'Confusing "cited a real chunk" with "the claim is true"', text: 'A valid citation id is necessary but not sufficient. Models over-generalize, negate, or misread sourced text while attaching a genuine-looking marker. Verify entailment, not just id existence — the subtle failures are the dangerous ones.' },
          { title: 'Grounding prompt but retrieval is garbage', text: 'Perfect citations to the *wrong* chunks are still wrong answers. If retrieval pulls irrelevant context, the model faithfully grounds in junk. Citations expose this (you can see the bad chunk), but the fix is upstream in retrieval — grounding cannot rescue bad recall.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you make a RAG answer trustworthy and auditable?"', a: 'I ground generation strictly in the retrieved context and require inline citations tying each claim to a chunk id. The system prompt has three rules: answer only from the sources, cite every claim like [1], and abstain with a fixed phrase if the context is insufficient. Then I verify: cheaply, every cited id must be in the retrieved set (catches fabricated citations); more strongly, an LLM judge checks that each cited chunk actually entails the sentence (catches valid-id-but-false claims). In the UI, citations are clickable and jump to the highlighted source so a human can audit any claim. That combination — grounding, citations, abstention, verification — is what turns a demo into something a regulated team can rely on.' },
          { q: '"A citation points to a real retrieved chunk, but the answer is still wrong. How is that possible, and how do you catch it?"', a: 'Attribution is not correctness. The model can cite the right chunk and still misread it — over-generalizing ("grew everywhere" when the chunk said "everywhere except EMEA"), negating, or inferring beyond the text. The id exists, so set-membership verification passes, but the claim is false. To catch it you need an entailment check: a second model call, per sentence, asking "does this cited chunk support this exact statement? yes/no," and flag or drop the ones that fail. That is the difference between checking that a footnote exists and checking that it says what you claim.' },
          { q: '"Why is letting the model say I do not know a feature, not a bug?"', a: 'Because the alternative is fabrication. A model optimized to be helpful will, absent permission to abstain, invent a confident answer when the context does not contain one — which is the single most damaging failure mode in a grounded system. An explicit abstention clause removes the pressure to fabricate: it makes "the sources do not cover this" a valid, expected outcome. In regulated domains, an honest "I do not have enough information, please consult X" is vastly safer than a plausible wrong answer, and it also cleanly signals a retrieval gap you can go fix.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Legal & compliance research', text: 'Tools like Harvey and Thomson Reuters CoCounsel cite the exact case, statute, or clause behind every assertion. Lawyers verify before relying — and a fabricated citation is a career risk, so verification is mandatory, not optional.' },
          { title: 'Medical & clinical assistants', text: 'A clinician-facing assistant links each recommendation to the source guideline or paper. The human confirms against the citation before acting; abstention ("insufficient evidence in provided sources") is safer than a confident wrong dose.' },
          { title: 'Enterprise "chat with your docs"', text: 'Glean, Perplexity Enterprise, and Notion AI answer over internal wikis with clickable citations to the exact page or section, so employees trust the answer and can jump to the canonical doc to confirm or read more.' },
          { title: 'Customer support deflection', text: 'Grounded support bots answer only from the help center and cite the article, so agents and users can verify. Abstention routes genuinely-uncovered questions to a human instead of inventing a policy.' },
        ] },
        { type: 'project', title: 'Build a grounded-answer function', goal: 'Implement a trustworthy RAG answer end to end: prompt for citations, abstain when unsupported, then verify every citation maps to a real chunk.', steps: [
          'Define a small set of 4–6 chunks as objects with `{ id, source, text }` covering one topic (e.g. a product return policy). These stand in for retriever output.',
          'Write the grounding system prompt with the three rules (answer only from context; cite each claim like [n]; abstain with a fixed phrase if unsupported) and a `buildPrompt(chunks, question)` that labels each chunk with its id.',
          'Call the model (sandbox `llm()` or a real API at temperature 0) for two questions: one the chunks CAN answer and one they CANNOT.',
          'Write `citedIds(answer)` (regex the `[n]` markers) and verify each id is in your chunk set; flag any that is not as a hallucinated citation. Also flag an answer that made a claim with zero citations and did not abstain.',
          'Confirm the out-of-scope question triggers abstention rather than a fabricated answer. Print a small report: answer, cited ids, invalid ids, abstained?.',
        ], deliverable: 'A `groundedAnswer(question)` function (JS or Python) that returns the answer plus a verification report, demonstrated on one answerable and one unanswerable question.' },
        { type: 'challenge', title: 'Add an entailment post-check', text: 'Extend your grounded-answer function with a claim-level verifier that catches the "valid citation, false claim" failure. Split the answer into sentences; for each sentence with a citation [n], make a second LLM call asking "Does the following source text support this exact claim? Answer yes or no." Flag every sentence whose cited chunk does NOT entail it — those are grounded-looking hallucinations that set-membership checks miss.', hints: [
          'Keep the judge prompt tiny and binary: give it just the one sentence and the one cited chunk, and force a yes/no (temperature 0) so the output is easy to parse.',
          'A sentence citing multiple ids [2][3] is supported if ANY cited chunk entails it — check them together or as a union.',
          'Decide the policy for a failed check: drop the sentence, replace it with an abstention, or surface an "unverified" flag in the UI. Each is a legitimate product choice — pick one and justify it.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: Citations', url: 'https://docs.anthropic.com/en/docs/build-with-claude/citations', note: 'Provider-native grounded citations — pass documents, get back answers with verifiable character-range citations. Prefer this over regex-parsing when available.' },
          { label: 'OpenAI: Retrieval & grounding best practices', url: 'https://platform.openai.com/docs/guides/retrieval', note: 'The other lab\'s guidance on grounding generation in retrieved context and structuring sources for citation.' },
          { label: 'Pinecone: Reducing hallucinations in RAG', url: 'https://www.pinecone.io/learn/reduce-hallucinations/', note: 'A practical walkthrough of grounding, abstention, and verification as layered hallucination defenses in a RAG pipeline.' },
        ] },
      ],
    },
  ],
}
