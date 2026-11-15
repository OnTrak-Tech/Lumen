export interface TranslationMatch {
  translation: string;
  matchedText: string;
  index: number;
}

export const TRANSLATION_PATTERNS: { id: string; patterns: RegExp[] }[] = [
  {
    id: 'NIV',
    patterns: [
      /\b(?:new\s+international(?:\s+(?:version|bible|translation))?|niv)\b/i
    ]
  },
  {
    id: 'ESV',
    patterns: [
      /\b(?:english\s+standard(?:\s+(?:version|bible|translation))?|esv)\b/i
    ]
  },
  {
    id: 'NKJV',
    patterns: [
      /\b(?:new\s+king\s+james(?:\s+(?:version|bible|translation))?|nkjv)\b/i
    ]
  },
  {
    id: 'KJV',
    patterns: [
      /\b(?:king\s+james(?:\s+(?:version|bible|translation))?|authorized\s+version|kjv)\b/i
    ]
  },
  {
    id: 'AMP',
    patterns: [
      /\b(?:amplified(?:\s+(?:bible|version|translation))?|amp)\b/i
    ]
  },
  {
    id: 'NLT',
    patterns: [
      /\b(?:new\s+living(?:\s+(?:translation|bible|version))?|nlt)\b/i
    ]
  },
  {
    id: 'MSG',
    patterns: [
      /\b(?:(?:the\s+)?message\s+(?:bible|version|translation)|(?:in|from|read|give\s+me)\s+(?:the\s+)?message|msg)\b/i
    ]
  },
  {
    id: 'NASB',
    patterns: [
      /\b(?:new\s+american\s+standard(?:\s+(?:bible|version|translation))?|nasb)\b/i
    ]
  },
  {
    id: 'CSB',
    patterns: [
      /\b(?:christian\s+standard(?:\s+(?:bible|version|translation))?|csb)\b/i
    ]
  },
  {
    id: 'TPT',
    patterns: [
      /\b(?:(?:the\s+)?passion\s+translation|passion\s+bible|tpt)\b/i
    ]
  }
];

/**
 * Searches text for any mention of a Bible translation.
 * Returns the detected translation id (e.g. "NIV", "ESV", "NKJV", "KJV", "AMP", "NLT", "MSG", "NASB", "CSB", "TPT") or null.
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
