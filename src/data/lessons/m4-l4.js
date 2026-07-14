// Lesson 4.4 — pip, venv & Project Setup

export default {
  sections: [
    {
      id: 'the-map',
      title: "You already know this — it's just npm with different words",
      blocks: [
        { type: 'p', text: "You've run `npm install` a thousand times without thinking. Python packaging is the *same job* — pull in third-party code, pin versions, reproduce the setup on another machine — but the tools have different names and one genuinely nasty default. This lesson is a **vocabulary translation**, not a new concept. By the end you'll set up a Python project as fluently as an npm one." },
        { type: 'p', text: "Here's the payoff we're building toward: three commands that get an [[AI SDK]] running locally so you can call Claude from Python — `python -m venv .venv`, activate, `pip install anthropic`. Everything before that is understanding *why* those three commands, in that order, save you from a very common mess." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: same restaurant, different menu language', text: "Imagine you're a fluent English cook handed a French kitchen. The *cooking* is identical — heat, salt, timing — but *beurre* is butter and *farine* is flour. Python packaging is that kitchen. `package.json` becomes `requirements.txt`, `node_modules` becomes `.venv`, `npm` becomes `pip`. You're not learning to cook again. You're learning eight words." },
        { type: 'p', text: "One warning up front, because it's the whole reason this lesson exists: **npm installs locally by default; pip installs *globally* by default.** That single difference is behind 90% of Python beginner pain. We'll defuse it in the second half." },
      ],
    },
    {
      id: 'diagram',
      title: 'The translation map',
      blocks: [
        { type: 'p', text: 'Pin this diagram to memory. Every Python packaging command you meet maps back to an npm habit you already have.' },
        { type: 'diagram', id: 'npm-pip-map', caption: 'Left: what you do in Node. Right: the Python equivalent. Same jobs, different nouns — and one dangerous default flipped.' },
        { type: 'table', headers: ['You want to…', 'Node / npm', 'Python / pip'], rows: [
          ['Install a package', '`npm install axios`', '`pip install requests`'],
          ['Isolate a project\'s deps', '`node_modules/` (automatic)', '`.venv/` (**you create + activate it**)'],
          ['Declare dependencies', '`package.json`', '`requirements.txt` (or `pyproject.toml`)'],
          ['Lock exact versions', '`package-lock.json`', '`pip freeze > requirements.txt`'],
          ['Install everything a project needs', '`npm install`', '`pip install -r requirements.txt`'],
          ['Manage runtime versions', '`nvm`', '`pyenv`'],
        ] },
        { type: 'callout', variant: 'info', title: 'The one asymmetry that matters', text: "In Node, `node_modules` is created *for you* the first time you install, and it lives *next to your project* automatically. In Python, isolation is **opt-in**: no `.venv` exists until you make one, and no package goes into it until you **activate** it. Forget that step and pip quietly dumps packages into your system Python — the trap the rest of this lesson is about." },
      ],
    },
    {
      id: 'pip-basics',
      title: 'pip: like npm, but the default will bite you',
      blocks: [
        { type: 'p', text: "[[pip]] is Python's package installer — the `npm` of the Python world. It pulls packages from [PyPI](https://pypi.org) (the Python Package Index, i.e. Python's npm registry). The commands feel instantly familiar:" },
        { type: 'code', lang: 'bash', filename: 'pip vs npm', code: `# Install a package
npm install requests        # ❌ that's Node — but the muscle memory is right
pip install requests        # ✅ Python: grab 'requests' from PyPI

# Install a specific version
pip install "requests==2.31.0"

# Install several at once
pip install anthropic python-dotenv rich

# See what's installed
pip list

# Show details about one package (version, location, deps)
pip show anthropic

# Remove a package
pip uninstall requests` },
        { type: 'callout', variant: 'warn', title: 'The global-install trap', text: "Run `pip install anthropic` with no virtual environment active and it installs into your **system-wide** Python — shared by every project and sometimes by your operating system itself. Two projects that need different versions of the same package will fight. Worse, some OSes use system Python for their own tools, so a bad global install can break parts of your computer. npm made this mistake impossible by defaulting to local; pip did not. **Always work inside a venv.**" },
        { type: 'callout', variant: 'tip', title: 'Always say python -m pip', text: "On a machine with several Pythons installed (very common on macOS and Linux), a bare `pip` might belong to a *different* Python than the one you're running. `python -m pip install ...` guarantees the package lands in the exact interpreter `python` points to. It's the seatbelt version of the command — use it and never debug a phantom install again." },
      ],
    },
    {
      id: 'venv',
      title: 'venv: the node_modules you have to switch on',
      blocks: [
        { type: 'p', text: "A [[virtual environment]] (venv) is a self-contained folder holding a *private copy* of Python plus that project's packages. It's `node_modules` — but portable across the Python version too, and, crucially, something you **activate** so that `python` and `pip` temporarily point *inside* it instead of at the system." },
        { type: 'p', text: 'The full lifecycle is four steps. Learn this sequence like you learned `git init`:' },
        { type: 'code', lang: 'bash', filename: 'the venv lifecycle', code: `# 1. CREATE a venv named .venv in your project folder
#    "python -m venv" = run the built-in venv module; ".venv" = folder name
python -m venv .venv

# 2. ACTIVATE it — this is the step everyone forgets
source .venv/bin/activate          # macOS / Linux
# .venv\\Scripts\\activate           # Windows (PowerShell / cmd)

# Your prompt now shows (.venv) — proof you're "inside"
# (.venv) $  <-- packages now install HERE, not globally

# 3. INSTALL into the isolated env
pip install anthropic

# 4. DEACTIVATE when you're done (back to system Python)
deactivate` },
        { type: 'callout', variant: 'analogy', title: 'Analogy: activate is cd for your interpreter', text: "Activating a venv is like `cd`-ing into a project directory — it changes *where the next command lands*. Before activation, `pip install` targets the whole system (like running a script from `/`). After activation, it targets this one project (like running from the project root). `deactivate` is `cd` back out. The `(.venv)` in your prompt is just `pwd` for your Python." },
        { type: 'callout', variant: 'info', title: 'Add .venv to .gitignore', text: "Just like you never commit `node_modules`, you never commit `.venv` — it's big, machine-specific, and fully reconstructable. Add a one-line `.venv/` to `.gitignore`. What you *do* commit is the `requirements.txt` that lets anyone rebuild it." },
        { type: 'p', text: "Why isolation matters, concretely: project A needs `anthropic==0.40` and an old `httpx`; project B needs the latest of both. Globally, installing B silently upgrades A's deps and A breaks *without you touching it*. With venvs, each project has its own sealed box — the exact reason `node_modules` is per-project too. Isolation isn't tidiness; it's the thing that stops spooky action at a distance." },
      ],
    },
    {
      id: 'requirements-and-modern',
      title: 'requirements.txt, pip freeze & the modern tools',
      blocks: [
        { type: 'p', text: "`requirements.txt` is Python's `package.json` — the manifest that says *what this project needs*. But it's more manual: pip won't auto-write it for you the way `npm install` updates `package.json`. You generate it yourself with **`pip freeze`**." },
        { type: 'code', lang: 'bash', filename: 'freezing & restoring', code: `# Snapshot EVERY installed package + its exact version into the manifest
pip freeze > requirements.txt

# Later, on any machine, rebuild the exact environment:
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # the "npm install" moment` },
        { type: 'code', lang: 'bash', filename: 'requirements.txt', code: `# What pip freeze produces — pinned, exact, reproducible
anthropic==0.40.0
httpx==0.27.2
python-dotenv==1.0.1
# You can also hand-write looser ranges:
# anthropic>=0.40,<0.50   (compatible-range, like npm's ^)` },
        { type: 'callout', variant: 'tip', title: 'freeze from INSIDE the venv, always', text: "`pip freeze` lists whatever the *active* Python can see. Run it globally and you'll capture hundreds of unrelated system packages — a garbage manifest. Activate the venv first so `freeze` sees only this project's real dependencies. This is the #1 reason a `requirements.txt` ends up bloated with junk." },
        { type: 'h', text: 'pyproject.toml and the new generation (uv, poetry)' },
        { type: 'p', text: "`requirements.txt` is the classic, works-everywhere baseline. The modern Python ecosystem has largely moved to **`pyproject.toml`** — a single structured config file (think `package.json` but TOML) that declares dependencies, project metadata, *and* build settings in one place. You'll see it in nearly every serious library today." },
        { type: 'table', headers: ['Tool', 'What it is', 'npm mental model'], rows: [
          ['`pip` + `venv`', 'The built-in baseline. Always present, fully manual.', 'npm, roughly'],
          ['**`uv`**', 'A blazing-fast (Rust-built) all-in-one that creates envs, resolves, locks, and installs — 10–100× faster than pip.', 'pnpm — same job, dramatically faster'],
          ['`poetry`', 'Mature dependency manager with a real lockfile and `pyproject.toml`.', 'yarn, roughly'],
        ] },
        { type: 'callout', variant: 'info', title: 'What to actually use in 2026', text: "**Learn `pip` + `venv` first** — they're universal, they're what every tutorial and Stack Overflow answer assumes, and they make the concepts concrete. Then reach for **`uv`** for real projects: `uv venv` + `uv pip install anthropic` does everything you just learned, but fast, and with a proper lockfile. Knowing the manual tools means `uv`'s speed feels like a gift instead of a black box — the same reason you learned `fetch()` before the SDK." },
      ],
    },
    {
      id: 'payoff',
      title: 'The payoff: install an AI SDK & prove your mental model',
      blocks: [
        { type: 'p', text: "Everything so far pays off in one satisfying sequence — a fresh, isolated project with the Anthropic SDK installed and ready to call Claude:" },
        { type: 'code', lang: 'bash', filename: 'from zero to AI SDK', code: `mkdir claude-bot && cd claude-bot
python -m venv .venv
source .venv/bin/activate            # (.venv) appears — you're isolated
pip install anthropic                # the concrete payoff
pip freeze > requirements.txt        # lock it for teammates
echo ".venv/" > .gitignore           # never commit the env` },
        { type: 'code', lang: 'python', filename: 'main.py', code: `# main.py — 5 lines proving the SDK is installed and importable
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
print("Anthropic SDK ready:", client is not None)` },
        { type: 'callout', variant: 'info', title: 'Why the playground is JavaScript here', text: "This course's runnable sandbox executes **JavaScript**, not Python (the concepts are identical; only the syntax differs). So the Python above is a read-only reference you'd run on your own machine, and the playground below is a JS *simulation* of dependency resolution plus an annotated npm→pip cheat sheet you can extend. Run it, then tweak it." },
        { type: 'playground', id: 'pip-cheatsheet', title: 'npm→pip cheat sheet + a tiny resolver', height: 420, code: `// A JS model of what a package manager does: read a manifest,
// resolve versions, and "install". Illustrates pip/npm mechanics.

// 1) The annotated translation table — your pocket reference.
const cheat = [
  ["npm install pkg",        "pip install pkg",              "add a dependency"],
  ["node_modules/",          ".venv/  (activate it!)",       "isolated deps"],
  ["package.json",           "requirements.txt",             "the manifest"],
  ["package-lock.json",      "pip freeze > requirements.txt","exact pins"],
  ["npm install",            "pip install -r requirements.txt","restore all"],
  ["nvm",                    "pyenv",                        "runtime versions"],
]
console.log("NODE".padEnd(24), "PYTHON".padEnd(32), "JOB")
for (const [n, p, job] of cheat) console.log(n.padEnd(24), p.padEnd(32), job)

// 2) A toy "resolver": given a manifest, pick exact versions.
const manifest = { anthropic: ">=0.40", httpx: "==0.27.2" }
const registry = {
  anthropic: ["0.39.0", "0.40.0", "0.41.0"],
  httpx: ["0.26.0", "0.27.2", "0.28.0"],
}
function resolve(spec, versions) {
  if (spec.startsWith("==")) return versions.includes(spec.slice(2)) ? spec.slice(2) : null
  if (spec.startsWith(">=")) return versions.filter(v => v >= spec.slice(2)).sort().pop()
  return versions[versions.length - 1]
}
console.log("\\nResolving manifest -> lockfile:")
for (const [pkg, spec] of Object.entries(manifest)) {
  console.log(\`  \${pkg}\${spec}  ->  \${pkg}==\${resolve(spec, registry[pkg])}\`)
}`, solution: `// Solution: add a package + detect the "forgot to activate" trap.
const cheat = [
  ["npm install pkg",        "pip install pkg",              "add a dependency"],
  ["node_modules/",          ".venv/  (activate it!)",       "isolated deps"],
  ["package.json",           "requirements.txt",             "the manifest"],
  ["package-lock.json",      "pip freeze > requirements.txt","exact pins"],
  ["npm install",            "pip install -r requirements.txt","restore all"],
  ["nvm",                    "pyenv",                        "runtime versions"],
]
console.log("NODE".padEnd(24), "PYTHON".padEnd(32), "JOB")
for (const [n, p, job] of cheat) console.log(n.padEnd(24), p.padEnd(32), job)

// Add python-dotenv to the manifest and re-resolve.
const manifest = { anthropic: ">=0.40", httpx: "==0.27.2", "python-dotenv": ">=1.0" }
const registry = {
  anthropic: ["0.39.0", "0.40.0", "0.41.0"],
  httpx: ["0.26.0", "0.27.2", "0.28.0"],
  "python-dotenv": ["0.21.0", "1.0.1"],
}
function resolve(spec, versions) {
  if (spec.startsWith("==")) return versions.includes(spec.slice(2)) ? spec.slice(2) : null
  if (spec.startsWith(">=")) return versions.filter(v => v >= spec.slice(2)).sort().pop()
  return versions[versions.length - 1]
}

// Simulate installing: where do packages land?
function install(pkg, version, { venvActive }) {
  const target = venvActive ? ".venv/lib/python3.12/site-packages" : "SYSTEM Python (global!)"
  console.log(\`  install \${pkg}==\${version}  ->  \${target}\`)
  if (!venvActive) console.log("    ⚠️  global install — the trap! run 'source .venv/bin/activate' first")
}
console.log("\\nForgot to activate:")
for (const [pkg, spec] of Object.entries(manifest)) install(pkg, resolve(spec, registry[pkg]), { venvActive: false })
console.log("\\nActivated venv:")
for (const [pkg, spec] of Object.entries(manifest)) install(pkg, resolve(spec, registry[pkg]), { venvActive: true })`, caption: '**Exercise:** (1) add `python-dotenv` to the `manifest` and `registry`, and re-run the resolver · (2) write an `install()` function that prints WHERE each package lands depending on whether a venv is active — proving the global-install trap. The Solution button has both.' },
        { type: 'callout', variant: 'warn', title: 'Python version mismatch — the pyenv problem', text: "Your venv copies *whichever* `python` created it. Build with 3.11 and a teammate rebuilds with 3.9, and a package that needs 3.10+ fails on their machine even though the `requirements.txt` matched. This is the Python analog of a Node-version mismatch — and [[pyenv]] is the fix, exactly like `nvm`: it installs and switches between Python versions per project (via a `.python-version` file). Pin your Python version, not just your packages." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A teammate runs `pip install anthropic`, and it also seems to upgrade a package in a totally different project, breaking it. What went wrong?',
            options: [
              'anthropic has a bug',
              'They installed globally with no venv active, so all projects share one set of packages',
              'requirements.txt was missing',
              'They needed sudo',
            ],
            answer: 1,
            explain: "No active venv means pip installs into the shared system Python. One project's upgrade silently changes another's dependencies — the exact spooky-action-at-a-distance that per-project venvs (like node_modules) prevent.",
          },
          {
            q: 'What is the closest npm equivalent of `python -m venv .venv` followed by activating it?',
            options: [
              'npm publish',
              'There is no equivalent',
              'The automatic creation + use of a project-local node_modules — except in Python you do it explicitly',
              'npm run build',
            ],
            answer: 2,
            explain: "A venv is the per-project isolated dependency folder. Node gives you node_modules automatically; Python makes you create AND activate .venv yourself. Same concept, opt-in instead of automatic.",
          },
          {
            q: 'You want a teammate to reproduce your exact environment. Which pair of commands is correct?',
            options: [
              '`npm freeze` then `npm restore`',
              '`pip freeze > requirements.txt` (you), then `pip install -r requirements.txt` (them, in a fresh venv)',
              '`pip save` then `pip load`',
              '`pip install --global` then share your system',
            ],
            answer: 1,
            explain: "`pip freeze` writes exact pinned versions to requirements.txt (like package-lock.json); `pip install -r` rebuilds from it. The teammate must run it inside their own fresh, activated venv.",
          },
          {
            q: 'Your requirements.txt came out with 300+ packages you never installed. Most likely cause?',
            options: [
              'pip is broken',
              'You ran `pip freeze` with no venv active, capturing the entire system Python',
              'anthropic pulls in 300 dependencies',
              'PyPI was down',
            ],
            answer: 1,
            explain: "`pip freeze` reports whatever the active interpreter sees. Outside a venv that's the whole system. Activate the project's venv first so freeze captures only its real dependencies.",
          },
          {
            q: 'A package installs fine for you (Python 3.12) but crashes on a teammate\'s machine (Python 3.9), even with identical requirements.txt. Best tool to prevent this?',
            options: [
              'A bigger max_tokens',
              'pyenv (like nvm) to pin and match the Python runtime version across machines',
              'Reinstall pip',
              'Delete requirements.txt',
            ],
            answer: 1,
            explain: "requirements.txt pins packages, not the interpreter. Version-specific packages then fail on a mismatched Python. pyenv pins the Python version itself (via .python-version), the direct analog of nvm for Node.",
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l4-c1', front: 'pip is to Python as ___ is to Node?', back: 'npm. pip installs packages from PyPI (Python\'s registry). Same job — but pip defaults to GLOBAL installs, which is the trap.' },
          { id: 'm4-l4-c2', front: 'What is a venv, in npm terms?', back: 'The per-project isolated dependency folder — like node_modules. But you must CREATE it (python -m venv .venv) and ACTIVATE it before pip targets it.' },
          { id: 'm4-l4-c3', front: 'The venv lifecycle (4 steps)?', back: 'create: python -m venv .venv · activate: source .venv/bin/activate · install: pip install X · deactivate: deactivate. The (.venv) prompt proves you\'re inside.' },
          { id: 'm4-l4-c4', front: 'requirements.txt vs package.json + lockfile?', back: 'It\'s both, done manually. `pip freeze > requirements.txt` snapshots exact pins; `pip install -r requirements.txt` restores them (the "npm install" moment).' },
          { id: 'm4-l4-c5', front: 'pyproject.toml, uv, poetry — one line each?', back: 'pyproject.toml = modern structured manifest (like package.json). uv = fast Rust all-in-one (like pnpm). poetry = mature dep manager w/ lockfile (like yarn).' },
          { id: 'm4-l4-c6', front: 'pyenv is the Python version of ___?', back: 'nvm. It installs and switches Python *runtime* versions per project (.python-version). requirements.txt pins packages; pyenv pins the interpreter.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Python packaging is npm with new nouns: pip=npm, .venv=node_modules, requirements.txt=package.json, pip freeze=lockfile, pyenv=nvm.',
          'pip installs GLOBALLY by default — the one dangerous asymmetry. Always work inside an activated venv.',
          'venv lifecycle: python -m venv .venv → activate → pip install → deactivate. The (.venv) prompt confirms isolation.',
          'Reproduce environments with `pip freeze > requirements.txt` then `pip install -r requirements.txt` in a fresh venv.',
          'Modern stack: pyproject.toml + uv (fast) or poetry. Learn pip/venv first; they make the concepts concrete and are everywhere.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Installing without activating the venv', text: 'The signature Python mistake. You create .venv, then forget `source .venv/bin/activate`, and pip installs globally anyway. Always confirm the `(.venv)` prefix in your prompt before running pip. No prefix, no isolation.' },
          { title: 'Committing .venv to git', text: 'Like committing node_modules — huge, machine-specific, and useless to others (a venv built on your Mac won\'t run on their Windows). Add `.venv/` to .gitignore and commit requirements.txt instead.' },
          { title: 'Running pip freeze outside the venv', text: 'It captures the entire system Python — hundreds of unrelated packages — producing a bloated, unreproducible requirements.txt. Activate first so freeze sees only this project.' },
          { title: 'Pinning packages but not Python', text: 'An identical requirements.txt still breaks across Python 3.9 vs 3.12 for version-sensitive packages. Record and match the interpreter version too (pyenv + a .python-version file).' },
        ] },
        { type: 'interview', items: [
          { q: '"Coming from Node, how do you set up a fresh Python project?"', a: "Create an isolated environment with `python -m venv .venv`, activate it (`source .venv/bin/activate`), then `pip install` my dependencies into it. I lock them with `pip freeze > requirements.txt`, add `.venv/` to .gitignore, and commit the manifest. It\'s the node_modules + package.json workflow, just opt-in — I make and activate the environment explicitly. For real projects I\'d reach for `uv` to do the same thing much faster with a lockfile." },
          { q: '"Why do virtual environments matter — why not just pip install globally?"', a: "Isolation. Different projects need different, often conflicting, versions of the same package. A global install means one project\'s upgrade silently breaks another, and can even break OS tools that rely on system Python. A venv gives each project a sealed set of dependencies — exactly why Node scopes to node_modules per project. It\'s not tidiness, it\'s preventing action-at-a-distance bugs." },
          { q: '"How do you reproduce a Python environment on another machine, and what can still go wrong?"', a: "`pip freeze > requirements.txt` to capture exact pins, then on the other machine create a fresh venv and `pip install -r requirements.txt`. What still goes wrong: the Python interpreter version itself isn\'t pinned by requirements.txt, so a version-sensitive package can fail on a different Python. I\'d pin the runtime too with pyenv (a .python-version file), and note platform-specific wheels for native packages." },
          { q: '"What are pyproject.toml and uv, and why do they exist?"', a: "pyproject.toml is the modern, standardized project manifest — dependencies, metadata, and build config in one structured file, replacing the loose requirements.txt convention. uv is a fast Rust-based tool that creates venvs, resolves, locks, and installs in one command, 10–100× faster than pip. They exist because pip+venv, while universal, are slow and manual; the ecosystem consolidated on a cleaner manifest and a faster resolver — the same evolution npm→pnpm went through." },
        ] },
        { type: 'usecases', items: [
          { title: 'Onboarding a new dev', text: 'A repo with requirements.txt (or pyproject.toml) + a README means "clone, make a venv, pip install -r, run" — new hires productive in minutes, exactly like a well-kept package.json.' },
          { title: 'Reproducible ML/AI experiments', text: 'Pinned environments are how a model result from six months ago is still reproducible. Data scientists freeze exact versions so "it worked in the paper" survives package churn.' },
          { title: 'CI/CD pipelines', text: 'Build servers create a clean venv from requirements.txt on every run, guaranteeing the tested environment matches production — no "works on my machine".' },
          { title: 'Dockerizing an AI service', text: 'A Dockerfile\'s core is `pip install -r requirements.txt` into a fresh image — the venv concept baked into a container. Knowing pip mechanics makes debugging build failures trivial.' },
        ] },
        { type: 'project', title: 'Bootstrap a real Python AI project', goal: 'Set up a fresh, isolated Python project with the Anthropic SDK installed, frozen, and importable — your Python "hello, model" scaffold.', steps: [
          'Make a folder (`mkdir claude-starter && cd claude-starter`) and create a venv: `python -m venv .venv`. Activate it and confirm the `(.venv)` prompt appears.',
          'Install the SDK inside the venv: `pip install anthropic python-dotenv`. Run `pip show anthropic` to confirm where it landed (inside .venv, not system).',
          'Freeze the environment: `pip install ... ` then `pip freeze > requirements.txt`. Open the file and verify it\'s short and only your real deps.',
          'Add a `.gitignore` with `.venv/`, then write a 5-line `main.py` that imports `Anthropic` and prints a "SDK ready" message (see the lesson\'s main.py).',
          'Run `git init && git add . && git status` — verify .venv is ignored but requirements.txt and main.py are staged. That\'s a reproducible project.',
        ], deliverable: 'A git repo with requirements.txt, main.py, and .gitignore (NO .venv committed) plus a README showing the setup commands.' },
        { type: 'challenge', title: 'The second machine', text: 'Prove reproducibility. Delete your `.venv` folder entirely (simulating a fresh machine), then rebuild the environment from requirements.txt alone: new venv, activate, `pip install -r requirements.txt`, run main.py. It should work identically. Then write a short note listing THREE things that could still make this fail on a genuinely different machine — and how you\'d prevent each.', hints: [
          'Think beyond packages: what version created the venv, and is that recorded anywhere?',
          'Some packages ship compiled native code (wheels) that differs by OS/CPU — what happens on Windows vs Linux vs Apple Silicon?',
          'The three classic culprits: Python version mismatch (fix: pyenv + .python-version), platform-specific wheels, and an unpinned or too-loose requirement range.',
        ] },
        { type: 'reading', links: [
          { label: 'Python docs: venv — Creation of virtual environments', url: 'https://docs.python.org/3/library/venv.html', note: 'The official reference for the exact commands in this lesson. Bookmark the "How venvs work" section.' },
          { label: 'pip user guide', url: 'https://pip.pypa.io/en/stable/user_guide/', note: 'Everything pip can do — requirements files, freezing, constraints. The npm-docs equivalent for Python.' },
          { label: 'Anthropic Python SDK — quickstart', url: 'https://docs.anthropic.com/en/api/client-sdks', note: 'The concrete payoff: install anthropic and make your first Python call to Claude.' },
        ] },
      ],
    },
  ],
}
