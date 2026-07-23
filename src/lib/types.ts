export interface VaultNote {
  path: string;
  content: string;
  mtime: number;
}

export interface DuplicatePair {
  left: string;
  right: string;
  titleSimilarity: number;
  contentSimilarity: number;
}

export interface DeadLink {
  source: string;
  target: string;
}

export interface StaleNote {
  path: string;
  ageDays: number;
}

export interface HealthBreakdown {
  duplicates: number;
  deadLinks: number;
  orphans: number;
  staleNotes: number;
  totalDeductions: number;
}

export interface VaultHealthReport {
  score: number;
  breakdown: HealthBreakdown;
  duplicatePairs: DuplicatePair[];
  deadLinks: DeadLink[];
  orphanNotes: string[];
  staleNotes: StaleNote[];
}
