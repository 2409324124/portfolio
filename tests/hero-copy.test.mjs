import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("hero states the real-world connection thesis", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const visibleCopy = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  assert.match(visibleCopy, /连接 真实世界/);
  assert.match(visibleCopy, /我是东云，关注 Coding Agent 与深度学习。/);
  assert.match(visibleCopy, /让我们将虚拟世界与真实世界 Link Start！/);
  assert.doesNotMatch(visibleCopy, /把模型、工具和 真实世界接起来。/);
});
