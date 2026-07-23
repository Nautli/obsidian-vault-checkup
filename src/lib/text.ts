const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

export function titleFromPath(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/i, "") ?? path;
}

export function normaliseText(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g, "$1")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#*_>~]/g, " ");
}

export function wordSet(value: string): Set<string> {
  return new Set(normaliseText(value).match(WORD_PATTERN) ?? []);
}

export function diceSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) return 1;
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const word of left) if (right.has(word)) overlap++;
  return (2 * overlap) / (left.size + right.size);
}

export function contentForComparison(content: string): string {
  return content.replace(/^---[\s\S]*?---\s*/m, "").replace(/\n?```[\s\S]*?```/g, " ");
}
