// Lesson 4.2 — Lists, Dicts & Comprehensions

export default {
  sections: [
    {
      id: 'collections-you-know',
      title: 'You already own these — under new names',
      blocks: [
        { type: 'p', text: "In Module 4.1 you learned that Python is JavaScript with different spelling. That holds beautifully for collections. The array you `.map()` over a hundred times a day? That's a Python **list**. The object you pass around as a bag of key→value pairs? That's a Python **dict**. Same jobs, same instincts — just new method names and a couple of genuinely nicer tricks." },
        { type: 'p', text: "This lesson maps four Python collection types onto things you already know, then teaches the *one truly new superpower*: **[[Comprehension]]s** — a compact syntax for building a list (or dict, or set) from another iterable. Think of a comprehension as a `.map()`/`.filter()` chain collapsed into a single readable line. That's the payoff; everything before it is vocabulary." },
        { type: 'table', headers: ['You know (JS)', 'Python', 'One-line intuition'], rows: [
          ['`Array` `[1, 2, 3]`', '`list` `[1, 2, 3]`', 'Ordered, mutable, indexable sequence'],
          ['`Object` / `Map`', '`dict` `{"k": v}`', 'Key → value lookups'],
          ['`Set`', '`set` `{1, 2, 3}`', 'Unique values, fast membership'],
          ['`Object.freeze([...])` (roughly)', '`tuple` `(1, 2)`', 'Immutable, fixed-size ordered group'],
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the same toolbox, relabeled', text: "Imagine moving to a workshop abroad. The hammer is now a *marteau*, the wrench a *clé* — but a hammer still drives nails and a wrench still turns bolts. You don't relearn carpentry; you relearn labels. Lists, dicts, sets, and tuples are the four tools you already reach for in JS, wearing French name tags. Grab the right one for the job and your hands already know what to do." },
        { type: 'demo', id: 'py-data-structures' },
      ],
    },
    {
      id: 'lists',
      title: 'Lists: arrays with a slicing superpower',
      blocks: [
        { type: 'p', text: "A **list** is Python's array: ordered, mutable, mixed-type-friendly, zero-indexed. If you can picture `['a', 'b', 'c']` in JS, you already picture a Python list — the literal is identical. The methods are renamed but the moves are the same: `.append()` is `.push()`, `.pop()` is `.pop()`, `len(x)` is `x.length`. The one real upgrade is **slicing** — a tiny built-in query language for sub-sequences that JS makes you write `.slice()` calls for." },
        { type: 'code', lang: 'python', filename: 'lists.py', code: `nums = [10, 20, 30, 40, 50]

# Add / remove (mutating, like push/pop)
nums.append(60)        # [10, 20, 30, 40, 50, 60]
last = nums.pop()      # last = 60, list shrinks back
nums.insert(0, 5)      # put 5 at the front

# Indexing — and NEGATIVE indexing (Python's gift)
nums[0]                # 5   (first)
nums[-1]               # 50  (last — no nums[len-1] dance!)
nums[-2]               # 40  (second from the end)

# Slicing: nums[start:stop]  — stop is EXCLUSIVE
nums[1:3]              # [10, 20]   items 1 and 2, not 3
nums[:2]               # [5, 10]    from the start
nums[2:]               # [20, 30, 40, 50]  to the end
nums[::2]              # [5, 20, 40]  every 2nd item (a "step")
nums[::-1]             # reversed copy — the famous reverse trick

len(nums)              # 6   (not .length)
30 in nums             # True  (membership, like .includes())` },
        { type: 'callout', variant: 'info', title: 'Slicing is [start:stop:step]', text: "Read `arr[1:3]` as *\"from index 1 up to but not including 3.\"* The stop is exclusive — same rule as `Array.slice(1, 3)` in JS, so the count `stop - start` gives you the length (here, 2 items). Negative indices count from the end, and a third `:step` value strides through. `arr[::-1]` (step of -1) is the idiomatic way to reverse." },
        { type: 'callout', variant: 'warn', title: '\"list\" vs \"array\" — a real distinction', text: "Python also has a low-level `array` module and, more importantly, the NumPy `ndarray` you'll meet in the data modules. A **list** is a flexible, general-purpose Python container (any types, grows freely). A NumPy **array** is a fixed-type, contiguous block of numbers built for fast math on millions of elements. For everyday code you want a *list*; for tensors and vectorized math you want a NumPy *array*. Don't conflate them." },
      ],
    },
    {
      id: 'dicts-sets-tuples',
      title: 'Dicts, sets & tuples: the other three',
      blocks: [
        { type: 'h', text: 'dict — your object/Map' },
        { type: 'p', text: "A **dict** is a hash map: keys to values, just like a JS object or `Map`. The literal even looks the same. Two differences worth burning in: you access with **square brackets** (`d[\"name\"]`, there's no dot access), and reaching for a missing key with `d[\"nope\"]` *throws* a `KeyError` instead of quietly returning `undefined`. That's why `.get()` — which returns a default instead of exploding — is the method you'll use constantly." },
        { type: 'code', lang: 'python', filename: 'dicts.py', code: `user = {"name": "Ada", "role": "engineer", "level": 7}

user["name"]                 # "Ada"   (brackets, not user.name)
user["email"]                # KeyError! — this THROWS
user.get("email")            # None    (safe: no key -> None)
user.get("email", "n/a")     # "n/a"   (safe with a default)

user["email"] = "ada@x.com"  # add / update a key
"role" in user               # True    (membership checks the KEYS)

# Iterating — the three views you'll reach for constantly
for key in user:             # keys by default
    print(key)
for value in user.values():  # just the values
    print(value)
for key, val in user.items():# BOTH at once — the workhorse
    print(f"{key} = {val}")` },
        { type: 'callout', variant: 'tip', title: '.get() is your Optional-chaining', text: "In JS you write `obj?.email ?? 'n/a'` to dodge crashes on missing keys. Python's one-method equivalent is `d.get('email', 'n/a')`. Any time a key *might* be absent — parsing API responses, reading config, counting things — reach for `.get()` with a sensible default instead of bracket access. It's the difference between a resilient script and a `KeyError` at 2am." },
        { type: 'h', text: 'set — a real Set, no ceremony' },
        { type: 'p', text: "A **set** is an unordered collection of *unique* values with near-instant membership tests — Python's `set` is the direct twin of JS's `Set`, but with clean literal syntax and built-in math operators. Use it whenever you need to dedupe, or ask *\"is x in this big pile?\"* fast." },
        { type: 'code', lang: 'python', filename: 'sets.py', code: `seen = {3, 1, 2, 2, 3}     # duplicates collapse -> {1, 2, 3}
unique = set([1, 1, 2, 3]) # dedupe a list in one call -> {1, 2, 3}

seen.add(4)
2 in seen                  # True — O(1)-ish, unlike scanning a list

# Set algebra (operators, not method-chains)
a = {1, 2, 3}
b = {3, 4, 5}
a | b                      # union        -> {1, 2, 3, 4, 5}
a & b                      # intersection -> {3}
a - b                      # difference   -> {1, 2}` },
        { type: 'h', text: 'tuple — an immutable, fixed group' },
        { type: 'p', text: "A **tuple** is a list that can't change after creation — ordered, indexable, but frozen. You reach for one when a group of values belongs together and *shouldn't* be edited: a coordinate `(x, y)`, an RGB color `(255, 128, 0)`, a row from a database. The killer everyday use is **packing and unpacking** — assigning several variables at once, which you already do with JS array destructuring." },
        { type: 'code', lang: 'python', filename: 'tuples.py', code: `point = (3, 4)          # a tuple — parentheses
point[0]                # 3   (indexable like a list)
point[0] = 9            # TypeError! — tuples are immutable

# Packing & unpacking (JS: const [a, b] = [1, 2])
a, b = 1, 2             # pack the right, unpack into a, b
a, b = b, a            # swap with no temp variable!
x, y = point            # x=3, y=4

# The classic: unpack while iterating dict.items()
for key, val in {"a": 1, "b": 2}.items():
    print(key, val)     # key/val are unpacked from each tuple` },
        { type: 'callout', variant: 'analogy', title: 'Analogy: list = whiteboard, tuple = printed receipt', text: "A **list** is a whiteboard: write, erase, reorder all day. A **tuple** is a printed receipt: the values are locked the moment it's issued. You *want* the receipt to be immutable — it's a record, not a draft. Choose a tuple when changing the data later would be a bug, not a feature (and as a bonus, tuples can be dict keys and set members; lists can't)." },
      ],
    },
    {
      id: 'comprehensions',
      title: 'Comprehensions: the one genuinely new superpower',
      blocks: [
        { type: 'p', text: "Everything so far was relabeling. **This** is the part that's actually new — and it's the most Pythonic thing you'll write all module. A comprehension builds a new list from an existing iterable in a single expression. You already do this in JS with `.map()` and `.filter()`; Python folds the whole chain into one bracketed line that reads almost like the English sentence describing it." },
        { type: 'p', text: "Read the shape as *\"**[** give me `expr` **for** each `x` **in** `items` **if** `condition` **]**.\"* The `for` is the loop, the leading expression is the transform (your `.map`), and the optional trailing `if` is the filter (your `.filter`). Left-to-right, it's the same order you'd think it." },
        { type: 'table', headers: ['JavaScript', 'Python comprehension', 'What it does'], rows: [
          ['`nums.map(x => x * 2)`', '`[x * 2 for x in nums]`', 'Transform every element'],
          ['`nums.filter(x => x > 0)`', '`[x for x in nums if x > 0]`', 'Keep some elements'],
          ['`nums.filter(x => x > 0).map(x => x * 2)`', '`[x * 2 for x in nums if x > 0]`', 'Filter **then** transform, one pass'],
          ['`Object.fromEntries(pairs.map(...))`', '`{k: v for k, v in pairs}`', 'Build a **dict** (dict comprehension)'],
          ['`new Set(nums.map(...))`', '`{x * 2 for x in nums}`', 'Build a **set** (set comprehension)'],
        ] },
        { type: 'code', lang: 'python', filename: 'comprehensions.py', code: `nums = [1, -2, 3, -4, 5]

# map: transform each
doubled = [x * 2 for x in nums]            # [2, -4, 6, -8, 10]

# filter: keep matching
positives = [x for x in nums if x > 0]     # [1, 3, 5]

# filter THEN map, in one readable pass
pos_doubled = [x * 2 for x in nums if x > 0]  # [2, 6, 10]

# DICT comprehension — build key: value pairs
words = ["hi", "hey", "hello"]
lengths = {w: len(w) for w in words}       # {"hi": 2, "hey": 3, "hello": 5}

# SET comprehension — unique results
first_letters = {w[0] for w in words}      # {"h"}

# Comprehensions read like their sentence:
# "give me x*2, for each x in nums, if x is positive"` },
        { type: 'callout', variant: 'warn', title: 'When comprehensions HURT readability', text: "Comprehensions are a scalpel, not a hammer. A one-line map or filter? Perfect. But the moment you're nesting two `for` clauses, juggling multiple `if`s, or reaching for a ternary inside the expression, you've built a puzzle. If a teammate has to *parse* it rather than *read* it, expand it into a plain `for` loop. Clever one-liners that need a comment to explain them are a net loss — the goal is clarity, not compression." },
        { type: 'callout', variant: 'tip', title: 'The mental toggle', text: "Ask: *would this be one clean `.map()` or `.filter()` in JS?* If yes, it's a great comprehension. Would it be a chain of three `.reduce()`s with intermediate variables and a comment? Then it's a `for` loop in Python too. Same taste you already have in JS applies directly." },
      ],
    },
    {
      id: 'build-it',
      title: 'Build one, then run the JS twin',
      blocks: [
        { type: 'p', text: "Use the **comprehension builder** below to assemble a comprehension piece by piece — pick the source, toggle a filter, choose a transform — and watch the equivalent JS `.map`/`.filter` chain update beside it. Seeing them side by side is how the syntax stops feeling foreign and starts feeling like home." },
        { type: 'demo', id: 'comprehension-builder' },
        { type: 'p', text: "Now feel the equivalence in code you can run. The playground is JavaScript (only JS executes in the sandbox), so it shows the **JS chain** you already know. Directly under it is a `code` block with the *identical* logic as a Python comprehension — run the JS, read the output, then read the Python and confirm they'd produce the same array. That mapping is the whole lesson." },
        { type: 'playground', id: 'comp-twin', title: 'The JS chain (Python equivalent below)', height: 360, lang: 'javascript', code: `// JavaScript: filter the active users, then pull their names.
const users = [
  { name: "Ada",   active: true,  score: 91 },
  { name: "Linus", active: false, score: 70 },
  { name: "Grace", active: true,  score: 88 },
  { name: "Ken",   active: false, score: 95 },
]

// .filter() then .map() — the chain a comprehension collapses
const topActiveNames = users
  .filter(u => u.active && u.score >= 80)
  .map(u => u.name.toUpperCase())

console.log(topActiveNames)   // ["ADA", "GRACE"]

// A dict-comprehension twin in JS: name -> score, active only
const scoreByName = Object.fromEntries(
  users.filter(u => u.active).map(u => [u.name, u.score])
)
console.log(scoreByName)      // { Ada: 91, Grace: 88 }`, solution: `// Solution: same result, expressed a second way in JS —
// reduce() does filter+map+build in one pass, which is exactly
// the "one comprehension" mindset (but less readable — hence
// Python prefers the comprehension form).
const users = [
  { name: "Ada",   active: true,  score: 91 },
  { name: "Linus", active: false, score: 70 },
  { name: "Grace", active: true,  score: 88 },
  { name: "Ken",   active: false, score: 95 },
]

const topActiveNames = users.reduce((acc, u) => {
  if (u.active && u.score >= 80) acc.push(u.name.toUpperCase())
  return acc
}, [])

console.log(topActiveNames)   // ["ADA", "GRACE"]
// The Python comprehension is shorter than BOTH JS versions —
// that's the readability win the language is famous for.`, caption: '**Exercise:** change the filter to `score >= 90` and predict the output before running. Then write, on paper, the Python comprehension that matches the first block. (Answer: `[u["name"].upper() for u in users if u["active"] and u["score"] >= 80]`.)' },
        { type: 'code', lang: 'python', filename: 'the_python_twin.py', code: `# The EXACT same logic as the playground above, in Python.
users = [
    {"name": "Ada",   "active": True,  "score": 91},
    {"name": "Linus", "active": False, "score": 70},
    {"name": "Grace", "active": True,  "score": 88},
    {"name": "Ken",   "active": False, "score": 95},
]

# .filter(...).map(...)  becomes  one comprehension
top_active_names = [
    u["name"].upper()
    for u in users
    if u["active"] and u["score"] >= 80
]
print(top_active_names)        # ['ADA', 'GRACE']

# The dict-comprehension twin: name -> score, active only
score_by_name = {u["name"]: u["score"] for u in users if u["active"]}
print(score_by_name)           # {'Ada': 91, 'Grace': 88}`, caption: 'Line up each clause against the JS above: `for u in users` = the loop, the `if` = `.filter`, the top expression = `.map`.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'You have `nums = [10, 20, 30, 40, 50]`. What does `nums[1:3]` return?',
            options: [
              '[10, 20, 30]',
              '[20, 30]',
              '[20, 30, 40]',
              '[10, 20]',
            ],
            answer: 1,
            explain: 'Slicing is [start:stop] with the stop EXCLUSIVE — indices 1 and 2 (values 20 and 30), not index 3. The item count is always stop - start, here 3 - 1 = 2 items. Same rule as JS `.slice(1, 3)`.',
          },
          {
            q: 'A dict `cfg` might not contain the key "timeout". Which access is safe and returns 30 as a fallback?',
            options: [
              'cfg["timeout"] || 30',
              'cfg.timeout ?? 30',
              'cfg.get("timeout", 30)',
              'cfg["timeout"]',
            ],
            answer: 2,
            explain: '`cfg["timeout"]` throws a KeyError if the key is absent (Python does NOT return undefined). `.get(key, default)` is the safe form — it returns the value if present, else the default. Dot access and `??` are JS syntax, not Python.',
          },
          {
            q: 'Which JS chain is the exact equivalent of the Python comprehension `[x * 2 for x in nums if x > 0]`?',
            options: [
              'nums.map(x => x * 2).filter(x => x > 0)',
              'nums.filter(x => x > 0).map(x => x * 2)',
              'nums.reduce((a, x) => a + x * 2, 0)',
              'nums.forEach(x => x * 2)',
            ],
            answer: 1,
            explain: 'Order matters: the trailing `if` filters FIRST (keep x > 0), then the leading expression transforms (x * 2). That is filter-then-map. Doing map first would double the negatives before discarding them — a subtly different (and here, wrong) computation.',
          },
          {
            q: 'You need to store an (x, y) coordinate that must never be accidentally reassigned, and you want to use it as a key in a dict. Which type?',
            options: [
              'A list [x, y]',
              'A set {x, y}',
              'A tuple (x, y)',
              'A dict {"x": x, "y": y}',
            ],
            answer: 2,
            explain: 'Tuples are immutable and hashable, so they can be dict keys and set members — lists cannot (they are mutable and unhashable). A set would also lose the order and drop duplicate coordinates like (2, 2). Immutability here is a feature: the coordinate is a record, not a draft.',
          },
          {
            q: 'A colleague writes a triple-nested comprehension with two `if`s that no one on the team can read without tracing it. The best call is to…',
            options: [
              'Keep it — comprehensions are always more Pythonic than loops',
              'Add a longer variable name and move on',
              'Expand it into a plain `for` loop for readability',
              'Convert it to a one-line lambda instead',
            ],
            answer: 2,
            explain: 'Comprehensions win for simple map/filter cases, but nesting and multiple conditions turn them into puzzles. Readability beats cleverness: if a reader has to parse rather than read it, a plain `for` loop is the more Pythonic (and more maintainable) choice.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm4-l2-c1', front: 'Python list vs JS array — key differences?', back: 'Same concept (ordered, mutable, zero-indexed). Renamed methods: .append = push, len(x) = .length. New powers: negative indices (arr[-1]) and slicing arr[start:stop:step].' },
          { id: 'm4-l2-c2', front: 'How do you safely read a maybe-missing dict key?', back: 'd.get("key", default). Bracket access d["key"] throws KeyError if absent (no undefined in Python). .get is the Optional-chaining equivalent.' },
          { id: 'm4-l2-c3', front: 'The three dict iteration views?', back: 'for k in d (keys, default), d.values() (values), d.items() (both, unpacked as k, v). .items() is the workhorse for looping over pairs.' },
          { id: 'm4-l2-c4', front: 'When to use a set vs a tuple?', back: 'set = unique values + fast membership + set math (| & -). tuple = immutable, ordered, fixed group; usable as dict keys / set members. Lists can be neither.' },
          { id: 'm4-l2-c5', front: 'The comprehension shape and its JS twin?', back: '[expr for x in items if cond]. expr = .map, trailing if = .filter, for = the loop. The if filters FIRST, then expr transforms. Also works for dicts {k: v ...} and sets {x ...}.' },
          { id: 'm4-l2-c6', front: 'When does a comprehension HURT readability?', back: 'When nested (multiple for clauses), multiple ifs, or ternaries inside. If a reader must parse not read it, expand to a plain for loop. Clarity over compression.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Four collections you already know: list (array), dict (object/Map), set (Set), tuple (frozen group).',
          'Lists add negative indexing (arr[-1]) and slicing (arr[start:stop:step]); "list" (flexible) is not a NumPy "array" (fast typed math).',
          'Dicts use bracket access; d["missing"] THROWS — use d.get(key, default), and .items() to loop over pairs.',
          'Comprehensions are the one new superpower: [expr for x in items if cond] = a .filter().map() chain in one line (also dict/set variants).',
          'Use comprehensions for simple map/filter; drop to a for loop the moment nesting or multiple conditions hurt readability.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Bracket-accessing a maybe-missing key', text: 'Writing d["email"] when the key might be absent is the #1 Python KeyError. Coming from JS you expect undefined; Python throws. Use d.get("email") or d.get("email", fallback) whenever presence is not guaranteed — API parsing, config, counters.' },
          { title: 'Off-by-one on slices', text: 'arr[1:3] gives TWO items (indices 1 and 2), because stop is exclusive — not three. Expecting the stop to be inclusive silently drops or grabs the wrong element. Memorize: count = stop - start.' },
          { title: 'Cramming everything into one comprehension', text: 'Nested for clauses, stacked ifs, and inline ternaries turn an elegant tool into unreadable line noise. If you need a comment to explain the comprehension, it should have been a for loop. Readability is the whole point of the syntax.' },
          { title: 'Reaching for a list when a set or tuple fits', text: 'Using a list to test membership on thousands of items (slow linear scan) instead of a set (near-instant), or a mutable list where a frozen record belongs. Pick the structure for the job: dedupe/lookup -> set, fixed record/key -> tuple.' },
        ] },
        { type: 'interview', items: [
          { q: '"What is a list comprehension and when would you use one?"', a: 'It is a compact expression that builds a list from an iterable: [expr for x in items if cond]. The leading expression is a map, the trailing if is a filter, so a whole .filter().map() chain collapses into one readable line. I use it for simple transforms and filters — it is idiomatic and fast. I deliberately avoid it when the logic nests or needs multiple conditions, because at that point a plain for loop reads far better, and readability wins.' },
          { q: '"Difference between a list, a tuple, and a set in Python?"', a: 'A list is ordered and mutable — the general-purpose sequence, like a JS array. A tuple is ordered but immutable — a fixed record you should not edit, and because it is hashable it can be a dict key or set member. A set is unordered, holds only unique values, and gives near-constant-time membership plus set algebra (union, intersection, difference). I choose by job: editable sequence -> list, frozen record -> tuple, dedup/fast lookup -> set.' },
          { q: '"How do you safely handle a dictionary key that might not exist?"', a: 'dict.get(key, default) — it returns the value if the key exists and the default otherwise, instead of raising KeyError like bracket access does. It is the Python equivalent of JS optional chaining with a nullish fallback. For accumulating patterns I might use collections.defaultdict or dict.setdefault, but .get is the everyday tool for resilient parsing of uncertain data.' },
          { q: '"Why is a dict\'s bracket access different from a JS object?"', a: 'Two things bite JS developers. First, Python has no dot access on dicts — it is always d["key"]. Second, a missing key raises a KeyError rather than returning undefined, so silent-failure code from JS becomes a crash in Python. The fix is .get() with a default. Understanding that Python fails loudly here is a small but real mindset shift.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Cleaning LLM/JSON responses', text: 'Parsing model or API output into Python? You slice lists, .get() optional fields off dicts, and comprehend the results into a clean shape — this lesson is the daily grammar of data wrangling.' },
          { title: 'Dataset preprocessing for ML', text: 'Before data hits pandas or a model, you filter rows and extract fields with comprehensions: [row["text"] for row in data if row["label"] is not None]. It is the first tool in every preprocessing script.' },
          { title: 'Deduping and membership checks', text: 'Sets power "have I seen this id before?" and "give me the unique tags" across crawlers, caches, and pipelines — one set() call replaces a manual loop-and-check.' },
          { title: 'Config and feature flags', text: 'Reading settings from a dict with .get(key, default) is how virtually every Python app handles optional configuration without crashing on an unset value.' },
        ] },
        { type: 'project', title: 'Messy data -> clean summary', goal: 'Take a realistic list of dicts (users pulled from an API) and use only lists, dicts, and comprehensions to produce a summary — no manual loops where a comprehension fits.', steps: [
          'Start with a list of ~8 user dicts, each with keys like name, active (bool), country, and score — and deliberately give a couple of them a MISSING score key to force safe access.',
          'Build a comprehension that keeps only active users and pulls their names uppercased: active_names = [u["name"].upper() for u in users if u["active"]].',
          'Use .get("score", 0) inside a comprehension to total the scores safely despite the missing keys, then compute the average.',
          'Build a set comprehension of the distinct countries, and a dict comprehension mapping each name to its score.',
          'Print a small report: count of active users, average score, unique countries, and the name->score dict.',
        ], deliverable: 'A summary.py that runs top-to-bottom and prints the report, using .get() for the missing keys and at least one list, one dict, and one set comprehension.' },
        { type: 'challenge', title: 'Nested loop -> one comprehension (and judge it)', text: 'Take a nested loop that flattens a list of lists AND filters — e.g. collect every positive number from `matrix = [[1, -2, 3], [-4, 5], [6, -7]]` into one flat list. Write it first as a plain nested for loop, then rewrite it as a single comprehension: `[n for row in matrix for n in row if n > 0]`. Then make the honest call: is the one-liner actually clearer here, or did it cross into puzzle territory?', hints: [
          'In a comprehension, multiple for clauses read left-to-right exactly like nested loops top-to-bottom: outer loop first, then inner.',
          'The trailing if applies to the innermost variable (n), filtering each flattened element.',
          'Two for clauses is usually still readable; add a third for or a second if and it tips into "use a loop" — decide where YOUR line is.',
        ] },
        { type: 'reading', links: [
          { label: 'Python docs: Data Structures tutorial', url: 'https://docs.python.org/3/tutorial/datastructures.html', note: 'The official tour of lists, dicts, sets, tuples, and comprehensions — the canonical reference for this whole lesson.' },
          { label: 'Python docs: list comprehensions', url: 'https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions', note: 'The precise grammar and nested-comprehension examples, straight from the source.' },
          { label: 'Real Python: comprehensions guide', url: 'https://realpython.com/list-comprehension-python/', note: 'A thorough, example-rich walkthrough including when NOT to use one — great for building taste.' },
        ] },
      ],
    },
  ],
}
