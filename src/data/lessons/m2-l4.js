// Lesson 2.4 — Streaming Responses & Chat UX

export default {
  sections: [
    {
      id: 'why-stream',
      title: 'The 6-second answer that feels instant',
      blocks: [
        { type: 'p', text: "A good answer takes the model ~6 seconds to generate. Show a spinner for 6 seconds and your product feels broken — users start doubting at 2. Stream the tokens as they're born and the same 6 seconds feels *fast*, because reading starts at ~0.3s. **Total latency is physics; perceived latency is engineering.**" },
        { type: 'diagram', id: 'streaming-timeline', caption: 'Identical generation time. The streamed version had the user reading 15x sooner.' },
        { type: 'p', text: "The transport is [[SSE]] — Server-Sent Events: one long-lived HTTP response that delivers `data:` chunks as they're ready. Not WebSockets (you don't need bidirectional), not polling (wasteful) — just a response your code reads incrementally. The key metric it optimizes: [[TTFT]], time-to-first-token, the number users actually feel." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the waiter who brings dishes as they cook', text: "Non-streaming is a waiter who holds your entire five-course meal in the kitchen until the dessert is plated, then delivers everything at once, cold. Streaming brings each dish as it's ready. Same kitchen speed — completely different dinner." },
      ],
    },
    {
      id: 'feel-it',
      title: 'Feel the difference',
      blocks: [
        { type: 'p', text: 'Run the same request both ways. Watch the TTFT counter — that gap is your entire UX budget.' },
        { type: 'demo', id: 'streaming-race' },
      ],
    },
    {
      id: 'code-it',
      title: 'Code: consuming a stream',
      blocks: [
        { type: 'p', text: "The sandbox `llm.stream()` delivers tokens to a callback — the same mental model as reading a real SSE stream. The `write()` helper prints without newlines so you can watch text grow:" },
        { type: 'playground', id: 'stream-basics', title: 'Streaming, hands on', height: 300, code: `// llm.stream(prompt, options, onToken) — the callback fires per token
console.log("--- streaming ---")

const t0 = Date.now()
let firstToken = null

const full = await llm.stream(
  "Explain why streaming improves chat UX",
  { system: "Be concise." },
  (token) => {
    if (!firstToken) firstToken = Date.now() - t0   // <- TTFT!
    write(token)                                     // print without newline
  }
)

console.log("")   // newline after the streamed text
console.log("TTFT:", firstToken + "ms | total:", (Date.now() - t0) + "ms")
console.log("full text length:", full.length, "chars")`, solution: `// Exercise solution: word counter + a stop condition
console.log("--- streaming with live stats & early stop ---")

const t0 = Date.now()
let firstToken = null
let words = 0
const MAX_WORDS = 30            // pretend the user hit "stop" here

try {
  await llm.stream("Explain streaming UX in detail", {}, (token) => {
    if (!firstToken) firstToken = Date.now() - t0
    words += (token.match(/\\S+/g) || []).length
    write(token)
    if (words >= MAX_WORDS) throw new Error("USER_STOPPED")
  })
} catch (e) {
  if (e.message !== "USER_STOPPED") throw e
  console.log("\\n[stopped by user after " + words + " words]")
}
console.log("TTFT:", firstToken + "ms")
// Real APIs: you abort the fetch (AbortController) — the provider
// stops generating and stops BILLING. Cancellation = cost feature!`, caption: '**Exercises:** (1) count words as they stream and log a live count · (2) stop the stream after 30 words — simulating a user\'s Stop button. Solution shows both + why cancellation saves money.' },
        { type: 'h', text: 'What the real wire looks like' },
        { type: 'code', lang: 'javascript', filename: 'real-sse-client.js', code: `// Reading a REAL Anthropic SSE stream with fetch (no SDK)
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { /* auth headers from 2.1 */ },
  body: JSON.stringify({ model, max_tokens: 500, messages, stream: true }),
})

const reader = res.body.getReader()
const decoder = new TextDecoder()

let buffer = ""
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })

  // SSE frames are separated by double newlines
  const frames = buffer.split("\\n\\n")
  buffer = frames.pop()                    // keep the incomplete tail

  for (const frame of frames) {
    const data = frame.split("\\n").find(l => l.startsWith("data:"))?.slice(5)
    if (!data) continue
    const event = JSON.parse(data)
    if (event.type === "content_block_delta") {
      renderToken(event.delta.text)        // <- your UI update
    }
  }
}`, caption: 'The buffer-split-keep-tail dance is THE classic SSE parsing pattern — chunks don\'t align with frames.' },
        { type: 'callout', variant: 'tip', text: "React side: append tokens to one state string and render it — but **batch updates**. Setting state 400 times for 400 tokens re-renders 400 times; buffer tokens and flush every ~50ms for smooth text at 1/10th the renders. And always render a blinking cursor while streaming — users read it as 'alive'." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Streaming improves which latency metric, and why does that matter most?',
            options: [
              'Total generation time — answers finish faster',
              'TTFT (time to first token) — users start reading almost immediately, which is the latency they actually perceive',
              'Server CPU time — cheaper compute',
              'Token count — fewer tokens billed',
            ],
            answer: 1,
            explain: 'Generation takes what it takes; streaming just stops hiding it. Reading starts at TTFT (~300ms) instead of at total time (~6s) — perceived speed transforms while physics stays constant.',
          },
          {
            q: 'Why SSE rather than WebSockets for LLM responses?',
            options: [
              'WebSockets can\'t carry text',
              'The flow is one-directional server→client per request — a streamed HTTP response fits exactly, with less infrastructure ceremony',
              'SSE is encrypted, WebSockets aren\'t',
              'Browsers no longer support WebSockets',
            ],
            answer: 1,
            explain: 'You send one request and receive a stream back — no bidirectional channel needed. SSE rides plain HTTP: simpler proxies, simpler auth, simpler everything. WebSockets earn their complexity only for truly two-way flows.',
          },
          {
            q: 'In the SSE parsing code, why keep `frames.pop()` as a buffer tail?',
            options: [
              'To discard corrupt frames',
              'Network chunks don\'t align with SSE frame boundaries — the last piece may be half a frame, completed by the next chunk',
              'To limit memory usage',
              'SSE requires acknowledging frames',
            ],
            answer: 1,
            explain: 'TCP delivers arbitrary chunk boundaries. "data: {"type":"content_bl" can end a chunk mid-frame. Keep the incomplete tail, prepend the next chunk, split again — the classic pattern.',
          },
          {
            q: 'A user hits Stop mid-generation. Properly implemented (AbortController → provider), what happens to cost?',
            options: [
              'Full response is billed regardless',
              'Generation stops server-side and you stop paying for new output tokens — cancellation is a cost feature',
              'The request is refunded entirely',
              'Cost doubles due to the abort',
            ],
            answer: 1,
            explain: 'Providers stop generating when the connection aborts — output tokens stop accruing. In products with long generations, a working Stop button measurably cuts the bill.',
          },
          {
            q: 'Your streamed React chat stutters and lags on long answers. First suspect?',
            options: [
              'The model is slow',
              'Setting state per-token → hundreds of re-renders; batch tokens and flush on an interval',
              'SSE overhead',
              'Too many users online',
            ],
            answer: 1,
            explain: '400 tokens = 400 setState calls = 400 renders of a growing text block. Buffer and flush every ~50ms: same visual smoothness, ~1/10 the renders. A classic React-meets-AI performance bug.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm2-l4-c1', front: 'What is TTFT and why is it THE chat metric?', back: 'Time To First Token — when the user starts reading. Streaming optimizes it from seconds to ~300ms; total time is physics, TTFT is engineering.' },
          { id: 'm2-l4-c2', front: 'Why SSE over WebSockets for LLM streaming?', back: 'One-directional server→client per request — a long-lived HTTP response fits exactly. Less infra ceremony; WebSockets are for genuinely bidirectional flows.' },
          { id: 'm2-l4-c3', front: 'The SSE parsing pattern?', back: 'Accumulate chunks in a buffer, split on double-newline, process complete frames, KEEP the incomplete tail for the next chunk. Chunks ≠ frames.' },
          { id: 'm2-l4-c4', front: 'Why is a Stop button a cost feature?', back: 'Aborting the connection stops server-side generation — output tokens stop billing. Long-generation products save real money.' },
          { id: 'm2-l4-c5', front: 'The React streaming performance rule?', back: 'Never setState per token. Buffer tokens, flush every ~50ms — same smoothness, a tenth of the renders.' },
          { id: 'm2-l4-c6', front: 'The waiter analogy?', back: 'Non-streaming holds all five dishes until dessert is done. Streaming serves each as it\'s ready. Same kitchen speed, different dinner.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Streaming turns 6 perceived seconds into 0.3 — TTFT is the metric users feel.',
          'Transport is SSE: one HTTP response, `data:` frames, buffer-split-keep-tail parsing.',
          'Cancellation (AbortController) stops billing — Stop buttons save money.',
          'React: batch token flushes (~50ms); render a cursor; never setState per token.',
          'The demo, the playground, and the wire code are the same pattern at three zoom levels.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Shipping the spinner version "for now"', text: '"We\'ll add streaming later" — later never comes, users churn at second 3. Streaming is not polish; for chat-shaped features it\'s table stakes. Build it first, not eventually.' },
          { title: 'Parsing SSE with naive line splits', text: 'Works in dev (small fast chunks), corrupts JSON in production (chunks split mid-frame). If you\'ve ever seen a streamed answer glitch half a word of JSON, you\'ve seen this bug. Buffer + tail, always.' },
          { title: 'No abort handling', text: 'User navigates away, generation keeps running, tokens keep billing, server keeps piping to nobody. Wire AbortController into unmount/route-change from day one.' },
          { title: 'Streaming into markdown renderers naively', text: 'Re-parsing the full markdown 20x/second melts CPUs, and half-finished code fences flash as broken formatting. Throttle renders and style incomplete fences gracefully — or render plain text until the block closes.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through implementing streaming chat end-to-end."', a: 'Client sends messages to MY server (keys live there, Lesson 2.1). Server calls the provider with stream:true, pipes SSE frames back (or re-emits its own). Client reads via fetch reader, buffer-splits frames, batches token flushes into React state (~50ms), renders with a cursor. AbortController wired to Stop/unmount, propagated server→provider to halt billing. Metrics: TTFT, total time, cancel rate.' },
          { q: '"When would you NOT stream?"', a: 'When output isn\'t consumed as prose in real time: structured JSON parsed on completion (partial JSON is useless — though you can stream-parse with effort), background jobs, very short outputs (classification labels arrive in one chunk anyway), and pipelines where the next step needs the full text. Rule: stream for humans reading; complete for machines parsing.' },
          { q: '"How do you test streaming code?"', a: 'Unit: feed the parser synthetic chunks with adversarial boundaries — frames split mid-JSON, multiple frames per chunk, unicode split across chunks. Integration: mock SSE server with configurable delays. E2E: throttled network profiles; assert TTFT budgets and clean abort behavior. The parser tests matter most — that\'s where the bugs live.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Every serious chat product', text: 'ChatGPT, Claude.ai, Copilot Chat — all SSE with batched rendering. The pattern you just coded is industry-universal.' },
          { title: 'AI code editors', text: 'Cursor streams diffs and completions token-by-token into the buffer — same parsing, different renderer.' },
          { title: 'Voice assistants', text: 'Streamed text feeds text-to-speech sentence-by-sentence — TTFT becomes time-to-first-SOUND. The metric generalizes.' },
          { title: 'Long-document generation', text: 'Report writers stream section headers first so users see structure in seconds while bodies fill in — streaming as progressive disclosure.' },
        ] },
        { type: 'project', title: 'Streaming terminal chat', goal: 'Upgrade your Lesson 2.2 terminal chatbot to stream — the last piece before the React checkpoint.', steps: [
          'Add stream:true to your API call and switch to reading res.body with the reader pattern from this lesson.',
          'Implement the buffer-split-keep-tail parser; write tokens with process.stdout.write (no newlines).',
          'Measure and print TTFT + total time after each answer.',
          'Wire Ctrl+C during generation to abort the request cleanly (AbortController) and print "[stopped]" — verify the process survives for the next question.',
          'Stress test: ask for a 500-word essay; confirm smooth streaming and a clean abort mid-essay.',
        ], deliverable: 'chat.js v2 — streaming, TTFT metrics, and clean cancellation.' },
        { type: 'challenge', title: 'The adversarial parser test', text: 'Write a test that feeds your SSE parser ONE real captured stream sliced into chunks at every possible boundary position (chunk sizes 1, 7, 13 bytes…). Your parser passes if the reassembled text is identical every time. This single test catches the bug class that plagues production streaming code.', hints: [
          'Capture a real frame sequence once, then const chunks = sliceEvery(raw, n) for various n.',
          'Unicode bonus: include an emoji — byte boundaries can split multi-byte characters; TextDecoder with stream:true handles it, naive decoding corrupts.',
          'If sizes 1 and 7 both pass, you\'re probably correct; if only 1024 passes, you\'ve been testing the happy path.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic docs: streaming', url: 'https://docs.anthropic.com/en/api/messages-streaming', note: 'The exact event types (content_block_delta etc.) your parser will meet.' },
          { label: 'MDN: Server-Sent Events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events', note: 'The transport itself — short and definitive.' },
          { label: 'MDN: ReadableStream', url: 'https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream', note: 'The reader API powering your parsing loop.' },
        ] },
      ],
    },
  ],
}
