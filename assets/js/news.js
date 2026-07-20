/* ============================================================
   NEWS PAGE — EAGLOPEN NEWSROOM INTERACTIONS
   Handles: masthead date, category filtering, research
   progress bars, archive tabs, FAQ accordion, and the
   newsletter form (client-side only, ready for integration).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ===== MASTHEAD LIVE DATE =====
  const dateEl = document.querySelector("[data-newsroom-date]");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // ===== CATEGORY FILTERING =====
  const filterButtons = document.querySelectorAll(".news-filter-btn");
  const newsCards = document.querySelectorAll(".news-card[data-category]");
  const emptyState = document.querySelector(".news-feed-empty");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((btn) =>
        btn.setAttribute("aria-pressed", String(btn === button))
      );

      let visibleCount = 0;
      newsCards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !matches);
        if (matches) visibleCount += 1;
      });

      emptyState?.classList.toggle("is-visible", visibleCount === 0);
    });
  });

  // ===== RESEARCH PROGRESS BARS =====
  const progressBars = document.querySelectorAll(".research-progress-bar[data-progress]");
  if (progressBars.length) {
    const progressObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const bar = entry.target;
          const value = Math.min(Math.max(parseInt(bar.dataset.progress, 10) || 0, 0), 100);
          requestAnimationFrame(() => {
            bar.style.width = value + "%";
          });
          progressObserver.unobserve(bar);
        });
      },
      { threshold: 0.4 }
    );
    progressBars.forEach((bar) => progressObserver.observe(bar));
  }

  // ===== ARCHIVE TABS =====
  const archiveTabs = document.querySelectorAll(".archive-tab");
  const archivePanels = document.querySelectorAll(".archive-panel");

  archiveTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      archiveTabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.setAttribute("tabindex", selected ? "0" : "-1");
      });
      archivePanels.forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
    });

    tab.addEventListener("keydown", (e) => {
      const tabs = Array.from(archiveTabs);
      const index = tabs.indexOf(tab);
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (next) {
        e.preventDefault();
        next.focus();
        next.click();
      }
    });
  });

  // ===== FAQ ACCORDION =====
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Close any other open item for a tidy single-open accordion
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          other.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
          const otherAnswer = other.querySelector(".faq-answer");
          if (otherAnswer) otherAnswer.style.maxHeight = "0px";
        }
      });

      item.classList.toggle("is-open", !isOpen);
      question.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : "0px";
    });
  });

  // ===== NEWSLETTER FORM (ready for future integration) =====
  const newsletterForm = document.querySelector(".newsletter-form");
  const newsletterFeedback = document.querySelector(".newsletter-feedback");

  newsletterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput?.value.trim() || "";
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!newsletterFeedback) return;
    newsletterFeedback.classList.remove("is-error", "is-success");

    if (!isValid) {
      newsletterFeedback.textContent = "Please enter a valid email address.";
      newsletterFeedback.classList.add("is-error");
      emailInput?.focus();
      return;
    }

    // Placeholder success state — connect to a real service later.
    newsletterFeedback.textContent =
      "Thank you for subscribing! You will hear from us when the newsletter launches.";
    newsletterFeedback.classList.add("is-success");
    newsletterForm.reset();
  });

  // ===== HERO ENTRANCE =====
  if (!prefersReducedMotion) {
    document.querySelector(".news-hero")?.classList.add("is-loaded");
  }

  // ===== HIGHLIGHT IMAGE SLIDERS (ADIF / IEA program sections) =====
  if (!prefersReducedMotion) {
    document.querySelectorAll(".highlight-image-slider").forEach((slider) => {
      const slides = slider.querySelectorAll(".highlight-slide");
      if (!slides.length) return;
      let current = 0;
      setInterval(() => {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
      }, 5000);
    });
  }
});

// FABLE 5: I FINISHED THIS FILE
