const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealItems = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  revealItems.forEach((item) => observer.observe(item));
}

const filters = document.querySelectorAll("[data-filter]");
const projects = document.querySelectorAll("[data-category]");
const emptyFilter = document.querySelector(".empty-filter");

for (const button of filters) {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;
    let visibleCount = 0;
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    projects.forEach((project) => {
      const visible = selected === "all" || project.dataset.category === selected;
      project.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    emptyFilter.hidden = visibleCount !== 0;
  });
}

if (!reduceMotion) {
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY * 0.08, 72);
        document.documentElement.style.setProperty("--blueprint-y", `${offset}px`);
        ticking = false;
      });
    },
    { passive: true },
  );
}
