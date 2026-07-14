// Lesson 2.1 — Your First LLM API Call

export default {
  sections: [
    {
      id: 'the-call',
      title: "It's just fetch()",
      blocks: [
        { type: 'p', text: "Module 1 built the mental model; now you write the code. Here's the demystifying truth: **an LLM API call is a POST request with JSON** — the same fetch() you've written a hundred times. No SDKs required (they're conveniences, not necessities), no ML math, no GPUs. Auth header, model name, messages, done." },
        { type: 'diagram', id: 'request-anatomy', caption: 'Every field, annotated. The usage block in the response is your bill — treat it as first-class data.' },
        { type: 'h', text: 'The five fields that matter' },
        { type: 'list', items: [
          '**`x-api-key`** — your secret. Lives in environment variables on a SERVER. Never in browser code, never in git. (Lesson 2.9 wires this properly.)',
          '**`model`** — which brain (Lesson 1.3 tiers). Config, not hardcode.',
          '**`max_tokens`** — output budget. Required by Anthropic\'s API — a deliberate cost brake.',
          '**`messages`** — the conversation array. THE core concept; all of Lesson 2.2.',
          '**`usage`** (response) — actual tokens consumed. Log it on every call from day one; future-you doing cost analysis will be grateful.',
        ] },
        { type: 'callout', variant: 'info', text: "Two dialects rule the ecosystem (Lesson 1.3): **Anthropic Messages** and **OpenAI Chat Completions**. They differ in field names (`max_tokens` placement, `system` handling, response shape) but not in concepts. Learn one deeply, read the other fluently — this course uses Anthropic's shape as home base." },
      ],
    },
    {
      id: 'build-it',
      title: 'Write the call yourself',
      blocks: [
        { type: 'p', text: "This playground has a **simulated Anthropic API** wired into fetch() — same URL, same headers, same response shape as production, zero keys needed. The code below is *real production code*; only the server behind it is fake. Run it, then do the exercises." },
        { type: 'playground', id: 'first-call', title: 'Your first API call', height: 340, code: `// A REAL Anthropic API call (the sandbox mocks the server, not the code)
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": "sk-ant-DEMO",            // env var in real life!
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [
      { role: "user", content: "Explain what an API key is, in one sentence." }
    ],
  }),
})

const data = await response.json()

console.log("Answer:", data.content[0].text)
console.log("Tokens used:", data.usage)`, solution: `const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": "sk-ant-DEMO",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: 300,
    temperature: 0.2,                       // exercise 2
    messages: [
      { role: "user", content: "Write a haiku about JavaScript" }  // exercise 1
    ],
  }),
})

const data = await response.json()
console.log("Answer:", data.content[0].text)

// exercise 3: cost math from usage
const { input_tokens, output_tokens } = data.usage
const cost = (input_tokens * 3 + output_tokens * 15) / 1_000_000
console.log(\`Tokens: \${input_tokens} in / \${output_tokens} out\`)
console.log(\`Cost: $\${cost.toFixed(6)} (at $3/M in, $15/M out)\`)`, caption: '**Exercises:** (1) change the prompt to ask for a haiku · (2) add `temperature: 0.2` to the body · (3) compute the call\'s cost from `usage` at $3/M input + $15/M output. Stuck? The Solution button has all three.' },
        { type: 'callout', variant: 'tip', text: "Notice what you did NOT need: an SDK. `npm install @anthropic-ai/sdk` gives you types, retries, and streaming helpers — genuinely useful — but it's sugar over this exact request. Engineers who know the wire format debug SDK weirdness in minutes; engineers who only know the SDK are stuck when it misbehaves." },
      ],
    },
    {
      id: 'response-shape',
      title: 'Reading the response like a pro',
      blocks: [
        { type: 'code', lang: 'json', filename: 'response.json', code: `{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "An API key is a secret token that identifies..." }
  ],
  "model": "claude-sonnet-5",
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 18, "output_tokens": 24 }
}`, caption: 'The three fields your code touches constantly: content[0].text, stop_reason, usage.' },
        { type: 'list', items: [
          '**`content` is an array** — because responses can mix blocks (text, tool calls in Module 8). Today: `content[0].text`.',
          '**`stop_reason`** tells you WHY generation ended: `"end_turn"` = natural finish; `"max_tokens"` = **truncated!** — check this or ship half-sentences to users.',
          '**`usage`** = the invoice. `input_tokens` covers everything you sent; `output_tokens` what it generated.',
        ] },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your response ends mid-sentence. Which field diagnoses it, and what does it say?',
            options: [
              'content[0].type — it says "partial"',
              'stop_reason — it says "max_tokens"',
              'usage.output_tokens — it\'s negative',
              'model — it shows the wrong tier',
            ],
            answer: 1,
            explain: '`stop_reason: "max_tokens"` = the output budget ran out mid-generation. Fix: raise max_tokens or design shorter outputs. Checking stop_reason is production hygiene.',
          },
          {
            q: 'Why must the API key live on a server, never in React code?',
            options: [
              'Browsers block the header',
              'Anything shipped to a browser is readable by every visitor — DevTools → your key → their token bill, yours to pay',
              'React strips unknown headers',
              'Keys only work from allowlisted IPs',
            ],
            answer: 1,
            explain: 'Client bundles are public. A leaked key gets scraped and abused within hours. The pattern: browser → your server (key in env) → provider. Lesson 2.9 builds it.',
          },
          {
            q: 'What does `max_tokens` control?',
            options: [
              'Total conversation length',
              'The input size limit',
              'The maximum OUTPUT the model may generate this call',
              'The context window size',
            ],
            answer: 2,
            explain: 'Output budget only. Input is limited by the context window; max_tokens caps generation — your cost and latency brake.',
          },
          {
            q: 'Why is `content` an array instead of a plain string?',
            options: [
              'Legacy design debt',
              'Responses can contain multiple typed blocks — text now; tool-use calls and more later',
              'It enables pagination',
              'Arrays compress better',
            ],
            answer: 1,
            explain: 'Forward-compatible design: a response can mix `text` blocks with `tool_use` blocks (Module 8). Your Module-8 agent code will iterate this array; today it\'s content[0].text.',
          },
          {
            q: 'The senior habit this lesson insisted on from day one:',
            options: [
              'Always use the official SDK',
              'Log `usage` from every response — token metering is cost observability',
              'Set temperature explicitly on every call',
              'Prefer GET over POST',
            ],
            answer: 1,
            explain: 'Every response tells you exactly what it cost. Logging usage per call/feature/user is how teams answer "why is the AI bill $40k?" in minutes instead of days.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm2-l1-c1', front: 'The 5 essential request pieces?', back: 'Auth header (x-api-key, server-side env), model, max_tokens (output budget), messages array, content-type JSON. It\'s just a POST.' },
          { id: 'm2-l1-c2', front: 'stop_reason: "max_tokens" means?', back: 'Output was TRUNCATED — the budget ran out mid-generation. Always check stop_reason before trusting a response.' },
          { id: 'm2-l1-c3', front: 'Why is content an array?', back: 'Responses hold typed blocks — text today, tool_use calls in agent work. Forward-compatible by design.' },
          { id: 'm2-l1-c4', front: 'Where does the API key live?', back: 'Server-side environment variables only. Browser bundles are public; leaked keys are scraped and abused within hours.' },
          { id: 'm2-l1-c5', front: 'What should you log from every call?', back: 'usage (input_tokens/output_tokens) — per-call cost data. Token metering from day one is how you keep AI bills explainable.' },
          { id: 'm2-l1-c6', front: 'SDK vs raw fetch?', back: 'SDKs add types/retries/streaming sugar over the same HTTP call. Learn the wire format first — it\'s what you debug against.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'An LLM call = POST + JSON: auth header, model, max_tokens, messages.',
          'Read responses like a pro: content[0].text, **check stop_reason**, log usage.',
          'Keys live in server env vars — browsers are public by definition.',
          'SDKs are sugar over this wire format; know the format, use the sugar.',
          'Two dialects (Anthropic/OpenAI) cover the industry — concepts transfer 1:1.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Shipping the key to the browser', text: 'The most expensive beginner mistake in AI. "It\'s just a demo" — demos get deployed, keys get scraped by bots watching public bundles and repos. Server-side env vars, always, from the first line of code.' },
          { title: 'Ignoring stop_reason', text: 'Truncated JSON that breaks parsing, answers ending in "and the most important thing is" — both ship to production constantly because nobody checked stop_reason. One if-statement prevents the whole class.' },
          { title: 'Setting max_tokens astronomically "to be safe"', text: 'max_tokens caps your worst-case cost and latency per call. 4000 tokens of budget for a yes/no classification means one prompt-injection or model tangent can bill you 4000 tokens. Budget to the task.' },
          { title: 'Treating errors as afterthoughts', text: '429s, 529s, and timeouts WILL happen at scale (Lesson 2.8 is entirely about this). Structure code with error handling from day one — retrofitting it into 30 call sites is misery.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through what happens when your app calls an LLM API."', a: 'HTTPS POST to the provider: auth header from server env, JSON body with model + messages + max_tokens. Provider tokenizes input, runs the generation loop (Module 1!), returns JSON: content blocks, stop_reason, usage. My code checks stop_reason, extracts text, logs usage for cost tracking. Mentioning the tokenize→loop→usage flow shows you understand the machine, not just the HTTP.' },
          { q: '"How do you keep API keys secure in a web app?"', a: 'Keys never reach the client: browser calls MY backend, backend holds keys in env vars (or a secrets manager), makes the provider call, streams results back. Plus: separate keys per environment, rotation policy, spend alerts, and never in git (env files ignored, secrets scanning on).' },
          { q: '"What would you log per LLM call in production?"', a: 'Request: timestamp, user/feature id, model, prompt version. Response: usage tokens, stop_reason, latency (and TTFT if streaming), error codes. Derived: cost per call. This enables the three questions that always come: why is the bill X, why was this answer bad, and did the new prompt regress quality/cost.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Feature prototyping', text: 'The 20-line call you just wrote IS how features get validated at startups — an afternoon from idea to working AI summarizer.' },
          { title: 'Internal automation', text: 'Slack digest bots, ticket auto-tagging, PR description generators — thousands of internal tools are exactly this lesson\'s code plus a cron job.' },
          { title: 'Cost dashboards', text: 'The usage logs you start collecting today become the Grafana dashboard finance asks for at scale.' },
          { title: 'No-SDK environments', text: 'Cloudflare Workers, edge functions, exotic runtimes — knowing the raw wire format means you can call models from anywhere fetch() exists.' },
        ] },
        { type: 'project', title: 'CLI ask — your first real AI tool', goal: 'Ship a command-line tool that answers questions: `node ask.js "why is the sky blue"`. Your first end-to-end AI program on YOUR machine.', steps: [
          'Get a real API key (Anthropic console has free evaluation credits; any provider works — adjust the dialect).',
          'Create ask.js: read the question from process.argv, build the fetch call from this lesson, print the answer.',
          'Store the key in an environment variable (ANTHROPIC_API_KEY) — process.env, never hardcoded. Add .env to .gitignore if you use one.',
          'Print the usage line after each answer: tokens in/out + computed cost.',
          'Harden it: handle non-200 responses (print status + error body), check stop_reason, add a --max flag for max_tokens.',
        ], deliverable: 'ask.js in a git repo with a README showing example runs (key NOT in the repo — that\'s part of the grade).' },
        { type: 'challenge', title: 'Dialect translation', text: 'Rewrite this lesson\'s call for the OpenAI Chat Completions dialect (endpoint, auth header style, body shape, and response path to the text all differ). Then write 3 bullet points on what changed. You\'ll be bilingual in the two formats that run the industry.', hints: [
          'OpenAI: POST /v1/chat/completions, Authorization: Bearer key, messages include system role inline, response at choices[0].message.content.',
          'The sandbox\'s mock fetch also supports api.openai.com — test it right in the playground above.',
          'Notice what DIDN\'T change: messages array, per-token usage, POST+JSON. Concepts > syntax.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic API — Messages reference', url: 'https://docs.anthropic.com/en/api/messages', note: 'The official shape of everything you just wrote. Bookmark it.' },
          { label: 'OpenAI Chat Completions reference', url: 'https://platform.openai.com/docs/api-reference/chat', note: 'The other dialect — skim for the diff, not the details.' },
          { label: 'Anthropic quickstart', url: 'https://docs.anthropic.com/en/docs/get-started', note: 'Follow this to get your real key for the mini project.' },
        ] },
      ],
    },
  ],
}
