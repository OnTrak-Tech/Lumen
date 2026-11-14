export interface TranslationMatch {
  translation: string;
  matchedText: string;
  index: number;
}

export const TRANSLATION_PATTERNS: { id: string; patterns: RegExp[] }[] = [
  {
    id: 'AMP',
    patterns: [
      /\b(?:amplified(?:\s+bible|\s+version)?|amp)\b/i
    ]
  },
  {
    id: 'KJV',
    patterns: [
      /\b(?:king\s+james(?:\s+version)?|kjv|authorized\s+version)\b/i
    ]
  },
  {
    id: 'NKJV',
    patterns: [
      /\b(?:new\s+king\s+james(?:\s+version)?|nkjv)\b/i
    ]
  },
  {
    id: 'NIV',
    patterns: [
      /\b(?:new\s+international(?:\s+version)?|niv)\b/i
    ]
  },
  {
    id: 'ESV',
    patterns: [
      /\b(?:english\s+standard(?:\s+version)?|esv)\b/i
    ]
  },
  {
    id: 'NLT',
    patterns: [
      /\b(?:new\s+living(?:\s+translation)?|nlt)\b/i
    ]
  },
  {
    id: 'MSG',
    patterns: [
      /\b(?:the\s+message(?:\s+bible)?|message\s+bible|msg)\b/i
    ]
  },
  {
    id: 'NASB',
    patterns: [
      /\b(?:new\s+american\s+standard(?:\s+bible)?|nasb)\b/i
    ]
  }
];

/**
 * Searches text for any mention of a Bible translation.
 * Returns the detected translation id (e.g. "AMP", "NIV", "KJV") or null.
 */
export function detectTranslation(text: string): TranslationMatch | null {
  for (const { id, patterns } of TRANSLATION_PATTERNS) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        return {
          translation: id,
          matchedText: match[0],
          index: match.index
        };
      }
    }
  }
  return null;
}
