/**
 * Hero Engine Badge — live workspace widget for research hero corner.
 * Rotating phrases with text scramble, status cycling, and activity metrics.
 */
(() => {
  "use strict";

  const PHRASES = [
    "Building Intelligent Systems",
    "AI Research",
    "Full Stack Development",
    "Machine Learning",
    "Computer Vision",
    "Robotics Engineering",
    "Embedded Systems",
    "Data Science",
    "Cloud Computing",
    "Innovation",
    "Engineering the Future",
    "Designing Tomorrow",
    "Research • Build • Deploy",
  ];

  const STATUS_LINES = [
    "Initializing AI...",
    "Neural network loading...",
    "Model training...",
    "Live compiling...",
    "Deploying pipeline...",
    "git commit · research/main",
    "Inference active",
    "Syncing datasets...",
    "Benchmark running...",
  ];

  const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789•/<>_";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  class TextScramble {
    constructor(el) {
      this.el = el;
    }

    setText(text) {
      return new Promise((resolve) => {
        if (prefersReducedMotion) {
          this.el.textContent = text;
          resolve();
          return;
        }

        const oldText = this.el.textContent;
        const length = Math.max(text.length, oldText.length);
        let frame = 0;
        const totalFrames = 18;

        this.el.classList.add("is-scrambling");

        const tick = () => {
          let output = "";

          for (let i = 0; i < length; i++) {
            if (text[i] === undefined) continue;

            if (text[i] === " ") {
              output += " ";
              continue;
            }

            if (text[i] === "•") {
              output += frame > totalFrames * 0.6 ? "•" : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
              continue;
            }

            if (frame / totalFrames > i / length) {
              output += text[i];
            } else {
              output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
          }

          this.el.textContent = output;
          frame++;

          if (frame <= totalFrames) {
            requestAnimationFrame(tick);
          } else {
            this.el.textContent = text;
            this.el.classList.remove("is-scrambling");
            this.el.classList.add("is-entering");
            window.setTimeout(() => this.el.classList.remove("is-entering"), 600);
            resolve();
          }
        };

        requestAnimationFrame(tick);
      });
    }
  }

  function initHeroEngineBadge(root) {
    const phraseEl = root.querySelector("[data-heb-phrase]");
    const statusEl = root.querySelector("[data-heb-status]");
    const cpuBar = root.querySelector("[data-heb-cpu]");
    const memBar = root.querySelector("[data-heb-mem]");

    if (!phraseEl) return;

    const scrambler = new TextScramble(phraseEl);
    let phraseIndex = 0;
    let statusIndex = 0;
    let phraseTimer = null;
    let statusTimer = null;
    let metricsTimer = null;

    const rotatePhrase = async () => {
      phraseIndex = (phraseIndex + 1) % PHRASES.length;
      await scrambler.setText(PHRASES[phraseIndex]);
    };

    const rotateStatus = () => {
      if (!statusEl) return;
      statusEl.classList.add("is-fading");

      window.setTimeout(() => {
        statusIndex = (statusIndex + 1) % STATUS_LINES.length;
        statusEl.textContent = STATUS_LINES[statusIndex];
        statusEl.classList.remove("is-fading");
      }, 280);
    };

    const updateMetrics = () => {
      if (cpuBar) {
        cpuBar.style.setProperty("--heb-load", `${30 + Math.floor(Math.random() * 55)}%`);
      }
      if (memBar) {
        memBar.style.setProperty("--heb-load", `${20 + Math.floor(Math.random() * 60)}%`);
      }
    };

    const start = async () => {
      phraseEl.textContent = PHRASES[0];
      if (statusEl) statusEl.textContent = STATUS_LINES[0];
      updateMetrics();

      if (prefersReducedMotion) return;

      phraseTimer = window.setInterval(rotatePhrase, 3800);
      statusTimer = window.setInterval(rotateStatus, 2600);
      metricsTimer = window.setInterval(updateMetrics, 1800);
    };

    start();

    return () => {
      if (phraseTimer) window.clearInterval(phraseTimer);
      if (statusTimer) window.clearInterval(statusTimer);
      if (metricsTimer) window.clearInterval(metricsTimer);
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".hero-engine-badge").forEach(initHeroEngineBadge);
  });
})();
