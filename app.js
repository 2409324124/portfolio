const localTime = document.querySelector("#local-time");

function updateLocalTime() {
  if (!localTime) return;
  localTime.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

updateLocalTime();
window.setInterval(updateLocalTime, 30_000);

const projectVideos = [...document.querySelectorAll("video[data-project-video]")];

for (const video of projectVideos) {
  video.addEventListener("play", () => {
    for (const other of projectVideos) {
      if (other !== video) other.pause();
    }
  });

  const showError = () => {
    const status = document.querySelector(`#${video.id}-error`);
    if (!status) return;
    status.textContent = "视频暂时无法加载，请使用下方链接直接打开或稍后重试。";
    status.hidden = false;
  };
  video.addEventListener("error", showError);
  for (const source of video.querySelectorAll("source")) {
    source.addEventListener("error", showError);
  }
  video.addEventListener("loadeddata", () => {
    const status = document.querySelector(`#${video.id}-error`);
    if (status) status.hidden = true;
  });
}

for (const gallery of document.querySelectorAll("[data-scene-gallery]")) {
  const slides = [...gallery.querySelectorAll("[data-gallery-slide]")];
  const previous = gallery.querySelector("[data-gallery-prev]");
  const next = gallery.querySelector("[data-gallery-next]");
  const toggle = gallery.querySelector("[data-gallery-toggle]");
  const position = gallery.querySelector("[data-gallery-position]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0;
  let hovered = false;
  let paused = false;
  let interval = null;

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
    position.textContent = `${index + 1} / ${slides.length}`;
  }

  function stop() {
    if (interval !== null) window.clearInterval(interval);
    interval = null;
  }

  function start() {
    stop();
    if (!hovered || paused || !finePointer.matches || reducedMotion.matches || document.hidden || slides.length < 2) return;
    interval = window.setInterval(() => show(index + 1), 2000);
  }

  function setPaused(value) {
    paused = value;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.textContent = paused ? "继续轮换" : "暂停轮换";
    if (paused) stop();
  }

  show(0);
  gallery.addEventListener("mouseenter", () => {
    hovered = true;
    if (!gallery.contains(document.activeElement)) start();
  });
  gallery.addEventListener("mouseleave", () => {
    hovered = false;
    stop();
    if (!gallery.contains(document.activeElement)) show(0);
  });
  gallery.addEventListener("focusin", stop);
  gallery.addEventListener("reset-gallery", () => {
    stop();
    hovered = false;
    show(0);
  });
  previous.addEventListener("click", () => { setPaused(true); show(index - 1); });
  next.addEventListener("click", () => { setPaused(true); show(index + 1); });
  toggle.addEventListener("click", () => { setPaused(!paused); if (!paused) start(); });
  finePointer.addEventListener("change", stop);
  reducedMotion.addEventListener("change", stop);
  document.addEventListener("visibilitychange", stop);
}

for (const group of document.querySelectorAll("[data-media-tabs]")) {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = [...group.querySelectorAll('[role="tabpanel"]')];

  function select(index) {
    tabs.forEach((tab, tabIndex) => {
      tab.setAttribute("aria-selected", String(tabIndex === index));
      tab.tabIndex = tabIndex === index ? 0 : -1;
    });
    for (const panel of panels) {
      panel.hidden = panel.id !== tabs[index].getAttribute("aria-controls");
      if (panel.hidden) {
        for (const video of panel.querySelectorAll("video")) video.pause();
        for (const gallery of panel.querySelectorAll("[data-scene-gallery]")) {
          gallery.dispatchEvent(new Event("reset-gallery"));
        }
      }
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next);
      tabs[next].focus();
    });
  });
}
