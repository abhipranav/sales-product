/**
 * Calculates local readability metrics using standard formula heuristics
 * (Flesch-Kincaid & Flesch Reading Ease) with 0ms latency and no external API dependencies.
 */

export interface ReadabilityMetrics {
  readingEase: number;
  gradeLevel: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  complexWordsCount: number; // Words with 3 or more syllables
  readingTimeMinutes: number; // Standard 200 words per minute average
  checklist: {
    underWordLimit: boolean;
    hasClearCta: boolean;
    readableGrade: boolean;
  };
}

export function countSyllables(word: string): number {
  let cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length <= 2) return 1;

  // Remove silent e or ed/es endings
  if (cleaned.endsWith("es")) cleaned = cleaned.slice(0, -2);
  else if (cleaned.endsWith("ed")) cleaned = cleaned.slice(0, -2);
  else if (cleaned.endsWith("e")) {
    // Keep 'le' if preceding is a consonant (e.g. table, bottle)
    if (!cleaned.endsWith("le")) {
      cleaned = cleaned.slice(0, -1);
    }
  }

  // Count vowel groups
  const vowelMatches = cleaned.match(/[aeiouy]+/g);
  const count = vowelMatches ? vowelMatches.length : 0;

  // Make sure every word has at least 1 syllable
  return count || 1;
}

export function analyzeReadability(text: string): ReadabilityMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      readingEase: 100,
      gradeLevel: 0,
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      complexWordsCount: 0,
      readingTimeMinutes: 0,
      checklist: {
        underWordLimit: true,
        hasClearCta: false,
        readableGrade: true,
      },
    };
  }

  // 1. Sentences: split by punctuation (. ! ?)
  const sentenceRegex = /[^.!?]+([.!?]+|$)/g;
  const sentences = trimmed.match(sentenceRegex) || [trimmed];
  const sentenceCount = Math.max(1, sentences.length);

  // 2. Words: split by non-alphanumeric whitespace characters
  const wordRegex = /[a-zA-Z]+/g;
  const words = trimmed.match(wordRegex) || [];
  const wordCount = Math.max(1, words.length);

  // 3. Syllables & complex words
  let syllableCount = 0;
  let complexWordsCount = 0;

  for (const word of words) {
    const syl = countSyllables(word);
    syllableCount += syl;
    if (syl >= 3) {
      complexWordsCount++;
    }
  }

  // 4. Mathematical Formula Execution
  // Flesch Reading Ease: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const readingEase = Math.round(
    Math.max(0, Math.min(100, 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)))
  );

  // Flesch-Kincaid Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const gradeLevel = Math.round(
    Math.max(1, Math.min(16, 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59))
  );

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = parseFloat((wordCount / 200).toFixed(1));

  // Count CTAs (questions count as CTAs, check marks, specific asks)
  // Let's identify the presence of question marks or clear ask vocabulary
  const questionMatches = trimmed.match(/\?/g);
  const questionCount = questionMatches ? questionMatches.length : 0;
  const hasClearCta = questionCount === 1; // Optimal standard is exactly 1 clear question/CTA

  return {
    readingEase,
    gradeLevel,
    wordCount,
    sentenceCount,
    syllableCount,
    complexWordsCount,
    readingTimeMinutes,
    checklist: {
      underWordLimit: wordCount <= 100,
      hasClearCta,
      readableGrade: gradeLevel <= 7, // Lavender standard recommends 5th to 7th grade level
    },
  };
}
