// Lesson 4.5 — Async Python & Working with APIs

export default {
  sections: [
    {
      id: 'same-event-loop',
      title: 'You already know async — it just wears a snake costume now',
      blocks: [
        { type: 'p', text: "You have written `async function` and `await fetch()` a hundred times. Here is the good news that runs through this entire lesson: **Python async is the exact same event-loop mental model you already own from JavaScript.** One thread, a loop that juggles paused tasks, `await` as the word that means \"pause here and let something else run while I wait.\" The concepts are identical. Only the spelling and the entry point differ." },
        { type: 'p', text: "Why does this matter for an AI engineer? Because the payoff at the end of this lesson is calling the *same LLM API from Module 2* — but in Python, through the official SDK, the language the entire AI ecosystem speaks. And the reason to do it *async* is the reason you'd ever reach for async in JS: you have a pile of network calls (many LLM prompts, many HTTP requests) and you'd rather fire them **concurrently** than wait for each one in a slow single-file line." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the one barista, reframed', text: "Remember the async coffee shop: one barista (one thread) takes your order, starts the espresso machine, and *while it pulls the shot* takes the next customer's order instead of standing frozen watching the drip. That barista is the [[Event Loop]]. `await` is the moment the barista hands work to the machine and turns to help someone else. This is true in Node. It is true, character for character in spirit, in Python. You are not learning a new idea — you are re-labelling one you already have." },
        { type: 'p', text: "So this lesson has two jobs. First: map JS async onto Python async (it takes about ten minutes because they're nearly identical). Second: use that to make real HTTP calls and, finally, real LLM calls in Python — proving that the *message shape you learned in Module 2 is identical*; only the language around it changed." },
      ],
    },
    {
      id: 'the-map',
      title: 'The phrasebook: JS async → Python async',
      blocks: [
        { type: 'p', text: "Here is the entire translation, side by side. If you squint, it's the same code with different keywords. `async function` becomes `async def`. `await` stays `await` (they even kept the word). `Promise.all` becomes `asyncio.gather`. The one genuinely new thing is the **entry point** — how you *start* the loop — because Python doesn't run inside an always-on event loop the way a browser or Node process does." },
        { type: 'table', headers: ['JavaScript', 'Python', 'What it does'], rows: [
          ['`async function main() {}`', '`async def main():`', 'Declares a coroutine — a pausable function'],
          ['`await fetch(url)`', '`await client.get(url)`', 'Pause until the awaited I/O resolves'],
          ['`Promise.all([a, b, c])`', '`asyncio.gather(a, b, c)`', 'Run awaitables concurrently, wait for all'],
          ['(top-level `await` / auto-run)', '`asyncio.run(main())`', 'Boot the event loop and run to completion'],
          ['`new Promise(...)`', '`asyncio.Future` / coroutine', 'A value that will exist later'],
          ['`setTimeout(fn, ms)` (sleep-ish)', '`await asyncio.sleep(seconds)`', 'Non-blocking pause (note: **seconds**, not ms)'],
        ] },
        { type: 'diagram', id: 'py-async-model', caption: "One thread, one loop, many paused tasks. Identical to Node's model — `asyncio.run` is just the ignition switch that JS starts for you automatically." },
        { type: 'h', text: 'The one real gotcha: asyncio.run() is your entry point' },
        { type: 'p', text: "In the browser or a modern Node file, an event loop is *already running* — you can sometimes just `await` at the top level and things work. Python is more explicit: your `async def` functions are **coroutines**, and a coroutine does nothing until a running loop drives it. Calling `main()` by itself just creates a coroutine object and *doesn't run it* (a classic first-day bug — Python will even warn you \"coroutine was never awaited\"). `asyncio.run(main())` is the ignition: it starts the loop, runs your coroutine to completion, and shuts the loop down." },
        { type: 'code', lang: 'python', filename: 'hello_async.py', code: `import asyncio

async def greet(name):
    await asyncio.sleep(1)          # non-blocking: loop runs others meanwhile
    return f"Hello, {name}"

async def main():
    msg = await greet("Ada")        # await pauses HERE, frees the loop
    print(msg)

asyncio.run(main())                 # <-- the entry point. Boots the loop.`, caption: 'The whole shape of an async Python program. `asyncio.run(main())` is the only line without a JS twin — it starts the loop your browser/Node kept running for you.' },
        { type: 'callout', variant: 'warn', title: 'The #1 beginner mistake', text: "Writing `main()` instead of `asyncio.run(main())`. In JS, calling an async function *starts* it (it returns a Promise that's already executing). In Python, calling a coroutine function returns an inert coroutine object that runs **only** when a loop awaits it. If your async code \"does nothing\" and you see a `RuntimeWarning: coroutine 'main' was never awaited`, this is why." },
      ],
    },
    {
      id: 'why-async',
      title: 'When async actually earns its keep (and the GIL)',
      blocks: [
        { type: 'p', text: "Async is not free complexity you sprinkle everywhere. It pays off in exactly one situation, the same one as in JS: **concurrent I/O.** When your program spends its time *waiting* — for a network response, a database, a file, an LLM — async lets one thread keep dozens of those waits in flight at once instead of serially. Three LLM calls that each take 2 seconds run in ~2 seconds concurrently, not 6 seconds one-after-another." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: laundromat, not a single machine', text: "You have three loads of laundry, each a 40-minute wash. Sync is one machine: 120 minutes, staring at each cycle. Async is three machines started back-to-back: you kick all three off, then wait once — ~40 minutes total. The *work* (the washing) isn't faster; you just stopped *waiting serially*. LLM API calls are the laundry: the model does the work on a server, your program is just waiting for the response. That waiting is what async collapses." },
        { type: 'h', text: 'The GIL, in one breath' },
        { type: 'p', text: "Here's the thing a JS dev must know before trusting Python concurrency. Python has a [[GIL]] (Global Interpreter Lock): a lock that lets **only one thread execute Python bytecode at a time.** The practical upshot is simple and worth memorizing: **Python async gives you I/O concurrency, not CPU parallelism.** For waiting on 100 API calls — perfect, the GIL is released during I/O waits, everything overlaps. For crunching a giant matrix in pure Python across cores — async won't help you, and neither will threads; that needs multiprocessing or native libraries (NumPy, PyTorch) that drop out of the GIL into C." },
        { type: 'callout', variant: 'info', title: 'Why you rarely feel the GIL as an AI engineer', text: "Your bottleneck is almost always the network (waiting on the model's server) or a native library (NumPy/PyTorch already run their heavy math in C, outside the GIL). Both are exactly where the GIL *doesn't* hurt you. So the honest summary: reach for `asyncio` to overlap many API calls; reach for NumPy/PyTorch for heavy math; you'll rarely think about the GIL again." },
        { type: 'table', headers: ['Your workload', 'Right tool', 'Why'], rows: [
          ['Many API / LLM calls (waiting)', '`asyncio` + async HTTP', 'I/O-bound: waits overlap, GIL released during I/O'],
          ['Heavy pure-Python number crunching', 'NumPy / PyTorch (or multiprocessing)', 'CPU-bound: native code sidesteps the GIL'],
          ['One occasional API call', 'plain sync `requests`', "Async overhead isn't worth it for a single wait"],
        ] },
      ],
    },
    {
      id: 'making-requests',
      title: 'Making HTTP requests: requests (sync) vs httpx (async)',
      blocks: [
        { type: 'p', text: "Before LLM SDKs, the raw skill is making HTTP calls — the Python equivalent of `fetch()`. There are two libraries you'll meet constantly. **`requests`** is the classic synchronous one: dead simple, blocking, perfect for a script that makes one call and prints it. **`httpx`** is the modern one with a near-identical API that *also* speaks async — it's `fetch()` with an `await` in front. Same concepts you know: a method, a URL, headers, a JSON body, a response you parse." },
        { type: 'code', lang: 'python', filename: 'sync_request.py', code: `import requests   # pip install requests

# Synchronous: blocks the whole thread until the response comes back.
resp = requests.get("https://api.example.com/users/42")
data = resp.json()          # like  await response.json()  in JS
print(resp.status_code)     # 200
print(data["name"])`, caption: 'The sync version with `requests`. One call, blocking, minimal ceremony — the right tool for a simple script.' },
        { type: 'code', lang: 'python', filename: 'async_request.py', code: `import asyncio
import httpx       # pip install httpx

async def fetch_user(client, user_id):
    # await = the same "pause until the network replies" you know from JS
    resp = await client.get(f"https://api.example.com/users/{user_id}")
    return resp.json()

async def main():
    async with httpx.AsyncClient() as client:   # reuse one connection pool
        user = await fetch_user(client, 42)
        print(user["name"])

asyncio.run(main())`, caption: 'The async version with `httpx`. Structurally this is your JS fetch code — `async with` just guarantees the client (and its connections) gets cleaned up, like a try/finally.' },
        { type: 'callout', variant: 'tip', text: "`async with httpx.AsyncClient() as client:` is the idiomatic pattern: create one client, reuse it for every request inside the block, and it auto-closes when the block exits. It reuses TCP connections across calls (a real speedup) and is the direct analog of keeping one configured `fetch` wrapper instead of re-creating it per call." },
        { type: 'h', text: 'The real payoff: gather, the Promise.all of Python' },
        { type: 'p', text: "Now the concurrency win. In JS you'd write `await Promise.all([...])` to fire N requests at once. In Python it's `await asyncio.gather(...)`. You build a *list of coroutines* (calling an `async def` without awaiting it — remember, that just creates the coroutine, it doesn't run yet), then hand them all to `gather`, which drives them concurrently and returns their results **in order**, exactly like `Promise.all`." },
        { type: 'code', lang: 'python', filename: 'gather_three.py', code: `import asyncio
import httpx

async def fetch_user(client, user_id):
    resp = await client.get(f"https://api.example.com/users/{user_id}")
    return resp.json()

async def main():
    async with httpx.AsyncClient() as client:
        # Build 3 coroutines (NOT yet running), then run them concurrently.
        results = await asyncio.gather(
            fetch_user(client, 1),
            fetch_user(client, 2),
            fetch_user(client, 3),
        )
        # results is a list, in the SAME order you passed them (like Promise.all)
        for user in results:
            print(user["name"])

asyncio.run(main())`, caption: 'Three requests, ~one request of wall-clock time. `asyncio.gather` == `Promise.all`: concurrent, order-preserving, one await for all of them.' },
        { type: 'callout', variant: 'warn', title: 'gather vs a loop of awaits', text: "Writing `for id in ids: await fetch_user(client, id)` runs them **serially** — each `await` fully finishes before the next starts (3× the time). That's the equivalent of `for` + `await` in JS instead of `Promise.all`. To get concurrency you must create the coroutines first and hand them to `gather` (or `Promise.all`) together. Same trap, both languages." },
      ],
    },
    {
      id: 'llm-in-python',
      title: 'The payoff: the Module 2 LLM call, now in Python',
      blocks: [
        { type: 'p', text: "This is the whole reason we came. In Module 2 you called Claude with a POST request and a `messages` array. Here is that *identical concept* through the official Python SDK. Look closely at the body: `model`, `max_tokens`, `messages: [{ role, content }]`. **It is byte-for-byte the same shape you already learned.** The SDK is just a typed convenience wrapper over the same HTTP call — the wire format didn't change, only the language holding it." },
        { type: 'code', lang: 'python', filename: 'llm_call.py', code: `import asyncio
from anthropic import AsyncAnthropic   # pip install anthropic

# Key comes from the ANTHROPIC_API_KEY env var by default — never hardcode it.
client = AsyncAnthropic()

async def ask(prompt):
    resp = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        messages=[
            {"role": "user", "content": prompt},   # <-- the SAME shape as Module 2
        ],
    )
    return resp.content[0].text                     # <-- content is an array, again

async def main():
    answer = await ask("Explain an event loop in one sentence.")
    print(answer)

asyncio.run(main())`, caption: 'The Module 2 call in Python. `messages: [{role, content}]`, `content[0].text`, `usage` on the response — the concepts transferred 1:1. Only `fetch` → `client.messages.create` and `{}` → `dict` changed.' },
        { type: 'callout', variant: 'info', title: 'Anthropic and OpenAI: same story', text: "The OpenAI Python SDK mirrors this exactly: `from openai import AsyncOpenAI`, then `await client.chat.completions.create(model=..., messages=[{\"role\": \"user\", \"content\": ...}])`, text at `resp.choices[0].message.content`. Two dialects, same skeleton — precisely the split you learned in Module 2. Both ship a sync client too (`Anthropic()` / `OpenAI()`) for simple scripts where you don't need concurrency." },
        { type: 'h', text: 'Where async pays off: three prompts, concurrently' },
        { type: 'p', text: "Now combine everything. You have three prompts to run. Serially that's three round-trips of waiting. With `asyncio.gather` — the same tool as the HTTP example — you fire all three LLM calls at once and wait a single time. This is the everyday shape of production AI code: batching independent model calls to cut latency." },
        { type: 'code', lang: 'python', filename: 'three_prompts.py', code: `import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def ask(prompt):
    resp = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text

async def main():
    prompts = [
        "Summarize async/await in one sentence.",
        "Name one thing the GIL prevents.",
        "What does asyncio.gather do?",
    ]
    # Three coroutines -> gather -> ~one call's worth of wall-clock time.
    answers = await asyncio.gather(*(ask(p) for p in prompts))
    for prompt, answer in zip(prompts, answers):
        print(f"Q: {prompt}\\n   {answer}\\n")

asyncio.run(main())`, caption: 'Three LLM calls concurrently. `*(ask(p) for p in prompts)` builds the coroutine list from a generator and unpacks it into `gather` — the Python idiom for "Promise.all over an array".' },
        { type: 'callout', variant: 'tip', text: "The `*` in `gather(*(...))` is unpacking — it spreads the generator of coroutines into positional arguments, the way `Promise.all(prompts.map(ask))` spreads an array. If you already have a list, `asyncio.gather(*coros)` is the standard move." },
      ],
    },
    {
      id: 'playground',
      title: 'Feel it: the async pattern you already know',
      blocks: [
        { type: 'p', text: "Only JavaScript runs in this sandbox, so here's the trick: the async *pattern* is identical across both languages, so we'll exercise it in JS with the simulated `llm()` you know — streaming and concurrent calls — while the Python SDK code above shows the one-to-one translation. Run it, watch tokens stream, then do the exercise. Every concept here (`await`, firing calls concurrently, `Promise.all`) has the exact Python twin from this lesson (`await`, `asyncio.gather`)." },
        { type: 'playground', id: 'async-lab', title: 'Streaming + concurrent calls (JS ↔ Python twins)', height: 380, lang: 'javascript', code: `// The async model is identical in Python. JS twins shown in comments.

// 1) A single awaited call  ==  Python:  await client.messages.create(...)
console.log("=== one call, awaited ===")
const one = await llm("Explain an event loop in one sentence.")
console.log(one)

// 2) THREE calls concurrently  ==  Python:  await asyncio.gather(a, b, c)
console.log("\\n=== three calls concurrently (Promise.all == asyncio.gather) ===")
const prompts = [
  "Summarize async/await in one sentence.",
  "Name one thing the GIL prevents.",
  "What does asyncio.gather do?",
]
const t0 = Date.now()
const answers = await Promise.all(prompts.map(p => llm(p)))   // fire all, wait once
answers.forEach((a, i) => console.log((i + 1) + ". " + a))
console.log("\\nAll three finished in", Date.now() - t0, "ms (concurrent, not serial)")`, solution: `// Solution: compare SERIAL vs CONCURRENT to feel why gather/Promise.all matters.
const prompts = [
  "Summarize async/await in one sentence.",
  "Name one thing the GIL prevents.",
  "What does asyncio.gather do?",
]

// SERIAL: a for-loop of awaits  ==  Python:  for p in prompts: await ask(p)
console.log("=== SERIAL (for + await) ===")
let t0 = Date.now()
for (const p of prompts) {
  await llm(p)                       // each finishes before the next starts
}
console.log("Serial time:", Date.now() - t0, "ms\\n")

// CONCURRENT: Promise.all  ==  Python:  await asyncio.gather(*coros)
console.log("=== CONCURRENT (Promise.all == asyncio.gather) ===")
t0 = Date.now()
await Promise.all(prompts.map(p => llm(p)))   // fire all at once, wait once
console.log("Concurrent time:", Date.now() - t0, "ms")
console.log("\\nSame API calls. The only change is WHEN you wait — that's the whole win.")`, caption: '**Exercise:** rewrite the concurrent block as a *serial* `for`-loop of `await`s and log the time difference. That gap — serial vs concurrent — is exactly what `asyncio.gather` buys you in Python. Solution button has it.' },
        { type: 'callout', variant: 'info', text: "Mapping back to Python: `await llm(p)` ⇄ `await ask(p)`; `Promise.all(prompts.map(llm))` ⇄ `asyncio.gather(*(ask(p) for p in prompts))`; the whole script's ignition ⇄ `asyncio.run(main())`. If the JS feels natural, the Python already does too." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your async Python script prints nothing and warns "coroutine \'main\' was never awaited." The bug?',
            options: [
              'You forgot to `import asyncio`',
              'You called `main()` instead of `asyncio.run(main())` — the coroutine was created but never driven by a loop',
              'httpx isn\'t installed',
              'The GIL blocked the output',
            ],
            answer: 1,
            explain: 'Calling a coroutine function in Python returns an inert coroutine object; it runs only when a loop awaits it. `asyncio.run(main())` boots the loop and drives it. This is the single most common first-day async bug.',
          },
          {
            q: 'You need to run 50 independent LLM calls as fast as possible. Best approach?',
            options: [
              'A `for` loop with `await` inside — clean and readable',
              'Build 50 coroutines and `await asyncio.gather(*coros)` so the waits overlap',
              'Use multiprocessing to spread them across CPU cores',
              'Nothing helps — the GIL forces them to run one at a time',
            ],
            answer: 1,
            explain: 'These are I/O-bound (waiting on a server), so async concurrency wins: `gather` overlaps all 50 waits into roughly one call\'s time. A for-loop of awaits runs them serially (50×). The GIL is released during I/O, so it doesn\'t bottleneck you here; multiprocessing is for CPU-bound work.',
          },
          {
            q: 'What does the GIL mean for you as an AI engineer, practically?',
            options: [
              'Python can never do two things at once, ever',
              'Python async gives I/O concurrency (overlapping waits) but not CPU parallelism across cores in pure Python',
              'You must use multiprocessing for every API call',
              'Async is pointless in Python',
            ],
            answer: 1,
            explain: 'The GIL lets only one thread run Python bytecode at a time. It\'s released during I/O waits, so `asyncio` happily overlaps network calls. It only bites on CPU-bound pure-Python work — which is why heavy math lives in NumPy/PyTorch (C, outside the GIL).',
          },
          {
            q: 'In the Python SDK call `client.messages.create(model=..., max_tokens=..., messages=[{"role":"user","content": prompt}])`, what should feel familiar?',
            options: [
              'Nothing — Python SDKs use a totally different request shape',
              'The message shape is identical to Module 2\'s HTTP body; only `fetch` → `client.messages.create` and `{}` → `dict` changed',
              'Python requires a different field called `prompt` instead of `messages`',
              'You must manually set the Authorization header on every call',
            ],
            answer: 1,
            explain: 'The SDK is a typed wrapper over the same wire format. `messages: [{role, content}]`, `max_tokens`, `content[0].text` on the response — all identical to Module 2. The concepts transfer 1:1; the SDK just handles auth (from the env var), retries, and types for you.',
          },
          {
            q: 'Which is the correct Python twin of `await Promise.all(urls.map(fetch))`?',
            options: [
              'A `for` loop: `for u in urls: await client.get(u)`',
              '`asyncio.run(client.get(u))` for each url',
              '`await asyncio.gather(*(client.get(u) for u in urls))`',
              '`Promise.all(client.get(u) for u in urls)`',
            ],
            answer: 2,
            explain: '`asyncio.gather` is the Python `Promise.all`: build the coroutines, unpack them with `*`, and await them together for concurrent, order-preserving results. The for-loop version runs serially; `Promise.all` doesn\'t exist in Python.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l5-c1', front: 'JS `async function` / `await` in Python?', back: '`async def` / `await` — same event-loop model, same keywords (they kept `await`). A coroutine is a pausable function, just like a JS async function.' },
          { id: 'm4-l5-c2', front: 'What is `asyncio.run(main())` and why is it needed?', back: "The entry point that boots the event loop, runs your top coroutine to completion, and shuts down. Python has no always-on loop like the browser/Node, so you start it explicitly." },
          { id: 'm4-l5-c3', front: 'Python equivalent of `Promise.all`?', back: '`asyncio.gather(*coros)` — runs awaitables concurrently and returns results in order. `for` + `await` runs them serially (N× slower).' },
          { id: 'm4-l5-c4', front: 'What does the GIL mean in one line?', back: 'Only one thread runs Python bytecode at a time → async gives you I/O concurrency (overlapping waits) but NOT CPU parallelism in pure Python. Released during I/O and inside NumPy/PyTorch.' },
          { id: 'm4-l5-c5', front: 'requests vs httpx?', back: '`requests` = classic synchronous (blocking) HTTP, great for simple scripts. `httpx` = modern, near-identical API that also does async (`await client.get(...)`) — `fetch()` with an `await`.' },
          { id: 'm4-l5-c6', front: 'The Module 2 LLM call in Python?', back: '`await client.messages.create(model=..., max_tokens=..., messages=[{"role":"user","content":...}])`, text at `resp.content[0].text`. Same shape as the HTTP body — the SDK just wraps the wire format.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Python async is the same event-loop model as JS: `async def`/`await`, coroutines that pause on I/O — different spelling, identical concepts.',
          '`asyncio.run(main())` is the one new piece: it starts the loop Python doesn\'t keep running for you. Calling `main()` alone does nothing.',
          '`asyncio.gather(*coros)` is `Promise.all` — concurrent, order-preserving. A `for`-loop of `await`s runs serially.',
          'The GIL means async buys I/O concurrency (overlapping many API waits), not CPU parallelism — which is exactly what an AI engineer needs.',
          'The official Python SDK call uses the SAME `messages` shape as Module 2; the wire format didn\'t change, only the language.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Calling the coroutine instead of running it', text: 'Writing `main()` (or `ask(prompt)`) and expecting it to execute. In Python that only creates a coroutine object; it runs when a loop awaits it. Use `asyncio.run(main())` at the top, and `await` (or `gather`) inside. Watch for the "never awaited" warning.' },
          { title: 'A for-loop of awaits when you wanted concurrency', text: '`for p in prompts: await ask(p)` runs your calls one at a time — 3 prompts take 3× as long. To overlap them, build the coroutines and pass them to `asyncio.gather` together (the same trap as `for`+`await` vs `Promise.all` in JS).' },
          { title: 'Reaching for async on CPU-bound work', text: 'Async does nothing for heavy pure-Python computation — the GIL still serializes bytecode. If you\'re crunching numbers, use NumPy/PyTorch (native, outside the GIL) or multiprocessing. Async is for waiting, not computing.' },
          { title: 'Hardcoding the API key in the script', text: 'The SDKs read `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` from the environment for a reason. Hardcoding it (especially in a file you might commit) is the same key-leak disaster from Module 2 — just in Python now. Keep it in the env, out of git.' },
        ] },
        { type: 'interview', items: [
          { q: '"You know JS async. Explain how Python\'s asyncio differs."', a: 'Conceptually it doesn\'t — same single-threaded event loop, `async`/`await`, coroutines that yield on I/O. The differences are surface: you declare `async def`, and crucially you must start the loop yourself with `asyncio.run(main())` because Python isn\'t already running one like a browser or Node process. `Promise.all` becomes `asyncio.gather`. And the GIL means asyncio is strictly for I/O concurrency, not CPU parallelism — which is fine, because that\'s what API-heavy code needs.' },
          { q: '"When would you use async in a Python AI service, and when not?"', a: 'Async when I\'m I/O-bound and want to overlap waits: many concurrent LLM calls, fanning out to several APIs, high-throughput request handling. I\'d use `httpx` + `asyncio.gather` to batch independent model calls and cut latency. Not for CPU-bound work — the GIL serializes pure-Python compute, so heavy math goes to NumPy/PyTorch or multiprocessing. And for a one-off script that makes a single call, plain sync `requests` or the sync SDK client is simpler and totally fine.' },
          { q: '"How does calling an LLM in Python compare to the raw HTTP call you\'d write in JS?"', a: 'The request is the same object either way: model, max_tokens, and a `messages` array of `{role, content}`. In JS I\'d POST that JSON with fetch; in Python the official SDK exposes `client.messages.create(...)` with those exact fields, reads text from `resp.content[0].text`, and gives me `usage` for cost. The SDK adds types, auth from the env var, and automatic retries, but it\'s sugar over the identical wire format — so debugging skills and the mental model transfer straight across.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Batch enrichment pipelines', text: 'Classifying or summarizing thousands of records: fire N LLM calls with `asyncio.gather` in controlled batches to process a dataset in minutes instead of hours of serial waiting.' },
          { title: 'Fan-out / aggregate agents', text: 'Ask several models (or the same model with different prompts) concurrently and merge the answers — ensembles, self-consistency, multi-tool lookups — all riding on `gather`.' },
          { title: 'High-throughput API backends', text: 'FastAPI (async-native) services that handle many simultaneous user requests, each awaiting an LLM, without blocking a thread per request — the standard shape of a production AI backend.' },
          { title: 'Concurrent RAG retrieval', text: 'A single query that hits a vector DB, a keyword search, and a web API at once with `httpx` + `gather`, then feeds the combined context to the model — the retrieval half of a RAG system (Module 6).' },
        ] },
        { type: 'project', title: 'Concurrent prompt runner', goal: 'Write an async Python script that answers three prompts concurrently through the official SDK and prints each result — proving to yourself that the JS async model transferred whole.', steps: [
          'Set up: `pip install anthropic` (or `openai`), and put your key in the `ANTHROPIC_API_KEY` env var — never in the file.',
          'Write an `async def ask(prompt)` that awaits `client.messages.create(...)` with `model`, `max_tokens`, and a one-message `messages` array, returning `resp.content[0].text`.',
          'In `async def main()`, define a list of 3 prompts and run them with `await asyncio.gather(*(ask(p) for p in prompts))`.',
          'Print each prompt with its answer (`zip(prompts, answers)`), and time the whole run with `time.perf_counter()` around the gather.',
          'Add a serial version (a `for`-loop of `await ask(p)`) behind a `--serial` flag and print both timings — see the concurrency win with your own eyes.',
        ], deliverable: 'A `runner.py` that runs 3 prompts concurrently by default, prints answers + total time, and (with `--serial`) shows the slower serial timing for comparison. Key stays in the env.' },
        { type: 'challenge', title: 'Add exponential backoff', text: 'Real API calls hit rate limits (429) and transient errors. Wrap your `ask()` from the project in an async retry with exponential backoff (recall Lesson 2.8): on a retryable error, wait, retry, and double the wait each time — up to a cap. Prove it still runs all three prompts concurrently under `gather`.', hints: [
          'Backoff delay per attempt: `base * (2 ** attempt)` seconds, and use `await asyncio.sleep(delay)` — the non-blocking sleep, so other coroutines keep running while this one waits.',
          'Add a little jitter (`+ random.uniform(0, base)`) so many retrying calls don\'t all wake at the same instant (the thundering-herd problem).',
          'Catch only *retryable* failures (e.g. the SDK\'s RateLimitError / status 429 and 5xx); re-raise everything else immediately, and give up after a max attempt count.',
        ] },
        { type: 'reading', links: [
          { label: 'Python docs: asyncio', url: 'https://docs.python.org/3/library/asyncio.html', note: 'The official reference. Start with the "Coroutines and Tasks" page — `run`, `gather`, `sleep` are all there.' },
          { label: 'httpx documentation', url: 'https://www.python-httpx.org/', note: 'The modern HTTP client. See "Async Support" for the `AsyncClient` pattern used in this lesson.' },
          { label: 'Anthropic Python SDK (GitHub)', url: 'https://github.com/anthropics/anthropic-sdk-python', note: 'The official SDK: `AsyncAnthropic`, `messages.create`, retries, and streaming. (OpenAI\'s is at github.com/openai/openai-python — same skeleton.)' },
        ] },
      ],
    },
  ],
}
