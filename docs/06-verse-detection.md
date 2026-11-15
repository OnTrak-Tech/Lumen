# 06 — Verse Detection Engine

## Overview

The Verse Detection Engine is the core intelligence of Lumen. It analyzes the real-time transcript from the Speech Engine and identifies Bible verse references, including the book, chapter, verse(s), requested translation, and **contextual verse jumps** during a sermon.

---

## Detection Pipeline

```
Transcript Stream
    │
    ▼
┌─────────────────┐
│ Text Buffer     │ ← Rolling window of recent transcript segments
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Normalizer      │ ← Standardizes numbers ("three" → 3), filler words
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reference       │ ← Regex patterns match canonical references (Book Ch:V)
│ Matcher         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Contextual      │ ← Resolves relative jumps ("verse 2", "next verse")
│ Memory Engine   │   using the 5-minute active passage context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Translation     │ ← Extracts translation requests (e.g. "Amplified", "NIV")
│ Detector        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deduplicator    │ ← Prevents duplicate triggers within window
└────────┬────────┘
         │
         ▼
DetectedVerse Event
```

---

## Contextual Passage Memory (Active Passage Tracking)

During live preaching, pastors rarely repeat the book and chapter once they have directed the congregation there. Lumen uses an in-memory **Active Passage Context** to track where the preacher is currently teaching.

### How It Works

1. When a verse is detected (e.g. `Matthew 1:1 [AMP]`), Lumen initializes an active context:
   ```typescript
   activeContext = {
     book: "Matthew",
     chapter: 1,
     lastVerse: 1,
     translation: "AMP",
     timestamp: Date.now()
   };
   ```
2. The context remains active for a **5-minute sliding window**.
3. If the preacher mentions a relative reference or a verse jump within that window, Lumen automatically infers the book and chapter.

### Contextual Patterns Supported

| Preacher Speech | Active Context | Resolved Verse |
|---|---|---|
| *"Now look at verse 2"* | `Matthew 1` | `Matthew 1:2 [AMP]` |
| *"Let us jump down to verse 12"* | `Matthew 1` | `Matthew 1:12 [AMP]` |
| *"Read the next verse"* | `Matthew 1:1` | `Matthew 1:2 [AMP]` |
| *"In verse 18 he says..."* | `Matthew 1` | `Matthew 1:18 [AMP]` |
| *"Read that in the NIV"* | `Matthew 1:18` | `Matthew 1:18 [NIV]` |

### Context Guardrails

To prevent false positives from everyday conversational numbers:
* **Trigger keyword required:** Numbers must be preceded by structural words (*"verse 2"*, *"look at verse 12"*, *"jump to verse 18"*, *"next verse"*).
* **Chapter boundary check:** Verifies the number exists within the active book's chapter (e.g., Matthew 1 has 25 verses; verse 40 is rejected).
* **Instant reset:** When a new book is mentioned (e.g., *"Now turn to Romans 8"*), the context immediately resets to the new book.
* **5-minute timeout:** Automatically expires if the pastor moves on without referencing the passage for 5 minutes.
