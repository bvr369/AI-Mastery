// Lesson 4.3 — Functions, Classes & Modules

export default {
  sections: [
    {
      id: 'functions',
      title: 'Functions: def is just function with a colon',
      blocks: [
        { type: 'p', text: "You have written thousands of functions. Python does not change *what* a function is — a named, reusable block that takes inputs and returns an output — it only changes the spelling. `function` becomes `def`, the `{ }` braces become a colon and indentation, and `return` is exactly `return`. That is 90% of it. The other 10% is where Python is genuinely *better* than JavaScript, and this lesson is about spending your energy there instead of on the boring syntax swap." },
        { type: 'code', lang: 'python', filename: 'functions.py', code: `def greet(name):
    return f"Hi {name}"

print(greet("Ada"))        # -> Hi Ada` , caption: 'A whole function. Colon, indent, return. The f-string (f"...{expr}...") is Python’s template literal.' },
        { type: 'callout', variant: 'analogy', title: 'Analogy: same recipe, different measuring cups', text: "A JS function and a Python function are the same recipe written in two cookbooks. One measures in cups (`{ }`), the other in grams (indentation). The dish is identical — a value goes in, a value comes out. Do not re-learn cooking; just learn to read grams." },
        { type: 'h', text: 'Default arguments — you already know these' },
        { type: 'p', text: "Default parameters work just like modern JS: put the default right in the signature. If the caller omits the argument, the default fills in." },
        { type: 'code', lang: 'python', filename: 'defaults.py', code: `def make_call(prompt, model="claude-sonnet-5", max_tokens=300):
    return f"{model} <- {prompt!r} (cap {max_tokens})"

make_call("hello")                       # uses both defaults
make_call("hello", "claude-opus-5")      # override model, keep max_tokens`, caption: 'Defaults read left to right, exactly like JS `function f(a, b = 2)`.' },
        { type: 'callout', variant: 'warn', title: 'The one default-argument trap', text: "Never use a *mutable* value (a list or dict) as a default: `def add(item, bucket=[])`. Python creates that list **once**, at definition time, and every call without `bucket` shares the same list — a classic bug that does not exist in JS. The fix is the idiom `def add(item, bucket=None): bucket = bucket or []`. Memorize this one; interviewers love it." },
        { type: 'h', text: 'Keyword arguments — the superpower JS does not have' },
        { type: 'p', text: "Here is the first place Python beats JavaScript outright. When you *call* a function, you can pass arguments **by name**, in any order. In JS you fake this with an options object (`fetch(url, { method, headers })`); in Python it is built into the language for every function." },
        { type: 'code', lang: 'python', filename: 'kwargs.py', code: `def make_call(prompt, model="claude-sonnet-5", max_tokens=300, temperature=0.7):
    ...

# Pass by name, in ANY order — self-documenting at the call site:
make_call("summarize this", temperature=0.2, max_tokens=1000)

# You skipped 'model' entirely and reordered the rest. Try that in JS.`, caption: 'Keyword arguments make call sites read like configuration. No options-object boilerplate.' },
        { type: 'callout', variant: 'tip', text: "This is why Python is the [[LLM]] ecosystem's native tongue: API wrappers like `client.messages.create(model=..., max_tokens=..., temperature=...)` are *just keyword arguments*. When you see that in `openai` or `anthropic` code, it is the exact feature above — no magic." },
        { type: 'h', text: '*args and **kwargs = rest and spread' },
        { type: 'p', text: "You know `function f(...args)` (collect extra positional args into an array) and `f(...arr)` (spread an array into arguments). Python has the same two operations with punchier syntax: `*args` collects extra *positional* arguments into a tuple, and `**kwargs` collects extra *keyword* arguments into a dict." },
        { type: 'table', headers: ['JavaScript', 'Python', 'What it does'], rows: [
          ['`function f(...args)`', '`def f(*args)`', 'Collect extra positional args (JS array → Py tuple)'],
          ['`f(...arr)`', '`f(*arr)`', 'Spread a list into positional arguments'],
          ['`{ ...obj }` (roughly)', '`def f(**kwargs)`', 'Collect extra *named* args into a dict'],
          ['`f({ ...opts })`', '`f(**opts)`', 'Spread a dict into keyword arguments'],
        ] },
        { type: 'code', lang: 'python', filename: 'star_args.py', code: `def log_all(*args, **kwargs):
    print("positional:", args)     # a tuple: (1, 2, 3)
    print("named:", kwargs)        # a dict: {'level': 'warn'}

log_all(1, 2, 3, level="warn")

# Spreading works too — the mirror image:
opts = {"model": "claude-opus-5", "max_tokens": 500}
make_call("go", **opts)            # like f({ ...opts }) in JS`, caption: 'One star = positional (tuple). Two stars = keyword (dict). Same mental model as rest/spread.' },
        { type: 'h', text: 'Type hints — optional docs that pay rent' },
        { type: 'p', text: "Python is dynamically typed like JS, but you can *annotate* types. Crucially, these are **hints, not enforcement** — Python does not check them at runtime (they are closer to JSDoc than to TypeScript). But your editor, linters, and tools like `mypy` read them, and every serious AI codebase uses them. Think of `: str` and `-> int` as free documentation that your IDE turns into autocomplete." },
        { type: 'code', lang: 'python', filename: 'hints.py', code: `def truncate(text: str, limit: int = 100) -> str:
    return text[:limit]

# Param types after a colon, return type after ->.
# Nothing crashes if you pass the wrong type — but your editor warns you,
# and mypy will fail CI. It's TypeScript's discipline, opt-in.`, caption: 'Type hints are the closest Python gets to TypeScript, minus the compile step.' },
      ],
    },
    {
      id: 'map',
      title: 'The map: same ideas, new spelling',
      blocks: [
        { type: 'p', text: "Before we go deeper, anchor the whole lesson in one picture. Everything you write in JavaScript has a Python twin — the *concept* is identical, only the surface changes. Functions, classes, and modules are the three rows that matter most for this lesson." },
        { type: 'diagram', id: 'js-py-map', caption: 'The three rows to burn in: `function → def`, `class · this → class · self`, `npm → pip`. The rest is punctuation.' },
        { type: 'callout', variant: 'info', text: "Notice what is *not* on this map: any new computer-science idea. You are not learning to program again. You are learning a dialect. That reframe — dialect, not language — is the fastest path from React dev to fluent Python, and it is why this module moves quickly." },
      ],
    },
    {
      id: 'classes',
      title: 'Classes: self is just this, spelled out loud',
      blocks: [
        { type: 'p', text: "Python classes will feel deeply familiar and slightly weird at the same time. Familiar: `class`, a constructor, methods, instances. Weird: the constructor is named `__init__`, and every method's first parameter is `self` — the Python equivalent of `this`, except **you have to type it out**. That is the single biggest 'huh?' for JS developers, so let us kill it first." },
        { type: 'code', lang: 'python', filename: 'token_budget.py', code: `class TokenBudget:
    def __init__(self, cap):        # the constructor
        self.cap = cap             # like this.cap = cap
        self.used = 0

    def spend(self, tokens):        # a method — note 'self' first
        self.used += tokens
        return self.remaining()

    def remaining(self):
        return self.cap - self.used


budget = TokenBudget(1000)          # no 'new' keyword!
budget.spend(300)
print(budget.remaining())           # -> 700`, caption: 'A real class: __init__ sets up state, methods read/write self. You call it without `new`.' },
        { type: 'h', text: 'self vs this — the explicit/implicit split' },
        { type: 'p', text: "In JavaScript, `this` is *implicit* — it appears inside methods by magic (and, famously, sometimes the wrong magic, which is why you reach for arrow functions and `.bind()`). Python made a design choice: the instance is passed **explicitly** as the first parameter, by convention named `self`. When you call `budget.spend(300)`, Python quietly rewrites it as `TokenBudget.spend(budget, 300)` — `budget` slides into `self`." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the waiter who says their own name', text: "JS `this` is a waiter who assumes you know who they are — usually fine, occasionally you get the wrong person mid-shift (the classic `this` rebinding bug). Python's `self` is a waiter who introduces themselves at every table: `Hi, I'm self, I'll be your instance today.` More words, zero confusion. Python trades a little verbosity for never having a `this`-binding bug again." },
        { type: 'table', headers: ['JavaScript', 'Python', 'Note'], rows: [
          ['`class Dog {}`', '`class Dog:`', 'Same keyword, colon instead of braces'],
          ['`constructor(name)`', '`def __init__(self, name)`', 'The constructor has a fixed dunder name'],
          ['`this.name`', '`self.name`', '`this` is implicit; `self` is an explicit parameter'],
          ['`new Dog("Rex")`', '`Dog("Rex")`', 'Python has no `new` keyword'],
          ['`bark() { ... }`', '`def bark(self): ...`', 'Every method takes `self` as arg one'],
        ] },
        { type: 'h', text: 'No real private — just an honor system' },
        { type: 'p', text: "JS has true private fields with `#count`. Python has **nothing enforced**. Instead there is a convention: a leading underscore (`self._used`) means “internal, please do not touch.” It is a polite sign, not a locked door — any code *can* reach in, it just signals it *should not*. (There is also a double-underscore `__x` that does mild name-mangling, but it is rarely what you want. Reach for the single underscore.)" },
        { type: 'code', lang: 'python', filename: 'convention.py', code: `class Session:
    def __init__(self):
        self.id = "abc"       # public, part of the API
        self._token = "secret"  # _leading underscore = "internal, hands off"

s = Session()
print(s.id)        # fine
print(s._token)    # works, but you're breaking the honor system`, caption: 'A single leading underscore is Python’s "#private" — enforced by peer pressure, not the runtime.' },
        { type: 'h', text: 'Dunder methods — hooks with double-underscore names' },
        { type: 'p', text: "You have already met one dunder: `__init__`. “Dunder” = **d**ouble **under**score. These are Python’s hook methods — implement one and the language wires your object into a built-in operator or function. It is the same idea as JS's `Symbol.iterator` or `toString()`, just far more of them and with a naming pattern." },
        { type: 'table', headers: ['You write', 'Python calls it when you...', 'JS cousin'], rows: [
          ['`__init__`', 'Construct the object', '`constructor`'],
          ['`__str__`', '`print(obj)` / `str(obj)`', '`toString()`'],
          ['`__len__`', '`len(obj)`', '`.length` (roughly)'],
          ['`__eq__`', 'Compare with `==`', '`valueOf` / custom equals'],
        ] },
        { type: 'code', lang: 'python', filename: 'dunder.py', code: `class TokenBudget:
    def __init__(self, cap):
        self.cap, self.used = cap, 0

    def __str__(self):                    # controls print(budget)
        return f"TokenBudget({self.used}/{self.cap})"

    def __len__(self):                    # controls len(budget)
        return self.cap - self.used       # remaining tokens

b = TokenBudget(1000)
b.used = 250
print(b)         # -> TokenBudget(250/1000)   (uses __str__)
print(len(b))    # -> 750                      (uses __len__)`, caption: 'Implement a dunder, get language-level integration for free. This is idiomatic, everyday Python.' },
      ],
    },
    {
      id: 'modules',
      title: 'Modules & imports: the file IS the module',
      blocks: [
        { type: 'p', text: "In JavaScript's ES modules you explicitly `export` what other files may use and `import` it by name. Python's model is simpler and, at first, surprising: **every `.py` file is automatically a module, and every top-level name in it is importable.** There is no `export` keyword. You wrote a name at the top level? It is exported. Import it and go." },
        { type: 'table', headers: ['JavaScript (ESM)', 'Python', 'Meaning'], rows: [
          ['`import { sum } from "./math.js"`', '`from math_utils import sum`', 'Named import'],
          ['`import math from "./math.js"`', '`import math_utils`', 'Import the whole module (namespace)'],
          ['`import { sum as add }`', '`from math_utils import sum as add`', 'Rename on import'],
          ['`export const PI = 3.14`', '`PI = 3.14`', 'No `export` — top-level names are public'],
        ] },
        { type: 'code', lang: 'python', filename: 'imports.py', code: `# Two flavors, both common:

import math                 # whole module -> use math.sqrt(2)
from math import sqrt       # pull one name -> use sqrt(2) directly
from math import sqrt as rt # rename it    -> use rt(2)

# 'import math' keeps the namespace (clearer origin);
# 'from math import sqrt' is terser. Teams pick a style and stick to it.`, caption: '`import x` keeps the namespace; `from x import y` lifts a name out. Same trade-off as JS default vs named imports.' },
        { type: 'callout', variant: 'info', text: "A **package** is just a folder of modules (in modern Python, any folder you import from). `from anthropic import Anthropic` means “in the `anthropic` package, find the `Anthropic` name.” Same folder-of-files idea as an npm package's `dist/` — a directory of modules you pull names from." },
        { type: 'h', text: 'The `if __name__ == "__main__"` guard' },
        { type: 'p', text: "This line looks cryptic and is on every Python script you will ever read, so decode it once. When Python runs a file, it sets a hidden variable `__name__`. If you ran the file *directly* (`python app.py`), `__name__` equals the string `\"__main__\"`. If the file was *imported* by another file, `__name__` is the module's name instead. So the guard means: **“run this block only when executed directly, not when imported.”**" },
        { type: 'code', lang: 'python', filename: 'app.py', code: `def main():
    budget = TokenBudget(1000)
    budget.spend(300)
    print("remaining:", budget.remaining())

if __name__ == "__main__":   # true only when you run: python app.py
    main()

# Import this file elsewhere (from app import main) and main() does NOT
# auto-run. The guard separates "library code" from "script code".`, caption: 'The main guard = "only execute when I am the entry point." No JS equivalent needed because Node modules don’t auto-run their body the same way.' },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the light that only turns on for the owner', text: "Think of `if __name__ == \"__main__\"` as a motion sensor that only trips for *you*, the file's owner running it directly. Guests (other files that `import` you) walk past and the demo lights stay off — they just borrow your functions. It lets one file be both a reusable library and a runnable script." },
      ],
    },
    {
      id: 'translate',
      title: 'See it side by side, then run it',
      blocks: [
        { type: 'p', text: "Time to make the mapping muscle-memory. This translator lets you flip through the core constructs — spend a minute on **Functions**, **Classes**, and **Modules/imports** and watch how little actually changes between the columns." },
        { type: 'demo', id: 'js-py-translator' },
        { type: 'p', text: "Now flip it around. Below is a JavaScript playground built on two ideas that transfer *directly* into Python: **closures** (a function that remembers variables from where it was created) and **higher-order functions** (functions that take or return other functions). Run it, then read the Python equivalent underneath — the shapes are the same." },
        { type: 'playground', id: 'closure-hof', title: 'Closures & higher-order functions (JS)', height: 380, code: `// 1) A CLOSURE: makeCounter returns a function that remembers 'count'.
function makeCounter(start = 0) {
  let count = start
  return function () {
    count += 1
    return count
  }
}

const next = makeCounter(10)
console.log("counter:", next(), next(), next())   // 11 12 13

// 2) A HIGHER-ORDER FUNCTION: takes a function, returns a wrapped function.
function withLogging(fn) {
  return function (...args) {
    const result = fn(...args)
    console.log("called with", args, "-> got", result)
    return result
  }
}

const add = (a, b) => a + b
const loudAdd = withLogging(add)
console.log("result:", loudAdd(2, 3))`, solution: `// Same two patterns, plus a memoizer built from them.
function makeCounter(start = 0) {
  let count = start
  return () => (count += 1)          // arrow form, still a closure
}

// memoize: a HOF that returns a caching version of any fn
function memoize(fn) {
  const cache = new Map()            // captured by the closure
  return function (...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const value = fn(...args)
    cache.set(key, value)
    return value
  }
}

const slowSquare = (n) => n * n
const fastSquare = memoize(slowSquare)
console.log(fastSquare(9), fastSquare(9))   // second call is cached`, caption: '**Exercise:** the closure captures `count`; the HOF wraps `add`. Now write a `memoize(fn)` HOF whose closed-over `Map` caches results by arguments. (Solution has it — the same pattern Python decorators use.)' },
        { type: 'p', text: "Here is the Python side of that exact story. Python turns the 'wrap a function' pattern into first-class syntax called a **decorator** (`@withLogging`) — but under the hood it is nothing more than the higher-order function you just wrote." },
        { type: 'code', lang: 'python', filename: 'closures_hof.py', code: `# 1) Closure — a function that remembers 'count':
def make_counter(start=0):
    count = start
    def step():
        nonlocal count          # 'nonlocal' lets the inner fn reassign it
        count += 1
        return count
    return step

nxt = make_counter(10)
print(nxt(), nxt(), nxt())      # 11 12 13

# 2) Higher-order function, sugared as a DECORATOR:
def with_logging(fn):
    def wrapper(*args, **kwargs):
        result = fn(*args, **kwargs)
        print("called with", args, "-> got", result)
        return result
    return wrapper

@with_logging                   # exactly: add = with_logging(add)
def add(a, b):
    return a + b

add(2, 3)`, caption: 'A Python decorator IS a higher-order function. `@with_logging` above `add` means `add = with_logging(add)` — the JS pattern with a bow on it. One gotcha: inner functions need `nonlocal` to reassign an outer variable (JS closures do this implicitly).' },
        { type: 'callout', variant: 'tip', text: "You will see `@decorator` everywhere in AI code: `@app.route(...)` in Flask, `@tool` in agent frameworks, `@pytest.fixture` in tests. Every one is a higher-order function receiving the thing below it. You already understood the concept in JS — now you know the syntax." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A Python method is defined as `def spend(self, tokens):` but you call it as `budget.spend(300)`. Where does `self` come from?',
            options: [
              'You forgot an argument — this call raises an error',
              'Python passes the instance (`budget`) as `self` automatically; `budget.spend(300)` becomes `TokenBudget.spend(budget, 300)`',
              '`self` is a global that Python fills in',
              'It defaults to `None` unless you pass it',
            ],
            answer: 1,
            explain: 'Calling a method on an instance binds that instance to the first parameter. `budget.spend(300)` is sugar for `TokenBudget.spend(budget, 300)` — `budget` becomes `self`. This is exactly JS `this`, made explicit in the signature.',
          },
          {
            q: 'What is the practical difference between `: str` type hints in Python and TypeScript types?',
            options: [
              'None — Python enforces them at runtime like TS at compile time',
              'Python hints are checked by the runtime and crash on mismatch',
              'Python hints are NOT enforced at runtime — they document intent for editors and tools like mypy, closer to JSDoc',
              'TypeScript types are ignored but Python types are enforced',
            ],
            answer: 2,
            explain: 'Python type hints are optional annotations the interpreter ignores at runtime. Editors, linters, and mypy read them for autocomplete and CI checks — the discipline of TypeScript without the compile step. Passing the wrong type does not crash on the annotation alone.',
          },
          {
            q: 'You write `def add(item, bucket=[]):` and call `add(1)` twice. What happens?',
            options: [
              'Each call gets a fresh empty list — same as JS default params',
              'The SAME list persists across calls, so it accumulates [1, 1] — the mutable-default trap',
              'Python raises a SyntaxError for mutable defaults',
              'The second call resets bucket to []',
            ],
            answer: 1,
            explain: 'Default values are evaluated ONCE at definition time. A mutable default (list/dict) is shared by every call that omits it, so it accumulates across calls — a bug JS does not have. The fix: `bucket=None` then `bucket = bucket or []` inside.',
          },
          {
            q: 'A file `utils.py` contains a function `main()` and ends with `if __name__ == "__main__": main()`. You run `from utils import main` in another file. Does `main()` execute on import?',
            options: [
              'Yes — importing runs the whole file including main()',
              'No — on import, `__name__` is "utils", not "__main__", so the guarded block is skipped; main() runs only if you execute utils.py directly',
              'Only if you also call `import utils`',
              'It raises an error because of the guard',
            ],
            answer: 1,
            explain: 'The guard runs its block only when the file is the entry point (`python utils.py`), where `__name__ == "__main__"`. When imported, `__name__` is the module name, so the block is skipped — letting one file be both a library and a runnable script.',
          },
          {
            q: 'Which JavaScript feature is the closest match to a Python decorator like `@with_logging` above a function?',
            options: [
              'A class getter',
              'A higher-order function that takes a function and returns a wrapped function (the decorator IS that, with syntax sugar)',
              'The `new` keyword',
              'A Promise',
            ],
            answer: 1,
            explain: '`@with_logging` above `def add(...)` is exactly `add = with_logging(add)`. A decorator is a higher-order function — the same pattern as JS `withLogging(add)`. Python just gives it dedicated `@` syntax placed above the definition.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l3-c1', front: 'JS `function` and `this` map to which Python keywords?', back: '`function` → `def` (colon + indentation, no braces). `this` → `self`, but `self` is an explicit first parameter on every method, not implicit.' },
          { id: 'm4-l3-c2', front: 'What are keyword arguments and why do they matter?', back: 'Passing args by name at the call site, in any order: `make_call("hi", temperature=0.2)`. Built into every Python function — no options-object needed. It is why AI SDKs read as `create(model=..., max_tokens=...)`.' },
          { id: 'm4-l3-c3', front: '`*args` vs `**kwargs`?', back: '`*args` = rest for positional args (collected into a tuple). `**kwargs` = rest for keyword args (collected into a dict). `*` / `**` also spread a list / dict into a call.' },
          { id: 'm4-l3-c4', front: 'How does Python do "private" fields?', back: 'By convention, not enforcement. A leading underscore (`self._token`) signals "internal, hands off" but nothing stops access. There is no true private like JS `#field`.' },
          { id: 'm4-l3-c5', front: 'What is a dunder method? Name three.', back: 'A double-underscore hook method the language calls for you: `__init__` (construct), `__str__` (print/str), `__len__` (len), `__eq__` (==). Same idea as JS `toString`/`Symbol.iterator`.' },
          { id: 'm4-l3-c6', front: 'What does `if __name__ == "__main__":` do?', back: 'Runs its block only when the file is executed directly (`python app.py`), not when imported. `__name__` is "__main__" for the entry file, the module name otherwise. Lets a file be both library and script.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Functions: `def` + colon + indentation. Defaults like JS — but never use a mutable default (list/dict); it is shared across calls.',
          'Keyword arguments (`f(x, temperature=0.2)`) are a real Python superpower JS lacks — the reason AI SDK calls read so cleanly. `*args`/`**kwargs` are rest/spread.',
          'Classes: `__init__` is the constructor, `self` is an explicit `this`, there is no `new`, and "private" is a leading-underscore honor system.',
          'Dunder methods (`__str__`, `__len__`, `__eq__`) hook your objects into built-in operators and functions.',
          'Every `.py` file is a module; top-level names are auto-exported. `if __name__ == "__main__":` runs code only when the file is the entry point.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Forgetting `self` in method signatures', text: 'Writing `def spend(tokens):` instead of `def spend(self, tokens):` gives a confusing "takes 1 positional argument but 2 were given" error — because Python passed the instance as arg one. Every method’s first parameter is `self`. Always.' },
          { title: 'The mutable default argument', text: '`def f(items=[])` creates ONE list reused across all calls, silently accumulating state. The number-one Python gotcha for JS devs. Default to `None` and build the list inside the function body.' },
          { title: 'Expecting `_private` to be enforced', text: 'A leading underscore is a social contract, not a lock. Do not rely on it for security or invariants — any caller can still reach `obj._token`. If you truly must hide state, rethink the design; Python trusts the programmer.' },
          { title: 'Confusing `import x` with `from x import y`', text: '`import math` means you call `math.sqrt(...)`; `from math import sqrt` means you call `sqrt(...)` bare. Mixing them up gives "name is not defined" errors. Pick per import based on whether you want the namespace or the bare name.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain `self` in Python to someone who only knows JavaScript."', a: 'It is JS `this`, made explicit. In JS, `this` appears inside methods implicitly and can rebind depending on how the method is called — the source of `.bind()` and arrow-function workarounds. Python passes the instance as the method’s first parameter, named `self` by convention, so `obj.method(x)` is really `Class.method(obj, x)`. More verbose, but there is no binding ambiguity — you always know exactly what the instance is.' },
          { q: '"What is a Python decorator?"', a: 'A higher-order function applied with `@` syntax above a definition. `@with_logging` over `def add(...)` is literally `add = with_logging(add)` — the decorator receives the function, wraps it (usually returning an inner function that adds behavior), and rebinds the name. It is the exact wrap-a-function pattern from JS, with dedicated syntax. Frameworks use it for routing (`@app.route`), fixtures (`@pytest.fixture`), and tool registration in agents.' },
          { q: '"How does Python’s module system compare to ES modules?"', a: 'Simpler on the export side, similar on import. Every `.py` file is a module and every top-level name is automatically importable — there is no `export` keyword. Imports come in two flavors: `import module` (keep the namespace, call `module.thing`) or `from module import thing` (lift the name out). A package is just a directory of modules. The `if __name__ == "__main__":` guard is the idiom that lets a file act as both an importable library and a directly runnable script.' },
          { q: '"Why is the mutable-default-argument bug so common?"', a: 'Because default values are evaluated once, at function-definition time, not per call. So `def add(x, bucket=[])` binds one list object into the function; every call that omits `bucket` mutates that same list, and state leaks across calls. It surprises everyone once. The idiom is to default to `None` and create a fresh list inside: `bucket = bucket or []`. Knowing this signals real Python experience.' },
        ] },
        { type: 'usecases', items: [
          { title: 'AI SDK call sites', text: '`client.messages.create(model="claude-sonnet-5", max_tokens=1000, temperature=0.2)` is pure keyword arguments — the feature from section 1, everywhere you touch an LLM in Python.' },
          { title: 'Config and client classes', text: 'Wrapping a provider in a `LLMClient` class with `__init__` (store the key/model) and methods (`chat`, `embed`) is the standard shape of internal AI tooling — classes carry the state, methods do the work.' },
          { title: 'Framework decorators', text: 'FastAPI routes (`@app.post`), pytest fixtures (`@pytest.fixture`), and agent tools (`@tool`) are decorators — higher-order functions you now recognize instead of memorize.' },
          { title: 'Reusable modules', text: 'A `prompts.py` module of template functions imported across your app, plus a `main` guard so it can also be run to preview prompts — the everyday module pattern in AI codebases.' },
        ] },
        { type: 'project', title: 'Build a Timer class in its own module', goal: 'Write a small, importable Python class with real methods, split into a module with a main guard — the exact shape of production utility code.', steps: [
          'Create `timer.py`. Define a `Timer` class with `__init__(self, label="task")` storing the label and setting `self._start = None`.',
          'Add methods: `start(self)` (record the current time via `import time; self._start = time.time()`), and `stop(self)` (return the elapsed seconds, using the `_start` you saved).',
          'Add a `__str__(self)` dunder so `print(timer)` shows something like `Timer(label=embed, running)`.',
          'At the bottom add `if __name__ == "__main__":` that creates a Timer, starts it, does a tiny loop, stops it, and prints the elapsed time — a self-demo that only runs when you execute the file directly.',
          'From a second file, `from timer import Timer`, create one, and confirm the main-guard demo does NOT auto-run on import.',
        ], deliverable: 'A `timer.py` module with the `Timer` class (init, start, stop, `__str__`, main guard) and a second file that imports and uses it — pushed to a repo.' },
        { type: 'challenge', title: 'Translate a JS class into idiomatic Python', text: 'Take this JavaScript class and rewrite it as idiomatic Python, then write 3 bullets on what changed and why:\n\n```\nclass RateLimiter {\n  #count = 0;\n  static DEFAULT = 60;\n  constructor(limit = RateLimiter.DEFAULT) { this.limit = limit; }\n  hit() { this.#count++; return this.#count <= this.limit; }\n}\n```\n\nYour Python version must handle the private field, the static member, the constructor default, and the method. Explain how each concept maps.', hints: [
          'The `#count` private field becomes `self._count` — a leading-underscore convention, since Python has no true private.',
          'The `static DEFAULT = 60` becomes a class-level attribute (defined in the class body, not in `__init__`), referenced as `RateLimiter.DEFAULT`.',
          'The constructor default `limit = RateLimiter.DEFAULT` translates directly to `def __init__(self, limit=DEFAULT)` — but watch scoping; referencing the class attribute cleanly usually means a module constant or `RateLimiter.DEFAULT` inside the body.',
        ] },
        { type: 'reading', links: [
          { label: 'Python docs: Classes tutorial', url: 'https://docs.python.org/3/tutorial/classes.html', note: 'The official walkthrough of `class`, `__init__`, `self`, and scope — read the "self" and "class vs instance variables" parts closely.' },
          { label: 'Python docs: Modules', url: 'https://docs.python.org/3/tutorial/modules.html', note: 'The canonical explanation of modules, packages, `import` forms, and `if __name__ == "__main__"`.' },
          { label: 'Python docs: Defining functions & argument forms', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', note: 'Defaults, keyword arguments, and `*args`/`**kwargs` straight from the source — including the mutable-default warning.' },
        ] },
      ],
    },
  ],
}
