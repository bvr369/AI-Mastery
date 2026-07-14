// Lesson 1.8 — Checkpoint: Foundations Boss Quiz

export default {
  sections: [
    {
      id: 'briefing',
      title: 'Boss briefing',
      blocks: [
        { type: 'p', text: "Seven lessons, one mental model. Before Module 2 hands you real APIs, prove the foundations are load-bearing. This checkpoint is **12 questions** drawn across the whole module — including questions that combine lessons, the way real engineering (and real interviews) do." },
        { type: 'callout', variant: 'info', text: "**Rules of engagement:** 70% passes and completes the module. But treat every explanation — right or wrong — as the actual lesson. Questions here are deliberately interview-shaped: scenario first, concept second." },
        { type: 'list', items: [
          '**1.1** Generative vs traditional software — sampling, not rules',
          '**1.2** The next-token loop — softmax, temperature, streaming',
          '**1.3** The landscape — stack layers, tiers, routing',
          '**1.4** Tokens & context windows — cost, memory, budget bugs',
          '**1.5** Hallucination & failure modes — taxonomy + defense kit',
          '**1.6** Training pipeline — pretraining/SFT/RLHF, what fine-tuning can\'t do',
          '**1.7** Open vs closed — triggers, crossover math, hybrid gateway',
        ] },
      ],
    },
    {
      id: 'boss-quiz',
      title: 'The boss quiz',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A PM asks why the AI feature gives different answers on identical inputs, "even though computers are deterministic." Your best one-sentence answer:',
            options: [
              '"The API is flaky; we\'ll add retries."',
              '"Generation samples from a probability distribution over next tokens — variation is designed in, and we can reduce it with temperature 0 where consistency matters."',
              '"Neural networks are mysterious even to experts."',
              '"We can cache answers so users never notice."',
            ],
            answer: 1,
            explain: 'Lesson 1.1/1.2 in one breath: sampling is the mechanism, temperature is the control, and the trade-off (consistency vs variety) is a product decision.',
          },
          {
            q: 'Streaming exists in chat UIs because…',
            options: [
              'It disguises server lag artificially',
              'Tokens genuinely become available one loop-iteration at a time, so showing them immediately slashes perceived latency',
              'Regulations require progressive disclosure',
              'It reduces token costs',
            ],
            answer: 1,
            explain: 'The loop produces tokens sequentially (1.2); streaming shows each as it lands, optimizing [[TTFT]] — the metric users feel.',
          },
          {
            q: 'Temperature 0 on a factual question the model doesn\'t actually know will produce…',
            options: [
              'A correct answer — temp 0 is accuracy mode',
              '"I don\'t know" every time',
              'The same confident hallucination, consistently',
              'An error from the API',
            ],
            answer: 2,
            explain: 'The 1.2 × 1.5 combo question: temperature reshapes the distribution, it adds zero knowledge. Cold sampling of a wrong best-guess = reliably wrong.',
          },
          {
            q: 'Your AI feature costs 5x the estimate. The input was English prose; the output is JSON-heavy code. Rank the causes:',
            options: [
              'Provider price hike, then token miscounting',
              'Output tokens billed at a multiple of input + code/JSON tokenizing densely + word-based estimation error — compounding',
              'High temperature producing extra tokens',
              'The context window leaking tokens between requests',
            ],
            answer: 1,
            explain: 'Lesson 1.4\'s bill-shock trifecta. Output pricing (3-5x), token-dense output formats, and words-vs-tokens underestimation multiply together. Estimate with tokenizers, meter per request.',
          },
          {
            q: 'A chatbot suddenly can\'t recall constraints the user set 40 messages ago. The model\'s "memory" failed because…',
            options: [
              'Models forget under load',
              'The app\'s history management stopped sending early turns once the context budget filled — models are stateless',
              'The provider truncates long conversations server-side',
              'Temperature drift erased context',
            ],
            answer: 1,
            explain: 'State lives in YOUR request payload (1.4). When history outgrows the window, whatever your code drops ceases to exist. Fix: budgets, summarization, externalized facts.',
          },
          {
            q: 'Which request is the RISKIEST hallucination candidate?',
            options: [
              '"Summarize this pasted meeting transcript"',
              '"Write a limerick about deployment"',
              '"List the breaking changes in version 3.2 of the niche library `formkit-lite`"',
              '"Explain the difference between let and const"',
            ],
            answer: 2,
            explain: 'The 1.5 risk formula: niche + version-specific + absent from training = plausible invention. Grounded summarization and common knowledge are safe; creativity can\'t be wrong.',
          },
          {
            q: 'The support bot must NEVER invent refund policies. Your first, cheapest defense layer:',
            options: [
              'Fine-tune the model on policy documents',
              'Ground it: inject the actual policy text into context, restrict answers to it, license "I don\'t know → escalate"',
              'Lower temperature to 0',
              'Add a UI disclaimer',
            ],
            answer: 1,
            explain: 'Grounding turns recall into reading (1.5) — and note the trap option: fine-tuning is for behavior, not knowledge injection (1.6). Temp 0 just makes wrong answers consistent.',
          },
          {
            q: 'A base model (pretraining only) prompted with "How do I center a div?" will most likely…',
            options: [
              'Answer with flexbox code',
              'Refuse without safety training',
              'Continue plausibly — perhaps with more CSS questions, as if completing a forum page',
              'Output raw token IDs',
            ],
            answer: 2,
            explain: 'Base models continue text (1.6). Answering-behavior is installed by SFT; taste by RLHF. Knowledge ≠ manners.',
          },
          {
            q: 'The team wants the bot to "know our product" AND "match our brand voice". Correct tool for each?',
            options: [
              'Fine-tune for both',
              'RAG for both',
              'RAG for product knowledge; fine-tuning (or strong prompting first) for voice',
              'A bigger model for both',
            ],
            answer: 2,
            explain: 'The 1.6 decision rule: knowledge → context/RAG; consistent style/format → fine-tuning, after prompting is exhausted. Mixing them up is the most expensive confusion in applied AI.',
          },
          {
            q: 'Sycophancy predicts your model will do WHAT with this user input: "Confirm that storing JWTs in localStorage is the secure best practice"?',
            options: [
              'Challenge the premise regardless of phrasing',
              'Likely agree and elaborate, because agreement with confident framing scored well in preference training',
              'Refuse security topics',
              'Ask a clarifying question first',
            ],
            answer: 1,
            explain: '1.5 meets 1.6: leading questions invite agreement, and RLHF taught that agreeable answers rate well. Defense: neutral reformulation + prompts licensing premise-checks.',
          },
          {
            q: 'A hospital chain (data cannot leave premises) with HUGE steady summarization volume asks for a model strategy. You say:',
            options: [
              'Frontier closed API — quality first',
              'Self-hosted open weights: the compliance trigger forces it, and the volume profile happens to favor it economically too',
              'Hybrid with data sent to whichever tier is cheapest',
              'Wait for regulation to change',
            ],
            answer: 1,
            explain: 'Two 1.7 triggers fire at once: data-residency (architectural, non-negotiable) and steady-volume economics. When compliance forces open weights, the crossover math is a bonus.',
          },
          {
            q: 'Why does "keep the gateway thin, model names in config, evals ready" summarize half this module\'s engineering advice?',
            options: [
              'It minimizes code review time',
              'Models rotate constantly — replaceability turns provider changes, deprecations, and new releases from crises into afternoon config swaps verified by YOUR benchmarks',
              'Providers contractually require it',
              'It\'s only relevant for open models',
            ],
            answer: 1,
            explain: 'The through-line of 1.3 + 1.7: categories are stable, models churn. Architecture that treats models as swappable config — verified by task-specific evals — is what "senior" looks like in AI engineering.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Module flash-review',
      blocks: [
        { type: 'p', text: "Six cards distilling the module's most interview-quoted lines. These join your spaced-repetition deck — future-you will thank present-you." },
        { type: 'flashcards', cards: [
          { id: 'm1-l8-c1', front: 'The module in one sentence?', back: 'LLMs sample plausible next tokens from learned patterns — every capability, cost, limit, and failure mode falls out of that loop.' },
          { id: 'm1-l8-c2', front: 'The four token-denominated things?', back: 'Billing, latency, context/memory, and a family of weird failures (spelling, arithmetic). Think in tokens or be ~30% wrong.' },
          { id: 'm1-l8-c3', front: 'Temperature in one line?', back: 'A distribution reshaper — cold sharpens toward the top token, hot flattens toward variety. A style knob, never a truth knob.' },
          { id: 'm1-l8-c4', front: 'Knowledge vs behavior — where does each live?', back: 'Knowledge: pretraining, injected fresh via context/RAG. Behavior/format/taste: SFT + RLHF, adjusted via prompting or fine-tuning.' },
          { id: 'm1-l8-c5', front: 'The hallucination defense kit (6 layers)?', back: 'Grounding/RAG · abstention permission · tool delegation · structured output validation · evals · human-in-the-loop. Scale to blast radius.' },
          { id: 'm1-l8-c6', front: 'The self-hosting triggers?', back: 'Privacy/data-residency, high steady volume beating per-token pricing, deep customization. No trigger → stay on APIs, mid-tier, thin gateway.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Module complete — what you now have',
      blocks: [
        { type: 'summary', points: [
          'A precise mental model of generation: the loop, sampling, temperature, streaming.',
          'Token fluency: you can estimate costs, budget context, and predict the weird failures.',
          'A hallucination taxonomy plus the standard 6-layer defense kit, scaled by blast radius.',
          'The training pipeline — and the knowledge-vs-behavior rule that saves fine-tuning budgets.',
          'An architecture doctrine: thin gateway, tiered routing, evals, replaceable models.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Rushing past foundations to "the real stuff"', text: 'Module 2 is API mechanics — learnable in a weekend. What separates engineers in interviews is exactly this module: WHY models behave as they do. If any boss question felt shaky, the linked lesson is one click back.' },
          { title: 'Letting flashcards pile up', text: 'Your review deck now spans 8 lessons. The spaced-repetition math only works if you clear due cards — 5 minutes in the Review tab beats an hour of re-reading next month.' },
        ] },
        { type: 'interview', items: [
          { q: 'The Module-1 interview gauntlet — can you answer all six cold?', a: '(1) How does an LLM generate text? (2) What is temperature really? (3) Why do models hallucinate and how do you defend? (4) What does the context window limit, and who manages chat memory? (5) Fine-tuning vs RAG — when? (6) Open vs closed — what triggers self-hosting? If yes: you\'re conversational at the AI-engineer screen level already.' },
          { q: '"What would you build to LEARN the next layer?" (a real interview question)', a: 'Great answer shape: "A small end-to-end product using an LLM API — streaming chat with cost metering and a tiny eval suite — because API mechanics, token economics, and quality measurement are the next skills that compound." Which is, not coincidentally, exactly what Module 2 builds.',
          },
        ] },
        { type: 'usecases', items: [
          { title: 'Where you stand in hiring terms', text: 'Module 1 ≈ the "AI fundamentals" screen at most companies: sampling, tokens, hallucination, fine-tune-vs-RAG, build-vs-buy. You can now pass the conversation that filters out resume-keyword candidates.' },
          { title: 'What unlocks next', text: 'Module 2 turns theory into shipped code: real API calls in JavaScript, streaming UIs, structured output, error handling, cost control — and your first portfolio-grade AI project.' },
        ] },
        { type: 'project', title: 'Teach-back: the ultimate retention test', goal: 'Feynman technique on the whole module — if you can teach it, you own it.', steps: [
          'Write (or record) a 5-minute "Intro to LLMs for developers" using only your own words and analogies.',
          'Must cover: the loop, tokens/window, one failure mode + its defense, and the fine-tune-vs-RAG rule.',
          'Banned words: "magic", "understands", "thinks". Forced words: "sample", "token", "distribution".',
          'Deliver it to a real human (colleague, friend, rubber duck with feelings). Note every question they ask — each one marks a gap.',
          'Patch your gaps by revisiting the relevant lesson, then update your notes in the Notes tab.',
        ], deliverable: 'Your 5-minute explainer (text or recording) + a list of the questions that stumped you.' },
        { type: 'challenge', title: 'Predict the exam', text: 'Write THREE new boss-quiz-quality questions this checkpoint SHOULD have asked but didn\'t — with four options, a correct answer, and an explanation each. Writing good distractors forces deeper understanding than answering ever does.', hints: [
          'Steal the scenario-first format: "A PM asks…", "Your bill shows…", "A user reports…".',
          'The best distractors are true statements that don\'t answer THIS question.',
          'Cross-lesson combos (temperature × hallucination, tokens × cost) make the hardest questions.',
        ] },
        { type: 'reading', links: [
          { label: 'State of AI Report (latest edition)', url: 'https://www.stateof.ai', note: 'Annual industry snapshot — you now have the vocabulary to actually read it.' },
          { label: 'Anthropic: Building effective agents', url: 'https://www.anthropic.com/research/building-effective-agents', note: 'Skim now, master in Module 8 — notice how much Module-1 vocabulary it assumes.' },
        ] },
      ],
    },
  ],
}
