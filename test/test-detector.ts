import { VerseDetector } from '../src/core/detector/verse-detector.ts';

const detector = new VerseDetector(5000);

const testPhrases = [
  // Full Spoken Translation Names
  {
    input: "turn to Romans chapter 8 verse 28 in the new international version",
    expectedBook: "Romans",
    expectedChapter: 8,
    expectedVerse: 28,
    expectedTranslation: "NIV"
  },
  {
    input: "let us read from Ephesians 2:8 in the english standard version",
    expectedBook: "Ephesians",
    expectedChapter: 2,
    expectedVerse: 8,
    expectedTranslation: "ESV"
  },
  {
    input: "go to John 3:16 from the new king james version",
    expectedBook: "John",
    expectedChapter: 3,
    expectedVerse: 16,
    expectedTranslation: "NKJV"
  },
  {
    input: "open to Genesis 1:1 king james bible",
    expectedBook: "Genesis",
    expectedChapter: 1,
    expectedVerse: 1,
    expectedTranslation: "KJV"
  },
  {
    input: "give me the new living translation for matthew chapter 1 verse 1",
    expectedBook: "Matthew",
    expectedChapter: 1,
    expectedVerse: 1,
    expectedTranslation: "NLT"
  },
  {
    input: "look at john 3:16 in the message bible please",
    expectedBook: "John",
    expectedChapter: 3,
    expectedVerse: 16,
    expectedTranslation: "MSG"
  },
  {
    input: "read proverbs chapter 3 verse 5 in the christian standard bible",
    expectedBook: "Proverbs",
    expectedChapter: 3,
    expectedVerse: 5,
    expectedTranslation: "CSB"
  },
  {
    input: "Psalm 23 verse 1 from the new american standard bible",
    expectedBook: "Psalms",
    expectedChapter: 23,
    expectedVerse: 1,
    expectedTranslation: "NASB"
  },
  {
    input: "read Galatians chapter 5 verse 22 in the passion translation",
    expectedBook: "Galatians",
    expectedChapter: 5,
    expectedVerse: 22,
    expectedTranslation: "TPT"
  }
];

console.log("=== Running Full Spoken Translation Tests ===\n");
let passed = 0;

for (const test of testPhrases) {
  detector.reset();
  const detected = detector.detectInText(test.input);

  if (!detected) {
    console.error(`❌ FAILED to detect: "${test.input}"`);
    continue;
  }

  const bookMatch = detected.book === test.expectedBook;
  const chapterMatch = detected.chapter === test.expectedChapter;
  const verseMatch = detected.verseStart === test.expectedVerse;
  const transMatch = test.expectedTranslation ? detected.translation === test.expectedTranslation : true;

  if (bookMatch && chapterMatch && verseMatch && transMatch) {
    console.log(`✅ PASSED: "${test.input}"`);
    console.log(`   -> Detected: ${detected.book} ${detected.chapter}:${detected.verseStart} [${detected.translation || 'DEFAULT'}]\n`);
    passed++;
  } else {
    console.error(`❌ MISMATCH for: "${test.input}"`);
    console.error(`   Expected: ${test.expectedBook} ${test.expectedChapter}:${test.expectedVerse} [${test.expectedTranslation || 'none'}]`);
    console.error(`   Got:      ${detected.book} ${detected.chapter}:${detected.verseStart} [${detected.translation || 'none'}]\n`);
  }
}

console.log(`\nSummary: ${passed}/${testPhrases.length} translation variations passed.`);

if (passed === testPhrases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
