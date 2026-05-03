import { describe, it, expect } from "vitest";
import { countSyllables, analyzeReadability } from "./readability-helper";

describe("Lavender Readability Syllable Counter", () => {
  it("should count syllables in simple words", () => {
    expect(countSyllables("hello")).toBe(2);
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("syllable")).toBe(3);
  });

  it("should handle silent 'e' at the end of words", () => {
    expect(countSyllables("game")).toBe(1);
    expect(countSyllables("lame")).toBe(1);
  });

  it("should handle 'ed' and 'es' endings correctly", () => {
    expect(countSyllables("played")).toBe(1);
    expect(countSyllables("games")).toBe(1);
  });

  it("should guarantee at least 1 syllable even for very short words", () => {
    expect(countSyllables("a")).toBe(1);
    expect(countSyllables("")).toBe(1);
  });
});

describe("Lavender Email Readability Analyser", () => {
  it("should correctly handle empty input gracefully", () => {
    const emptyMetrics = analyzeReadability("");
    expect(emptyMetrics.wordCount).toBe(0);
    expect(emptyMetrics.gradeLevel).toBe(0);
    expect(emptyMetrics.checklist.underWordLimit).toBe(true);
    expect(emptyMetrics.checklist.hasClearCta).toBe(false);
  });

  it("should analyze a standard B2B sales email", () => {
    const emailText = `Hi John, 
    I noticed your team is looking to expand operations next month. 
    Would you have ten minutes next Tuesday at 2 PM to explore how we can optimize your distribution pipeline? 
    Best, Sarah.`;
    
    const analysis = analyzeReadability(emailText);
    expect(analysis.wordCount).toBeGreaterThan(15);
    expect(analysis.sentenceCount).toBe(3);
    // Standard sales email should have exactly 1 question mark CTA
    expect(analysis.checklist.hasClearCta).toBe(true);
    // B2B sales copy should be highly readable
    expect(analysis.gradeLevel).toBeLessThanOrEqual(8);
  });

  it("should penalize multiple question marks or excessive word counts", () => {
    // Email with 2 question marks (violates "1 clear CTA" rule)
    const emailWithTwoCtas = `Would Friday work? Or maybe next Monday?`;
    const analysis = analyzeReadability(emailWithTwoCtas);
    expect(analysis.checklist.hasClearCta).toBe(false);
  });
});
