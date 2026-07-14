// Lesson 1.5 — Hallucination, Bias & Failure Modes

export default {
  sections: [
    {
      id: 'why-it-lies',
      title: 'Why smart models say false things',
      blocks: [
        { type: 'p', text: "You've heard it three times now: *the loop must always emit a plausible next token*. This lesson turns that one-liner into an engineer's working model of **when** models fail, **how** to predict it, and **what** the standard defenses are. This is arguably the highest-leverage lesson in the module — hallucination handling separates AI demos from AI products." },
        { type: 'diagram', id: 'hallucination-branch', caption: 'Strong pattern → correct. Weak pattern → plausible invention. Identical confidence either way.' },
        { type: 'h', text: 'The failure taxonomy (know these by name)' },
        { type: 'list', items: [
          '**Factual [[Hallucination]]** — invents facts, citations, APIs, people. Risk spikes on niche topics, specifics (dates, numbers, names), and anything rare in training data.',
          '**Knowledge cutoff** — training data ends somewhere; without search/tools the model is frozen at that date and often *doesn\'t flag it*.',
          '**Sycophancy** — agrees with your framing. Ask "why is X true?" about a false X and watch it comply. Leading questions poison answers.',
          '**Bias** — training data is the internet, with its skews. Outputs mirror them in subtle ways: defaults, assumptions, examples chosen.',
          '**Confident arithmetic/logic errors** — predicts number-shaped text (Lesson 1.4). Same for precise dates, string operations, unit conversions.',
          '**Lost in the middle** — facts buried mid-context get less attention than the start/end. Long-document Q&A quietly degrades.',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the confident consultant', text: "A brilliant consultant who has read everything but is *contractually forbidden from saying 'I don't know'*. Ask about your industry — insightful. Ask about your company's Q3 numbers — an equally polished, entirely invented answer. Same suit, same confidence. Your job as the engineer: check their claims before they reach the client." },
      ],
    },
    {
      id: 'game',
      title: 'Play: spot the hallucination',
      blocks: [
        { type: 'p', text: "Three rounds. Real answer vs fabricated answer — both fluent, both confident. Notice how much *knowledge* it takes to tell them apart. Your users don't have that knowledge; that's the point." },
        { type: 'demo', id: 'hallucination-game' },
      ],
    },
    {
      id: 'defenses',
      title: "The engineer's defense kit",
      blocks: [
        { type: 'p', text: "You can't patch hallucination out of the model — you architect around it. The industry has converged on a standard kit, and this course teaches each layer in depth later. Here's the map:" },
        { type: 'table', headers: ['Defense', 'Idea', 'Where you learn it'], rows: [
          ['**Grounding / RAG**', 'Give the model source documents; instruct it to answer ONLY from them and cite.', 'Module 7'],
          ['**Permission to say "I don\'t know"', 'Explicitly instruct: if unsure, say so. Simple, surprisingly effective.', 'Module 3'],
          ['**Tool delegation**', 'Math → calculator, facts → search, code → interpreter. Don\'t predict what you can compute.', 'Module 8'],
          ['**Structured output + validation**', 'JSON schemas, checked fields, retry-on-invalid. Code verifies what prose can\'t.', 'Module 2'],
          ['**Evals & LLM-as-judge**', 'Measure hallucination rates on golden datasets before AND after shipping.', 'Module 10'],
          ['**Human-in-the-loop**', 'For high-stakes output: AI drafts, human approves. UX design, not model design.', 'Module 12'],
        ] },
        { type: 'code', lang: 'javascript', filename: 'defense-in-prompt.js', code: `// Defense layer 1 is free: it's just the prompt.
const system = \`You are a support assistant for Acme's API.

RULES:
- Answer ONLY from the provided documentation below.
- If the docs don't cover the question, say exactly:
  "I don't have documentation on that — escalating to a human."
- Never invent endpoint names, parameters, or error codes.
- Quote the relevant doc section when you answer.

DOCUMENTATION:
\${retrievedDocs}\`

// Not bulletproof — but this one prompt eliminates the majority
// of support-bot hallucinations. The rest of the kit catches the tail.`, caption: 'Grounding + explicit permission to abstain: the 20% of effort that removes 80% of hallucinations.' },
        { type: 'callout', variant: 'warn', text: "**Risk scales with stakes, not with frequency.** A recipe bot inventing a spice is funny. A medical/legal/financial bot inventing anything is a lawsuit. The defense kit you deploy should match the blast radius of a wrong answer — this is the first question to ask about any AI feature you design." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Which question is MOST likely to trigger a factual hallucination?',
            options: [
              '"Explain how HTTP cookies work"',
              '"What are the config options of the tiny open-source library `quickcache-lite`?"',
              '"Write a poem about autumn"',
              '"Summarize this pasted article"',
            ],
            answer: 1,
            explain: 'Niche + specific = weak training signal = plausible invention. Common concepts (cookies) are safe; creative tasks can\'t be "wrong"; summarizing provided text is grounded. The obscure library\'s config? Prime fabrication territory.',
          },
          {
            q: 'A user asks: "Why is Redux required for all React apps?" The model produces three convincing reasons. Which failure mode is this?',
            options: ['Knowledge cutoff', 'Sycophancy — accepting a false premise', 'Lost in the middle', 'Tokenization error'],
            answer: 1,
            explain: 'The premise is false (Redux isn\'t required), but the leading framing invites agreement. Models tend to answer the question as asked rather than challenge it. Defense: prompts that explicitly license premise-checking.',
          },
          {
            q: 'The single most effective architectural defense against hallucination in a docs-support bot is…',
            options: [
              'Raising temperature so answers vary',
              'Using a bigger model',
              'Grounding: provide the docs in context and restrict answers to them, with citations',
              'Making responses shorter',
            ],
            answer: 2,
            explain: 'Grounding transforms the task from "recall from weights" (hallucination-prone) to "read and cite provided text" (verifiable). Bigger models hallucinate less but still hallucinate; grounding changes the game.',
          },
          {
            q: 'Why is "just add a disclaimer" insufficient for a financial-advice AI feature?',
            options: [
              'Disclaimers are illegal in finance',
              'Defense should scale with the stakes of a wrong answer — high blast radius demands grounding, validation, and human review',
              'Users always read disclaimers carefully',
              'It is sufficient, actually',
            ],
            answer: 1,
            explain: 'The lesson\'s core design principle: match defenses to blast radius. Low stakes → prompt-level defenses fine. High stakes → grounding + structured validation + human-in-the-loop, because one confident fabrication can cause real harm.',
          },
          {
            q: 'Your model correctly answers "Who created React?" but invents an answer for "Who created the internal tool FlowMapper at your company?" Why the difference?',
            options: [
              'FlowMapper is too recent',
              'React appears massively in training data; FlowMapper appears zero times — but the loop must still emit plausible tokens',
              'The model dislikes internal tools',
              'Company names are filtered from training',
            ],
            answer: 1,
            explain: 'Strong pattern vs absent pattern — the diagram from this lesson. With zero signal, the most probable continuation is still *something that looks like an answer*. Internal/private knowledge is exactly what RAG exists to inject.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm1-l5-c1', front: 'Name 4 LLM failure modes beyond factual hallucination', back: 'Knowledge cutoff, sycophancy (agreeing with false premises), bias from training data, confident arithmetic/logic errors, lost-in-the-middle.' },
          { id: 'm1-l5-c2', front: 'When does hallucination risk spike?', back: 'Niche topics, precise specifics (names/dates/numbers/citations), and anything rare or absent in training data — weak pattern, same confident delivery.' },
          { id: 'm1-l5-c3', front: 'What is sycophancy?', back: 'The model\'s tendency to accept your framing — ask "why is X true" about a false X and it obliges. Leading questions poison answers.' },
          { id: 'm1-l5-c4', front: 'The 6-layer hallucination defense kit?', back: 'Grounding/RAG · permission to say "I don\'t know" · tool delegation · structured output + validation · evals · human-in-the-loop.' },
          { id: 'm1-l5-c5', front: 'The first question to ask about any AI feature?', back: 'What\'s the blast radius of a confidently wrong answer? Defenses scale with stakes, not with frequency.' },
          { id: 'm1-l5-c6', front: 'Why does grounding work so well?', back: 'It converts "recall from weights" (invention-prone) into "read and cite provided text" (verifiable). The task changes, not just the accuracy.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Hallucination is structural: weak pattern + mandatory output = plausible invention, delivered with full confidence.',
          'Know the taxonomy: factual invention, cutoff, sycophancy, bias, arithmetic errors, lost-in-the-middle.',
          'You architect around it: grounding, abstention permission, tools, validation, evals, human review.',
          'Defense investment scales with **blast radius**, not error frequency.',
          'The one free defense: a system prompt that grounds answers and licenses "I don\'t know".',
        ] },
        { type: 'mistakes', items: [
          { title: 'Demo-driven confidence', text: 'It answered 10 questions perfectly in the demo, so it ships. But you tested common knowledge (strong patterns). Production users ask about YOUR product (zero pattern). Test with niche, adversarial, and false-premise questions before believing anything.' },
          { title: 'Trusting model self-reports', text: '"Are you sure?" makes models apologize and change correct answers, or double down on wrong ones — it measures sycophancy, not accuracy. Verification must be external: sources, validators, evals.' },
          { title: 'One defense, applied everywhere', text: 'Grounding everything is overkill for a brainstorm tool; a disclaimer is negligence for medical advice. Map features to blast radius first, then choose proportional defenses.' },
          { title: 'Treating bias as someone else\'s problem', text: 'Your hiring-assistant demo defaults every engineer example to "he"? That\'s a shipped product decision now. Audit outputs across demographics for anything user-facing — Module 10 shows how to make it systematic.' },
        ] },
        { type: 'interview', items: [
          { q: '"How would you reduce hallucinations in a customer-facing support bot?"', a: 'Layer the kit: (1) ground on docs via RAG with citation requirements, (2) system prompt licensing abstention + escalation to humans, (3) validate structured claims (order numbers, prices) against the database before display, (4) eval suite with known-answer and known-UNANSWERABLE questions, (5) monitor escalation and thumbs-down rates in production. Name the trade-off: more grounding = more retrieval cost + latency.' },
          { q: '"What is sycophancy and why does it matter for product design?"', a: 'The tendency to agree with user framing — models answer leading questions as asked rather than challenging false premises. Product impact: any workflow where users state beliefs ("confirm this contract is safe") gets biased confirmation. Fixes: neutral reformulation of user queries, prompts that explicitly reward premise-checking, and never using "are you sure?" as validation.' },
          { q: '"Would you use an LLM to compute financial aggregations? Why not, and what instead?"', a: 'No — models predict number-shaped tokens, they don\'t execute arithmetic; errors are silent and confident. Pattern: LLM translates natural language → SQL/code (its strength), a real engine executes it, the LLM narrates verified results. Generate-execute-narrate. Same answer for dates, unit conversions, and precise string ops.' },
          { q: '"How do you TEST for hallucination before launch?"', a: 'Build a golden set: (1) known-answer questions with verifiable facts, (2) unanswerable questions where the correct behavior is abstention, (3) false-premise questions testing sycophancy, (4) niche long-tail questions about your own product. Score with exact checks where possible and LLM-as-judge for the rest; track the abstention-when-appropriate rate as a first-class metric.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Citation-first assistants (Perplexity)', text: 'Search-grounds every claim and shows sources inline — hallucination defense as the core product differentiator.' },
          { title: 'GitHub Copilot\'s scoping', text: 'Suggests code you review before running — human-in-the-loop by design. Contrast with autonomous code execution, which needs far heavier validation.' },
          { title: 'Legal AI (Harvey et al.)', text: 'After lawyers were sanctioned for fake AI-generated case citations, legal AI now verifies every citation against real databases. Blast-radius-driven engineering, learned the hard way.' },
          { title: 'E-commerce support bots', text: 'Answer from policy docs + order database lookups, never from model memory. "Where\'s my order?" is answered by a tool call, not a token prediction.' },
        ] },
        { type: 'project', title: 'Hallucination audit', goal: 'Build a mini eval that measures — with numbers — where a chat model fails, using the taxonomy from this lesson.', steps: [
          'Design 20 test questions in 4 groups of 5: (A) common knowledge, (B) niche specifics likely absent from training (your company, tiny libraries, local facts you can verify), (C) false-premise questions, (D) questions that SHOULD be answered "I don\'t know" or "that doesn\'t exist".',
          'Run all 20 against any free chat AI. Record verbatim answers.',
          'Score each: correct / hallucinated / correctly-abstained. Compute rates per group.',
          'Re-run group B and D with a grounding-style preamble: "If you are not certain, say \'I am not certain.\' Do not invent specifics." Measure the change.',
          'Write 5 conclusions. Expected shape: A near-perfect, B ugly, the preamble helping D a lot and B somewhat.',
        ], deliverable: 'audit.md with the 20 questions, score table before/after the preamble, and your 5 conclusions.' },
        { type: 'challenge', title: 'Break the smart intern', text: 'Craft ONE question that reliably makes a top model hallucinate on every retry. Constraint: a reasonable person would expect an honest "I don\'t know". Explain, using this lesson\'s vocabulary, exactly which conditions your question exploits.', hints: [
          'Combine niche + specific + plausible-sounding: "What year did [real-sounding fake person] found [plausible fake company]?"',
          'Or request citations for a real-but-obscure claim.',
          'The reliable formula: strong FORM pattern (the answer shape is common) + zero CONTENT pattern (the facts don\'t exist).',
        ] },
        { type: 'reading', links: [
          { label: 'Why language models hallucinate (OpenAI research overview)', url: 'https://openai.com/index/why-language-models-hallucinate/', note: 'Accessible research framing: evaluation incentives reward guessing over abstaining.' },
          { label: 'Anthropic docs: reducing hallucinations', url: 'https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations', note: 'Provider-official prompt techniques — practical and short.' },
          { label: 'Lost in the Middle (Liu et al.)', url: 'https://arxiv.org/abs/2307.03172', note: 'The long-context attention failure — the figures alone tell the story.' },
        ] },
      ],
    },
  ],
}
