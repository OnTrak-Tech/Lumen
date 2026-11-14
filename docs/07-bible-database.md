# 07 — Bible Database

## Overview

Lumen stores all Bible text locally in a SQLite database. This enables offline operation, instant lookups, and multiple translation support without relying on external APIs.

---

## Database Schema

### Tables

#### `translations`

Stores metadata about each available Bible translation.

```sql
CREATE TABLE translations (
    id          TEXT PRIMARY KEY,     -- 'KJV', 'NIV', 'AMP', etc.
    name        TEXT NOT NULL,        -- 'King James Version'
    abbreviation TEXT NOT NULL,       -- 'KJV'
    language    TEXT NOT NULL,        -- 'en'
    copyright   TEXT,                 -- Copyright notice
    description TEXT                  -- Brief description
);
```

#### `books`

Stores metadata about each book of the Bible.

```sql
CREATE TABLE books (
    id              INTEGER PRIMARY KEY,  -- 1–66
    name            TEXT NOT NULL,        -- 'Genesis', 'Matthew', etc.
    abbreviation    TEXT NOT NULL,        -- 'Gen', 'Matt', etc.
    testament       TEXT NOT NULL,        -- 'OT' or 'NT'
    chapter_count   INTEGER NOT NULL,     -- Number of chapters
    sort_order      INTEGER NOT NULL      -- Display order (1–66)
);
```

#### `verses`

Stores the actual verse text. This is the main table — one row per verse per translation.

```sql
CREATE TABLE verses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    translation_id  TEXT NOT NULL,        -- FK → translations.id
    book_id         INTEGER NOT NULL,     -- FK → books.id
    chapter         INTEGER NOT NULL,
    verse           INTEGER NOT NULL,
    text            TEXT NOT NULL,

    FOREIGN KEY (translation_id) REFERENCES translations(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Performance indexes
CREATE INDEX idx_verses_lookup ON verses(translation_id, book_id, chapter, verse);
CREATE INDEX idx_verses_range ON verses(translation_id, book_id, chapter);
```

#### `book_aliases`

Maps spoken/alternate book names to canonical book names. Used by the Verse Detector.

```sql
CREATE TABLE book_aliases (
    alias       TEXT PRIMARY KEY,     -- 'gen', 'genesis', '1 cor', 'first corinthians'
    book_id     INTEGER NOT NULL,     -- FK → books.id

    FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE INDEX idx_aliases ON book_aliases(alias);
```

---

## Supported Translations

### Included in MVP

| ID | Name | Language | Notes |
|----|------|----------|-------|
| KJV | King James Version | English | Public domain |
| NKJV | New King James Version | English | Check licensing |
| NIV | New International Version | English | Check licensing |
| ESV | English Standard Version | English | Check licensing |
| AMP | Amplified Bible | English | Check licensing |

### Planned for Phase 2

| ID | Name | Language |
|----|------|----------|
| NLT | New Living Translation | English |
| MSG | The Message | English |
| NASB | New American Standard Bible | English |
| CSB | Christian Standard Bible | English |
| TPT | The Passion Translation | English |

> **Note on Licensing:** Some translations are copyrighted and may require licensing for distribution. KJV and WEB (World English Bible) are public domain and can be freely distributed. For copyrighted translations, we'll need to either:
> - Obtain a distribution license
> - Use an API to fetch verses at runtime (requires internet)
> - Let users import their own Bible data files

---

## Data Volume

| Translation | Books | Chapters | Verses | Est. Size |
|-------------|-------|----------|--------|-----------|
| KJV | 66 | 1,189 | 31,102 | ~5 MB |
| Each additional | 66 | 1,189 | ~31,000 | ~5 MB |
| **5 translations** | — | — | ~155,000 | **~25 MB** |
| Book aliases | — | — | ~500 | < 1 MB |
| **Total** | — | — | — | **~30 MB** |

---

## Query Patterns

### Single Verse Lookup

```sql
SELECT v.text, b.name as book_name, v.chapter, v.verse, t.abbreviation as translation
FROM verses v
JOIN books b ON v.book_id = b.id
JOIN translations t ON v.translation_id = t.id
WHERE b.name = 'John'
  AND v.chapter = 3
  AND v.verse = 16
  AND v.translation_id = 'AMP';
```

**Expected performance:** < 1ms with index

### Verse Range Lookup

```sql
SELECT v.text, b.name as book_name, v.chapter, v.verse, t.abbreviation as translation
FROM verses v
JOIN books b ON v.book_id = b.id
JOIN translations t ON v.translation_id = t.id
WHERE b.name = 'Romans'
  AND v.chapter = 8
  AND v.verse BETWEEN 28 AND 30
  AND v.translation_id = 'NIV'
ORDER BY v.verse;
```

### Full Chapter Lookup

```sql
SELECT v.text, v.verse
FROM verses v
JOIN books b ON v.book_id = b.id
WHERE b.name = 'Psalms'
  AND v.chapter = 23
  AND v.translation_id = 'KJV'
ORDER BY v.verse;
```

### Book Name Resolution

```sql
SELECT b.name, b.id
FROM book_aliases ba
JOIN books b ON ba.book_id = b.id
WHERE ba.alias = 'first corinthians';
-- Returns: '1 Corinthians', 46
```

---

## Data Access Layer

```typescript
interface BibleDB {
  /**
   * Get a single verse.
   */
  getVerse(book: string, chapter: number, verse: number, translation: string): VerseResult | null;

  /**
   * Get a range of verses (e.g., Romans 8:28-30).
   */
  getVerseRange(
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    translation: string
  ): VerseResult[];

  /**
   * Get all verses in a chapter (e.g., Psalm 23).
   */
  getChapter(book: string, chapter: number, translation: string): VerseResult[];

  /**
   * Resolve a spoken book name to the canonical name.
   * Returns null if not found.
   */
  resolveBookName(alias: string): string | null;

  /**
   * Get all available translations.
   */
  getTranslations(): TranslationInfo[];

  /**
   * Check if a chapter/verse exists for a given book.
   * Used for validation.
   */
  verseExists(book: string, chapter: number, verse: number): boolean;
}

interface VerseResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface TranslationInfo {
  id: string;
  name: string;
  abbreviation: string;
}
```

---

## Data Sources

### Public Domain Translations

| Translation | Source | Format |
|-------------|--------|--------|
| KJV | [openbible.info](https://www.openbible.info) | CSV/JSON |
| WEB | [ebible.org](https://ebible.org) | USFM/JSON |
| ASV | [sacred-texts.com](https://sacred-texts.com) | Text |

### Open API Sources (for importing data)

| API | URL | Translations Available |
|-----|-----|----------------------|
| bible-api.com | `https://bible-api.com/john+3:16?translation=kjv` | KJV, WEB, and others |
| API.Bible | `https://api.scripture.api.bible` | 2,500+ translations (requires API key) |
| ESV API | `https://api.esv.org` | ESV only (requires API key) |

### Import Strategy

1. **MVP:** Bundle KJV data directly (public domain, ~5 MB)
2. **Additional translations:** Build an import script that fetches from APIs and populates the SQLite database
3. **User imports:** Allow users to import Bible data from standard formats (OSIS, USFM, JSON)

---

## Database Initialization

On first launch, Lumen:

1. Creates the SQLite database file at `~/.lumen/bible.db`
2. Runs the schema creation SQL
3. Populates the `books` table (66 books)
4. Populates the `book_aliases` table (~500 aliases)
5. Populates the `translations` table
6. Loads the bundled Bible data into the `verses` table
7. Creates indexes

**Estimated initialization time:** 2–5 seconds

On subsequent launches, the database is ready instantly.
