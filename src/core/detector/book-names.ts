export interface BookInfo {
  id: number;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
  aliases: string[];
}

export const BIBLE_BOOKS: BookInfo[] = [
  // Old Testament
  { id: 1, name: 'Genesis', testament: 'OT', chapters: 50, aliases: ['gen', 'genesis', 'ge', 'gn'] },
  { id: 2, name: 'Exodus', testament: 'OT', chapters: 40, aliases: ['exod', 'exodus', 'ex', 'exo'] },
  { id: 3, name: 'Leviticus', testament: 'OT', chapters: 27, aliases: ['lev', 'leviticus', 'le', 'lv'] },
  { id: 4, name: 'Numbers', testament: 'OT', chapters: 36, aliases: ['num', 'numbers', 'nu', 'nm', 'nb'] },
  { id: 5, name: 'Deuteronomy', testament: 'OT', chapters: 34, aliases: ['deut', 'deuteronomy', 'dt', 'de'] },
  { id: 6, name: 'Joshua', testament: 'OT', chapters: 24, aliases: ['josh', 'joshua', 'jos', 'jsh'] },
  { id: 7, name: 'Judges', testament: 'OT', chapters: 21, aliases: ['judg', 'judges', 'jdg', 'jg', 'jdgs'] },
  { id: 8, name: 'Ruth', testament: 'OT', chapters: 4, aliases: ['ruth', 'rth', 'ru'] },
  { id: 9, name: '1 Samuel', testament: 'OT', chapters: 31, aliases: ['1 samuel', '1 sam', '1sam', 'first samuel', '1st samuel', 'first sam', '1st sam', '1 sa', '1s'] },
  { id: 10, name: '2 Samuel', testament: 'OT', chapters: 24, aliases: ['2 samuel', '2 sam', '2sam', 'second samuel', '2nd samuel', 'second sam', '2nd sam', '2 sa', '2s'] },
  { id: 11, name: '1 Kings', testament: 'OT', chapters: 22, aliases: ['1 kings', '1 kgs', '1kgs', 'first kings', '1st kings', '1 ki', '1k'] },
  { id: 12, name: '2 Kings', testament: 'OT', chapters: 25, aliases: ['2 kings', '2 kgs', '2kgs', 'second kings', '2nd kings', '2 ki', '2k'] },
  { id: 13, name: '1 Chronicles', testament: 'OT', chapters: 29, aliases: ['1 chronicles', '1 chron', '1chron', 'first chronicles', '1st chronicles', '1 ch', '1chr'] },
  { id: 14, name: '2 Chronicles', testament: 'OT', chapters: 36, aliases: ['2 chronicles', '2 chron', '2chron', 'second chronicles', '2nd chronicles', '2 ch', '2chr'] },
  { id: 15, name: 'Ezra', testament: 'OT', chapters: 10, aliases: ['ezra', 'ezr'] },
  { id: 16, name: 'Nehemiah', testament: 'OT', chapters: 13, aliases: ['neh', 'nehemiah', 'ne'] },
  { id: 17, name: 'Esther', testament: 'OT', chapters: 10, aliases: ['est', 'esther', 'esth', 'es'] },
  { id: 18, name: 'Job', testament: 'OT', chapters: 42, aliases: ['job', 'jb'] },
  { id: 19, name: 'Psalms', testament: 'OT', chapters: 150, aliases: ['psalm', 'psalms', 'ps', 'psa', 'pss', 'psm'] },
  { id: 20, name: 'Proverbs', testament: 'OT', chapters: 31, aliases: ['prov', 'proverbs', 'pro', 'prv', 'pr'] },
  { id: 21, name: 'Ecclesiastes', testament: 'OT', chapters: 12, aliases: ['eccl', 'ecclesiastes', 'ecc', 'ec'] },
  { id: 22, name: 'Song of Solomon', testament: 'OT', chapters: 8, aliases: ['song of solomon', 'song of songs', 'song', 'songs', 'sos', 'canticles', 'canticle of canticles'] },
  { id: 23, name: 'Isaiah', testament: 'OT', chapters: 66, aliases: ['isa', 'isaiah', 'is'] },
  { id: 24, name: 'Jeremiah', testament: 'OT', chapters: 52, aliases: ['jer', 'jeremiah', 'je', 'jr'] },
  { id: 25, name: 'Lamentations', testament: 'OT', chapters: 5, aliases: ['lam', 'lamentations', 'la'] },
  { id: 26, name: 'Ezekiel', testament: 'OT', chapters: 48, aliases: ['ezek', 'ezekiel', 'eze', 'ezk'] },
  { id: 27, name: 'Daniel', testament: 'OT', chapters: 12, aliases: ['dan', 'daniel', 'da', 'dn'] },
  { id: 28, name: 'Hosea', testament: 'OT', chapters: 14, aliases: ['hos', 'hosea', 'ho'] },
  { id: 29, name: 'Joel', testament: 'OT', chapters: 3, aliases: ['joel', 'joe', 'jl'] },
  { id: 30, name: 'Amos', testament: 'OT', chapters: 9, aliases: ['amos', 'am'] },
  { id: 31, name: 'Obadiah', testament: 'OT', chapters: 1, aliases: ['obad', 'obadiah', 'ob'] },
  { id: 32, name: 'Jonah', testament: 'OT', chapters: 4, aliases: ['jonah', 'jon', 'jnh'] },
  { id: 33, name: 'Micah', testament: 'OT', chapters: 7, aliases: ['mic', 'micah', 'mc'] },
  { id: 34, name: 'Nahum', testament: 'OT', chapters: 3, aliases: ['nah', 'nahum', 'na'] },
  { id: 35, name: 'Habakkuk', testament: 'OT', chapters: 3, aliases: ['hab', 'habakkuk', 'hb', 'habk'] },
  { id: 36, name: 'Zephaniah', testament: 'OT', chapters: 3, aliases: ['zeph', 'zephaniah', 'zep', 'zp'] },
  { id: 37, name: 'Haggai', testament: 'OT', chapters: 2, aliases: ['hag', 'haggai', 'hg'] },
  { id: 38, name: 'Zechariah', testament: 'OT', chapters: 14, aliases: ['zech', 'zechariah', 'zec', 'zc'] },
  { id: 39, name: 'Malachi', testament: 'OT', chapters: 4, aliases: ['mal', 'malachi', 'ml'] },

  // New Testament
  { id: 40, name: 'Matthew', testament: 'NT', chapters: 28, aliases: ['matt', 'matthew', 'mat', 'mt'] },
  { id: 41, name: 'Mark', testament: 'NT', chapters: 16, aliases: ['mark', 'mrk', 'mk'] },
  { id: 42, name: 'Luke', testament: 'NT', chapters: 24, aliases: ['luke', 'luk', 'lk'] },
  { id: 43, name: 'John', testament: 'NT', chapters: 21, aliases: ['john', 'jhn', 'jn'] },
  { id: 44, name: 'Acts', testament: 'NT', chapters: 28, aliases: ['acts', 'act', 'ac', 'acts of the apostles'] },
  { id: 45, name: 'Romans', testament: 'NT', chapters: 16, aliases: ['rom', 'romans', 'ro', 'rm'] },
  { id: 46, name: '1 Corinthians', testament: 'NT', chapters: 16, aliases: ['1 corinthians', '1 cor', '1cor', 'first corinthians', '1st corinthians', 'first cor', '1st cor', '1 co', '1co'] },
  { id: 47, name: '2 Corinthians', testament: 'NT', chapters: 13, aliases: ['2 corinthians', '2 cor', '2cor', 'second corinthians', '2nd corinthians', 'second cor', '2nd cor', '2 co', '2co'] },
  { id: 48, name: 'Galatians', testament: 'NT', chapters: 6, aliases: ['gal', 'galatians', 'ga'] },
  { id: 49, name: 'Ephesians', testament: 'NT', chapters: 6, aliases: ['eph', 'ephesians', 'ep'] },
  { id: 50, name: 'Philippians', testament: 'NT', chapters: 4, aliases: ['phil', 'philippians', 'php', 'pp'] },
  { id: 51, name: 'Colossians', testament: 'NT', chapters: 4, aliases: ['col', 'colossians', 'co'] },
  { id: 52, name: '1 Thessalonians', testament: 'NT', chapters: 5, aliases: ['1 thessalonians', '1 thess', '1thess', 'first thessalonians', '1st thessalonians', '1 th', '1th'] },
  { id: 53, name: '2 Thessalonians', testament: 'NT', chapters: 3, aliases: ['2 thessalonians', '2 thess', '2thess', 'second thessalonians', '2nd thessalonians', '2 th', '2th'] },
  { id: 54, name: '1 Timothy', testament: 'NT', chapters: 6, aliases: ['1 timothy', '1 tim', '1tim', 'first timothy', '1st timothy', '1 ti', '1ti'] },
  { id: 55, name: '2 Timothy', testament: 'NT', chapters: 4, aliases: ['2 timothy', '2 tim', '2tim', 'second timothy', '2nd timothy', '2 ti', '2ti'] },
  { id: 56, name: 'Titus', testament: 'NT', chapters: 3, aliases: ['titus', 'tit', 'ti'] },
  { id: 57, name: 'Philemon', testament: 'NT', chapters: 1, aliases: ['philem', 'philemon', 'phm', 'pm'] },
  { id: 58, name: 'Hebrews', testament: 'NT', chapters: 13, aliases: ['heb', 'hebrews', 'he'] },
  { id: 59, name: 'James', testament: 'NT', chapters: 5, aliases: ['james', 'jas', 'jm'] },
  { id: 60, name: '1 Peter', testament: 'NT', chapters: 5, aliases: ['1 peter', '1 pet', '1pet', 'first peter', '1st peter', '1 pe', '1pt', '1p'] },
  { id: 61, name: '2 Peter', testament: 'NT', chapters: 3, aliases: ['2 peter', '2 pet', '2pet', 'second peter', '2nd peter', '2 pe', '2pt', '2p'] },
  { id: 62, name: '1 John', testament: 'NT', chapters: 5, aliases: ['1 john', '1 jhn', '1john', 'first john', '1st john', '1 jn', '1j'] },
  { id: 63, name: '2 John', testament: 'NT', chapters: 1, aliases: ['2 john', '2 jhn', '2john', 'second john', '2nd john', '2 jn', '2j'] },
  { id: 64, name: '3 John', testament: 'NT', chapters: 1, aliases: ['3 john', '3 jhn', '3john', 'third john', '3rd john', '3 jn', '3j'] },
  { id: 65, name: 'Jude', testament: 'NT', chapters: 1, aliases: ['jude', 'jud', 'jd'] },
  { id: 66, name: 'Revelation', testament: 'NT', chapters: 22, aliases: ['rev', 'revelation', 'revelations', 'the revelation', 'apocalypse', 'rv'] }
];

// Pre-computed map for fast alias lookup
export const BOOK_ALIAS_MAP = new Map<string, BookInfo>();

// Build lookup map sorted by alias length descending (so "1 corinthians" matches before "1")
const allAliasesWithBook: { alias: string; book: BookInfo }[] = [];
for (const book of BIBLE_BOOKS) {
  // Always include canonical name in aliases
  const canonicalLower = book.name.toLowerCase();
  allAliasesWithBook.push({ alias: canonicalLower, book });
  for (const alias of book.aliases) {
    allAliasesWithBook.push({ alias: alias.toLowerCase(), book });
  }
}

// Sort longest alias first to match greedy
allAliasesWithBook.sort((a, b) => b.alias.length - a.alias.length);

for (const { alias, book } of allAliasesWithBook) {
  if (!BOOK_ALIAS_MAP.has(alias)) {
    BOOK_ALIAS_MAP.set(alias, book);
  }
}

export function resolveBook(spoken: string): BookInfo | null {
  const clean = spoken.toLowerCase().trim();
  return BOOK_ALIAS_MAP.get(clean) || null;
}
