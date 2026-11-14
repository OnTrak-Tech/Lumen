import { DetectedVerse, TranscriptSegment } from './types';
import { resolveBook, BOOK_ALIAS_MAP, BookInfo } from './book-names';
import { normalizeTranscript } from './normalizer';
import { detectTranslation } from './translation-detector';

export class VerseDetector {
  private buffer: string = '';
  private lastDetectedVerse: { key: string; timestamp: number } | null = null;
  private dedupWindowMs: number = 30000; // 30 seconds

  constructor(dedupWindowMs = 30000) {
    this.dedupWindowMs = dedupWindowMs;
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.buffer = '';
    this.lastDetectedVerse = null;
  }

  /**
   * Feed a new transcript segment. Returns any newly detected verse.
   */
  public feed(segment: TranscriptSegment): DetectedVerse | null {
    if (!segment.text) return null;

    // Append to rolling buffer (keep up to ~500 characters)
    this.buffer += ' ' + segment.text;
    if (this.buffer.length > 500) {
      this.buffer = this.buffer.slice(this.buffer.length - 400);
    }

    return this.detectInText(this.buffer);
  }

  /**
   * Analyze raw text directly and detect verse references
   */
  public detectInText(rawText: string): DetectedVerse | null {
    const normalized = normalizeTranscript(rawText);

    // Look for translation in the whole text
    const translationMatch = detectTranslation(rawText) || detectTranslation(normalized);
    const translation = translationMatch ? translationMatch.translation : undefined;

    // Build regex pattern matching book names
    // Try each pattern from most specific to general

    // Pattern 1: Spoken "chapter X verse Y (through Z)"
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
          if (this.checkDedup(detected)) return detected;
        }
      }
    }

    // Pattern 2: Standard "Book X:Y" or "Book X:Y-Z"
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
          if (this.checkDedup(detected)) return detected;
        }
      }
    }

    // Pattern 3: "Psalm X" or "Psalms X:Y"
    // Psalms are frequently called "Psalm 23" or "the 23rd psalm" (normalizer converts to psalm 23)
    const psalmPattern = /\b(?:psalm|psalms)\s+(\d{1,3})(?:\s+verse\s+(\d{1,3}))?/gi;
    while ((match = psalmPattern.exec(normalized)) !== null) {
      const chapter = parseInt(match[1], 10);
      const verseStart = match[2] ? parseInt(match[2], 10) : 1; // Default to verse 1 if just Psalm 23
      const book = BOOK_ALIAS_MAP.get('psalms')!;

      if (chapter >= 1 && chapter <= 150) {
        const detected = this.createDetectedVerse(
          book.name,
          chapter,
          verseStart,
          match[2] ? undefined : 6, // If whole Psalm 23, verse 1-6
          translation,
          0.90,
          match[0]
        );
        if (this.checkDedup(detected)) return detected;
      }
    }

    return null;
  }

  private isValidVerse(book: BookInfo, chapter: number, verseStart: number, verseEnd?: number): boolean {
    if (chapter < 1 || chapter > book.chapters) return false;
    if (verseStart < 1 || verseStart > 176) return false; // Psalm 119 has 176 verses
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
    rawText: string
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
      timestamp: Date.now()
    };
  }

  private checkDedup(verse: DetectedVerse): boolean {
    const key = `${verse.book}_${verse.chapter}_${verse.verseStart}_${verse.verseEnd || ''}_${verse.translation || 'default'}`;
    const now = Date.now();

    if (this.lastDetectedVerse && this.lastDetectedVerse.key === key) {
      if (now - this.lastDetectedVerse.timestamp < this.dedupWindowMs) {
        return false; // Suppress duplicate
      }
    }

    this.lastDetectedVerse = { key, timestamp: now };
    return true;
  }
}
