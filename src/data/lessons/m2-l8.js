// Lesson 2.8 — Errors, Retries, Rate Limits & Cost Control

export default {
  sections: [
    {
      id: 'production-reality',
      title: 'Welcome to production, where everything fails',
      blocks: [
        { type: 'p', text: "Everything so far assumed the API answers. In production it sometimes doesn't — and how your code behaves in those moments separates a demo from a product. The good news: LLM APIs fail in **exactly four flavors**, each with a known correct response. Learn the table, write one wrapper, sleep at night." },
        { type: 'table', headers: ['Status', 'Meaning', 'Correct response'], rows: [
          ['**400** invalid_request', 'Your payload is wrong (bad model name, malformed messages, context too long)', 'Do NOT retry — fix the code/trim the input. Retrying a 400 is retrying a bug.'],
          ['**401/403** auth', 'Bad or revoked key, wrong permissions', 'Do NOT retry — alert loudly; this is a config/security incident.'],
          ['**429** [[Rate Limit]]', 'Too many requests/tokens per minute for your tier', 'Retry WITH [[Exponential Backoff]] + jitter. Honor the retry-after header when present.'],
          ['**5xx / 529** overloaded', 'Provider-side trouble', 'Same backoff treatment; if sustained, trip a circuit breaker and degrade gracefully.'],
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the busy restaurant', text: "A 429 is the host saying 'give us a few minutes'. The naive client keeps shouting 'TABLE FOR ONE?' every second — and becomes the person security escorts out. Backoff is politely waiting, checking again in 1 minute, then 2, then 4 — with a little randomness so the whole bus of tourists doesn't re-ask in unison (that's the jitter)." },
        { type: 'diagram', id: 'backoff-timeline', caption: 'Hammering re-hits the same rate window. Doubling waits drain it. Ten lines of code apart.' },
      ],
    },
    {
      id: 'sim',
      title: 'Simulate the storm',
      blocks: [
        { type: 'p', text: 'Fire a burst of requests at a rate-limited fake API. Naive mode loses requests; backoff mode lands everything. Toggle and compare the timelines.' },
        { type: 'demo', id: 'backoff-sim' },
      ],
    },
    {
      id: 'write-wrapper',
      title: 'Write the wrapper every AI app needs',
      blocks: [
        { type: 'p', text: "The sandbox's `llm.failRate` injects real 429-style failures. Build the retry wrapper against genuine chaos:" },
        { type: 'playground', id: 'retry-wrapper', title: 'callWithRetry — your production armor', height: 380, code: `// Make the sandbox hostile: 55% of calls throw a 429.
llm.failRate = 0.55

async function callWithRetry(prompt, opts = {}, maxRetries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await llm(prompt, opts)
    } catch (err) {
      const retriable = err.status === 429 || err.status >= 500
      if (!retriable || attempt >= maxRetries) throw err

      const base = 500 * 2 ** attempt              // 0.5s, 1s, 2s, 4s…
      const jitter = Math.random() * 300           // desynchronize clients
      const wait = base + jitter
      console.log(\`  429 → attempt \${attempt + 1}/\${maxRetries}, waiting \${Math.round(wait)}ms\`)
      await sleep(wait)
    }
  }
}

console.log("firing 4 calls through the wrapper…\\n")
for (let i = 1; i <= 4; i++) {
  const answer = await callWithRetry("Say OK briefly", {})
  console.log(i + ":", answer.slice(0, 50))
}
console.log("\\nAll landed despite 55% failure rate. That's the wrapper working.")
llm.failRate = 0`, solution: `llm.failRate = 0.55

// Exercise solution: non-retriable errors + a simple circuit breaker
let consecutiveFailures = 0
const BREAKER_LIMIT = 3
let breakerOpenUntil = 0

async function callWithRetry(prompt, opts = {}, maxRetries = 4) {
  if (Date.now() < breakerOpenUntil)
    throw new Error("circuit OPEN — failing fast, using fallback")

  for (let attempt = 0; ; attempt++) {
    try {
      const out = await llm(prompt, opts)
      consecutiveFailures = 0                       // success heals the breaker
      return out
    } catch (err) {
      if (err.status === 400 || err.status === 401) throw err   // never retry bugs/auth
      if (attempt >= maxRetries) {
        consecutiveFailures++
        if (consecutiveFailures >= BREAKER_LIMIT) {
          breakerOpenUntil = Date.now() + 10_000    // fail fast for 10s
          console.log("  ⚡ circuit breaker OPEN for 10s")
        }
        throw err
      }
      await sleep(500 * 2 ** attempt + Math.random() * 300)
    }
  }
}

for (let i = 1; i <= 4; i++) {
  try {
    console.log(i + ":", (await callWithRetry("Say OK", {})).slice(0, 40))
  } catch (e) {
    console.log(i + ": FELL BACK →", e.message)
  }
}
llm.failRate = 0
// Breakers stop retry storms from amplifying outages —
// when the provider is down, fail fast and serve your fallback.`, caption: '**Exercises:** (1) 400/401 must throw immediately — never retry a bug · (2) add a circuit breaker: after 3 exhausted calls, fail fast for 10s instead of hammering. Solution shows both.' },
        { type: 'h', text: 'Cost control: the other half of production hygiene' },
        { type: 'list', items: [
          '**Meter everything** — you\'ve logged `usage` since Lesson 2.1; now aggregate per user/feature/day. Bills you can\'t attribute are bills you can\'t cut.',
          '**Budget caps in code** — per-user daily token allowances; degrade to smaller models or queue when exceeded. Never let one user (or one bug) own your invoice.',
          '**[[Max Tokens]] discipline** — output caps sized to the task (Lesson 2.1\'s brake).',
          '**Route by difficulty** — Lesson 1.3\'s tiers: cheap model first, escalate on need. Routinely a 5-20x saving.',
          '**Cache aggressively** — identical/similar prompts (FAQ answers!) shouldn\'t re-bill. Providers offer prompt caching for repeated prefixes like system prompts + docs (big discounts; Module 12 goes deep).',
        ] },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Which error must you NEVER retry, and why?',
            options: [
              '429 — the limiter will ban you',
              '400 invalid_request — the payload is wrong; identical retries fail identically while burning budget',
              '529 overloaded — it insults the provider',
              'Timeouts — they self-resolve',
            ],
            answer: 1,
            explain: 'A 400 means YOUR request is malformed — same input, same rejection, forever. Retry storms on 400s are pure waste. Fix the code; retry only transient failures (429/5xx).',
          },
          {
            q: 'What is jitter and why does it matter at scale?',
            options: [
              'Latency variance in responses',
              'Random extra wait added to backoff so many clients/servers don\'t retry in synchronized waves',
              'Token-level output noise',
              'A UI loading animation',
            ],
            answer: 1,
            explain: 'Ten servers backing off identically retry in unison — recreating the spike each round (the "thundering herd"). Randomized waits spread the retry load. One Math.random(), major incident prevention.',
          },
          {
            q: 'The provider has a 20-minute outage. Your retry wrapper alone will…',
            options: [
              'Handle it perfectly',
              'Exhaust retries per request, amplify load, and hang your app — this is what circuit breakers are for: fail fast, serve fallbacks, probe periodically',
              'Automatically switch providers',
              'Queue requests indefinitely for free',
            ],
            answer: 1,
            explain: 'Backoff handles blips; breakers handle outages. After N consecutive exhausted calls, open the circuit: fail instantly, show a graceful degraded experience, retry-probe every so often. Retries + breaker + fallback = the full armor.',
          },
          {
            q: 'One user found an infinite-loop bug in your chat UI and generated 40M tokens overnight. The missing control:',
            options: [
              'Stricter terms of service',
              'Per-user budget caps enforced in code — allowances that degrade or block before the invoice does',
              'A cheaper model',
              'Manual bill review each morning',
            ],
            answer: 1,
            explain: 'Meter per user (you have usage logs!), enforce daily allowances, degrade gracefully at the cap. Provider spend alerts are the backstop, not the mechanism.',
          },
          {
            q: 'Prompt caching gives the biggest wins when…',
            options: [
              'Every request is unique',
              'Requests share a large stable prefix — long system prompt + docs — re-sent with each call (hello, Lesson 2.2 statelessness)',
              'Using maximum temperature',
              'Responses are very short',
            ],
            answer: 1,
            explain: 'Statelessness means re-sending the same system prompt + context every turn. Prompt caching bills that repeated prefix at a fraction after the first call — RAG and long-system-prompt apps save 50-90% on input.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm2-l8-c1', front: 'The 4 error flavors + responses?', back: '400 fix-don\'t-retry · 401/403 alert-don\'t-retry · 429 backoff+jitter (honor retry-after) · 5xx/529 backoff, breaker if sustained.' },
          { id: 'm2-l8-c2', front: 'Exponential backoff + jitter in one line?', back: 'wait = base × 2^attempt + random(). Doubling drains the rate window; randomness prevents synchronized retry herds.' },
          { id: 'm2-l8-c3', front: 'Circuit breaker — what and when?', back: 'After N consecutive exhausted-retry failures, fail FAST for a cooldown (serve fallbacks) instead of hammering a down provider. Heals via periodic probes.' },
          { id: 'm2-l8-c4', front: 'The 5 cost-control levers?', back: 'Meter per user/feature · budget caps in code · max_tokens discipline · difficulty-based routing · prompt caching for stable prefixes.' },
          { id: 'm2-l8-c5', front: 'Why does prompt caching pair with statelessness?', back: 'Lesson 2.2: every turn re-sends the same system prompt/context. Caching bills that repeated prefix at a steep discount after the first send.' },
          { id: 'm2-l8-c6', front: 'Never-retry rule?', back: '400 (your bug) and 401/403 (config/security incident) fail identically on retry — fix or alert, don\'t loop.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Four failure flavors, four scripted responses — encode them ONCE in a wrapper.',
          'Backoff + jitter for transient errors; circuit breaker + fallback for outages.',
          'Never retry 400/401 — bugs and auth incidents don\'t heal with repetition.',
          'Cost is an engineering surface: meter, cap, route, budget outputs, cache prefixes.',
          'This wrapper + your usage logs = the boring infrastructure that lets everything else be exciting.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Retrying everything indiscriminately', text: 'The catch-all retry loop happily retries 400s (waste), 401s (masking a security incident!), and even JSON parse errors. Classify FIRST, retry only what\'s transient. The error table is the spec.' },
          { title: 'Backoff without jitter', text: 'Works in dev (one client), melts in prod (50 workers retrying in sync). If your infra has more than one instance, jitter isn\'t optional — it\'s the difference between recovery and a self-inflicted DDoS.' },
          { title: 'Timeout-free calls', text: 'A hung connection with no timeout = a stuck worker = a queue backing up silently. Every LLM call gets an AbortController timeout (30-60s non-streaming; TTFT-based for streams). No exceptions.' },
          { title: 'Discovering costs from the invoice', text: 'By the time finance forwards the bill, the money is spent. Real-time metering + spend alerts at 50/80/100% of budget + per-user caps turn cost from a monthly surprise into a daily dashboard.' },
        ] },
        { type: 'interview', items: [
          { q: '"Design the resilience layer for an LLM-backed API serving 1M requests/day."', a: 'One gateway module wrapping all provider calls: (1) classify errors — retry 429/5xx with expo backoff + full jitter, honor retry-after; never retry 4xx client errors, (2) AbortController timeouts per call, (3) circuit breaker per provider with fallback (cached response / smaller model / graceful message), (4) bulkheads: per-feature concurrency limits so one feature\'s storm can\'t starve others, (5) observability: retry rates, breaker state, p95 latency, token spend as first-class metrics with alerts. Bonus: mention multi-provider failover behind the same gateway (Lesson 1.7\'s thin-gateway payoff).' },
          { q: '"Your AI feature\'s costs doubled month-over-month. Walk me through the investigation."', a: 'Usage logs make it a query, not a mystery: segment by feature → user → prompt version → model. Usual suspects in order: (1) a prompt/context change inflating input tokens (check avg input per call), (2) traffic mix shift toward expensive endpoints, (3) retry storms double-billing (check retry rate), (4) a power user or abuse (check top-10 users), (5) history growth in chat features (Lesson 2.2 quadratic effect). Then the fixes map 1:1: trim context, route tiers, fix retry classification, cap users, window the history.' },
          { q: '"Rate limits: how do you stay under them proactively rather than reactively?"', a: 'Client-side throttling matched to your tier: a token-bucket or queue that shapes outbound traffic below the provider ceiling, so 429s become rare instead of routine. Plus: request coalescing for duplicate prompts, priority queues (interactive traffic preempts batch), and burst smoothing for cron-triggered work. Reactive backoff stays as the safety net, not the strategy.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Every AI SDK\'s internals', text: 'The official Anthropic/OpenAI SDKs ship exactly today\'s wrapper — expo backoff, jitter, retry-after handling. Now you know what those defaults are doing (and when to tune them).' },
          { title: 'ChatGPT\'s degraded modes', text: '"We\'re experiencing high demand" banners + queueing = circuit breakers and load shedding as UX. Failure design, user-visible.' },
          { title: 'Batch processing pipelines', text: 'Overnight embedding/classification jobs live and die by throttling + backoff — a weekend job that retries wrong becomes a Monday incident.' },
          { title: 'AI cost dashboards', text: 'The per-feature token metering you started in 2.1 is literally a product category now (Helicone, Langfuse et al.) — you\'ve been building it by hand.' },
        ] },
        { type: 'project', title: 'The resilient gateway module', goal: 'Consolidate Module 2 so far into the one file every future project will import: llm-gateway.js.', steps: [
          'Create llmGateway(messages, opts) wrapping your real API call from 2.1: error classification per the table, expo backoff + jitter (max 4), AbortController timeout, and retry-after honoring.',
          'Add the circuit breaker (3 exhausted calls → 15s open → half-open probe).',
          'Meter everything: append {ts, model, inTokens, outTokens, cost, latency, retries, outcome} to usage.jsonl per call.',
          'Add budget guard: read today\'s spend from the log; past a configurable cap, throw BudgetExceeded (test it with a low cap).',
          'Prove it: a test script that runs 20 calls while you toggle wifi off/on mid-run — the log should show retries, breaker trips, and zero unhandled crashes.',
        ], deliverable: 'llm-gateway.js + usage.jsonl from the chaos test + a one-paragraph postmortem of what the wifi toggle did.' },
        { type: 'challenge', title: 'The load-shedding decision', text: 'Extend the gateway with priority classes: interactive (user waiting) vs batch (background). When the breaker is half-open or budget is >80%, batch requests queue while interactive ones proceed. Write 5 sentences on why shedding BATCH first is (usually) right — and one scenario where it\'s wrong.', hints: [
          'Users forgive a delayed digest email; they don\'t forgive a frozen chat box.',
          'Counter-scenario hint: what if the "batch" job is a compliance deadline?',
          'This priority-classes idea is exactly how real gateways (and Module 12\'s queues) think.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic docs: rate limits & errors', url: 'https://docs.anthropic.com/en/api/rate-limits', note: 'Tiers, headers, and the official retry guidance.' },
          { label: 'AWS Architecture Blog: Exponential Backoff and Jitter', url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/', note: 'THE classic analysis — full jitter wins; the charts make it obvious.' },
          { label: 'Anthropic docs: prompt caching', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching', note: 'The cost lever most teams discover six months too late.' },
        ] },
      ],
    },
  ],
}
