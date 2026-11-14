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
  displayDuration: number; // in seconds
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
