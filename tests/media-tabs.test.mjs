import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const script = await readFile(new URL("../app.js", import.meta.url), "utf8");

function setup() {
  const listeners = new Map();
  const buttons = [0, 1].map(index => ({
    attrs: { "aria-controls": ["process-panel", "scenes-panel"][index], "aria-selected": String(index === 0) },
    tabIndex: index === 0 ? 0 : -1,
    getAttribute(name) { return this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, fn) { listeners.set(`${index}:${name}`, fn); },
    focus() { focused = index; },
  }));
  let focused = -1;
  const player = { paused: false, pause() { this.paused = true; } };
  const gallery = { reset: false, dispatchEvent(e) { if (e.type === "reset-gallery") this.reset = true; } };
  const panels = [0, 1].map(index => ({
    id: ["process-panel", "scenes-panel"][index], hidden: index !== 0,
    querySelectorAll(selector) { return selector === "video" ? (index === 0 ? [player] : []) : (index === 1 ? [gallery] : []); },
  }));
  const group = { querySelectorAll(selector) { return selector === '[role="tab"]' ? buttons : panels; } };
  const document = {
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === "[data-media-tabs]" ? [group] : []; },
  };
  vm.runInNewContext(script, { document, window: { setInterval() {} }, Event: class { constructor(type) { this.type = type; } } });
  const fire = (index, event, key) => { let prevented = false; listeners.get(`${index}:${event}`)?.({ key, preventDefault() { prevented = true; } }); return prevented; };
  return { buttons, panels, player, gallery, fire, focused: () => focused };
}

test("media tabs expose only the selected panel and pause hidden video", () => {
  const s = setup();
  s.fire(1, "click");
  assert.equal(s.panels[0].hidden, true);
  assert.equal(s.panels[1].hidden, false);
  assert.equal(s.player.paused, true);
  assert.equal(s.buttons[1].attrs["aria-selected"], "true");
  assert.equal(s.buttons[0].tabIndex, -1);
  s.fire(0, "click");
  assert.equal(s.panels[0].hidden, false);
  assert.equal(s.panels[1].hidden, true);
  assert.equal(s.gallery.reset, true);
});

test("media tabs support arrow, home and end keys with roving focus", () => {
  const s = setup();
  assert.equal(s.fire(0, "keydown", "ArrowRight"), true);
  assert.equal(s.focused(), 1);
  assert.equal(s.panels[1].hidden, false);
  s.fire(1, "keydown", "ArrowRight");
  assert.equal(s.focused(), 0);
  s.fire(0, "keydown", "End");
  assert.equal(s.focused(), 1);
  s.fire(1, "keydown", "Home");
  assert.equal(s.focused(), 0);
  assert.equal(s.fire(0, "keydown", "Tab"), false);
});

test("modeling clip retains native aspect ratio and is the default media tab", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="modeling-video"[^>]*width="1568"[^>]*height="1080"/);
  assert.match(html, /id="process-tab"[^>]*aria-selected="true"/);
  assert.match(html, /id="scenes-panel"[^>]*hidden/);
  assert.match(html, /RIVET｜场景分阶段构建/);
});
