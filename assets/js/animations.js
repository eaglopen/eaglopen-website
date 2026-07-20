document.addEventListener("DOMContentLoaded", () => {
  const easeExpo = "cubic-bezier(0.16, 1, 0.3, 1)";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ===== SCROLL REVEAL OBSERVER =====
  const animatedElements = document.querySelectorAll(
    ".fade-in, .slide-in-left, .slide-in-right, .reveal-up, .stagger-children"
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  animatedElements.forEach((el) => {
    const staggerParent = el.closest(".stagger-children");
    if (staggerParent && staggerParent !== el) return;
    revealObserver.observe(el);
  });

  // ===== SECTION TITLE UNDERLINE =====
  const sectionTitles = document.querySelectorAll(".section-title");
  const titleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("underline-visible");
          titleObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  sectionTitles.forEach((title) => titleObserver.observe(title));

  // ===== STAT COUNTER ANIMATION =====
  const counters = document.querySelectorAll("[data-count]");
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const prefix = el.dataset.prefix || "";
        const isDecimal = el.dataset.decimal === "true";
        const duration = prefersReducedMotion ? 0 : 1400;
        const start = performance.now();

        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target * eased;
          el.textContent =
            prefix +
            (isDecimal ? value.toFixed(1) : Math.floor(value)) +
            suffix;
          if (progress < 1) requestAnimationFrame(animate);
          else el.textContent = prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
        };

        if (prefersReducedMotion) {
          el.textContent = prefix + target + suffix;
        } else {
          requestAnimationFrame(animate);
        }
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((counter) => counterObserver.observe(counter));

  // ===== HERO PARALLAX DRIFT =====
  const heroSection = document.querySelector(".hero-section");
  const heroSlideImages = document.querySelectorAll(".hero-slide-img");

  if (heroSection && heroSlideImages.length && !prefersReducedMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const offset = window.scrollY * 0.025;
          heroSlideImages.forEach((img) => {
            img.style.transform = `translateY(${offset}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ===== HERO CTA CURSOR GLOW =====
  const heroCta = document.querySelector(".hero-cta-glow");
  if (heroCta && !prefersReducedMotion) {
    heroCta.addEventListener("mousemove", (e) => {
      const rect = heroCta.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      heroCta.style.setProperty("--glow-x", `${x}px`);
      heroCta.style.setProperty("--glow-y", `${y}px`);
    });
  }

  // ===== MOBILE MENU FUNCTIONALITY =====
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileNav = document.querySelector(".mobile-nav");
  const mobileNavClose = document.querySelector(".mobile-nav-close");
  const mobileNavOverlay = document.createElement("div");
  mobileNavOverlay.className = "mobile-nav-overlay";

  if (mobileNav) {
    mobileNav.parentNode.insertBefore(mobileNavOverlay, mobileNav.nextSibling);
  }

  function openMobileMenu() {
    mobileNav.classList.add("active");
    mobileMenuBtn.classList.add("active");
    document.body.classList.add("mobile-menu-open");
    mobileNavOverlay.style.display = "block";
    setTimeout(() => mobileNavClose?.focus(), 100);
  }

  function closeMobileMenu() {
    mobileNav.classList.remove("active");
    mobileMenuBtn.classList.remove("active");
    document.body.classList.remove("mobile-menu-open");
    mobileNavOverlay.style.display = "none";
    document.querySelectorAll(".mobile-nav .dropdown.active").forEach((dropdown) => {
      dropdown.classList.remove("active");
    });
  }

  function toggleMobileMenu() {
    mobileNav.classList.contains("active") ? closeMobileMenu() : openMobileMenu();
  }

  mobileMenuBtn?.addEventListener("click", toggleMobileMenu);
  mobileNavClose?.addEventListener("click", closeMobileMenu);
  mobileNavOverlay?.addEventListener("click", closeMobileMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav?.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  const mobileBreakpoint = window.matchMedia("(max-width: 1024px)");

  // Close the mobile menu (and release the scroll lock) when the
  // viewport grows past the mobile breakpoint.
  mobileBreakpoint.addEventListener("change", (e) => {
    if (!e.matches && mobileNav?.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  const mobileDropdowns = document.querySelectorAll(".mobile-nav .dropdown");

  mobileDropdowns.forEach((dropdown) => {
    const dropdownLink = dropdown.querySelector(":scope > a");
    dropdownLink?.addEventListener("click", (e) => {
      if (!mobileBreakpoint.matches) return;
      e.preventDefault();
      mobileDropdowns.forEach((other) => {
        if (other !== dropdown) other.classList.remove("active");
      });
      dropdown.classList.toggle("active");
    });
  });

  document.addEventListener("click", (e) => {
    if (!mobileBreakpoint.matches || !mobileNav?.classList.contains("active")) return;
    mobileDropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  });

  document.querySelectorAll(".mobile-nav a:not(.dropdown > a)").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  // ===== DESKTOP DROPDOWN — DISMISS ON ITEM CLICK =====
  const desktopDropdowns = document.querySelectorAll(".nav .dropdown");

  desktopDropdowns.forEach((dropdown) => {
    dropdown.querySelectorAll(".dropdown-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdown.classList.add("dropdown-dismissed");
      });
    });

    dropdown.addEventListener("mouseleave", () => {
      dropdown.classList.remove("dropdown-dismissed");
    });
  });

  mobileDropdowns.forEach((dropdown) => {
    dropdown.querySelectorAll(".dropdown-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdown.classList.remove("active");
      });
    });
  });

  // ===== BACK TO TOP BUTTON =====
  const backToTopBtn = document.createElement("button");
  backToTopBtn.className = "back-to-top";
  backToTopBtn.innerHTML = "↑";
  backToTopBtn.setAttribute("aria-label", "Back to top");
  document.body.appendChild(backToTopBtn);

  window.addEventListener("scroll", () => {
    backToTopBtn.classList.toggle("visible", window.pageYOffset > 300);
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  // ===== ACTIVE NAVIGATION HIGHLIGHTING =====
  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav a, .mobile-nav a").forEach((link) => {
    try {
      const linkPath = new URL(link.href).pathname;
      if (
        linkPath === currentPath ||
        (currentPath.endsWith("/") && link.href.includes("index.html")) ||
        (currentPath.endsWith("windsurf2trial") && link.href.includes("index.html"))
      ) {
        link.classList.add("active");
      }
    } catch (_) {
      /* ignore invalid hrefs */
    }
  });

  // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId === "#") return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = document.querySelector(".main-header")?.offsetHeight || 0;
        window.scrollTo({
          top: targetElement.offsetTop - headerHeight,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    });
  });
});
