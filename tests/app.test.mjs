import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const script = await readFile(new URL("../app.js", import.meta.url), "utf8");

function node(extra = {}) {
  const listeners = new Map();
  return { hidden: false, textContent: "", attributes: {}, ...extra,
    addEventListener(event, callback) { listeners.set(event, callback); },
    dispatch(event) { listeners.get(event)?.(); },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

function setup({ fine = true, reduced = false, gallery = true, videos = true, clock = true } = {}) {
  const timers = new Map();
  let timerId = 0;
  const mediaQueries = new Map();
  const time = clock ? node() : null;
  const errors = new Map();
  const players = videos ? ["render-video", "api-video"].map(id => {
    errors.set("#" + id + "-error", node({ hidden: true }));
    const source = node();
    return node({ id, source, querySelectorAll() { return [source]; }, paused: true, pauseCalls: 0, pause() { this.paused = true; this.pauseCalls++; } });
  }) : [];
  const slides = [node(), node({ hidden: true }), node({ hidden: true })];
  const prev = node(), next = node(), toggle = node(), position = node();
  const controls = { "[data-gallery-prev]": prev, "[data-gallery-next]": next, "[data-gallery-toggle]": toggle, "[data-gallery-position]": position };
  const group = node({
    querySelector(selector) { return controls[selector] ?? null; },
    querySelectorAll(selector) { return selector === "[data-gallery-slide]" ? slides : []; },
    contains(element) { return element === group || Object.values(controls).includes(element); },
  });
  const document = node({
    hidden: false, activeElement: null,
    querySelector(selector) { return selector === "#local-time" ? time : errors.get(selector) ?? null; },
    querySelectorAll(selector) {
      if (selector === "video[data-project-video]") return players;
      if (selector === "[data-scene-gallery]") return gallery ? [group] : [];
      return [];
    },
  });
  const window = {
    setInterval(callback, delay) { timers.set(++timerId, { callback, delay }); return timerId; },
    clearInterval(id) { timers.delete(id); },
    matchMedia(query) {
      if (!mediaQueries.has(query)) mediaQueries.set(query, node({ matches: query.includes("reduced-motion") ? reduced : fine }));
      return mediaQueries.get(query);
    },
  };
  vm.runInNewContext(script, { document, window });
  const rotations = () => [...timers.values()].filter(timer => timer.delay === 2000);
  return { time, timers, players, errors, document, window, slides, prev, next, toggle, position, group, rotations, mediaQueries };
}

test("clock renders immediately and refreshes every thirty seconds", () => {
  const { time, timers } = setup();
  assert.match(time.textContent, /^\d{2}:\d{2}$/);
  const clock = [...timers.values()].find(timer => timer.delay === 30_000);
  assert.ok(clock);
  time.textContent = "";
  clock.callback();
  assert.match(time.textContent, /^\d{2}:\d{2}$/);
});

test("play pauses other videos but never starts autoplay", () => {
  const { players: [render, api] } = setup();
  assert.equal(render.pauseCalls, 0);
  assert.equal(api.pauseCalls, 0);
  render.dispatch("play");
  assert.equal(render.pauseCalls, 0);
  assert.equal(api.pauseCalls, 1);
  api.dispatch("play");
  assert.equal(render.pauseCalls, 1);
});

test("a media error reveals only its own accessible status", () => {
  const { players, errors } = setup();
  players[1].dispatch("error");
  assert.equal(errors.get("#api-video-error").hidden, false);
  assert.ok(errors.get("#api-video-error").textContent.length);
  assert.equal(errors.get("#render-video-error").hidden, true);
});

test("source failures are caught without bubbling, and a successful retry clears status", () => {
  const { players, errors } = setup();
  players[0].source.dispatch("error");
  assert.equal(errors.get("#render-video-error").hidden, false);
  players[0].dispatch("loadeddata");
  assert.equal(errors.get("#render-video-error").hidden, true);
});

test("optional clock, video, and gallery absence is harmless", () => {
  assert.doesNotThrow(() => setup({ videos: false, gallery: false, clock: false }));
});

test("gallery rotates only while hovered and resets on leave", () => {
  const state = setup();
  assert.equal(state.rotations().length, 0);
  state.group.dispatch("mouseenter");
  state.group.dispatch("mouseenter");
  assert.equal(state.rotations().length, 1);
  state.rotations()[0].callback();
  assert.equal(state.slides[1].hidden, false);
  assert.equal(state.slides[0].hidden, true);
  assert.equal(state.position.textContent, "2 / 3");
  state.group.dispatch("mouseleave");
  assert.equal(state.rotations().length, 0);
  assert.equal(state.slides[0].hidden, false);
});

test("gallery stays manual on touch and with reduced motion", () => {
  for (const options of [{ fine: false }, { reduced: true }]) {
    const state = setup(options);
    state.group.dispatch("mouseenter");
    assert.equal(state.rotations().length, 0);
    state.next.dispatch("click");
    assert.equal(state.slides[1].hidden, false);
    state.prev.dispatch("click");
    assert.equal(state.slides[0].hidden, false);
    state.prev.dispatch("click");
    assert.equal(state.slides[2].hidden, false);
  }
});

test("manual focus pauses rotation and pointer leave preserves keyboard position", () => {
  const state = setup();
  state.group.dispatch("mouseenter");
  state.document.activeElement = state.next;
  state.group.dispatch("focusin");
  assert.equal(state.rotations().length, 0);
  state.next.dispatch("click");
  state.group.dispatch("mouseleave");
  assert.equal(state.slides[1].hidden, false);
});

test("pointer entry cannot restart rotation while keyboard focus is already in the gallery", () => {
  const state = setup();
  state.document.activeElement = state.next;
  state.group.dispatch("focusin");
  state.group.dispatch("mouseenter");
  assert.equal(state.rotations().length, 0);
});

test("pause toggle stops and resumes hover rotation, hidden tabs stop it", () => {
  const state = setup();
  state.group.dispatch("mouseenter");
  state.toggle.dispatch("click");
  assert.equal(state.rotations().length, 0);
  assert.equal(state.toggle.attributes["aria-pressed"], "true");
  state.toggle.dispatch("click");
  assert.equal(state.rotations().length, 1);
  assert.equal(state.toggle.attributes["aria-pressed"], "false");
  state.document.hidden = true;
  state.document.dispatch("visibilitychange");
  assert.equal(state.rotations().length, 0);
});

test("enabling reduced motion stops an already running gallery", () => {
  const state = setup();
  state.group.dispatch("mouseenter");
  const preference = state.window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.matches = true;
  preference.dispatch("change");
  assert.equal(state.rotations().length, 0);
});
