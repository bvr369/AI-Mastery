// Lesson 1.6 — From Pretraining to RLHF: How Models Are Made

export default {
  sections: [
    {
      id: 'three-stages',
      title: 'Three stages, one assistant',
      blocks: [
        { type: 'p', text: "You don't need to train models — but you DO need to know how they're made, because **each training stage explains a behavior you'll engineer around**. Why do models sound helpful? Why do they refuse things? Why does 'fine-tuning' cost thousands while 'pretraining' costs millions? One diagram answers all of it." },
        { type: 'diagram', id: 'training-pipeline', caption: 'Pretraining builds knowledge. SFT teaches the assistant format. RLHF tunes it to human taste.' },
        { type: 'h', text: 'Stage 1: Pretraining — the expensive part' },
        { type: 'p', text: "Feed trillions of tokens (web, books, code) through the next-token objective for months on thousands of GPUs. Out comes a [[Base Model]]: a magnificent autocomplete engine containing compressed knowledge of, roughly, everything written. But ask it a question and it might just… continue your text with *more questions*, because that's what text often does. It has knowledge without manners." },
        { type: 'code', lang: 'javascript', filename: 'base-vs-assistant.js', code: `// The same prompt, two very different creatures:

prompt: "What is the capital of France?"

// BASE model (pretrained only) — plausible CONTINUATION:
// "What is the capital of Germany? What is the capital of Italy?
//  Test your geography knowledge with our quiz!"
//  (it thinks it's completing a quiz worksheet — statistically fair!)

// ASSISTANT model (after SFT + RLHF) — an ANSWER:
// "The capital of France is Paris."`, caption: 'Base models complete text. Assistants answer. The difference is stages 2 and 3.' },
        { type: 'h', text: 'Stage 2: SFT — teaching the format' },
        { type: 'p', text: "[[SFT]] (supervised fine-tuning) continues training on a much smaller, curated set of example conversations: question → good answer, instruction → good execution. The model learns the *assistant persona*: answer the question, be helpful, format nicely. Think of it as onboarding: the knowledge was already there; SFT teaches the job." },
        { type: 'h', text: 'Stage 3: RLHF — teaching taste' },
        { type: 'p', text: "Humans rank multiple model outputs (which answer is better?). Those rankings train a [[Reward Model]] — a judge that scores outputs the way humans would. Then [[RLHF]] optimizes the assistant to score highly with that judge. This is where 'helpful, harmless, honest' gets tuned in — and where side effects like sycophancy sneak in: agreeing with people scores well with human raters!" },
        { type: 'callout', variant: 'analogy', title: 'Analogy: hiring a brilliant generalist', text: "Pretraining = 20 years of reading everything (expensive, slow, general). SFT = two weeks of job onboarding with example tickets (cheap, fast, specific). RLHF = ongoing manager feedback shaping their style (which answers got praised). When YOU fine-tune later (Module 11), you're doing more onboarding — never the 20 years." },
      ],
    },
    {
      id: 'be-the-labeler',
      title: 'Be the human in the loop',
      blocks: [
        { type: 'p', text: "RLHF runs on millions of tiny judgments made by people doing exactly what you're about to do: pick the better answer. Do three rankings and watch a toy reward model extract your taste." },
        { type: 'demo', id: 'rlhf-ranker' },
        { type: 'p', text: "Notice what just happened: **you never wrote a rule** like 'be honest about missing files'. You picked outputs, and the preference emerged as weights. That's why model behavior is fuzzy — it's learned taste, not programmed logic. It's also why your third pick (the honest 'no contract attached' answer) matters: raters rewarding *confident-sounding* answers over honest ones is precisely how sycophancy gets trained in." },
      ],
    },
    {
      id: 'why-you-care',
      title: 'Why engineers care (the payoff table)',
      blocks: [
        { type: 'table', headers: ['Model behavior you\'ll meet', 'Training-stage explanation'], rows: [
          ['Knows React but not your codebase', 'Pretraining data is public text; your private code isn\'t in it → RAG (M7)'],
          ['Frozen at a knowledge cutoff', 'Pretraining is a snapshot; nothing after it exists → search tools (M8)'],
          ['Sounds helpful and structured', 'SFT conversations taught that format'],
          ['Sometimes over-agrees (sycophancy)', 'RLHF: agreement scores well with human raters'],
          ['Refuses harmful requests', 'Safety preferences trained via RLHF and related methods'],
          ['Fine-tuning is affordable for you', 'You\'re doing small-scale SFT on a pretrained base — onboarding, not the 20 years'],
        ] },
        { type: 'callout', variant: 'tip', text: "Interview gold: when asked \"should we fine-tune?\", the training pipeline gives you the answer structure. Fine-tuning (small SFT) changes **style, format, and skills** — it does NOT add fresh knowledge reliably. Knowledge injection is RAG's job. Teams that fine-tune to teach facts burn money and get hallucinations; you now know why." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'You prompt a BASE model with "How do I center a div?" It responds with five more CSS questions. Why?',
            options: [
              'It\'s broken and needs a restart',
              'Base models continue text; a list of questions is a statistically plausible continuation',
              'It doesn\'t know CSS',
              'The temperature was too high',
            ],
            answer: 1,
            explain: 'Base models are pure next-token predictors with no assistant training. Question lists (forums, quizzes) are common text patterns — continuing them is exactly what pretraining taught. SFT is what turns continuation into answering.',
          },
          {
            q: 'Which stage gives the model its factual world knowledge?',
            options: ['SFT', 'RLHF', 'Pretraining', 'The system prompt'],
            answer: 2,
            explain: 'Pretraining on trillions of tokens builds virtually all knowledge. SFT and RLHF are tiny by comparison — they shape behavior and taste, not what the model knows.',
          },
          {
            q: 'What does the reward model do in RLHF?',
            options: [
              'Generates better answers than the main model',
              'Scores outputs the way human raters would, so training can optimize toward preferred answers at scale',
              'Rewrites the training data',
              'Filters unsafe prompts at inference time',
            ],
            answer: 1,
            explain: 'Humans can\'t rank billions of outputs, so their rankings train a judge — the [[Reward Model]] — which then provides the training signal at scale. You built a toy one in the demo.',
          },
          {
            q: 'Your team wants to fine-tune a model "so it knows our product documentation". What\'s the senior take?',
            options: [
              'Great plan — fine-tuning is how you add knowledge',
              'Fine-tuning reliably changes style/format/skills, not knowledge — use RAG for docs, fine-tune only if format/tone needs work',
              'Impossible — fine-tuning is only for big labs',
              'First pretrain a custom model from scratch',
            ],
            answer: 1,
            explain: 'The classic expensive mistake. Small-scale SFT teaches behavior patterns; facts injected this way come out unreliably (hallucination-prone). Docs belong in context via RAG; fine-tune when you need consistent style, format, or task skills.',
          },
          {
            q: 'Sycophancy — models over-agreeing with users — most plausibly originates from…',
            options: [
              'Bugs in the tokenizer',
              'Human raters tending to prefer agreeable answers, which RLHF then optimizes for',
              'Models being programmed to be polite',
              'The context window being too small',
            ],
            answer: 1,
            explain: 'RLHF optimizes for what scores well with human judges — and humans rate agreement and confidence kindly. The lesson: training incentives become model personality, side effects included.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm1-l6-c1', front: 'The three training stages and what each contributes?', back: '**Pretraining** → knowledge (trillions of tokens, months, $M). **SFT** → assistant format (curated conversations). **RLHF** → taste/alignment (human preference rankings).' },
          { id: 'm1-l6-c2', front: 'What is a base model?', back: 'A model after pretraining only: encyclopedic autocomplete with no assistant manners — it continues text rather than answering.' },
          { id: 'm1-l6-c3', front: 'What is a reward model?', back: 'A judge trained on human rankings that scores outputs like a human would — it provides RLHF\'s training signal at scale.' },
          { id: 'm1-l6-c4', front: 'Fine-tuning changes ___ but not ___?', back: 'Changes style, format, and task skills. Does NOT reliably add knowledge — that\'s RAG\'s job. (The most-tested fine-tuning fact in interviews.)' },
          { id: 'm1-l6-c5', front: 'Where does sycophancy come from?', back: 'RLHF side effect: human raters prefer agreeable, confident answers, so models learn to over-agree.' },
          { id: 'm1-l6-c6', front: 'Why is fine-tuning affordable when pretraining costs millions?', back: 'You start from a pretrained base and do small-scale supervised training — onboarding an employee vs raising them for 20 years.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Pipeline: **pretraining** (knowledge) → **[[SFT]]** (assistant format) → **[[RLHF]]** (human-preference taste).',
          'Base models continue; assistants answer. The difference is stages 2-3, not knowledge.',
          'The reward model scales human judgment; its biases (rewarding agreement) become model personality.',
          'Fine-tuning = small SFT: changes behavior, not knowledge. Docs → RAG; tone/format → fine-tune.',
          'Every quirk you\'ll engineer around — cutoffs, sycophancy, helpfulness — traces to a training stage.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Fine-tuning to inject knowledge', text: 'The canonical misallocation of an AI budget. Facts trained via small SFT surface unreliably and hallucinate confidently. Knowledge lives in context (RAG); fine-tuning shapes behavior. Module 11 gives you the full decision tree.' },
          { title: 'Thinking the system prompt retrains the model', text: 'Prompts steer a frozen model at inference; nothing persists between calls. "The model learned from our conversation" — no, your app just kept the history in context. Training and inference are entirely separate worlds.' },
          { title: 'Treating alignment as a solved binary', text: '"It\'s RLHF\'d, so it\'s safe" — alignment is a statistical tendency, not a guarantee. Adversarial prompts, edge domains, and long contexts can all surface unaligned behavior. Your product still needs its own guardrails (M8, M12).' },
          { title: 'Cargo-culting "more training is better"', text: 'Over-tuned models get worse: catastrophic forgetting, mode collapse, robotic tone. When you fine-tune in Module 11, eval-driven early stopping will matter more than epochs.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain the difference between pretraining, fine-tuning, and RLHF to a PM."', a: 'Pretraining: read everything ever written, learn to predict text — months, millions of dollars, produces raw knowledge. Fine-tuning/SFT: show it a few thousand examples of the job done well — days, thousands of dollars, produces behavior. RLHF: have humans rank its answers and tune toward what they prefer — produces judgment/taste. Punchline for the PM: we can afford stages 2-3 on top of someone else\'s stage 1; that\'s the entire AI industry\'s business model.' },
          { q: '"When would you fine-tune vs use RAG vs just prompt better?"', a: 'Decision tree: (1) Prompting first — cheapest, instant iteration; covers format, tone, and most behavior. (2) RAG when the model needs knowledge it doesn\'t have — private docs, fresh data. (3) Fine-tune when prompting can\'t hold a consistent style/format across thousands of calls, to distill a big model\'s skill into a cheaper one, or for narrow specialized tasks. They compose: fine-tuned model + RAG + good prompts is the production norm.' },
          { q: '"What is RLHF and what are its known side effects?"', a: 'Human rankings train a reward model; RL optimizes the assistant against it. Side effects: sycophancy (agreement scores well), verbosity (longer answers rated better), over-refusal in ambiguous areas, and reward hacking generally — optimizing the judge\'s score rather than true quality. Knowing the failure modes signals real depth beyond the acronym.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Why every provider\'s models "feel" different', text: 'Claude vs GPT vs Gemini personality differences are largely SFT data + RLHF preference differences — same transformer idea, different taste training.' },
          { title: 'Distillation economics', text: 'Small cheap models are often trained on outputs of frontier models — SFT where the teacher is another AI. It\'s why small models improved so fast, and it\'s a technique YOU can use (Module 11).' },
          { title: 'Domain assistants (legal, medical, code)', text: 'Specialist products typically = strong base model + domain SFT + RAG over domain corpora — the full pipeline from this lesson, applied commercially.' },
          { title: 'Character/persona products', text: 'Companion apps and branded assistants are SFT+preference-tuning showcases: the entire product IS the behavior layer.' },
        ] },
        { type: 'project', title: 'Build an SFT dataset (the artifact that matters)', goal: 'Fine-tuning is 90% dataset engineering. Build a tiny, well-formed instruction dataset for a support bot — the exact artifact you\'d hand to a fine-tuning job in Module 11.', steps: [
          'Pick a product you know well (or invent one). Define the assistant\'s 3 style rules — e.g. friendly-but-brief, always offer a next step, never invent order data.',
          'Write 10 training examples as JSON: {"messages": [{"role":"system",...},{"role":"user",...},{"role":"assistant",...}]} — the standard SFT format.',
          'Make 7 examples showcase the happy path in your exact style; make 3 teach hard cases: an unanswerable question (correct behavior: escalate), an angry user, a false premise.',
          'Quality pass: is every assistant turn something you\'d be proud to ship verbatim? SFT copies WHATEVER is there — flaws included.',
          'Write 3 sentences on what you\'d need for a REAL dataset (hundreds of examples, dedup, eval split, coverage of edge cases).',
        ], deliverable: 'sft-dataset.jsonl (10 examples) + a short quality-notes file.' },
        { type: 'challenge', title: 'Spot the RLHF fingerprints', text: 'Have a 6-turn conversation with any chat AI. Identify THREE specific behaviors that were trained in (not programmed): e.g. hedging patterns, bullet-point affinity, agreement reflexes, refusal styles, "great question!" openers. For each, name which stage most plausibly produced it.', hints: [
          'Formatting habits → SFT examples. Politeness/agreement/hedging → RLHF preferences.',
          'Try stating a mildly wrong opinion confidently and watch the response style.',
          'Bonus: ask the same question rudely vs politely — differences in tone-matching are preference training in action.',
        ] },
        { type: 'reading', links: [
          { label: 'Andrej Karpathy — Intro to LLMs (video)', url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g', note: 'If you skipped it in Lesson 1.1, now is the moment — the training pipeline section will lock this lesson in.' },
          { label: 'InstructGPT paper (OpenAI)', url: 'https://arxiv.org/abs/2203.02155', note: 'THE paper that established SFT+RLHF for assistants. Read the figures and section 3.' },
          { label: 'Constitutional AI (Anthropic)', url: 'https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback', note: 'How preference training evolves beyond human labels — AI feedback guided by principles.' },
        ] },
      ],
    },
  ],
}
