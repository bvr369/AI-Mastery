// Lesson 4.1 — Python Syntax: A JS-to-Python Phrasebook

export default {
  sections: [
    {
      id: 'why-python',
      title: 'You already know ~80% of Python',
      blocks: [
        { type: 'p', text: "Here's the reassuring truth before we start: **Python is JavaScript with different spelling and no braces.** Variables, functions, loops, conditionals, arrays, objects — same concepts, same mental model you already own from two years of React. What changes is *surface syntax*: `{}` becomes indentation, `console.log` becomes `print`, `null` becomes `None`. You're not learning to program again. You're learning a second dialect of a language you're already fluent in." },
        { type: 'p', text: "So why bother? Not because Python is \"better\" — it isn't, and anyone who says so is selling something. It's because **the entire AI ecosystem lives in Python.** [[NumPy]] and [[pandas]] for data, [[PyTorch]] for models, Jupyter notebooks for experiments, and the *official* first-party SDKs from Anthropic and OpenAI ship in Python first. You can call an LLM from JS all day (you did in Module 2), but the moment you want to fine-tune, wrangle a dataset, or read a research repo, you're in Python. This lesson is your on-ramp." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: American vs British English', text: "You speak English. Now you're reading a British novel: *lift* not *elevator*, *boot* not *trunk*, *colour* not *color*. You don't need a new brain — you need a phrasebook and a few hours of exposure. Python is that. `elif` not `else if`, `True` not `true`, `#` not `//`. The grammar rhymes; only the vocabulary shifted. That's this whole lesson." },
        { type: 'callout', variant: 'info', title: 'What we are NOT doing', text: "We are **not** teaching you to program — you already can. We're mapping what you know onto Python's spelling so you can read AI code without friction. Deep Python (classes, decorators, async, the standard library) comes as you need it in later modules. Today is fluency in the basics." },
      ],
    },
    {
      id: 'running-python',
      title: 'Running Python: the REPL and the file',
      blocks: [
        { type: 'p', text: "You have two ways to run Python, and they mirror tools you already use in JS. The **REPL** is Python's interactive shell — type `python` (or `python3`) in your terminal and you get a `>>>` prompt where every line runs instantly. It's exactly the browser console or Node's REPL: perfect for poking at an idea, checking what a function returns, doing quick math. Type `exit()` or Ctrl-D to leave." },
        { type: 'code', lang: 'bash', filename: 'terminal', code: `$ python3
Python 3.12.2 (main, Feb  2 2024)
>>> 2 + 2
4
>>> name = "Ada"
>>> print(f"Hello, {name}")
Hello, Ada
>>> exit()`, caption: 'The REPL: instant feedback, one expression at a time. Just like the Node/browser console.' },
        { type: 'p', text: "The second way is running a **file**: put your code in `script.py` and run `python script.py` from the terminal. That's the exact analog of `node app.js`. Files are for anything real — programs, scripts, the utilities you'll actually keep. There's no build step, no bundler, no `package.json` required to start: Python runs the source directly, top to bottom." },
        { type: 'table', headers: ['You know (JS/Node)', 'Python equivalent', 'What it does'], rows: [
          ['Browser / Node console', '`python3` (the REPL)', 'Interactive line-by-line experimentation'],
          ['`node app.js`', '`python app.js`', 'Run a whole file top-to-bottom'],
          ['`.js` extension', '`.py` extension', 'Source file'],
          ['`npm install pkg`', '`pip install pkg`', 'Install a third-party package'],
        ] },
        { type: 'callout', variant: 'tip', text: "On many systems `python` still points at ancient Python 2. Use `python3` and `pip3` explicitly until you've confirmed `python --version` shows 3.x. Every AI library requires Python 3 — Python 2 has been dead since 2020." },
      ],
    },
    {
      id: 'the-map',
      title: 'The phrasebook, at a glance',
      blocks: [
        { type: 'p', text: "Before we go piece by piece, here's the whole translation on one screen. Skim it, feel how much is *just spelling*, and keep it open in a mental tab. Almost every line of Python you'll read in the AI modules is some combination of the rows below." },
        { type: 'diagram', id: 'js-py-map', caption: 'The JS→Python map. Notice how much is cosmetic — the concepts are identical; the punctuation moved.' },
        { type: 'callout', variant: 'analogy', title: 'The one that trips everyone up', text: "If exactly one thing on that map surprises you, it's this: **Python has no curly braces for blocks.** Where JS uses `{ ... }` to say \"this code belongs to the `if`,\" Python uses *indentation* — the whitespace IS the syntax. That's the next section, and it's the single biggest visual adjustment. Everything else is find-and-replace." },
      ],
    },
    {
      id: 'blocks-and-vars',
      title: 'The two big shocks: indentation and variables',
      blocks: [
        { type: 'h', text: 'Shock #1 — indentation replaces braces' },
        { type: 'p', text: "In JS, whitespace is decoration — the compiler ignores it and `{}` marks where a block starts and ends. In Python, **whitespace is structure.** A `:` opens a block, and everything indented under it (the convention is **4 spaces**) is inside that block. Dedent, and you've left it. There are no braces and no semicolons. It feels alarming for about an hour, then it feels like your JS was just formatted this way anyway." },
        { type: 'code', lang: 'javascript', filename: 'blocks.js', code: `// JavaScript: braces mark the block
function greet(name) {
  if (name) {
    console.log("Hi " + name);
  } else {
    console.log("Hi stranger");
  }
}`, caption: 'JS: the { } tell you where the block lives; indentation is just style.' },
        { type: 'code', lang: 'python', filename: 'blocks.py', code: `# Python: the colon + indentation ARE the block
def greet(name):
    if name:
        print("Hi " + name)
    else:
        print("Hi stranger")`, caption: 'Python: colon opens the block, 4-space indent defines it, dedent closes it. No braces, no semicolons.' },
        { type: 'callout', variant: 'warn', title: 'IndentationError is real', text: "Because indentation is syntax, mixing tabs and spaces or misaligning a line is a *syntax error*, not a style nit. Set your editor to insert **4 spaces** when you press Tab (every editor does this; it's the Python default). Consistency isn't optional here — it's the grammar." },
        { type: 'h', text: 'Shock #2 — no const/let, dynamic typing, snake_case' },
        { type: 'p', text: "Declaring a variable in Python is just `name = value`. No `const`, no `let`, no `var` — you assign, and the name exists. Like JS, it's **dynamically typed**: a variable can hold a string now and a number later, and the type rides with the *value*, not the name. The naming convention flips, though: JS loves `camelCase`; Python's community standard (PEP 8) is `snake_case` for variables and functions, `UPPER_CASE` for constants-by-convention." },
        { type: 'code', lang: 'python', filename: 'vars.py', code: `# No keyword — assignment declares the variable
user_name = "Ada"          # snake_case, not camelCase
retry_count = 3
is_active = True           # capital T!

MAX_TOKENS = 1000          # UPPER_CASE = "please don't reassign this"

# Dynamic typing, exactly like JS:
value = "hello"            # a string...
value = 42                 # ...now a number. Python shrugs.`, caption: 'Assignment IS declaration. snake_case is the convention. Types live with values, like JS.' },
        { type: 'callout', variant: 'info', title: 'There is no true const', text: "Python has no real `const`. `UPPER_CASE` is a *convention* meaning \"treat this as constant\" — the language won't stop you reassigning it. It's a gentleman's agreement, like naming a React ref you promise not to mutate. Discipline, not enforcement." },
      ],
    },
    {
      id: 'translator',
      title: 'The phrasebook in action',
      blocks: [
        { type: 'p', text: "Time for the centerpiece. Type any JS snippet you'd write on autopilot — a `console.log`, a template literal, a truthiness check — and watch it translate to idiomatic Python, line by line. This is the tool to *play* with: the fastest way to internalize the mapping is to translate things you already know by heart." },
        { type: 'demo', id: 'js-py-translator' },
        { type: 'h', text: 'The rows that matter most for AI code' },
        { type: 'p', text: "A few translations you'll hit constantly. **`print()` vs `console.log()`**: same job, shorter name. **f-strings vs template literals**: JS writes `` `Hi ${name}` ``; Python writes `f\"Hi {name}\"` — an `f` before the quote, and `{}` instead of `${}`. **`None` vs `null`/`undefined`**: Python has *one* empty value, `None`, where JS has two. And the boolean operators are English words: `and`/`or`/`not` instead of `&&`/`||`/`!`." },
        { type: 'table', headers: ['JavaScript', 'Python', 'Note'], rows: [
          ['`console.log(x)`', '`print(x)`', 'Same job, shorter name'],
          ['`` `Hi ${name}` ``', '`f"Hi {name}"`', 'f-string: note the leading `f`'],
          ['`null` / `undefined`', '`None`', 'Python has ONE empty value, not two'],
          ['`true` / `false`', '`True` / `False`', 'Capitalized!'],
          ['`&&` `||` `!`', '`and` `or` `not`', 'English words, not symbols'],
          ['`===` / `!==`', '`==` / `!=`', 'Python `==` already compares by value'],
          ['`//` comment', '`#` comment', 'Hash, not double-slash'],
          ['`arr.length`', '`len(arr)`', 'A function, not a property'],
        ] },
        { type: 'callout', variant: 'warn', title: '=== has no Python equivalent (and doesn\'t need one)', text: "JS has `==` (coercing, cursed) and `===` (strict). Python only has `==`, and it behaves like a sane `===` — it compares values without JavaScript's coercion madness. So `1 == \"1\"` is `False` in Python, no `===` required. One fewer footgun to carry over." },
        { type: 'callout', variant: 'info', title: 'Truthiness: familiar, with a twist', text: "Python has truthiness just like JS. Falsy values: `None`, `False`, `0`, `0.0`, `\"\"` (empty string), `[]` (empty list), `{}` (empty dict). The big upgrade over JS: **empty collections are falsy**, so `if items:` means \"if the list has anything in it\" — no `items.length > 0` needed. That idiom is everywhere in Python." },
      ],
    },
    {
      id: 'playground',
      title: 'Run it side-by-side',
      blocks: [
        { type: 'p', text: "The course sandbox runs **JavaScript**, so here's the honest move: the playground below runs a tiny algorithm in JS and *prints the equivalent Python beside it* as text, so you can eyeball the diff line by line. Then the read-only `code` block underneath is the real, runnable Python — the exact file you'd save as `.py` and run with `python`." },
        { type: 'playground', id: 'js-py-side-by-side', title: 'JS running, Python shown beside it', height: 420, code: `// This JS actually RUNS. The Python string is printed for comparison.
// A tiny algorithm: keep only the long words, uppercase them.

const words = ["cat", "python", "js", "engineer", "ai"];

const result = words
  .filter(w => w.length > 3)
  .map(w => w.toUpperCase());

console.log("JS output:", result);

// ---- The same logic, spelled in Python ----
const pythonVersion = \`
words = ["cat", "python", "js", "engineer", "ai"]

result = [w.upper() for w in words if len(w) > 3]

print("Python output:", result)
\`;
console.log("\\n=== Equivalent Python ===")
console.log(pythonVersion)`, solution: `// Solution: translate a word-length COUNT instead.
const words = ["cat", "python", "js", "engineer", "ai"];

// JS version (runs):
const longCount = words.filter(w => w.length > 3).length;
console.log("JS: long words =", longCount);

// Python equivalent (shown as text):
const py = \`
words = ["cat", "python", "js", "engineer", "ai"]

long_count = len([w for w in words if len(w) > 3])

print("Python: long words =", long_count)
\`;
console.log("\\n=== Equivalent Python ===")
console.log(py)
// Note the swaps: .filter(fn).length  ->  len([... if ...])
//                 camelCase longCount ->  snake_case long_count`, caption: '**Exercise:** change the JS to COUNT the long words instead of listing them, then update the Python string to match (hint: wrap the comprehension in `len(...)` and rename to `long_count`). Solution button has it.' },
        { type: 'callout', variant: 'analogy', title: 'The list comprehension = filter + map in one breath', text: "That `[w.upper() for w in words if len(w) > 3]` is Python's signature move: a **list comprehension**. Read it right-to-left-ish: *for* each `w` *in* `words`, *if* it's long enough, collect `w.upper()`. It's `.filter().map()` fused into one line. You'll see comprehensions constantly in data code — they're the Pythonic way to transform a list." },
        { type: 'h', text: 'A real little script' },
        { type: 'p', text: "Here's the shape of actual Python you'll write: read a list, filter it, print with an f-string. Nothing exotic — every line maps to something you'd write in JS, just respelled." },
        { type: 'code', lang: 'python', filename: 'scores.py', code: `# scores.py — read a list, filter it, report with f-strings
scores = [88, 42, 91, 67, 100, 33]

passing = [s for s in scores if s >= 60]    # filter, comprehension-style
average = sum(passing) / len(passing)       # sum() and len() are built-ins

print(f"{len(passing)} of {len(scores)} passed")
print(f"Average of passers: {average:.1f}")  # :.1f = 1 decimal place

for s in passing:
    verdict = "great" if s >= 90 else "ok"   # ternary: value_if_true if cond else value_if_false
    print(f"  {s} -> {verdict}")`, caption: 'Real Python. Note: f-strings with format specs (`:.1f`), the ternary reading left-to-right, and `for x in list`.' },
        { type: 'callout', variant: 'tip', title: 'The ternary reads like English', text: "JS: `cond ? a : b`. Python: `a if cond else b`. Same three ingredients, reordered to read like a sentence: \"*great* if the score is high *else* ok.\" Slightly jarring on day one, natural by day two." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A JS dev pastes `if (x > 3) { doThing() }` into Python and it errors. What is the minimal correct translation?',
            options: [
              '`if (x > 3) { do_thing() }` — Python keeps the braces',
              '`if x > 3:` then `do_thing()` indented on the next line',
              '`if x > 3 then do_thing()` — Python uses `then`',
              '`if x > 3; do_thing();` — semicolons required',
            ],
            answer: 1,
            explain: 'Python drops the parentheses and braces, ends the condition with a colon, and puts the body on an indented next line (4 spaces). No braces, no semicolons, no `then`. The colon + indent IS the block.',
          },
          {
            q: 'You need Python\'s equivalent of JS `let count = 0;`. What do you write?',
            options: [
              '`let count = 0`',
              '`var count = 0`',
              '`count = 0`',
              '`const count = 0`',
            ],
            answer: 2,
            explain: 'Python has no `let`/`const`/`var`. Assignment alone declares the variable: `count = 0`. And by convention it\'d be `snake_case` — here `count` is already fine, but a two-word name would be `retry_count`, not `retryCount`.',
          },
          {
            q: 'In Python, what does `if items:` check when `items` is a list?',
            options: [
              'Whether `items` is exactly `True`',
              'Whether the list is non-empty — empty lists are falsy',
              'Whether `items` was declared',
              'It errors; you must write `items.length > 0`',
            ],
            answer: 1,
            explain: 'Empty collections are falsy in Python (`[]`, `{}`, `""` all falsy). So `if items:` idiomatically means "if the list has anything in it." This is cleaner than JS, where `[]` is truthy and you need `.length`.',
          },
          {
            q: 'Which line correctly interpolates a variable into a Python string?',
            options: [
              '`` `Hi ${name}` ``',
              '`"Hi " + {name}`',
              '`f"Hi {name}"`',
              '`"Hi %name"`',
            ],
            answer: 2,
            explain: 'An f-string: prefix the quote with `f`, then use bare `{name}` (no dollar sign). The template-literal `` `${}` `` is JS; the `f"..."` form is Python\'s equivalent and the one you\'ll use constantly.',
          },
          {
            q: 'A colleague writes `result = a && b || None` in Python. Why won\'t it run?',
            options: [
              'You can\'t mix boolean operators',
              'Python uses `and`/`or` (words), not `&&`/`||`, and `None` is fine but `&&`/`||` are syntax errors',
              '`None` should be `null`',
              'It runs fine',
            ],
            answer: 1,
            explain: 'Python\'s boolean operators are the English words `and`, `or`, `not` — `&&` and `||` are not valid Python. The correct line is `result = a and b or None`. (`None` is right — Python\'s single empty value, replacing both JS `null` and `undefined`.)',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l1-c1', front: 'Why learn Python for AI at all?', back: 'The ecosystem, not superiority. NumPy, pandas, PyTorch, Jupyter, and the official Anthropic/OpenAI SDKs are Python-first. It\'s where AI work happens — Python is JS with different spelling.' },
          { id: 'm4-l1-c2', front: 'How does Python mark code blocks?', back: 'A colon `:` opens the block; 4-space indentation defines its body; dedent closes it. No braces, no semicolons. Whitespace IS the syntax (mis-indent = IndentationError).' },
          { id: 'm4-l1-c3', front: 'How do you declare a variable in Python?', back: 'Just `name = value` — no const/let/var. Dynamically typed like JS. Convention: snake_case for names, UPPER_CASE for "constants" (not enforced).' },
          { id: 'm4-l1-c4', front: 'print / f-string / None — the JS equivalents?', back: '`print()` = `console.log()`. `f"Hi {name}"` = `` `Hi ${name}` ``. `None` = both `null` AND `undefined` (Python has one empty value).' },
          { id: 'm4-l1-c5', front: 'Boolean & comparison operators in Python?', back: '`and` / `or` / `not` instead of `&&` / `||` / `!`. Comparison uses `==` / `!=` — which already compare by value (no coercion), so there\'s no `===`.' },
          { id: 'm4-l1-c6', front: 'What is a list comprehension?', back: '`[expr for x in items if cond]` — Python\'s `.filter().map()` fused into one line. E.g. `[w.upper() for w in words if len(w) > 3]`. Everywhere in data code.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'You already know ~80% of Python — it\'s JS concepts with different spelling and no braces.',
          'Learn it for the AI ecosystem (NumPy, pandas, PyTorch, official SDKs), not because it\'s "better."',
          'Blocks: colon + 4-space indentation replace `{}`; whitespace is syntax, not style.',
          'Variables: `name = value`, no keyword, dynamically typed, snake_case; no true const.',
          'Key swaps: `print`/f-strings/`None`/`and`-`or`-`not`/`==`/`#` — mostly find-and-replace.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Mixing tabs and spaces', text: 'Because indentation is grammar, a stray tab among spaces is a syntax error (or worse, a silent logic bug). Set your editor to insert 4 spaces on Tab — the Python default — and never think about it again.' },
          { title: 'Writing camelCase everywhere', text: 'Habit from JS. Python code that says `retryCount` and `isActive` reads as "written by someone who doesn\'t know the conventions." It\'s `retry_count` and `is_active`. Small thing, strong signal in code review.' },
          { title: 'Reaching for && || ! and ===', text: 'Muscle memory types `&&` and it just errors. Python is `and`, `or`, `not`, and plain `==` (which already means strict-equals). There is no `===` — and you won\'t miss it once you internalize that `==` doesn\'t coerce.' },
          { title: 'Forgetting the colon', text: 'Every block opener — `if`, `for`, `while`, `def`, `else` — ends in a `:`. Leaving it off is the #1 beginner syntax error. The colon says "a block is coming"; the indent delivers it.' },
        ] },
        { type: 'interview', items: [
          { q: '"You\'re a JS dev — how quickly can you get productive in Python?"', a: 'Fast, because the concepts transfer wholesale — variables, functions, loops, data structures are the same; only the syntax shifts. The real ramp isn\'t the language, it\'s the ecosystem: NumPy\'s array semantics, pandas DataFrames, the notebook workflow. I\'d be reading and writing basic Python in a day and productive in the AI libraries within a week or two, because the friction is idioms and tooling, not fundamentals.' },
          { q: '"Why is Python the default for AI/ML rather than JavaScript?"', a: 'History and gravity, not language superiority. The scientific-computing stack (NumPy, SciPy, pandas) matured in Python, the deep-learning frameworks (PyTorch, TensorFlow) were built on it, and researchers publish Python. That network effect compounds: SDKs, tutorials, and models all target Python first. JS can call the APIs fine, but the training, data, and research layers live in Python — so that\'s where you go to do the deep work.' },
          { q: '"What surprised you most moving from JS to Python?"', a: 'That indentation is load-bearing — whitespace is actual syntax, not formatting, so `{}` disappears entirely. After the initial jolt it enforces readability for free. The second surprise was pleasant: `==` compares by value with no coercion, so JavaScript\'s `==` vs `===` footgun simply doesn\'t exist. And one empty value (`None`) instead of `null` plus `undefined` removes a whole category of confusion.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Reading model repos', text: 'Every PyTorch model on GitHub, every Hugging Face example, every research paper\'s reference code is Python. Basic fluency turns "unreadable wall" into "oh, that\'s just a filtered loop."' },
          { title: 'The official SDKs', text: 'Anthropic\'s and OpenAI\'s Python SDKs are the reference implementations — new features land there first. Reading their source and examples requires exactly this syntax fluency.' },
          { title: 'Jupyter notebooks', text: 'Data exploration, prompt experiments, and eval dashboards live in notebooks — cell-by-cell Python that\'s the industry\'s scratchpad. Notebooks are the REPL, supercharged.' },
          { title: 'Data wrangling with pandas', text: 'Cleaning a dataset before fine-tuning, analyzing eval results, computing metrics — all pandas, all Python. The list comprehensions and f-strings from this lesson are the daily vocabulary.' },
        ] },
        { type: 'project', title: 'Word-frequency counter — your first Python port', goal: 'Install Python, use the REPL, and port a real JS utility to idiomatic Python — proving the "80% you already know" claim to yourself.', steps: [
          'Install Python 3 (python.org, or `brew install python` / your OS package manager). Confirm with `python3 --version` — it must show 3.x.',
          'Open the REPL with `python3` and warm up: try `2 ** 10`, `len("hello")`, and an f-string like `print(f"1 + 1 = {1 + 1}")`. Then `exit()`.',
          'Take this ~15-line JS word-frequency counter: split a sentence into words, tally each into an object, print each `word: count`. (Write it in JS first if you don\'t have one handy.)',
          'Port it to `word_count.py`: use `.split()` to get words, a dict `counts = {}` with `counts[w] = counts.get(w, 0) + 1` to tally, and a `for word, count in counts.items():` loop printing an f-string. snake_case throughout.',
          'Run it with `python3 word_count.py`. Then note in a comment every syntax difference you hit vs the JS: no braces, `#` comments, `dict.get`, f-strings, the colon-and-indent.',
        ], deliverable: 'A `word_count.py` that runs from the terminal and prints each word with its count, plus a short comment block listing the JS→Python differences you encountered.' },
        { type: 'challenge', title: 'Port something trickier', text: 'Take a slightly harder JS snippet — say, a function that groups an array of objects by a key (e.g. group people by their city into `{ city: [names] }`). Port it to Python using a dict and a loop (or `collections.defaultdict` if you\'re feeling adventurous). Then write a bullet list of *every* syntax difference you encountered: object vs dict literal, `push` vs `append`, arrow function vs `def`, `.forEach` vs `for ... in`. The goal isn\'t the algorithm — it\'s cataloguing the phrasebook entries you had to look up.', hints: [
          'JS `arr.push(x)` becomes Python `list.append(x)`. JS `{}` object becomes Python `{}` dict — same braces, but access and iteration differ.',
          'To collect into a list under a key: `groups.setdefault(city, []).append(name)` is the clean one-liner (or import `defaultdict`).',
          'Iterate a dict with `for key, values in groups.items():` — `.items()` gives you key/value pairs, like `Object.entries()` in JS.',
        ] },
        { type: 'reading', links: [
          { label: 'The official Python Tutorial', url: 'https://docs.python.org/3/tutorial/', note: 'The canonical, well-written intro. Skim sections 3-5; you\'ll recognize almost everything.' },
          { label: 'Python vs JavaScript for JS devs (Real Python)', url: 'https://realpython.com/python-vs-javascript/', note: 'A direct side-by-side of the two languages, written for exactly your background.' },
          { label: 'PEP 8 — the Python style guide', url: 'https://peps.python.org/pep-0008/', note: 'Where snake_case, 4-space indents, and the naming conventions are officially defined. The "Prettier config" of Python.' },
        ] },
      ],
    },
  ],
}
