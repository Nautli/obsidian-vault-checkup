# Vault Checkup

Vault Checkup is an Obsidian community plugin that gives your vault a small, deterministic health report. Run it from the ribbon or the **Run vault health checkup** command, then use the side-panel findings to open the affected notes.

## Features

- A 0–100 vault health score, with transparent capped deductions.
- Duplicate-ish note pairs, using normalized title and body word overlap.
- Dead internal wiki and Markdown links.
- Orphan notes with no inbound internal links.
- Stale notes, defined as untouched for 180 days.
- Click-to-open duplicate, dead-link, orphan, and stale-note findings.
- A locally generated PNG share card for the current score.
- A clearly user-initiated nautli teaser for deep semantic checkup (모순·중복 의미 판정). It does nothing until its link is clicked.

## Privacy

**No network, no telemetry, all local.** Vault Checkup only reads Markdown files from the vault when you run a checkup. It makes no background connections, sends no analytics, and makes no LLM calls. The optional nautli link is opened only by an explicit user click. The share card is rendered in the local browser canvas and downloaded directly to your device; it is never uploaded.

## Score model

The score starts at 100. Findings subtract points with category caps: duplicate-ish pairs −12 each (maximum −36), dead links −8 each (maximum −32), orphan notes −5 each (maximum −20), and stale notes −2 each (maximum −12). The score cannot go below zero.

Similarity is intentionally lightweight and deterministic: titles and content are normalized into word sets and compared by Dice similarity. It is a triage signal, not a semantic judgment.

## Install

Until the community release is available, copy `main.js`, `manifest.json`, and `styles.css` into:

`<your-vault>/.obsidian/plugins/vault-checkup/`

Then enable **Vault Checkup** in Obsidian’s Community plugins settings.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

`npm run dev` builds a development bundle with inline source maps. The tests use eight Markdown files under `test/fixtures/sample-vault` and fixed timestamps, so their score and findings are repeatable.
