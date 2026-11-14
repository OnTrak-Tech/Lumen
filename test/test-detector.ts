import { VerseDetector } from '../src/core/detector/verse-detector.ts';

const detector = new VerseDetector(5000);

const testPhrases = [
  {
    input: "and if you turn to matthew chapter 1 verse 1 give amplified version please",
    expectedBook: "Matthew",
    expectedChapter: 1,
    expectedVerse: 1,
    expectedTranslation: "AMP"
  },
  {
    input: "for God so loved the world in john 3:16",
    expectedBook: "John",
    expectedChapter: 3,
    expectedVerse: 16,
    expectedTranslation: undefined
  },
  {
    input: "let us read from romans chapter 8 verse 28 through 30 in the niv",
    expectedBook: "Romans",
    expectedChapter: 8,
    expectedVerse: 28,
    expectedEndVerse: 30,
    expectedTranslation: "NIV"
  },
  {
    input: "the Lord is my shepherd as David wrote in psalm 23",
    expectedBook: "Psalms",
    expectedChapter: 23,
    expectedVerse: 1,
    expectedTranslation: undefined
  },
  {
    input: "love is patient love is kind 1 corinthians chapter 13 verse 4 king james version",
    expectedBook: "1 Corinthians",
    expectedChapter: 13,
    expectedVerse: 4,
    expectedTranslation: "KJV"
  }
];

console.log("=== Running Verse Detector Tests ===\n");
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
  const endVerseMatch = test.expectedEndVerse ? detected.verseEnd === test.expectedEndVerse : true;
  const transMatch = test.expectedTranslation ? detected.translation === test.expectedTranslation : true;

  if (bookMatch && chapterMatch && verseMatch && endVerseMatch && transMatch) {
    console.log(`✅ PASSED: "${test.input}"`);
    console.log(`   -> Detected: ${detected.book} ${detected.chapter}:${detected.verseStart}${detected.verseEnd ? '-' + detected.verseEnd : ''} [${detected.translation || 'DEFAULT'}] (Confidence: ${detected.confidence})\n`);
    passed++;
  } else {
    console.error(`❌ MISMATCH for: "${test.input}"`);
    console.error(`   Expected: ${test.expectedBook} ${test.expectedChapter}:${test.expectedVerse} [${test.expectedTranslation || 'none'}]`);
    console.error(`   Got:      ${detected.book} ${detected.chapter}:${detected.verseStart} [${detected.translation || 'none'}]\n`);
  }
}

console.log(`Summary: ${passed}/${testPhrases.length} tests passed.`);
if (passed === testPhrases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
