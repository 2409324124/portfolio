import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const visibleCopy = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("manifesto treats failure as part of rebuilding systems", () => {
  assert.match(
    visibleCopy,
    /你能从历史中学到很多东西：毁灭、重建、繁荣，再毁灭……失败并不可怕，这世界上不存在一次就能跑通的系统。/,
  );
  assert.doesNotMatch(visibleCopy, /不只展示结果，也展示边界/);
});

test("JobHunter describes its BOSS JD workflow", () => {
  assert.match(
    visibleCopy,
    /基于 BOSS 直聘 JD 抓取、分析与简历修改构建的求职 Agent。/,
  );
  assert.doesNotMatch(visibleCopy, /所有外部动作都停在人工批准边界之前/);
});

test("CAD section names the Codex automated modeling workflow", () => {
  assert.match(visibleCopy, /Codex 实现自动建模工作流/);
  assert.doesNotMatch(visibleCopy, /代码最后也可以落到手里/);
});

test("About connects real-world suffering to the SocArXiv preprint", () => {
  assert.match(visibleCopy, /现实世界的苦难，也许远超人们的想象。/);
  assert.match(visibleCopy, /预印本：\s*《我是21世纪的精神病人》 ↗/);
  assert.match(
    html,
    /href="https:\/\/osf\.io\/preprints\/socarxiv\/xhky9_v1"/,
  );
  assert.doesNotMatch(visibleCopy, /我的预印本关注中国跨性别者/);
  assert.doesNotMatch(visibleCopy, /独立研究者，产品工程实践者/);
  assert.doesNotMatch(visibleCopy, /我关心模型怎样穿过 provider/);
});

test("Programming Visualization shows its Runtime execution viewer", () => {
  assert.match(
    visibleCopy,
    /面向程序执行过程的 Runtime 可视化：把代码行、变量状态、调用栈和数据结构变化转换为可回放轨迹。/,
  );
  assert.match(html, /src="\.\/assets\/programming-runtime\.png"/);
  assert.match(html, /alt="Programming Visualization 的 Runtime Execution Viewer/);
  assert.doesNotMatch(html, /attention-heatmap\.jpg/);
});
