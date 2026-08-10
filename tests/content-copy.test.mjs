import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const visibleCopy = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");

test("portal exposes the live-first archive modules without the retired duplicate sections", () => {
  for (const heading of [
    "SITE DIRECTORY",
    "SITE STATUS",
    "SYSTEM INFO",
    "QUICK LINKS",
    "SUPPORTED BY",
    "WELCOME TO SHINONOME NETWORK",
    "LIVE SYSTEMS / TRY IT",
    "SOURCE & RESEARCH",
    "PROJECT INDEX",
    "ABOUT THE WEBMASTER",
  ]) {
    assert.match(visibleCopy, new RegExp(heading.replace("&", "&(?:amp;)?")));
  }
  assert.doesNotMatch(visibleCopy, /FEATURED WORK/);
  assert.doesNotMatch(visibleCopy, /RESEARCH & BENCHMARKS/);
  assert.doesNotMatch(visibleCopy, /MORE DEMOS|Seq2Seq NMT/);
});

test("live systems lead with CAT-Psych and expose only usable public destinations", () => {
  const liveHeading = visibleCopy.indexOf("LIVE SYSTEMS / TRY IT");
  const cat = visibleCopy.indexOf("CAT-Psych", liveHeading);
  const programming = visibleCopy.indexOf("Programming Visualization", liveHeading);
  const prepLoop = visibleCopy.indexOf("PrepLoop", liveHeading);
  const xeon = visibleCopy.indexOf("Xeon Max 9470C Benchmarks", liveHeading);

  assert.ok(liveHeading >= 0 && liveHeading < cat);
  assert.ok(cat < programming && programming < prepLoop && prepLoop < xeon);
  assert.match(visibleCopy, /Adaptive Big Five Personality Assessment/);
  assert.match(visibleCopy, /50-item Big Five starter bank/);
  assert.match(visibleCopy, /Again \/ Hard \/ Good \/ Easy/);
  assert.match(visibleCopy, /52C \/ 104T · 64 GB HBM2e/);

  assert.match(html, /href="https:\/\/shinonome\.xyz\/cat-psych"/);
  assert.match(html, /href="https:\/\/2409324124\.github\.io\/programming-visualization\/examples\/"/);
  assert.match(html, /href="https:\/\/preploop\.shinonome\.xyz"/);
  assert.match(html, /href="https:\/\/2409324124\.github\.io\/xeon-max-9470c-benchmarks\/"/);
  assert.doesNotMatch(html, /href="https:\/\/github\.com\/2409324124\/preploop"/);
});

test("source and research is a compact second layer before the complete project index", () => {
  const sourceHeading = visibleCopy.indexOf("SOURCE & RESEARCH");
  const indexHeading = visibleCopy.indexOf("PROJECT INDEX", sourceHeading);

  assert.ok(sourceHeading >= 0 && sourceHeading < indexHeading);
  for (const project of [
    "DeepSeek Codex Adapter",
    "Qwen3 LaTeX Correction",
    "JobHunter Agent Harness",
    "Claude Multi-Provider Router",
  ]) {
    assert.ok(visibleCopy.indexOf(project, sourceHeading) < indexHeading);
  }
  assert.match(visibleCopy, /SSE · Parallel Tool Calls · MCP edit workflow/);
  assert.match(visibleCopy, /292 eval · 98\.97% math · 83\.22% exact/);
  assert.match(visibleCopy, /Fallback · cooldown · diagnostics/);
  assert.match(html, /href="https:\/\/github\.com\/2409324124\/jobhunter-agent-harness"/);
  assert.match(html, /href="https:\/\/github\.com\/2409324124\/claude-code-multi-provider-skill"/);
});

test("project index is the only complete directory and orders usable systems first", () => {
  const indexSection = html.match(/<section class="portal-panel project-index-panel"[\s\S]*?<\/section>/)?.[0] ?? "";
  const projectOrder = [
    "CAT-Psych",
    "Programming Visualization",
    "PrepLoop",
    "Xeon Max 9470C Benchmarks",
    "DeepSeek Codex Adapter",
    "Qwen3 LaTeX Correction",
    "JobHunter Agent Harness",
    "Claude Multi-Provider Router",
  ];
  let cursor = -1;
  for (const project of projectOrder) {
    const position = indexSection.indexOf(project);
    assert.ok(position > cursor, `${project} should follow the previous project`);
    cursor = position;
  }
  assert.equal((html.match(/<h2 class="panel-title">PROJECT INDEX<\/h2>/g) ?? []).length, 1);
  assert.doesNotMatch(html, /class="[^"]*research-panel/);
  assert.match(html, /href="https:\/\/2409324124\.github\.io\/xeon-max-9470c-benchmarks\/"/);
  assert.match(html, /href="https:\/\/shinonome\.xyz\/cat-psych"/);
  assert.match(html, /href="https:\/\/osf\.io\/preprints\/socarxiv\/xhky9_v1"/);
  assert.match(html, /href="https:\/\/orcid\.org\/0009-0008-6625-0148"/);
  assert.match(visibleCopy, /Intel Xeon CPU Max 9470C/);
  assert.match(visibleCopy, /64 GB HBM2e/);
});

test("archive retains the preprint and Runtime execution viewer", () => {
  assert.match(visibleCopy, /《我是21世纪的精神病人》/);
  assert.match(html, /href="https:\/\/osf\.io\/preprints\/socarxiv\/xhky9_v1"/);
  assert.match(html, /src="\.\/assets\/programming-runtime\.png"/);
  assert.match(html, /alt="Programming Visualization Runtime Execution Viewer/);
});
