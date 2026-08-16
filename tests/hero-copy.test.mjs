import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const visibleCopy = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");

test("archive publishes complete canonical and social metadata", () => {
  assert.match(html, /<title>Projects — Shinonome Network<\/title>/);
  assert.match(html, /<meta name="description" content="Projects by Xu Jianzhou/);
  assert.match(html, /<link rel="canonical" href="https:\/\/portfolio\.shinonome\.xyz\/" \/>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/portfolio\.shinonome\.xyz\/assets\/shinonome-network-og\.png" \/>/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.match(html, /<script type="application\/ld\+json">/);

  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(description.length >= 120 && description.length <= 160);
  const jsonLd = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  assert.deepEqual(
    new Set(jsonLd["@graph"].map((entry) => entry["@type"])),
    new Set(["CollectionPage", "Person", "ItemList"]),
  );
  const itemList = jsonLd["@graph"].find((entry) => entry["@type"] === "ItemList");
  const xeonReport = itemList.itemListElement.find(
    (entry) => entry.item.name === "Xeon Max 9470C Benchmarks",
  );
  assert.equal(
    xeonReport.item.url,
    "https://2409324124.github.io/xeon-max-9470c-benchmarks/report/",
  );
});

test("archive publishes crawler files for its real canonical page", async () => {
  const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");

  assert.equal(
    robots,
    "User-agent: *\nAllow: /\nSitemap: https://portfolio.shinonome.xyz/sitemap.xml\n",
  );
  assert.match(sitemap, /<loc>https:\/\/portfolio\.shinonome\.xyz\/<\/loc>/);
  assert.doesNotMatch(sitemap, /#(?:projects|about|links)/);
});

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

test("live-system screenshots use responsive modern sources without changing the PNG fallback", () => {
  assert.match(html, /<source[^>]+cat-psych-live-720\.webp[^>]*>/);
  assert.match(html, /<source[^>]+programming-runtime-720\.webp[^>]*>/);
  assert.match(html, /<source[^>]+preploop-live-720\.webp[^>]*>/);
  assert.match(html, /cat-psych-live\.png[^>]+fetchpriority="high"/);
  assert.match(html, /programming-runtime\.png[^>]+loading="lazy"/);
  assert.match(html, /preploop-live\.png[^>]+loading="lazy"/);
});
