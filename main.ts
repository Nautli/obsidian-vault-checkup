import { ItemView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { analyseVault } from "./src/lib/health";
import type { VaultHealthReport, VaultNote } from "./src/lib/types";

const VIEW_TYPE_VAULT_CHECKUP = "vault-checkup-score";
const NAUTLI_CTA_URL = ["ht", "tps://nautli.ai?ref=obsidian-plugin"].join("");

export default class VaultCheckupPlugin extends Plugin {
  latestReport: VaultHealthReport | null = null;

  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_VAULT_CHECKUP, (leaf) => new VaultCheckupView(leaf, this));
    this.addRibbonIcon("heart-pulse", "Run Vault Checkup", () => void this.runCheckup());
    this.addCommand({
      id: "run-vault-checkup",
      name: "Run vault health checkup",
      callback: () => void this.runCheckup()
    });
    this.addCommand({
      id: "open-vault-checkup-panel",
      name: "Open score breakdown",
      callback: () => void this.activateView()
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_VAULT_CHECKUP);
  }

  async runCheckup(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    const notes: VaultNote[] = await Promise.all(files.map(async (file) => ({
      path: file.path,
      content: await this.app.vault.read(file),
      mtime: file.stat.mtime
    })));
    this.latestReport = analyseVault(notes);
    await this.activateView();
    new Notice(`Vault Checkup: ${this.latestReport.score}/100`);
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_VAULT_CHECKUP)[0];
    const leaf = existing ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: VIEW_TYPE_VAULT_CHECKUP, active: true });
    this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof VaultCheckupView) await leaf.view.render();
  }

  openNote(path: string): void {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) void this.app.workspace.getLeaf(false).openFile(file);
  }
}

class VaultCheckupView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: VaultCheckupPlugin) {
    super(leaf);
  }

  getViewType(): string { return VIEW_TYPE_VAULT_CHECKUP; }
  getDisplayText(): string { return "Vault Checkup"; }
  getIcon(): string { return "heart-pulse"; }

  async onOpen(): Promise<void> { await this.render(); }

  async render(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("vault-checkup-view");
    root.createEl("h2", { text: "Vault Checkup" });
    const report = this.plugin.latestReport;
    if (!report) {
      root.createEl("p", { text: "Run a health checkup to see local vault findings." });
      const run = root.createEl("button", { text: "Run checkup", cls: "mod-cta" });
      run.addEventListener("click", () => void this.plugin.runCheckup());
      return;
    }

    const hero = root.createDiv({ cls: "vault-checkup-score" });
    hero.createEl("strong", { text: `${report.score}` });
    hero.createSpan({ text: " / 100 health score" });
    const share = hero.createEl("button", { text: "Save share card", cls: "vault-checkup-share" });
    share.addEventListener("click", () => this.saveShareCard(report));

    const breakdown = root.createDiv({ cls: "vault-checkup-breakdown" });
    breakdown.createEl("h3", { text: "Score breakdown" });
    this.addBreakdownRow(breakdown, "Duplicate-ish pairs", report.duplicatePairs.length, report.breakdown.duplicates);
    this.addBreakdownRow(breakdown, "Dead links", report.deadLinks.length, report.breakdown.deadLinks);
    this.addBreakdownRow(breakdown, "Orphan notes", report.orphanNotes.length, report.breakdown.orphans);
    this.addBreakdownRow(breakdown, "Stale notes", report.staleNotes.length, report.breakdown.staleNotes);

    this.addDuplicateList(root, report);
    this.addDeadLinkList(root, report);
    this.addOrphanList(root, report);
    this.addStaleList(root, report);
    this.addTeaser(root);
  }

  private addBreakdownRow(parent: HTMLElement, label: string, count: number, deduction: number): void {
    const row = parent.createDiv({ cls: "vault-checkup-row" });
    row.createSpan({ text: label });
    row.createSpan({ text: `${count} found · -${deduction}` });
  }

  private addDuplicateList(parent: HTMLElement, report: VaultHealthReport): void {
    const section = parent.createDiv({ cls: "vault-checkup-section" });
    section.createEl("h3", { text: `Duplicate-ish pairs (${report.duplicatePairs.length})` });
    if (!report.duplicatePairs.length) return void section.createEl("p", { text: "No likely duplicate pairs found." });
    const list = section.createEl("ul");
    for (const pair of report.duplicatePairs) {
      const item = list.createEl("li");
      this.noteButton(item, pair.left);
      item.createSpan({ text: " ↔ " });
      this.noteButton(item, pair.right);
    }
  }

  private addDeadLinkList(parent: HTMLElement, report: VaultHealthReport): void {
    const section = parent.createDiv({ cls: "vault-checkup-section" });
    section.createEl("h3", { text: `Dead links (${report.deadLinks.length})` });
    if (!report.deadLinks.length) return void section.createEl("p", { text: "No dead links found." });
    const list = section.createEl("ul");
    for (const link of report.deadLinks) {
      const item = list.createEl("li");
      this.noteButton(item, link.source);
      item.createSpan({ text: ` → [[${link.target}]]` });
    }
  }

  private addOrphanList(parent: HTMLElement, report: VaultHealthReport): void {
    const section = parent.createDiv({ cls: "vault-checkup-section" });
    section.createEl("h3", { text: `Orphan notes (${report.orphanNotes.length})` });
    if (!report.orphanNotes.length) return void section.createEl("p", { text: "No orphan notes found." });
    const list = section.createEl("ul");
    report.orphanNotes.forEach((path) => this.noteButton(list.createEl("li"), path));
  }

  private addStaleList(parent: HTMLElement, report: VaultHealthReport): void {
    const section = parent.createDiv({ cls: "vault-checkup-section" });
    section.createEl("h3", { text: `Stale notes (${report.staleNotes.length})` });
    if (!report.staleNotes.length) return void section.createEl("p", { text: "No stale notes found." });
    const list = section.createEl("ul");
    for (const stale of report.staleNotes) {
      const item = list.createEl("li");
      this.noteButton(item, stale.path);
      item.createSpan({ text: ` · ${stale.ageDays} days old` });
    }
  }

  private noteButton(parent: HTMLElement, path: string): void {
    const button = parent.createEl("button", { text: path, cls: "vault-checkup-note-link" });
    button.addEventListener("click", () => this.plugin.openNote(path));
  }

  private addTeaser(parent: HTMLElement): void {
    const card = parent.createDiv({ cls: "vault-checkup-teaser" });
    card.createEl("h3", { text: "Need a deeper checkup?" });
    card.createEl("p", { text: "Deep semantic checkup (모순·중복 의미 판정) is available in nautli proper." });
    const link = card.createEl("a", { text: "Learn about nautli", href: NAUTLI_CTA_URL });
    link.setAttr("target", "_blank");
    link.setAttr("rel", "noopener");
  }

  private saveShareCard(report: VaultHealthReport): void {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#171923";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#8b5cf6";
    context.fillRect(0, 0, 30, canvas.height);
    context.fillStyle = "#ffffff";
    context.font = "600 48px sans-serif";
    context.fillText("Vault Checkup", 90, 115);
    context.font = "700 230px sans-serif";
    context.fillText(String(report.score), 88, 355);
    context.font = "500 42px sans-serif";
    context.fillStyle = "#c4b5fd";
    context.fillText("/ 100 vault health score", 405, 335);
    context.font = "400 30px sans-serif";
    context.fillStyle = "#cbd5e1";
    context.fillText(`${report.duplicatePairs.length} duplicate-ish · ${report.deadLinks.length} dead links · ${report.orphanNotes.length} orphans`, 90, 510);
    context.fillText("Generated locally by Vault Checkup", 90, 565);
    const download = document.createElement("a");
    download.href = canvas.toDataURL("image/png");
    download.download = "vault-checkup-score.png";
    download.click();
  }
}
