import { contentForComparison, diceSimilarity, titleFromPath, wordSet } from "./text";
import type { DuplicatePair, VaultNote } from "./types";

const TITLE_THRESHOLD = 0.72;
const CONTENT_THRESHOLD = 0.58;

export function findDuplicatePairs(notes: VaultNote[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  for (let index = 0; index < notes.length; index++) {
    for (let otherIndex = index + 1; otherIndex < notes.length; otherIndex++) {
      const left = notes[index];
      const right = notes[otherIndex];
      const titleSimilarity = diceSimilarity(wordSet(titleFromPath(left.path)), wordSet(titleFromPath(right.path)));
      const contentSimilarity = diceSimilarity(wordSet(contentForComparison(left.content)), wordSet(contentForComparison(right.content)));
      if ((titleSimilarity >= TITLE_THRESHOLD && contentSimilarity >= 0.35) || contentSimilarity >= CONTENT_THRESHOLD) {
        pairs.push({ left: left.path, right: right.path, titleSimilarity, contentSimilarity });
      }
    }
  }
  return pairs.sort((a, b) => a.left.localeCompare(b.left) || a.right.localeCompare(b.right));
}
