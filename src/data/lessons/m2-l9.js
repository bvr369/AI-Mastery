// Lesson 2.9 — Checkpoint Project: Build a React Chatbot

export default {
  sections: [
    {
      id: 'the-build',
      title: 'Ship your first real AI product',
      blocks: [
        { type: 'p', text: "Eight lessons of Module 2 were rehearsal. This is the performance: a **streaming React chatbot** with a secret-safe backend, a configurable system prompt, conversation state, error handling, and cost metering. Every piece is something you already built in a playground or project — now they assemble into a portfolio-grade app you can demo in an interview and honestly say *\"I built this and I understand every layer.\"*" },
        { type: 'diagram', id: 'chat-architecture', caption: 'The three-tier architecture. The middle tier is why your API key survives contact with real users.' },
        { type: 'callout', variant: 'info', text: "This is a **guided build**, not copy-paste. The code below is real and complete enough to run, but the learning is in wiring it together yourself with your Lesson 2.1 API key. Budget 60-90 minutes. When it streams its first token, you've crossed from 'learning AI' to 'building AI'." },
      ],
    },
    {
      id: 'architecture',
      title: 'Step 1 — The architecture decision',
      blocks: [
        { type: 'p', text: "Why not call the provider straight from React? Because **the browser is public** (Lesson 2.1). Ship your key to the client and it's in every visitor's DevTools within minutes. So the shape is non-negotiable: **browser → your server → provider**. The server holds the key, owns the system prompt, and is the single place for auth, rate limits, logging, and model swaps." },
        { type: 'list', items: [
          '**Frontend (React):** messages state, streaming renderer, input box, Stop button. Zero secrets.',
          '**Backend (Node/Express or a Next.js route):** holds the key in env, builds the request, proxies the SSE stream, logs usage.',
          '**Provider:** does the actual generation.',
        ] },
        { type: 'callout', variant: 'tip', text: "Simplest real setup for this project: a tiny Express server (or one Next.js API route) exposing `POST /api/chat` that streams. If you're a Vite-only dev, add a minimal Express backend — the 30 lines below are the whole thing." },
      ],
    },
    {
      id: 'backend',
      title: 'Step 2 — The backend proxy',
      blocks: [
        { type: 'code', lang: 'javascript', filename: 'server.js', code: `import express from "express"
const app = express()
app.use(express.json())

const SYSTEM = \`You are a helpful assistant embedded in a demo chat app
built by a developer learning AI engineering. Be concise, friendly,
and practical. Use markdown for code. If unsure, say so.\`

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body

  // basic guardrails BEFORE spending tokens
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: "messages required" })

  // set up SSE back to the browser
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,   // <- key lives HERE, server-side
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: SYSTEM,
        messages,          // the array your React app maintains (Lesson 2.2)
        stream: true,      // SSE (Lesson 2.4)
      }),
    })

    // pipe the provider's stream straight through to the browser
    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let usage = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split("\\n")) {
        if (!line.startsWith("data:")) continue
        const event = JSON.parse(line.slice(5))
        if (event.type === "content_block_delta")
          res.write(\`data: \${JSON.stringify({ text: event.delta.text })}\\n\\n\`)
        if (event.type === "message_delta" && event.usage) usage = event.usage
      }
    }
    console.log("usage:", usage)     // your cost log (Lesson 2.1 & 2.8)
    res.write("data: [DONE]\\n\\n")
    res.end()
  } catch (err) {
    console.error(err)
    res.write(\`data: \${JSON.stringify({ error: "generation failed" })}\\n\\n\`)
    res.end()
  }
})

app.listen(3001, () => console.log("chat backend on :3001"))`, caption: 'The whole backend. Key stays server-side, system prompt lives here, stream pipes through, usage logs. Every concept from Module 2.' },
      ],
    },
    {
      id: 'frontend',
      title: 'Step 3 — The React frontend',
      blocks: [
        { type: 'code', lang: 'jsx', filename: 'Chat.jsx', code: `import { useState, useRef } from "react"

export default function Chat() {
  const [messages, setMessages] = useState([])   // the state that IS the conversation
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)

  async function send() {
    if (!input.trim() || streaming) return
    const userMsg = { role: "user", content: input }
    const history = [...messages, userMsg]
    setMessages([...history, { role: "assistant", content: "" }])  // optimistic empty reply
    setInput("")
    setStreaming(true)

    abortRef.current = new AbortController()
    let buffer = ""   // batch tokens (Lesson 2.4 perf note)
    let flushTimer = null

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let sseTail = ""

      const flush = () => setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { role: "assistant", content: buffer }
        return copy
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        sseTail += decoder.decode(value, { stream: true })
        const frames = sseTail.split("\\n\\n"); sseTail = frames.pop()
        for (const frame of frames) {
          const data = frame.replace(/^data:\\s*/, "")
          if (data === "[DONE]") continue
          const evt = JSON.parse(data)
          if (evt.text) {
            buffer += evt.text
            if (!flushTimer) flushTimer = setTimeout(() => { flush(); flushTimer = null }, 50)
          }
        }
      }
      flush()
    } catch (e) {
      if (e.name !== "AbortError") console.error(e)
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>{m.content}{streaming && i === messages.length - 1 && <span className="cursor" />}</div>
        ))}
      </div>
      <div className="composer">
        <input value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask anything…" />
        {streaming
          ? <button onClick={() => abortRef.current?.abort()}>Stop</button>
          : <button onClick={send}>Send</button>}
      </div>
    </div>
  )
}`, caption: 'messages state (2.2) · streaming reader with buffered flush (2.4) · AbortController Stop button · optimistic empty assistant bubble. Your whole module, rendered.' },
        { type: 'callout', variant: 'warn', text: "This is deliberately minimal so the ARCHITECTURE is visible. Ship-quality versions add: markdown rendering (throttled), persisted history (Lesson 2.2 DB schema), the retry/circuit-breaker gateway (Lesson 2.8), auth, and a token-budget guard. Ticked off below as stretch goals — but the version above genuinely runs and streams." },
      ],
    },
    {
      id: 'quiz',
      title: 'Checkpoint quiz',
      blocks: [
        { type: 'p', text: "Prove the architecture is in your bones — these are the exact questions an interviewer asks about a chatbot on your resume." },
        { type: 'quiz', questions: [
          {
            q: 'An interviewer asks why your chatbot has a backend at all. Best answer?',
            options: [
              'React can\'t make POST requests',
              'The API key must stay server-side, and the backend centralizes the system prompt, auth, rate limits, logging, and model choice',
              'Backends are required by the provider',
              'To make the app slower on purpose',
            ],
            answer: 1,
            explain: 'Key secrecy is the headline; the backend as the single control point for prompt, auth, limits, logging, and model swaps is the senior-level follow-through.',
          },
          {
            q: 'In the React code, why initialize the assistant message as empty content BEFORE the stream arrives?',
            options: [
              'To reserve token budget',
              'Optimistic UI — the empty bubble + cursor renders instantly, then fills as tokens stream; the user sees immediate response',
              'It\'s required by SSE',
              'To prevent hallucination',
            ],
            answer: 1,
            explain: 'Optimistic rendering: show the container immediately, stream content into it. Zero perceived dead time between hitting Send and seeing the reply come alive.',
          },
          {
            q: 'Why does the frontend batch tokens into a 50ms flush instead of setState per token?',
            options: [
              'To save API costs',
              'Per-token setState causes hundreds of re-renders and jank; batching flushes keeps it smooth at a fraction of the renders (Lesson 2.4)',
              'SSE requires batching',
              'To hide the cursor',
            ],
            answer: 1,
            explain: 'The Lesson 2.4 performance rule, applied. Hundreds of renders per response is the classic React-meets-streaming jank; buffered flushing fixes it invisibly.',
          },
          {
            q: 'Where does the conversation "memory" live in this app?',
            options: [
              'In the provider\'s session store',
              'In the React `messages` state, re-sent to the backend each turn (which forwards it) — the model stays stateless',
              'In browser cookies automatically',
              'In the system prompt',
            ],
            answer: 1,
            explain: 'Lesson 2.2 made flesh: the messages array is the memory. The backend forwards it; the model reads it fresh each call. Lose the array, lose the conversation.',
          },
          {
            q: 'To make this production-ready, the MOST important addition from Module 2 is…',
            options: [
              'A prettier CSS theme',
              'The resilient gateway (error classification, backoff, circuit breaker) plus usage metering and history persistence',
              'A bigger model',
              'Higher temperature',
            ],
            answer: 1,
            explain: 'A demo that works on your wifi vs a product that survives 429s, provider blips, refreshes, and cost scrutiny. Lesson 2.8\'s gateway + metering + 2.2\'s persistence are the gap.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm2-l9-c1', front: 'The three-tier chat architecture?', back: 'Browser (state, streaming UI, no secrets) → your server (key, system prompt, auth, logging, model choice) → provider. The middle tier keeps keys secret and centralizes control.' },
          { id: 'm2-l9-c2', front: 'What is optimistic UI in chat?', back: 'Render the empty assistant bubble + cursor the instant the user sends, then stream tokens into it — zero perceived dead time.' },
          { id: 'm2-l9-c3', front: 'Where is conversation memory in a chat app?', back: 'The client\'s messages array, re-sent each turn. The model is stateless; the array is the memory (Lesson 2.2).' },
          { id: 'm2-l9-c4', front: 'Demo → production checklist for this app?', back: 'Resilient gateway (2.8), usage metering (2.1), history persistence + trimming (2.2/1.4), auth, markdown rendering, budget caps.' },
          { id: 'm2-l9-c5', front: 'Why pipe the stream THROUGH your server?', back: 'Keys stay server-side and you keep one control point for prompt/auth/limits/logging — the browser only ever talks to you.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Module 2 complete — you can ship AI now',
      blocks: [
        { type: 'summary', points: [
          'You built a streaming chatbot: secret-safe backend, stateful frontend, cancellation, metering.',
          'Every layer traces to a Module 2 lesson — the checkpoint IS the module, assembled.',
          'The three-tier pattern (browser → server → provider) is the backbone of essentially every AI product.',
          'Demo-to-production is a known checklist: gateway, persistence, auth, budgets.',
          'You crossed the line: from understanding AI to building it.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Stopping at "it works on my machine"', text: 'The single-file version streams beautifully — until a 429, a refresh, or a second user. Wire in the Lesson 2.8 gateway and Lesson 2.2 persistence before calling it done, or the first real user finds the edges.' },
          { title: 'Skipping the metering because "it\'s just a demo"', text: 'Demos become the thing you show investors/employers, then the thing you deploy. The usage log costs 3 lines and answers every future "how much does this cost" question. Add it now.' },
          { title: 'Hardcoding the system prompt in the frontend', text: 'It belongs on the server (Lesson 2.3) — otherwise it ships to the browser where users read and override it, and you can\'t update behavior without a client redeploy.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through a chatbot you built."', a: 'Lead with architecture: three tiers, why the backend exists (key secrecy + control point). Then the flow: messages state → server proxy with server-side key and system prompt → provider with stream:true → SSE piped back → buffered token rendering with a Stop button. Then the production layer: resilient gateway (backoff, breaker), usage metering, persisted history with token-budget trimming. Closing move: name one thing you\'d improve next and why — shows you see the roadmap, not just the demo.' },
          { q: '"What was the hardest part and what did you learn?"', a: 'Great honest answers: SSE parsing (chunks don\'t align to frames — the buffer-tail pattern), or streaming performance in React (per-token setState jank → batched flush), or realizing the model is stateless so ALL memory management is your job. Any of these shows you hit a real wall and understood it, which beats "it just worked".' },
        ] },
        { type: 'usecases', items: [
          { title: 'This IS the reference architecture', text: 'Intercom Fin, Notion AI chat, in-app support bots — all this exact three-tier shape with more layers. You now have the skeleton every one of them is built on.' },
          { title: 'Your portfolio centerpiece (for now)', text: 'Deployed with a real key behind budget caps, this is a legitimate "AI Engineer" portfolio project — until Module 7\'s RAG chatbot dethrones it.' },
          { title: 'The base for everything ahead', text: 'RAG (M7) adds retrieval before the call; agents (M8) add tool-calls in the loop; both bolt onto this chassis. You\'re not restarting — you\'re extending.' },
        ] },
        { type: 'project', title: 'Ship it for real (the full checkpoint)', goal: 'Take the guided build to a deployed, resilient, metered chatbot — your Module 2 capstone.', steps: [
          'Get it running locally: backend with your real key in .env, frontend streaming against it. First streamed token = milestone one.',
          'Harden the backend with your Lesson 2.8 gateway: error classification, backoff, timeout, usage logging to a file.',
          'Add a system-prompt selector (2-3 personas from Lesson 2.3) — proves you understand system prompts as config.',
          'Persist conversations (localStorage is fine for the checkpoint; a DB is the stretch) and add the Lesson 1.4 token-budget trim.',
          'Deploy it (Vercel/Render/Fly — Next.js route or Express both work) behind a per-session token cap so a demo link can\'t bankrupt you. Add a README with architecture diagram and screenshots.',
        ], deliverable: 'A deployed chatbot URL + repo (key NOT committed) with README covering architecture, the Module-2 concepts used, and a "production TODO" list.' },
        { type: 'challenge', title: 'The resilience demo', text: 'Record a 60-second screen capture proving your bot survives adversity: stream a long answer and hit Stop mid-way; kill your wifi mid-response and show graceful failure + recovery; open the network tab and show NO API key in any request. This clip is worth more in an interview than the prettiest UI.', hints: [
          'The "no key in network tab" moment is the one that makes senior engineers nod.',
          'Graceful failure = a friendly error message, not a frozen spinner or a crash.',
          'Bonus: show your usage.log filling up — cost observability is a flex.',
        ] },
        { type: 'reading', links: [
          { label: 'Vercel AI SDK', url: 'https://sdk.vercel.ai/docs', note: 'When you want the batteries-included version of everything you just hand-built — now you\'ll understand what it abstracts.' },
          { label: 'Anthropic streaming docs', url: 'https://docs.anthropic.com/en/api/messages-streaming', note: 'The event types your backend parser handles.' },
          { label: 'Anthropic cookbook', url: 'https://github.com/anthropics/anthropic-cookbook', note: 'Runnable patterns to extend your chatbot toward Module 7 and 8.' },
        ] },
      ],
    },
  ],
}
