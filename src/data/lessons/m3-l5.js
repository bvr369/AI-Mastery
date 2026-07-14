// Lesson 3.5 — Prompt Templates & Variables in Code

export default {
  sections: [
    {
      id: 'prompts-are-code',
      title: 'Prompts are code — treat them like it',
      blocks: [
        { type: 'p', text: "In the playground you type a prompt once. In a real app, that prompt runs a million times with different data plugged in — a user's question, today's date, their plan tier. The professional move is to stop treating prompts as strings scattered through your code and start treating them as **versioned functions with variable slots**. This lesson is the bridge from 'I can write a good prompt' to 'I can maintain prompts in a production codebase.'" },
        { type: 'diagram', id: 'prompt-template', caption: 'A template is a function: stable structure + injected runtime variables → the final prompt. One place to review, test, and roll back.' },
        { type: 'h', text: 'Why templates, not inline strings' },
        { type: 'list', items: [
          '**One source of truth.** The support prompt lives in ONE file, not concatenated across 12 call sites. Fix it once.',
          '**Versionable.** `support-v3` in git means every behavior change is a reviewable diff — and you can log which version produced any given output (Lesson 2.1 metering meets prompt ops).',
          '**Testable.** A template is a pure function: given inputs, assert the output prompt. It plugs straight into evals (Lesson 3.7).',
          '**Safe injection.** A deliberate seam for user data forces you to think about escaping and delimiting it — which is exactly where injection defense lives (next lesson).',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: SQL queries', text: "You'd never scatter raw SQL strings with user values concatenated in throughout your app — you use parameterized queries in one data layer. Prompts are the same: a template with typed variable slots, in one place, is the parameterized-query equivalent. And just like SQL, concatenating untrusted user input into the template is where injection sneaks in — hold that thought for Lesson 3.6." },
      ],
    },
    {
      id: 'build-templates',
      title: 'Building a prompt template layer',
      blocks: [
        { type: 'playground', id: 'template-lab', title: 'Prompt template functions', height: 380, code: `// A prompt template is just a function that returns a string.
function supportPrompt({ company, plan, today }) {
  return \`You are \${company}'s support assistant.
Today is \${today}. The user is on the \${plan} plan.

RULES:
- Be concise: max 4 sentences, then offer one next step.
- Mention upgrades only if the user asks about limits.
- If you can't help: "Let me connect you with a human."\`
}

// Same template, different runtime data:
const free = supportPrompt({ company: "Acme", plan: "Free", today: "2026-07-14" })
const pro  = supportPrompt({ company: "Acme", plan: "Pro",  today: "2026-07-14" })

console.log(await llm("Why is my export limited to 100 rows?", { system: free }))
console.log("\\n---\\n")
console.log(await llm("Why is my export limited to 100 rows?", { system: pro }))
// Notice: the Free vs Pro user gets different handling — same template, injected variable.`, solution: `// Solution: a versioned template registry — prompt ops in miniature.
const PROMPTS = {
  "support@v1": ({ company }) => \`You are \${company}'s bot. Answer questions.\`,
  "support@v2": ({ company, plan }) =>
    \`You are \${company}'s support assistant. User plan: \${plan}. Be concise (max 4 sentences).\`,
  "support@v3": ({ company, plan, today }) =>
    \`You are \${company}'s support assistant.
Today is \${today}. User plan: \${plan}.
RULES: concise (<=4 sentences); upgrades only if asked; escalate if stuck.\`,
}

// pick the version explicitly — and LOG it with the response (prompt ops!)
async function ask(version, vars, question) {
  const system = PROMPTS[version](vars)
  const answer = await llm(question, { system })
  console.log(\`[prompt=\${version}] \${answer.slice(0, 90)}...\`)
  return { version, answer }   // version travels with the output for debugging
}

const vars = { company: "Acme", plan: "Pro", today: "2026-07-14" }
await ask("support@v1", vars, "Why is my export limited?")
await ask("support@v3", vars, "Why is my export limited?")
// Now "which prompt produced this answer?" is always answerable —
// and A/B testing v2 vs v3 is a one-line change.`, caption: '**Exercise:** build a versioned prompt REGISTRY (support@v1, v2, v3) and an ask(version, vars, question) that logs which version ran — the foundation of prompt ops and A/B testing. Solution has it.' },
        { type: 'callout', variant: 'tip', text: "In production TypeScript, template functions take **typed** variable objects — so a missing `plan` is a compile error, not a mangled prompt with `undefined` in it. Small thing, huge payoff: template variables are a common source of silent bugs (a `{name}` that never got filled ships \"Hi {name}\" to users). Type them, and validate at the seam." },
      ],
    },
    {
      id: 'organizing',
      title: 'Organizing prompts at scale',
      blocks: [
        { type: 'list', items: [
          '**Keep prompts out of business logic.** A `prompts/` module (or directory) separate from the code that calls models. Prompts change for different reasons than logic.',
          '**Name and version them.** `summarize@v2`, `classify-ticket@v1`. The version is data you log and A/B on.',
          '**Inject, never concatenate blindly.** A clear seam for variables, with untrusted user input clearly delimited (`<user_input>…</user_input>`).',
          '**Externalize the truly dynamic parts.** Today\'s date, feature flags, retrieved context (RAG, Module 7) — computed at call time, not baked in.',
          '**Treat a prompt change like a code change.** Review, test against your eval set, deploy, monitor. "We tweaked the prompt" has caused real outages.',
        ] },
        { type: 'callout', variant: 'warn', text: "The failure this prevents: a well-meaning teammate edits a prompt string in a dashboard at 4pm Friday, subtly breaks the output format, and the parsing errors don't surface until Monday — with no diff to point to. Prompts in git, behind review, tested by evals. Behavior under version control is the whole game." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Why keep prompts as versioned template functions instead of inline strings?',
            options: [
              'It runs faster',
              'One source of truth, reviewable diffs, testable as pure functions, a safe seam for variable injection, and you can log which version produced each output',
              'The API requires it',
              'It uses fewer tokens',
            ],
            answer: 1,
            explain: 'Templates make prompts maintainable software: single source of truth, version control, testability, and prompt-version logging for debugging. Inline strings scattered everywhere are the opposite.',
          },
          {
            q: 'What does logging the prompt VERSION with each response enable?',
            options: [
              'Faster responses',
              'Answering "which prompt produced this output?" during debugging, and A/B-testing prompt versions against quality metrics',
              'Lower cost',
              'Nothing useful',
            ],
            answer: 1,
            explain: 'Prompt version + usage + output logged together = you can attribute quality (and cost) to specific prompt versions, catch regressions, and run real A/B tests. This is "prompt ops".',
          },
          {
            q: 'A template variable {plan} never got filled and "You are on the {plan} plan" shipped to users. Best prevention?',
            options: [
              'Manual review of every response',
              'Typed template inputs (missing variable = compile error) plus validation at the injection seam',
              'Higher temperature',
              'Hope it doesn\'t happen',
            ],
            answer: 1,
            explain: 'Unfilled template variables are a classic silent bug. Typed inputs catch missing variables at build time; runtime validation at the seam catches the rest. Small discipline, big payoff.',
          },
          {
            q: 'Where should prompts live in a codebase?',
            options: [
              'Concatenated inline wherever they\'re used',
              'In a dedicated prompts module/directory, separate from business logic, versioned in git',
              'Only in a production dashboard',
              'In the database, edited freely',
            ],
            answer: 1,
            explain: 'Prompts change for different reasons than logic and deserve their own reviewable, versioned home. Dashboard-only edits with no diff are how untracked behavior changes cause mystery outages.',
          },
          {
            q: 'The SQL-injection analogy for prompt templates warns that…',
            options: [
              'Prompts should use SQL syntax',
              'Concatenating untrusted user input into a template is exactly where prompt injection enters — you need a deliberate, delimited seam for user data',
              'Templates are slower than queries',
              'You should never use variables',
            ],
            answer: 1,
            explain: 'Just as raw string-concatenated SQL invites SQL injection, blindly interpolating user text into prompts invites prompt injection. The template gives you one controlled seam to delimit and defend — the whole next lesson.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm3-l5-c1', front: 'What is a prompt template?', back: 'A versioned function with variable slots: stable structure + injected runtime data → the final prompt. Prompts as maintainable code.' },
          { id: 'm3-l5-c2', front: 'Four wins of templates over inline strings?', back: 'Single source of truth, reviewable version diffs, testable pure functions, and a safe delimited seam for variable injection.' },
          { id: 'm3-l5-c3', front: 'Why log the prompt version with each response?', back: 'Attribute quality/cost to specific versions, debug "which prompt made this?", and run real A/B tests. This is prompt ops.' },
          { id: 'm3-l5-c4', front: 'How to prevent unfilled-variable bugs?', back: 'Typed template inputs (missing var = compile error) + runtime validation at the injection seam. Silent "{name}" ships are common.' },
          { id: 'm3-l5-c5', front: 'Where do prompts belong?', back: 'A dedicated prompts module, separate from business logic, versioned in git and reviewed — never dashboard-only untracked edits.' },
          { id: 'm3-l5-c6', front: 'The SQL analogy for templates?', back: 'Blindly concatenating user input into a prompt invites injection, like string-built SQL. The template gives one controlled seam to delimit and defend.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Prompts are code: versioned template functions with typed variable slots, in one place.',
          'Templates give a single source of truth, reviewable diffs, testability, and safe injection seams.',
          'Log the prompt version with every response — the foundation of prompt ops and A/B testing.',
          'Externalize dynamic parts (date, flags, retrieved context); type variables to kill silent bugs.',
          'Treat prompt changes like code changes: review, eval, deploy, monitor.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Prompt strings scattered across the codebase', text: 'The same instruction copy-pasted into 8 files drifts out of sync, and fixing "the bot\'s tone" becomes an archaeology dig. One template module, imported everywhere. DRY applies to prompts.' },
          { title: 'Editing prompts only in a dashboard', text: 'No diff, no review, no rollback, no idea who changed what when the output breaks. Convenient until the 4pm-Friday incident. Prompts belong in version control.' },
          { title: 'Blindly interpolating user input', text: '`You are a bot. User says: ${userInput}` with no delimiting is the injection door wide open (next lesson). Even before security, it causes format confusion. Delimit and treat user text as data.' },
          { title: 'Untyped, unvalidated variables', text: '`Hi ${user.name}` when name is undefined ships "Hi undefined". Type the template inputs and validate at the seam — unfilled variables are among the most common (and embarrassing) LLM app bugs.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you manage prompts in a production codebase?"', a: 'As versioned code: a prompts module with named, versioned template functions (summarize@v2) taking typed variable objects, kept separate from business logic. Every request logs its prompt version alongside usage and output, so I can attribute quality and cost, debug specific responses, and A/B test versions. Prompt changes go through code review and run against an eval suite before deploy. The goal: no behavior change to the AI that isn\'t a reviewable, testable, revertable diff.' },
          { q: '"How do you A/B test a prompt change safely?"', a: 'Keep both versions in the registry, route a percentage of traffic to each (feature flag), and log the version with every response. Compare on real metrics — quality scores from evals, task success, cost, latency, user feedback — not vibes. Because versions are logged, I can slice outcomes by version confidently. If v-new wins, ramp it; if it regresses, the flag flips back instantly with zero deploy.' },
          { q: '"What\'s the most common prompt-related bug you\'ve seen?"', a: 'Unfilled or mis-typed template variables — shipping "Hi {name}" or "You are on the undefined plan" because a variable didn\'t get passed. It\'s silent (no error, just bad output) and embarrassing. Fixes: typed template inputs so missing variables fail at compile time, plus a validation step at the injection seam. Runner-up: untracked dashboard edits causing mystery format breaks — solved by putting prompts in git.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Prompt management platforms', text: 'PromptLayer, LangSmith, Langfuse et al. exist to version, log, and A/B prompts — productizing exactly this lesson. You can hand-roll the essentials.' },
          { title: 'Multi-tenant AI SaaS', text: 'One template + per-tenant variable injection = hundreds of branded assistants from one codebase (the Lesson 2.3 pattern, now with structure).' },
          { title: 'Localized prompts', text: 'Templates with locale variables generate per-language prompts without duplicating logic — i18n for AI behavior.' },
          { title: 'RAG systems', text: 'The retrieved context is just another injected variable in the template — Module 7 slots straight into this pattern.' },
        ] },
        { type: 'project', title: 'The prompt registry', goal: 'Build the prompt-ops layer every serious AI app needs — versioned, logged, testable.', steps: [
          'Create a prompts.js module exporting a registry: { "name@version": (vars) => string }. Add 2-3 versions of one prompt.',
          'Write render(name, vars) that looks up the template, validates required variables are present (throw a clear error if not), and returns the prompt.',
          'Write a thin ask(name, vars, question) wrapper that renders, calls your Lesson 2.1 API, and logs { promptName, version, usage } to a file.',
          'Add a tiny test: assert render("support@v3", {...}) contains the expected instructions and injects variables correctly — a pure-function prompt test.',
          'Bonus: a 2-line A/B — randomly pick v2 or v3 per call, log which, so you could later compare outcomes.',
        ], deliverable: 'prompts.js + a render/ask layer + one prompt unit test + a sample log showing version tracking.' },
        { type: 'challenge', title: 'Catch the silent variable bug', text: 'Deliberately build a template with an optional variable, then write render() so that a missing REQUIRED variable throws a clear error while a missing OPTIONAL one degrades gracefully (sensible default). Test both paths. This tiny bit of rigor prevents a whole class of "why does it say undefined" production bugs.', hints: [
          'Distinguish required vs optional variables explicitly — maybe a schema object per template.',
          'Throw early with a message naming the missing variable: "support@v3 requires \'plan\'".',
          'Bonus: in TypeScript, model this with the type system so it\'s a compile error, not a runtime one.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: prompt templates & variables', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables', note: 'Provider-official templating guidance.' },
          { label: 'Langfuse prompt management', url: 'https://langfuse.com/docs/prompts/get-started', note: 'What a real prompt-ops platform provides — versioning, logging, A/B.' },
          { label: '12-Factor App: config', url: 'https://12factor.net/config', note: 'The general principle behind externalizing prompts and their dynamic parts.' },
        ] },
      ],
    },
  ],
}
