// Lesson 2.2 — Messages, Roles & Conversation State

export default {
  sections: [
    {
      id: 'stateless',
      title: 'The model has amnesia. Your array is the cure.',
      blocks: [
        { type: 'p', text: "Here's the fact that reorganizes how you think about chat apps: **the model remembers nothing between calls**. Zero. Each request is a fresh brain receiving whatever you send. So how does ChatGPT \"remember\" your name from ten messages ago? Simple: **the app re-sends the entire conversation, every turn.** Chat is not a session — it's an array you manage." },
        { type: 'diagram', id: 'messages-loop', caption: 'Turn 3 re-sends turns 1 and 2. The model reads the whole array fresh, every time.' },
        { type: 'h', text: 'The three roles' },
        { type: 'list', items: [
          '**`user`** — the human\'s turns. Untrusted input (a theme Module 3 turns into a security lesson).',
          '**`assistant`** — the model\'s previous replies. Yes, you send the model *its own words back* — that\'s the only way it knows what it said.',
          '**`system`** — the app\'s standing instructions (next lesson gets deep). In Anthropic\'s dialect it\'s a separate top-level field; in OpenAI\'s it\'s messages[0].',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the goldfish transcript', text: "Every turn, you're briefing a brilliant goldfish: it reads the FULL transcript of your relationship in one gulp, responds perfectly in character, then forgets everything. The continuity users feel lives entirely in the transcript you keep. Lose the array, lose the relationship." },
        { type: 'callout', variant: 'warn', text: "Two consequences you now own: (1) **cost grows quadratically** with conversation length — every old token is re-billed every new turn (Lesson 1.4's budgeting exists for this); (2) **you can edit history** — trim it, summarize it, even rewrite it. That's a superpower (memory systems, Module 8) and a responsibility (never fake assistant turns to manipulate behavior… except deliberately, as 'prefilling', a legit technique you'll meet in Module 3)." },
      ],
    },
    {
      id: 'build-array',
      title: 'Build the array by hand',
      blocks: [
        { type: 'p', text: 'Add turns, edit them, delete them — and watch the exact wire payload. Deleting an assistant turn literally unsays it.' },
        { type: 'demo', id: 'message-builder' },
      ],
    },
    {
      id: 'code-loop',
      title: 'Code: a working multi-turn conversation',
      blocks: [
        { type: 'p', text: "The chat loop every AI app contains, in 20 lines. The sandbox's `llm()` helper stands in for the fetch call you mastered last lesson:" },
        { type: 'playground', id: 'chat-loop', title: 'The conversation loop', height: 330, code: `// The heart of every chat app: an array + a loop
const messages = []

async function chat(userText) {
  messages.push({ role: "user", content: userText })

  // real life: fetch with the whole messages array (Lesson 2.1)
  const reply = await llm(userText, { system: "Be brief and concrete." })

  messages.push({ role: "assistant", content: reply })
  return reply
}

console.log("A:", await chat("What is a closure in JavaScript?"))
console.log("A:", await chat("Show me the shortest possible example"))

// The state your app is responsible for:
console.log("\\n--- conversation state ---")
console.log(JSON.stringify(messages, null, 2))
console.log("turns:", messages.length, "| ~tokens:", Math.ceil(JSON.stringify(messages).length / 4))`, solution: `const messages = []
const MAX_TURNS = 6   // keep system prompt + last 6 messages

async function chat(userText) {
  messages.push({ role: "user", content: userText })

  // trim BEFORE sending — the Lesson 1.4 sliding window
  while (messages.length > MAX_TURNS) {
    const dropped = messages.shift()
    console.log("(trimmed:", dropped.role, "turn)")
  }

  const reply = await llm(userText, { system: "Be brief and concrete." })
  messages.push({ role: "assistant", content: reply })
  return reply
}

for (const q of ["What is a closure?", "Example?", "Common bug with them?",
                 "How do hooks relate?", "Summarize everything so far"]) {
  console.log("Q:", q)
  console.log("A:", (await chat(q)).slice(0, 80) + "…\\n")
}
console.log("final array length:", messages.length, "(capped at", MAX_TURNS + ")")
// Note what the last answer CAN'T include: the trimmed early turns.
// The model isn't forgetful — the array is.`, caption: '**Exercise:** conversations grow forever — add a MAX_TURNS cap that drops the oldest turns before each send (the Lesson 1.4 sliding window). The solution shows it, plus a demonstration of what trimming does to "memory".' },
        { type: 'callout', variant: 'tip', text: "Production message arrays are **data, so treat them like data**: persist to a database keyed by conversation id, validate roles alternate properly, and version the shape. \"Chat history\" bugs are almost always array-management bugs — the model is the one component that never forgets to forget." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'How does a chat app make the model "remember" earlier turns?',
            options: [
              'The provider stores session state per API key',
              'The app re-sends the entire messages array every call',
              'The model caches conversations by IP',
              'Cookies attach the history automatically',
            ],
            answer: 1,
            explain: 'Models are stateless functions: same input array → response. All continuity is the array your app maintains and re-sends. There is no session on the model side.',
          },
          {
            q: 'Why do you send the model its OWN previous replies back as `assistant` messages?',
            options: [
              'For provider-side billing verification',
              'It\'s optional politeness',
              'Without them, the model has no idea what it previously said — it would contradict or repeat itself',
              'To fine-tune the model on its outputs',
            ],
            answer: 2,
            explain: 'The assistant turns ARE the model\'s memory of itself. Drop them and it will happily re-answer or contradict — as you saw when deleting a turn in the demo.',
          },
          {
            q: 'A 50-turn conversation costs disproportionately more than 50 single questions because…',
            options: [
              'Providers charge a per-turn premium',
              'Every turn re-sends and re-bills all previous tokens — cost grows roughly quadratically with length',
              'Long chats route to bigger models',
              'It doesn\'t — cost is identical',
            ],
            answer: 1,
            explain: 'Turn N pays for turns 1…N-1 again as input. Sum that: quadratic growth. This is why history trimming/summarization is a COST feature, not just a context-window feature.',
          },
          {
            q: 'Your chat app has a bug: the model keeps re-answering the user\'s FIRST question. Most likely cause?',
            options: [
              'Temperature too low',
              'The app appends user turns but never appends the assistant replies to the array',
              'The model is overloaded',
              'max_tokens is too small',
            ],
            answer: 1,
            explain: 'Classic array-management bug: without its own replies in the history, every call looks like the first unanswered question. Chat bugs are array bugs.',
          },
          {
            q: 'What does "you can edit history" enable, legitimately?',
            options: [
              'Nothing — history is immutable',
              'Trimming, summarizing old turns, injecting retrieved facts, and deliberate prefilling techniques',
              'Making the model believe false things is the only use',
              'Free tokens',
            ],
            answer: 1,
            explain: 'The array is yours: sliding windows, summarization (Lesson 1.4 project), RAG-injected context (Module 7), and prefill techniques (Module 3) are all legitimate history edits.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm2-l2-c1', front: 'Why is chat "an array you manage"?', back: 'Models are stateless — each call reads only what you send. Continuity = your app re-sending the full messages array every turn.' },
          { id: 'm2-l2-c2', front: 'The three roles?', back: '**user** (human, untrusted), **assistant** (the model\'s own past replies — its only self-memory), **system** (app\'s standing instructions).' },
          { id: 'm2-l2-c3', front: 'Why does chat cost grow quadratically?', back: 'Turn N re-sends and re-bills turns 1…N-1 as input. Trimming/summarizing history is a cost optimization, not just a window fix.' },
          { id: 'm2-l2-c4', front: 'The classic "re-answers the first question" bug?', back: 'The app never appends assistant replies to the array — every call looks like a fresh unanswered question.' },
          { id: 'm2-l2-c5', front: 'Legitimate history edits?', back: 'Sliding-window trims, summarization of old turns, RAG context injection, deliberate prefilling. The array is app data — treat it like data.' },
          { id: 'm2-l2-c6', front: 'Where does the system prompt go in each dialect?', back: 'Anthropic: separate top-level `system` field. OpenAI: first message with role "system". Same concept, different plumbing.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Stateless model + re-sent array = the entire illusion of chat memory.',
          'Roles: user (untrusted), assistant (the model\'s self-memory), system (your rules).',
          'Old tokens are re-billed every turn — trim or summarize for cost AND fit.',
          'Chat bugs are array bugs: append both sides, persist properly, validate shape.',
          'History is editable app data — the foundation for memory systems and RAG.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Storing chat state only in React state', text: 'Refresh = conversation gone. Production chat persists messages to a database per conversation id; the UI state is a cache of it. Design the schema early: id, role, content, created_at, tokens.' },
          { title: 'Forgetting the assistant turns', text: 'The re-answering bug from the quiz — append BOTH sides of every exchange. Test: ask "what did you just say?" — if the model can\'t answer, your array is broken.' },
          { title: 'Sending stale system prompts', text: 'The system prompt is re-sent every call, which means you can UPDATE it mid-conversation (new user tier, new context). Teams that treat it as fixed miss free personalization.' },
          { title: 'Letting arrays grow until the window fails', text: 'The failure is silent quality decay, then a hard error. Instrument turn count and token size per conversation from day one; trim proactively at ~60-70% of budget.' },
        ] },
        { type: 'interview', items: [
          { q: '"Design the data model for a chat application backed by an LLM."', a: 'Tables: conversations (id, user_id, system_prompt_version, created) and messages (id, conversation_id, role, content, tokens, created). Per request: load recent messages within the token budget (Lesson 1.4 function), send, append both turns. Mention: soft-deletes for edits, a summary column for compacted history, and usage logging per message for cost attribution.' },
          { q: '"The model is stateless — what does that force your architecture to do?"', a: 'Own ALL state: history persistence, token budgeting, trimming/summarization policy, and durable memory (user facts extracted to storage and re-injected). It also makes calls idempotent and horizontally scalable — statelessness is a gift for infra, a chore for app logic.' },
          { q: '"How would you debug: \'the bot forgot what we discussed\'?"', a: 'Reproduce, then inspect the EXACT array sent (log payloads!): (1) Was the info in a trimmed turn? → trimming policy or summarization gap. (2) Present but mid-context? → lost-in-the-middle, restructure. (3) Never captured? → the app dropped an append. The answer is always in the payload, never in the "model\'s mood".' },
        ] },
        { type: 'usecases', items: [
          { title: 'Every chat product you\'ve used', text: 'ChatGPT, Claude.ai, Intercom bots — all maintain server-side message arrays exactly like today\'s code, plus trimming and summarization layers.' },
          { title: 'Conversation branching', text: '"Edit message and regenerate" = truncate the array at that point and re-send. Once you see chat as an array, branching UIs become obvious.' },
          { title: 'Handoff to humans', text: 'Support escalations forward the messages array to an agent dashboard — the array IS the case file.' },
          { title: 'Multi-model conversations', text: 'Route the same array to different models per turn (cheap for chitchat, frontier for hard parts) — possible only because state lives in your app, not the model.' },
        ] },
        { type: 'project', title: 'Terminal chatbot with a sliding window', goal: 'Upgrade Lesson 2.1\'s ask.js into a real multi-turn chatbot with visible state management.', steps: [
          'Use Node\'s readline for an interactive loop: prompt, send, print, repeat.',
          'Maintain the messages array; append user and assistant turns properly.',
          'Add the sliding window: cap at N messages, log "(trimmed X turns)" when it kicks in.',
          'Add /commands: /state prints the current array + token estimate, /clear resets, /save writes the conversation to JSON.',
          'Prove statelessness to yourself: /clear mid-chat, then ask "what\'s my name?" — enjoy the goldfish.',
        ], deliverable: 'chat.js — a working terminal chatbot with window trimming and /state introspection.' },
        { type: 'challenge', title: 'The summarizer upgrade', text: 'Replace your project\'s "drop oldest turns" trim with Lesson 1.4\'s real dream: when trimming, first ask the model to summarize the turns being dropped, then insert that summary as a single message. Compare memory quality vs plain dropping with a 15-turn test conversation.', hints: [
          'The summarize call is just another llm() call: "Summarize these turns preserving all facts, names, and decisions: …"',
          'Insert as role "user" with a [CONTEXT SUMMARY] prefix, or in the system prompt — try both, note the difference.',
          'Measure: after 15 turns, ask about a fact from turn 2. Dropped: gone. Summarized: usually survives.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic docs: Messages API', url: 'https://docs.anthropic.com/en/api/messages', note: 'The exact array shape and role rules — the source of truth.' },
          { label: 'Building persistent chat (Vercel AI SDK docs)', url: 'https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-message-persistence', note: 'How a popular framework structures message persistence — compare with your project schema.' },
        ] },
      ],
    },
  ],
}
