import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { findDuplicatePairs } from "../src/lib/duplicates";
import { findDeadLinks, findOrphans } from "../src/lib/links";
import { analyseVault, findStaleNotes } from "../src/lib/health";
import type { VaultNote } from "../src/lib/types";

const NOW = Date.UTC(2025, 0, 1);
const FIXTURE_ROOT = path.join(process.cwd(), "test", "fixtures", "sample-vault");

async function fixtureNotes(): Promise<VaultNote[]> {
  const files = (await readdir(FIXTURE_ROOT)).filter((file) => file.endsWith(".md")).sort();
  return Promise.all(files.map(async (file) => ({
    path: file,
    content: await readFile(path.join(FIXTURE_ROOT, file), "utf8"),
    mtime: file === "Old Note.md" ? NOW - 240 * 86_400_000 : NOW - 14 * 86_400_000
  })));
}

test("duplicate-ish detection finds the intentionally similar project notes", async () => {
  const pairs = findDuplicatePairs(await fixtureNotes());
  assert.deepEqual(pairs.map((pair) => [pair.left, pair.right]), [["Project Alpha Notes.md", "Project Alpha.md"]]);
});

test("dead-link detection reports unresolved wiki links", async () => {
  const links = findDeadLinks(await fixtureNotes());
  assert.deepEqual(links, [
    { source: "Ideas.md", target: "Missing Note" },
    { source: "Project Alpha.md", target: "Missing Plan" }
  ]);
});

test("orphan and stale detection use deterministic note inputs", async () => {
  const notes = await fixtureNotes();
  assert.deepEqual(findOrphans(notes), ["Changelog.md", "Ideas.md", "Lonely.md", "Old Note.md", "Project Alpha Notes.md", "Reference.md"]);
  assert.deepEqual(findStaleNotes(notes, NOW), [{ path: "Old Note.md", ageDays: 240 }]);
});

test("sample vault produces a stable health score and expected findings", async () => {
  const report = analyseVault(await fixtureNotes(), { now: NOW });
  assert.equal(report.score, 50);
  assert.deepEqual(report.breakdown, {
    duplicates: 12,
    deadLinks: 16,
    orphans: 20,
    staleNotes: 2,
    totalDeductions: 50
  });
  assert.equal(report.duplicatePairs.length, 1);
  assert.equal(report.deadLinks.length, 2);
  assert.equal(report.orphanNotes.length, 6);
  assert.equal(report.staleNotes.length, 1);
});
