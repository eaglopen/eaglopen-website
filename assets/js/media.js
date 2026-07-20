/* =====================================================
   EAGLOPEN — Media Center interactions
   Gallery filtering, photo lightbox, reserved video
   slots, and anchor-rail highlighting.
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ===== STICKY RAIL — offset beneath measured main header ===== */
  const mainHeader = document.querySelector(".main-header");
  const mediaRail = document.querySelector(".media-rail");
  const rootStyle = document.documentElement.style;

  const syncMediaRailOffsets = () => {
    if (mainHeader) {
      rootStyle.setProperty(
        "--media-rail-sticky-top",
        `${mainHeader.offsetHeight}px`
      );
    }
    if (mediaRail) {
      rootStyle.setProperty("--media-rail-height", `${mediaRail.offsetHeight}px`);
    }
  };

  syncMediaRailOffsets();

  if (typeof ResizeObserver !== "undefined") {
    const offsetObserver = new ResizeObserver(syncMediaRailOffsets);
    if (mainHeader) offsetObserver.observe(mainHeader);
    if (mediaRail) offsetObserver.observe(mediaRail);
  } else {
    window.addEventListener("resize", syncMediaRailOffsets);
  }

  const getMediaScrollOffset = () => {
    const headerHeight = mainHeader?.offsetHeight || 0;
    const railHeight = mediaRail?.offsetHeight || 0;
    return headerHeight + railHeight;
  };

  /* Capture-phase handlers so global smooth-scroll uses header + rail height */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener(
      "click",
      (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (!target || !document.getElementById("media-main")?.contains(target)) {
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        window.scrollTo({
          top: target.offsetTop - getMediaScrollOffset(),
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        history.replaceState(null, "", targetId);
      },
      true
    );
  });

  /* ===== GALLERY CATEGORY FILTERS ===== */
  const filterButtons = document.querySelectorAll(".media-filter");
  const photos = document.querySelectorAll("[data-gallery] .media-photo");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((other) => {
        const isActive = other === btn;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-pressed", String(isActive));
      });

      photos.forEach((photo) => {
        const matches =
          filter === "all" || photo.dataset.category === filter;
        photo.classList.toggle("is-hidden", !matches);
      });
    });
  });

  /* ===== PHOTO LIGHTBOX ===== */
  const lightbox = document.querySelector(".media-lightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxCaption = lightbox?.querySelector("figcaption");
  const lightboxClose = lightbox?.querySelector(".media-lightbox-close");
  let lastFocusedTrigger = null;

  const openLightbox = (img, captionText) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = captionText || img.alt || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    lightboxClose?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    const finish = () => {
      lightbox.hidden = true;
    };
    if (prefersReducedMotion) finish();
    else setTimeout(finish, 350);
    lastFocusedTrigger?.focus();
  };

  document.querySelectorAll(".media-photo-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const img = trigger.querySelector("img");
      if (!img) return;
      const caption = trigger
        .closest(".media-photo")
        ?.querySelector("figcaption")
        ?.textContent.trim();
      lastFocusedTrigger = trigger;
      openLightbox(img, caption);
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
  });

  /* ===== RESERVED VIDEO SLOTS =====
     Slots with .is-awaiting have no YouTube ID yet.
     Their play button politely explains instead of failing. */
  document.querySelectorAll(".yt-lite.is-awaiting").forEach((slot) => {
    const playBtn = slot.querySelector(".yt-lite-play");
    if (!playBtn) return;
    playBtn.setAttribute("aria-disabled", "true");
    playBtn.title = "Video coming soon";
    playBtn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true
    );
  });

  /* ===== ANCHOR RAIL — highlight the section in view ===== */
  const railLinks = document.querySelectorAll(".media-rail-track a[href^='#']");
  const sections = [];

  railLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) sections.push({ link, section });
  });

  if (sections.length && "IntersectionObserver" in window) {
    const railObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = sections.find((s) => s.section === entry.target);
          if (!match) return;
          if (entry.isIntersecting) {
            railLinks.forEach((l) => l.classList.remove("is-current"));
            match.link.classList.add("is-current");
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach(({ section }) => railObserver.observe(section));
  }
});

/*
 * Modified files (Media page navigation fix):
 * - assets/css/media.css
 * - assets/js/media.js
 */

// FABLE 5: I FINISHED THIS FILE
