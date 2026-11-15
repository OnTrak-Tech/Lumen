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
 * Converts a sequence of number words into a number (e.g. "one hundred and fifty", "twenty three")
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
 * - replaces common spoken word numbers following "chapter", "verse", etc.
 * - removes filler words
 */
export function normalizeTranscript(text: string): string {
  let lower = text.toLowerCase();

  // Remove common verbal fillers
  lower = lower.replace(/\b(um|uh|er|ah)\b/g, ' ');

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

  // Ordinal replacements for book prefixes (e.g. "first corinthians" -> "1 corinthians")
  lower = lower.replace(/\bfirst\s+/g, '1 ');
  lower = lower.replace(/\b1st\s+/g, '1 ');
  lower = lower.replace(/\bsecond\s+/g, '2 ');
  lower = lower.replace(/\b2nd\s+/g, '2 ');
  lower = lower.replace(/\bthird\s+/g, '3 ');
  lower = lower.replace(/\b3rd\s+/g, '3 ');

  return lower.replace(/\s+/g, ' ').trim();
}
