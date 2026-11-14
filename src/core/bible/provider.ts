export interface VerseData {
  reference: string;
  translation: string;
  text: string;
}

// In-memory cache for fast instant redisplay during sermons
const verseCache = new Map<string, VerseData>();

export async function fetchVerse(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
  requestedTranslation?: string
): Promise<VerseData | null> {
  const trans = (requestedTranslation || 'KJV').toUpperCase();
  const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
  const reference = `${book} ${chapter}:${verseRange}`;
  const cacheKey = `${reference}_${trans}`;

  if (verseCache.has(cacheKey)) {
    return verseCache.get(cacheKey)!;
  }

  // Attempt API lookup (maps translations to public domain / open API formats)
  const apiTranslation = trans === 'KJV' ? 'kjv' : trans === 'AMP' ? 'web' : 'kjv';

  try {
    const formattedRef = encodeURIComponent(`${book} ${chapter}:${verseRange}`);
    const res = await fetch(`https://bible-api.com/${formattedRef}?translation=${apiTranslation}`);

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        const result: VerseData = {
          reference: `${book} ${chapter}:${verseRange}`,
          translation: trans,
          text: data.text.trim().replace(/\s+/g, ' ')
        };
        verseCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`[BibleProvider] Online fetch failed for ${reference}:`, err);
  }

  // Fallback fallback placeholder so the display never breaks on screen
  const fallback: VerseData = {
    reference: `${book} ${chapter}:${verseRange}`,
    translation: trans,
    text: `[${reference} (${trans})]`
  };
  return fallback;
}
