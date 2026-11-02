import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const copy = html.replace(/<script\b[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("portfolio orders current engineering evidence and removes obsolete projects", () => {
  let cursor = -1;
  for (const id of ["blender-workflow", "open-source", "benchmarks", "ai-video", "model-lab", "games"]) {
    const position = html.indexOf('id="' + id + '"');
    assert.ok(position > cursor, id + " should follow the previous section");
    cursor = position;
  }
  for (const name of ["Backlot", "Nanocoder", "Tracekit", "PowerShell", "ShellSem", "AI Video Harness", "Blender Asset Workflow", "Qwen", "TU22", "YAK-144"]) assert.ok(copy.includes(name), name);
  assert.doesNotMatch(html, /Programming Visualization|programming-visualization|PrepLoop|preploop|JobHunter|jobhunter|Claude Multi-Provider Router|claude-code-multi-provider|DeepSeek Codex Adapter|deepseek-codex-adapter|98\.97/i);
  for (const metric of ["33/56", "48/56", "56.5%", "66.0%"]) assert.ok(copy.includes(metric), metric);
  assert.doesNotMatch(html, /href="[^"]*github\.com\/2409324124\/blender-ai-video/);
});

test("scene modeling leads while AI Video Harness occupies section four", () => {
  const directory = html.match(/<div class="panel-body directory-tree">([\s\S]*?)<\/div>/)[1];
  assert.equal(directory.match(/href="(#[^"]+)"/)[1], '#blender-workflow');
  const nav = html.match(/<nav class="archive-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.equal(nav.match(/href="(#[^"]+)"/)[1], '#blender-workflow');
  const sections = [...html.matchAll(/<section\b[^>]*id="([^"]+)"[^>]*><h2 class="panel-title">(\d{2}) \/ /g)];
  assert.deepEqual(sections.map(m => [m[1], m[2]]), [['blender-workflow','01'], ['open-source','02'], ['benchmarks','03'], ['ai-video','04'], ['model-lab','05'], ['games','06']]);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const items = graph.find(item => item['@type'] === 'ItemList').itemListElement;
  assert.equal(items[0].item.name, 'Blender Asset Workflow');
  assert.equal(items[6].item.name, 'AI Video Harness');
});

test("writing and legacy destinations remain without legacy project cards", () => {
  for (const url of ["https://bbs.shinonome.xyz", "https://osf.io/preprints/socarxiv/xhky9_v1", "https://shinonome.xyz/cat-psych", "https://2409324124.github.io/xeon-max-9470c-benchmarks/report/"]) assert.ok(html.includes(url), url);
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] ?? "";
  for (const id of ["cat-psych", "hardware"]) assert.ok(footer.includes('id="' + id + '"'), id + " belongs in footer");
});

test("native video players use local latest media, accessible errors, and direct links", async () => {
  const videos = [...html.matchAll(/<video\b([^>]*)>([\s\S]*?)<\/video>/g)];
  assert.equal(videos.length, 3);
  for (const [i, id] of ["render-video", "api-video", "modeling-video"].entries()) {
    const [, attributes, body] = videos.find(([, attributes]) => attributes.includes('id="' + id + '"'));
    const name = ["tu22-blender-latest", "tu22-api-latest", "rivet-modeling-process"][i];
    const poster = ["tu22-blender-poster.webp", "tu22-api-poster.webp", "rivet-modeling-poster.webp"][i];
    for (const attribute of ['id="' + id + '"', "data-project-video", "controls", "playsinline", 'preload="none"', i === 2 ? 'width="1568"' : 'width="1280"', i === 2 ? 'height="1080"' : 'height="720"']) assert.ok(attributes.includes(attribute), attribute);
    assert.doesNotMatch(attributes, /\bautoplay\b/);
    assert.ok(attributes.includes('poster="./assets/' + poster + '"'));
    assert.ok(body.includes('src="./assets/' + name + '.mp4"'));
    const error = html.match(new RegExp('<p\\b[^>]*id="' + id + '-error"[^>]*>[\\s\\S]*?<\\/p>'))?.[0] ?? "";
    assert.match(error, /\bhidden\b/);
    assert.match(error, /role="status"/);
    assert.ok(html.replace(/<video\b[\s\S]*?<\/video>/g, "").includes('href="./assets/' + name + '.mp4"'));
    for (const file of [name + ".mp4", poster]) assert.ok((await stat(new URL("../assets/" + file, import.meta.url))).size > 0);
  }
});

test("Harness presentation documents provenance and independently viewable versions", () => {
  assert.match(copy, /场景理解与运镜控制/);
  assert.match(copy, /20\s*秒/);
  assert.match(copy, /10\s*秒/);
  assert.match(copy, /经检查的 ComfyUI 深度控制小样/);
  assert.match(copy, /已认可的 Blender v3 片段/);
  assert.match(copy, /不.{0,20}(逐帧|同步)|非.{0,20}(逐帧|同步)/);
  assert.match(html, /<details\b[\s\S]*?<summary>[^<]*实验[^<]*<\/summary>/);
});

test("scene gallery exposes manual navigation and only one initial slide", () => {
  assert.match(html, /data-scene-gallery/);
  const slides = [...html.matchAll(/<[^>]+data-gallery-slide[^>]*>/g)];
  assert.ok(slides.length >= 2);
  assert.equal(slides.filter(([tag]) => !/\bhidden\b/.test(tag)).length, 1);
  for (const selector of ["data-gallery-prev", "data-gallery-next", "data-gallery-toggle", "data-gallery-position"]) assert.ok(html.includes(selector));
});

test("formula illustration pairs accessible character art with local LaTeX text", () => {
  const art = html.match(/<figure class="formula-art"[\s\S]*?<\/figure>/)?.[0] ?? "";
  assert.match(art, /aria-labelledby="formula-caption"/);
  assert.match(art, /role="img" aria-label="算术平均值公式/);
  assert.match(art, /<pre aria-hidden="true">/);
  assert.ok(art.includes('\\bar{x} = \\frac{1}{n}'));
  assert.ok(art.includes('\\sum_{i=1}^{n} x_i'));
  assert.doesNotMatch(art, /<img|<script|https?:/);
});

test("projects introduce their purpose before attributing personal work", () => {
  const expectations = [
    ["backlot", "Agent 外部 API 仿真环境", "真实接口", "我对照"],
    ["nanocoder", "终端 Coding Agent", "长程任务", "我主导了完整 Plan Mode"],
    ["tracekit", "Agent 执行记录与校验工具", "误记为用户指令", "我通过 <code>submitted_prompt</code>"],
    ["powershell", "真实 Windows 环境", "最终状态来判断", "我用 KVM / QEMU"],
    ["shellsem", "Bash 任务评测", "需要分开归因", "我设计任务"],
    ["ai-video", "Blender 预演与 AI 视频生成实验", "运镜要求", "我将场景"],
    ["blender-workflow", "面向建模 Agent 的开源工作流", "保护已经认可的部分", "我把建模拆为"],
    ["model-lab", "专项微调实验", "错误公式", "我建立结构签名"],
    ["games", "浏览器飞行游戏", "实际游玩", "我将玩法"],
  ];
  for (const [id, definition, problem, contribution] of expectations) {
    const block = html.match(new RegExp('<(article|section)\\b[^>]*id="' + id + '"[^>]*>[\\s\\S]*?</\\1>'))?.[0] ?? "";
    assert.ok(block.includes(definition), `${id}: definition`);
    assert.ok(block.includes(problem), `${id}: problem`);
    assert.ok(block.indexOf(contribution) > block.indexOf(definition), `${id}: personal contribution follows definition`);
  }
});

test("official project artwork is local, decorative, and carries its license", async () => {
  for (const [project, licenseName] of [['backlot', /Apache License/], ['tracekit', /MIT License/]]) {
    assert.ok(html.includes(`src="./assets/${project}-icon.png" alt="" width="48" height="48"`));
    assert.ok((await stat(new URL(`../assets/${project}-icon.png`, import.meta.url))).size > 0);
    const license = await readFile(new URL(`../assets/${project}-icon.LICENSE.txt`, import.meta.url), 'utf8');
    assert.match(license, licenseName);
  }
  assert.match(html, /src="\.\/assets\/nanocoder-icon\.png" alt="" width="48" height="48"/);
  assert.ok((await stat(new URL('../assets/nanocoder-icon.png', import.meta.url))).size > 0);
  const license = await readFile(new URL('../assets/nanocoder-icon.LICENSE.txt', import.meta.url), 'utf8');
  assert.match(license, /MIT License/);
  assert.match(license, /Copyright \(c\) 2026 Nano Collective/);
  assert.match(license, /github\.com\/Nano-Collective\/nanocoder\/blob\/main\/assets\/nanocoder-icon\.png/);
});

test("TU22 describes Harness-driven development and bounded engine ownership", () => {
  const games = html.match(/<section\b[^>]*id="games"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const term of ['Harness 驱动的游戏开发', '自研引擎模块', 'ASCII 世界与字符渲染模块', '相机投影和飞行模型', 'Phaser／Three.js', '真实键鼠输入', '只读状态探针', '修复并复验', '首关真实输入 CLI']) assert.ok(games.includes(term), term);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const game = graph.find(item => item['@type'] === 'ItemList').itemListElement.at(-1).item;
  assert.match(game.description, /Harness.*自研引擎模块/);
});

test("resume-aligned copy preserves evidence boundaries and avoids private details", () => {
  for (const boundary of ['截至 2026-11-01，累计 5 个上游 PR', '该组未发现新增回归', '不等于任务全部通过', '同一 56 题开发集', '固定 200 题、4K 输出预算', '包含格式与可验证性改善', '首关真实输入 CLI', '单关原型']) assert.ok(copy.includes(boundary), boundary);
  assert.doesNotMatch(html, /徐健洲|18611635301|1200\+|非凡互娱/);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const items = graph.find(item => item['@type'] === 'ItemList').itemListElement;
  assert.equal(items.length, 9);
  assert.ok(items.every(item => item.item.description.length > 15));
});
