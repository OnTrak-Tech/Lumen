export interface DetectedVerse {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translation?: string;
  confidence: number;
  rawText: string;
  timestamp: number;
  isContextual?: boolean; // Flag indicating detection inferred from active passage context
}

export interface ActivePassageContext {
  book: string;
  chapter: number;
  lastVerse: number;
  translation?: string;
  timestamp: number;
}

export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface VerseResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface DisplayVersePayload {
  id: string;
  reference: string;
  translation: string;
  text: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  duration?: number;
}

export interface AppSettings {
  defaultTranslation: string;
  displayDuration: number;
  mode: 'auto' | 'approve' | 'manual';
  confidenceThreshold: number;
  obs: {
    host: string;
    port: number;
    password: string;
    autoShowHide: boolean;
    verseSourceName: string;
  };
}
