import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("identity and social metadata use Shinonome, without private resume contacts", () => {
  assert.match(html, /<h1>东云 \/ Shinonome<\/h1>/);
  assert.match(html, /<title>东云作品集｜Agent Engineering &amp; Evaluation<\/title>/);
  assert.doesNotMatch(html, /Xu Jianzhou|xyjianzhou|徐健洲|tel:|mailto:/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/portfolio\.shinonome\.xyz\/"/);
  for (const name of ["og:title", "og:description", "og:image", "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) assert.ok(html.includes('="' + name + '"'), name);
  assert.match(html, /<meta name="description" content="[^"]*东云/);
});

test("structured project list describes the current nine projects", () => {
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(data["@graph"].find(item => item["@type"] === "Person").name.includes("东云"));
  const list = data["@graph"].find(item => item["@type"] === "ItemList");
  assert.equal(list.numberOfItems, 9);
  assert.equal(list.itemListElement.length, 9);
  for (const [i, entry] of list.itemListElement.entries()) {
    assert.equal(entry.position, i + 1);
    assert.ok(entry.item.name);
    const url = new URL(entry.item.url);
    if (url.origin === "https://portfolio.shinonome.xyz" && url.hash) assert.ok(html.includes('id="' + url.hash.slice(1) + '"'));
  }
});

test("crawler files retain the established portfolio URL", async () => {
  const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
  assert.equal(robots, "User-agent: *\nAllow: /\nSitemap: https://portfolio.shinonome.xyz/sitemap.xml\n");
  assert.match(sitemap, /<loc>https:\/\/portfolio\.shinonome\.xyz\/<\/loc>/);
});

test("IDs are unique and all internal navigation targets exist", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
});

test("local resources exist and external new tabs are isolated", async () => {
  for (const path of new Set([...html.matchAll(/(?:src|poster)="(\.\/[^"#]+)"/g)].map(match => match[1]))) assert.ok((await stat(new URL("../" + path, import.meta.url))).isFile(), path);
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="[^"]*\b(?:noopener|noreferrer)\b/);
});

test("portal keeps static retro styling", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const script = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.doesNotMatch(html, /class="[^"]*\b(?:hero|reveal)\b/);
  assert.doesNotMatch(css, /border-radius|(?:linear|radial)-gradient|scale\(|translateY\(/);
  assert.doesNotMatch(script, /IntersectionObserver|requestAnimationFrame|data-filter/);
});
