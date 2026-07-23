import type { DeadLink, VaultNote } from "./types";

interface ExtractedLink { target: string; }

function cleanTarget(rawTarget: string): string | null {
  const target = rawTarget.trim().split("#", 1)[0].trim();
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("/")) return null;
  try {
    return decodeURIComponent(target).replace(/\\/g, "/");
  } catch {
    return target.replace(/\\/g, "/");
  }
}

export function extractInternalLinks(content: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const wiki = /!?\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
  const markdown = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
  for (const match of content.matchAll(wiki)) {
    const target = cleanTarget(match[1]);
    if (target) links.push({ target });
  }
  for (const match of content.matchAll(markdown)) {
    const target = cleanTarget(match[1]);
    if (target) links.push({ target });
  }
  return links;
}

function canonicalPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\.md$/i, "").toLowerCase();
}

function resolvesTo(target: string, sourcePath: string, knownPaths: Set<string>, knownNames: Set<string>): boolean {
  const normalized = canonicalPath(target);
  if (knownPaths.has(normalized)) return true;
  const folder = sourcePath.includes("/") ? sourcePath.slice(0, sourcePath.lastIndexOf("/")) : "";
  const relative = canonicalPath(folder ? `${folder}/${target}` : target);
  if (knownPaths.has(relative)) return true;
  return !target.includes("/") && knownNames.has(normalized);
}

export function findDeadLinks(notes: VaultNote[]): DeadLink[] {
  const knownPaths = new Set(notes.map((note) => canonicalPath(note.path)));
  const knownNames = new Set(notes.map((note) => canonicalPath(note.path.split("/").pop() ?? note.path)));
  const deadLinks: DeadLink[] = [];
  for (const note of notes) {
    for (const link of extractInternalLinks(note.content)) {
      if (!resolvesTo(link.target, note.path, knownPaths, knownNames)) {
        deadLinks.push({ source: note.path, target: link.target });
      }
    }
  }
  return deadLinks.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
}

export function findOrphans(notes: VaultNote[]): string[] {
  const inbound = new Set<string>();
  for (const note of notes) {
    for (const link of extractInternalLinks(note.content)) {
      for (const candidate of notes) {
        if (resolvesTo(link.target, note.path, new Set([canonicalPath(candidate.path)]), new Set([canonicalPath(candidate.path.split("/").pop() ?? candidate.path)]))) {
          inbound.add(candidate.path);
        }
      }
    }
  }
  return notes.map((note) => note.path).filter((path) => !inbound.has(path)).sort((a, b) => a.localeCompare(b));
}
