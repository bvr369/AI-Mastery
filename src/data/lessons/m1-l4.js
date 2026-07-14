// Lesson 1.4 — Tokens, Context Windows & Model Limits

export default {
  sections: [
    {
      id: 'think-in-tokens',
      title: 'Learn to think in tokens',
      blocks: [
        { type: 'p', text: "In Lesson 1.2 you met tokens as \"the units models predict\". Now we make it practical, because **tokens are the currency of everything**: what you pay, how fast responses feel, how much the model can remember, and why it sometimes can't spell. If you think in words, your cost estimates, limits, and bugs will all be ~30% wrong." },
        { type: 'list', items: [
          '**Billing** is per token — input and output priced separately (output ~3-5x more).',
          '**Latency** scales with output tokens — each one is a full forward pass.',
          '**Memory** is the [[Context Window]], measured in tokens.',
          "**Weird failures** — miscounting letters in 'strawberry', bad arithmetic on big numbers — trace directly to how text gets chopped into tokens.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: LEGO text', text: "Tokenization is like building words from LEGO. Common words ('the', 'react') are single prefab pieces. Rare words get assembled from smaller bricks ('hallucinate' = hall + ucin + ate). The model never sees letters — only bricks. Ask it to count the r's in strawberry and you're asking someone to count studs on bricks they can't look inside." },
        { type: 'h', text: 'The rules of thumb that matter' },
        { type: 'list', items: [
          '1 token ≈ **4 characters** ≈ ¾ of an English word.',
          'A page of text ≈ 500 tokens. A long chat ≈ thousands. A codebase ≈ hundreds of thousands.',
          'Code, JSON, and non-English text tokenize **worse** (more tokens per character).',
          'Numbers fragment: `4821973` might be `482`+`197`+`3` — one reason LLMs are bad at arithmetic.',
        ] },
      ],
    },
    {
      id: 'try-tokenizer',
      title: 'Try it: the tokenizer under your fingers',
      blocks: [
        { type: 'p', text: 'Type anything — your commit messages, JSON, emoji — and watch how it chops. The presets each demonstrate a failure mode you now understand.' },
        { type: 'demo', id: 'tokenizer' },
      ],
    },
    {
      id: 'context-window',
      title: 'The context window: memory with a hard edge',
      blocks: [
        { type: 'p', text: "A model's [[Context Window]] is the maximum tokens it can consider in one call — prompt AND response combined. It is not RAM that fills gradually; it's a hard cliff. Everything you send must fit; anything you don't send **does not exist** for the model." },
        { type: 'diagram', id: 'context-window', caption: 'The conveyor: when a conversation outgrows the window, the oldest tokens simply stop being sent.' },
        { type: 'p', text: "This explains the classic \"my chatbot forgot the user's name\" bug. The model didn't forget — your code stopped including the early messages when the conversation got long. **Chat memory is your job, not the model's** (you'll own this in Module 2, and build real memory systems in Module 8)." },
        { type: 'callout', variant: 'warn', text: "Big windows (200k-1M tokens) are amazing but not free: you pay for every token **every call**. Sending a 150k-token codebase with each question is technically possible and financially ruinous. The fix — sending only *relevant* chunks — is literally what [[RAG]] is (Module 7)." },
        { type: 'code', lang: 'javascript', filename: 'context-budget.js', code: `// Every serious AI app has a token budget function like this
const approxTokens = (text) => Math.ceil(text.length / 4)

function fitsBudget({ system, history, userMsg, maxOutput = 1000 }, windowSize = 200_000) {
  const used =
    approxTokens(system) +
    history.reduce((sum, m) => sum + approxTokens(m.content), 0) +
    approxTokens(userMsg) +
    maxOutput            // reserve room for the answer!
  return { used, fits: used <= windowSize, pct: ((used / windowSize) * 100).toFixed(1) }
}

// The rookie bug: filling the window with input and leaving
// no room for output -> truncated mid-sentence responses.`, caption: 'Reserve output space in your budget — the #1 truncation bug in production chat apps.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your API bill seems ~4x higher than your "words × price" estimate for a code-generation app. Most likely cause?',
            options: [
              'The provider is overcharging you',
              'Code tokenizes into more tokens per character AND output tokens cost several times input tokens',
              'Your requests are being duplicated',
              'Temperature was set too high',
            ],
            answer: 1,
            explain: 'Two compounding factors: code is token-dense (symbols, camelCase splits), and generated output is billed at a multiple of input. Words-based estimates are systematically low.',
          },
          {
            q: 'A user reports: "After an hour of chatting, the bot forgot my project details from the start." What actually happened?',
            options: [
              'The model\'s memory chip filled up',
              'The conversation exceeded the context window, so early messages were no longer sent',
              'The model chose to prioritize recent messages',
              'A temporary API outage cleared the session',
            ],
            answer: 1,
            explain: 'Models are stateless — they only "know" what arrives in each request. Once history exceeds the window, your app must drop or summarize old turns; whatever is dropped never existed for the model.',
          },
          {
            q: 'Why do LLMs struggle to count the letter "r" in "strawberry"?',
            options: [
              'Letter-counting requires math models can\'t do',
              'The model sees tokens (chunks), not individual letters',
              'The word is too short to tokenize',
              'Training data contained misspellings',
            ],
            answer: 1,
            explain: '"strawberry" arrives as one or two opaque chunks. The model has statistical knowledge ABOUT the word but never sees its letters — like counting studs inside a sealed LEGO piece.',
          },
          {
            q: 'You must fit a system prompt (500 tokens), history (4,000), and user message (300) into an 8,000-token window, and answers can run long. What else must the budget include?',
            options: [
              'Nothing — 4,800 < 8,000, so it fits',
              'Reserved space for the OUTPUT tokens',
              'The model\'s parameter count',
              'Tokens for the model\'s internal reasoning',
            ],
            answer: 1,
            explain: 'The window holds input AND output. Leave no room and generation truncates mid-sentence. Reserve max_tokens worth of space — the classic bug from the code example.',
          },
          {
            q: 'Sending your entire 150k-token codebase with every question "because the window fits it" is bad because…',
            options: [
              'The model refuses large inputs',
              'You pay for all 150k tokens on every single call — relevance selection (RAG) exists exactly for this',
              'Long context is always ignored by models',
              'It violates most providers\' terms of service',
            ],
            answer: 1,
            explain: 'It works and costs a fortune: 150k tokens × every question × price. Retrieving only relevant chunks (RAG, Module 7) delivers similar quality at ~1-5% of the cost.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm1-l4-c1', front: 'Token rules of thumb?', back: '1 token ≈ 4 chars ≈ ¾ English word. A page ≈ 500 tokens. Code/JSON/non-English tokenize worse.' },
          { id: 'm1-l4-c2', front: 'What is the context window?', back: 'Max tokens per call — input AND output combined. A hard cliff: what you don\'t send doesn\'t exist for the model.' },
          { id: 'm1-l4-c3', front: 'Why did the chatbot "forget" early messages?', back: 'Models are stateless. When history outgrows the window, your code stops sending old turns. Memory management is the app\'s job.' },
          { id: 'm1-l4-c4', front: 'Why is "count the r\'s in strawberry" hard for LLMs?', back: 'The model sees token chunks, not letters — it has knowledge about words without seeing inside them.' },
          { id: 'm1-l4-c5', front: 'The #1 truncation bug in chat apps?', back: 'Filling the window with input and reserving no space for output — responses cut off mid-sentence. Always budget max_tokens.' },
          { id: 'm1-l4-c6', front: 'Why not send the whole codebase every call?', back: 'You pay per token per call. Select relevant chunks instead — that selection process is RAG.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Tokens are the currency: billing, latency, and memory are all token-denominated.',
          '1 token ≈ 4 chars; code and numbers tokenize expensively; letters are invisible inside tokens.',
          'The [[Context Window]] is a hard limit on input + output combined — reserve output space.',
          'Models are stateless; "memory" is your application re-sending history, until it can\'t.',
          'Huge windows are a cost trap at scale — relevance selection (RAG) is the sustainable answer.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Estimating costs in words', text: 'Words underestimate tokens by 25-35% for English and far more for code. Multiply by output-token pricing and estimates go 4-5x wrong. Always estimate with a tokenizer, never with word counts.' },
          { title: 'Letting history grow unboundedly', text: 'Naive chat apps append forever, then die at the window edge (or silently degrade). Production pattern: cap history, summarize older turns, or persist facts externally — you\'ll build all three in Module 8.' },
          { title: 'No max_tokens reservation', text: 'Truncated responses that end mid-sentence are almost always a budget bug, not a model bug. Reserve output room in every context calculation.' },
          { title: 'Testing only with short inputs', text: 'Everything works in dev with 3-message chats, then production users paste 80-page documents. Test at the window boundary: right below, right above, and way above.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through how you\'d manage conversation history in a chat application."', a: 'Layers: (1) token-budget function reserving output space, (2) sliding window keeping system prompt + recent N turns, (3) summarization of older turns into a compact preamble, (4) externalized durable facts (user preferences → database, reinjected as context). Mention monitoring: log token usage per request to catch drift.' },
          { q: '"Why are LLMs bad at arithmetic, and what\'s the production fix?"', a: 'Numbers fragment into arbitrary token chunks, and models predict digit-shaped text rather than executing algorithms. Fix: don\'t ask the model to compute — give it a calculator/code tool and let it call it (tool use, Module 8). Interview bonus: same logic applies to dates, IDs, and precise string ops.' },
          { q: '"A 1M-token context window means RAG is dead, right?"', a: 'No — three reasons: (1) cost: you pay per token per call, so shipping a corpus each request is ruinous at scale; (2) latency: prefill on huge inputs is slow; (3) quality: models attend less reliably to the middle of very long contexts ("lost in the middle"). Long windows and retrieval are complements: retrieve less precisely, but still retrieve.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Cursor / Copilot context engines', text: 'Their core secret isn\'t the model — it\'s deciding which files/snippets fit the token budget for each completion. Context selection IS the product.' },
          { title: 'ChatGPT\'s memory feature', text: 'Extracted facts stored outside the window and reinjected — exactly the externalized-memory pattern from this lesson, productized.' },
          { title: 'Claude\'s 200k window for contracts', text: 'Legal teams drop entire contracts in one call — the "one big document, one careful read" case where big windows genuinely beat RAG.' },
          { title: 'Token-based SaaS pricing', text: 'AI products price in "credits" that map to tokens. Understanding token economics is understanding your gross margin.' },
        ] },
        { type: 'project', title: 'Build a context budgeter', goal: 'Write the utility every AI app needs: a token budget calculator with real overflow behavior.', steps: [
          'Create budget.js with approxTokens(text) (chars/4) and the fitsBudget() shape from this lesson.',
          'Add trimHistory(messages, budget): drops oldest non-system messages until the total fits. Return both the trimmed array and what was dropped.',
          'Add a "summarize stub": when messages are dropped, insert one message like `[Summary of N earlier messages: ...]` (fake the summary text for now — Module 2 makes it real with an actual model call).',
          'Test: generate a fake 100-message conversation and watch it trim at an 8k budget. Log used/limit/pct.',
          'Edge cases: single message bigger than the whole budget; empty history; budget smaller than the system prompt.',
        ], deliverable: 'budget.js + a test file demonstrating trimming at the boundary, with the summary stub inserted.' },
        { type: 'challenge', title: 'Token golf', text: 'Take any 200-word paragraph. Rewrite it to preserve ALL meaning in as few tokens as possible (use the tokenizer demo to count). Then reflect: which edits saved the most? This skill — compressing prompts without losing information — directly cuts production costs.', hints: [
          'Cutting filler words helps less than you expect; restructuring sentences helps more.',
          'Lists tokenize leaner than prose. Symbols can replace words.',
          'Real-world versions of this: system prompt compression, few-shot example curation.',
        ] },
        { type: 'reading', links: [
          { label: 'OpenAI Tokenizer playground', url: 'https://platform.openai.com/tokenizer', note: 'Real BPE on your own text — calibrate the approximations from this lesson.' },
          { label: 'What\'s Lost in the Middle (paper summary)', url: 'https://arxiv.org/abs/2307.03172', note: 'Why long-context attention degrades in the middle — skim the figures.' },
          { label: 'Anthropic docs: context windows', url: 'https://docs.anthropic.com/en/docs/build-with-claude/context-windows', note: 'How a real provider documents window mechanics and prompt caching.' },
        ] },
      ],
    },
  ],
}
