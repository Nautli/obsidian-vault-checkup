import { findDuplicatePairs } from "./duplicates";
import { findDeadLinks, findOrphans } from "./links";
import type { StaleNote, VaultHealthReport, VaultNote } from "./types";

export const DEFAULT_STALE_DAYS = 180;

export interface HealthOptions {
  now?: number;
  staleAfterDays?: number;
}

function cappedPenalty(count: number, each: number, cap: number): number {
  return Math.min(count * each, cap);
}

export function findStaleNotes(notes: VaultNote[], now: number, staleAfterDays = DEFAULT_STALE_DAYS): StaleNote[] {
  const cutoff = now - staleAfterDays * 86_400_000;
  return notes
    .filter((note) => note.mtime < cutoff)
    .map((note) => ({ path: note.path, ageDays: Math.floor((now - note.mtime) / 86_400_000) }))
    .sort((a, b) => b.ageDays - a.ageDays || a.path.localeCompare(b.path));
}

/** A score of 100 means no findings in the checked signals; 0 is the floor. */
export function analyseVault(notes: VaultNote[], options: HealthOptions = {}): VaultHealthReport {
  const now = options.now ?? Date.now();
  const staleAfterDays = options.staleAfterDays ?? DEFAULT_STALE_DAYS;
  const duplicatePairs = findDuplicatePairs(notes);
  const deadLinks = findDeadLinks(notes);
  const orphanNotes = findOrphans(notes);
  const staleNotes = findStaleNotes(notes, now, staleAfterDays);
  const deductions =
    cappedPenalty(duplicatePairs.length, 12, 36) +
    cappedPenalty(deadLinks.length, 8, 32) +
    cappedPenalty(orphanNotes.length, 5, 20) +
    cappedPenalty(staleNotes.length, 2, 12);
  return {
    score: Math.max(0, 100 - deductions),
    breakdown: {
      duplicates: cappedPenalty(duplicatePairs.length, 12, 36),
      deadLinks: cappedPenalty(deadLinks.length, 8, 32),
      orphans: cappedPenalty(orphanNotes.length, 5, 20),
      staleNotes: cappedPenalty(staleNotes.length, 2, 12),
      totalDeductions: deductions
    },
    duplicatePairs,
    deadLinks,
    orphanNotes,
    staleNotes
  };
}
