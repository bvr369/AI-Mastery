// Lesson 1.1 — What Is Generative AI?
// Audience: a React developer with zero AI background.

export default {
  sections: [
    {
      id: 'big-idea',
      title: 'The big idea',
      blocks: [
        { type: 'p', text: "You've spent your career writing software that **follows instructions**. Every `if`, every `switch`, every Redux reducer — you told the computer exactly what to do, and it did exactly that. Nothing more." },
        { type: 'p', text: "Generative AI flips this. Instead of following rules you wrote, a model has **learned patterns** from a huge chunk of the internet — code, books, conversations, documentation — and uses those patterns to **create new things**: text, code, images, audio. Things nobody explicitly programmed it to say." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: two chefs', text: "A traditional program is a chef who follows one recipe card, step by step. If an ingredient is missing, they stop. A generative model is a chef who has *tasted a million dishes* — hand them random ingredients and they'll improvise something plausible. Sometimes brilliant, occasionally weird, never exactly the same twice." },
        { type: 'p', text: "The engine behind the current wave is the [[LLM]] — a large language model. Under the hood it does one deceptively simple thing: given some text (the [[Prompt]]), it predicts what [[Token]] should come next. Then it does it again. And again. That's it. Chat, code generation, translation, agents — all built on that one trick. The next lesson tears this open." },
        { type: 'h', text: 'Why should a React dev care?' },
        { type: 'list', items: [
          "**Features that were impossible are now a fetch() call.** Summarize a document, answer questions about a codebase, generate UI copy — each used to be a research team; now it's an API request.",
          "**AI Engineer is the highest-leverage upgrade path for web devs.** You already have the hard part: shipping products. The AI layer is learnable — that's this course.",
          "**Every product you build from now on will be judged against AI-native competitors.** Knowing what models can and can't do is table stakes.",
        ] },
        { type: 'callout', variant: 'info', text: "**Generative** AI creates new content (ChatGPT, Claude, Midjourney). Its sibling, *discriminative* AI, classifies existing content (spam filter, face detection). This course is about the generative kind — the kind you build products with." },
      ],
    },
    {
      id: 'how-different',
      title: 'Rules vs patterns — see the difference',
      blocks: [
        { type: 'p', text: "Watch the two pipelines below. The left one is every program you've ever written: deterministic, predictable, exact. The right one is generative: same prompt in, *different poem out each cycle*. That's not a bug — the model **samples** from probabilities instead of following branches." },
        { type: 'diagram', id: 'genai-vs-traditional', caption: 'Traditional code executes rules. Generative AI samples from learned patterns — watch the outputs cycle.' },
        { type: 'p', text: "This one difference explains almost everything that feels strange about AI engineering: why outputs vary, why you can't unit-test a response with `toBe()`, why 'prompting' is a skill, and why models sometimes produce confident nonsense — a failure mode called [[Hallucination]] that we'll engineer around in later lessons." },
        { type: 'table', headers: ['', 'Traditional software', 'Generative AI'], rows: [
          ['You write', 'explicit rules', 'a prompt + examples'],
          ['Same input gives', 'same output, always', 'a *different* plausible output'],
          ['Fails by', 'crashing / wrong branch', 'being confidently wrong'],
          ['You test with', 'exact assertions', 'evals & scoring (Module 10)'],
          ['Behavior lives in', 'your code', "the model's learned weights + your prompt"],
        ] },
      ],
    },
    {
      id: 'try-it',
      title: 'Try it: one prompt, many outputs',
      blocks: [
        { type: 'p', text: "Don't take my word for it. Run the same prompt a few times below and watch the output change. Then flip on **creative mode** — that's a preview of [[Temperature]], the knob you'll master in Module 2." },
        { type: 'demo', id: 'prompt-possibilities' },
      ],
    },
    {
      id: 'in-code',
      title: 'The mental model, in code',
      blocks: [
        { type: 'p', text: "Here's generative AI in the language you think in. Every chatbot on earth is roughly this loop:" },
        { type: 'code', lang: 'javascript', filename: 'every-llm-ever.js', code: `// Pseudo-code — but honestly? Not by much.
let context = "User: Explain React hooks in one sentence.\\nAssistant:"

while (!done) {
  // The model does ONE thing: score every possible next token
  const probabilities = model.predictNextToken(context)

  // Pick one (this is where temperature lives — Lesson 1.2)
  const nextToken = sample(probabilities)

  context += nextToken   // append and go again
  done = nextToken === END_OF_RESPONSE
}`, caption: 'The entire "intelligence" is inside predictNextToken — everything else is a while loop.' },
        { type: 'p', text: "And here's what *real* production AI code looks like — this is a genuine API call you'll make yourself in Module 2. Notice it's just `fetch()` with JSON. You already know how to do this:" },
        { type: 'code', lang: 'javascript', filename: 'sneak-peek-module-2.js', code: `const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: 200,
    messages: [{ role: "user", content: "Explain React hooks in one sentence." }],
  }),
})

const data = await response.json()
console.log(data.content[0].text)
// "Hooks let function components remember state and tap into
//  React's lifecycle without writing a class."`, caption: "An AI feature in ~15 lines. The hard part isn't the call — it's everything this course teaches around it." },
        { type: 'callout', variant: 'tip', text: "From day one, think of a model as **a very smart, very forgetful intern behind an API**: brilliant at drafts, needs clear instructions, remembers only what's in the current conversation, and occasionally states nonsense with total confidence. Every architecture decision in this course flows from those four traits." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'p', text: 'Five questions, 70% to pass, retake anytime. Wrong answers teach you the most — read the explanations.' },
        { type: 'quiz', questions: [
          {
            q: 'What is the ONE core operation an LLM performs?',
            options: [
              'Searching a giant database of answers',
              'Predicting the next token, repeatedly',
              'Executing rules written by its developers',
              'Translating text into SQL queries',
            ],
            answer: 1,
            explain: "Everything an LLM does — chat, code, reasoning — emerges from repeatedly predicting the next [[Token]]. It has no database of answers; knowledge is baked into its weights.",
          },
          {
            q: 'You run the same prompt twice and get two different (both correct) answers. What does this tell you?',
            options: [
              'The API is buggy and you should retry',
              'The model was updated between calls',
              'The model samples from probabilities, so variation is expected behavior',
              'Your prompt was too short',
            ],
            answer: 2,
            explain: 'Generation is **sampling**, not lookup. Same input → different plausible outputs is by design. You can reduce (not fully eliminate) variation with a low temperature.',
          },
          {
            q: 'Which of these is a *generative* AI task, as opposed to a discriminative one?',
            options: [
              'Deciding if an email is spam',
              'Detecting whether a photo contains a cat',
              'Rating a review as positive or negative',
              'Writing a product description from bullet points',
            ],
            answer: 3,
            explain: 'Generative = **creates new content** (the description). The other three classify existing content into categories — classic discriminative AI.',
          },
          {
            q: "Compared to traditional software, how does generative AI typically fail?",
            options: [
              'It throws an exception and halts',
              'It produces confident but incorrect output',
              'It refuses to return anything',
              'It always fails loudly and visibly',
            ],
            answer: 1,
            explain: "This is the failure mode that changes how you engineer: [[Hallucination]] is *silent*. No stack trace, no error — just fluent, wrong text. Modules 7 and 10 are largely about catching it.",
          },
          {
            q: 'Where does the "behavior" of an LLM-powered feature primarily live?',
            options: [
              'In the if/else logic of your backend',
              "In the model's learned weights plus the prompt you send",
              'In your database schema',
              'In the frontend framework you choose',
            ],
            answer: 1,
            explain: "You don't program the behavior line-by-line — you *steer* patterns already learned in the [[Weights]] using your prompt. That's why prompt engineering (Module 3) is a real engineering skill.",
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'p', text: "Grade yourself honestly — the spaced-repetition scheduler uses your grades to decide when each card returns in the **Review** tab." },
        { type: 'flashcards', cards: [
          { id: 'm1-l1-c1', front: 'What single operation powers everything an LLM does?', back: 'Predicting the next **token**, over and over — each new token is appended to the context and fed back in.' },
          { id: 'm1-l1-c2', front: 'Generative vs discriminative AI?', back: '**Generative** creates new content (write, draw, compose). **Discriminative** classifies existing content (spam or not, cat or dog).' },
          { id: 'm1-l1-c3', front: 'Why does the same prompt give different outputs?', back: 'The model **samples** from a probability distribution over next tokens instead of executing deterministic rules.' },
          { id: 'm1-l1-c4', front: 'What is a hallucination?', back: 'Fluent, confident output that is factually wrong. It fails *silently* — no error is thrown — which is why AI apps need evals and grounding.' },
          { id: 'm1-l1-c5', front: 'What is a prompt?', back: 'Everything you send the model as input: instructions, context, examples, and the user message. It is how you steer learned patterns.' },
          { id: 'm1-l1-c6', front: 'The "smart intern" mental model — its four traits?', back: 'Great at drafts · needs clear instructions · remembers only the current conversation · occasionally confidently wrong.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Traditional software **executes rules you wrote**; generative AI **samples from patterns it learned** — that one difference explains most of AI engineering.',
          'An [[LLM]] does one thing: predict the next [[Token]], in a loop. Chat, code, and agents are all built on that trick.',
          'Outputs vary by design (sampling), so testing shifts from exact assertions to evals.',
          'Models fail *silently* by hallucinating — fluent, confident, wrong.',
          'Using a model is just `fetch()` — the engineering skill is everything around the call.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Treating the model like a database', text: "Asking an LLM for facts as if it were querying storage. It reconstructs plausible text from patterns — for facts you need [[RAG]] (Module 7) or search grounding. Never ship 'the model said so' as a source of truth." },
          { title: 'Expecting identical outputs every run', text: "Devs write tests like `expect(output).toBe('...')` and file bugs when they fail. Variation is intrinsic. You'll learn deterministic-ish settings (temperature 0) and proper eval techniques instead." },
          { title: 'Assuming the model "understands" like a human', text: "It predicts text astonishingly well — which *looks* like understanding and often works like it. But it will also complete nonsense confidently. Design for the failure case, not the demo case." },
          { title: 'Dismissing it all as hype (or magic)', text: 'Both extremes cost engineers opportunities. It is neither a conscious mind nor a toy autocomplete — it is a new computing primitive with specific strengths, costs, and failure modes you can learn.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain generative AI to a non-technical stakeholder in 30 seconds."', a: "Strong answer: 'Traditional software follows exact rules a programmer wrote. Generative AI learned patterns from millions of examples and uses them to create new content — text, code, images. It's like autocomplete taken to its logical extreme: powerful for drafts and transformation, but it needs guardrails because it can be confidently wrong.'" },
          { q: '"What is the difference between generative and discriminative models?"', a: 'Discriminative models draw boundaries: given input, pick a label (spam/not-spam). Generative models learn the distribution of the data itself, so they can produce **new samples** from it. Bonus points: mention that modern LLMs are generative but are often used for discriminative tasks too (classification via prompting).' },
          { q: '"Why do LLM outputs vary between identical calls, and how would you control that?"', a: 'Generation samples from a probability distribution over next tokens. Control it with sampling parameters — temperature ≈ 0 for near-deterministic output, or constrain the output space with structured/JSON modes. Note that even at temperature 0, providers do not always guarantee bit-identical results.' },
          { q: '"What changes about testing when you put an LLM in your product?"', a: 'Exact-match assertions break. You shift to: property-based checks (valid JSON? contains citation?), scoring against golden datasets, LLM-as-judge evals, and regression suites over prompts. Testing becomes statistical rather than binary.' },
        ] },
        { type: 'usecases', items: [
          { title: 'GitHub Copilot / Cursor', text: 'Next-token prediction pointed at code. The "AI pair programmer" is literally the loop from this lesson running over your editor buffer.' },
          { title: 'Customer support deflection', text: 'Intercom Fin, Zendesk AI — LLMs answer common tickets grounded in help-center docs (a RAG pattern you\'ll build in Module 7).' },
          { title: 'Notion AI / Google Docs "Help me write"', text: 'Draft, summarize, change tone. The killer feature is transformation of text the user already has — low hallucination risk, high value.' },
          { title: 'Structured extraction', text: 'Turning messy emails, PDFs, invoices into clean JSON for your backend. One of the highest-ROI, least-flashy GenAI uses in industry — you\'ll do it in Module 2.' },
        ] },
        { type: 'project', title: 'GenAI capability map', goal: "Build first-hand intuition for what today's models are actually good at — using any free chat AI (Claude, ChatGPT, Gemini), no code needed.", steps: [
          'Pick 8 task types: summarize an article, write a React component, translate a paragraph, extract JSON from a messy email, do multi-digit multiplication, answer a niche question about your hometown, rewrite text in a different tone, plan a week of meals.',
          'Run each task in a chat AI. Rate the result 1–5 on correctness and usefulness. Note anything it got confidently wrong.',
          'For every task rated ≤ 3, try to improve the result by rewriting your prompt once (add context, examples, or constraints). Record whether it helped.',
          'Write your capability map as a markdown table: task → rating → failure notes → did better prompting fix it?',
          "Keep this file — you'll revisit it after Module 3 (Prompt Engineering) and be shocked how many 3s become 5s.",
        ], deliverable: 'A `capability-map.md` with 8 rated tasks and notes on where prompting helped.' },
        { type: 'challenge', title: 'Stump the model', text: "Find **three prompts** where a chat AI confidently gives a *wrong* answer (not a refusal — a wrong answer delivered fluently). For each, write one sentence on *why* it failed, using this lesson's concepts.", hints: [
          'Try niche facts: your small hometown\'s history, a minor 1990s sports result, details of an obscure library\'s API.',
          'Try arithmetic with big numbers — pattern prediction is not calculation.',
          'Try "what happened last week" — training data has a cutoff and models without search cannot know.',
          'Failure vocabulary: hallucination (plausible reconstruction), no calculator (predicts digit-shaped text), knowledge cutoff (missing recency).',
        ] },
        { type: 'reading', links: [
          { label: 'What Is ChatGPT Doing… and Why Does It Work? — Stephen Wolfram', url: 'https://writings.stephenwolfram.com/2023/02/what-is-chatgpt-doing-and-why-does-it-work/', note: 'The single best deep-dive companion to this lesson. Long, but visual.' },
          { label: 'Intro to Large Language Models — Andrej Karpathy (video)', url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g', note: '1 hour, zero math, engineer-brained. Watch before Lesson 1.6.' },
          { label: 'Generative AI for Beginners — Microsoft', url: 'https://github.com/microsoft/generative-ai-for-beginners', note: 'A free companion curriculum if you want a second angle on any topic.' },
        ] },
      ],
    },
  ],
}
