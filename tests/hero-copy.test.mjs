import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const visibleCopy = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");

test("homepage identifies itself as the Shinonome Network archive", () => {
  assert.match(visibleCopy, /SHINONOME NETWORK/);
  assert.match(visibleCopy, /東雲 Personal Research & Engineering Archive/);
  for (const item of ["Home", "Live Systems", "Source & Research", "Project Index", "About", "Links"]) {
    assert.match(visibleCopy, new RegExp(item.replace("&", "&")));
  }
  assert.doesNotMatch(visibleCopy, /连接 真实世界/);
});

test("every internal archive link resolves to an element on the page", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `missing target for #${match[1]}`);
  }
});

test("portal avoids modern landing-page chrome and animation", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const script = await readFile(new URL("../app.js", import.meta.url), "utf8");

  assert.doesNotMatch(html, /class="[^"]*\bhero\b/);
  assert.doesNotMatch(html, /class="[^"]*\breveal\b/);
  assert.doesNotMatch(css, /border-radius|(?:linear|radial)-gradient|scale\(|translateY\(/);
  assert.doesNotMatch(script, /IntersectionObserver|requestAnimationFrame|data-filter/);
});
