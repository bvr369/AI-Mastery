// Lesson 4.7 — Checkpoint Project: Port a JS Tool to Python

export default {
  sections: [
    {
      id: 'the-port',
      title: 'One tool, two languages',
      blocks: [
        { type: 'p', text: "Six lessons of Module 4 taught you Python's dialect one feature at a time — syntax, data structures, functions, imports, async, notebooks. This checkpoint fuses them into a single, honest test: **take a real tool you already built in JavaScript and port it to Python, end to end.** No new theory, no toy exercise — you'll rebuild `ask.js` (the CLI prompt runner from Module 2's project) as `ask.py`, and every Module 4 mapping shows up exactly once." },
        { type: 'p', text: "The tool is deliberately small so the *port* is the lesson, not the app. `ask.js` reads a question from the command line, sends it to an LLM, and prints the answer plus token usage: `node ask.js \"why is the sky blue\"`. By the end you'll run `python ask.py \"why is the sky blue\"` and get the same result — and you'll have touched venv, argument parsing, the SDK, `os.environ`, f-strings, and the `__main__` guard along the way." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: covering a song you wrote', text: "Porting a tool you already built is like covering your own song on a different instrument. You're not composing — you know the melody by heart. You're just finding where each note lives on the new fretboard. That's why porting is the fastest way to cement a language: your brain is free to notice *only* the syntax, because the logic is already yours. Every \"how do I do X in Python?\" is answered by \"well, how did I do X in JS?\"" },
        { type: 'h', text: 'The whole port on one screen' },
        { type: 'p', text: "Here's every mapping you'll make, side by side. Nothing below is conceptually new — it's the Module 4 phrasebook applied to one concrete program. Keep it open as your checklist." },
        { type: 'table', headers: ['Concern', 'JavaScript (`ask.js`)', 'Python (`ask.py`)'], rows: [
          ['Isolated dependencies', '`node_modules/` + `package.json`', '`venv` + `pip install`'],
          ['Read CLI arguments', '`process.argv.slice(2)`', '`sys.argv[1:]` or `argparse`'],
          ['Read the API key', '`process.env.ANTHROPIC_API_KEY`', '`os.environ["ANTHROPIC_API_KEY"]`'],
          ['The LLM call', '`client.messages.create({…})`', '`client.messages.create(…)`'],
          ['String interpolation', '`` `${tokens} used` ``', '`f"{tokens} used"`'],
          ['Read the response text', '`resp.content[0].text`', '`resp.content[0].text`'],
          ['Message shape', '`[{ role: "user", content }]`', '`[{"role": "user", "content": …}]`'],
          ['Entry point guard', '(file runs top-to-bottom)', '`if __name__ == "__main__":`'],
          ['Naming convention', '`maxTokens`, `readArgs`', '`max_tokens`, `read_args`'],
        ] },
        { type: 'callout', variant: 'info', text: "Notice how much of that table is *identical* — the message shape, `content[0].text`, the SDK method name. That's the Module 2 payoff: the LLM concepts are language-agnostic. The genuinely different rows are the ones about **the environment around the call** — deps, args, env vars, entry point. That's what this checkpoint drills." },
      ],
    },
    {
      id: 'setup',
      title: 'Step 1 — Project setup: node_modules becomes venv',
      blocks: [
        { type: 'p', text: "In JS you `npm init` and `npm install` drops packages into a local `node_modules/` folder — isolated per project by default. Python's equivalent isolation is the **virtual environment** ([[venv]]): a self-contained folder holding a private Python and its own installed packages, so this project's `anthropic` version can't collide with another project's. The one extra step JS doesn't have is **activating** it — flipping your shell so `python` and `pip` point *inside* the venv." },
        { type: 'code', lang: 'bash', filename: 'setup — JavaScript', code: `mkdir ask && cd ask
npm init -y                     # creates package.json
npm install @anthropic-ai/sdk   # -> installs into ./node_modules/
node ask.js "hello"`, caption: 'JS: npm isolates dependencies per project automatically — no activation step.' },
        { type: 'code', lang: 'bash', filename: 'setup — Python', code: `mkdir ask && cd ask
python3 -m venv .venv           # create the isolated environment (a folder)
source .venv/bin/activate       # ACTIVATE it (Windows: .venv\\Scripts\\activate)
pip install anthropic           # -> installs INTO .venv, not globally
python ask.py "hello"`, caption: 'Python: create the venv, ACTIVATE it, then pip install lands inside it. The activate line is the only concept JS has no twin for.' },
        { type: 'callout', variant: 'analogy', title: 'Analogy: venv is a clean workbench per project', text: "Global `pip install` is dumping every project's tools into one shared garage — eventually two projects need different wrench sizes and you're stuck. A venv is wheeling in a fresh workbench for *this* job, stocking only the tools it needs, and rolling it away when you're done. `activate` is stepping up to that bench; `deactivate` steps back to the global one. `node_modules` gives you this for free; in Python it's a deliberate, healthy habit." },
        { type: 'callout', variant: 'tip', title: 'Your prompt tells you it worked', text: "After `activate`, your shell prompt gets a `(.venv)` prefix — that's your confirmation the environment is live. Forget to activate and `pip install anthropic` installs globally (or fails), then `python ask.py` can't find the package. If you hit `ModuleNotFoundError: No module named 'anthropic'`, the fix is almost always \"you forgot to activate the venv.\" Add `.venv/` to `.gitignore`, exactly like `node_modules/`." },
      ],
    },
    {
      id: 'args',
      title: 'Step 2 — Reading the prompt from the command line',
      blocks: [
        { type: 'p', text: "The tool's input is a question typed after the command. In Node that lives in `process.argv` — an array where index 0 is the node binary, index 1 is your script, and the *actual* args start at index 2. Python's literal mirror is `sys.argv`, with the same structure minus the node entry: index 0 is the script, real args from index 1." },
        { type: 'code', lang: 'javascript', filename: 'args — JavaScript', code: `// process.argv = ["node", "ask.js", "why", "is", "sky", "blue"]
const prompt = process.argv.slice(2).join(" ")

if (!prompt) {
  console.error('Usage: node ask.js "your question"')
  process.exit(1)
}`, caption: 'JS: slice(2) drops node + script name; join the rest into one prompt string.' },
        { type: 'code', lang: 'python', filename: 'args — Python (the literal mirror)', code: `import sys
# sys.argv = ["ask.py", "why", "is", "sky", "blue"]
args = sys.argv[1:]              # [1:] drops the script name (like slice(2) minus node)

if not args:                    # empty list is falsy — no len() needed
    sys.exit('Usage: python ask.py "your question"')

prompt = " ".join(args)         # str.join joins a list, same idea as Array.join`, caption: 'Python: sys.argv[1:] is the direct twin of process.argv.slice(2). Note snake_case, the colon+indent block, and `if not args:` using empty-list falsiness.' },
        { type: 'p', text: "`sys.argv` works and is the honest 1:1 port. But Python ships something better for anything beyond a single argument: **[[argparse]]**, the standard-library flag parser. It gives you named options (`--max`), type coercion, validation, and a `--help` screen *for free* — the moment your tool grows a second knob, reach for it. The Node equivalent would be pulling in `yargs` or `commander`; in Python it's built in." },
        { type: 'code', lang: 'python', filename: 'args — Python (the idiomatic upgrade)', code: `import argparse

parser = argparse.ArgumentParser(description="Ask an LLM from the terminal.")
parser.add_argument("prompt", help="the question to ask")
parser.add_argument("--max", type=int, default=300, help="max output tokens")
args = parser.parse_args()      # parses sys.argv for you; exits with --help if asked

# now: args.prompt (a string) and args.max (an int) — parsed and validated
print(args.prompt, args.max)`, caption: 'argparse: positional `prompt` + a typed `--max` flag, with --help generated automatically. This is the version the finished ask.py uses.' },
        { type: 'callout', variant: 'info', title: 'positional vs optional, in one glance', text: "`add_argument(\"prompt\")` (no dashes) is **positional** — required, taken by order, like `process.argv[2]`. `add_argument(\"--max\")` (dashes) is **optional** — a named flag with a default. Same distinction as a function's required parameter vs. an options object with defaults. argparse then hangs both off the returned `args` object as `args.prompt` and `args.max`." },
      ],
    },
    {
      id: 'the-call',
      title: 'Step 3 — The SDK call, the key, and the output',
      blocks: [
        { type: 'p', text: "Now the heart of the tool. Three things happen: read the API key from the environment, call the model, print the answer and its token usage. Every one has a clean JS↔Python mapping, and the LLM call itself is nearly character-identical because the message shape is the same one you learned in Module 2." },
        { type: 'h', text: 'The key: process.env becomes os.environ' },
        { type: 'p', text: "The secret never goes in the file (Lesson 2.1's rule survives the port). In Node you read `process.env.ANTHROPIC_API_KEY`; in Python it's `os.environ[\"ANTHROPIC_API_KEY\"]` — a dict lookup. Better still, the Anthropic SDK reads that exact variable *automatically*, so `Anthropic()` with no arguments just works, same as the JS client." },
        { type: 'code', lang: 'javascript', filename: 'the call — JavaScript', code: `import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()   // reads process.env.ANTHROPIC_API_KEY

const resp = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 300,
  messages: [{ role: "user", content: prompt }],
})

const answer = resp.content[0].text
console.log(answer)
console.log(\`\\n[usage] \${resp.usage.input_tokens} in / \${resp.usage.output_tokens} out\`)`, caption: 'JS: new Anthropic() reads the env var; messages.create with the familiar message array; usage on the response.' },
        { type: 'code', lang: 'python', filename: 'the call — Python', code: `import os
import sys
from anthropic import Anthropic

if not os.environ.get("ANTHROPIC_API_KEY"):
    sys.exit("Set ANTHROPIC_API_KEY first (export ANTHROPIC_API_KEY=sk-...).")

client = Anthropic()             # reads os.environ["ANTHROPIC_API_KEY"] for you

resp = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=300,
    messages=[{"role": "user", "content": prompt}],   # dict keys are QUOTED strings
)

answer = resp.content[0].text                          # content is an array, same as Module 2
print(answer)
print(f"\\n[usage] {resp.usage.input_tokens} in / {resp.usage.output_tokens} out")`, caption: 'Python: os.environ dict lookup, Anthropic() auto-reads the key, messages.create with a quoted-key dict, f-string for the usage line. content[0].text is byte-for-byte identical.' },
        { type: 'callout', variant: 'warn', title: 'The dict-key gotcha that bites every JS dev', text: "In a JS object literal, `{ role: \"user\" }` — bare, unquoted keys. In a Python dict, keys are **real values**, so string keys need quotes: `{\"role\": \"user\"}`. Write `{role: \"user\"}` in Python and you get `NameError: name 'role' is not defined`, because Python thinks `role` is a variable. This single difference trips up almost everyone porting message arrays. Quote your keys." },
        { type: 'h', text: 'The playground: run the JS original against the sandbox model' },
        { type: 'p', text: "The course sandbox runs JavaScript, so here's the JS side of the port running for real against the simulated `llm()`. It mirrors `ask.js` exactly — simulate the argv, parse the prompt, call the model, print the answer and an illustrative token estimate. Run it, then read the finished `ask.py` underneath and check it line-against-line." },
        { type: 'playground', id: 'ask-runner', title: 'ask.js running (the JS side of the port)', height: 460, lang: 'javascript', code: `// ask.js — the JS tool we're porting. Runs against the sandbox's llm().
// A real CLI reads process.argv; here we simulate that array so it runs in-browser.
const argv = ["node", "ask.js", "Explain what a REST API is in one sentence."]

// --- Step 2: parse args  (mirrors process.argv.slice(2)) ---
const args = argv.slice(2)
if (args.length === 0) {
  console.log('Usage: node ask.js "your question"')
} else {
  const prompt = args.join(" ")

  // --- Step 3: the LLM call ---
  const answer = await llm(prompt, {
    system: "You are a concise assistant. Answer in one sentence.",
  })

  // --- Step 3: output + an illustrative token estimate (~4 chars/token) ---
  const estTokens = (s) => Math.ceil(s.length / 4)
  console.log("Q:", prompt)
  console.log("A:", answer)
  console.log(\`\\n[usage] ~\${estTokens(prompt)} in / ~\${estTokens(answer)} out tokens\`)
}`, solution: `// Solution: wrap the call in error handling and add a "--max" style flag,
// exactly the hardening the finished ask.py does.
const argv = ["node", "ask.js", "--max", "80", "Explain what a REST API is in one sentence."]

let raw = argv.slice(2)

// pull out an optional --max flag (argparse does this for you in Python)
let maxTokens = 300
const flagIdx = raw.indexOf("--max")
if (flagIdx !== -1) {
  maxTokens = Number(raw[flagIdx + 1])
  raw = raw.filter((_, i) => i !== flagIdx && i !== flagIdx + 1)
}

const prompt = raw.join(" ")
if (!prompt) {
  console.log('Usage: node ask.js [--max N] "your question"')
} else {
  try {
    const answer = await llm(prompt, {
      system: \`You are a concise assistant. Answer in one sentence. Budget: \${maxTokens} tokens.\`,
    })
    const estTokens = (s) => Math.ceil(s.length / 4)
    console.log("A:", answer)
    console.log(\`\\n[usage] ~\${estTokens(prompt)} in / ~\${estTokens(answer)} out (max \${maxTokens})\`)
  } catch (err) {
    console.error("Request failed:", err.message)
  }
}
// The Python port of THIS is argparse's --max flag + a try/except around
// client.messages.create — same two upgrades, snake_case spelling.`, caption: '**Exercise:** the base tool has no error handling and no flags. In the Solution, add a `--max` flag (parsed by hand here; `argparse` does it in Python) and wrap the call in try/catch. Then map each change to its Python twin: `--max` -> `parser.add_argument("--max")`, `try/catch` -> `try/except`.' },
        { type: 'callout', variant: 'tip', text: "That token estimate (`length / 4`) is a rough illustration — the real `resp.usage` numbers come back on the response object in both languages (`resp.usage.input_tokens`). The playground's `llm()` returns just text, so we approximate; your real `ask.py` reads the exact counts off `resp.usage`, same as `ask.js`." },
        { type: 'h', text: 'The finished ask.py, assembled' },
        { type: 'p', text: "Here's the whole port in one file: argparse for input, the env-var guard, the SDK call wrapped in error handling, f-string output, and the `if __name__ == \"__main__\"` guard so the tool is both runnable *and* importable. This is the deliverable — read it top to bottom and match every line to its `ask.js` origin." },
        { type: 'code', lang: 'python', filename: 'ask.py — the complete port', code: `# ask.py — a CLI prompt runner. Usage: python ask.py "your question"
import argparse
import os
import sys
from anthropic import Anthropic


def main():
    parser = argparse.ArgumentParser(description="Ask an LLM from the terminal.")
    parser.add_argument("prompt", help="the question to ask")
    parser.add_argument("--max", type=int, default=300, help="max output tokens")
    args = parser.parse_args()

    # Key from the environment, never hardcoded (Lesson 2.1 survives the port).
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("Set ANTHROPIC_API_KEY first (export ANTHROPIC_API_KEY=sk-...).")

    client = Anthropic()   # auto-reads ANTHROPIC_API_KEY

    try:
        resp = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=args.max,
            messages=[{"role": "user", "content": args.prompt}],
        )
    except Exception as err:                       # network / auth / rate-limit
        sys.exit(f"Request failed: {err}")

    answer = resp.content[0].text                  # content is an array, again
    usage = resp.usage

    print(answer)
    print(f"\\n[usage] {usage.input_tokens} in / {usage.output_tokens} out tokens")


if __name__ == "__main__":                         # runs only when executed directly
    main()`, caption: 'The full port: argparse, env-var key, try/except, f-string usage, __main__ guard. Every Module 4 lesson, in 30 lines. Run it: `python ask.py "why is the sky blue"`.' },
        { type: 'callout', variant: 'info', title: 'Why wrap it in main() + the guard', text: "Putting the logic in `def main()` and calling it under `if __name__ == \"__main__\":` means the file is a **runnable script** when you `python ask.py` *and* an **importable module** when another file does `from ask import main`. JS modules give you this split via named exports; Python's idiom is this one-line guard (Lesson 4.3). It's the mark of a script written by someone who knows the conventions." },
      ],
    },
    {
      id: 'quiz',
      title: 'Checkpoint quiz — the whole port',
      blocks: [
        { type: 'p', text: "Five questions that walk the port end to end. These are the exact JS->Python translation calls a reviewer (or interviewer) checks you can make without hesitating." },
        { type: 'quiz', questions: [
          {
            q: 'You cloned your ask.py project onto a new laptop, ran `python ask.py "hi"`, and got `ModuleNotFoundError: No module named \'anthropic\'`. Most likely fix?',
            options: [
              'Reinstall Python from scratch',
              'Create and ACTIVATE the venv, then `pip install anthropic` — the package installs into the venv, and you either skipped activation or the venv isn\'t rebuilt on this machine',
              'Rename the file to ask.js',
              'Add `import anthropic` at the top — it wasn\'t imported',
            ],
            answer: 1,
            explain: 'venv is per-machine and not committed (like node_modules). On a fresh clone you recreate it: `python3 -m venv .venv`, activate, `pip install anthropic`. The classic cause of this error is an unactivated or unbuilt venv — the package simply isn\'t on the path Python is searching.',
          },
          {
            q: 'In ask.js you read the prompt with `process.argv.slice(2).join(" ")`. What is the minimal, correct Python equivalent using `sys`?',
            options: [
              '`sys.argv.slice(2).join(" ")` — same methods',
              '`" ".join(sys.argv[1:])` — [1:] drops the script name, and join is a string method called ON the separator',
              '`sys.argv[2:].join(" ")`',
              '`process.argv[1:]` — Python keeps process.argv',
            ],
            answer: 1,
            explain: 'Python has no `node` entry in argv, so real args start at index 1, not 2 — hence `sys.argv[1:]`. And `join` is a *string* method: you call it on the separator (`" ".join(list)`), the inverse of JS\'s `array.join(sep)`. Lists have no `.slice()`; slicing is the `[1:]` syntax.',
          },
          {
            q: 'Porting the messages array, a JS dev writes `messages=[{role: "user", content: prompt}]` in Python and gets `NameError: name \'role\' is not defined`. Why?',
            options: [
              'Python doesn\'t support message arrays',
              'Python dict keys are real values — string keys must be quoted: `{"role": "user", "content": prompt}`. Bare `role` is read as an undefined variable',
              'The `prompt` variable must be in quotes too',
              'You must use a tuple, not a dict',
            ],
            answer: 1,
            explain: 'JS object literals allow bare keys (`{ role: ... }`); Python dict keys are expressions, so an unquoted `role` is treated as a variable name and fails. Quote string keys: `{"role": "user", "content": prompt}`. This is the single most common bug when porting message arrays from JS.',
          },
          {
            q: 'Why does the finished ask.py wrap its logic in `def main()` and call it under `if __name__ == "__main__":`?',
            options: [
              'Python requires every file to have a main() function',
              'So the file works both ways: run directly (`python ask.py`) the guard is true and main() runs; imported elsewhere (`from ask import main`) the guard is false so it does NOT auto-run — one file is both script and library',
              'It makes the script run faster',
              'It\'s the only way to read sys.argv',
            ],
            answer: 1,
            explain: '`__name__` is `"__main__"` only when the file is the entry point you executed. The guard runs `main()` in that case but stays quiet on import, letting the same file be a runnable CLI and an importable module. Without it, importing ask.py to reuse a function would fire the whole tool as a side effect (Lesson 4.3).',
          },
          {
            q: 'The API key line ports from `process.env.ANTHROPIC_API_KEY` to what — and where should it live?',
            options: [
              '`os.environ["ANTHROPIC_API_KEY"]` (a dict lookup); the key lives in an environment variable, never in the file — and `Anthropic()` reads it automatically',
              '`os.env.ANTHROPIC_API_KEY`; hardcode it at the top of ask.py for convenience',
              '`process.env["ANTHROPIC_API_KEY"]`; Python keeps process.env',
              '`sys.getenv(...)`; store it in the git repo',
            ],
            answer: 0,
            explain: 'Node\'s `process.env.X` becomes Python\'s `os.environ["X"]` — a dict access (or `os.environ.get("X")` to avoid a KeyError). The Lesson 2.1 rule ports unchanged: secrets live in env vars, never in source or git. Bonus: the Anthropic SDK auto-reads ANTHROPIC_API_KEY, so `Anthropic()` needs no arguments.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l7-c1', front: 'JS `node_modules` -> Python equivalent?', back: 'A virtual environment (venv): `python3 -m venv .venv`, then `source .venv/bin/activate`, then `pip install`. The extra step JS lacks is ACTIVATING it. Add `.venv/` to `.gitignore` like `node_modules/`.' },
          { id: 'm4-l7-c2', front: 'Port `process.argv.slice(2).join(" ")`?', back: '`" ".join(sys.argv[1:])`. Args start at index 1 (no `node` entry), and `join` is a string method called on the separator. For flags, prefer `argparse` (built-in; gives --help and typing for free).' },
          { id: 'm4-l7-c3', front: 'Port `process.env.ANTHROPIC_API_KEY`?', back: '`os.environ["ANTHROPIC_API_KEY"]` (dict lookup) or `os.environ.get(...)` to avoid a KeyError. Secret stays in an env var, never in the file. The SDK\'s `Anthropic()` reads it automatically.' },
          { id: 'm4-l7-c4', front: 'The LLM call, JS vs Python?', back: 'Nearly identical: `client.messages.create(model=..., max_tokens=..., messages=[{"role":"user","content":...}])`, text at `resp.content[0].text`, tokens at `resp.usage`. The concepts are language-agnostic (Module 2).' },
          { id: 'm4-l7-c5', front: 'The dict-key gotcha when porting messages?', back: 'Python dict keys must be quoted: `{"role": "user"}`, not JS\'s bare `{role: "user"}`. Unquoted keys are read as variables -> `NameError`. The #1 porting bug.' },
          { id: 'm4-l7-c6', front: 'Make one Python file both script and library?', back: 'Put logic in `def main()` and call it under `if __name__ == "__main__": main()`. Runs when executed directly; stays silent on import. Plus: snake_case names, f-strings for output.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Module 4 checkpoint — you can port to Python now',
      blocks: [
        { type: 'summary', points: [
          'Porting a tool you already own is the fastest way to cement a language — the logic is yours, so you notice only the syntax.',
          'The environment-around-the-call is what actually differs: venv (activate it!), sys.argv/argparse, os.environ, the __main__ guard.',
          'The LLM call itself is nearly identical across languages — message shape, content[0].text, and usage all transfer 1:1 from Module 2.',
          'Watch the two classic porting bugs: unquoted dict keys (NameError) and an unactivated venv (ModuleNotFoundError).',
          'The finished ask.py is a real, reusable CLI: argparse input, env-var key, try/except, f-string output, __main__ guard — every Module 4 lesson in 30 lines.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Forgetting to activate the venv', text: 'You `pip install anthropic`, it "works," then `python ask.py` throws ModuleNotFoundError — because pip installed globally while your script ran in a different context, or the venv was never activated. The `(.venv)` prompt prefix is your proof it\'s live. No prefix, no venv.' },
          { title: 'Bare dict keys, JS-style', text: 'Muscle memory types `{role: "user", content: prompt}`. Python reads `role` as an undefined variable and throws NameError. Every string key in a Python dict needs quotes: `{"role": "user"}`. This is the #1 bug when porting message arrays.' },
          { title: 'Reaching for .slice() and array .join()', text: 'Lists have no `.slice()` — you slice with `sys.argv[1:]`. And `join` is a *string* method on the separator: `" ".join(args)`, not `args.join(" ")`. Two tiny inversions that error instantly if you port them literally.' },
          { title: 'Hardcoding the key "just for testing"', text: 'The Lesson 2.1 rule doesn\'t relax because it\'s Python. `os.environ["ANTHROPIC_API_KEY"]`, never a string literal in the file — test keys get committed and scraped exactly like production ones. Guard for it and exit cleanly if it\'s missing.' },
        ] },
        { type: 'interview', items: [
          { q: '"You know JS — how would you port a small Node CLI to Python?"', a: 'I\'d map it piece by piece against a mental phrasebook. Dependencies: `node_modules` becomes a venv I create and activate, deps via pip. Input: `process.argv.slice(2)` becomes `sys.argv[1:]`, or argparse if there are flags — it\'s the stdlib\'s yargs. Secrets: `process.env.X` becomes `os.environ["X"]`, still env-only. The core logic ports almost verbatim because the concepts are the same; I mostly change spelling (snake_case, f-strings, quoted dict keys) and wrap the entry point in `if __name__ == "__main__":`. The risk areas are environment setup and the JS-isms that error silently, like unquoted dict keys.' },
          { q: '"What actually changes when you move an LLM call from JS to the Python SDK?"', a: 'Strikingly little. The request is the same object: model, max_tokens, and a messages array of `{role, content}` dicts. In JS I call `client.messages.create({...})`; in Python it\'s `client.messages.create(...)` with keyword args, text at `resp.content[0].text`, tokens at `resp.usage` — all identical. Both SDKs auto-read the API key from the env var. So the LLM layer is basically a copy-paste with quoted keys; the real porting work is the surrounding CLI plumbing, not the model call.' },
          { q: '"Why is porting a good way to learn a language versus building something new?"', a: 'Because it isolates the variable you\'re trying to learn. When you build something new you\'re fighting two problems at once — the design *and* the unfamiliar syntax. When you port, the design is already solved and proven; your entire attention goes to "how is this expressed in the new language?" You get immediate right/wrong feedback by comparing against a working original, and you cover a broad surface of the language fast because a real tool touches args, env, deps, I/O, and control flow. It\'s deliberate practice with a built-in answer key.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Rewriting internal tools for the AI stack', text: 'Teams constantly reimplement a working Node script in Python so it can sit next to their data/ML code — a batch prompt runner, a dataset labeler, an eval harness. This exact port is that task in miniature.' },
          { title: 'Reading and adapting SDK examples', text: 'Anthropic and OpenAI ship Python examples first. Being fluent in the JS<->Python mapping means you can read a Python cookbook snippet and drop its logic straight into your stack, in either language.' },
          { title: 'CLI utilities for ML workflows', text: 'argparse-based scripts — `python train.py --epochs 3`, `python eval.py --model claude-sonnet-5` — are the daily interface to ML pipelines. The argparse pattern you just learned is how every one of them reads its flags.' },
          { title: 'Onboarding to a Python codebase', text: 'Joining an AI team as a JS dev, your first week is reading Python. A tool you\'ve personally ported turns "unfamiliar syntax" into "oh, that\'s just sys.argv and a dict" — the fastest possible ramp.' },
        ] },
        { type: 'project', title: 'The checkpoint — port ask.js to ask.py for real', goal: 'Ship a working `ask.py` on your own machine that answers questions from the terminal, mirroring your Module 2 ask.js. This is the Module 4 capstone.', steps: [
          'Set up the project: `mkdir ask && cd ask`, create a venv (`python3 -m venv .venv`), ACTIVATE it (you should see `(.venv)`), and `pip install anthropic`. Add `.venv/` to `.gitignore`.',
          'Wire up input with argparse: a positional `prompt` argument and an optional `--max` flag (`type=int, default=300`). Confirm `python ask.py --help` prints the auto-generated usage.',
          'Read the key from `os.environ` (exit cleanly if it\'s missing), create `Anthropic()`, and call `client.messages.create(...)` with the model, `max_tokens=args.max`, and a quoted-key messages dict.',
          'Print the answer via `resp.content[0].text`, then an f-string usage line from `resp.usage.input_tokens` / `output_tokens`. Wrap the call in `try/except` that exits with a readable error.',
          'Wrap it all in `def main()` under `if __name__ == "__main__":`, then run it for real: `python ask.py "why is the sky blue"`. Compare output side-by-side with your original ask.js.',
        ], deliverable: 'An `ask.py` in a git repo (key NOT committed, `.venv/` gitignored) with a README showing an example run and a short table of the JS->Python mappings you made.' },
        { type: 'challenge', title: 'Add a --stream flag', text: 'Real prompt runners stream. Add a `--stream` flag to ask.py that, when set, uses the SDK\'s streaming API instead of the one-shot call — printing tokens as they arrive, exactly like your Module 2 streaming work but in Python. Then note what maps 1:1 to the JS streaming you already know and what\'s genuinely Python-specific (the `with` context manager).', hints: [
          'The Anthropic SDK streams via a context manager: `with client.messages.stream(model=..., max_tokens=..., messages=[...]) as stream:` then `for text in stream.text_stream:` and `print(text, end="", flush=True)`.',
          'Branch on `args.stream`: if set, run the streaming path; otherwise the existing `messages.create` path. `parser.add_argument("--stream", action="store_true")` makes it a boolean flag (present = True).',
          'The `with ... as` block is Python\'s answer to a resource you must clean up — like a `try/finally` that auto-closes the stream. There\'s no exact JS keyword twin, so this is the one genuinely new idiom to learn.',
        ] },
        { type: 'reading', links: [
          { label: 'Python argparse tutorial (official)', url: 'https://docs.python.org/3/howto/argparse.html', note: 'The canonical, gentle walkthrough of positional args, optional flags, types, and --help. Everything ask.py\'s CLI uses.' },
          { label: 'Anthropic Python SDK (GitHub)', url: 'https://github.com/anthropics/anthropic-sdk-python', note: 'The SDK you pip install: `Anthropic()`, `messages.create`, streaming, and how it auto-reads ANTHROPIC_API_KEY. Read the README examples.' },
          { label: 'Python for JavaScript Developers (Real Python)', url: 'https://realpython.com/python-vs-javascript/', note: 'A direct side-by-side of the two languages for exactly your background — the phrasebook behind this whole port.' },
        ] },
      ],
    },
  ],
}
