import { resolveBook } from './book-names';

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90
};

const ORDINALS: Record<string, number> = {
  first: 1, '1st': 1,
  second: 2, '2nd': 2,
  third: 3, '3rd': 3,
  fourth: 4, '4th': 4,
  fifth: 5, '5th': 5,
  sixth: 6, '6th': 6,
  seventh: 7, '7th': 7,
  eighth: 8, '8th': 8,
  ninth: 9, '9th': 9,
  tenth: 10, '10th': 10,
  eleventh: 11, '11th': 11,
  twelfth: 12, '12th': 12,
  thirteenth: 13, '13th': 13,
  fourteenth: 14, '14th': 14,
  fifteenth: 15, '15th': 15,
  sixteenth: 16, '16th': 16,
  seventeenth: 17, '17th': 17,
  eighteenth: 18, '18th': 18,
  nineteenth: 19, '19th': 19,
  twentieth: 20, '20th': 20,
  thirtieth: 30, '30th': 30,
  fortieth: 40, '40th': 40,
  fiftieth: 50, '50th': 50
};

/**
 * Converts a sequence of number words into a number (e.g. "one hundred and fifty", "twenty three", "thirty")
 */
export function wordsToNumber(phrase: string): number | null {
  const clean = phrase.toLowerCase().replace(/-/g, ' ').replace(/\band\b/g, ' ').trim();
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  if (tokens.length === 1) {
    if (/^\d+$/.test(tokens[0])) return parseInt(tokens[0], 10);
    if (ORDINALS[tokens[0]] !== undefined) return ORDINALS[tokens[0]];
    if (SMALL_NUMBERS[tokens[0]] !== undefined) return SMALL_NUMBERS[tokens[0]];
    if (TENS[tokens[0]] !== undefined) return TENS[tokens[0]];
  }

  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      current += parseInt(token, 10);
      matchedAny = true;
    } else if (SMALL_NUMBERS[token] !== undefined) {
      current += SMALL_NUMBERS[token];
      matchedAny = true;
    } else if (TENS[token] !== undefined) {
      current += TENS[token];
      matchedAny = true;
    } else if (ORDINALS[token] !== undefined) {
      current += ORDINALS[token];
      matchedAny = true;
    } else if (token === 'hundred') {
      current = (current === 0 ? 1 : current) * 100;
      matchedAny = true;
    } else {
      return null;
    }
  }

  total += current;
  return matchedAny ? total : null;
}

/**
 * Normalizes speech transcript:
 * - standardizes lower case
 * - converts word numbers after "chapter" and "verse"
 * - converts spoken word numbers following Bible book names (e.g. "john ten thirty" -> "john 10 30")
 * - removes filler words
 */
export function normalizeTranscript(text: string): string {
  let lower = text.toLowerCase();

  // Remove common verbal fillers
  lower = lower.replace(/\b(um|uh|er|ah)\b/g, ' ');

  // Ordinal replacements for book prefixes (e.g. "first corinthians" -> "1 corinthians")
  lower = lower.replace(/\bfirst\s+/g, '1 ');
  lower = lower.replace(/\b1st\s+/g, '1 ');
  lower = lower.replace(/\bsecond\s+/g, '2 ');
  lower = lower.replace(/\b2nd\s+/g, '2 ');
  lower = lower.replace(/\bthird\s+/g, '3 ');
  lower = lower.replace(/\b3rd\s+/g, '3 ');

  // "chapter three verse sixteen" -> "chapter 3 verse 16"
  lower = lower.replace(/\bchapter\s+([a-z\s-]+?)(?=\s+(?:verse|verses|to|through|and|$|[.,;]))/g, (match, words) => {
    const num = wordsToNumber(words);
    return num !== null ? `chapter ${num}` : match;
  });

  // "verse two", "verses one through five", "verse twelve"
  lower = lower.replace(/\bverse[s]?\s+([a-z\s-]+?)(?=\s+(?:to|through|thru|-|and|$|[.,;]))/g, (match, words) => {
    const num = wordsToNumber(words);
    return num !== null ? `verse ${num}` : match;
  });

  // Trailing "verse two" at end of string or before punctuation
  lower = lower.replace(/\bverse\s+([a-z\s-]+)$/g, (match, words) => {
    const num = wordsToNumber(words);
    return num !== null ? `verse ${num}` : match;
  });

  // Split STT-concatenated chapter+verse numbers (e.g. "john 316" -> "john 3 16", "john 1010" -> "john 10 10")
  // Only applies when the number is NOT itself a valid standalone chapter for that book,
  // and is NOT followed by punctuation or "verse" (those are handled by other patterns)
  lower = lower.replace(/([1-3]?\s*[a-z]+)\s+(\d{2,6})(?!\s*[,.:])(?!\s+verse)/g, (match, bookCandidate, digits) => {
    const book = resolveBook(bookCandidate.trim());
    if (!book) return match;

    // If the number is a valid standalone chapter, leave it alone
    const asChapter = parseInt(digits, 10);
    if (asChapter >= 1 && asChapter <= book.chapters) return match;

    // Otherwise try splitting into chapter + verse
    let best: { ch: number; v: number } | null = null;
    for (let i = 1; i < digits.length; i++) {
      const ch = parseInt(digits.slice(0, i), 10);
      const v = parseInt(digits.slice(i), 10);
      if (ch >= 1 && ch <= book.chapters && v >= 1 && v <= 176) {
        if (!best || ch > best.ch) best = { ch, v };
      }
    }
    if (best) return `${bookCandidate} ${best.ch} ${best.v}`;
    return match;
  });

  // Convert spoken word numbers following Bible books (e.g. "john ten thirty" -> "john 10 30")
  const numWordPattern = '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)';
  const compoundNumPattern = `${numWordPattern}(?:\\s*(?:-|and)?\\s*${numWordPattern})?`;

  const spokenBookNumRegex = new RegExp(`([1-3]?\\s*[a-z]+)\\s+(${compoundNumPattern})\\s+(${compoundNumPattern})`, 'gi');

  lower = lower.replace(spokenBookNumRegex, (match, bookCandidate, numWord1, numWord2) => {
    const book = resolveBook(bookCandidate.trim());
    if (book) {
      const ch = wordsToNumber(numWord1);
      const v = wordsToNumber(numWord2);
      if (ch !== null && v !== null && ch >= 1 && ch <= book.chapters) {
        return `${bookCandidate} ${ch} ${v}`;
      }
    }
    return match;
  });

  return lower.replace(/\s+/g, ' ').trim();
}
