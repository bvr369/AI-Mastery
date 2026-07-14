// Lesson 4.6 — Notebooks & Quick Experiments

export default {
  sections: [
    {
      id: 'what-is-a-notebook',
      title: 'The AI engineer scratchpad',
      blocks: [
        { type: 'p', text: "Every field has a workbench where messy ideas get tried before they become clean code. For AI/ML, that workbench is the **notebook**. If you've ever opened a browser console to poke at an object mid-debug, you already understand the impulse — a notebook is that impulse turned into a first-class file you can save, share, and re-run." },
        { type: 'p', text: "Concretely, a notebook (the `.ipynb` format, born from **Jupyter**) is a document made of **cells**. Two kinds matter: **code cells** that execute and show their output right below them, and **markdown cells** that hold prose, headings, math, and images. You run cells one at a time, in any order you like, and the results — a number, a table, a *plotted chart* — appear inline, stapled to the code that made them." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a REPL that remembers, with a lab notebook stapled on', text: "A plain Node REPL is a conversation you lose when you close the terminal. A notebook is that same live REPL, but every line you typed *and every answer it gave* is saved to a file — and you can drop paragraphs of explanation between the lines. It's a REPL and a lab journal fused into one document. That fusion is why researchers live in them: the experiment and the write-up are the same artifact." },
        { type: 'p', text: "The magic ingredient is the **[[Kernel]]** — the live process (usually a Python interpreter) sitting behind your notebook. When you run a cell, it ships the code to the kernel, the kernel executes it, and the result comes back. Crucially, the kernel **stays alive between cells**. Load a 2GB model in cell 3, and it's still sitting in memory when you run cell 20 an hour later. That persistence is the notebook's superpower — and, as you'll see, its favorite way to bite you." },
        { type: 'h', text: 'The four properties that define the experience' },
        { type: 'list', items: [
          "**Cells** — code and markdown, interleaved. The unit of execution and the unit of explanation.",
          "**Inline output** — results render directly under the cell: text, tables, and especially *plots and images*. No switching windows to see your chart.",
          "**Persistent kernel state** — variables, imports, and loaded models survive across cell runs. The notebook is one long-lived session, not a fresh script each time.",
          "**Out-of-order execution** — you can run cell 10, then cell 4, then cell 10 again. Freedom to iterate — and the source of the #1 notebook footgun (Section 4).",
        ] },
      ],
    },
    {
      id: 'why-ai-lives-here',
      title: 'Why AI/ML basically lives in notebooks',
      blocks: [
        { type: 'p', text: "Open almost any ML tutorial, research repo, or Kaggle solution and you'll find a notebook. This isn't fashion — it's a genuine fit between how notebooks work and how model work *feels*. Three reasons dominate." },
        { type: 'h', text: '1. The feedback loop is instant' },
        { type: 'p', text: "Loading a model or a dataset is slow — sometimes minutes. In a script, every tweak means re-running the whole file, so you pay that loading cost *again and again*. In a notebook you load the heavy thing **once** into the kernel, then iterate on the cheap cells below it — reword a prompt, re-plot, re-filter — getting answers in milliseconds. The expensive setup happens once; the exploration is free. That's the entire reason data scientists refuse to give notebooks up." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: hot-reload for data', text: "You already love this pattern. In React dev, you don't restart the whole app to see a color change — Vite hot-reloads the one component while app state stays put. A notebook is hot-reload for *data science*: your loaded dataset and model are the preserved state, and you edit the one cell you're working on. Same dopamine, same reason it's addictive." },
        { type: 'h', text: '2. Inline plots turn numbers into sight' },
        { type: 'p', text: "AI work is drowning in arrays. A model output is a vector of 50,000 probabilities; a dataset is a million rows. You cannot *read* that — you have to **see** it. Notebooks render a matplotlib histogram or a Pandas table right under the cell that produced it. \"Is my data skewed? Are these two [[Embedding]] clusters actually separable? Why is the loss curve flat?\" — all answered by a glance at an inline plot, not a stared-at wall of numbers." },
        { type: 'h', text: '3. Exploring model outputs is inherently interactive' },
        { type: 'p', text: "Prompt engineering (Module 3) is a tight loop: send a prompt, read the completion, tweak, resend. That *is* the notebook cell cycle. You keep the model handle warm in the kernel and fire prompt after prompt, eyeballing each response, keeping a markdown running-commentary of what worked. Trying to do that in a compile-run-print script is like doing exploratory data analysis through a fax machine." },
        { type: 'table', headers: ['You want to…', 'In a script', 'In a notebook'], rows: [
          ['Reword a prompt and re-run', 'Reload model every time (slow)', 'Model stays warm; instant re-run'],
          ['See if data is skewed', 'Write file, open image viewer', 'Plot appears inline instantly'],
          ['Inspect one weird row', 'print() and squint', 'Rich table, right there'],
          ['Keep notes on what you tried', 'Comments, easily lost', 'Markdown cells beside the code'],
        ] },
      ],
    },
    {
      id: 'the-tools',
      title: 'The tool landscape: Jupyter, Colab, and friends',
      blocks: [
        { type: 'p', text: "\"Notebook\" is a format; several tools open it. They all speak the same `.ipynb` file, so skills transfer — but they differ in where the kernel runs and what hardware you get. Here's the map you actually need." },
        { type: 'table', headers: ['Tool', 'Runs where', 'Best for'], rows: [
          ['**Jupyter Notebook / JupyterLab**', 'Your machine (local kernel)', 'The classic, open-source original. Lab is the modern IDE-flavored version — file browser, tabs, multiple notebooks.'],
          ['**VS Code notebooks**', 'Your machine, inside VS Code', 'Notebooks with real editor superpowers: your extensions, git diff, autocomplete, debugger. Great if you already live in VS Code.'],
          ['**Google Colab**', "Google's servers (cloud)", 'Zero setup, share like a Google Doc, and **free GPUs/TPUs**. The default place to *try a model* without owning a graphics card.'],
        ] },
        { type: 'callout', variant: 'tip', title: 'Colab is your on-ramp', text: "For this course, reach for **Google Colab** first. It runs in the browser, needs nothing installed, and hands you a free GPU — which matters the moment you want to run an actual open model instead of just calling an API. Free tier has limits (sessions time out, GPUs aren't guaranteed), but for learning and quick experiments it's unbeatable. It's a hosted Jupyter kernel with Google's hardware behind it." },
        { type: 'p', text: "One mental model to keep straight: the **frontend** (the UI you click in) and the **kernel** (the process running your code) are separate. Colab gives you a browser frontend wired to a kernel on Google's machine. Local Jupyter gives you a browser frontend wired to a kernel on *your* machine. Same file, same experience — the only question is whose CPU/GPU is doing the work and where your data lives." },
        { type: 'code', lang: 'python', filename: 'colab_first_cell.py', code: `# A first Colab cell: check what hardware you were given.
# (Runtime > Change runtime type > GPU, then run this.)
import torch
print("GPU available:", torch.cuda.is_available())
print("Device:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU only")

# Colab has most ML libraries preinstalled. Need one it doesn't?
# A leading '!' runs a shell command from inside a cell:
# !pip install anthropic`, caption: 'The classic Colab opener — confirm your runtime before loading anything heavy. The `!command` shell escape is a notebook-ism worth memorizing.' },
      ],
    },
    {
      id: 'hidden-state-footgun',
      title: 'The hidden-state footgun (and how to disarm it)',
      blocks: [
        { type: 'p', text: "Here's the bug that has humbled every notebook user, PhDs included. Because the kernel **remembers everything** and you can run cells **in any order**, the state in memory can quietly drift away from what the code *on screen* says. You end up with a notebook that works for you — and for literally no one else, including future-you after a restart." },
        { type: 'callout', variant: 'warn', title: 'The classic disaster', text: "You define `df = load_data()` in cell 5. You experiment, and in cell 12 you write `df = df.dropna()`. Then you go back and *edit cell 5* to filter differently — but you don't re-run cell 12. Now `df` in memory reflects a history no single reading of the notebook can reproduce. You delete cell 12 entirely, but the cleaned `df` is **still in the kernel**. Your code says one thing; your memory holds another. This is how a notebook 'works' until the moment someone restarts it — then it explodes." },
        { type: 'p', text: "The root cause: **the kernel's memory is invisible state that outlives the visible code.** A deleted cell's variables linger. A cell run three times has run its side effects three times. The execution-count number beside each cell (`[1]`, `[2]`, `[17]`) is your only clue to the *actual* order things happened — and if those numbers aren't a clean top-to-bottom sequence, you're in danger." },
        { type: 'p', text: "You'll feel this exact trap in the playground below — it simulates a kernel where variables persist and running cells out of order corrupts your result. Then here's the fix." },
        { type: 'callout', variant: 'tip', title: 'The one habit that saves you: Restart & Run All', text: "Before you trust a result, share a notebook, or call it done: **Kernel → Restart & Run All**. This wipes the kernel to a blank slate and re-executes every cell from the top, in order. If it produces the same result — congratulations, your notebook is actually *reproducible*. If it crashes or changes, you just caught a hidden-state bug before it embarrassed you. Do this habitually; it's the notebook equivalent of a clean `rm -rf node_modules && npm ci` build." },
        { type: 'list', items: [
          "**Restart & Run All** before trusting or sharing — the single most important notebook habit.",
          "**Write cells to run top-to-bottom.** Freedom to jump around is for *exploring*; the saved notebook should still work in order.",
          "**Watch the execution counts.** Non-sequential `[n]` numbers are a warning that on-screen order ≠ actual order.",
          "**Avoid mutating a variable in place across distant cells** (`df = df.dropna()` far from where `df` was born). Re-deriving from the source is safer than editing state you can't see.",
        ] },
      ],
    },
    {
      id: 'kernel-state-lab',
      title: 'Feel the kernel: an interactive state lab',
      blocks: [
        { type: 'p', text: "Notebooks are Python, but the *kernel-state* concept is language-agnostic — so here's a tiny JavaScript simulator of a three-cell notebook. Each `cellN()` shares one persistent `kernel` object, exactly like real cells share a live kernel. Run them **in order** and the total is correct. Then trigger the footgun — run the coupon cell an extra time — and watch the 'reproducible' result rot. That's the hidden-state bug, made tangible." },
        { type: 'playground', id: 'kernel-state-lab', title: 'Simulated notebook kernel — the out-of-order trap', height: 460, code: `// A fake "kernel": one object that PERSISTS across cell runs,
// just like variables persist across real notebook cells.
const kernel = {}

// --- CELL 1 (setup): load the "cart". Run me first. ---
function cell1_setup() {
  kernel.cart = [10, 20, 30]      // three items in the cart
  kernel.discount = 0             // no discount yet
  console.log("cell1 -> cart loaded:", kernel.cart)
}

// --- CELL 2 (apply coupon): mutates state IN PLACE ---
function cell2_applyCoupon() {
  kernel.discount += 5            // note the += : running twice stacks!
  console.log("cell2 -> discount is now:", kernel.discount)
}

// --- CELL 3 (checkout): reads whatever is in the kernel NOW ---
function cell3_checkout() {
  const subtotal = kernel.cart.reduce((a, b) => a + b, 0)
  const total = subtotal - kernel.discount
  console.log("cell3 -> total:", total)
  return total
}

// ===== EXECUTION ORDER — this is the whole lesson =====
// The "intended" run: top to bottom, once each.
cell1_setup()
cell2_applyCoupon()
cell3_checkout()          // total: 55  (correct)

// NOW TRY THE FOOTGUN: uncomment the next line and re-run.
// You ran cell2 an EXTRA time — discount stacks to 10 — and the
// "same" checkout now prints 50. The code on screen didn't change;
// the invisible kernel state did. That's the out-of-order bug.
// cell2_applyCoupon(); cell3_checkout()`, solution: `// THE FIX: don't accumulate hidden state. Derive results from
// the source every time, so any run order gives the same answer.
const kernel = {}

function cell1_setup() {
  kernel.cart = [10, 20, 30]
  kernel.couponCount = 0
}

// Idempotent: this cell SETS the coupon count, it does not += it.
function cell2_setCoupons(n) {
  kernel.couponCount = n          // assign, don't accumulate
}

// Checkout recomputes discount fresh from couponCount — no lingering total.
function cell3_checkout() {
  const subtotal = kernel.cart.reduce((a, b) => a + b, 0)
  const discount = kernel.couponCount * 5
  const total = subtotal - discount
  console.log("total:", total, "( " + kernel.couponCount + " coupons )")
  return total
}

// Now run cell2 as many times as you like in any order —
// the result depends only on the ARGUMENT, not on how often
// the cell ran. That's what "Restart & Run All" guarantees.
cell1_setup()
cell2_setCoupons(1)
cell3_checkout()          // 55, every time, no matter the run order

cell2_setCoupons(1)       // running again changes nothing — reproducible!
cell3_checkout()          // still 55`, caption: '**Exercise:** (1) Run as-is — total is 55. (2) Uncomment the footgun line and re-run: the extra `cell2` call stacks the discount and the total silently changes to 50 — an out-of-order bug. (3) Open the Solution to see the fix: assign state instead of accumulating it, so any run order is reproducible.' },
        { type: 'callout', variant: 'info', text: "The takeaway generalizes: **the danger isn't out-of-order execution itself — it's cells that accumulate or mutate hidden state.** Cells that only *read* inputs and *derive* outputs are safe to run in any order, any number of times. That's the same idempotency instinct you use for good API design and React reducers." },
      ],
    },
    {
      id: 'notebook-vs-production',
      title: 'Notebooks vs scripts vs production',
      blocks: [
        { type: 'p', text: "Notebooks are a fantastic *place to think* and a terrible *place to ship from*. The out-of-order freedom that makes exploration fast makes production fragile. The senior move is knowing the boundary: **prototype in a notebook, then harden the winning logic into a plain, importable module.**" },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the notebook is a sketchbook, the module is the blueprint', text: "An architect sketches wildly on napkins — that's where the ideas happen, and nobody frames a napkin. But you don't hand napkins to the construction crew; you redraw the winner as a precise blueprint. The notebook is your napkin: fast, messy, disposable. The `.py` module is the blueprint: ordered, tested, importable, reproducible. Great engineers sketch freely *and* redraw deliberately." },
        { type: 'p', text: "This is the same discipline Modules 2 and 3 drilled: **prompts-as-code.** A prompt you tuned interactively in a notebook is a prototype; the production version lives in a versioned module, with the prompt as a named constant, wrapped in a function with a clear signature, covered by evals (Lesson 3.7). The notebook is where you *find* the good prompt; the module is where it *lives*." },
        { type: 'table', headers: ['', 'Notebook', 'Script / Module', 'Production'], rows: [
          ['Purpose', 'Explore, prototype, explain', 'Automate a task, be imported', 'Serve users reliably'],
          ['Execution', 'Cell-by-cell, any order', 'Top-to-bottom, once', 'On request, at scale'],
          ['Reproducible?', 'Only if disciplined', 'Yes, by nature', 'Must be, non-negotiable'],
          ['Version control', 'Painful (JSON + outputs)', 'Clean git diffs', 'Clean git diffs'],
          ['Tests', 'Rare', 'Possible & normal', 'Required'],
        ] },
        { type: 'callout', variant: 'warn', title: 'Why notebooks resist git', text: "An `.ipynb` is JSON that embeds *both* your code and its outputs — including base64-encoded images. A one-line code change can produce a thousand-line diff. Two people editing the same notebook get merge conflicts in machine-generated metadata. This alone is a strong reason to move stable logic into `.py` files, where git works the way you expect. (Tools like `jupytext` and `nbstripout` help, but the real fix is: don't ship from notebooks.)" },
        { type: 'code', lang: 'python', filename: 'notebook_cell_to_module.py', code: `# In the notebook (exploratory — fine to live here while iterating):
prompt = "Summarize this in 3 bullets: " + article_text
resp = client.messages.create(model="claude-sonnet-5",
    max_tokens=300, messages=[{"role": "user", "content": prompt}])
print(resp.content[0].text)

# Harden the winner into summarize.py (importable, testable, reusable):
# --- summarize.py ---
SUMMARY_PROMPT = "Summarize this in 3 bullets:\\n\\n{article}"

def summarize(client, article: str, max_tokens: int = 300) -> str:
    """Return a 3-bullet summary of an article. Pure, testable, no hidden state."""
    resp = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": SUMMARY_PROMPT.format(article=article)}],
    )
    return resp.content[0].text

# Now any script, API route, OR notebook can:  from summarize import summarize`, caption: 'The refactor that matters: loose exploratory cells become one named, documented, importable function. Prompt-as-code, the Module 3 discipline, applied.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: "A colleague's notebook produces a chart you can't reproduce. You hit Kernel → Restart & Run All and it crashes on cell 8. What did that just reveal?",
            options: [
              'Their computer is faster than yours',
              'The notebook depended on hidden kernel state — a variable defined by a since-deleted or out-of-order cell that no longer exists in a clean run',
              'Restart & Run All is buggy and should be avoided',
              'Cell 8 needs a GPU',
            ],
            answer: 1,
            explain: 'Restart & Run All wipes the kernel and re-runs top-to-bottom. A crash means the "working" result relied on invisible state — a variable from a deleted cell or a cell run out of order. That is exactly the class of bug the habit is designed to catch *before* you share.',
          },
          {
            q: 'Why do AI/ML engineers prototype in notebooks instead of scripts?',
            options: [
              'Notebooks run faster than scripts at the CPU level',
              'Because the kernel keeps the expensive setup (loaded model/data) warm, so you iterate on cheap cells instantly, and plots/outputs render inline',
              'Scripts cannot call LLM APIs',
              'Notebooks automatically make code production-ready',
            ],
            answer: 1,
            explain: 'The kernel persists state, so you pay the slow load once and then iterate for free — plus inline plots let you *see* data instead of squinting at numbers. That tight, visual feedback loop is the whole appeal. Notebooks are not faster per-instruction and are the opposite of production-ready.',
          },
          {
            q: "You want to run an open-source image model but don't own a GPU. Fastest path to trying it?",
            options: [
              'Buy a graphics card',
              'Google Colab — a hosted Jupyter kernel with free GPU access, zero local setup',
              'Rewrite the model to run on CPU',
              'It is impossible without local hardware',
            ],
            answer: 1,
            explain: 'Colab hands you a browser-based notebook wired to a kernel on Google hardware, including free (if limited) GPUs. It is the standard on-ramp for trying models without owning the silicon — set Runtime type to GPU and go.',
          },
          {
            q: 'Which cell design is SAFE to run in any order, any number of times?',
            options: [
              'A cell that does `df = df.dropna()` (mutates df in place)',
              'A cell that does `total += new_value` (accumulates)',
              'A cell that derives its output purely from its inputs, e.g. `clean = raw.dropna()` (reads raw, writes a new variable)',
              'A cell that appends to a global list every run',
            ],
            answer: 2,
            explain: 'Idempotency is the key. Cells that only read inputs and derive fresh outputs give the same result regardless of run order or count. Cells that mutate in place or accumulate (`+=`, `.append()`, reassigning a variable from itself) build up hidden state and are the source of irreproducible bugs.',
          },
          {
            q: "You tuned a great summarization prompt interactively in a notebook. What's the right next step for shipping it?",
            options: [
              'Deploy the notebook itself as the production service',
              'Copy the cells into a Slack message for the team',
              'Refactor the logic into an importable .py module: prompt as a named constant, wrapped in a documented function, ready for evals and version control',
              'Leave it in the notebook and re-run it manually when needed',
            ],
            answer: 2,
            explain: 'Prototype in the notebook, harden into a module. The winning logic becomes a pure, named, testable function in a .py file where git diffs are clean and evals can run — the prompts-as-code discipline from Modules 2–3. Notebooks find the answer; modules ship it.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l6-c1', front: 'What is a notebook, in one sentence?', back: 'A document of code + markdown cells backed by a persistent kernel, where results (including plots) render inline. A REPL that remembers, fused with a lab journal — the `.ipynb` format.' },
          { id: 'm4-l6-c2', front: 'What is the kernel and why does it matter?', back: 'The live process (usually Python) executing your cells. It stays alive between cells, so variables and loaded models persist — the source of both the fast feedback loop and the hidden-state footgun.' },
          { id: 'm4-l6-c3', front: 'Why does AI/ML live in notebooks?', back: 'Load the expensive model/data once (kernel keeps it warm), then iterate on cheap cells instantly; inline plots let you SEE data; exploring model outputs is naturally a tweak-and-rerun loop.' },
          { id: 'm4-l6-c4', front: 'The hidden-state footgun?', back: 'Out-of-order execution + persistent kernel means in-memory state can drift from the visible code (variables from deleted cells linger, `+=` stacks). The notebook "works" until a restart, then breaks.' },
          { id: 'm4-l6-c5', front: 'The one habit that disarms it?', back: 'Kernel → Restart & Run All before trusting or sharing. Wipes memory, re-runs top-to-bottom. Same result = reproducible; crash/change = you caught a hidden-state bug.' },
          { id: 'm4-l6-c6', front: 'Notebook vs production?', back: 'Prototype in the notebook (sketchbook), harden the winner into an importable .py module (blueprint): prompt as a named constant, in a documented function, version-controlled and eval-covered. Do not ship from notebooks.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'A notebook = code + markdown cells over a persistent kernel, with inline output. It is the AI engineer scratchpad.',
          'AI/ML lives here because the kernel keeps expensive setup warm for instant iteration, and plots render inline so you can SEE data.',
          'The tools: Jupyter/JupyterLab (local classic), VS Code notebooks (editor powers), Google Colab (cloud + free GPUs — your on-ramp).',
          'The footgun: out-of-order execution + persistent state → irreproducible bugs. The fix: Restart & Run All, and write idempotent cells.',
          'Prototype in a notebook, then harden the winning logic into a clean, importable .py module — prompts-as-code, applied.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Trusting a notebook you never restarted', text: 'The result on screen may depend on a variable from a deleted cell or a cell run three times. Until it survives Kernel → Restart & Run All, you have a demo that works only in your specific session — not a reproducible result.' },
          { title: 'Mutating variables in place across distant cells', text: '`df = df.dropna()` far from where `df` was defined is a time bomb: re-running, deleting, or reordering leaves the kernel holding a state no reading of the code reveals. Prefer deriving fresh variables from the source (`clean = raw.dropna()`).' },
          { title: 'Trying to ship the notebook itself', text: 'Notebooks resist git (JSON + embedded outputs = giant diffs, merge conflicts), lack tests, and encourage out-of-order state. They are for finding the answer, not serving it. Refactor stable logic into modules before it touches production.' },
          { title: 'Forgetting Colab sessions are ephemeral', text: 'Free Colab kernels time out and reset — your loaded data and installed packages vanish. Save outputs to Google Drive, keep a `!pip install` cell at the top, and do not treat a Colab runtime as permanent storage.' },
        ] },
        { type: 'interview', items: [
          { q: '"When would you use a notebook versus a regular Python script?"', a: 'Notebook for exploration: prototyping a model, EDA, tuning prompts, anything where I want to load data once and iterate visually with inline plots. Script/module for anything reused, automated, tested, or shipped — because notebooks encourage hidden out-of-order state and version-control poorly. My rule: prototype in the notebook, then harden the winning logic into an importable module. The notebook finds the answer; the module ships it.' },
          { q: '"A teammate\'s notebook works for them but not for you. How do you debug it?"', a: 'First, Restart & Run All on a clean kernel — most "works on my machine" notebook bugs are hidden state: a variable from a deleted or out-of-order cell that is still in their memory but not in the code. If it crashes, the failing cell reveals the missing dependency. I would also check the execution-count numbers for non-sequential order, and confirm we are on the same package versions and data paths. The core insight is that the kernel memory is invisible state that can outlive the visible code.' },
          { q: '"Why are notebooks considered bad for production, and what do you do about it?"', a: 'Three reasons: out-of-order execution makes them non-deterministic, they version-control badly (JSON with embedded outputs → huge diffs and merge conflicts), and they resist testing. The fix is not to avoid notebooks — they are great for R&D — it is to treat them as prototypes. I extract the validated logic into pure, documented functions in .py modules with the prompt as a named constant, add evals and tests, and let the module be imported by both the notebook and the production service. Same discipline as prompts-as-code.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Model evaluation & comparison', text: 'Teams run a notebook that fires the same 50 prompts at three models, tabulates outputs and costs inline, and eyeballs quality side by side before committing to one — the natural home for Lesson 3.7-style evals.' },
          { title: 'Data exploration before a feature', text: 'Before building an AI feature, engineers profile the real data in a notebook — distributions, nulls, weird rows, embedding clusters — because you cannot design a pipeline for data you have not seen plotted.' },
          { title: 'Colab as a shareable demo', text: 'Research labs and DevRel ship "open in Colab" buttons: a one-click notebook that runs their model on free GPUs, so anyone can try it with zero setup — the modern README.' },
          { title: 'Reproducible research & tutorials', text: 'Papers and courses ship notebooks so results come with runnable code and prose in one artifact — provided the authors ran Restart & Run All before publishing.' },
        ] },
        { type: 'project', title: 'Colab notebook: call an LLM, then break and fix it', goal: 'Build muscle memory for the notebook workflow AND for catching the hidden-state footgun on purpose.', steps: [
          'Open Google Colab (colab.research.google.com), start a new notebook, and add a code cell that `!pip install anthropic` (or your provider) and imports it. Put your API key in Colab Secrets panel, not hardcoded.',
          'Write a cell that calls the LLM with a prompt stored in a variable, and prints `response.content[0].text`. Run it and confirm you get an answer.',
          'Add a markdown cell above it (press M to convert) with a heading and 2–3 sentences explaining what the notebook does — practice the code-plus-prose habit.',
          'Deliberately trigger a hidden-state bug: define `prompt = "..."` in an early cell, run the call cell, then EDIT the early cell prompt but DO NOT re-run it — instead re-run only a later cell that references `prompt`. Observe that the output reflects the OLD prompt still in kernel memory.',
          'Fix it the disciplined way: Kernel → Restart & Run All, confirm the output now matches the visible code, and note in a markdown cell what the bug was and why the restart fixed it.',
        ], deliverable: 'A shared Colab link containing: a working LLM call, at least one markdown explanation cell, and a written note documenting the out-of-order bug you triggered and how Restart & Run All resolved it.' },
        { type: 'challenge', title: 'Notebook → production module', text: 'Take a working notebook (yours from the project, or any tutorial notebook) and refactor its core logic into a clean, importable `.py` module. Extract the prompt(s) into named constants, wrap the LLM call in a documented function with a clear signature and type hints, remove all notebook-only cruft, and write a 3-line `if __name__ == "__main__":` smoke test. Then import your new module back into the notebook and call it — proving the same logic now lives in a shippable form.', hints: [
          'A good target function is pure: inputs in, result out, no reliance on globals or execution order. That is what makes it testable and reproducible.',
          'Keep the prompt as a module-level constant (or a `.format()` template) so it is versioned and diff-able — prompts-as-code from Module 3.',
          'If your notebook mutated variables in place, that is exactly the logic to redesign as a pure function during the move.',
        ] },
        { type: 'reading', links: [
          { label: 'Project Jupyter — official docs', url: 'https://docs.jupyter.org/en/latest/', note: 'What Jupyter, JupyterLab, kernels, and the .ipynb format actually are, from the source.' },
          { label: 'Google Colab — welcome notebook', url: 'https://colab.research.google.com/notebooks/intro.ipynb', note: 'The interactive intro; also where you enable free GPUs (Runtime → Change runtime type).' },
          { label: 'Joel Grus — "I Don\'t Like Notebooks" (JupyterCon talk)', url: 'https://www.youtube.com/watch?v=7jiPeIFXb6U', note: 'The famous, funny anti-patterns talk — hidden state, reproducibility, and why to harden into modules. Watch it to internalize the footgun.' },
        ] },
      ],
    },
  ],
}
