# 06 — Verse Detection Engine

## Overview

The Verse Detection Engine is the core intelligence of Lumen. It analyzes the real-time transcript from the Speech Engine and identifies Bible verse references, including the book, chapter, verse(s), and optionally the requested translation.

---

## Detection Pipeline

```
Transcript Stream
    │
    ▼
┌─────────────────┐
│ Text Buffer     │ ← Maintains a rolling window of recent transcript text
│ (last 30s)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Normalizer      │ ← Lowercases, removes filler words, normalizes numbers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reference       │ ← Regex patterns match verse reference formats
│ Matcher         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Book Resolver   │ ← Maps spoken book names to canonical names
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Translation     │ ← Looks for translation keywords near the reference
│ Detector        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deduplicator    │ ← Filters out repeated detections of the same verse
└────────┬────────┘
         │
         ▼
DetectedVerse Event
```

---

## Step 1: Text Buffer

The buffer maintains the last ~30 seconds of finalized transcript text. This is necessary because:

- Verse references may span multiple transcript segments (*"turn to John"* ... *"chapter 3"* ... *"verse 16"*)
- Translation keywords may come before or after the verse reference
- Context words ("turn to", "let's read") may appear in a prior segment

**Buffer behavior:**
- Appends each finalized transcript segment
- Trims text older than 30 seconds
- Sends the full buffer to the normalizer on each new segment

---

## Step 2: Normalizer

Cleans up the raw transcript text for more reliable pattern matching.

**Transformations:**

| Input | Output | Rule |
|-------|--------|------|
| "JOHN" | "john" | Lowercase everything |
| "first" | "1" | Convert ordinal/word numbers to digits |
| "second" | "2" | |
| "third" | "3" | |
| "one" | "1" | Convert word numbers |
| "two" | "2" | |
| "thirteen" | "13" | |
| "um", "uh", "like" | *(removed)* | Remove filler words |
| "chapter" | "chapter" | Keep structural keywords |
| "verse" | "verse" | |

**Number word mapping (selected):**

```typescript
const WORD_TO_NUMBER: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
  'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
  'nineteen': 19, 'twenty': 20, 'twenty-one': 21, /* ... */
  'thirty': 30, 'forty': 40, 'fifty': 50,
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
  // ... up to 'one hundred and fifty' (Psalms has 150 chapters)
};
```

---

## Step 3: Reference Matcher

A set of regex patterns that match different ways preachers reference Bible verses.

### Pattern Priority (highest to lowest)

#### Pattern A: Direct Reference (Highest Confidence)
Matches: `"john 3:16"`, `"1 john 2:1"`, `"revelation 21:3-4"`

```regex
/(?<book>[1-3]?\s?[a-z]+)\s+(?<chapter>\d{1,3}):(?<verseStart>\d{1,3})(?:\s*[-–—]\s*(?<verseEnd>\d{1,3}))?/
```

Confidence: **0.95**

#### Pattern B: Chapter and Verse Words
Matches: `"john chapter 3 verse 16"`, `"genesis chapter 1 verses 1 through 3"`

```regex
/(?<book>[1-3]?\s?[a-z]+)\s+chapter\s+(?<chapter>\d{1,3})\s+verse[s]?\s+(?<verseStart>\d{1,3})(?:\s+(?:through|to|thru|-)\s+(?<verseEnd>\d{1,3}))?/
```

Confidence: **0.90**

#### Pattern C: Contextual Cue + Reference
Matches: `"turn to john 3:16"`, `"let's read matthew 5:3"`, `"go to romans 8:28"`

```regex
/(?:turn to|go to|let's read|read|look at|open to|open up)\s+(?<book>[1-3]?\s?[a-z]+)\s+(?<chapter>\d{1,3}):(?<verseStart>\d{1,3})/
```

Confidence: **0.93** (contextual cue increases confidence)

#### Pattern D: Chapter Only (No Verse)
Matches: `"john chapter 3"`, `"turn to psalm 23"`

```regex
/(?<book>[1-3]?\s?[a-z]+)\s+(?:chapter\s+)?(?<chapter>\d{1,3})(?!\s*:)/
```

Confidence: **0.60** (lower — no specific verse, may be a false positive)

---

## Step 4: Book Resolver

Maps spoken book names (and their many variations) to canonical book names used in the database.

### Book Name Variations (Examples)

```typescript
const BOOK_ALIASES: Record<string, string> = {
  // Genesis
  'genesis': 'Genesis', 'gen': 'Genesis',

  // Exodus
  'exodus': 'Exodus', 'exod': 'Exodus', 'ex': 'Exodus',

  // Psalms
  'psalms': 'Psalms', 'psalm': 'Psalms', 'ps': 'Psalms',

  // Numbered books
  '1 samuel': '1 Samuel', 'first samuel': '1 Samuel', '1st samuel': '1 Samuel',
  '2 samuel': '2 Samuel', 'second samuel': '2 Samuel', '2nd samuel': '2 Samuel',

  '1 corinthians': '1 Corinthians', 'first corinthians': '1 Corinthians',
  '2 corinthians': '2 Corinthians', 'second corinthians': '2 Corinthians',

  '1 kings': '1 Kings', 'first kings': '1 Kings',
  '2 kings': '2 Kings', 'second kings': '2 Kings',

  '1 john': '1 John', 'first john': '1 John',
  '2 john': '2 John', 'second john': '2 John',
  '3 john': '3 John', 'third john': '3 John',

  // Common abbreviations
  'matt': 'Matthew', 'matthew': 'Matthew', 'mat': 'Matthew',
  'mark': 'Mark', 'mk': 'Mark',
  'luke': 'Luke', 'lk': 'Luke',
  'john': 'John', 'jn': 'John',
  'acts': 'Acts',
  'rom': 'Romans', 'romans': 'Romans',
  'gal': 'Galatians', 'galatians': 'Galatians',
  'eph': 'Ephesians', 'ephesians': 'Ephesians',
  'phil': 'Philippians', 'philippians': 'Philippians',
  'col': 'Colossians', 'colossians': 'Colossians',
  'rev': 'Revelation', 'revelation': 'Revelation', 'revelations': 'Revelation',
  // ... full list for all 66 books
};
```

### Ambiguity Resolution

Some names are ambiguous:
- **"John"** → Gospel of John (not 1/2/3 John)
- **"Phil"** → Philippians (not Philemon) — unless followed by "emon"
- **"Judges"** vs **"Jude"** — matched by full word

The resolver uses longest-match-first to avoid partial matches.

---

## Step 5: Translation Detector

Scans the text buffer for translation keywords within a window around the detected verse reference.

### Detection Window

```
[ 5 seconds before verse reference ] ← SCAN → [ 5 seconds after verse reference ]
```

### Translation Keywords

```typescript
const TRANSLATION_KEYWORDS: Record<string, string[]> = {
  'KJV':  ['king james', 'kjv', 'king james version', 'authorized version'],
  'NKJV': ['new king james', 'nkjv', 'new king james version'],
  'NIV':  ['niv', 'new international', 'new international version'],
  'ESV':  ['esv', 'english standard', 'english standard version'],
  'AMP':  ['amplified', 'amp', 'amplified bible', 'amplified version'],
  'NLT':  ['nlt', 'new living', 'new living translation'],
  'MSG':  ['message', 'msg', 'the message', 'message bible'],
  'NASB': ['nasb', 'new american standard', 'new american standard bible'],
};
```

### Priority Rules

1. If a translation keyword is found **after** the verse reference → highest priority (most likely intentional)
2. If found **before** → medium priority
3. If no keyword found → use the operator's configured default translation
4. If multiple keywords found → use the one closest to the verse reference

---

## Step 6: Deduplicator

Prevents the same verse from being detected repeatedly when the preacher talks about it for an extended time.

**Rules:**
- Same book + chapter + verse within 30 seconds → suppressed
- Same book + chapter (different verse) → allowed (new verse)
- Same verse after 60 seconds → allowed (preacher returned to it)
- Different translation of the same verse → allowed (preacher asked for another translation)

---

## Confidence Scoring

Each detection receives a confidence score from 0.0 to 1.0:

| Factor | Impact |
|--------|--------|
| Direct reference format (Book Ch:V) | +0.30 |
| Contextual cue ("turn to", "read") | +0.15 |
| "Chapter" and "verse" words present | +0.15 |
| Book name is unambiguous | +0.15 |
| Chapter/verse numbers are valid for that book | +0.15 |
| Speech recognition confidence is high | +0.10 |

**Threshold behavior:**
- Score ≥ 0.80 → Auto-display in Auto mode; show with green border in Approve mode
- Score 0.50–0.79 → Always requires operator approval; shown with yellow border
- Score < 0.50 → Discarded (too likely a false positive)

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| "John" (just a name, not a book) | Low confidence; no chapter/verse → discarded |
| "Mark my words" | "Mark" without a number → discarded |
| "3:16 in the afternoon" | No book name → discarded |
| "He was the first king" | "first king" ≠ "1 Kings"; no chapter → discarded |
| "Psalm 23" (no verse) | Detected as whole chapter; display verses 1–6 |
| "the 23rd Psalm" | Normalizer converts → "psalm 23" → detected |
| "Acts chapter 2 verse 1, actually verse 4" | Detects both Acts 2:1 and Acts 2:4; latest wins |
| "Read it again" | No verse reference → ignored |
