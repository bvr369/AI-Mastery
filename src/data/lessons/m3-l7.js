// Lesson 3.7 — Evaluating & Iterating on Prompts

export default {
  sections: [
    {
      id: 'stop-guessing',
      title: 'Stop tuning prompts by vibes',
      blocks: [
        { type: 'p', text: "Here's how most people iterate on prompts: change a word, eyeball one output, think \"hmm, better?\", ship it. That's not engineering — it's superstition. The professional move, and the skill that most separates senior AI engineers from beginners, is **measuring prompt quality against test cases**. Once \"is B better than A?\" is a number instead of a hunch, prompt engineering becomes real engineering." },
        { type: 'diagram', id: 'prompt-eval', caption: 'A test set + a scorer turns "I think B is better" into "B scores 94% vs 72%" — and a regression test forever.' },
        { type: 'h', text: 'The eval-driven loop' },
        { type: 'list', items: [
          '**Build a [[Golden Set]]** — inputs paired with known-good expected outputs. Start with 10-20; mine real failures over time.',
          '**Pick a scorer** — exact match (classification), contains-check (must cite a source), or [[LLM-as-Judge]] for open-ended quality (Module 10 goes deep).',
          '**Run variants** — prompt A vs prompt B against the same set. Same model, same temperature — the prompt is the only variable.',
          '**Compare scores, pick the winner** — by data, not vibes.',
          '**Keep the set as a regression test** — every future prompt or model change re-runs it. Quality drops get caught before users find them.',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: TDD for prompts', text: "You (hopefully) don't refactor code and just *hope* it still works — you have tests. A golden set is unit tests for your prompt. Change the prompt, run the suite, see the score. Green? Ship. Red? You just caught a regression that would otherwise have been a production incident and an angry Slack thread." },
      ],
    },
    {
      id: 'ab-demo',
      title: 'See it: A/B two prompts',
      blocks: [
        { type: 'p', text: 'Two classifier prompts, one shared test set. Watch the scorer grade each case and surface exactly where the weak prompt fails — the cases you\'d never catch by eyeballing.' },
        { type: 'demo', id: 'prompt-ab' },
      ],
    },
    {
      id: 'build-eval',
      title: 'Build a tiny eval harness',
      blocks: [
        { type: 'playground', id: 'eval-lab', title: 'Score two prompts', height: 400, code: `// A minimal eval harness — the seed of every serious prompt workflow.
const testSet = [
  { input: "the app won't open", expected: "bug" },
  { input: "please add dark mode", expected: "feature" },
  { input: "how do I reset my password", expected: "question" },
  { input: "you charged me twice!", expected: "billing" },
  { input: "love the redesign", expected: "praise" },
]

async function evaluate(label, systemPrompt) {
  let correct = 0
  for (const { input, expected } of testSet) {
    const raw = await llm(input, { system: systemPrompt, temperature: 0 })
    const got = raw.trim().toLowerCase().split(/\\s/)[0]
    const pass = got === expected
    if (pass) correct++
    console.log(\`  \${pass ? "✓" : "✗"} "\${input}" -> \${got} (want \${expected})\`)
  }
  const score = Math.round((correct / testSet.length) * 100)
  console.log(label + ": " + score + "%\\n")
  return score
}

console.log("=== Prompt A: zero-shot ===")
await evaluate("A", "Classify the support message.")

console.log("=== Prompt B: strict + examples ===")
await evaluate("B", "Classify as ONE of: bug, feature, question, billing, praise. Reply with only the label. 'it crashed'->bug 'add X'->feature")`, solution: `// Solution: harness that picks the winner + flags regressions.
const testSet = [
  { input: "the app won't open", expected: "bug" },
  { input: "please add dark mode", expected: "feature" },
  { input: "how do I reset my password", expected: "question" },
  { input: "you charged me twice!", expected: "billing" },
  { input: "love the redesign", expected: "praise" },
  { input: "it's been buggy since the update", expected: "bug" },
]

async function evaluate(system) {
  const results = []
  for (const { input, expected } of testSet) {
    const raw = await llm(input, { system, temperature: 0 })
    const got = raw.trim().toLowerCase().split(/\\s/)[0]
    results.push({ input, expected, got, pass: got === expected })
  }
  return { score: results.filter(r => r.pass).length / testSet.length, results }
}

const A = await evaluate("Classify the support message.")
const B = await evaluate("Classify as ONE of: bug, feature, question, billing, praise. Only the label. 'crashed'->bug")

console.log(\`A: \${Math.round(A.score*100)}%  |  B: \${Math.round(B.score*100)}%\`)
console.log("winner:", B.score > A.score ? "B" : A.score > B.score ? "A" : "tie")

// show WHERE the winner still fails — those become new golden cases
console.log("\\nB's remaining failures (mine these for improvement):")
B.results.filter(r => !r.pass).forEach(r => console.log(\`  "\${r.input}" got \${r.got}, want \${r.expected}\`))`, caption: '**Exercise:** extend the harness to declare a winner AND print the winner\'s remaining failures — because those failing cases are your next golden-set additions. Eval is a loop, not a one-shot.' },
        { type: 'callout', variant: 'tip', text: "Scorers, by task: **exact match** for closed outputs (labels, yes/no). **Contains / regex** for \"must include a citation\" or \"must be valid JSON\". **[[LLM-as-Judge]]** for open-ended quality (\"is this summary faithful and concise?\") — you prompt a model with a rubric to grade outputs, which sounds circular but works remarkably well and scales. Module 10 builds all three into a real eval system." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'What makes prompt iteration "engineering" rather than "superstition"?',
            options: [
              'Using a bigger model',
              'Measuring quality against a test set so "B is better" is a number, not a hunch — and keeping the set as a regression test',
              'Writing longer prompts',
              'Setting temperature to 0',
            ],
            answer: 1,
            explain: 'Eyeballing one output and guessing is superstition. A golden set + scorer turns iteration into measurement, and the set doubles as a regression test that catches future quality drops.',
          },
          {
            q: 'What is a golden set?',
            options: [
              'The most expensive model tier',
              'Inputs paired with known-good expected outputs, used to score prompts and models objectively',
              'A premium API key',
              'A caching layer',
            ],
            answer: 1,
            explain: 'The golden set is your test cases: representative inputs with correct expected outputs. It\'s the foundation of eval-driven prompting — start with 10-20 and grow it by mining real failures.',
          },
          {
            q: 'You\'re comparing prompt A vs B. What must stay CONSTANT for a fair test?',
            options: [
              'Nothing — vary everything',
              'The model, temperature, and test set — so the PROMPT is the only variable',
              'Only the API key',
              'The time of day',
            ],
            answer: 1,
            explain: 'Controlled experiment 101: change one variable. Same model, same temperature, same inputs — then any score difference is attributable to the prompt, not noise.',
          },
          {
            q: 'For grading open-ended output ("is this summary faithful?") with no single correct answer, use…',
            options: [
              'Exact match',
              'LLM-as-judge — prompt a model with a rubric to score the outputs',
              'Word count',
              'It can\'t be evaluated',
            ],
            answer: 1,
            explain: 'Exact match only works for closed outputs. For open-ended quality, LLM-as-judge with a clear rubric scales surprisingly well — one model grades another\'s work against defined criteria (Module 10).',
          },
          {
            q: 'After picking the winning prompt, what should you do with the test set?',
            options: [
              'Delete it — its job is done',
              'Keep it as a regression test that re-runs on every future prompt or model change',
              'Publish it publicly',
              'Only use it once',
            ],
            answer: 1,
            explain: 'The set\'s biggest value is ongoing: every prompt tweak and model upgrade re-runs it, so quality regressions get caught in CI instead of in production. Evals are permanent infrastructure, not a one-time check.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm3-l7-c1', front: 'The eval-driven prompt loop?', back: 'Build a golden set → pick a scorer → run variants (prompt as only variable) → compare scores → keep the set as a regression test.' },
          { id: 'm3-l7-c2', front: 'What is a golden set?', back: 'Inputs paired with known-good expected outputs — your prompt\'s unit tests. Start 10-20; grow by mining real failures.' },
          { id: 'm3-l7-c3', front: 'What must stay constant when A/B-ing prompts?', back: 'Model, temperature, and test set — so the prompt is the only variable and score differences are real, not noise.' },
          { id: 'm3-l7-c4', front: 'Three scorer types?', back: 'Exact match (closed outputs/labels), contains/regex (must cite / valid JSON), LLM-as-judge (open-ended quality via rubric).' },
          { id: 'm3-l7-c5', front: 'What is LLM-as-judge?', back: 'Prompting a model with a rubric to grade another model\'s outputs — scales evaluation of open-ended tasks with no single correct answer.' },
          { id: 'm3-l7-c6', front: 'Why keep the test set after choosing a prompt?', back: 'It becomes a regression test — every future prompt/model change re-runs it, catching quality drops before users do.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Measure prompts against a golden set — turn "better?" into a score.',
          'The loop: golden set → scorer → run variants → compare → keep as regression test.',
          'Hold model, temperature, and inputs constant so the prompt is the only variable.',
          'Scorers by task: exact match, contains/regex, or LLM-as-judge for open-ended quality.',
          'Evals are permanent infrastructure — the moat that catches regressions forever (Module 10).',
        ] },
        { type: 'mistakes', items: [
          { title: 'The n=1 evaluation', text: 'Changing a prompt, checking ONE output, and declaring victory. One example proves nothing given output variability. Even a 10-case set is a night-and-day upgrade over a single eyeball.' },
          { title: 'Testing only happy-path inputs', text: 'A golden set of easy cases gives a falsely high score and misses exactly the inputs that break in production. Deliberately include ambiguous, adversarial, and edge cases — that\'s where prompts differ.' },
          { title: 'Changing multiple things at once', text: 'New prompt AND new model AND new temperature — now you can\'t attribute the score change to anything. One variable per experiment, always.' },
          { title: 'Never growing the golden set', text: 'A static 15-case set from month one goes stale as the product evolves. Mine production failures continuously — every real bad output is a golden-set candidate that prevents its own recurrence.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you know if a prompt change actually improved things?"', a: 'I measure it. A golden set of representative inputs with expected outputs, an appropriate scorer (exact match / contains / LLM-as-judge), and I run old vs new prompt holding model and temperature constant. If the score goes up without regressions on existing cases, it\'s a real improvement; if not, I revert. The set stays as a regression test in CI. Iterating on prompts without evals is guessing, and it doesn\'t scale past a demo.' },
          { q: '"How would you build an eval for an open-ended task like summarization?"', a: 'Golden set of documents with reference summaries or, better, defined quality criteria. Scoring: LLM-as-judge with an explicit rubric — faithfulness (no hallucinated facts), coverage (key points included), conciseness — each scored, maybe with a reference summary for comparison. Validate the judge itself against some human ratings to check calibration. Track scores over prompt/model versions. It sounds circular to grade a model with a model, but with a clear rubric it correlates well with human judgment and scales to thousands of cases.' },
          { q: '"Why are evals considered the real moat in AI products?"', a: 'Models and prompts are increasingly commoditized; anyone can call an API. What compounds is a rich, domain-specific eval set built from real usage — it lets you adopt new models in an afternoon (run the suite, compare), catch regressions before users, and improve systematically instead of guessing. The team with the best evals ships quality improvements fastest and most safely. It\'s the AI-era equivalent of a strong test suite (Module 10 is entirely this).' },
        ] },
        { type: 'usecases', items: [
          { title: 'CI for AI', text: 'Prompt changes run the eval suite in the pipeline — a quality drop fails the build, exactly like a failing unit test. Standard practice at serious AI teams.' },
          { title: 'Model migration', text: 'When a new model ships, run YOUR evals to decide in an afternoon whether to switch — the payoff of the Lesson 1.3 "categories stable, models churn" mindset.' },
          { title: 'Prompt marketplaces & optimization', text: 'Automated prompt-optimization tools work by evaluating candidate prompts against a set — the loop you just built, automated.' },
          { title: 'Regression dashboards', text: 'Track eval scores over time; a dip flags that a model update or prompt edit degraded quality before customers complain.' },
        ] },
        { type: 'project', title: 'Your first eval harness', goal: 'Build the reusable evaluation tool you\'ll extend all the way through Module 10.', steps: [
          'Pick a task with checkable outputs (classification, extraction, or "must contain X").',
          'Build a golden set of 15 cases including 5 deliberately tricky/edge cases. Store as JSON.',
          'Write evaluate(promptVersion) that runs all cases at temperature 0 and returns a score + per-case pass/fail.',
          'Write two genuinely different prompt versions and compare them. Let the DATA pick the winner.',
          'Print the winner\'s remaining failures and add 2 of them (corrected) back into the golden set — closing the loop.',
        ], deliverable: 'eval.js + golden-set.json + a run showing A vs B scores and the winner\'s remaining failures.' },
        { type: 'challenge', title: 'Build an LLM judge', text: 'For an open-ended task (e.g., "rewrite this to be friendlier"), you can\'t use exact match. Write an LLM-as-judge: a prompt that takes an output and scores it 1-5 on a specific rubric, returning JSON. Test your judge on 3 clearly-good and 3 clearly-bad outputs — does it rank them correctly? Iterate the rubric until it does.', hints: [
          'The judge prompt IS a prompt — apply everything from this module: clear rubric (role+task+format), examples of scores, structured JSON output.',
          'Calibrate: if your judge rates obvious garbage a 4, the rubric is too lenient — tighten it.',
          'This is the exact technique powering scaled evals in Module 10; you\'re building it early.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: create strong empirical evaluations', url: 'https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests', note: 'Provider-official eval design — golden sets, graders, and grading tips.' },
          { label: 'Your AI Product Needs Evals — Hamel Husain', url: 'https://hamel.dev/blog/posts/evals/', note: 'The essay that made "evals are the moat" a rallying cry. Read it before Module 10.' },
          { label: 'promptfoo', url: 'https://www.promptfoo.dev/', note: 'An open-source prompt eval tool — see the loop you built, productized.' },
        ] },
      ],
    },
  ],
}
