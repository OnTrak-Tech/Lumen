import { DetectedVerse, TranscriptSegment, ActivePassageContext } from './types';
import { resolveBook, BOOK_ALIAS_MAP, BookInfo } from './book-names';
import { normalizeTranscript } from './normalizer';
import { detectTranslation } from './translation-detector';

export class VerseDetector {
  private buffer: string = '';
  private lastDetectedVerse: { key: string; timestamp: number } | null = null;
  private dedupWindowMs: number = 20000; // 20 seconds dedup
  private activeContext: ActivePassageContext | null = null;
  private contextExpiryMs: number = 5 * 60 * 1000; // 5 minutes context memory

  constructor(dedupWindowMs = 20000, contextExpiryMs = 5 * 60 * 1000) {
    this.dedupWindowMs = dedupWindowMs;
    this.contextExpiryMs = contextExpiryMs;
  }

  /**
   * Reset detector state and passage memory
   */
  public reset(): void {
    this.buffer = '';
    this.lastDetectedVerse = null;
    this.activeContext = null;
  }

  /**
   * Feed a new transcript segment. Returns any newly detected verse.
   */
  public feed(segment: TranscriptSegment): DetectedVerse | null {
    if (!segment.text) return null;

    this.buffer += ' ' + segment.text;

    // Split on sentence boundaries so fragments from different sentences can't bleed together
    const sentences = this.buffer.split(/(?<=[.?!])\s+/);

    // Keep the last (possibly incomplete) sentence as the new buffer
    this.buffer = sentences[sentences.length - 1];
    if (this.buffer.length > 500) {
      this.buffer = this.buffer.slice(this.buffer.length - 400);
    }

    // Run detection on each complete sentence (all but the trailing incomplete one)
    const completeSentences = sentences.slice(0, -1);
    for (const sentence of completeSentences) {
      const result = this.detectInText(sentence.trim());
      if (result) return result;
    }

    // Also check the current incomplete buffer (catches mid-sentence references like "John 3:16")
    return this.detectInText(this.buffer.trim());
  }

  /**
   * Analyze raw text directly and detect verse references
   */
  public detectInText(rawText: string): DetectedVerse | null {
    const normalized = normalizeTranscript(rawText);

    // Look for explicit translation request in the text
    const translationMatch = detectTranslation(rawText) || detectTranslation(normalized);
    const translation = translationMatch ? translationMatch.translation : undefined;

    // STEP 1: Attempt full reference detection (Book + Chapter + Verse)

    // Pattern 1: Spoken "Book chapter X verse Y (through Z)"
    // e.g., "matthew chapter 1 verse 1", "john chapter 3 verse 16", "romans chapter 8 verse 28 through 30"
    const spokenPattern = /([1-3]?\s*[a-z]+)\s+chapter\s+(\d{1,3})\s+verse[s]?\s+(\d{1,3})(?:\s+(?:through|to|thru|-)\s+(\d{1,3}))?/gi;
    let match: RegExpExecArray | null;

    while ((match = spokenPattern.exec(normalized)) !== null) {
      const bookCandidate = match[1].trim();
      const book = resolveBook(bookCandidate);
      if (book) {
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

        if (this.isValidVerse(book, chapter, verseStart, verseEnd)) {
          const detected = this.createDetectedVerse(
            book.name,
            chapter,
            verseStart,
            verseEnd,
            translation,
            0.95,
            match[0]
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        }
      }
    }

    // Pattern 2A: Standard "Book X:Y" or "Book X:Y-Z" (colon notation)
    // e.g. "john 3:16", "romans 8:28", "1 corinthians 13:4-8"
    const standardPattern = /([1-3]?\s*[a-z]+)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/gi;

    while ((match = standardPattern.exec(normalized)) !== null) {
      const bookCandidate = match[1].trim();
      const book = resolveBook(bookCandidate);
      if (book) {
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

        if (this.isValidVerse(book, chapter, verseStart, verseEnd)) {
          const detected = this.createDetectedVerse(
            book.name,
            chapter,
            verseStart,
            verseEnd,
            translation,
            0.96,
            match[0]
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        }
      }
    }

    // Pattern 2B: "Book X verse Y" (omitted "chapter")
    // e.g. "john 10 verse 30", "romans 8 verse 28", "genesis 21, verse 3"
    const bookVersePattern = /([1-3]?\s*[a-z]+)\s+(\d{1,3})\s*,?\s*verse[s]?\s+(\d{1,3})(?:\s+(?:through|to|thru|-)\s+(\d{1,3}))?/gi;
    while ((match = bookVersePattern.exec(normalized)) !== null) {
      const bookCandidate = match[1].trim();
      const book = resolveBook(bookCandidate);
      if (book) {
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

        if (this.isValidVerse(book, chapter, verseStart, verseEnd)) {
          const detected = this.createDetectedVerse(
            book.name,
            chapter,
            verseStart,
            verseEnd,
            translation,
            0.94,
            match[0]
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        }
      }
    }

    // Pattern 2C: "Book chapter X Y" (omitted "verse")
    // e.g. "john chapter 10 30"
    const bookChapterSpacePattern = /([1-3]?\s*[a-z]+)\s+chapter\s+(\d{1,3})\s+(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/gi;
    while ((match = bookChapterSpacePattern.exec(normalized)) !== null) {
      const bookCandidate = match[1].trim();
      const book = resolveBook(bookCandidate);
      if (book) {
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

        if (this.isValidVerse(book, chapter, verseStart, verseEnd)) {
          const detected = this.createDetectedVerse(
            book.name,
            chapter,
            verseStart,
            verseEnd,
            translation,
            0.94,
            match[0]
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        }
      }
    }

    // Pattern 2D: Pure Space-Separated "Book X Y" (e.g. "John 10 30", "Romans 8 28", "Matthew 6 33", "1 Corinthians 13 4")
    const spacePattern = /([1-3]?\s*[a-z]+)\s+(\d{1,3})\s+(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/gi;
    while ((match = spacePattern.exec(normalized)) !== null) {
      const bookCandidate = match[1].trim();
      const book = resolveBook(bookCandidate);
      if (book) {
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

        if (this.isValidVerse(book, chapter, verseStart, verseEnd)) {
          const detected = this.createDetectedVerse(
            book.name,
            chapter,
            verseStart,
            verseEnd,
            translation,
            0.93,
            match[0]
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        }
      }
    }

    // Pattern 3: "Psalm X:Y" or "Psalm X verse Y" — requires a verse number, bare "Psalm X" only sets context
    const psalmPattern = /\b(?:psalm|psalms)\s+(\d{1,3})(?:[,:]?\s*verse\s+(\d{1,3}))?/gi;
    while ((match = psalmPattern.exec(normalized)) !== null) {
      const chapter = parseInt(match[1], 10);
      const book = BOOK_ALIAS_MAP.get('psalms')!;

      if (chapter >= 1 && chapter <= 150) {
        if (match[2]) {
          // Verse explicitly mentioned — detect and display
          const verseStart = parseInt(match[2], 10);
          const detected = this.createDetectedVerse(
            book.name, chapter, verseStart, undefined, translation, 0.90, match[0]
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        } else {
          // No verse mentioned — set context only so follow-up "verse X" resolves correctly
          this.updateContext(this.createDetectedVerse(
            book.name, chapter, 1, undefined, translation, 0, match[0]
          ));
        }
      }
    }

    // STEP 2: CONTEXTUAL PASSAGE RESOLUTION (Active Passage Memory)
    if (this.isContextActive()) {
      const context = this.activeContext!;
      const book = BOOK_ALIAS_MAP.get(context.book.toLowerCase());

      if (book) {
        // Pattern 4A: Relative "next verse"
        const nextVersePattern = /\b(?:read\s+)?(?:the\s+)?next\s+verse\b/i;
        if (nextVersePattern.test(normalized)) {
          const nextVerseNum = context.lastVerse + 1;
          if (this.isValidVerse(book, context.chapter, nextVerseNum)) {
            const detected = this.createDetectedVerse(
              context.book,
              context.chapter,
              nextVerseNum,
              undefined,
              translation || context.translation,
              0.92,
              'next verse',
              true
            );
            if (this.checkDedup(detected)) {
              this.updateContext(detected);
              return detected;
            }
          }
        }

        // Pattern 4B: Specific verse jump within active chapter
        const verseJumpPattern = /\b(?:look\s+at|jump\s+to|skip\s+to|go\s+to|turn\s+to|read|and|in|now)?\s*verse\s+(\d{1,3})(?:\s+(?:through|to|thru|-)\s+(\d{1,3}))?\b/gi;
        let jumpMatch: RegExpExecArray | null;

        while ((jumpMatch = verseJumpPattern.exec(normalized)) !== null) {
          const verseStart = parseInt(jumpMatch[1], 10);
          const verseEnd = jumpMatch[2] ? parseInt(jumpMatch[2], 10) : undefined;

          if (this.isValidVerse(book, context.chapter, verseStart, verseEnd)) {
            const detected = this.createDetectedVerse(
              context.book,
              context.chapter,
              verseStart,
              verseEnd,
              translation || context.translation,
              0.93,
              jumpMatch[0],
              true
            );
            if (this.checkDedup(detected)) {
              this.updateContext(detected);
              return detected;
            }
          }
        }

        // Pattern 4C: Translation switch on active verse without repeating the verse
        if (translation && translation !== context.translation) {
          const detected = this.createDetectedVerse(
            context.book,
            context.chapter,
            context.lastVerse,
            undefined,
            translation,
            0.91,
            rawText,
            true
          );
          if (this.checkDedup(detected)) {
            this.updateContext(detected);
            return detected;
          }
        }
      }
    }

    return null;
  }

  private isContextActive(): boolean {
    if (!this.activeContext) return false;
    const isNotExpired = (Date.now() - this.activeContext.timestamp) < this.contextExpiryMs;
    return isNotExpired;
  }

  private updateContext(detected: DetectedVerse): void {
    this.activeContext = {
      book: detected.book,
      chapter: detected.chapter,
      lastVerse: detected.verseStart,
      translation: detected.translation,
      timestamp: Date.now()
    };
  }

  private isValidVerse(book: BookInfo, chapter: number, verseStart: number, verseEnd?: number): boolean {
    if (chapter < 1 || chapter > book.chapters) return false;
    if (verseStart < 1 || verseStart > 176) return false;
    if (verseEnd !== undefined && (verseEnd < verseStart || verseEnd > 176)) return false;
    return true;
  }

  private createDetectedVerse(
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd: number | undefined,
    translation: string | undefined,
    confidence: number,
    rawText: string,
    isContextual: boolean = false
  ): DetectedVerse {
    const id = `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      id,
      book,
      chapter,
      verseStart,
      verseEnd,
      translation,
      confidence,
      rawText,
      timestamp: Date.now(),
      isContextual
    };
  }

  private checkDedup(verse: DetectedVerse): boolean {
    const key = `${verse.book}_${verse.chapter}_${verse.verseStart}_${verse.verseEnd || ''}_${verse.translation || 'default'}`;
    const now = Date.now();

    if (this.lastDetectedVerse && this.lastDetectedVerse.key === key) {
      if (now - this.lastDetectedVerse.timestamp < this.dedupWindowMs) {
        return false;
      }
    }

    this.lastDetectedVerse = { key, timestamp: now };
    return true;
  }
}
